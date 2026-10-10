import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { panelRepo, cliCopy, freePort, startPanel, stop, request, post, tokenOf, readyPath, fm, fakePage, T, idea, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0067: speck panel restarts by itself when its code changes ----------

const wait = ms => new Promise(r => setTimeout(r, ms));
// The panel's code, in the CLI copy: it has been in scripts/panel.mjs since 0018.
const code = c => c.cli.replace(/speck\.mjs$/, 'panel.mjs');
// Polls `check` until it's true, failing after `ms`. Resolves with how long it took.
async function within(ms, check, what) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { if (await check()) return Date.now() - t0; } catch { /* not answering yet */ }
    await wait(100);
  }
  throw new Error(`not within ${ms} ms: ${what}`);
}

// Changes the copied CLI's code: every response gets an X-Speck-Test header, and 404s say which version answered.
function edit(c, version) {
  const src = fs.readFileSync(code(c), 'utf8')
    .replace(/'X-Content-Type-Options': 'nosniff',( 'X-Speck-Test': '[^']*',)?/, `'X-Content-Type-Options': 'nosniff', 'X-Speck-Test': '${version}',`)
    .replace(/'Not found\.( [^\\']*)?\\n'/, `'Not found. ${version}\\n'`);
  fs.writeFileSync(code(c), src);
}
// Every server process of the panel started from `c`, which aren't all children of the process you start, since each
// server starts the next. The CLI copy's folder is in their environment, so they're found by it.
const children = (p, c) => spawnSync('ps', ['-eo', 'pid=', '-o', 'args='], { encoding: 'utf8' }).stdout.split('\n')
  .filter(l => l.includes('SPECK_PANEL') || l.includes('--input-type=module'))
  .map(l => +l.trim().split(/\s+/)[0]).filter(pid => pid && pid !== p.child.pid && envHas(pid, c.cli));
const envHas = (pid, text) => { try { return fs.readFileSync(`/proc/${pid}/environ`, 'utf8').includes(text); } catch { return false; } };
const alive = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
const restarts = p => (p.out().match(/restarted/g) || []).length;

async function served(r = panelRepo()) {
  const c = cliCopy();
  const port = await freePort();
  const p = await startPanel(r.dir, ['--port', String(port)], c.cli);
  return { r, c, port, p };
}

test('0067 AC1: a code change is served on the same port within 5 seconds, on every route', async () => {
  const { c, port, p } = await served();
  try {
    assert.equal((await request(port, { pathName: '/nope' })).body, 'Not found.\n');
    edit(c, 'v2');
    const took = await within(5000, async () => (await request(port, { pathName: '/nope' })).body === 'Not found. v2\n', 'the new 404');
    assert.ok(took < 5000);
    for (const pathName of ['/', '/api/state', '/api/tickets/0001/log']) {
      const res = await request(port, { pathName });
      assert.equal(res.status, 200, pathName);
      assert.equal(res.headers['x-speck-test'], 'v2', `${pathName} answers as the new code does`);
    }
    const posted = await post(port, readyPath('0001'), { token: 'wrong' });
    assert.equal(posted.headers['x-speck-test'], 'v2', 'the write too');
  } finally { await stop(p); }
});

test('0067 AC1: a change that leaves the code as it was causes no restart', async () => {
  const { c, port, p } = await served();
  try {
    const now = new Date();
    fs.utimesSync(code(c), now, now);
    fs.writeFileSync(code(c), fs.readFileSync(code(c), 'utf8'));
    await wait(2500);
    assert.equal(restarts(p), 0);
    assert.equal((await request(port, { pathName: '/nope' })).body, 'Not found.\n');
  } finally { await stop(p); }
});

test('0067 AC2: the token survives a restart, so Set ready works with the token from before it', async () => {
  const r = panelRepo();
  r.write('0002-two.md', fm({ id: '"0002"', title: 'Two' }));
  const { c, port, p } = await served(r);
  try {
    const token = tokenOf((await request(port)).body);
    assert.ok(token);
    edit(c, 'v2');
    await within(5000, async () => (await request(port)).headers['x-speck-test'] === 'v2', 'the restart');
    assert.equal(tokenOf((await request(port)).body), token, 'the same token in the page');
    const res = await post(port, readyPath('0002'), { token });
    assert.equal(res.status, 200, res.body);
    assert.equal(res.headers['x-speck-test'], 'v2');
  } finally { await stop(p); }
});

