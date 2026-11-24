// 0725: an approved code ticket's review pack has a Try it button that starts speck app, and Stop while it runs.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { freePort, startPanel, stop, request, post, tokenOf, fakePage, T, deferred, fullViewOf } from './support/panel.mjs';
import { gitIn } from './support/speck.mjs';
import { panelAppStart, panelAppStop } from '../scripts/panel-run.mjs';
import { runningApp, answers } from '../scripts/app.mjs';
import { panelPack } from '../scripts/pack.mjs';

const ago = min => new Date(Date.now() - min * 60000).toISOString();
const STATE = (extra = {}) => ({ ideas: [], tickets: [
  T('0005', 'approved', { started: ago(30), kind: 'code', ...extra }),
  T('0006', 'building', { started: ago(10), kind: 'code' }),
  T('0008', 'approved', { started: ago(20), kind: 'task' }),
] });
const PACK = '## 0005 · Ticket 0005\n**Verdict:** ✅ Approved by reviewer\n';
const answered = (status, body) => ({ ok: status < 400, status, json: async () => body });
const URL = 'http://127.0.0.1:34567/';

// A page whose server answers app start/stop, and /api/state with `s()`. Pack may include `app`.
function page({ s = STATE, start = () => answered(200, { ok: true, url: URL }),
  stopApp = () => answered(200, { ok: true }), pack = { pack: PACK } } = {}) {
  const sent = [];
  const p = fakePage([], {
    fetch: async (url, opts) => {
      if (/\/app\/stop$/.test(url)) { sent.push([url, opts]); return stopApp(url, opts); }
      if (/\/app$/.test(url) && opts?.method === 'POST') { sent.push([url, opts]); return start(url, opts); }
      const body = /\/log$/.test(url) ? { text: '', truncated: false } : /\/pack$/.test(url) ? pack : s();
      return { ok: true, status: 200, json: async () => JSON.parse(JSON.stringify(body)) };
    },
    confirm: () => true,
  });
  p.sent = sent;
  return p;
}
const pane = p => p.byId('full-ticket');
const buttonsIn = (p, n, text) => p.all(n).filter(x => x.tagName === 'button' && (text instanceof RegExp ? text.test(x.textContent) : x.textContent === text));
const tryOf = p => buttonsIn(p, pane(p), /^(Try it|Starting)/)[0] || null;
const stopOf = p => buttonsIn(p, pane(p), /^(Stop|Stopping)/)[0] || null;
const appLink = p => p.all(pane(p)).find(n => n.tagName === 'a' && n.href === URL) || null;
async function openPack(p, id = '0005') {
  await p.settle();
  await fullViewOf(p, id);
  p.press(buttonsIn(p, pane(p), 'Review pack')[0]);
  await p.settle();
}

test('0725 AC1: an approved code ticket\'s review pack has a Try it button that starts the app and shows its address as a link', async () => {
  const done = deferred();
  const p = page({ start: () => done });
  await openPack(p);
  const b = tryOf(p);
  assert.ok(b, 'a Try it button');
  assert.equal(b.textContent, 'Try it');
  assert.equal(b.disabled, false);
  p.press(b);
  await p.settle();
  assert.deepEqual(p.sent.map(([u, o]) => [u, o.method, o.headers['X-Speck-Token']]), [['/api/tickets/0005/app', 'POST', '{{token}}']]);
  assert.equal(tryOf(p).textContent, 'Starting…');
  assert.equal(tryOf(p).disabled, true);
  done.resolve(answered(200, { ok: true, url: URL }));
  await p.settle();
  assert.equal(tryOf(p), null, 'Try it goes once it is running');
  const a = appLink(p);
  assert.ok(a, 'the address is a link');
  assert.equal(a.href, URL);
  assert.ok(stopOf(p), 'Stop is offered while it runs');
});

test('0725 AC2: Stop stops that app; opening the pack again while it runs shows the address and Stop', async () => {
  const stopped = deferred();
  const p = page({
    start: () => answered(200, { ok: true, url: URL }),
    stopApp: () => stopped,
    pack: { pack: PACK, app: { url: URL } },
  });
  await openPack(p);
  // Pack already says the app is running: address and Stop show without clicking Try it.
  assert.ok(appLink(p), 'reopening shows the address');
  assert.ok(stopOf(p), 'and Stop');
  assert.equal(tryOf(p), null);
  p.press(stopOf(p));
  await p.settle();
  assert.deepEqual(p.sent.map(([u]) => u), ['/api/tickets/0005/app/stop']);
  assert.equal(stopOf(p).textContent, 'Stopping…');
  assert.equal(stopOf(p).disabled, true);
  stopped.resolve(answered(200, { ok: true }));
  await p.settle();
  assert.equal(stopOf(p), null);
  assert.equal(appLink(p), null);
  assert.ok(tryOf(p), 'Try it comes back once it has stopped');
});

test('0725 AC3: when the app can\'t start, the panel shows speck app\'s words', async () => {
  const why = "commands.start isn't set, so speck can't start your app: set it with `speck config set commands.start \"<command>\"`, using {port} for the port it should listen on.";
  const p = page({ start: () => answered(409, { error: why }) });
  await openPack(p);
  p.press(tryOf(p));
  await p.settle();
  const shown = p.all(pane(p)).find(n => n._text === why);
  assert.ok(shown, 'the reason shows');
  assert.match(shown.className, /\bbad\b/);
  assert.equal(tryOf(p).textContent, 'Try it', 'it can be tried again');
  assert.equal(tryOf(p).disabled, false);
});

