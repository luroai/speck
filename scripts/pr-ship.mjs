// 0296: shipping in pull request mode. `speck ship <id>` with `ship_mode: pr` merges the ticket's pull request on
// GitHub with gh, once its checks pass and the same checks a local ship makes before merging pass, then tidies up as a
// local ship does: the local base branch brought up to date, the ticket filed as done, its worktree and branch removed.
// A pull request already merged on GitHub only gets the tidying up. One that can't be merged changes nothing locally.
// 0315: nothing is pushed straight to the base branch. The pull request files the ticket as done (pr-done.mjs), so the
// merge on GitHub does that, and the local base branch gets it from there.
import { SpeckError, sh, git, loadConfig, findTicket, placeTicket, writeField, isAncestor, padId } from './core.mjs';
import { shipChecks, ticketBranch, autoShipBlocker, deleteRemoteBranch, candidateMerge, testMerged, testFailure } from './ship.mjs';
import { failingTests } from './tap.mjs';
import { shipFolders, putBranchBack } from './ship-folders.mjs';
import { runGh, lastLine, branchFolder, removeFolder } from './pull-request.mjs';
import { removeScratch } from './scratch.mjs';
import { doneTip, pushDone, pushedEarlier } from './pr-done.mjs';

const VIEW = 'number,url,state,isDraft,mergeable,mergeStateStatus,reviewDecision,statusCheckRollup,headRefOid';

// gh installed and signed in, or a one-line refusal.
function ghReady(gh, repo, pad) {
  const version = runGh(gh, ['--version'], repo);
  if (version.missing) throw new SpeckError(`gh, GitHub's command line tool, isn't installed, so speck couldn't merge ${pad}'s pull request. Install it from https://cli.github.com and sign in with \`gh auth login\`. Nothing was changed.`);
  if (version.status !== 0) throw new SpeckError(`gh didn't run (${lastLine(version)}), so speck couldn't merge ${pad}'s pull request. Nothing was changed.`);
  if (runGh(gh, ['auth', 'status'], repo).status !== 0) throw new SpeckError(`gh isn't signed in to GitHub, so speck couldn't merge ${pad}'s pull request. Run \`gh auth login\`, then ship again. Nothing was changed.`);
}

// The ticket's pull request into the base branch, merged or open, as `gh pr view` gives it, or null when it has none.
export function findPr(gh, repo, pad, branch, base) {
  const r = runGh(gh, ['pr', 'list', '--head', branch, '--base', base, '--state', 'all', '--json', 'number,url,state'], repo);
  if (r.status !== 0) throw new SpeckError(`gh couldn't look for ${pad}'s pull request: ${lastLine(r)}. Nothing was changed.`);
  let list;
  try { list = JSON.parse(r.stdout || '[]'); } catch { list = null; }
  if (!Array.isArray(list)) throw new SpeckError(`gh's list of pull requests for ${branch} wasn't a JSON list, so speck couldn't tell whether ${pad} has one. Nothing was changed.`);
  const of = state => list.find(p => p && Number.isInteger(p.number) && String(p.state).toUpperCase() === state);
  const pr = of('MERGED') || of('OPEN');
  if (!pr) return null;
  const v = runGh(gh, ['pr', 'view', String(pr.number), '--json', VIEW], repo);
  if (v.status !== 0) throw new SpeckError(`gh couldn't read ${pad}'s pull request, ${pr.url}: ${lastLine(v)}. Nothing was changed.`);
  try {
    const view = JSON.parse(v.stdout);
    if (view && typeof view === 'object' && !Array.isArray(view)) return { ...view, number: pr.number, url: view.url || pr.url, state: String(view.state || pr.state).toUpperCase() };
  } catch { /* below */ }
  throw new SpeckError(`gh's view of ${pad}'s pull request wasn't JSON, so speck couldn't tell whether it can be merged. Nothing was changed.`);
}

const FAILED = new Set(['FAILURE', 'ERROR', 'CANCELLED', 'TIMED_OUT', 'ACTION_REQUIRED', 'STARTUP_FAILURE', 'STALE']);
const checkName = c => c?.name || c?.context || 'a check';

// Whether GitHub says an open pull request conflicts with its base branch.
const conflicts = v => String(v.mergeable).toUpperCase() === 'CONFLICTING' || String(v.mergeStateStatus).toUpperCase() === 'DIRTY';

