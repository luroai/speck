import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0762: at speck serve's address, a project that is off, or not on the list at all, is left out of All projects and
// the project menu, even with its panel running. Checked on the address started in this process, with stand-in panels.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { startFront } from '../scripts/serve-front.mjs';
import { panelsHere, standInPanel, ask, cookieOf } from './support/serve-front.mjs';

async function front(t, dir, list, shown) {
  const f = await startFront({ port: 0, env: { ...process.env, SPECK_PANELS_DIR: dir }, projects: () => list(), shown });
  t.after(() => f.close());
  return { ...f, origin: `http://127.0.0.1:${f.port}` };
}
async function panel(t, dir, name, opts) {
  const p = await standInPanel(dir, name, opts);
  t.after(() => p.stop());
  return p;
}
const choose = (f, to) => ask(f.port, { method: 'POST', pathName: `/api/projects/${to}`, origin: f.origin });

test('0762 AC3: All projects and the choices at the address leave out a project that is off or not listed, even with its panel running', async t => {
  const dir = panelsHere();
  const a = await panel(t, dir, 'alpha', { summary: { status: 'Idle', mood: 'watching', building: 0, needs_you: 0, needs: [] } });
  const b = await panel(t, dir, 'bravo', { summary: { status: 'Building 2', mood: 'focused', building: 2, needs_you: 1, needs: [{ id: '0009', title: 'Off one', why: 'question', detail: '' }], shipped_week: 4 } });
  const c = await panel(t, dir, 'charlie', { summary: { status: 'Building 1', mood: 'focused', building: 1, needs_you: 1, needs: [] } });
  // alpha is on; bravo is listed but off; charlie isn't listed at all. Each has a panel running.
  let on = [{ folder: '/x/alpha', name: 'alpha', port: a.port }];
  let ports = new Set([a.port]);
  const f = await front(t, dir, () => on, () => ports);

  const sum = JSON.parse((await ask(f.port, { method: 'POST', pathName: '/api/projects/summary', origin: f.origin })).body);
  assert.deepEqual(sum.projects.map(p => p.name), ['alpha'], 'only the project that is on');
  assert.ok(!JSON.stringify(sum).includes('Off one'), 'nothing of the others counts');

  for (const p of [b, c]) {
    const r = await choose(f, p.port);
    assert.equal(r.status, 404, `${p.name} can't be chosen`);
    assert.equal(r.headers['set-cookie'], undefined);
  }
  const chose = await choose(f, a.port);
  assert.equal(chose.status, 200, chose.body);

  // A choice of bravo made before it was turned off: its page is told its project has gone, and nothing reaches it.
  ports = new Set([a.port, b.port]);
  on = [...on, { folder: '/x/bravo', name: 'bravo', port: b.port }];
  const bravo = cookieOf(await choose(f, b.port));
  on = on.slice(0, 1); ports = new Set([a.port]);
  b.seen.length = 0;
  const left = await ask(f.port, { pathName: '/api/state', cookie: bravo });
  assert.equal(left.status, 502);
  assert.equal(JSON.parse(left.body).gone, true);
  assert.equal(b.seen.length, 0, 'nothing reached bravo\'s panel');
  const events = await ask(f.port, { pathName: '/api/events', cookie: bravo });
  const list = JSON.parse(events.body.match(/^data: (.*)$/m)[1]).list;
  assert.deepEqual(list.map(p => p.name), ['alpha'], 'the panels still shown are only the ones that are on');
});

test('0762 AC3: started without a list of what to show, the address shows every running panel as before', async t => {
  const dir = panelsHere(), c = await panel(t, dir, 'charlie');
  const f = await front(t, dir, () => []);
  assert.equal((await choose(f, c.port)).status, 200);
});

// ---------- the project menu's list, in /api/state answers passed on ----------

