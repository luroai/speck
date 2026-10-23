import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { T, fakePage, queueRows, click, page as html, post } from './support/panel.mjs';
import { buildPanel, runs, psState, cli } from './support/build-panel.mjs';

// ---------- 0145: no pause or play icon on the Build queue's rows ----------

const started = () => new Date(Date.now() - 60000).toISOString();
const state = () => ({
  tickets: [
    T('0001', 'building', { build_running: true, paused: false, started: started() }),
    T('0002', 'reviewing', { build_running: true, paused: true, started: started() }),
    T('0003', 'building', { build_running: false, paused: false }), // built by hand, with no run record
    T('0004', 'ready', { build_running: false, paused: false }),
  ],
  ideas: [],
});
function page(s = state(), stop = () => ({ ok: true, status: 200, json: async () => ({ ok: true }) })) {
  return fakePage([], {
    fetch: async (url, opts) => (/\/stop$/.test(url) ? stop(url, opts)
      : { ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify(s))) }),
    confirm: () => true,
  });
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const topOf = row => row.children.find(n => n.className === 'top');
const buttons = (p, row) => p.all(row).filter(n => n.tagName === 'button');

test('0145 AC1: no queue row has a pause or play icon, running, paused or neither, closed or open', async () => {
  const p = page();
  await p.settle();
  for (const open of [false, true]) {
    for (const id of ['0001', '0002', '0003', '0004']) {
      const row = rowOf(p, id);
      if (open) { click(topOf(row)); await p.settle(); }
      const r = rowOf(p, id);
      assert.ok(!p.all(r).some(n => /\btoggle-build\b/.test(n.className || '')), `${id}: no icon`);
      assert.ok(!buttons(p, r).some(b => /pause|play/i.test(`${b.title || ''} ${b.textContent}`)), `${id}: no pause or play button`);
      // 0155: the old space on the left of the top row is gone: the row starts with the ticket's id.
      assert.equal(topOf(r).children[0].children[0].className, 'id', `${id}: the top row starts with the id`);
    }
  }
  assert.doesNotMatch(html(), /toggle-build|toggleIcon|toggleBuild|\/(pause|play)`/, 'the page has no icon or its requests left');
});

test('0145 AC2: a paused build still says "Paused", with the command that carries it on', async () => {
  const s = state();
  const p = page(s);
  await p.settle();
  const paused = rowOf(p, '0002');
  assert.match(p.all(topOf(paused)).find(n => n.className === 'sub').textContent, /^Paused · 01:0\d$/);
  assert.ok(p.all(paused).some(n => n._text && n._text.includes('speck play 0002')), 'it shows speck play 0002');
  const running = rowOf(p, '0001');
  assert.ok(!p.all(running).some(n => n._text && /speck play|Paused/.test(n._text)), 'a running build shows neither');
  s.tickets[1].paused = false; // played again from the command line
  p.timers.shift()();
  await p.settle();
  assert.ok(!p.all(rowOf(p, '0002')).some(n => n._text && /speck play|Paused/.test(n._text)), 'played: both go');
});

test('0145 AC3: an open building or reviewing row still has Stop build, and it sends the stop as before', async () => {
  const sent = [];
  const p = page(state(), (url, opts) => { sent.push([url, opts.method, opts.headers['X-Speck-Token']]); return { ok: true, status: 200, json: async () => ({ ok: true }) }; });
  await p.settle();
  for (const id of ['0001', '0002']) {
    click(topOf(rowOf(p, id)));
    await p.settle();
    const stop = buttons(p, rowOf(p, id)).find(b => b.className === 'stop-build');
    assert.ok(stop, `${id}: Stop build`);
    assert.equal(stop.textContent, 'Stop build');
    p.press(stop);
    await p.settle();
  }
  assert.deepEqual(sent, [['/api/tickets/0001/stop', 'POST', '{{token}}'], ['/api/tickets/0002/stop', 'POST', '{{token}}']]);
});

test('0145 AC4: the server answers 404 to pause and play and changes nothing; speck pause and speck play still work', async () => {
  const b = await buildPanel();
  try {
    for (const what of ['pause', 'play']) {
      if (what === 'play') assert.equal(cli(b.r.dir, 'pause', '0001').status, 0, 'paused from the CLI');
      const before = psState(b.pid), marked = fs.existsSync(runs(b.r.dir, '0001.paused'));
      const res = await post(b.port, `/api/tickets/0001/${what}`, { token: b.token });
      assert.equal(res.status, 404, `${what}: ${res.status} ${res.body}`);
      assert.equal(psState(b.pid), before, `${what}: the build is as it was`);
      assert.equal(fs.existsSync(runs(b.r.dir, '0001.paused')), marked, `${what}: the paused mark is as it was`);
    }
    assert.match(psState(b.pid), /T/, 'speck pause paused it');
    assert.equal(cli(b.r.dir, 'play', '0001').status, 0);
    assert.doesNotMatch(psState(b.pid), /T/, 'speck play carried it on');
    assert.ok(!fs.existsSync(runs(b.r.dir, '0001.paused')));
    // Stop is still answered: a hand-built ticket gets speck stop's refusal, not 404.
    const stop = await post(b.port, '/api/tickets/0002/stop', { token: b.token });
    assert.equal(stop.status, 409, stop.body);
  } finally { await b.done(); }
});