// Why GitHub won't merge an open pull request yet, in a few words, or '' when nothing stands in the way.
export function whyNotMergeable(v) {
  const checks = Array.isArray(v.statusCheckRollup) ? v.statusCheckRollup.filter(c => c && typeof c === 'object') : [];
  const failing = checks.filter(c => FAILED.has(String(c.conclusion || c.state || '').toUpperCase())).map(checkName);
  if (failing.length) return `its checks are failing (${failing.join(', ')})`;
  const pending = checks.filter(c => c.status ? String(c.status).toUpperCase() !== 'COMPLETED' : ['PENDING', 'EXPECTED'].includes(String(c.state).toUpperCase())).map(checkName);
  if (pending.length) return `its checks haven't finished (${pending.join(', ')})`;
  if (v.isDraft === true) return 'it\'s a draft';
  if (conflicts(v)) return 'it conflicts with the base branch';
  const review = String(v.reviewDecision || '').toUpperCase();
  if (review === 'REVIEW_REQUIRED') return 'GitHub requires an approving review first';
  if (review === 'CHANGES_REQUESTED') return 'a reviewer on GitHub asked for changes';
  if (String(v.mergeable).toUpperCase() === 'UNKNOWN') return 'GitHub is still working out whether it can be merged';
  if (String(v.mergeStateStatus).toUpperCase() === 'BLOCKED') return 'the base branch\'s rules on GitHub block it';
  return '';
}

// What speck run compares to see whether a pull request has changed since its last try, with its state, or null when
// gh can't say. A missing pull request is null too: opening one is `speck pr`'s job.
export function prLook(repo, cfg, id, gh = 'gh') {
  try {
    const pad = padId(id), branch = ticketBranch(repo, cfg, pad);
    const v = findPr(gh, repo, pad, branch, cfg.base_branch);
    if (!v) return null;
    const checks = (Array.isArray(v.statusCheckRollup) ? v.statusCheckRollup : []).map(c => [checkName(c), c?.status, c?.conclusion, c?.state]);
    return { state: v.state, key: JSON.stringify([v.state, v.isDraft, v.mergeable, v.mergeStateStatus, v.reviewDecision, v.headRefOid, checks]) };
  } catch { return null; }
}

// The local base branch brought up to date with the remote's, in `at`, where it's checked out: a fast-forward, or a
// merge when your base has commits the remote's doesn't. Throws, putting it back, when that can't be done.
function catchUp(at, remote, base, pad) {
  const again = `Run \`git pull\` where ${base} is checked out, then \`speck ship ${pad}\` again to finish tidying up.`;
  const fetched = sh('git', ['fetch', '-q', remote, base], { cwd: at });
  if (fetched.status !== 0) throw new SpeckError(`${pad}'s pull request is merged on GitHub, but speck couldn't fetch ${base} from ${remote} (${lastLine(fetched)}). ${again}`);
  const theirs = git(['rev-parse', 'FETCH_HEAD'], at).trim();
  if (isAncestor(at, theirs, 'HEAD')) return;
  const merged = sh('git', ['merge', '-q', '--no-edit', '--no-autostash', '-m', `Merge ${remote}/${base} into ${base}`, theirs], { cwd: at });
  if (merged.status === 0) return console.log(`Brought ${base} up to date with ${remote}.`);
  sh('git', ['merge', '--abort'], { cwd: at });
  throw new SpeckError(`${pad}'s pull request is merged on GitHub, but speck couldn't bring your ${base} up to date with ${remote}'s (${lastLine(merged)}). ${again}`);
}

// Files the ticket as done on the base branch, checked out in `at`, committing only its file, when the merged pull
// request didn't, as one opened before 0315 doesn't. Gives back whether it did: then that commit is on this computer only.
function fileDone(at, pad) {
  let t;
  try { t = findTicket(at, pad); } catch (e) { if (e instanceof SpeckError) { console.log(`${pad}'s ticket isn't on the base branch, so there was no ticket to file as done.`); return false; } throw e; }
  if (t.fm.status === 'done') return false;
  writeField(t, 'status', 'done');
  const files = [placeTicket(at, t, 'done'), t.file];
  git(['add', '-A', '--', ...files], at);
  const c = sh('git', ['commit', '-q', '-m', `speck(${pad}): ship`, '--', ...files], { cwd: at });
  if (c.status !== 0) throw new SpeckError(`${pad}'s pull request is merged, but speck couldn't commit its ticket as done (${lastLine(c)}). Fix that, then run \`speck ship ${pad}\` again to finish tidying up.`);
  return true;
}

