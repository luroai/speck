// speck ship: the user's gate, merging an approved ticket into the base branch (or --auto, when config allows it).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SpeckError, sh, git, findRepoRoot, loadConfig, findTicket, placeTicket, writeField, isAncestor, worktreeList } from './core.mjs';
import { rounds, nextAction } from './review.mjs';
import { testRun } from './results.mjs';

// ---------- ship (the user's gate: merge an approved ticket locally) ----------

function ticketBranch(repo, cfg, id) {
  const pad = String(id).padStart(4, '0');
  const names = git(['for-each-ref', '--format=%(refname:short)', `refs/heads/${cfg.branch_prefix}${pad}-*`], repo).split('\n').filter(Boolean);
  if (names.length !== 1) throw new SpeckError(names.length
    ? `Found ${names.length} branches for ticket ${pad} (${names.join(', ')}). Delete the extra ones, then run this again.`
    : `No branch called ${cfg.branch_prefix}${pad}-… found. Has the ticket been built?`);
  return names[0];
}

// Every reason not to ship, checked with the ticket branch checked out and before anything changes.
function shipChecks(repo, cfg, pad, branch) {
  const t = findTicket(repo, pad);
  if (t.fm.status !== 'approved')
    throw new SpeckError(`Ticket ${pad} is "${t.fm.status}" on ${branch}, not "approved". Only a ticket the reviewer approved can be shipped.`);
  const all = rounds(repo, pad);
  const next = nextAction(all, cfg);
  if (next.action !== 'ship')
    throw new SpeckError(`The review loop says "${next.action}", not "ship"${next.reason ? `: ${next.reason}` : ''}. Finish the review first.`);
  const reviewed = all[all.length - 1].meta.reviewed_sha;
  if (!reviewed || sh('git', ['merge-base', '--is-ancestor', reviewed, branch], { cwd: repo }).status !== 0)
    throw new SpeckError(`The reviewer's approved commit isn't on ${branch}. Run the review again.`);
  // Every commit since the approval, not just the end result, so a change that was later reverted still counts.
  const changed = [...new Set(git(['log', '-m', '--name-only', '--format=', `${reviewed}..${branch}`], repo)
    .split('\n').filter(f => f && !f.startsWith('speck/')))];
  if (changed.length)
    throw new SpeckError(`These files changed after the reviewer approved: ${changed.join(', ')}. Run the review again so the reviewer sees them.`);
}

function runTests(repo, cfg) {
  const cmd = (cfg.commands?.test || '').trim();
  if (!cmd) throw new SpeckError('No test command is set, so speck can\'t check the tests pass before shipping. Set commands.test in speck/config.yml (for example `npm test`), commit it, then run this again.');
  // The run takes a turn, as `speck test` does, so ships and builds don't all run the suite at once. A passing result
  // recorded for the same code is reused, but never a failure (0112).
  return testRun(repo, cfg, cmd, { reuse: 'pass', onStart: () => console.log(`Running tests: ${cmd}`) }).status === 0;
}