// A panel on a free port that answers /api/state with each of `answers` in turn, keeping the headers of each request,
// with a record in `dir` as a running panel has.
async function statePanel(t, dir, name, answers) {
  const seen = [];
  const server = http.createServer((req, res) => {
    seen.push(req.headers);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'X-Speck-Board': 'e:1' });
    res.end(JSON.stringify(answers.shift()));
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port, record = path.join(dir, `${port}.json`);
  fs.writeFileSync(record, `${JSON.stringify({ pid: process.pid, port, name, repo: `/stand-in/${name}` })}\n`);
  t.after(() => new Promise(r => { fs.rmSync(record, { force: true }); server.close(() => r()); server.closeAllConnections(); }));
  return { port, seen };
}

test('0762 AC3: the project menu\'s list in each board passed on leaves out the panels the address doesn\'t show, whatever the page\'s speck', async t => {
  const dir = panelsHere(), b = await panel(t, dir, 'bravo'), c = await panel(t, dir, 'charlie');
  const answers = [];
  const a = await statePanel(t, dir, 'alpha', answers);
  let ports = new Set([a.port]);
  const f = await front(t, dir, () => [{ folder: '/x/alpha', name: 'alpha', port: a.port }], () => ports);
  const cookie = cookieOf(await choose(f, a.port));
  // An older page lists the address itself as a panel, speck serve: that stays, so its menu goes back to All projects.
  const list = [{ port: a.port, name: 'alpha' }, { port: b.port, name: 'bravo' }, { port: c.port, name: 'charlie' }, { port: f.port, name: 'speck serve' }];
  const names = part => part.list.map(p => p.name);
  const state = async have => JSON.parse((await ask(f.port, { pathName: '/api/state', cookie, headers: have ? { 'X-Speck-Have': have } : {} })).body);

  // The whole board, asked for while the address has seen no list from alpha's panel, though the page has a board.
  answers.push({ tickets: [], projects: { self: a.port, list } });
  const whole = await state('e:1');
  assert.equal(a.seen.at(-1)['x-speck-have'], undefined, 'the whole board is asked for');
  assert.deepEqual(names(whole.projects), ['alpha', 'speck serve']);
  assert.deepEqual(whole.tickets, [], 'the rest as it came');

  // Only what changed, with the list: cut down.
  answers.push({ delta: { from: 'e:1', to: 'e:2', keys: ['tickets', 'projects'], set: { projects: { self: a.port, list } }, lists: {} } });
  const changed = await state('e:1');
  assert.equal(a.seen.at(-1)['x-speck-have'], 'e:1', 'once it has seen a list, only what changed is asked for');
  assert.deepEqual(names(changed.delta.set.projects), ['alpha', 'speck serve']);

  // bravo turned on: a change that leaves the list out, as unchanged, gets it put in as the address shows it now.
  ports = new Set([a.port, b.port]);
  answers.push({ delta: { from: 'e:2', to: 'e:3', keys: ['tickets', 'projects'], set: {}, lists: {} } });
  const on = await state('e:2');
  assert.deepEqual(names(on.delta.set.projects), ['alpha', 'bravo', 'speck serve']);
  assert.deepEqual(on.delta.keys, ['tickets', 'projects']);

  // A board with no list, as with one panel running, is sent as it came.
  answers.push({ tickets: [{ id: '0001' }] });
  assert.deepEqual(await state(), { tickets: [{ id: '0001' }] });
});

test('0762 AC3: without a list of what to show, a board is passed on as it came', async t => {
  const dir = panelsHere(), c = await panel(t, dir, 'charlie'), answers = [];
  const a = await statePanel(t, dir, 'alpha', answers);
  const f = await front(t, dir, () => []);
  const cookie = cookieOf(await choose(f, a.port));
  const list = [{ port: a.port, name: 'alpha' }, { port: c.port, name: 'charlie' }];
  answers.push({ tickets: [], projects: { self: a.port, list } });
  const r = await ask(f.port, { pathName: '/api/state', cookie, headers: { 'X-Speck-Have': 'e:1' } });
  assert.deepEqual(JSON.parse(r.body).projects.list, list);
  assert.equal(a.seen.at(-1)['x-speck-have'], 'e:1');
});
