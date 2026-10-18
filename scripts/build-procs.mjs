// Finding a build's processes, every one it started, and signalling them, for speck pause, play and stop.

import fs from 'node:fs';
import { SpeckError, sh } from './core.mjs';
import { BUILD_ENV } from './build-env.mjs';

// Every process, as [pid, ppid, pgid].
export function processRows() {
  const r = sh('ps', ['-A', '-o', 'pid=,ppid=,pgid=']);
  if (r.status !== 0) throw new SpeckError(`Couldn't list processes with ps (${(r.stderr || '').trim() || `it exited with ${r.status}`}). Try again.`);
  return r.stdout.trim().split('\n').map(l => l.trim().split(/\s+/).map(Number)).filter(a => a.length === 3 && a.every(Number.isInteger));
}

// The processes whose environment holds `entry` (NAME=value). Linux reads /proc; macOS asks ps for each process's
// environment. Anywhere else, or for a process whose environment can't be read, it finds nothing.
function processesWithEnv(entry) {
  if (process.platform === 'linux') {
    const found = [];
    for (const d of fs.readdirSync('/proc').filter(d => /^\d+$/.test(d))) {
      try { if (fs.readFileSync(`/proc/${d}/environ`, 'utf8').split('\0').includes(entry)) found.push(Number(d)); } catch { /* gone, or not ours */ }
    }
    return found;
  }
  if (process.platform !== 'darwin') return [];
  const r = sh('ps', ['-A', '-E', '-ww', '-o', 'pid=,command=']);
  if (r.status !== 0) throw new SpeckError(`Couldn't list processes with ps (${(r.stderr || '').trim() || `it exited with ${r.status}`}). Try again.`);
  const has = new RegExp(`(^|\\s)${entry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`);
  return r.stdout.split('\n').filter(l => has.test(l)).map(l => Number(l.trim().split(/\s+/)[0])).filter(Number.isInteger);
}

// A build and every process it started, still running: its process group, every process holding its session in
// BUILD_ENV, and everything descended from those. Claude Code runs each Bash command in a session of its own, and a
// background process whose parent has exited is no longer in the build's tree, so neither the group nor the tree
// alone would reach them all. This process and its own children are left out, so a build that pauses itself still
// finishes saying so. `me` is the process left out with its children: this one, or the one that asked for the list.
export function buildProcesses(pid, session, me = process.pid) {
  const rows = processRows();
  const self = p => p === me || rows.some(([q, pp]) => q === p && pp === me);
  const found = new Set(rows.filter(([p, , g]) => p === pid || g === pid).map(([p]) => p));
  if (typeof session === 'string' && session) for (const p of processesWithEnv(`${BUILD_ENV}=${session}`)) found.add(p);
  for (let grew = true; grew;) {
    grew = false;
    for (const [p, pp] of rows) if (!found.has(p) && found.has(pp)) { found.add(p); grew = true; }
  }
  return [...found].filter(p => !self(p));
}

// Sends `signal` to a build and everything it started. Stopping goes round again for any process started meanwhile.
// A process that has gone meanwhile is skipped. Returns the processes it signalled, and the first error that stopped
// it (null if none), so the caller can undo what it did. A Codex build's environment holds its env_session (0289).
export function signalBuild(b, signal) {
  const sent = [];
  try {
    for (let pass = 0; pass < 10; pass++) {
      const fresh = buildProcesses(b.pid, b.rec.env_session ?? b.rec.session).filter(p => !sent.includes(p));
      if (!fresh.length) break;
      for (const p of fresh) {
        try { process.kill(p, signal); sent.push(p); }
        catch (e) { if (e.code !== 'ESRCH') throw new SpeckError(`Couldn't send ${signal} to process ${p} (${e.code || e.message}).`); }
      }
      if (signal !== 'SIGSTOP') break;
    }
  } catch (e) { return { sent, error: e instanceof SpeckError ? e.message : String(e?.message || e) }; }
  return { sent, error: null };
}

export const carryOn = pids => { for (const p of pids) try { process.kill(p, 'SIGCONT'); } catch { /* gone */ } };

// True if a running process names the session as a word of its command line, as a build resumed by hand does
// (`claude --resume <session>`). If processes can't be listed it's taken as in use, so a session is never resumed twice.
export function sessionInUse(session) {
  if (typeof session !== 'string' || !session) return false;
  const r = sh('ps', ['-A', '-ww', '-o', 'args=']);
  if (r.status !== 0) return true;
  return r.stdout.split('\n').some(l => l.split(/[\s=]+/).includes(session));
}

// Every process still running, as a set of pids. One that has exited and waits only for its parent to collect it is over.
export function runningPids() {
  const r = sh('ps', ['-A', '-o', 'pid=,stat=']);
  if (r.status !== 0) throw new SpeckError(`Couldn't list processes with ps (${(r.stderr || '').trim() || `it exited with ${r.status}`}).`);
  return new Set(r.stdout.trim().split('\n').map(l => l.trim().split(/\s+/)).filter(([p, s]) => /^\d+$/.test(p) && !/^Z/.test(s || '')).map(([p]) => Number(p)));
}
