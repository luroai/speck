// 0133: an approved ticket's review pack, opened in the panel, has a Ship button that ships it as `/speck-ship` does.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, freePort, startPanel, stop, request, post, tokenOf, fakePage, T, queueRows, shippedRows, panelModel, deferred, openDetails } from './support/panel.mjs';
import { shipRepo } from './support/ship.mjs';

const ago = min => new Date(Date.now() - min * 60000).toISOString();
const STATE = () => ({ ideas: [], tickets: [
  T('0005', 'approved', { started: ago(30) }), T('0006', 'building', { started: ago(10) }), T('0007', 'ready'),
  T('0010', 'done', { started: ago(50), finished: ago(20) }),
] });
const PACK = '## 0005 · Ticket 0005\n**Verdict:** ✅ Approved by reviewer\n\n### Risk\n- Ticket risk: **high**\n';

// A page whose server answers each ship with `answer(url, opts)`, each pack with `pack`, /api/state with `s()`, and
// whose confirm question gets `yes()`.
function page({ s = STATE, answer = () => ({ ok: true, status: 200, json: async () => ({ ok: true, message: 'Shipped 0005.' }) }),
  pack = { pack: PACK }, yes = () => true, asked = [] } = {}) {
  const sent = [];
  const p = fakePage([], {
    fetch: async (url, opts) => {
      if (/\/ship$/.test(url)) { sent.push([url, opts]); return answer(url, opts); }
      const body = /\/log$/.test(url) ? { text: '', truncated: false } : /\/pack$/.test(url) ? pack : s();
      return { ok: true, status: 200, json: async () => JSON.parse(JSON.stringify(body)) };
    },
    confirm: q => { asked.push(q); return yes(); },
  });
  p.sent = sent;
  return p;
}
const pane = p => p.byId('full-ticket');
const buttonsIn = (p, n, text) => p.all(n).filter(x => x.tagName === 'button' && (text instanceof RegExp ? text.test(x.textContent) : x.textContent === text));
const shipOf = p => buttonsIn(p, pane(p), /^Ship/)[0] || null;
const rowOf = (p, id) => queueRows(p).find(r => r.textContent.includes(id));
async function openPack(p, id = '0005') {
  await p.settle();
  const row = rowOf(p, id);
  p.press(row.children.find(n => n.className === 'top'));
  await p.settle();
  p.press(buttonsIn(p, rowOf(p, id), 'Review pack')[0]);
  await p.settle();
}

test('0133 AC1: the review pack of an approved ticket has a Ship button', async () => {
  const p = page();
  await openPack(p);
  assert.ok(pane(p).textContent.includes('Approved by reviewer'), 'the pack shows');
  const b = shipOf(p);
  assert.ok(b, 'a Ship button');
  assert.equal(b.textContent, 'Ship');
  assert.equal(b.disabled, false);
});

test('0133 AC1: a ticket in any other status has no Ship button, and there is none outside a review pack', async () => {
  const p = page();
  await p.settle();
  // The shipped ticket's pack: done, so no Ship button. Its Review pack is under Details since 0162.
  await openDetails(p);
  p.press(buttonsIn(p, shippedRows(p).find(r => r.textContent.includes('0010')), 'Review pack')[0]);
  await p.settle();
  assert.ok(pane(p).textContent.includes('Approved by reviewer'), 'the pack shows');
  assert.equal(shipOf(p), null, 'no Ship button on a done ticket\'s pack');
  // An approved ticket whose pack is still there but whose status has moved on (here: reviewing again) has none either.
  let status = 'approved';
  const q = page({ s: () => ({ ...STATE(), tickets: STATE().tickets.map(t => (t.id === '0005' ? { ...t, status } : t)) }) });
  await openPack(q);
  assert.ok(shipOf(q));
  status = 'reviewing';
  for (const fn of q.timers.splice(0)) fn(); // the next poll
  await q.settle();
  assert.equal(pane(q).hidden, false, 'the pack stays open');
  assert.equal(shipOf(q), null, 'no Ship button once it isn\'t approved');
  // Nowhere outside a review pack: every queue row open, the Shipped table, the shaping column, and the full ticket.
  const r = page();
  await r.settle();
  for (const row of queueRows(r)) { r.press(row.children.find(n => n.className === 'top')); await r.settle(); }
  for (const id of ['queue', 'shipped', 'shaping']) assert.equal(buttonsIn(r, r.byId(id), /^Ship/).length, 0, id);
  r.press(buttonsIn(r, rowOf(r, '0005'), 'Full ticket')[0]);
  await r.settle();
  assert.equal(pane(r).hidden, false);
  assert.equal(shipOf(r), null, 'the full ticket of an approved ticket has none');
});

