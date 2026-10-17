// speck ship's check of the remote's base branch, before anything else changes: catching up when only the remote is
// ahead, and merging the remote's commits in when each side has commits the other doesn't (0265).
import { SpeckError, sh, git, isAncestor } from './core.mjs';

// Returns the commit to fast-forward the local base to, if any. When the two have diverged and merge without
// conflicts, the merge is committed to the local base straight away, in `mergeAt` when the base is checked out there,
// and kept whatever happens to the ship after it, so the next ship needn't merge again.
export function remoteBaseCatchUp(repo, remote, base, mergeAt) {
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
  mergeRemoteBase(repo, remote, base, mergeAt, ours, theirs);
  return null;
}

function mergeRemoteBase(repo, remote, base, mergeAt, ours, theirs) {
  const diverged = `Your ${base} and ${remote}'s ${base} each have commits the other doesn't`;
  // Worked out in git's object store only, so a conflict refuses with nothing changed.
  const tree = sh('git', ['merge-tree', '--write-tree', '--no-messages', ours, theirs], { cwd: repo });
  if (tree.status === 1) throw new SpeckError(`${diverged}, and they conflict, so nothing was shipped. Combine them with \`git checkout ${base} && git pull\`, then ship again.`);
  if (tree.status !== 0) throw new SpeckError(`${diverged}, and speck couldn't work out their merge, so nothing was shipped: ${(tree.stderr || tree.stdout).trim().split('\n').pop()}`);
  const merged = git(['commit-tree', tree.stdout.split('\n')[0].trim(), '-p', ours, '-p', theirs, '-m', `Merge ${remote}/${base} into ${base}`], repo).trim();
  if (git(['branch', '--show-current'], mergeAt).trim() === base) {
    // A fast-forward to the merge keeps uncommitted changes and untracked files, and refuses, changing nothing, when
    // it would overwrite one. --no-autostash, so merge.autoStash can't stash them and leave them conflicted.
    const ff = sh('git', ['merge', '-q', '--ff-only', '--no-autostash', merged], { cwd: mergeAt });
    if (ff.status !== 0) {
      const files = inTheWay(ff.stderr);
      throw new SpeckError(files.length
        ? `${diverged}, and merging them would overwrite these files in ${mergeAt}, where ${base} is checked out: ${files.join(', ')}. Nothing was shipped and they're untouched. Commit, stash or move them, then ship again.`
        : `${diverged}, and speck couldn't merge them in ${mergeAt}, so nothing was shipped: ${ff.stderr.trim().split('\n').pop()}`);
    }
  } else git(['update-ref', `refs/heads/${base}`, merged, ours], repo);
  const brought = git(['log', '--format=%h %s', `${ours}..${theirs}`], repo).trim().split('\n');
  const more = brought.length > 5 ? `, and ${brought.length - 5} more` : '';
  console.log(`${remote}'s ${base} had commits your ${base} didn't, so speck merged them into your ${base}: ${brought.slice(0, 5).join('; ')}${more}.`);
}

// The files git lists, indented, after saying they'd be overwritten.
function inTheWay(stderr) {
  const files = [];
  let listing = false;
  for (const l of stderr.split('\n')) {
    if (/would be overwritten/.test(l)) { listing = true; continue; }
    if (listing && /^\s+\S/.test(l)) files.push(l.trim());
    else listing = false;
  }
  return files;
}