// Everything after the merge on GitHub, as a local ship tidies up after its merge.
function tidy(repo, cfg, pad, branch, remote, { main, work, mergeAt, linked }) {
  const base = cfg.base_branch;
  // Without the base branch checked out anywhere, it's checked out in the ticket's folder, which is clean, as a local ship does.
  if (git(['branch', '--show-current'], mergeAt).trim() !== base) {
    const out = sh('git', ['checkout', '-q', base], { cwd: mergeAt });
    if (out.status !== 0) throw new SpeckError(`${pad}'s pull request is merged, but speck couldn't check ${base} out in ${mergeAt} (${lastLine(out)}). Check it out there, then run \`speck ship ${pad}\` again to finish tidying up.`);
  }
  catchUp(mergeAt, remote, base, pad);
  const filedHere = fileDone(mergeAt, pad);
  const removed = linked ? sh('git', ['worktree', 'remove', '--force', linked], { cwd: main }) : null;
  if (removed && removed.status !== 0) console.log(`Couldn't remove the worktree at ${linked} (${lastLine(removed)}), so ${branch} is kept. Run \`git worktree remove ${linked}\`, then \`git branch -D ${branch}\`.`);
  else {
    if (removed) console.log(`Removed the ticket's worktree at ${linked}.`);
    git(['branch', '-D', branch], main);
  }
  deleteRemoteBranch(main, remote, branch); // its commits are in the remote's base branch already, through the pull request
  removeScratch(pad);
  if (!filedHere) return;
  // Nothing is pushed straight to the base branch, which may only take pull requests: kept in the ship record for the panel (0204).
  const e = new SpeckError(`${pad}'s pull request is merged, but it didn't file the ticket as done, as one opened before speck did that doesn't, so the done ticket is on your ${base} only. speck pushes nothing straight to ${base} in pull request mode: push it to ${remote}, or open a pull request for it, once ${remote} takes it.`);
  e.unpushed = { remote, base, sha: git(['rev-parse', base], main).trim() };
  throw e;
}

// The whole suite on the ticket merged with the remote's base branch as it is now, as a local ship tests what lands,
// in `at`, where its branch is checked out. Throws, as a local ship does, when it fails; nothing else changes.
function testLanding(at, cfg, pad, branch, remote) {
  const base = cfg.base_branch;
  const fetched = sh('git', ['fetch', '-q', remote, base], { cwd: at });
  if (fetched.status !== 0) throw new SpeckError(`speck couldn't fetch ${base} from ${remote} to test ${pad} as it would land (${lastLine(fetched)}), so its pull request wasn't merged. Nothing was changed.`);
  const target = git(['rev-parse', 'FETCH_HEAD'], at).trim(), tip = git(['rev-parse', branch], at).trim();
  const candidate = candidateMerge(at, branch, target, `speck(${pad}): test`);
  if (!candidate) throw new SpeckError(`${branch} conflicts with ${remote}'s ${base}, so ${pad}'s pull request wasn't merged. Merge ${base} into it, get it reviewed, then ship again. Nothing was changed.`, 13);
  const r = testMerged(at, cfg, branch, candidate);
  if (!r.ok) throw testFailure(at, cfg, base, target, { moved: !isAncestor(at, target, tip), failing: failingTests(r.output) });
}

