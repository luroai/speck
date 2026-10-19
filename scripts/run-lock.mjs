// 0321: only one speck run ever works in a repo, whatever happens to its lock (run.lock, taken in run.mjs). The speck
// run holding it checks it on each of its checks and stops once it no longer does; one starting looks at the Foreman's
// record as well as the lock; and turning it off waits for each speck run on new code it hosts (0247) as well.
import fs from 'node:fs';
import path from 'node:path';
import { sh } from './core.mjs';
import { pidAlive } from './run-switch.mjs';
import { processRows } from './build-procs.mjs';
import { readForeman } from './foreman.mjs';

// A process's folder, or null when it can't be read: from /proc on Linux, and from lsof elsewhere, such as macOS.
export function processCwd(pid, platform = process.platform) {
  if (platform === 'linux') { try { return fs.realpathSync(`/proc/${pid}/cwd`); } catch { return null; } }
  const r = sh('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn']);
  const line = r.status === 0 ? r.stdout.split('\n').find(l => l.startsWith('n')) : null;
  try { return line ? fs.realpathSync(line.slice(1)) : null; } catch { return null; }
}

// True when the process is `speck run`, from its command line, so a pid since reused by another program never counts.
// Given `repo`, it must also be working in that repo: its folder is the repo or one inside it. One whose folder can't
// be read doesn't count.
export function isSpeckRun(pid, repo = null) {
  const r = sh('ps', ['-ww', '-o', 'args=', '-p', String(pid)]);
  if (r.status !== 0 || !/speck(\.mjs)?\s+run(\s|$)/.test(r.stdout.trim())) return false;
  if (!repo) return true;
  const cwd = processCwd(pid);
  let root;
  try { root = fs.realpathSync(repo); } catch { return false; }
  return cwd !== null && (cwd === root || cwd.startsWith(root + path.sep));
}

// A speck run still working in this repo though its lock is gone or names a process that has gone: the one the
// Foreman's record names, while it's alive and is speck run in this repo. Its pid, or null.
export function recordedRun(repo, runs) {
  const pid = readForeman(runs)?.lock;
  return Number.isInteger(pid) && pid > 0 && pid !== process.pid && pidAlive(pid) && isSpeckRun(pid, repo) ? pid : null;
}

// Why the speck run whose lock `pid` holds (the process you started) no longer holds it, or null while it does. A lock
// that can't be read for any reason but being gone counts as held, so a passing read error stops nothing.
export function lockLost(runs, pid) {
  let text;
  try { text = fs.readFileSync(path.join(runs, 'run.lock'), 'utf8').trim(); } catch (e) { return e.code === 'ENOENT' ? 'its lock file is gone' : null; }
  if (text === String(pid)) return null;
  const other = /^[1-9]\d*$/.test(text) ? Number(text) : null;
  return other !== null && pidAlive(other) ? `its lock names another speck run, process ${other}` : `its lock names process ${text || '(none)'}, not ${pid}`;
}

// What a speck run asks before each check and before writing the Foreman's record: true while the lock still names
// `pid`. Once it doesn't, it says so once in its output (run.log, from the panel) and calls stop(), which ends it, so
// it launches no more builds or ships and leaves those running to carry on.
export function keepsLock(runs, pid, stop) {
  return () => {
    const why = lockLost(runs(), pid);
    if (!why) return true;
    console.log(`speck run (process ${process.pid}) no longer holds this repo's lock: ${why}. It launches no more builds or ships, and is stopping.`);
    stop();
    return false;
  };
}

// The processes of the speck run `pid` is: itself, and each speck run on new code it hosts or is starting, which are its
// children in its own process group. Builds and ships run in process groups of their own, so they're never counted.
export function runProcesses(pid) {
  const rows = processRows();
  const group = rows.find(([p]) => p === pid)?.[2];
  if (group === undefined) return [];
  return [pid, ...rows.filter(([p, parent, g]) => parent === pid && g === group && p !== pid).map(([p]) => p)];
}
