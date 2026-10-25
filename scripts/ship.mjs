// speck ship: the user's gate, merging an approved ticket into the base branch (or --auto, when config allows it).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SpeckError, sh, git, findRepoRoot, loadConfig, findTicket, placeTicket, writeField, isAncestor, ticketBranches, ticketKind } from './core.mjs';
import { rounds, ticketNext } from './review.mjs';
import { changesPending } from './changes-asked.mjs';
import { testRun } from './results.mjs';
import { failingTests } from './tap.mjs';
import { sharedCacheDir } from './turns.mjs';
import { removeScratch } from './scratch.mjs';
import { shipFolders, putBranchBack } from './ship-folders.mjs';
import { remoteBaseCatchUp } from './ship-remote.mjs';
import { prMode } from './pull-request.mjs';
import { shipPrTicket } from './pr-ship.mjs';
import { privateLinesInSpeck } from './private-words.mjs';
import { notPushed } from './not-pushed.mjs';

// ---------- ship (the user's gate: merge an approved ticket locally) ----------

export function ticketBranch(repo, cfg, id) {
  const pad = String(id).padStart(4, '0');
  const names = ticketBranches(repo, cfg, pad);
  if (names.length !== 1) throw new SpeckError(names.length
    ? `Found ${names.length} branches for ticket ${pad} (${names.join(', ')}). Delete the extra ones, then run this again.`
    : `No branch called ${cfg.branch_prefix}${pad}-… found. Has the ticket been built?`);
  return names[0];
}

// Every reason not to ship, checked with the ticket branch checked out and before anything changes.
export function shipChecks(repo, cfg, pad, branch) { // 0295: and before opening a pull request
  const t = findTicket(repo, pad);
  if (t.fm.status !== 'approved')
    throw new SpeckError(`Ticket ${pad} is "${t.fm.status}" on ${branch}, not "approved". Only a ticket the reviewer approved can be shipped.`);
  const all = rounds(repo, pad);
  const next = ticketNext(t.raw, all, cfg);
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
  // 0355: a task's result is in outputs/, outside git, so its branch only carries the ticket's own records.
  if (ticketKind(t) === 'task') {
    const outside = git(['diff', '--no-renames', '--name-only', '-z', `${cfg.base_branch}...${branch}`], repo)
      .split('\0').filter(f => f && !f.startsWith('speck/'));
    if (outside.length)
      throw new SpeckError(`Ticket ${pad} is a task, so its branch should change only files under speck/, but it changes ${outside.join(', ')}. Nothing was shipped. Take those changes off its branch, get it reviewed, then ship again.`);
  }
  privateWordsCheck(repo, cfg, branch);
}

// 0506: what the ship publishes under speck/, such as review rounds quoting a reviewer's evidence, isn't checked by
// the tests (0112) or by speck lint once the build has started, so it's checked before anything changes. Exit 17 hands
// it back (ship-queue).
function privateWordsCheck(repo, cfg, branch) {
  const leaks = privateLinesInSpeck(repo, cfg.base_branch, branch);
  if (leaks.length)
    throw new SpeckError(`Files under speck/ that ${branch} adds or changes hold your private words or your home folder's path, so nothing was shipped:\n${leaks.map(l => `  ${l.file} line ${l.line}: ${l.what === 'word' ? 'one of your private words (from ~/.config/speck/private-words)' : "your home folder's path"}`).join('\n')}\nTake each one out (write a path under your home folder as a \`~/\` path), commit it on ${branch}, then ship again.`, 17);
}

