// Whether a ship that merged but couldn't push is still not on the remote (0204, 0508).
import { sh, parseTicket } from './core.mjs';

// True while `unpushed`'s commit isn't yet on its remote's copy of the base branch, as git last saw it: a push or fetch
// updates that, so the record clears once the commit has gone, by whatever push. An unreadable record counts as pushed.
// It also clears once that copy has ticket `pad` in speck/tickets/done/ as done, so a commit that a rewritten history
// or a squash left behind doesn't hold the warning for good (0508).
export function notPushed(runs, { remote, base, sha } = {}, pad) {
  const name = v => typeof v === 'string' && /^[\w./-]+$/.test(v) && !v.startsWith('-');
  if (!name(remote) || !name(base) || !/^[0-9a-f]{7,64}$/.test(String(sha))) return false;
  const tracked = `refs/remotes/${remote}/${base}`;
  if (sh('git', ['rev-parse', '--verify', '-q', tracked], { cwd: runs }).status !== 0) return true;
  if (sh('git', ['merge-base', '--is-ancestor', sha, tracked], { cwd: runs }).status === 0) return false;
  return !doneOn(runs, tracked, pad);
}

// True when `ref` has ticket `pad`'s file in speck/tickets/done/ with status done.
function doneOn(runs, ref, pad) {
  const ls = sh('git', ['ls-tree', '-z', '--full-tree', '--name-only', `${ref}:speck/tickets/done`], { cwd: runs });
  if (ls.status !== 0) return false;
  return ls.stdout.split('\0').some(f => {
    if (!f.startsWith(`${pad}-`) || !f.endsWith('.md')) return false;
    const show = sh('git', ['show', `${ref}:speck/tickets/done/${f}`], { cwd: runs });
    try { return show.status === 0 && parseTicket(show.stdout).fm.status === 'done'; } catch { return false; }
  });
}
