// 0182: a test file's real-browser tests share one Chromium.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { ROOT, findChrome, browserPage } from './support/panel.mjs';

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const SUPPORT = pathToFileURL(path.join(ROOT, 'test', 'support', 'panel.mjs')).href;

// The pids of every process whose command line mentions `marker`.
const mentioning = marker => spawnSync('ps', ['-A', '-ww', '-o', 'pid=,command='], { encoding: 'utf8' }).stdout.split('\n')
  .filter(l => l.includes(marker)).map(l => Number(l.trim().split(/\s+/)[0])).filter(pid => pid && pid !== process.pid);

// Runs `body` (test code that has browserPage) as a test file of its own, with its own temporary folder, so every
// Chromium it starts has its profile there. Resolves once the file's process has exited, with the folder, the pids it
// logged and when it exited. The file doesn't import tmp.mjs, so only browserPage's own clean-up can end Chromium.
async function runFile(body, args = []) {
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
  const pids = fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').map(Number) : [];
  return { dir, code, out, pids, exited: Date.now() };
}

// Waits up to 10 s from when the file exited for every process started in its folder to be gone.
async function goneWithin10s({ dir, exited, out }) {
  let left = mentioning(dir);
  while (left.length && Date.now() - exited < 10000) { await new Promise(r => setTimeout(r, 100)); left = mentioning(dir); }
  for (const pid of left) try { process.kill(pid, 'SIGKILL'); } catch { /* gone */ }
  assert.deepEqual(left, [], `Chromium still running 10 s after the test file finished:\n${out}`);
}

test('0182 AC1: a test file starts Chromium once, however many of its tests open a real browser, at the same time or one after another', skip, async () => {
  const f = await runFile(`
for (const n of [1, 2, 3]) test('page ' + n, async () => { const b = await browserPage('about:blank'); logPid(b.pid); await b.close(); });
test('two at once', async () => {
  const [a, b] = await Promise.all([browserPage('about:blank'), browserPage('about:blank')]);
  logPid(a.pid); logPid(b.pid);
  await a.close(); await b.close();
});`);
  assert.equal(f.code, 0, f.out);
  assert.equal(f.pids.length, 5, f.out);
  assert.equal(new Set(f.pids).size, 1, `one Chromium for the whole file, not ${new Set(f.pids).size}`);
  await goneWithin10s(f);
});

test('0182 AC1: a page asked for after the file\'s Chromium was killed fails, saying why, and starts no second one', skip, async () => {
  const f = await runFile(`
test('kill it', async () => { const b = await browserPage('about:blank'); logPid(b.pid); process.kill(b.pid, 'SIGKILL'); await new Promise(r => setTimeout(r, 300)); await b.close(); });
test('after', async () => {
  const err = await browserPage('about:blank').then(() => null, e => e);
  if (!err) throw new Error('a page opened');
  logPid(err.message);
});`);
  assert.equal(f.code, 0, f.out);
  const message = fs.readFileSync(path.join(f.dir, 'pids.log'), 'utf8').trim().split('\n')[1];
  assert.equal(message, `this test file's Chromium (pid ${f.pids[0]}) has exited, and a test file starts it only once: a test that ends it should be in a file of its own`);
  await goneWithin10s(f);
});

// A page with text to select, room to scroll and its own origin, so it has storage and cookies.
async function site() {
  const srv = http.createServer((req, res) => {
    res.setHeader('content-type', 'text/html');
    res.end('<!doctype html><html><body><p id="t">Some text to select.</p><div style="height:5000px"></div></body></html>');
  }).listen(0, '127.0.0.1');
  await new Promise(r => srv.on('listening', r));
  return { srv, url: `http://127.0.0.1:${srv.address().port}/` };
}
const STATE = `(async () => ({
  local: localStorage.length, session: sessionStorage.length, cookie: document.cookie,
  idb: (await indexedDB.databases()).map(d => d.name), selection: String(getSelection()), ranges: getSelection().rangeCount,
  scroll: [scrollX, scrollY], size: [innerWidth, innerHeight], screen: [screen.width, screen.height],
}))()`;

