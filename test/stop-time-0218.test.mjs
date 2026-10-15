// 0218: speck stop forces a build's process that ignores it to end about five seconds after first asking, timing the
// wait rather than counting checks and cutting a slow check short at the deadline, so a slow process listing can't stretch it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { endBuild, checkBuild, runningPids } from '../scripts/run.mjs';

const gone = pid => { try { process.kill(pid, 0); return false; } catch (e) { return e.code === 'ESRCH'; } };
const until = async (fn, ms = 5000) => { const end = Date.now() + ms; while (Date.now() < end) { if (fn()) return true; await new Promise(r => setTimeout(r, 20)); } return fn(); };

// A process that prints `ready` once it's listening; `ignore` makes it ignore SIGTERM.
async function child(ignore) {
  const c = spawn(process.execPath, ['-e', `${ignore ? "process.on('SIGTERM', () => {});" : ''} console.log('ready'); setInterval(() => {}, 1000);`], { stdio: ['ignore', 'pipe', 'ignore'] });
  await new Promise(res => c.stdout.once('data', res));
  return c;
}

// A fake clock that starts at 0. Each check of the running processes takes the next of `checks` ms (the last one
// repeating), or is cut short at the time it's allowed, as checkBuild's is. Each pause takes what it's asked (and up to
// 10 ms of real time, so a process asked to end has time to). It records when SIGTERM was first sent and when SIGKILL was.
function slowClock(checks, pid) {
  const c = { t: 0, asked: null, killed: null, n: 0 };
  const real = process.kill;
  const kill = (p, signal) => {
    if (p === pid && signal === 'SIGTERM' && c.asked === null) c.asked = c.t;
    if (p === pid && signal === 'SIGKILL' && c.killed === null) c.killed = c.t;
    return real.call(process, p, signal);
  };
  const check = (known, ms) => {
    const takes = checks[Math.min(c.n++, checks.length - 1)];
    if (takes > ms) { c.t += ms; return null; }
    c.t += takes;
    const running = runningPids();
    return known.filter(p => running.has(p));
  };
  c.opts = { now: () => c.t, pause: ms => { c.t += ms; Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Math.min(ms, 10)); }, check, kill };
  return c;
}

for (const checks of [[200], [450], [2000], [6500, 200], [200, 6500, 200]]) {
  test(`0218 AC1: a process that ignores the request is forced to end within 6 seconds of first asking, with checks taking ${checks.join(' then ')} ms`, async () => {
    const c = await child(true);
    try {
      const k = slowClock(checks, c.pid);
      assert.deepEqual(endBuild({ pid: c.pid, rec: {} }, [c.pid], k.opts), [], 'nothing is left running');
      assert.ok(await until(() => gone(c.pid)), 'the process has ended');
      assert.notEqual(k.asked, null, 'it was asked to end');
      assert.notEqual(k.killed, null, 'it was forced to end');
      const after = k.killed - k.asked;
      assert.ok(after >= 4900 && after <= 6000, `forced ${after} ms after asking`);
    } finally { try { c.kill('SIGKILL'); } catch {} }
  });
}

for (const checks of [[200], [2000, 200]]) {
  test(`0218 AC2: a process that ends when asked is not forced, and stop returns as soon as it has ended, with checks taking ${checks.join(' then ')} ms`, async () => {
    const c = await child(false);
    try {
      const k = slowClock(checks, c.pid);
      const real = Date.now();
      assert.deepEqual(endBuild({ pid: c.pid, rec: {} }, [c.pid], k.opts), []);
      assert.equal(k.killed, null, 'it was never sent SIGKILL');
      assert.ok(await until(() => gone(c.pid)), 'the process has ended');
      assert.ok(k.t <= checks.reduce((a, b) => a + b, 0) + 200, `it returned ${k.t} ms (fake) after it started, not after the full wait`);
      assert.ok(Date.now() - real < 3000, 'it returned promptly');
    } finally { try { c.kill('SIGKILL'); } catch {} }
  });
}

test('0218 AC1: a real check finds the build\'s running processes, and is cut short when it runs out of time', async () => {
  const c = await child(false);
  try {
    assert.deepEqual(checkBuild({ pid: c.pid, rec: {} }, [c.pid], 5000), [c.pid], 'the running process is found');
    assert.equal(checkBuild({ pid: c.pid, rec: {} }, [c.pid], 1), null, 'a check given 1 ms is cut short');
  } finally { try { c.kill('SIGKILL'); } catch {} }
});
