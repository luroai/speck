import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { ROOT, panelRepo, freePort, startPanel, stop, ended, request, raw, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0159: the 0149 browser test can't hang the full suite ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const SUITE = fs.readFileSync(path.join(ROOT, 'test', 'panel-0149.test.mjs'), 'utf8');
const AC4 = SUITE.slice(SUITE.indexOf("test('0149 AC4"));

// A server whose page arrives late, as the panel's can when the machine is busy, with a manifest.
async function slowSite(ms) {
  const srv = http.createServer((req, res) => {
    if (req.url !== '/') { res.setHeader('content-type', 'application/manifest+json'); return res.end('{"name":"slow","start_url":"/"}'); }
    setTimeout(() => { res.setHeader('content-type', 'text/html'); res.end('<!doctype html><html><head><link rel="manifest" href="/m.webmanifest"></head><body>slow</body></html>'); }, ms);
  }).listen(0, '127.0.0.1');
  await new Promise(r => srv.on('listening', r));
  return { srv, url: `http://127.0.0.1:${srv.address().port}/` };
}
// A server that takes requests and never answers them.
async function silent() {
  const held = [];
  const srv = http.createServer((req, res) => { held.push(res); }).listen(0, '127.0.0.1');
  await new Promise(r => srv.on('listening', r));
  return { srv, port: srv.address().port, close: () => { held.forEach(r => r.destroy()); srv.close(); } };
}
const within = async (ms, promise) => {
  const t0 = Date.now();
  const r = await promise;
  assert.ok(Date.now() - t0 < ms, `took ${Date.now() - t0} ms`);
  return r;
};

test('0159 AC1: b.loaded() waits for the page itself, not the blank page Chrome opens first, so the manifest is then found', skip, async () => {
  const { srv, url } = await slowSite(800);
  const b = await browserPage(url);
  try {
    await b.loaded();
    assert.equal(await b.js('location.href'), url);
    assert.equal(await b.js('document.readyState'), 'complete');
    let app;
    for (let i = 0; i < 50 && !app?.url; i++) { if (i) await new Promise(r => setTimeout(r, 100)); app = await b.send('Page.getAppManifest', {}, 5000); }
    assert.match(app.url, /\/m\.webmanifest$/);
  } finally { await b.close(); srv.close(); }
});

test('0159 AC1: the 0149 browser test waits with b.loaded() before it asks Chrome for the manifest', () => {
  assert.ok(AC4.indexOf('b.loaded(') >= 0, 'the 0149 AC4 test calls b.loaded()');
  assert.ok(AC4.indexOf('b.loaded(') < AC4.indexOf('Page.getAppManifest'), 'b.loaded() comes before Page.getAppManifest');
  assert.ok(!/readyState === "complete"', 'the page to load'/.test(AC4), 'no wait that the blank page passes');
});

test('0159 AC2: the 0149 browser test still checks for no manifest errors, and that its icons load and match icon.svg', () => {
  for (const check of [
    "assert.deepEqual(app.errors, [], JSON.stringify(app.errors));",
    "assert.match(app.url, /\\/manifest\\.webmanifest$/);",
    "assert.equal(JSON.parse(app.data).name, 'speck');",
    "assert.ok(loaded.length >= 5, JSON.stringify(loaded));",
    "assert.notEqual(i.got, 'failed', `${i.src} loads`);",
    "if (i.want && !i.src.endsWith('.svg')) assert.equal(i.got, i.want, i.src);",
    "draw('/icon.svg'), draw('/apple-touch-icon.png')",
    'assert.ok(diff < 2,',
  ]) assert.ok(AC4.includes(check), `still checks: ${check}`);
});

test('0159 AC3: a DevTools call Chrome never answers fails in its time limit, naming the call', skip, async () => {
  const { srv, url } = await slowSite(3000);
  const b = await browserPage(url);
  try {
    // Sent while Chrome is still on its blank page, Page.getAppManifest is never answered (what hung 0149's test).
    const err = await within(2500, b.send('Page.getAppManifest', {}, 1000).then(() => null, e => e));
    assert.ok(err, 'the call fails');
    assert.match(err.message, /^Chrome didn't answer Page\.getAppManifest within 1 s$/);
  } finally { await b.close(); srv.close(); }
});

test('0159 AC3: b.js() and b.until() give up in their time limits, naming what they waited for', skip, async () => {
  const b = await browserPage('about:blank');
  try {
    const err = await within(2500, b.js('new Promise(() => {})', 1000).then(() => null, e => e));
    assert.match(err?.message || '', /^Chrome didn't answer Runtime\.evaluate within 1 s: new Promise\(\(\) => \{\}\)$/);
    const late = await within(15000, b.until('false', 'a thing that never happens').then(() => null, e => e));
    assert.match(late?.message || '', /^timed out waiting for a thing that never happens$/);
  } finally { await b.close(); }
});

test('0159 AC3: b.loaded() gives up when the page never arrives, naming the page', skip, async () => {
  const s = await silent();
  const url = `http://127.0.0.1:${s.port}/`;
  const b = await browserPage(url);
  try {
    const err = await within(20000, b.loaded().then(() => null, e => e));
    assert.equal(err?.message, `timed out waiting for ${url} to load`);
  } finally { await b.close(); s.close(); }
});

test('0159 AC3: b.close() returns at once when Chrome has already exited', skip, async () => {
  const b = await browserPage('about:blank');
  process.kill(b.pid, 'SIGKILL');
  await new Promise(r => setTimeout(r, 300));
  await within(3000, b.close());
});

// A server that answers with a body it keeps sending, a little at a time, and never ends.
async function trickle() {
  const held = [];
  const srv = http.createServer((req, res) => { res.write('x'); held.push(res, setInterval(() => res.write('x'), 100)); }).listen(0, '127.0.0.1');
  await new Promise(r => srv.on('listening', r));
  return { port: srv.address().port, close: () => { held.forEach(h => (h.destroy ? h.destroy() : clearInterval(h))); srv.close(); } };
}

test('0159 AC3: request() and raw() fail in their time limits when the answer keeps coming but never ends', async () => {
  const s = await trickle();
  try {
    const a = await within(2500, request(s.port, { pathName: '/api/state', timeout: 1000 }).then(() => null, e => e));
    assert.equal(a?.message, 'no answer to GET /api/state within 1 s');
    const b = await within(2500, raw(s.port, '/icon-512.png', undefined, 1000).then(() => null, e => e));
    assert.equal(b?.message, 'no answer to GET /icon-512.png within 1 s');
  } finally { s.close(); }
});

test('0159 AC3: b.close() ends Chrome through ended(), which fails naming Chrome if it never reports exiting', async () => {
  const src = fs.readFileSync(path.join(ROOT, 'test', 'support', 'panel.mjs'), 'utf8');
  const close = src.slice(src.indexOf('  const close = async () => {'), src.indexOf('  let ws;'));
  assert.match(close, /await ended\(chrome, 'Chrome'\)/);
  assert.ok(!/once\('exit'|on\('exit'/.test(close), 'no wait of its own for Chrome to exit');
  const fake = Object.assign(new EventEmitter(), { pid: 99999998, exitCode: null, signalCode: null, signals: [], kill(sig = 'SIGTERM') { this.signals.push(sig); } });
  const err = await within(5000, ended(fake, 'Chrome', 500).then(() => null, e => e));
  assert.equal(err?.message, 'Chrome (pid 99999998) didn\'t exit within 1 s of being stopped');
  assert.deepEqual(fake.signals, ['SIGTERM', 'SIGKILL']);
});

test('0159 AC3: request() and raw() fail in their time limits when the panel never answers, naming the request', async () => {
  const s = await silent();
  try {
    const a = await within(2500, request(s.port, { pathName: '/manifest.webmanifest', timeout: 1000 }).then(() => null, e => e));
    assert.equal(a?.message, 'no answer to GET /manifest.webmanifest within 1 s');
    const b = await within(2500, raw(s.port, '/icon-192.png', undefined, 1000).then(() => null, e => e));
    assert.equal(b?.message, 'no answer to GET /icon-192.png within 1 s');
  } finally { s.close(); }
});

test('0159 AC3: stop() returns at once for a panel that has already exited', async () => {
  const r = panelRepo();
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  process.kill(p.child.pid, 'SIGKILL');
  await new Promise(res => p.child.once('exit', res));
  await within(3000, stop(p));
});

test('0159 AC3: stop() ends a panel that ignores SIGTERM, and fails naming it if even SIGKILL leaves it running', async () => {
  // A child that ignores SIGTERM: stop() kills it outright after its time limit.
  const child = spawn(process.execPath, ['-e', "process.on('SIGTERM', () => {}); console.log('ready'); setInterval(() => {}, 1000)"]);
  await new Promise(r => child.stdout.once('data', r));
  await within(5000, stop({ child }, 1000));
  assert.equal(child.signalCode, 'SIGKILL');
  // One that never reports exiting: stop() fails, naming it, rather than waiting for ever.
  const fake = { child: Object.assign(new EventEmitter(), { pid: 99999999, exitCode: null, signalCode: null, kill() {} }) };
  const err = await within(5000, stop(fake, 500).then(() => null, e => e));
  assert.equal(err?.message, 'the panel (pid 99999999) didn\'t exit within 1 s of being stopped');
});

test('0159 AC3: every wait in the 0149 test file has a time limit', () => {
  // Its own waits go through the helpers above; it has no unbounded wait of its own.
  assert.ok(!/function raw\(/.test(SUITE), 'raw() is the shared one, with its time limit');
  assert.ok(!/\.once\('exit'|\.on\('exit'/.test(SUITE), 'no wait for a process to exit of its own');
  assert.ok(!/new Promise\(/.test(AC4.replace(/b\.js\(`[\s\S]*?`\)/g, '').replace(/new Promise\(r => setTimeout\(r, 100\)\)/g, '')), 'no promise of its own that can wait for ever');
});