// Runs the tests in `repo`: { ok, output }, output being what a failing run wrote. `branch` is the one the flaky log
// names for a test that passes only on a second try (blank: the one checked out).
function runTests(repo, cfg, branch = '') {
  const cmd = (cfg.commands?.test || '').trim();
  if (!cmd) throw new SpeckError('No test command is set, so speck can\'t check the tests pass before shipping. Set commands.test in speck/config.yml (for example `npm test`), commit it, then run this again.');
  // The run takes a turn, as `speck test` does, so ships and builds don't all run the suite at once. A passing result
  // recorded for the same code is reused, but never a failure (0112).
  const r = testRun(repo, cfg, cmd, { reuse: 'pass', branch, onStart: () => console.log(`Running tests: ${cmd}`) });
  // A stall is no sign the change is broken, so it isn't checked against the base branch's tests (0152).
  if (r.stalled) throw new SpeckError('The tests stalled, so speck ended them and nothing was shipped. The ticket is still approved: ship it again to run the tests again.');
  return { ok: r.status === 0, output: r.output || '' };
}

// The failing tests named in a refusal: the first ten, and how many more.
function named(failing) {
  if (!failing.length) return '';
  const more = failing.length > 10 ? `, and ${failing.length - 10} more` : '';
  return ` Failing tests: ${failing.slice(0, 10).join('; ')}${more}.`;
}

// The refusal for tests that failed on the ticket merged with the base branch's commit `sha`. It runs the tests on
// that commit alone, in a temporary worktree it removes afterwards, so a broken base branch isn't blamed on the ticket.
// `moved` says whether the base branch has commits the ticket branch doesn't, and `failing` names the failing tests.
export function testFailure(repo, cfg, base, sha, { moved = false, failing = [] } = {}) {
  const failed = `Tests failed on the approved branch, so nothing was shipped.${moved ? ` They ran on it merged with ${base} as it is now.` : ''}`;
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
    const there = runTests(at, cfg, base);
    // 0264: a failing test counts as failing on the base branch only when one of the same name fails there too.
    const onBase = new Set(there.ok ? [] : failingTests(there.output));
    const own = failing.filter(t => !onBase.has(t));
    const together = e => { e.together = true; return e; }; // an auto-ship exits 16 with it, so speck run hands the ticket back to its build (0194)
    if (there.ok) return together(new SpeckError(moved
      ? `${failed} ${base}'s own tests pass, so the tests failed on this ticket as it would land, because of its own change or because of it with ${base}'s newer changes.${named(failing)} Merge ${base}'s newer changes into the ticket, fix the failing tests, get it reviewed, then ship again.`
      : `${failed} ${base}'s tests pass, so the failure comes from this ticket's change.${named(failing)}`));
    if (own.length) return together(new SpeckError(`${failed} The ticket fails tests that pass on ${base}${moved ? `, because of its own change or because of it with ${base}'s newer changes` : ''}.${named(own)} ${base}'s own tests are failing as well, and the tests that fail there too aren't listed. Fix these tests on the ticket${moved ? `, merging ${base}'s newer changes into it first` : ''}, get it reviewed, then ship again.`));
    return new SpeckError(`Tests failed on the approved branch${moved ? ` merged with ${base} as it is now` : ''}, and ${base}'s own tests are failing too, so this isn't the ticket's fault. Nothing was shipped. Fix ${base}, then ship again.`, 14);
  } finally {
    // Only this worktree's record goes: a repo-wide prune would also drop other worktrees whose folders are missing.
    const removed = sh('git', ['worktree', 'remove', '--force', at], { cwd: repo });
    fs.rmSync(path.dirname(at), { recursive: true, force: true });
    if (removed.status !== 0 && admin) fs.rmSync(admin, { recursive: true, force: true });
  }
}

// The ticket branch merged into the base branch's commit `target`, as a commit no branch points at, made in git's
// object store only (merge-tree), so no branch, folder, index or hook is touched (0192). Null when the merge has
// conflicts: the real merge then hits them and refuses, as before.
export function candidateMerge(repo, branch, target, message) {
  const r = sh('git', ['merge-tree', '--write-tree', '--no-messages', target, branch], { cwd: repo });
  if (r.status === 1) return null;
  if (r.status !== 0) throw new SpeckError(`Couldn't work out the merge of ${branch} into the base branch, so nothing was shipped: ${(r.stderr || r.stdout).trim().split('\n').pop()}`);
  return git(['commit-tree', r.stdout.split('\n')[0].trim(), '-p', target, '-p', branch, '-m', message], repo).trim();
}