// The refusal for tests that failed on the ticket branch. It runs the tests on the base branch as it is, in a
// temporary worktree it removes afterwards, so a broken base branch isn't blamed on the ticket.
function testFailure(repo, cfg, base, sha) {
  const failed = 'Tests failed on the approved branch, so nothing was shipped.';
  const at = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-base-')), 'base');
  console.log(`Checking whether ${base}'s own tests pass, in a temporary worktree at ${at}.`);
  let admin = null; // git's own record of the temporary worktree
  try {
    const added = sh('git', ['worktree', 'add', '-q', '--detach', at, sha], { cwd: repo });
    if (added.status !== 0) return new SpeckError(`${failed} Couldn't check ${base}'s own tests (${added.stderr.trim().split('\n').pop()}).`);
    admin = path.resolve(at, git(['rev-parse', '--git-dir'], at).trim());
    const setup = String(cfg.worktree_setup || '').trim();
    if (setup) {
      console.log(`Running worktree_setup in the temporary worktree: ${setup}`);
      const r = sh('sh', ['-c', setup], { cwd: at });
      if (r.status !== 0) return new SpeckError(`${failed} Couldn't check ${base}'s own tests: worktree_setup (${setup}) failed with exit ${r.status} there.`);
    }
    if (runTests(at, cfg)) return new SpeckError(`${failed} ${base}'s tests pass, so the failure comes from this ticket's change.`);
    return new SpeckError(`Tests failed on the approved branch, and ${base}'s own tests are failing too, so this isn't the ticket's fault. Nothing was shipped. Fix ${base}, then ship again.`, 14);
  } finally {
    // Only this worktree's record goes: a repo-wide prune would also drop other worktrees whose folders are missing.
    const removed = sh('git', ['worktree', 'remove', '--force', at], { cwd: repo });
    fs.rmSync(path.dirname(at), { recursive: true, force: true });
    if (removed.status !== 0 && admin) fs.rmSync(admin, { recursive: true, force: true });
  }
}

// Checks the remote's base branch before anything changes. Returns the commit to fast-forward the local base to, if any.
function remoteBaseCatchUp(repo, remote, base) {
  if (!remote) return null;
  const fetched = sh('git', ['fetch', '-q', remote, base], { cwd: repo });
  if (fetched.status !== 0) {
    console.log(`Couldn't reach ${remote} to check for new commits on ${base} (${fetched.stderr.trim().split('\n').pop()}). Carrying on with your local ${base}.`);
    return null;
  }
  const theirs = git(['rev-parse', 'FETCH_HEAD'], repo).trim();
  const ours = git(['rev-parse', base], repo).trim();
  if (isAncestor(repo, theirs, ours)) return null; // up to date, or only ahead
  if (isAncestor(repo, ours, theirs)) {
    console.log(`${remote} has new commits on ${base}: bringing your ${base} up to date before merging.`);
    return theirs;
  }
  throw new SpeckError(`Your ${base} and ${remote}'s ${base} each have commits the other doesn't, so nothing was shipped. Combine them with \`git checkout ${base} && git pull\`, then ship again.`);
}

// Where shipping happens. The ticket-branch steps run where the branch is checked out (or in this folder if it
// isn't checked out anywhere, as before worktrees). The merge runs where the base branch is checked out, or in
// that same folder if it isn't checked out anywhere. `linked` is the ticket's own worktree, removed after shipping.
function shipFolders(repo, branch, base) {
  const list = worktreeList(repo);
  const main = list[0].path;
  const at = b => list.find(w => w.branch === b)?.path || null;
  const branchAt = at(branch), baseAt = at(base);
  const work = branchAt || fs.realpathSync(repo);
  return { main, work, mergeAt: baseAt || work, linked: branchAt && branchAt !== main ? branchAt : null };
}

// Each tracked file with uncommitted changes, staged or not: its paths (a rename or copy has two, `from` first), its
// name as git shows it, and whether the change is staged. --no-optional-locks keeps git status from rewriting the
// index, so checking again and again while ship waits never gets in the way of your own `git commit`.
function changes(dir) {
  const parts = git(['--no-optional-locks', 'status', '--porcelain', '-z', '--untracked-files=no'], dir).split('\0');
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    if (!parts[i]) continue;
    const xy = parts[i].slice(0, 2), paths = [parts[i].slice(3)];
    if (/[RC]/.test(xy)) paths.unshift(parts[++i]);
    out.push({ paths, name: paths.join(' -> '), staged: xy[0] !== ' ' });
  }
  return out;
}

// How long ship waits for staged changes in the base checkout to clear (0115). SPECK_SHIP_MINUTE_MS and
// SPECK_SHIP_POLL_MS shorten a minute and the time between checks, for speck's own tests.
const POLL_MS = 2000;
const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const envMs = (name, fallback) => Number(process.env[name]) > 0 ? Number(process.env[name]) : fallback;

