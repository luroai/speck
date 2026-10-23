// 0153: the panel shows a ticket's ship in progress, and an auto-ship that ended without shipping.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, T, round, queueRows, panelModel, exitOf, isRed, stageOf, sayOf, findText, openQueueRows } from './support/panel.mjs';

const ago = s => new Date(Date.now() - s * 1000).toISOString();
const PACK = '## 0001 · Ticket 0001\n**Verdict:** ✅ Approved by reviewer\n';
const MESSAGE = 'Tests failed on the approved branch, so nothing was shipped.';
const approved = (o = {}) => T('0001', 'approved', { started: ago(3600), approved: ago(600), rounds: [round(1, 1)], ...o });
const runningShip = (secs, o = {}) => ({ ship: { running: true, auto: false, started: ago(secs), ...o } });
const failedShip = (o = {}) => ({ ship: { running: false, auto: true, started: ago(300), ended: ago(60), message: MESSAGE, ...o } });
const SHIP_IT = 'Ship it from its review pack, or run /speck-ship 0001';
const LABELS = ['Shipping', "Auto-ship didn't finish", SHIP_IT]; // "Shipping" beside the badge since 0201

// A page whose /api/state answers with `state`, each pack with PACK, and whose confirm question says yes.
function page(state) {
  const sent = [];
  const p = fakePage([], {
    fetch: async (url, opts) => {
      if (/\/ship$/.test(url)) { sent.push(url); return { ok: true, status: 200, json: async () => ({ ok: true, message: 'Shipped.' }) }; }
      const body = /\/log$/.test(url) ? { text: '', truncated: false } : /\/pack$/.test(url) ? { pack: PACK } : state;
      return { ok: true, status: 200, json: async () => JSON.parse(JSON.stringify(body)) };
    },
    confirm: () => true,
  });
  p.sent = sent;
  return p;
}
const row = p => queueRows(p).find(r => r.textContent.includes('0001'));
const texts = (p, n) => p.all(n).map(x => x._text).filter(Boolean);
const buttons = (p, n, re) => p.all(n).filter(x => x.tagName === 'button' && re.test(x.textContent));
async function openPack(p) {
  await p.settle();
  p.press(row(p).children.find(n => n.className === 'top'));
  await p.settle();
  p.press(buttons(p, row(p), /^Review pack$/)[0]);
  await p.settle();
}

test('0153 AC1: a running ship shows "Shipping" on its queue row (0434: with its build\'s time, not the ship\'s)', async () => {
  const m = panelModel()({ tickets: [approved(runningShip(125))], ideas: [] });
  assert.equal(m.queue[0].shipping, true);
  assert.equal(m.queue[0].ship_counter, '02:05');
  const p = page({ tickets: [approved(runningShip(125))], ideas: [] });
  await p.settle();
  const r = row(p);
  assert.ok(findText(p, r, 'Shipping'), 'the label'); // once, beside the badge, since 0201
  assert.ok(!texts(p, r).some(t => /^0?2:0[5-6]$/.test(t)), `not how long the ship has run: ${texts(p, r).join(' | ')}`);
  assert.ok(texts(p, r).includes('50:00'), 'its build\'s time, held at its approval');
  assert.ok(!p.all(r).some(isRed), 'nothing red while it ships');
});

test('0153 AC1: the ship\'s time isn\'t shown or counted between polls (0434)', async () => {
  let now = Date.now();
  class Clock extends Date { constructor(...a) { super(...(a.length ? a : [now])); } static now() { return now; } }
  const state = { tickets: [approved({ ship: { running: true, auto: true, started: new Date(now - 10000).toISOString() } })], ideas: [] };
  const p = fakePage([state], { Date: Clock });
  await p.settle();
  assert.ok(!texts(p, row(p)).includes('00:10'));
  now += 60000;
  for (const { fn, ms } of p.intervals.values()) if (ms === 1000) fn();
  assert.ok(!texts(p, row(p)).includes('01:10'), texts(p, row(p)).join(' | '));
  assert.ok(texts(p, row(p)).includes('50:00'), 'its build\'s time, held at its approval');
});

test('0153 AC1: any running ship shows, whoever started it, and a reload shows it again', async () => {
  for (const auto of [true, false]) {
    const state = { tickets: [approved(runningShip(30, { auto }))], ideas: [] };
    for (let load = 0; load < 2; load++) { // a fresh page each time, as a reload gives
      const p = page(state);
      await p.settle();
      assert.ok(findText(p, row(p), 'Shipping'), `auto ${auto}, load ${load}`);
    }
  }
});

test('0153 AC2: while a ship runs, the review pack\'s Ship button can\'t be clicked', async () => {
  const p = page({ tickets: [approved(runningShip(30))], ideas: [] });
  await openPack(p);
  const b = buttons(p, p.byId('full-ticket'), /^Ship/)[0];
  assert.ok(b, 'the button still shows');
  assert.equal(b.disabled, true);
  assert.equal(b.textContent, 'Shipping…');
  p.press(b);
  await p.settle();
  assert.equal(p.sent.length, 0, 'no ship sent');
});

test('0153 AC2: with no ship running, the Ship button works as before', async () => {
  const p = page({ tickets: [approved()], ideas: [] });
  await openPack(p);
  const b = buttons(p, p.byId('full-ticket'), /^Ship$/)[0];
  assert.equal(b.disabled, false);
  p.press(b);
  await p.settle();
  assert.equal(p.sent.length, 1);
});

