// Where speck ship works: the ticket branch's folder and the base branch's, and putting the branch back in its folder
// when a ship that was killed left it on the merge it was testing (0212).
import fs from 'node:fs';
import { SpeckError, sh, git, worktreeList, worktreePath } from './core.mjs';

// Where shipping happens. The ticket-branch steps run where the branch is checked out (or in this folder if it
// isn't checked out anywhere, as before worktrees). The merge runs where the base branch is checked out, or in
// that same folder if it isn't checked out anywhere. `linked` is the ticket's own worktree, removed after shipping.
// 0212: a ship killed while it tested the merge left that merge checked out detached in the branch's folder, so the
// branch is checked out nowhere. That folder is still the ticket's, as is its worktree where speck start puts it:
// `astray` is then 'merge' for the ship's merge, which shipTicket puts the branch back over, or what else is there.
export function shipFolders(repo, branch, base) {
  const list = worktreeList(repo);
  const main = list[0].path;
  const at = b => list.find(w => w.branch === b)?.path || null;
  let branchAt = at(branch), astray = null;
  const baseAt = at(base);
  if (!branchAt) {
    const tip = git(['rev-parse', branch], repo).trim();
    const merged = w => !w.branch && w.head && sh('git', ['rev-parse', '--verify', '-q', `${w.head}^2`], { cwd: repo }).stdout.trim() === tip;
    const left = list.find(merged), own = list.find(w => w.path === worktreePath(main, branch));
    const w = left || own;
    if (w) {
      branchAt = w.path;
      astray = left ? 'merge' : w.branch ? `the branch ${w.branch}` : `the commit ${String(w.head).slice(0, 7)}`;
    }
  }
  const work = branchAt || fs.realpathSync(repo);
  return { main, work, mergeAt: baseAt || work, linked: branchAt && branchAt !== main ? branchAt : null, astray };
}

// 0212: puts `branch` back in `work`, the ticket's folder, before anything else, when a ship that was killed left it on
// the merge it was testing. Anything else checked out there is refused, as is a merge git won't switch away from.
export function putBranchBack(work, branch, astray) {
  const how = `Run \`git checkout ${branch}\` there, once nothing there needs keeping, then ship again.`;
  if (astray !== 'merge') throw new SpeckError(`The ticket's worktree at ${work} has ${astray} checked out, not ${branch}, so nothing was shipped. ${how}`);
  const out = sh('git', ['checkout', '-q', branch], { cwd: work });
  if (out.status !== 0) throw new SpeckError(`A ship that was stopped partway left the ticket's worktree at ${work} on the merge it was testing, and speck couldn't check ${branch} out again there (${out.stderr.trim().split('\n').pop()}), so nothing was shipped. ${how}`);
  console.log(`Checked ${branch} out again in ${work}: a ship that was stopped partway had left it on the merge it was testing.`);
}