export function shipWaitMinutes(cfg) {
  const n = cfg.ship_wait_minutes ?? 30;
  if (!Number.isInteger(n) || n < 1)
    throw new SpeckError(`ship_wait_minutes in speck/config.yml must be a whole number of 1 or more (got ${JSON.stringify(n)}). Fix it with \`speck config set ship_wait_minutes 30\`, then run this again.`);
  return n;
}

// The files git lists, one per line and indented, after the line that says why it refused.
function listedIn(r, why) {
  const lines = r.stderr.split('\n');
  const at = lines.findIndex(l => l.includes(why));
  if (at < 0) return [];
  const files = [];
  for (const l of lines.slice(at + 1)) { if (!/^\s+\S/.test(l)) break; files.push(l.trim()); }
  return files;
}

export function shipTicket(repo, id) {
  const cfg = loadConfig(repo);
  const pad = String(id).padStart(4, '0');
  const base = cfg.base_branch;
  const branch = ticketBranch(repo, cfg, pad);
  const waitMinutes = shipWaitMinutes(cfg);
  const { main, work, mergeAt, linked } = shipFolders(repo, branch, base);
  const here = fs.realpathSync(repo);
  if (!fs.existsSync(work))
    throw new SpeckError(`${branch} is checked out in a worktree at ${work}, but that folder is missing. Run \`git worktree prune\` so git forgets it, then ship again.`);
  if (git(['status', '--porcelain'], work).trim())
    throw new SpeckError(work === here
      ? 'You have uncommitted or untracked changes. Commit or remove them so the working tree is clean, then run this again.'
      : `The ticket's worktree at ${work} has uncommitted or untracked changes. Commit or remove them there, then run this again.`);
  // Uncommitted edits in the base checkout can stay through the merge, so you can keep working there while
  // builds ship, unless they're staged (git won't merge over a changed index) or in a file the ticket changes.
  // When staged files are all that's in the way, it waits for them to be committed or unstaged, up to
  // ship_wait_minutes in all, changing nothing meanwhile.
  let waitLeft = waitMinutes * envMs('SPECK_SHIP_MINUTE_MS', 60000), told = false;
  const clash = when => {
    // Without a worktree, the ship runs in this folder, which was clean before the tests, so any change at all stops it.
    if (mergeAt === work) {
      const changed = changes(work).map(c => c.name);
      if (changed.length) throw new SpeckError(`These files in ${work} have uncommitted changes${when}: ${changed.join(', ')}. Nothing was shipped and they're untouched. Commit or stash them, then ship again.`);
      return;
    }
    // Raw paths, as changes() reads them: without -z, git quotes names with unusual characters.
    const touched = new Set(git(['diff', '--name-only', '-z', `${base}...${branch}`], repo).split('\0').filter(Boolean));
    const clashes = c => c.paths.some(f => touched.has(f));
    const inWay = () => changes(mergeAt).filter(c => c.staged || clashes(c));
    const stagedOnly = files => files.length && !files.some(clashes);
    let files = inWay();
    if (stagedOnly(files) && waitLeft > 0) {
      // Said once per ship, even if the tests stage something else after an earlier wait.
      if (!told) console.log(`These files in ${mergeAt}, where ${base} is checked out, are staged${when}: ${files.map(c => c.name).join(', ')}. git won't merge over staged changes, so speck ship is waiting up to ${waitMinutes} minutes for them to be committed or unstaged.`);
      told = true;
      const poll = envMs('SPECK_SHIP_POLL_MS', POLL_MS);
      const until = Date.now() + waitLeft;
      while (stagedOnly(files) && Date.now() < until) {
        sleep(Math.min(poll, until - Date.now()));
        files = inWay();
      }
      waitLeft = until - Date.now();
    }
    if (files.length) {
      const why = files.map(c => c.staged ? `${c.name} (staged)` : `${c.name} (the ticket changes it too)`);
      throw new SpeckError(`These files in ${mergeAt}, where ${base} is checked out, have uncommitted changes${when} that stop the merge: ${why.join(', ')}. Nothing was shipped and they're untouched. Commit or stash them (git won't merge over staged changes, even in other files), then ship again.`);
    }
  };
  clash('');
  const remote = sh('git', ['config', `branch.${base}.remote`], { cwd: repo }).stdout.trim();
  const catchUp = remoteBaseCatchUp(repo, remote, base);
  const start = git(['branch', '--show-current'], work).trim() || git(['rev-parse', 'HEAD'], work).trim();
  const branchSha = git(['rev-parse', branch], repo).trim();
  let baseSha = git(['rev-parse', base], repo).trim();
  git(['checkout', '-q', branch], work);
  const back = () => git(['checkout', '-q', start], work);
  try {
    shipChecks(work, cfg, pad, branch);
    if (!runTests(work, cfg)) throw testFailure(work, cfg, base, catchUp || baseSha);
    clash(', made while the tests ran');
  } catch (e) { back(); throw e; }
  // Waiting may have let you commit to the base branch, so a failure from here puts it back to that commit, not an older one.
  baseSha = git(['rev-parse', base], repo).trim();
  // Close the ticket on the branch, so the merge is what makes it done.
  const t = findTicket(work, pad);
  writeField(t, 'status', 'done');
  git(['add', '-A', '--', placeTicket(work, t, 'done'), t.file], work);
  git(['commit', '-q', '-m', `speck(${pad}): ship`], work);
  // Uncommitted changes to tracked files, taken again just before each step that moves a branch, so a failure can put them back exactly.
  const kept = {};
  const snap = () => { for (const dir of new Set([mergeAt, work])) kept[dir] = git(['stash', 'create'], dir).trim(); };
  const lost = [];
  const putBack = dir => {
    if (!kept[dir] || sh('git', ['stash', 'apply', '-q', '--index', kept[dir]], { cwd: dir }).status === 0) return;
    sh('git', ['reset', '-q', '--hard'], { cwd: dir }); // drop the half-applied copy: the stash holds it all
    sh('git', ['stash', 'store', '-m', `speck ship ${pad}: uncommitted changes in ${dir}`, kept[dir]], { cwd: dir });
    lost.push(` Your uncommitted changes in ${dir} couldn't be put back in place, so they're saved in git's stash: run \`git stash pop --index\` there.`);
  };
  if (mergeAt === work) {
    snap();
    const out = sh('git', ['checkout', '-q', base], { cwd: work });
    if (out.status !== 0) { // something changed a file in the folder since the check above: undo the ship commit, keeping the change
      git(['reset', '-q', '--hard', branchSha], work);
      back();
      putBack(work);
      const files = listedIn(out, 'Your local changes');
      throw new SpeckError(`Couldn't switch ${work} to ${base}${files.length ? ` over uncommitted changes to ${files.join(', ')}` : `: ${out.stderr.trim().split('\n').pop()}`}. Nothing was shipped. Commit or stash them, then ship again.${lost.join('')}`);
    }
  }
  snap();
  // From the ship commit on, any failure puts back the base branch, the ticket branch, both folders and their uncommitted changes.
  const undo = () => {
    sh('git', ['merge', '--abort'], { cwd: mergeAt });
    git(['reset', '-q', '--hard', baseSha], mergeAt); // undo any catch-up, so the base is exactly as it was
    if (mergeAt === work) { git(['update-ref', `refs/heads/${branch}`, branchSha], work); back(); }
    else { git(['reset', '-q', '--hard', branchSha], work); putBack(work); } // the branch is checked out there, so undo the ship commit in place
    putBack(mergeAt);
  };
  const fail = message => new SpeckError(message + lost.join(''));
  const overwriteError = (what, files, kind) => fail(kind === 'untracked'
    ? `${what} would overwrite untracked files in ${mergeAt}: ${files.join(', ')}. Nothing was shipped. Move or remove them, then ship again.`
    : `${what} would overwrite uncommitted changes in ${mergeAt}: ${files.join(', ')}. Nothing was shipped and your changes are untouched. Commit or stash them, then ship again.`);
  // Git refuses to overwrite untracked files or uncommitted changes, listing them.
  const refused = r => {
    const untracked = listedIn(r, 'untracked working tree files would be overwritten');
    if (untracked.length) return [untracked, 'untracked'];
    const local = listedIn(r, 'Your local changes to the following files would be overwritten');
    return local.length ? [local, 'local'] : null;
  };
  if (catchUp) {
    const ff = sh('git', ['merge', '-q', '--ff-only', catchUp], { cwd: mergeAt });
    if (ff.status !== 0) {
      const why = refused(ff);
      undo();
      throw why ? overwriteError(`Bringing ${base} up to date with ${remote}`, ...why)
        : fail(`Couldn't bring ${base} up to date with ${remote}, so nothing was shipped: ${ff.stderr.trim().split('\n').pop()}`);
    }
    snap(); // a hook may have changed files during the catch-up
  }
  const merge = sh('git', ['merge', '--no-ff', '-m', `speck(${pad}): ${t.fm.title}`, branch], { cwd: mergeAt });
  if (merge.status !== 0) {
    const why = refused(merge);
    const conflicts = sh('git', ['diff', '--name-only', '--diff-filter=U'], { cwd: mergeAt }).stdout.split('\n').filter(Boolean);
    undo();
    if (why) throw overwriteError(`Merging ${branch} into ${base}`, ...why);
    if (!conflicts.length) throw fail(`Merging ${branch} into ${base} failed, so nothing was shipped and ${base} is unchanged: ${merge.stderr.trim().split('\n').pop()}`);
    // A conflict has its own exit code, so a build can merge the base branch in, get it re-reviewed and ship again.
    // After catching up with the remote, the conflict is with the remote's commits, which the local base no longer has.
    const target = catchUp ? `${remote}/${base}` : base;
    const e = fail(`Merging ${branch} into ${base} hit a conflict, so nothing was shipped and ${base} is unchanged. Conflicting files: ${conflicts.join(', ')}. Merge ${target} into ${branch}, resolve the conflicts, get the result reviewed, then ship again.`);
    e.code = 13;
    throw e;
  }
  // From here on, run git from the main checkout, which always survives: the ticket's worktree is about to go.
  const branchRemote = sh('git', ['config', `branch.${branch}.remote`], { cwd: main }).stdout.trim() || remote;
  // -d would compare against the branch's upstream, which lacks the ship commit, so check against the base ourselves.
  if (sh('git', ['merge-base', '--is-ancestor', branch, base], { cwd: main }).status !== 0)
    throw new SpeckError(`${branch} isn't fully in ${base} after the merge, so it wasn't deleted. Check it with \`git log ${base}..${branch}\`.`);
  // The worktree was clean before the tests, and the ship commit holds everything since, so --force only drops what the test run left behind.
  // If it can't be removed (a locked worktree, say), the ship still completes, and the branch stays until it's gone.
  const removed = linked ? sh('git', ['worktree', 'remove', '--force', linked], { cwd: main }) : null;
  if (!removed || removed.status === 0) {
    git(['branch', '-D', branch], main);
    console.log(`Shipped ${pad}: merged ${branch} into ${base} and deleted the local branch.`);
  } else {
    console.log(`Shipped ${pad}: merged ${branch} into ${base}.`);
    const unlock = /locked/i.test(removed.stderr) ? `\`git worktree unlock ${linked}\`, then ` : '';
    console.log(`Couldn't remove the worktree at ${linked} (${removed.stderr.trim().split('\n').pop()}), so ${branch} is kept. Run ${unlock}\`git worktree remove ${linked}\`, then \`git branch -D ${branch}\`.`);
  }
  if (linked && removed.status === 0) {
    console.log(`Removed the ticket's worktree at ${linked}.`);
    if (here === linked) console.log(mergeAt !== linked
      ? `You ran this from that folder, which is gone now. ${base} is checked out at ${mergeAt}.`
      : `You ran this from that folder, which is gone now. ${base} isn't checked out anywhere; your main checkout is at ${main}.`);
  }
  if (!remote) { console.log(`No remote set for ${base}, so nothing was pushed.`); return; }
  const push = sh('git', ['push', remote, base], { cwd: main });
  if (push.status !== 0) {
    const behind = /\((fetch first|non-fast-forward)\)/.test(push.stderr);
    const fix = behind
      ? `${remote} got new commits on ${base} while you were shipping. Run \`git pull\`, then \`git push ${remote} ${base}\`.`
      : `If ${base} is protected on GitHub, allow direct pushes (turn off "Require a pull request before merging"), then run \`git push ${remote} ${base}\`.`;
    throw new SpeckError(`Merged locally, but pushing ${base} to ${remote} failed:\n${push.stderr.trim()}\n${fix}${branchRemote ? ` ${branch} is kept on ${branchRemote} until then.` : ''}`);
  }
  console.log(`Pushed ${base} to ${remote}.`);
  deleteRemoteBranch(main, branchRemote, branch);
}