test('0067 AC2: in a real browser, an open page keeps its list across a restart and Set ready works without a reload', { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' }, async () => {
  const r = panelRepo();
  r.write('0002-two.md', fm({ id: '"0002"', title: 'Two' }));
  fs.writeFileSync(`${r.dir}/speck/ideas/2026-10-09-a.md`, '# An idea\n\nStatus: raw\n\nBody.\n');
  const { c, port, p } = await served(r);
  const b = await browserPage(`http://127.0.0.1:${port}/`);
  try {
    await b.until(`!!document.querySelector('#shaping .item')`, 'the drafts');
    await b.js(`window.__notReloaded = true; [...document.querySelectorAll('#shaping-toggle button')].find(x => x.textContent.startsWith('Ideas')).click()`);
    await b.until(`document.getElementById('shaping-section').className.includes('ideas')`, 'the Ideas list');
    await b.js(`document.querySelector('#shaping .item .head').click()`);
    const openBefore = await b.js(`document.querySelectorAll('#shaping .item.open').length`);
    assert.equal(openBefore, 1, 'the idea is open');
    edit(c, 'v2');
    await within(5000, async () => (await request(port)).headers['x-speck-test'] === 'v2', 'the restart');
    await wait(4500); // two polls on the new code
    assert.equal(await b.js('window.__notReloaded'), true, 'the page was not reloaded');
    assert.ok(await b.js(`document.getElementById('offline').hidden`), 'connected');
    assert.ok(await b.js(`document.getElementById('shaping-section').className.includes('ideas')`), 'still on Ideas');
    assert.equal(await b.js(`document.querySelectorAll('#shaping .item.open').length`), 1, 'the idea is still open');
    await b.js(`[...document.querySelectorAll('#shaping-toggle button')].find(x => x.textContent.startsWith('Tickets')).click()`);
    await b.until(`!!document.querySelector('#shaping .item .head')`, 'the drafts again');
    await b.js(`document.querySelector('#shaping .item .head').click()`);
    await b.until(`!![...document.querySelectorAll('#shaping button')].find(x => x.textContent === 'Set ready')`, 'the Set ready button');
    await b.js(`[...document.querySelectorAll('#shaping button')].find(x => x.textContent === 'Set ready').click()`);
    await within(5000, () => /status: ready/.test(fs.readFileSync(`${r.dir}/speck/tickets/0002-two.md`, 'utf8')), '0002 set ready');
  } finally { await b.close(); await stop(p); }
});

test('0067 AC3: several changes close together cause one restart once they settle', async () => {
  const { c, port, p } = await served();
  try {
    for (let i = 1; i <= 5; i++) { edit(c, `burst${i}`); await wait(60); }
    await within(5000, async () => (await request(port, { pathName: '/nope' })).body === 'Not found. burst5\n', 'the last version');
    await wait(2500);
    assert.equal(restarts(p), 1, p.out());
  } finally { await stop(p); }
});

test('0067 AC4: new code that fails to start leaves the old server serving, shows the error and the next change tries again', async () => {
  const { c, port, p } = await served();
  try {
    const good = fs.readFileSync(code(c), 'utf8');
    fs.writeFileSync(code(c), `${good}\nfunction broken( {\n`);
    const state = async () => JSON.parse((await request(port, { pathName: '/api/state' })).body);
    await within(5000, async () => (await state()).restart_error, 'the restart error in /api/state');
    const err = (await state()).restart_error;
    assert.match(err, /^SyntaxError: /, err);
    assert.doesNotMatch(err, /\n/, 'one line');
    assert.equal((await request(port, { pathName: '/nope' })).body, 'Not found.\n', 'the old code still serves');
    assert.ok(Array.isArray((await state()).tickets));
    // A code change that throws when it loads, rather than failing to parse.
    fs.writeFileSync(code(c), good.replace("const PANEL_PORT = 4777;", "const PANEL_PORT = 4777; throw new Error('boom 0067');"));
    await within(5000, async () => (await state()).restart_error === 'Error: boom 0067', 'the second error');
    assert.equal((await request(port, { pathName: '/nope' })).body, 'Not found.\n', 'the old code still serves');
    // The next change that works is picked up, and the error goes.
    fs.writeFileSync(code(c), good);
    edit(c, 'v3');
    await within(5000, async () => (await request(port, { pathName: '/nope' })).body === 'Not found. v3\n', 'the fixed code');
    assert.equal((await state()).restart_error, undefined);
    assert.doesNotMatch(p.out(), /at .*\.mjs:\d+/, 'no stack trace');
  } finally { await stop(p); }
});

