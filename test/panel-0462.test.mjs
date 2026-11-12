import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, round, queueRows, boardPage, fullViewOf } from './support/panel.mjs';

// ---------- 0462: an in-flight Build ticket's facts in a table of cells under its step track (0585: in its full view) ----------

const NOW = Date.now();
const ago = s => new Date(NOW - s * 1000).toISOString();
const LONG = 'a-reviewer-model-with-a-very-long-name-6.1-sol';

const TICKETS = [
  T('0901', 'building', { started: ago(65), build_running: true, builder: 'claude', priority: 1, size: 'M', risk: 'high', type: 'bug' }),
  T('0902', 'reviewing', { started: ago(65), build_running: true, self_check: 'no changes', review_running: 1, reviewer: 'codex', review_model: LONG, type: 'fix', priority: 0 }),
  T('0903', 'approved', { started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], auto_ship: false, kind: 'task', builder: 'claude' }),
  T('0904', 'reviewing', { started: ago(200), build_running: true, self_check: 'no changes', rounds: [{ ...round(1, 10), verdict: 'request_changes' }], review_running: null, builder: 'cursor' }),
  T('0905', 'blocked', { started: ago(300), self_check: 'no changes', rounds: [{ ...round(1, 10), verdict: 'request_changes' }], blocked_question: 'Which one?', builder: 'claude' }),
  T('0906', 'building', { started: ago(65), build_running: true, self_check: 'no changes', builder: 'claude' }),
  T('0907', 'ready', {}),
];
const board = () => ({ run: { on: true }, ideas: [], tickets: TICKETS });
let clock = NOW;
const page = () => { clock = NOW; return boardPage([board()], { Date: class extends Date { constructor(...a) { super(...(a.length ? a : [clock])); } static now() { return clock; } } }); };
const idOf = (p, n) => p.all(n).find(x => x.className === 'id')?._text;
const view = fullViewOf;
const card = (p, id) => queueRows(p).find(n => idOf(p, n) === id);
const factsOf = v => v.children.find(n => n.className === 'steps').children.find(n => n.className === 'facts') || null;
// Each cell as [label, value].
const cells = f => f.children.map(c => [c.children[0].textContent, c.children[1].textContent]);
const liveOf = (p, v) => p.all(v).find(n => n.className === 'live-now');
const part = (p, v, cls) => p.all(liveOf(p, v)).find(n => (n.className || '').split(' ')[0] === cls);

test('0462 AC1: an in-flight ticket\'s full view shows its priority, size, risk, who builds and who reviews it, and where it is', async () => {
  const p = page();
  await p.settle();
  const want = {
    '0901': [['Priority', 'P1'], ['Level', 'Settings'], ['Size', 'M'], ['Risk', 'high'], ['Ships by itself', '–'], ['Builder', 'Claude'], ['Reviewer', '–']],
    '0902': [['Priority', 'P0'], ['Level', 'Settings'], ['Size', 'S'], ['Risk', 'low'], ['Ships by itself', '–'], ['Builder', '–'], ['Reviewer', `Codex · ${LONG}`]],
    '0903': [['Priority', 'P2'], ['Level', 'Settings'], ['Size', 'S'], ['Risk', 'low'], ['Ships by itself', 'No'], ['Builder', 'Claude'], ['Reviewer', '–']],
    '0904': [['Priority', 'P2'], ['Level', 'Settings'], ['Size', 'S'], ['Risk', 'low'], ['Ships by itself', '–'], ['Builder', 'Cursor'], ['Reviewer', '–']],
    '0905': [['Priority', 'P2'], ['Level', 'Settings'], ['Size', 'S'], ['Risk', 'low'], ['Ships by itself', '–'], ['Builder', 'Claude'], ['Reviewer', '–']],
    '0906': [['Priority', 'P2'], ['Level', 'Settings'], ['Size', 'S'], ['Risk', 'low'], ['Ships by itself', '–'], ['Builder', 'Claude'], ['Reviewer', '–']],
  };
  const now = { '0901': ['Writing tests and code', 'Build'], '0902': [`${LONG} is reviewing · round 1`, 'Review 1'], '0903': ['Approved · waiting for you to ship it', 'Ship'],
    '0904': ['Cursor is fixing round 1\'s findings', 'Review 1'], '0905': ['Blocked · it has a question for you', 'Review 1'], '0906': ['Checking its own work', 'Self-check'] };
  for (const [id, rows] of Object.entries(want)) {
    const v = await view(p, id), f = factsOf(v);
    assert.ok(f, `${id}: a table of facts`);
    assert.equal(f.tagName, 'dl', `${id}: a list of labels and values`);
    assert.deepEqual(cells(f).slice(0, 7), rows, `${id}: its cells`);
    assert.equal(cells(f)[7][0], 'Type', `${id}: then its type (0585)`);
    assert.equal(v.children.find(n => n.className === 'steps').children[0].className, 'track', `${id}: the table is under the track`);
    assert.ok(!p.all(v).some(n => /^progress\b/.test(n.className || '')), `${id}: no dotted line`);
    assert.deepEqual([part(p, v, 'say'), part(p, v, 'stage')].map(n => n.textContent), now[id], `${id}: where it is`);
  }
  assert.equal(liveOf(p, await view(p, '0907')), undefined, 'a queued ticket has no build to say');
  assert.deepEqual(cells(factsOf(await view(p, '0907')))[0], ['Priority', 'P2']);
});

test('0462 AC2: the full view\'s time keeps counting on the page\'s timer', async () => {
  const p = page();
  await p.settle();
  const v = await view(p, '0901');
  const time = () => p.all(v).find(n => n.className === 'sub').textContent;
  assert.equal(time(), '01:05');
  const tick = [...p.intervals.values()].find(i => i.ms === 1000);
  assert.ok(tick, 'the counter runs');
  clock = NOW + 1000;
  tick.fn();
  assert.equal(time(), '01:06', 'the time moves on');
});

test('0462 AC3: a closed Build row is its two lines only, with no table', async () => {
  const p = page();
  await p.settle();
  for (const t of TICKETS) {
    const c = card(p, t.id);
    assert.deepEqual(c.children.map(n => n.className), ['top'], `${t.id}: no table or buttons on its row`);
    assert.equal(c.children[0].children.length, 2, `${t.id}: its line and where it is`);
  }
});

test('0462 AC4: a screen reader reads each cell as its label, then its value', async () => {
  const p = page();
  await p.settle();
  for (const id of ['0901', '0903']) {
    for (const c of factsOf(await view(p, id)).children) {
      assert.equal(c.tagName, 'div', `${id}: a cell is a group in the list`);
      assert.deepEqual(c.children.map(n => n.tagName), ['dt', 'dd'], `${id}: its label is a term, its value its description`);
      if (c.children[0].textContent === 'Level') continue; // 0662: its level opens the menu that sets it, as a draft's priority does
      for (const n of p.all(c.children[1])) assert.notEqual(n.attrs?.role, 'button', `${id}: no control inside a value`);
    }
  }
});