// Only once the base branch is safely pushed: until then, the remote copy is the backup.
function deleteRemoteBranch(repo, remote, branch) {
  const found = sh('git', ['ls-remote', '--exit-code', '--heads', remote, branch], { cwd: repo });
  if (found.status === 2) return;
  const del = found.status === 0 ? sh('git', ['push', remote, '--delete', branch], { cwd: repo }) : found;
  if (del.status === 0) console.log(`Deleted ${branch} on ${remote}.`);
  else console.log(`Couldn't delete ${branch} on ${remote} (${del.stderr.trim().split('\n').pop()}). Delete it with \`git push ${remote} --delete ${branch}\`.`);
}

// Why an approved ticket can't ship without the user, or '' if config lets the builder ship it straight after approval.
function autoShipBlocker(repo, cfg, id) {
  const pad = String(id).padStart(4, '0');
  if (cfg.auto_ship !== true) return 'auto_ship is off in speck/config.yml';
  const t = findTicket(repo, pad);
  const allowed = [].concat(cfg.auto_ship_risk ?? []).map(String);
  if (!allowed.includes(String(t.fm.risk))) return `ticket ${pad} has risk "${t.fm.risk}", and auto_ship_risk only allows ${allowed.length ? allowed.join(', ') : 'none'}`;
  const blind = rounds(repo, pad).filter(r => r.meta.sandbox_ok === false).map(r => r.meta.round);
  if (blind.length) return `the reviewer couldn't inspect the repo in round ${blind.join(', ')}, so it only reviewed the diff`;
  return '';
}

export function cmdShip(args) {
  const id = args.find(a => !a.startsWith('--'));
  if (!id) throw new SpeckError('Usage: speck ship <id> [--auto]');
  const repo = findRepoRoot();
  // --auto is how the builder ships straight after approval. It only goes ahead when config allows it for this ticket.
  if (args.includes('--auto')) {
    // Read the ticket where its branch is checked out, so the checks see the approved copy, not the base branch's.
    const cfg = loadConfig(repo);
    let folder = repo;
    try { folder = shipFolders(repo, ticketBranch(repo, cfg, id), cfg.base_branch).work; } catch { /* no branch: shipTicket says so */ }
    const why = autoShipBlocker(folder, cfg, id);
    if (why) throw new SpeckError(`Not shipping automatically: ${why}. The ticket stays approved, waiting for you to run /speck-ship ${String(id).padStart(4, '0')}.`, 12);
  }
  shipTicket(repo, id);
}