// Runs the tests on `candidate`, checked out in the ticket branch's folder, then checks the branch out again there.
export function testMerged(work, cfg, branch, candidate) {
  git(['checkout', '-q', '--detach', candidate], work);
  try { return runTests(work, cfg, branch); }
  finally {
    const out = sh('git', ['checkout', '-q', branch], { cwd: work });
    if (out.status !== 0) throw new SpeckError(`Couldn't check ${branch} out again in ${work} after the tests (${out.stderr.trim().split('\n').pop()}), so nothing was shipped. Run \`git checkout ${branch}\` there, then ship again.`);
  }
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
  const { main, work, mergeAt, linked, astray } = shipFolders(repo, branch, base);
  const here = fs.realpathSync(repo);
  if (!fs.existsSync(work))
    throw new SpeckError(`${branch} is checked out in a worktree at ${work}, but that folder is missing. Run \`git worktree prune\` so git forgets it, then ship again.`);
  if (astray) putBranchBack(work, branch, astray);
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
  privateWordsCheck(repo, cfg, branch); // before catching up with the remote, which keeps its merge (0506)
  const remote = sh('git', ['config', `branch.${base}.remote`], { cwd: repo }).stdout.trim();
  const catchUp = remoteBaseCatchUp(repo, remote, base, mergeAt);
  const start = git(['branch', '--show-current'], work).trim() || git(['rev-parse', 'HEAD'], work).trim();
  const branchSha = git(['rev-parse', branch], repo).trim();
  let baseSha = git(['rev-parse', base], repo).trim();
  git(['checkout', '-q', branch], work);
  const back = () => git(['checkout', '-q', start], work);
  // The tests run on what will land: the ticket merged with the base branch as it is now, remote commits included
  // (0192). If you commit to the base branch while they run, they run again with your commit.
  let target = catchUp || baseSha, tested = null;
  try {
    shipChecks(work, cfg, pad, branch);
    const message = `speck(${pad}): ${findTicket(work, pad).fm.title}`;
    const doc = ticketKind(findTicket(work, pad)) === 'task';
    for (let tries = 1; ; tries++) {
      tested = candidateMerge(work, branch, target, message);
      // 0355: a task changes only speck/, so there's nothing for the tests to check.
      if (doc) { console.log(`Ticket ${pad} is a task, so no tests run before it ships.`); break; }
      // A merge with conflicts can't be tested, so the branch alone is, as before: the merge then refuses with them.
      const r = tested ? testMerged(work, cfg, branch, tested) : runTests(work, cfg);
      if (!r.ok) throw testFailure(work, cfg, base, target, { moved: !!tested && !isAncestor(work, target, branchSha), failing: failingTests(r.output) });
      clash(', made while the tests ran');
      const now = git(['rev-parse', base], repo).trim();
      if (!tested || catchUp || now === target) break; // after a catch-up, a local commit is the catch-up's to refuse
      if (tries === 3) throw new SpeckError(`${base} got new commits each time the tests ran, so nothing was shipped. Ship again once it's quieter.`);
      console.log(`${base} got new commits while the tests ran: running them again with those commits.`);
      target = now;
    }
  } catch (e) { back(); throw e; }
  // Waiting may have let you commit to the base branch, so a failure from here puts it back to that commit, not an older one.
  baseSha = git(['rev-parse', base], repo).trim();
  // Close the ticket on the branch, so the merge is what makes it done.
  const t = findTicket(work, pad);
  writeField(t, 'status', 'done');
  const ticketFiles = [placeTicket(work, t, 'done'), t.file]; // where it was, then where it is now
  git(['add', '-A', '--', ...ticketFiles], work);
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
  // What landed must be what the tests passed on, but for the ship commit moving the ticket's own file to done (0192).
  const shipped = new Set(ticketFiles.map(f => path.relative(work, f).split(path.sep).join('/')));
  const untested = tested
    ? git(['diff', '--no-renames', '--name-only', '-z', tested, 'HEAD'], mergeAt).split('\0').filter(f => f && !shipped.has(f))
    : null;
  if (!untested || untested.length) {
    // Back to the base branch as the merge found it, so a commit made on it since the tests is kept.
    if (!catchUp) baseSha = git(['rev-parse', 'HEAD^1'], mergeAt).trim();
    undo();
    throw fail(`Merging ${branch} into ${base} didn't give what the tests ran on${untested ? ` (these files differ: ${untested.join(', ')})` : ''}, so nothing was shipped and ${base} is unchanged. Ship again.`);
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
  // Shipped, so the build's scratch files aren't needed any more, even if the push below fails.
  removeScratch(pad);
  if (!remote) { console.log(`No remote set for ${base}, so nothing was pushed.`); return; }
  const push = sh('git', ['push', remote, base], { cwd: main });
  if (push.status !== 0) {
    const behind = /\((fetch first|non-fast-forward)\)/.test(push.stderr);
    const fix = behind
      ? `${remote} got new commits on ${base} while you were shipping. Run \`git pull\`, then \`git push ${remote} ${base}\`.`
      : `If ${base} is protected on GitHub, allow direct pushes (turn off "Require a pull request before merging"), then run \`git push ${remote} ${base}\`.`;
    const e = new SpeckError(`Merged locally, but pushing ${base} to ${remote} failed:\n${push.stderr.trim()}\n${fix}${branchRemote ? ` ${branch} is kept on ${branchRemote} until then.` : ''}`);
    // 0204: the ship record keeps this, so the panel says so until the commit has reached the remote.
    e.unpushed = { remote, base, sha: git(['rev-parse', base], main).trim() };
    throw e;
  }
  console.log(`Pushed ${base} to ${remote}.`);
  deleteRemoteBranch(main, branchRemote, branch);
}

// Only once the base branch is safely pushed: until then, the remote copy is the backup.
export function deleteRemoteBranch(repo, remote, branch) {
  const found = sh('git', ['ls-remote', '--exit-code', '--heads', remote, branch], { cwd: repo });
  if (found.status === 2) return;
  const del = found.status === 0 ? sh('git', ['push', remote, '--delete', branch], { cwd: repo }) : found;
  if (del.status === 0) console.log(`Deleted ${branch} on ${remote}.`);
  else console.log(`Couldn't delete ${branch} on ${remote} (${del.stderr.trim().split('\n').pop()}). Delete it with \`git push ${remote} --delete ${branch}\`.`);
}

// Why an approved ticket can't ship without the user, or '' if config lets the builder ship it straight after approval.
export function autoShipBlocker(repo, cfg, id) {
  const pad = String(id).padStart(4, '0');
  const t = findTicket(repo, pad);
  const all = rounds(repo, pad);
  return autoShipWhyNot(cfg, pad, t.fm.risk, all, ticketKind(t), changesPending(t.raw, all).length > 0);
}

// The same, from a ticket's risk and its review rounds as already read, as `speck status --json` has them (0167).
// 0355: a task never ships by itself, as reading it is its review. 0356: nor does one with changes the user
// asked for (`changed`) that no round has reviewed yet.
export function autoShipWhyNot(cfg, pad, risk, roundList, kind = 'code', changed = false) {
  if (changed) return `the user asked for changes to ticket ${pad}, and it waits for its build to make them and the reviewer to approve them`;
  if (kind === 'task') return `ticket ${pad} is a task, and a task waits for you to ship it`;
  if (cfg.auto_ship !== true) return 'auto_ship is off in speck/config.yml';
  const allowed = [].concat(cfg.auto_ship_risk ?? []).map(String);
  if (!allowed.includes(String(risk))) return `ticket ${pad} has risk "${risk}", and auto_ship_risk only allows ${allowed.length ? allowed.join(', ') : 'none'}`;
  const blind = roundList.filter(r => r?.meta?.sandbox_ok === false).map(r => r.meta.round);
  if (blind.length) return `the reviewer couldn't inspect the repo in round ${blind.join(', ')}, so it only reviewed the diff`;
  return '';
}

// ---------- the ship record (0153) ----------
// While `speck ship <id>` runs, <id>.ship.json in the main checkout's speck/.cache/runs/ holds its pid, when it started
// and whether it's an auto-ship, so the panel shows it wherever it was started from, and a second ship of the ticket
// refuses. A ship that shipped, or one the user started, removes it as it ends. An auto-ship that didn't ship leaves it
// for the panel, with when it ended and speck ship's message, and one that was killed leaves it with a pid that has gone.
// 0204: a ship, whoever started it, that merged but couldn't push leaves it too, with the remote, the base branch and
// the commit it merged, until that commit has reached the remote.

const shipFile = (runs, pad) => path.join(runs, `${pad}.ship.json`);
const pidAlive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
function readShip(file) {
  let rec;
  try { rec = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
  return rec && typeof rec === 'object' && !Array.isArray(rec) && Number.isInteger(rec.pid) && rec.pid > 0 && typeof rec.started === 'string' ? rec : null;
}
// True while the record's ship is running: it hasn't ended and its pid is alive and is still speck ship of this ticket,
// from its command line, so a pid reused by another program doesn't hold the ticket. Without ps, a live pid is enough.
function shipRunning(rec, pad) {
  if (!rec || Object.hasOwn(rec, 'ended') || !pidAlive(rec.pid)) return false;
  let r;
  try { r = sh('ps', ['-ww', '-o', 'args=', '-p', String(rec.pid)]); } catch { return true; }
  return r.status === 0 && new RegExp(`speck(\\.mjs)?\\s+ship\\s+(.*\\s)?0*${Number(pad)}(\\s|$)`).test(r.stdout.trim());
}

// What the panel shows of a ticket's ship, from `runs` (the main checkout's speck/.cache/runs/): { running: true, auto,
// started } while one runs, { running: false, auto: true, started, ended, message } for an auto-ship that ended without
// shipping (ended and message are null when it was killed), { running: false, auto, started, ended, message, unpushed: true }
// for a ship that merged but couldn't push, until the commit it merged, or the ticket as done, has reached the remote
// (0204, 0508), or null.
export function shipState(runs, id) {
  id = String(id ?? '');
  if (!/^\d+$/.test(id)) return null;
  const pad = id.padStart(4, '0'), rec = readShip(shipFile(runs, pad));
  if (!rec) return null;
  const auto = rec.auto === true;
  if (shipRunning(rec, pad)) return { running: true, auto, started: rec.started };
  const text = v => (typeof v === 'string' && v !== '' ? v : null);
  if (rec.unpushed && typeof rec.unpushed === 'object') {
    if (!notPushed(runs, rec.unpushed, pad)) return null;
    return { running: false, auto, started: rec.started, ended: text(rec.ended), message: text(rec.message), unpushed: true };
  }
  if (!auto) return null;
  return { running: false, auto, started: rec.started, ended: text(rec.ended), message: text(rec.message) };
}

// True while a ship of any ticket but `pad` runs in the repo, whoever started it, from the ship records in `runs`.
export function otherShipRunning(runs, pad = null) {
  return shipsRunning(runs, pad).length > 0;
}
// The ids of the tickets being shipped, whoever started each, from the ship records in `runs`, leaving out `pad` (0285).
export function shipsRunning(runs, pad = null) {
  let names = [];
  try { names = fs.readdirSync(runs); } catch { return []; }
  return names.flatMap(f => { const m = f.match(/^(\d+)\.ship\.json$/); return m && m[1] !== pad && shipState(runs, m[1])?.running === true ? [m[1]] : []; }).sort();
}

// Takes the ticket's ship record for this process, or refuses, changing nothing, while another ship of it runs. The
// record is written whole and then linked into place, which is atomic, so two ships starting at once can't both take
// it. A record left by a ship that has ended or gone is replaced, only while holding a short-lived recovery lock.
function takeShip(repo, pad, auto) {
  let runs = path.join('speck', '.cache', 'runs');
  const fail = e => new SpeckError(`speck ship couldn't write ticket ${pad}'s ship record in ${runs} (${e.message}), so nothing was shipped. Check you can write to that folder, then try again.`);
  try { runs = sharedCacheDir(repo, 'runs'); } catch (e) { throw fail(e); }
  const file = shipFile(runs, pad), recover = `${file}.recover`, mine = path.join(runs, `${pad}.ship.${process.pid}.tmp`);
  const text = JSON.stringify({ pid: process.pid, started: new Date().toISOString(), auto });
  try { fs.writeFileSync(mine, text); } catch (e) { throw fail(e); }
  const link = to => { try { fs.linkSync(mine, to); return true; } catch (e) { if (e.code === 'EEXIST') return false; throw e; } };
  const read = f => { try { return fs.readFileSync(f, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } };
  const busy = rec => new SpeckError(`A ship is already running for ticket ${pad} (process ${rec.pid}, started ${rec.started}). Nothing was changed. Wait for it to finish: the panel shows it as shipping until then.`);
  try {
    for (let tries = 0; tries < 5; tries++) {
      if (link(file)) return { file, text };
      const held = read(file);
      if (held === null) continue; // removed just now: try again
      let rec = null;
      try { rec = JSON.parse(held); } catch { /* unreadable: replace it */ }
      if (rec && shipRunning(readShip(file), pad)) throw busy(rec);
      // 0204: a ship that merged it but couldn't push keeps its record until the commit is on the remote.
      if (rec && shipState(runs, pad)?.unpushed) throw new SpeckError(`Ticket ${pad} has already been merged, but its push failed, so there's nothing to ship. Nothing was changed. What speck ship said then:\n${rec.message ?? ''}`.trim());
      if (!link(recover)) {
        const other = readShip(recover);
        if (other && pidAlive(other.pid)) throw busy(other);
        fs.rmSync(recover, { force: true }); // left by a ship that was killed while replacing a record
        continue;
      }
      try {
        if (read(file) === held) fs.rmSync(file, { force: true });
        if (link(file)) return { file, text };
      } finally { fs.rmSync(recover, { force: true }); }
    }
    throw new SpeckError(`speck ship couldn't take ticket ${pad}'s ship record, ${path.relative(repo, file)}. Try again.`);
  } catch (e) { throw e instanceof SpeckError ? e : fail(e); }
  finally { fs.rmSync(mine, { force: true }); }
}

// One ship at a time in the repo (0193): ship.lock in the runs folder names the ship that has it. It's written whole and
// linked into place, which is atomic. A lock whose ship has gone is taken over, only while holding a short-lived
// recovery lock. A ship speck run started gives up at once (null) if another ship has it; any other ship waits its turn,
// saying so once. Returns what release() needs.
function takeShipLock(runs, pad, alone) {
  const file = path.join(runs, 'ship.lock'), recover = `${file}.recover`, mine = path.join(runs, `ship.lock.${process.pid}.tmp`);
  const text = JSON.stringify({ pid: process.pid, started: new Date().toISOString(), id: pad });
  fs.writeFileSync(mine, text);
  const link = to => { try { fs.linkSync(mine, to); return true; } catch (e) { if (e.code === 'EEXIST') return false; throw e; } };
  const read = f => { try { return fs.readFileSync(f, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } };
  const holder = held => { try { const rec = JSON.parse(held); return shipRunning(rec, String(rec.id)) ? rec : null; } catch { return null; } };
  let told = false;
  try {
    for (;;) {
      if (link(file)) return { file, text };
      const held = read(file);
      if (held === null) continue; // removed just now: try again
      const rec = holder(held);
      if (!rec) { // its ship has gone: take it over, unless another ship is doing that now
        if (!link(recover)) { if (!holder(read(recover) ?? '')) fs.rmSync(recover, { force: true }); else sleep(50); continue; }
        try { if (read(file) === held) fs.rmSync(file, { force: true }); } finally { fs.rmSync(recover, { force: true }); }
        continue;
      }
      if (alone) return null;
      if (!told) console.log(`Ticket ${rec.id}'s ship is running in this repo, so this ship is waiting for it to finish.`);
      told = true;
      sleep(envMs('SPECK_SHIP_POLL_MS', POLL_MS));
    }
  } finally { fs.rmSync(mine, { force: true }); }
}
const releaseShipLock = lock => { try { if (fs.readFileSync(lock.file, 'utf8') === lock.text) fs.rmSync(lock.file, { force: true }); } catch { /* already gone */ } };

// Ends the record this process took: removes it, or for an auto-ship that didn't ship, or any ship that merged but
// couldn't push (0204), keeps it with when it ended and speck ship's message. A record another ship has since replaced is left alone.
function endShip(took, auto, error) {
  let now;
  try { now = fs.readFileSync(took.file, 'utf8'); } catch { return; }
  if (now !== took.text) return;
  try {
    const unpushed = error?.unpushed ?? null;
    if (!error || (!auto && !unpushed)) return fs.rmSync(took.file, { force: true });
    const message = String(error?.message ?? error ?? '').trim() || null;
    fs.writeFileSync(took.file, JSON.stringify({ ...JSON.parse(took.text), ended: new Date().toISOString(), message, ...(unpushed ? { unpushed } : {}) }));
  } catch (e) { console.error(`Couldn't update the ship record ${took.file} (${e.message}), so the panel may show this ship out of date. Delete it if so.`); }
}

export function cmdShip(args) {
  const id = args.find(a => !a.startsWith('--'));
  if (!id) throw new SpeckError('Usage: speck ship <id> [--auto]');
  const repo = findRepoRoot();
  const auto = args.includes('--auto');
  // Read once and removed, so nothing the ship runs, such as the tests, inherits it.
  const alone = !!process.env.SPECK_SHIP_ALONE;
  delete process.env.SPECK_SHIP_ALONE;
  const pr = prMode(loadConfig(repo)); // 0296: in pull request mode, shipping merges its pull request on GitHub
  // --auto is how the builder ships straight after approval. It only goes ahead when config allows it for this ticket.
  if (auto && !pr) {
    // Read the ticket where its branch is checked out, so the checks see the approved copy, not the base branch's.
    const cfg = loadConfig(repo);
    let folder = repo;
    try {
      const f = shipFolders(repo, ticketBranch(repo, cfg, id), cfg.base_branch);
      if (!f.astray || f.astray === 'merge') folder = f.work; // anything else there: shipTicket refuses, naming it
    } catch { /* no branch: shipTicket says so */ }
    const why = autoShipBlocker(folder, cfg, id);
    if (why) throw new SpeckError(`Not shipping automatically: ${why}. The ticket stays approved, waiting for you to run /speck-ship ${String(id).padStart(4, '0')}.`, 12);
  }
  // Only a ticket id gets a record: anything else is refused by shipTicket, naming it.
  const took = /^\d{1,4}$/.test(id) ? takeShip(repo, id.padStart(4, '0'), auto) : null;
  let lock = null;
  try { lock = took && takeShipLock(path.dirname(took.file), id.padStart(4, '0'), alone); } catch (e) { endShip(took, false, null); throw new SpeckError(`speck ship couldn't take the repo's ship lock (${e.message}), so nothing was shipped. Try again.`); }
  if (took && !lock) {
    endShip(took, false, null);
    throw new SpeckError(`Another ship is running in this repo, so ${id.padStart(4, '0')} wasn't shipped. Nothing was changed.`, 15);
  }
  try { if (pr) shipPrTicket(repo, id, { auto }); else shipTicket(repo, id); }
  catch (e) { if (auto && e?.together) e.code = 16; if (took) endShip(took, auto, e); throw e; }
  finally { if (lock) releaseShipLock(lock); }
  if (took) endShip(took, auto, null);
}