test('0153 AC3: an auto-ship that ended without shipping says so, with speck ship\'s message and how to ship it', async () => {
  const state = { tickets: [approved({ ...failedShip(), ...exitOf('the build log tail') })], ideas: [] };
  const m = panelModel()(state);
  assert.equal(m.queue[0].shipping, false);
  const p = page(state);
  await p.settle();
  await openQueueRows(p); // 0434: what's under a Build card's two lines shows while it's open
  const r = row(p), all = texts(p, r);
  const at = l => all.indexOf(l);
  assert.ok(at("Auto-ship didn't finish") >= 0, all.join(' | '));
  assert.ok(at(MESSAGE) > at("Auto-ship didn't finish"), 'the message follows the label');
  assert.ok(at(SHIP_IT) > at(MESSAGE), 'then how to ship it');
  assert.ok(!all.includes('Build finished without shipping'), 'the auto-ship label stands in for the build\'s');
  assert.ok(p.all(r).some(isRed), 'the ship failed, so it is red');
  assert.match(stageOf(r).className, /\bbad\b/);
  assert.equal(sayOf(r).className, 'say bad', 'it needs you, in its sentence (0416: with no badge)');
});

test('0153 AC3: with no message (a killed auto-ship), it says so without one', async () => {
  const p = page({ tickets: [approved(failedShip({ message: null, ended: null }))], ideas: [] });
  await p.settle();
  await openQueueRows(p); // 0434: what's under a Build card's two lines shows while it's open
  const all = texts(p, row(p));
  assert.ok(all.includes("Auto-ship didn't finish"));
  assert.ok(all.includes(SHIP_IT));
  assert.ok(!all.includes(MESSAGE));
  assert.ok(!all.includes('null'));
});

test('0153 AC3: a failure from before the ticket was last approved, or on a ticket no longer approved, isn\'t shown', async () => {
  for (const t of [approved({ approved: ago(10), ...failedShip() }), T('0001', 'reviewing', { started: ago(900), ...failedShip() })]) {
    const p = page({ tickets: [t], ideas: [] });
    await p.settle();
    for (const l of LABELS) assert.ok(!texts(p, row(p)).includes(l), `${t.status}: ${l}`);
  }
});

test('0153 AC4: an approved ticket auto-ship doesn\'t cover shows none of these, and stays purple', async () => {
  const state = { tickets: [approved({ risk: 'high', ship: null, ...exitOf('Not shipping automatically: ticket 0001 has risk "high".') })], ideas: [] };
  const m = panelModel()(state);
  assert.equal(m.queue[0].shipping, false);
  assert.equal(m.queue[0].to_ship, true);
  const p = page(state);
  await p.settle();
  await openQueueRows(p); // 0434: what's under a Build card's two lines shows while it's open
  const all = texts(p, row(p));
  for (const l of LABELS) assert.ok(!all.includes(l), l);
  assert.ok(all.includes('Build finished without shipping'));
  assert.ok(!p.all(row(p)).some(isRed));
  // And with no build exit at all, nothing either.
  const q = page({ tickets: [approved()], ideas: [] });
  await q.settle();
  await openQueueRows(q); // 0434: what's under a Build card's two lines shows while it's open
  for (const l of LABELS) assert.ok(!texts(q, row(q)).includes(l), l);
});

test('0153 AC4: a state from an older speck with no ship field shows none of these', async () => {
  const t = approved();
  delete t.ship;
  const p = page({ tickets: [t, approved({ id: '0002', ship: 'nonsense' })], ideas: [] });
  await p.settle();
  for (const r of queueRows(p)) for (const l of LABELS) assert.ok(!texts(p, r).includes(l), l);
});

test('0153 AC1 AC2: a ticket speck ship has set done while its push still runs stays in the queue as shipping, with its Ship button disabled', async () => {
  const state = { tickets: [T('0001', 'done', { started: ago(3600), approved: ago(600), finished: ago(5), rounds: [round(1, 1)], ...runningShip(90) })], ideas: [] };
  const m = panelModel()(state);
  assert.deepEqual(m.queue.map(t => t.id), ['0001']);
  assert.equal(m.queue[0].shipping, true);
  assert.equal(m.queue[0].steps.find(s => s.state === 'now').label, 'Ship');
  assert.equal(m.shipped.length, 0, 'not in Shipped until the ship ends');
  assert.equal(m.shippedTotal, 0);
  for (let load = 0; load < 2; load++) { // and again after a reload
    const p = page(state);
    await p.settle();
    assert.ok(findText(p, row(p), 'Shipping'));
    p.press(row(p).children.find(n => n.className === 'top'));
    await p.settle();
    p.press(buttons(p, row(p), /^Review pack$/)[0]);
    await p.settle();
    const b = buttons(p, p.byId('full-ticket'), /^Ship/)[0];
    assert.ok(b, 'the pack shows its Ship button');
    assert.equal(b.disabled, true);
    assert.equal(b.textContent, 'Shipping…');
    p.press(b);
    await p.settle();
    assert.equal(p.sent.length, 0, 'no ship sent');
  }
  // Once it has ended, it moves to Shipped.
  const after = panelModel()({ tickets: [T('0001', 'done', { started: ago(3600), finished: ago(5), ship: null })], ideas: [] });
  assert.equal(after.queue.length, 0);
  assert.equal(after.shipped.length, 1);
});
