// 0201: a shipping ticket's row says it is shipping once, with how long the ship has been running.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, queueRows, tipSentence, round, panelModel, deferred, fullViewOf } from './support/panel.mjs';

const ago = (s, now = Date.now()) => new Date(now - s * 1000).toISOString();
const PACK = '## 0805 · Ticket 0805\n**Verdict:** ✅ Approved by reviewer\n';
const approved = o => ({ started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], ...o });
const TICKETS = () => [
  T('0801', 'approved', approved({ auto_ship: true, build_exit: { at: ago(30), code: 0 }, ship: { running: true, auto: true, started: ago(4) } })), // by the ship queue
  T('0802', 'approved', approved({ auto_ship: false, build_running: true, ship: { running: true, auto: false, started: ago(65) } })), // by the user, its build still running
  T('0803', 'done', approved({ finished: ago(2), ship: { running: true, auto: false, started: ago(125) } })), // set done while its push runs
  T('0804', 'building', { started: ago(300) }),
  T('0805', 'approved', approved({ auto_ship: false, build_exit: { at: ago(30), code: 0 } })), // waits for you to ship it
  T('0806', 'reviewing', { started: ago(600), self_check: 'no changes', rounds: [round(1, 10)] }),
];

function fake(tickets = TICKETS, { ship = () => ({ ok: true, status: 200, json: async () => ({ ok: true, message: 'Shipped.' }) }), Date: D } = {}) {
  return fakePage([], {
    fetch: async url => {
      if (/\/ship$/.test(url)) return ship();
      const body = /\/log$/.test(url) ? { text: '', truncated: false } : /\/pack$/.test(url) ? { pack: PACK } : { tickets: tickets(), ideas: [] };
      return { ok: true, status: 200, json: async () => JSON.parse(JSON.stringify(body)) };
    },
    confirm: () => true,
    ...(D ? { Date: D } : {}),
  });
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const topOf = row => row.children.find(n => n.className === 'top');
// 0585: the row's line saying where the ticket is, its words, and the sentence (the line's hover text when it differs)
const whereOf = (p, row) => p.all(row).find(n => /^where\b/.test(n.className));
const lineOf = (p, row) => p.all(whereOf(p, row)).find(n => n.className === 'said').textContent;
const sentenceOf = (p, row) => tipSentence(whereOf(p, row)) || lineOf(p, row);
const count = (s, re) => (s.match(re) || []).length;
const acts = (p, row) => p.all(row).filter(n => /\bact\b/.test(n.className || '')).map(n => n.textContent);

test('0201 AC1: a shipping row says "Shipping" once, in its line, whoever ships it (0434: and not how long the ship has run)', async () => {
  const p = fake();
  await p.settle();
  for (const id of ['0801', '0802', '0803']) {
    const row = rowOf(p, id);
    assert.equal(lineOf(p, row), 'Shipping', `${id}: ${lineOf(p, row)}`);
    assert.ok(!p.all(row).some(n => /^ship-(at|time)\b/.test(n.className || '')), `${id}: no ship's time`);
    assert.equal(count(row.textContent, /Shipping/g), 1, `${id}: once on the row: ${row.textContent}`);
    assert.equal(sentenceOf(p, row), 'Shipping', `${id}: the sentence is still "Shipping"`);
  }
});

test('0201 AC1: no ship\'s time counts up with the clock between polls (0434)', async () => {
  let now = Date.now();
  class Clock extends Date { constructor(...a) { super(...(a.length ? a : [now])); } static now() { return now; } }
  const start = now;
  const p = fake(() => [T('0801', 'approved', approved({ auto_ship: true, build_exit: { at: ago(30, start), code: 0 }, ship: { running: true, auto: true, started: ago(10, start) } }))], { Date: Clock });
  await p.settle();
  assert.equal(lineOf(p, rowOf(p, '0801')), 'Shipping');
  now += 60000;
  for (const { fn, ms } of p.intervals.values()) if (ms === 1000) fn();
  assert.equal(lineOf(p, rowOf(p, '0801')), 'Shipping');
  assert.ok(!p.all(rowOf(p, '0801')).some(n => /^ship-(at|time)\b/.test(n.className || '')), 'no ship\'s time');
  assert.equal(count(rowOf(p, '0801').textContent, /Shipping/g), 1, rowOf(p, '0801').textContent);
});

test('0201 AC2: a shipping row shows no step name and no separate "Shipping…" line, nor does its full view', async () => {
  const p = fake();
  await p.settle();
  for (const id of ['0801', '0802', '0803']) {
    const row = rowOf(p, id);
    assert.ok(!p.all(row).some(n => /^stage\b/.test(n.className || '')), `${id}: no step name`);
    assert.ok(!acts(p, row).some(a => /Shipping/.test(a)), `${id}: no Shipping line: ${acts(p, row).join(' | ')}`);
    assert.doesNotMatch(row.textContent, /Shipping…/, id);
    const full = await fullViewOf(p, id);
    assert.ok(!acts(p, full).some(a => /Shipping/.test(a)), `${id}: no Shipping line in the full view: ${acts(p, full).join(' | ')}`);
  }
});

test('0201 AC3: a ship from the review pack\'s Ship button the server hasn\'t answered yet says "Shipping" once', async () => {
  const answer = deferred();
  const p = fake(() => TICKETS().filter(t => t.id === '0805'), { ship: () => answer });
  await p.settle();
  const full = await fullViewOf(p, '0805');
  p.press(p.all(full).find(n => n.tagName === 'button' && n.textContent === 'Review pack'));
  await p.settle();
  p.press(p.all(p.byId('full-ticket')).find(n => n.tagName === 'button' && n.textContent === 'Ship'));
  await p.settle();
  const row = rowOf(p, '0805');
  assert.equal(lineOf(p, row), 'Shipping', 'in the row\'s line (0585)');
  assert.equal(count(row.textContent, /Shipping/g), 1, row.textContent);
  assert.ok(!p.all(row).some(n => /^stage\b/.test(n.className || '')), 'no step name');
  answer.resolve({ ok: true, status: 200, json: async () => ({ ok: true, message: 'Shipped.' }) });
  await p.settle();
});

test('0201 AC4: rows at every other stage still show their sentence, and no ship time; their step is in the full view', async () => {
  const p = fake();
  await p.settle();
  const expect = { '0804': ['Writing tests and code', 'Built'], '0805': ['Approved · waiting for you to ship it', 'Ship'], '0806': ['The reviewer is reviewing · round 1', 'Reviewed'] };
  for (const [id, [say, stage]] of Object.entries(expect)) {
    assert.equal(sentenceOf(p, rowOf(p, id)), say, id);
    assert.ok(!p.all(rowOf(p, id)).some(n => /^(stage|ship-at)\b/.test(n.className || '')), `${id}: no step name or ship time on the row`);
    const now = p.all(await fullViewOf(p, id)).find(n => /^step\b/.test(n.className || '') && /\b(now|waits)\b/.test(n.className));
    assert.equal(now?.textContent, stage, `${id}: its step in the full view`);
  }
});

test('0201 AC4: a shipping row\'s build time is unchanged', async () => {
  const p = fake();
  await p.settle();
  const m = panelModel()({ tickets: TICKETS(), ideas: [] }).queue;
  for (const id of ['0801', '0802', '0803']) {
    const t = m.find(x => x.id === id), sub = p.all(whereOf(p, rowOf(p, id))).find(n => n.className === 'sub');
    assert.ok(sub, `${id}: the time is still in the row's line`);
    assert.ok(t.counter, `${id}: it has a build time`);
    assert.match(sub.textContent, /^(\d+|<1) min$/, id);
  }
});