test('0133 AC2: clicking Ship asks first; confirming sends the ship with the token and shows it is shipping until it finishes', async () => {
  const asked = [], done = deferred();
  const p = page({ answer: () => done, asked });
  await openPack(p);
  p.press(shipOf(p));
  await p.settle();
  assert.equal(asked.length, 1, 'asked once');
  assert.match(asked[0], /Ship 0005\?/);
  assert.deepEqual(p.sent.map(([u, o]) => [u, o.method, o.headers['X-Speck-Token']]), [['/api/tickets/0005/ship', 'POST', '{{token}}']]);
  assert.equal(shipOf(p).disabled, true, 'the button can\'t be clicked again');
  assert.match(shipOf(p).textContent, /Shipping/);
  assert.match(rowOf(p, '0005').textContent, /Shipping/, 'the queue row says so too');
  p.press(shipOf(p));
  await p.settle();
  assert.equal(p.sent.length, 1, 'a second click sends nothing more');
  done.resolve({ ok: true, status: 200, json: async () => ({ ok: true, message: 'Shipped 0005: merged it into main.' }) });
  await p.settle();
  assert.doesNotMatch(rowOf(p, '0005').textContent, /Shipping…/);
  assert.ok(pane(p).textContent.includes('Shipped 0005: merged it into main.'), 'it says what happened');
  assert.equal(shipOf(p), null, 'no Ship button once it has shipped');
});

test('0133 AC2: cancelling the question sends nothing and changes nothing', async () => {
  const asked = [];
  const p = page({ yes: () => false, asked });
  await openPack(p);
  const before = pane(p).textContent, calls = p.sent.length;
  p.press(shipOf(p));
  await p.settle();
  assert.equal(asked.length, 1);
  assert.equal(p.sent.length, calls, 'no ship sent');
  assert.equal(pane(p).textContent, before, 'the pane is as it was');
  assert.equal(shipOf(p).textContent, 'Ship');
  assert.equal(shipOf(p).disabled, false);
});

test('0133 AC2 AC4 (review F1): a poll showing the ticket done mid-ship keeps it shown as shipping, and a failed push\'s message stays', async () => {
  let status = 'approved';
  const s = () => ({ ideas: [], tickets: [T('0005', status, { started: ago(30), ...(status === 'done' ? { finished: ago(0) } : {}) })] });
  const done = deferred();
  const p = page({ s, answer: () => done });
  await openPack(p);
  p.press(shipOf(p));
  await p.settle();
  status = 'done'; // speck ship has merged it and is pushing
  for (const fn of p.timers.splice(0)) fn();
  await p.settle();
  assert.equal(pane(p).hidden, false, 'the pack stays open, now from the Shipped table');
  assert.ok(shippedRows(p).some(r => r.textContent.includes('0005')));
  assert.match(pane(p).textContent, /Shipping 0005/);
  assert.equal(shipOf(p).disabled, true);
  const why = 'Merged locally, but pushing main to origin failed:\nrejected\nRun `git pull`, then `git push origin main`.';
  done.resolve({ ok: false, status: 409, json: async () => ({ error: why }) });
  await p.settle();
  assert.ok(p.all(pane(p)).some(n => n._text === why && /\bbad\b/.test(n.className)), 'the push failure and how to fix it show');
  assert.equal(shipOf(p), null, 'no Ship button on a done ticket');
  for (const fn of p.timers.splice(0)) fn();
  await p.settle();
  assert.ok(p.all(pane(p)).some(n => n._text === why), 'still there after the next poll');
});

