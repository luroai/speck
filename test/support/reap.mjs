// Ends every process a test file started, for test/support/tmp.mjs. A process belongs to the file if it descends from
// the file's own process, if its environment holds one of `env` (each NAME=value, which every process the file starts
// inherits, even in a session or process group of its own), if its working folder or command line is in `folder`, or
// if it descends from one of those. A process whose parent has exited is no longer in anyone's tree, so a watch every
// WATCH_MS remembers each one it finds by its pid and start time: one seen while it was tied stays the file's after
// that, and a pid reused by another process is never mistaken for it. The only one it can miss has no tie of its own
// and lost its parent within WATCH_MS of being started. Linux reads /proc; macOS asks ps and lsof. Elsewhere it finds
// only the file's own descendants, from ps.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

export const WATCH_MS = 250;
const linux = process.platform === 'linux', darwin = process.platform === 'darwin';

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return r.status === 0 ? r.stdout : '';
};
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Every process, as pid -> { ppid, start }, where start tells this process apart from a later one with its pid.
function table() {
  const t = new Map();
  if (linux) {
    let dirs = [];
    try { dirs = fs.readdirSync('/proc').filter(d => /^\d+$/.test(d)); } catch { return t; }
    for (const d of dirs) {
      try {
        const stat = fs.readFileSync(`/proc/${d}/stat`, 'utf8');
        const f = stat.slice(stat.lastIndexOf(')') + 2).split(' '); // after "pid (name) ": state ppid ... starttime
        t.set(Number(d), { ppid: Number(f[1]), start: f[19] });
      } catch { /* gone */ }
    }
    return t;
  }
  for (const l of run('ps', ['-A', '-o', 'pid=,ppid=,lstart=']).trim().split('\n')) {
    const [pid, ppid, ...start] = l.trim().split(/\s+/);
    if (Number.isInteger(Number(pid)) && Number.isInteger(Number(ppid))) t.set(Number(pid), { ppid: Number(ppid), start: start.join(' ') });
  }
  return t;
}

export function reaper({ env, folder }) {
  const inFolder = s => s === folder || s.startsWith(folder + '/');
  const spared = new Set([process.pid, process.ppid]);
  const known = new Map(); // pid -> start of each process found to be the file's
  const marked = new Map(); // `${pid} ${start}` -> whether its environment or command line ties it to the file
  const key = (pid, t) => `${pid} ${t.get(pid).start}`;

  // Linux: whether a process's environment or command line ties it to the file. Neither changes, so each is read once.
  function markedLinux(pid, t) {
    const k = key(pid, t);
    if (marked.has(k)) return marked.get(k);
    let tie = false;
    try {
      const vars = fs.readFileSync(`/proc/${pid}/environ`, 'utf8').split('\0');
      const args = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0');
      tie = env.some(e => vars.includes(e)) || args.some(a => a.includes(folder));
    } catch { /* gone, or not ours */ }
    marked.set(k, tie);
    return tie;
  }
  // macOS: ps -E shows each process's environment after its command line, so one pattern covers both.
  function markedDarwin() {
    const has = [...env.map(e => `(^|\\s)${escape(e)}(\\s|$)`), escape(folder)].map(r => new RegExp(r));
    return new Set(run('ps', ['-A', '-E', '-ww', '-o', 'pid=,command=']).split('\n')
      .filter(l => has.some(h => h.test(l))).map(l => Number(l.trim().split(/\s+/)[0])).filter(Number.isInteger));
  }
  // The processes working in `folder`. macOS can't read another process's working folder without lsof.
  function working(t) {
    const found = new Set();
    if (linux) {
      for (const pid of t.keys()) {
        try { if (inFolder(fs.readlinkSync(`/proc/${pid}/cwd`).replace(/ \(deleted\)$/, ''))) found.add(pid); } catch { /* gone, or not ours */ }
      }
    } else if (darwin) {
      let pid = null;
      for (const l of run('lsof', ['-a', '-d', 'cwd', '-u', String(process.getuid()), '-Fpn']).split('\n')) {
        if (l[0] === 'p') pid = Number(l.slice(1));
        else if (l[0] === 'n' && t.has(pid) && inFolder(l.slice(1))) found.add(pid);
      }
    }
    return found;
  }

  // Everything that's the file's now: what's tied to it, what it remembers, and every descendant of those.
  function owned(t, withFolder) {
    const found = new Set();
    const darwinMarked = darwin ? markedDarwin() : null;
    for (const [pid, { ppid, start }] of t) {
      if (spared.has(pid)) continue;
      if (ppid === process.pid || known.get(pid) === start || (darwinMarked ? darwinMarked.has(pid) : linux && markedLinux(pid, t))) found.add(pid);
    }
    if (withFolder) for (const pid of working(t)) if (!spared.has(pid)) found.add(pid);
    for (let grew = true; grew;) {
      grew = false;
      for (const [pid, { ppid }] of t) if (!found.has(pid) && !spared.has(pid) && found.has(ppid)) { found.add(pid); grew = true; }
    }
    return found;
  }

  // Remembers every process that's the file's now, so it's still found after its parent has gone. Forgets what has
  // ended, so a later process given the same pid isn't taken for it.
  function remember() {
    const t = table();
    for (const [pid, start] of known) if (t.get(pid)?.start !== start) known.delete(pid);
    for (const k of marked.keys()) { const pid = Number(k.split(' ')[0]); if (!t.has(pid) || key(pid, t) !== k) marked.delete(k); }
    for (const pid of owned(t, false)) known.set(pid, t.get(pid).start);
  }

  // Kills every process that's the file's, except this process and its parent. Each pass stops what it finds, so
  // nothing can start more or slip out of the tree while it looks again, then everything found is killed.
  // Synchronous, so it also works from an 'exit' handler. Returns the pids it killed.
  function reap() {
    const held = new Map();
    for (let pass = 0; pass < 20; pass++) {
      const t = table();
      const fresh = [...owned(t, true)].filter(p => !held.has(p));
      if (!fresh.length) break;
      for (const p of fresh) {
        try { process.kill(p, 'SIGSTOP'); } catch { /* gone */ }
        held.set(p, t.get(p).start);
        known.set(p, t.get(p).start);
      }
    }
    // Only a process that's still the one stopped: a pid freed meanwhile could have gone to another process.
    const now = table();
    for (const [p, start] of held) if (now.get(p)?.start === start) try { process.kill(p, 'SIGKILL'); } catch { /* gone */ }
    return [...held.keys()];
  }

  return { remember, reap };
}
