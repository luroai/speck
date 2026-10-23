// 0201: a shipping ticket's card says it is shipping once, with how long the ship has been running.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, queueRows, round, panelModel, deferred } from './support/panel.mjs';

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
const textOf = row => topOf(row).children.find(n => /^progress\b/.test(n.className));
const lineOf = row => textOf(row).textContent; // the line under the title (beside the builder badge until 0416)
const count = (s, re) => (s.match(re) || []).length;
const acts = (p, row) => p.all(row).filter(n => /\bact\b/.test(n.className || '')).map(n => n.textContent);

test('0201 AC1: a shipping card says "Shipping" once, under its title, then how long the ship has run, whoever ships it', async () => {
  const p = fake();
  await p.settle();
  for (const [id, time] of [['0801', '00:04'], ['0802', '01:05'], ['0803', '02:05']]) {
    const row = rowOf(p, id);
    assert.match(lineOf(row), new RegExp(`^Shipping · 0?${time.slice(0, -1)}[0-9]$`), `${id}: ${lineOf(row)}`);
    assert.equal(count(row.textContent, /Shipping/g), 1, `${id}: once on the card: ${row.textContent}`);
    const say = textOf(row).children.find(n => /\bsay\b/.test(n.className));
    assert.equal(say.textContent, 'Shipping', `${id}: the sentence is still "Shipping"`);
  }
});

test('0201 AC1: the ship\'s time counts up with the clock between polls', async () => {
  let now = Date.now();
  class Clock extends Date { constructor(...a) { super(...(a.length ? a : [now])); } static now() { return now; } }
  const start = now;
  const p = fake(() => [T('0801', 'approved', approved({ auto_ship: true, build_exit: { at: ago(30, start), code: 0 }, ship: { running: true, auto: true, started: ago(10, start) } }))], { Date: Clock });
  await p.settle();
  assert.equal(lineOf(rowOf(p, '0801')), 'Shipping · 00:10');
  now += 60000;
  for (const { fn, ms } of p.intervals.values()) if (ms === 1000) fn();
  assert.equal(lineOf(rowOf(p, '0801')), 'Shipping · 01:10');
});

test('0201 AC2: a shipping card shows no step name and no separate "Shipping…" line', async () => {
  const p = fake();
  await p.settle();
  for (const id of ['0801', '0802', '0803']) {
    const row = rowOf(p, id);
    assert.ok(!p.all(row).some(n => /^stage\b/.test(n.className || '')), `${id}: no step name`);
    assert.ok(!acts(p, row).some(a => /Shipping/.test(a)), `${id}: no Shipping line: ${acts(p, row).join(' | ')}`);
    assert.doesNotMatch(row.textContent, /Shipping…/, id);
  }
});

test('0201 AC3: a ship from the review pack\'s Ship button the server hasn\'t answered yet says "Shipping" once', async () => {
  const answer = deferred();
  const p = fake(() => TICKETS().filter(t => t.id === '0805'), { ship: () => answer });
  await p.settle();
  p.press(topOf(rowOf(p, '0805')));
  await p.settle();
  p.press(p.all(rowOf(p, '0805')).find(n => n.tagName === 'button' && n.textContent === 'Review pack'));
  await p.settle();
  p.press(p.all(p.byId('full-ticket')).find(n => n.tagName === 'button' && n.textContent === 'Ship'));
  await p.settle();
  const row = rowOf(p, '0805');
  assert.equal(lineOf(row), 'Shipping');
  assert.equal(count(row.textContent, /Shipping/g), 1, row.textContent);
  assert.ok(!p.all(row).some(n => /^stage\b/.test(n.className || '')), 'no step name');
  answer.resolve({ ok: true, status: 200, json: async () => ({ ok: true, message: 'Shipped.' }) });
  await p.settle();
});

test('0201 AC4: cards at every other stage still show their sentence and step name, and no ship time', async () => {
  const p = fake();
  await p.settle();
  const expect = { '0804': ['Writing tests and code', 'Build'], '0805': ['Approved · waiting for you to ship it', 'Ship'], '0806': ['The reviewer is reviewing · round 1', 'Review 1'] };
  for (const [id, [say, stage]] of Object.entries(expect)) {
    const text = textOf(rowOf(p, id));
    assert.equal(text.className, 'progress', id);
    assert.deepEqual(text.children.map(n => [n.className.split(' ')[0], n.textContent]), [['say', say], ['stage', stage]], id);
  }
});

test('0201 AC4: a shipping card\'s build time on the right is unchanged', async () => {
  const p = fake();
  await p.settle();
  const m = panelModel()({ tickets: TICKETS(), ideas: [] }).queue;
  for (const id of ['0801', '0802', '0803']) {
    const t = m.find(x => x.id === id), sub = topOf(rowOf(p, id)).children.at(-1);
    assert.equal(sub.className, 'sub', `${id}: the timer is still last in the top row`);
    assert.ok(t.counter, `${id}: it has a build time`);
    assert.equal(sub.textContent, t.counter, id);
  }
});
