// 0182, 0723: runs test code that opens real-browser pages as a test file of its own, and checks that every process it
// started has gone soon after the file finished.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { ROOT } from './panel.mjs';

const SUPPORT = pathToFileURL(path.join(ROOT, 'test', 'support', 'panel.mjs')).href;

// The pids of every process whose command line mentions `marker`.
export const mentioning = marker => spawnSync('ps', ['-A', '-ww', '-o', 'pid=,command='], { encoding: 'utf8' }).stdout.split('\n')
  .filter(l => l.includes(marker)).map(l => Number(l.trim().split(/\s+/)[0])).filter(pid => pid && pid !== process.pid);

// Runs `body` (test code that has browserPage) as a test file of its own, with its own temporary folder, so every
// Chromium it starts has its profile there. Resolves once the file's process has exited, with the folder, the pids it
// logged and when it exited. The file doesn't import tmp.mjs, so only browserPage's own clean-up can end Chromium.
export async function runFile(body, args = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0182-file-'));
  const log = path.join(dir, 'pids.log');
  const file = path.join(dir, 'browser.test.mjs');
  fs.writeFileSync(file, `import { test } from 'node:test';\nimport fs from 'node:fs';\nimport { browserPage } from ${JSON.stringify(SUPPORT)};\n`
    + `const logPid = p => fs.appendFileSync(${JSON.stringify(log)}, p + '\\n');\n${body}\n`);
  const env = { ...process.env, TMPDIR: dir, TMP: dir, TEMP: dir };
  delete env.NODE_TEST_CONTEXT; // a test file of its own, not one inside this one's run
  const child = spawn(process.execPath, ['--test', ...args, file], { cwd: dir, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  child.stdout.on('data', d => { out += d; });
  child.stderr.on('data', d => { out += d; });
  const code = await new Promise((resolve, reject) => {
    const t = setTimeout(() => { child.kill('SIGKILL'); reject(new Error(`the test file didn't finish within 60 s:\n${out}`)); }, 60000);
    child.on('exit', c => { clearTimeout(t); resolve(c); });
  });
  const exited = Date.now();
  const pids = fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').map(Number) : [];
  return { dir, log, code, out, pids, exited };
}

// Waits up to 10 s from when the file exited for every process started in its folder to be gone. Only a listing that
// began once the 10 s were up can fail it: on a busy machine one listing can itself take seconds, and one that began
// earlier may show a process that has gone since (0723). Ends whatever is left, so a failure leaves nothing running.
// `list` gives the processes that mention the folder: a test can stand in for ps with it.
export async function goneWithin10s({ dir, exited, out }, list = mentioning) {
  const deadline = exited + 10000;
  let left;
  for (;;) {
    const began = Date.now();
    left = await list(dir);
    if (!left.length || began >= deadline) break;
    await new Promise(r => setTimeout(r, Math.min(100, Math.max(0, deadline - Date.now()))));
  }
  for (const pid of left) try { process.kill(pid, 'SIGKILL'); } catch { /* gone */ }
  assert.deepEqual(left, [], `Chromium still running 10 s after the test file finished:\n${out}`);
}

// Runs a test file with a time limit, from 1.5 s, and again with twice as long, up to 12 s, until `started` says
// Chromium was up in time: on a busy machine it can take longer to start than the time allowed (0723). A run that is
// tried again first checks that whatever it started has gone. Resolves with the last run and the time it allowed.
async function allowingLonger(run, started) {
  for (let ms = 1500; ; ms *= 2) {
    const f = await run(ms);
    if (started(f) || ms >= 12000) return { ...f, allowed: ms };
    await goneWithin10s(f);
  }
}

// Code for a test file that drops browserPage's clean-up, as a broken one would: a signal then ends the file at once,
// leaving its Chromium running. 0776: each signal gets its new handler before the old ones go, so one that has come
// and not yet been handled isn't lost: with none left, Node drops it, and the file would wait for ever.
export const DROP_CLEAN_UP = `process.removeAllListeners('exit');
for (const s of ['SIGTERM', 'SIGINT', 'SIGHUP']) {
  const old = process.listeners(s);
  process.on(s, () => { logPid('stopped'); process.exit(1); });
  for (const l of old) process.removeListener(s, l);
}`;

// Runs `body` under --test-timeout so the file runs out of time, as runFile does. Its first test should log its
// Chromium's pid and then wait for ever; a run in which nothing was logged is tried again with longer.
export const runOutOfTime = body => allowingLonger(ms => runFile(body, [`--test-timeout=${ms}`]), f => f.pids.length);

// Runs `body(ms)` as runFile does, for a file whose first test has a time limit of its own, `ms` (0743). That test
// should log a pid once its page is open, and the next should log 0 as it starts: a run in which the 0 came first, so
// the first test ran out of time before it had its page, is tried again with longer.
export const runPastItsLimit = body => allowingLonger(ms => runFile(body(ms)), f => f.pids[0] > 0);

// 0182 AC3's file: a test that times out waiting on its page, then one that passes. It logs the first page's pid, 0,
// and the second page's pid. `first` is code the first test runs once its page is open.
export const timesOutOnItsPage = (first = '') => runPastItsLimit(ms => `
test('times out', { timeout: ${ms} }, async () => { const b = await browserPage('about:blank'); ${first} logPid(b.pid); await new Promise(() => {}); });
test('then another passes', async () => { logPid(0); const b = await browserPage('about:blank'); logPid(b.pid); await b.close(); });`);