test('0182 AC2: each page starts fresh, keeping nothing from the one before: storage, cookies, open dialogs, selection, scroll or window size', skip, async () => {
  const { srv, url } = await site();
  const first = await browserPage(url);
  let second, third;
  try {
    await first.loaded();
    const fresh = await first.js(STATE);
    assert.deepEqual([fresh.local, fresh.session, fresh.cookie, fresh.idb, fresh.selection, fresh.ranges, fresh.scroll], [0, 0, '', [], '', 0, [0, 0]]);
    assert.deepEqual(fresh.size, [1280, 900], 'the window size every page has had');
    // Leave everything changed, and the page open with a dialog up, as a test that failed partway would.
    await first.js(`(async () => {
      localStorage.setItem('k', 'v'); sessionStorage.setItem('k', 'v'); document.cookie = 'k=v; max-age=3600';
      await new Promise((resolve, reject) => { const r = indexedDB.open('left-behind'); r.onsuccess = () => { r.result.close(); resolve(); }; r.onerror = reject; });
      getSelection().selectAllChildren(document.getElementById('t')); scrollTo(0, 800);
    })()`);
    await first.send('Emulation.setDeviceMetricsOverride', { width: 400, height: 300, deviceScaleFactor: 1, mobile: false });
    const changed = await first.js(STATE);
    assert.deepEqual([changed.local, changed.session, changed.cookie, changed.idb, changed.selection, changed.scroll[1], changed.size[0]],
      [1, 1, 'k=v', ['left-behind'], 'Some text to select.', 800, 400], 'the first page really was changed');
    await first.send('Page.enable'); // without it, headless Chromium dismisses a dialog at once
    await first.js('setTimeout(() => alert("left open"), 0), 1');
    const blocked = await first.js('1', 2000).then(() => false, () => true);
    assert.ok(blocked, 'the first page has a dialog open');

    second = await browserPage(url);
    await second.loaded();
    assert.deepEqual(await second.js(STATE, 3000), fresh, 'the next page, opened while the first is still open');
    await first.close();
    await second.js('localStorage.setItem("k", "v"), document.cookie = "k=v; max-age=3600", scrollTo(0, 500), 1');
    await second.close();

    third = await browserPage(url);
    await third.loaded();
    assert.deepEqual(await third.js(STATE, 3000), fresh, 'the next page, opened after the one before was closed');
  } finally {
    for (const b of [first, second, third]) if (b) await b.close();
    srv.close();
  }
});

test('0182 AC2: a closed page has gone from Chromium, so pages don\'t pile up over a file', skip, async () => {
  const pages = async b => (await b.browser('Target.getTargets')).targetInfos.filter(t => t.type === 'page').length;
  const first = await browserPage('about:blank');
  const open = await pages(first);
  await first.close();
  for (let i = 0; i < 3; i++) {
    const b = await browserPage('about:blank');
    try { assert.equal(await pages(b), open, `page ${i + 2} opened with the same pages as the first`); } finally { await b.close(); }
  }
});

test('0182 AC3: Chromium has closed within 10 s of a test file finishing whose tests passed', skip, async () => {
  const f = await runFile(`test('passes', async () => { const b = await browserPage('about:blank'); logPid(b.pid); await b.close(); });`);
  assert.equal(f.code, 0, f.out);
  assert.equal(f.pids.length, 1, f.out);
  await goneWithin10s(f);
});

test('0182 AC3: Chromium has closed within 10 s of a test file finishing whose test failed with its page still open', skip, async () => {
  const f = await runFile(`test('fails', async () => { const b = await browserPage('about:blank'); logPid(b.pid); throw new Error('a failure'); });`);
  assert.notEqual(f.code, 0, f.out);
  assert.match(f.out, /a failure/);
  assert.equal(f.pids.length, 1, f.out);
  await goneWithin10s(f);
});

test('0182 AC3: Chromium has closed within 10 s of a test file finishing whose test timed out waiting on its page', skip, async () => {
  const f = await runFile(`
test('times out', { timeout: 1500 }, async () => { const b = await browserPage('about:blank'); logPid(b.pid); await new Promise(() => {}); });
test('then another passes', async () => { const b = await browserPage('about:blank'); logPid(b.pid); await b.close(); });`);
  assert.notEqual(f.code, 0, f.out);
  assert.match(f.out, /timed out after 1500ms/);
  assert.equal(f.pids.length, 2, f.out);
  await goneWithin10s(f);
});

test('0182 AC3: Chromium has closed within 10 s of a test file finishing that ran out of time under --test-timeout', skip, async () => {
  const f = await runFile(`test('hangs', async () => { const b = await browserPage('about:blank'); logPid(b.pid); await new Promise(() => {}); });
test('never starts', () => {});`, ['--test-timeout=1500']);
  assert.notEqual(f.code, 0, f.out);
  assert.equal(f.pids.length, 1, f.out);
  await goneWithin10s(f);
});
