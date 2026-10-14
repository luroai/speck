// Ends every process a test file started, for test/support/tmp.mjs. A process belongs to the file if its environment
// holds one of `entries` (each NAME=value, which every process the file starts inherits, even in a session or process
// group of its own), or if it descends from one that does (for one started with an environment of its own). Each pass
// stops what it finds, so nothing can start more or slip out of the tree while it looks again, then everything found
// is killed. Synchronous, so it also works from an 'exit' handler. Finds nothing on a platform other than Linux or
// macOS, or if ps can't list processes.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const ps = args => {
  const r = spawnSync('ps', args, { encoding: 'utf8' });
  return r.status === 0 ? r.stdout : '';
};

// [pid, ppid] of every process.
const rows = () => ps(['-A', '-o', 'pid=,ppid=']).trim().split('\n')
  .map(l => l.trim().split(/\s+/).map(Number)).filter(a => a.length === 2 && a.every(Number.isInteger));

// The processes whose environment holds any of `entries`. Linux reads /proc; macOS asks ps for each environment.
function withEnv(entries) {
  if (process.platform === 'linux') {
    const found = [];
    let dirs = [];
    try { dirs = fs.readdirSync('/proc').filter(d => /^\d+$/.test(d)); } catch { return found; }
    for (const d of dirs) {
      try {
        const env = fs.readFileSync(`/proc/${d}/environ`, 'utf8').split('\0');
        if (entries.some(e => env.includes(e))) found.push(Number(d));
      } catch { /* gone, or not ours */ }
    }
    return found;
  }
  if (process.platform !== 'darwin') return [];
  const has = entries.map(e => new RegExp(`(^|\\s)${e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`));
  return ps(['-A', '-E', '-ww', '-o', 'pid=,command=']).split('\n')
    .filter(l => has.some(h => h.test(l))).map(l => Number(l.trim().split(/\s+/)[0])).filter(Number.isInteger);
}

const send = (pid, sig) => { try { process.kill(pid, sig); } catch { /* gone */ } };

// Kills every process holding one of `entries` and everything descended from them, except this process and its
// ancestors. Returns the pids it killed.
export function reap(entries) {
  const spared = new Set([process.pid, process.ppid]);
  const held = new Set();
  for (let pass = 0; pass < 20; pass++) {
    const all = rows();
    const found = new Set(withEnv(entries).filter(p => !spared.has(p)));
    for (const p of held) found.add(p);
    for (let grew = true; grew;) {
      grew = false;
      for (const [p, pp] of all) if (!found.has(p) && !spared.has(p) && found.has(pp)) { found.add(p); grew = true; }
    }
    const fresh = [...found].filter(p => !held.has(p));
    if (!fresh.length) break;
    for (const p of fresh) { send(p, 'SIGSTOP'); held.add(p); }
  }
  for (const p of held) send(p, 'SIGKILL');
  return [...held];
}