test('0067 AC4: putting the running code back clears the error without a restart', async () => {
  const { c, port, p } = await served();
  try {
    const good = fs.readFileSync(code(c), 'utf8');
    fs.writeFileSync(code(c), `${good}\nfunction broken( {\n`);
    const state = async () => JSON.parse((await request(port, { pathName: '/api/state' })).body);
    await within(5000, async () => (await state()).restart_error, 'the restart error');
    fs.writeFileSync(code(c), good);
    await within(5000, async () => (await state()).restart_error === undefined, 'the error cleared');
    assert.equal(restarts(p), 0);
  } finally { await stop(p); }
});

test('0067 AC4: the page shows that speck panel couldn\'t restart, with the error line', async () => {
  const line = "SyntaxError: Unexpected token '{'";
  const p = fakePage([{ tickets: [T('0001', 'draft')], ideas: [], restart_error: line }]);
  await p.settle();
  const box = p.byId('restart');
  assert.equal(box.hidden, false);
  assert.match(box.textContent, /speck panel couldn't restart/);
  assert.ok(box.textContent.includes(line), box.textContent);
  const q = fakePage([{ tickets: [T('0001', 'draft')], ideas: [idea('a', 'raw')] }]);
  await q.settle();
  assert.equal(q.byId('restart').hidden, true, 'hidden with no error');
});

test('0067 AC5: the URL prints once, and Ctrl+C stops it with no process left behind', async () => {
  const { c, port, p } = await served();
  try {
    edit(c, 'v2');
    await within(5000, async () => (await request(port, { pathName: '/nope' })).body === 'Not found. v2\n', 'the restart');
    await wait(500);
    assert.equal((p.out().match(/http:\/\/127\.0\.0\.1:\d+/g) || []).length, 1, p.out());
    const kids = children(p, c);
    assert.ok(kids.length >= 1, 'the server runs in a child');
    const exited = new Promise(res => p.child.on('exit', res));
    p.child.kill('SIGINT');
    await exited;
    await within(3000, () => kids.every(k => !alive(k)), 'every child to stop');
    await assert.rejects(request(port), 'the port is closed');
  } finally { if (p.child.exitCode === null && p.child.signalCode === null) await stop(p); }
});

test('0067 AC5: if speck panel is killed outright, its server stops too', async () => {
  const { c, port, p } = await served();
  const kids = children(p, c);
  assert.ok(kids.length >= 1);
  const exited = new Promise(res => p.child.on('exit', res));
  p.child.kill('SIGKILL');
  await exited;
  await within(3000, () => kids.every(k => !alive(k)), 'every child to stop');
  await assert.rejects(request(port));
});

test('0067 AC5: Ctrl+C while new code is still starting stops that process too', async () => {
  const { c, p } = await served();
  try {
    // New code that takes 4 seconds to load, so it's still starting when Ctrl+C comes.
    fs.writeFileSync(code(c), fs.readFileSync(code(c), 'utf8').replace('const PANEL_PORT = 4777;', 'const PANEL_PORT = 4777; { const t0 = Date.now(); while (Date.now() - t0 < 4000); }'));
    let kids = [];
    await within(5000, () => (kids = children(p, c)).length >= 2, 'the new server process to start');
    const exited = new Promise(res => p.child.on('exit', res));
    p.child.kill('SIGINT');
    await exited;
    await within(3000, () => kids.every(k => !alive(k)), 'every child to stop');
  } finally { if (p.child.exitCode === null && p.child.signalCode === null) await stop(p); }
});

test('0067 AC1: a change to the code that watches and restarts is picked up too, with no command from the user', async () => {
  const { c, port, p } = await served();
  try {
    const say = text => fs.writeFileSync(code(c), fs.readFileSync(code(c), 'utf8').replace(/the code changed, so it restarted with the new code\.|RESTART-V\d/, text));
    say('RESTART-V2');
    await within(5000, () => restarts(p) === 1, 'the first restart');
    assert.doesNotMatch(p.out(), /RESTART-V2/, 'the old code announced the first restart');
    say('RESTART-V3');
    await within(5000, () => /RESTART-V2/.test(p.out()), 'the second restart, announced by the new watcher code');
    assert.equal((await request(port)).status, 200);
  } finally { await stop(p); }
});
