import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { ROOT, browserPage } from './support/panel.mjs';
import { leftBehind } from './support/procs.mjs';

// ---------- 0206: a call to the test browser that's never answered fails its own test, and the suite carries on ----------

const FAKE = path.join(ROOT, 'test', 'support', 'fake-chrome.mjs');
const linux = { skip: fs.existsSync('/proc/self/environ') ? false : 'needs /proc to find the processes a run left behind' };

// This file's browser is the stand-in, which never answers Page.getAppManifest or Fake.silent, with a short time limit.
process.env.SPECK_TEST_CHROME = FAKE;
process.env.FAKE_CHROME_SILENT = 'Page.getAppManifest,Fake.silent';
process.env.SPECK_TEST_DEVTOOLS_MS = '300';

const within = async (ms, promise) => {
  const t0 = Date.now();
  const r = await promise;
  assert.ok(Date.now() - t0 < ms, `took ${Date.now() - t0} ms`);
  return r;
};
const failure = promise => promise.then(() => null, e => e);

// The 0149 test file, run as the suite runs it, with the stand-in browser never answering `silent`. Straight after its
// tests, while the file is still running, a test of its own lists the panels the file still has running.
async function run0149(silent) {
  const mark = crypto.randomUUID();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'run-0149-'));
  const file = path.join(dir, 'with-check.test.mjs');
  const log = path.join(dir, 'calls.log');
  fs.writeFileSync(file, `import { test } from 'node:test';
import { panelsOf } from ${JSON.stringify(pathToFileURL(path.join(ROOT, 'test', 'support', 'procs.mjs')).href)};
await import(${JSON.stringify(pathToFileURL(path.join(ROOT, 'test', 'panel-0149.test.mjs')).href)});
test('0206 check: panels still running', () => { const left = panelsOf(process.pid); if (left.length) throw new Error('panels still running: ' + left.join(', ')); });
`);
  // Without NODE_TEST_CONTEXT, the child reports to its own stdout rather than to this test run.
  const { NODE_TEST_CONTEXT, ...rest } = process.env;
  const child = spawn(process.execPath, ['--test', '--test-reporter=tap', file], { cwd: ROOT,
    env: { ...rest, FAKE_CHROME_SILENT: silent, FAKE_CHROME_LOG: log, SPECK_TEST_DEVTOOLS_MS: '500', SPECK_0206_MARK: mark } });
  let out = '';
  child.stdout.on('data', d => { out += d; });
  child.stderr.on('data', d => { out += d; });
  const limit = setTimeout(() => child.kill('SIGKILL'), 60000);
  const code = await new Promise(r => child.once('exit', (c, sig) => r(sig || c)));
  clearTimeout(limit);
  // A process ended as the file exits can take a moment to go.
  let left = leftBehind(`SPECK_0206_MARK=${mark}`);
  for (let i = 0; i < 30 && left.length; i++) { await new Promise(r => setTimeout(r, 100)); left = leftBehind(`SPECK_0206_MARK=${mark}`); }
  for (const pid of left) try { process.kill(Number(pid), 'SIGKILL'); } catch { /* gone */ }
  const calls = fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : [];
  return { code, out, left, calls };
}
const count = (out, what) => Number((out.match(new RegExp(`^# ${what} (\\d+)$`, 'm')) || [])[1]);

test('0206 AC1: a call to the page that is never answered fails in its time limit, naming the call', async () => {
  const b = await browserPage('about:blank');
  try {
    const err = await within(2000, failure(b.send('Page.getAppManifest')));
    assert.equal(err?.message, 'Chrome didn\'t answer Page.getAppManifest within 0.3 s');
  } finally { await b.close(); }
});

test('0206 AC1: a call to Chromium itself that is never answered fails in its time limit, naming the call', async () => {
  const b = await browserPage('about:blank');
  try {
    const err = await within(2000, failure(b.browser('Fake.silent')));
    assert.equal(err?.message, 'Chrome didn\'t answer Fake.silent within 0.3 s');
  } finally { await b.close(); }
});

test('0206 AC1: with no time limit set for the tests, a call waits at most 30 seconds', () => {
  const src = fs.readFileSync(path.join(ROOT, 'test', 'support', 'panel.mjs'), 'utf8');
  const ms = Number((src.match(/const callMs = \(\) => Number\(process\.env\.SPECK_TEST_DEVTOOLS_MS\) > 0 \? Number\(process\.env\.SPECK_TEST_DEVTOOLS_MS\) : (\d+);/) || [])[1]);
  assert.ok(ms > 0 && ms <= 30000, `the default limit is ${ms} ms`);
  const send = src.slice(src.indexOf('  const send = ('), src.indexOf('  return { ws, send };'));
  assert.match(send, /^ {2}const send = \(method, params = \{\}, ms = callMs\(\), what = ''\) =>/);
});

test('0206 AC3: a call that is answered in time works as before', async () => {
  const b = await browserPage('about:blank');
  try {
    assert.deepEqual(await b.send('Page.enable'), {});
    assert.equal(await b.js('1 + 1 === 2'), true);
    await b.until('true', 'a thing that is already so');
    await b.move([10, 10]);
    assert.deepEqual(await b.browser('Target.getTargets'), {});
  } finally { await b.close(); }
});

// What every run of the 0149 file shows: its browser test fails, naming the call; the rest pass; by the time its tests
// are done its panel has been stopped and its page closed; and once it has finished, nothing it started is running.
function carriedOn(r, method) {
  assert.notEqual(r.code, 'SIGKILL', `the file didn't finish within 60 s:\n${r.out}`);
  assert.match(r.out, /^not ok \d+ - 0149 AC4\b/m, r.out);
  assert.match(r.out, new RegExp(`Chrome didn't answer ${method.replace('.', '\\.')} within 0\\.5 s`), r.out);
  assert.equal(count(r.out, 'fail'), 1, r.out);
  assert.equal(count(r.out, 'tests'), 11, r.out);
  assert.match(r.out, /^ok 11 - 0206 check: panels still running$/m, r.out);
  assert.ok(r.calls.includes('Target.disposeBrowserContext'), `the page's browser context was closed: ${r.calls.join(', ')}`);
  assert.deepEqual(r.left, [], 'no panel or browser is left running');
}

test('0206 AC1 AC2: an unanswered call in the 0149 browser test fails that test, ends its panel and browser, and the others pass', linux, async () => {
  carriedOn(await run0149('Page.getAppManifest'), 'Page.getAppManifest');
});

test('0206 AC1 AC2: when opening the page itself is never answered, the 0149 test still ends its panel, and the others pass', linux, async () => {
  carriedOn(await run0149('Target.createTarget'), 'Target.createTarget');
});
