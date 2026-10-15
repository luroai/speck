// 0218: speck stop forces a build's process that ignores it to end about five seconds after first asking, counting
// time rather than checks, so a slow process listing doesn't stretch the wait.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { endBuild, runningPids } from '../scripts/run.mjs';

const gone = pid => { try { process.kill(pid, 0); return false; } catch (e) { return e.code === 'ESRCH'; } };
const until = async (fn, ms = 5000) => { const end = Date.now() + ms; while (Date.now() < end) { if (fn()) return true; await new Promise(r => setTimeout(r, 20)); } return fn(); };

// A process with a handler that prints `ready` once it's listening; `ignore` makes it ignore SIGTERM.
async function child(ignore) {
  const c = spawn(process.execPath, ['-e', `${ignore ? "process.on('SIGTERM', () => {});" : ''} console.log('ready'); setInterval(() => {}, 1000);`], { stdio: ['ignore', 'pipe', 'ignore'] });
  await new Promise(res => c.stdout.once('data', res));
  return c;
}

// A fake clock that starts at 0: each listing of running processes takes `listMs`, and each pause takes what it's asked
// (and up to 10 ms of real time, so a process asked to end has time to).
// It records when SIGTERM was first sent and when SIGKILL was, by watching the clock as the process ends.
function slowClock(listMs, pid) {
  const c = { t: 0, asked: null, killed: null };
  const real = process.kill;
  c.kill = (p, signal) => {
    if (p === pid && signal === 'SIGTERM' && c.asked === null) c.asked = c.t;
    if (p === pid && signal === 'SIGKILL' && c.killed === null) c.killed = c.t;
    return real.call(process, p, signal);
  };
  c.opts = { now: () => c.t, pause: ms => { c.t += ms; Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Math.min(ms, 10)); }, running: () => { c.t += listMs; return runningPids(); }, kill: c.kill };
  return c;
}

test('0218 AC1: a process that ignores the request is forced to end within 6 seconds of first asking, with 200 ms listings', async () => {
  const c = await child(true);
  try {
    const k = slowClock(200, c.pid);
    assert.deepEqual(endBuild({ pid: c.pid, rec: {} }, [c.pid], k.opts), [], 'nothing is left running');
    assert.ok(await until(() => gone(c.pid)), 'the process has ended');
    assert.notEqual(k.asked, null, 'it was asked to end');
    assert.notEqual(k.killed, null, 'it was forced to end');
    const after = k.killed - k.asked;
    assert.ok(after >= 4900 && after <= 6000, `forced ${after} ms after asking`);
  } finally { try { c.kill('SIGKILL'); } catch {} }
});

test('0218 AC1: with 450 ms listings it is still forced within 6 seconds of first asking', async () => {
  const c = await child(true);
  try {
    const k = slowClock(450, c.pid);
    assert.deepEqual(endBuild({ pid: c.pid, rec: {} }, [c.pid], k.opts), []);
    assert.ok(await until(() => gone(c.pid)), 'the process has ended');
    const after = k.killed - k.asked;
    assert.ok(after >= 4900 && after <= 6000, `forced ${after} ms after asking`);
  } finally { try { c.kill('SIGKILL'); } catch {} }
});

test('0218 AC2: a process that ends when asked is not forced, and stop returns as soon as it has ended', async () => {
  const c = await child(false);
  try {
    const k = slowClock(200, c.pid);
    const real = Date.now();
    assert.deepEqual(endBuild({ pid: c.pid, rec: {} }, [c.pid], k.opts), []);
    assert.equal(k.killed, null, 'it was never sent SIGKILL');
    assert.ok(await until(() => gone(c.pid)), 'the process has ended');
    assert.ok(k.t < 2000, `it returned ${k.t} ms (fake) after it started, not after the full wait`);
    assert.ok(Date.now() - real < 3000, 'it returned promptly');
  } finally { try { c.kill('SIGKILL'); } catch {} }
});
