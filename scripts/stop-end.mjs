// 0218: ends a build that `speck stop` has held, forcing any process that ignores it about five seconds after first
// asking. The wait is timed, and each check of what's still running runs in a process of its own, cut short at the deadline.
import { spawnSync } from 'node:child_process';
import { SpeckError } from './speck.mjs';
import { runningPids } from './run.mjs';

const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// Run by checkBuild in a process of its own: prints the build's processes still running, among those known and any
// found now, leaving out the process that asked and its children.
const CHECK = `try {
  const { run, pid, session, known } = JSON.parse(process.env.SPECK_CHECK);
  const m = await import(run);
  const found = new Set(known);
  for (const p of m.buildProcesses(pid, session, process.ppid)) found.add(p);
  const running = m.runningPids();
  console.log(JSON.stringify([...found].filter(p => running.has(p))));
} catch (e) { console.error(e?.message || String(e)); process.exit(1); }`;

// The build's processes still running, among `known` and any found now. Listing every process can be slow on a busy
// machine and can't be cut short in this process, so it runs in one of its own, ended after `ms`: null if it was (0218).
export function checkBuild(b, known, ms) {
  const env = { ...process.env, SPECK_CHECK: JSON.stringify({ run: new URL('./run.mjs', import.meta.url).href, pid: b.pid, session: b.rec.env_session ?? b.rec.session ?? '', known }) };
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', CHECK], { env, encoding: 'utf8', timeout: Math.max(1, Math.ceil(ms)), killSignal: 'SIGKILL', maxBuffer: 64 * 1024 * 1024 });
  if (r.error?.code === 'ETIMEDOUT') return null;
  if (r.error || r.status !== 0) throw new SpeckError(`Couldn't list ${b.id ?? 'the build'}'s processes (${(r.stderr || '').trim() || r.error?.message || `it exited with ${r.status}`}).`);
  try { return JSON.parse(r.stdout).filter(Number.isInteger); } catch { throw new SpeckError(`Couldn't list ${b.id ?? 'the build'}'s processes: its list couldn't be read.`); }
}

// Ends a build and everything it started, already held with SIGSTOP (`held`) so none can start anything more: asks each
// to end (SIGTERM, and SIGCONT so a held one hears it), and ends any still there five seconds after first asking with
// SIGKILL. The wait is timed, and each check of what's still running is cut short at the deadline, so a slow check
// can't stretch it (0218): a check cut short leaves the processes still running at the last one to be ended.
// Every process it has found stays on its list, so one that leaves the build's tree when its parent ends is still ended.
// Returns the processes still running at the end. `opts` stands in for the clock, pauses, checks and signals in tests.
export function endBuild(b, held, { now: clock = () => performance.now(), pause = sleep, check = (known, ms) => checkBuild(b, known, ms), kill = process.kill.bind(process) } = {}) {
  const known = new Set(held);
  const left = ms => { const pids = check([...known], ms); for (const p of pids ?? []) known.add(p); return pids; };
  const each = (pids, signal) => { for (const p of pids) try { kill(p, signal); } catch { /* gone */ } };
  const asked = new Set();
  const ask = pids => { const fresh = pids.filter(p => !asked.has(p)); for (const p of fresh) asked.add(p); each(fresh, 'SIGTERM'); each(fresh, 'SIGCONT'); };
  let now = [...known];
  ask(now);
  const until = clock() + 5000;
  while (now.length && clock() < until) {
    const found = left(until - clock());
    if (found) { now = found; ask(now); }
    if (now.length && clock() < until) pause(Math.min(100, until - clock()));
  }
  for (let i = 0; i < 20 && now.length; i++) { each(now, 'SIGKILL'); pause(100); now = left(5000) ?? now; }
  return now;
}
