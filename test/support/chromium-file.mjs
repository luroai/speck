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

// Runs `body` under --test-timeout so the file runs out of time, as runFile does. Its first test should log its
// Chromium's pid and then wait for ever. On a busy machine Chromium can take longer to start than the time allowed, so
// a run in which nothing was logged checks that whatever it started has gone, and the next allows twice as long, from
// 1.5 s up to 12 s (0723). Resolves with the first run that logged something, or the last, with the time it allowed.
export async function runOutOfTime(body) {
  for (let ms = 1500; ; ms *= 2) {
    const f = await runFile(body, [`--test-timeout=${ms}`]);
    if (f.pids.length || ms >= 12000) return { ...f, allowed: ms };
    await goneWithin10s(f);
  }
}