test('0133 AC4: a refusal shows speck ship\'s message in the pack, and the button comes back', async () => {
  const why = 'Tests failed on the approved branch, so nothing was shipped.';
  const p = page({ answer: () => ({ ok: false, status: 409, json: async () => ({ error: why }) }) });
  await openPack(p);
  p.press(shipOf(p));
  await p.settle();
  const shown = p.all(pane(p)).find(n => n._text === why);
  assert.ok(shown, 'the message shows');
  assert.match(shown.className, /\bbad\b/);
  assert.equal(shipOf(p).textContent, 'Ship', 'it can be tried again');
  const r = page({ answer: () => { throw new Error('offline'); } });
  await openPack(r);
  r.press(shipOf(r));
  await r.settle();
  assert.match(pane(r).textContent, /Couldn't reach the panel server/);
});

// ---------- the server ----------

async function served(opts) {
  const r = shipRepo(opts);
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  const token = tokenOf((await request(p.port)).body);
  return { r, p, port: p.port, token };
}

test('0133 AC2 AC3: confirming runs speck ship, and the ticket shows in the Shipped table as done', async () => {
  const { r, p, port, token } = await served();
  try {
    const before = panelModel()(JSON.parse((await request(port, { pathName: '/api/state' })).body));
    assert.ok(before.queue.some(t => t.id === '0001' && t.status === 'approved'), 'approved in the queue first');
    const res = await post(port, '/api/tickets/1/ship', { token });
    assert.equal(res.status, 200, res.body);
    assert.match(JSON.parse(res.body).message, /Shipped 0001/);
    assert.equal(r.statusIn(r.dir), 'done');
    assert.match(r.g('log', '-1', '--format=%s', 'main'), /^speck\(0001\): Export bookings/);
    assert.equal(r.sha('speck/0001-export-bookings'), '', 'the branch is gone, as after /speck-ship');
    assert.ok(!fs.existsSync(r.wt), 'the worktree is gone');
    const after = panelModel()(JSON.parse((await request(port, { pathName: '/api/state' })).body));
    assert.ok(after.shipped.some(t => t.id === '0001' && t.status === 'done'), 'in the Shipped table as done');
    assert.ok(!after.queue.some(t => t.id === '0001'), 'out of the queue');
  } finally { await stop(p); }
});

test('0133 AC4: when speck ship refuses, the panel gets its message and the ticket stays approved', async () => {
  const { r, p, port, token } = await served();
  try {
    fs.writeFileSync(path.join(r.wt, 'shared.txt'), 'half done\n');
    const before = r.snapshot();
    const res = await post(port, '/api/tickets/1/ship', { token });
    assert.equal(res.status, 409, res.body);
    const cli = r.run('ship', '1');
    assert.notEqual(cli.status, 0);
    assert.equal(JSON.parse(res.body).error, cli.stderr.trim(), 'the same message as speck ship');
    assert.deepEqual(r.snapshot(), before, 'nothing changed');
    assert.equal(r.statusIn(r.wt), 'approved');
  } finally { await stop(p); }
  const failing = await served({ test: 'false' });
  try {
    const before = failing.r.snapshot();
    const res = await post(failing.port, '/api/tickets/1/ship', { token: failing.token });
    assert.equal(res.status, 409, res.body);
    assert.match(JSON.parse(res.body).error, /Tests failed/);
    assert.deepEqual(failing.r.snapshot(), before, 'nothing changed');
    assert.equal(failing.r.statusIn(failing.r.wt), 'approved');
    const missing = await post(failing.port, '/api/tickets/42/ship', { token: failing.token });
    assert.equal(missing.status, 404, missing.body);
    assert.match(JSON.parse(missing.body).error, /42/);
  } finally { await stop(failing.p); }
});

test('0133 AC5: a ship without the panel\'s token, or from another origin, gets 403 and changes nothing', async () => {
  const { r, p, port, token } = await served();
  try {
    const before = r.snapshot();
    for (const opts of [{}, { token: 'nope' }, { token, origin: 'http://evil.example' }, { token, origin: null }]) {
      const res = await post(port, '/api/tickets/1/ship', opts);
      assert.equal(res.status, 403, JSON.stringify(opts));
    }
    assert.deepEqual(r.snapshot(), before, 'nothing changed');
    assert.equal(r.statusIn(r.wt), 'approved');
    const ok = await post(port, '/api/tickets/1/ship', { token, origin: `http://localhost:${port}`, host: `localhost:${port}` });
    assert.equal(ok.status, 200, 'localhost works too, as for the other writes');
  } finally { await stop(p); }
});

test('0133 AC2 (self-check): a second ship while one is running is refused, and the first still ships', async () => {
  const { r, p, port, token } = await served({ test: 'sleep 2' });
  try {
    const first = post(port, '/api/tickets/1/ship', { token });
    await new Promise(res => setTimeout(res, 300));
    const second = await post(port, '/api/tickets/1/ship', { token });
    assert.equal(second.status, 409, second.body);
    assert.match(JSON.parse(second.body).error, /0001 is shipping/);
    const res = await first;
    assert.equal(res.status, 200, res.body);
    assert.equal(r.statusIn(r.dir), 'done');
    const again = await post(port, '/api/tickets/1/ship', { token });
    assert.equal(again.status, 409, 'once it has finished, the next ship runs speck ship again, which refuses');
    assert.doesNotMatch(JSON.parse(again.body).error, /is shipping/);
  } finally { await stop(p); }
});

test('0133 Notes: the docs say shipping happens through /speck-ship or the panel\'s Ship button, and agents never ship on their own', () => {
  const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const f of ['docs/brief.md', 'AGENTS.md', 'README.md', 'skills/speck-ship/SKILL.md', 'scripts/install.mjs'])
    assert.match(read(f), /Ship button/, f);
});