test('0725 AC4: a task ticket, and a ticket that isn\'t approved, show no Try it button', async () => {
  const p = page();
  await openPack(p, '0008');
  assert.equal(tryOf(p), null, 'no Try it on a task');
  assert.ok(buttonsIn(p, pane(p), 'Ship')[0], 'Ship is still there for a task');

  let status = 'approved';
  const q = page({ s: () => ({ ideas: [], tickets: [T('0005', status, { started: ago(30), kind: 'code' })] }) });
  await openPack(q);
  assert.ok(tryOf(q));
  status = 'reviewing';
  for (const fn of q.timers.splice(0)) fn();
  await q.settle();
  assert.equal(pane(q).hidden, false, 'the pack stays open');
  assert.equal(tryOf(q), null, 'no Try it once it isn\'t approved');
});

// ---------- the server ----------

const APP = `const http = require('http');
http.createServer((q, s) => s.end('ok')).listen(Number(process.argv[2]), '127.0.0.1');
`;
const ticketText = (id, title, status = 'approved', kind = 'code') => `---\nid: "${id}"\ntitle: "${title}"\nstatus: ${status}\nsize: S\nrisk: low\nkind: ${kind}\n---\n# ${id} · ${title}\n\n## Problem\nx\n## Outcome\ny\n## Acceptance criteria\n1. z\n`;

function appRepo({ start = true, status = 'approved', kind = 'code' } = {}) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0725-')));
  gitIn(dir, 'init', '-q', '-b', 'main');
  fs.mkdirSync(path.join(dir, 'speck', 'tickets'), { recursive: true });
  const node = JSON.stringify(process.execPath);
  const cfg = start
    ? `base_branch: main\nbranch_prefix: speck/\nworktrees: false\ncommands:\n  start: '${node} app.js {port}'\n`
    : `base_branch: main\nbranch_prefix: speck/\nworktrees: false\ncommands:\n  start: ""\n`;
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), cfg);
  fs.writeFileSync(path.join(dir, 'speck', 'tickets', '0001-one.md'), ticketText('0001', 'One', status, kind));
  if (start) fs.writeFileSync(path.join(dir, 'app.js'), APP);
  fs.writeFileSync(path.join(dir, '.gitignore'), 'speck/.cache/\n');
  gitIn(dir, 'add', '-A'); gitIn(dir, 'commit', '-qm', 'base');
  return dir;
}

test('0725 AC1 AC2: panelAppStart starts the app and returns its url; panelAppStop stops it; pack lists a running app', async () => {
  const dir = appRepo();
  try {
    const out = await panelAppStart(dir, '1');
    assert.equal(out.status, 200, JSON.stringify(out.body));
    assert.ok(out.body.url, JSON.stringify(out.body));
    assert.ok(await answers(out.body.url), 'the app answers');
    assert.deepEqual(runningApp(dir, '1'), { url: out.body.url });
    const pack = panelPack(dir, '1');
    assert.equal(pack.status, 200);
    assert.deepEqual(pack.body.app, { url: out.body.url });
    const stopped = await panelAppStop(dir, '1');
    assert.equal(stopped.status, 200, JSON.stringify(stopped.body));
    assert.equal(runningApp(dir, '1'), null);
    assert.equal(panelPack(dir, '1').body.app, undefined);
  } finally {
    await panelAppStop(dir, '1').catch(() => {});
  }
});

test('0725 AC3: when speck app refuses, panelAppStart returns its message unchanged', async () => {
  const dir = appRepo({ start: false });
  const out = await panelAppStart(dir, '1');
  assert.equal(out.status, 409);
  assert.match(out.body.error, /commands\.start isn't set/);
  assert.equal(runningApp(dir, '1'), null);
});

test('0725 AC4: panelAppStart refuses a task and a ticket that isn\'t approved', async () => {
  const task = appRepo({ kind: 'task' });
  const building = appRepo({ status: 'building' });
  const t = await panelAppStart(task, '1');
  assert.equal(t.status, 409);
  assert.match(t.body.error, /task/i);
  const b = await panelAppStart(building, '1');
  assert.equal(b.status, 409);
  assert.match(b.body.error, /approved/i);
});

test('0725 AC1 AC2: the panel serves POST /api/tickets/<id>/app and /app/stop to its own page only', async () => {
  const dir = appRepo();
  const p = await startPanel(dir, ['--port', String(await freePort())]);
  try {
    const token = tokenOf((await request(p.port)).body);
    for (const opts of [{}, { token: 'nope' }, { token, origin: 'http://evil.example' }]) {
      const res = await post(p.port, '/api/tickets/1/app', opts);
      assert.equal(res.status, 403, JSON.stringify(opts));
    }
    assert.equal(runningApp(dir, '1'), null);
    const started = await post(p.port, '/api/tickets/1/app', { token });
    assert.equal(started.status, 200, started.body);
    const url = JSON.parse(started.body).url;
    assert.ok(url);
    assert.ok(await answers(url));
    const again = await request(p.port, { pathName: '/api/tickets/1/pack' });
    assert.deepEqual(JSON.parse(again.body).app, { url });
    for (const opts of [{}, { token: 'nope' }, { token, origin: 'http://evil.example' }]) {
      const res = await post(p.port, '/api/tickets/1/app/stop', opts);
      assert.equal(res.status, 403, `stop ${JSON.stringify(opts)}`);
    }
    assert.ok(await answers(url), 'still running after forbidden stop');
    const stopped = await post(p.port, '/api/tickets/1/app/stop', { token });
    assert.equal(stopped.status, 200, stopped.body);
    assert.equal(runningApp(dir, '1'), null);
  } finally {
    await panelAppStop(dir, '1').catch(() => {});
    await stop(p);
  }
});