// `speck ship <id>` in pull request mode. `auto` is --auto: an open pull request is merged only when auto_ship covers
// the ticket, but one merged on GitHub is always tidied up after, as you merged it there.
export function shipPrTicket(repo, id, { auto = false, gh = 'gh' } = {}) {
  const cfg = loadConfig(repo), pad = padId(id), base = cfg.base_branch;
  const branch = ticketBranch(repo, cfg, pad);
  const folders = shipFolders(repo, branch, base);
  const { work } = folders;
  if (folders.astray) putBranchBack(work, branch, folders.astray);
  if (git(['status', '--porcelain'], work).trim()) throw new SpeckError(`${work} has uncommitted or untracked changes. Commit or remove them, then ship again. Nothing was changed.`);
  const remote = sh('git', ['config', `branch.${base}.remote`], { cwd: repo }).stdout.trim();
  if (!remote) throw new SpeckError(`${base} has no remote set, so ${pad} can't have a pull request to merge. Set one with \`git branch --set-upstream-to=origin/${base} ${base}\`. Nothing was changed.`);
  ghReady(gh, repo, pad);
  const v = findPr(gh, repo, pad, branch, base);
  if (!v) throw new SpeckError(`${pad} has no open or merged pull request, so there's nothing to merge. Run \`speck pr ${pad}\` to open one. Nothing was changed.`);
  const local = git(['rev-parse', branch], repo).trim();
  const head = doneTip(repo, pad, `refs/heads/${branch}`); // what the pull request's head should be: the branch with its ticket filed as done
  if (v.state === 'MERGED') {
    if (!v.headRefOid || (v.headRefOid !== local && !isAncestor(repo, local, v.headRefOid)))
      throw new SpeckError(`${pad}'s pull request, ${v.url}, was merged without ${branch}'s latest commits, so speck left it alone. Nothing was changed.`);
    console.log(`${pad}'s pull request, ${v.url}, is already merged on GitHub, so speck is only tidying up.`);
  } else {
    const folder = branchFolder(repo, cfg, pad, branch);
    try {
      const why = auto ? autoShipBlocker(folder.at, cfg, pad) : '';
      if (why) throw new SpeckError(`Not merging automatically: ${why}. The ticket stays approved, waiting for you to run /speck-ship ${pad}.`, 12);
      shipChecks(folder.at, cfg, pad, branch);
      if (!v.headRefOid) throw new SpeckError(`gh didn't say which commit ${pad}'s pull request, ${v.url}, is at, so speck couldn't check it's the one the reviewer approved. Nothing was changed.`);
      // One opened before 0315 is the branch alone: the commit filing the ticket as done is pushed to it first.
      if (v.headRefOid === local && head !== local) {
        const push = pushDone(repo, remote, branch, pad);
        if (push.status !== 0) throw new SpeckError(`${pad}'s pull request doesn't file the ticket as done, and speck couldn't push the commit that does to ${branch} (${lastLine(push)}), so it wasn't merged. Nothing else was changed.`);
        throw new SpeckError(`${pad}'s pull request didn't file the ticket as done, so speck pushed the commit that does to ${branch} and didn't merge it yet. Ship again once GitHub has run its checks on it; speck run does that by itself.`);
      }
      if (v.headRefOid !== head) throw new SpeckError(isAncestor(repo, v.headRefOid, local) || pushedEarlier(repo, v.headRefOid, branch, pad)
        ? `${branch} has commits its pull request doesn't, so it wasn't merged. Run \`speck pr ${pad}\` to push them, then ship again. Nothing was changed.`
        : `${pad}'s pull request, ${v.url}, has commits that aren't on ${branch}, so the reviewer hasn't seen them and it wasn't merged. Nothing was changed.`);
      // 0323: a conflict comes first, whatever else holds it, and has a conflict's exit code, so speck run hands the
      // ticket back to its build to merge the base branch in, as a conflict found by ship's own merge is (0194).
      if (conflicts(v)) {
        sh('git', ['fetch', '-q', remote, base], { cwd: folder.at }); // so the build merges the remote's base as it is now
        throw new SpeckError(`${pad}'s pull request, ${v.url}, conflicts with ${remote}/${base} on GitHub, so it wasn't merged. Merge ${remote}/${base} into ${branch}, resolve the conflicts, get the result reviewed, then ship again. Nothing was changed.`, 13);
      }
      const held = whyNotMergeable(v);
      if (held) throw new SpeckError(`${pad}'s pull request, ${v.url}, can't be merged yet: ${held}. Nothing was changed.`);
      testLanding(folder.at, cfg, pad, branch, remote);
    } finally { removeFolder(repo, folder.temp); }
    const merged = runGh(gh, ['pr', 'merge', String(v.number), '--merge', '--match-head-commit', head], repo);
    if (merged.status !== 0) throw new SpeckError(`GitHub didn't merge ${pad}'s pull request, ${v.url}: ${lastLine(merged) || `gh exited with ${merged.status}`}. Nothing was changed.`);
    // With a merge queue or auto-merge, gh succeeds having only queued it: tidying up waits until GitHub has merged it.
    if (findPr(gh, repo, pad, branch, base)?.state !== 'MERGED') throw new SpeckError(`gh accepted ${pad}'s pull request, ${v.url}, but GitHub hasn't merged it yet, as with a merge queue, so nothing was tidied up. Ship it again once it's merged; speck run does that by itself.`);
    console.log(`Merged ${pad}'s pull request on GitHub: ${v.url}.`);
  }
  tidy(repo, cfg, pad, branch, remote, folders);
  console.log(`Shipped ${pad}: its pull request is merged into ${base}, the ticket is done, and its branch is deleted.`);
}
