import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, round, fakePage, shippedRows, queueRows, click } from './support/panel.mjs';

// ---------- 0466: a shipped ticket opens and closes from its top row, as a Build ticket does ----------

const clone = v => JSON.parse(JSON.stringify(v));
const board = () => ({ run: { on: true }, ideas: [], tickets: [
  T('0811', 'ready', { title: 'Queued' }),
  T('0901', 'done', { title: 'Shipped', started: '2026-10-24T10:00:00Z', finished: '2026-10-24T10:20:00Z', builder_cost_usd: 1.5, rounds: [round(1, 600)] }),
  T('0902', 'done', { title: 'Shipped too' }),
] });
// A fake page whose nodes can take the focus, with `p.focused()` the node holding it, as in panel-focus-0326.
function livePage(s = board()) {
  let focused = null;
  const focusable = n => { n.focus = () => { focused = n; p.document.activeElement = n; }; return n; };
  const p = fakePage([], {
    fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : clone(s)) }),
  }, { made: focusable });
  for (const id of ['full-ticket', 'shipped-section']) focusable(p.byId(id));
  p.focused = () => focused;
  return p;
}
const idOf = (p, n) => p.all(n).find(x => x.className === 'id')?._text;
const card = (p, id) => shippedRows(p).find(r => idOf(p, r) === id);
const isOpen = (p, id) => /\bopen\b/.test(card(p, id).className);
const titleOf = (p, id) => p.all(card(p, id)).find(n => n.className === 'title');
const cell = (p, id, cls) => card(p, id).children.find(n => n && n.className === cls);
const buttons = (p, id) => p.all(card(p, id)).filter(n => n.tagName === 'button');
const named = (p, id, text) => buttons(p, id).find(b => b.textContent === text);
const pane = p => p.byId('full-ticket');
const paneOpen = p => !pane(p).hidden && pane(p).children.length > 0;
// A key pressed on a node, as the browser sends it to the node holding the focus.
function keyOn(n, key) {
  let prevented = false;
  n.listeners.keydown({ key, currentTarget: n, target: n, preventDefault() { prevented = true; }, stopPropagation() {} });
  return prevented;
}

test('0466 AC1: pressing a shipped ticket\'s title or anywhere on its top row opens it in place, and pressing again closes it', async () => {
  const p = livePage();
  await p.settle();
  p.press(titleOf(p, '0901'));
  assert.ok(isOpen(p, '0901'), 'the title opens it');
  assert.ok(!paneOpen(p), 'and opens no full ticket');
  p.press(titleOf(p, '0901'));
  assert.ok(!isOpen(p, '0901'), 'the title again closes it');
  p.press(cell(p, '0901', 'sum').children[0]);
  assert.ok(isOpen(p, '0901'), 'its second line opens it');
  p.press(p.all(cell(p, '0901', 'steps')).find(n => n.className === 'facts'));
  assert.ok(!isOpen(p, '0901'), 'an open one\'s facts table, in its top row, closes it');
  p.press(cell(p, '0901', 'name').children[0].children[0]);
  assert.ok(isOpen(p, '0901'), 'its id opens it');
  p.press(card(p, '0901'));
  assert.ok(!isOpen(p, '0901'), 'the card\'s own edge, around its cells, closes it');
  p.press(card(p, '0901'));
  assert.ok(!isOpen(p, '0902'), 'the other card stays as it was');
  assert.ok(!paneOpen(p));
});

test('0466 AC1: a click on what\'s under the top row, a push warning or the buttons\' row, leaves the card as it is', async () => {
  const s = board();
  s.tickets.push(T('0903', 'done', { title: 'Not pushed', ship: { unpushed: true, message: 'Push it yourself.' } }));
  const p = livePage(s);
  await p.settle();
  assert.ok(cell(p, '0903', 'unpushed'), 'a push warning');
  p.press(p.all(cell(p, '0903', 'unpushed')).find(n => n.className === 'unpushed-said') || cell(p, '0903', 'unpushed'));
  assert.ok(!isOpen(p, '0903'), 'the warning on a closed card doesn\'t open it');
  p.press(titleOf(p, '0903'));
  p.press(cell(p, '0903', 'unpushed'));
  assert.ok(isOpen(p, '0903'), 'nor does it close an open one');
  p.press(cell(p, '0903', 'full-cell'));
  assert.ok(isOpen(p, '0903'), 'nor does the space around Full ticket and Review pack');
});

test('0466 AC1: a shipped ticket\'s title is reached with Tab and opens and closes with Enter or Space, keeping the focus', async () => {
  const p = livePage();
  await p.settle();
  let title = titleOf(p, '0901');
  assert.equal(title.tabIndex, 0, 'Tab reaches it');
  assert.equal(title.attrs.role, 'button');
  assert.equal(title.attrs['aria-expanded'], 'false');
  title.focus();
  assert.ok(keyOn(title, 'Enter'), 'Enter is taken');
  assert.ok(isOpen(p, '0901'), 'Enter opens it');
  title = titleOf(p, '0901');
  assert.equal(title.attrs['aria-expanded'], 'true');
  assert.equal(p.focused(), title, 'the title drawn in its place has the focus');
  assert.ok(keyOn(title, ' '), 'Space is taken, so the page doesn\'t scroll');
  assert.ok(!isOpen(p, '0901'), 'Space closes it');
  assert.equal(p.focused(), titleOf(p, '0901'));
  assert.ok(!keyOn(titleOf(p, '0901'), 'a'), 'other keys do nothing');
  assert.ok(!isOpen(p, '0901'));
  assert.ok(!paneOpen(p), 'no full ticket opened');
});

test('0466 AC1: a Build ticket\'s top row still opens and closes it', async () => {
  const p = livePage();
  await p.settle();
  const row = () => queueRows(p).find(r => idOf(p, r) === '0811');
  click(row().children[0]);
  assert.ok(/\bopen\b/.test(row().className));
  click(row().children[0]);
  assert.ok(!/\bopen\b/.test(row().className));
});

test('0466 AC2: a shipped ticket has no Details button, open or closed', async () => {
  const p = livePage();
  await p.settle();
  for (const id of ['0901', '0902']) {
    assert.deepEqual(buttons(p, id).map(b => b.textContent), [], `${id} closed: no buttons`);
    p.press(titleOf(p, id));
    assert.ok(!buttons(p, id).some(b => b.textContent === 'Details' || /\bdetails\b/.test(b.className)), `${id} open: no Details`);
  }
});

test('0466 AC3: the open card has Full ticket, then Review pack, and Full ticket opens the full ticket', async () => {
  const p = livePage();
  await p.settle();
  p.press(titleOf(p, '0901'));
  assert.deepEqual(cell(p, '0901', 'full-cell').children.map(b => b.textContent), ['Full ticket', 'Review pack']);
  const b = named(p, '0901', 'Full ticket');
  assert.equal(b.className, 'full-open', 'the same button an open Build ticket has');
  p.press(b);
  assert.ok(paneOpen(p), 'the full ticket opens');
  assert.equal(pane(p).children[0].children[0].textContent, '0901');
  assert.ok(isOpen(p, '0901'), 'the card stays open behind it');
});

test('0466 AC3: Close brings the focus back to the shipped card\'s Full ticket button', async () => {
  const p = livePage();
  await p.settle();
  p.press(titleOf(p, '0901'));
  p.press(named(p, '0901', 'Full ticket'));
  assert.equal(p.focused(), pane(p), 'the pane takes the focus');
  click(p.all(pane(p)).find(n => n.tagName === 'button' && /\bclose\b/.test(n.className)));
  await p.settle();
  assert.ok(!paneOpen(p));
  assert.equal(p.focused(), named(p, '0901', 'Full ticket'), 'back on its Full ticket button');
});

test('0466 AC4: a shipped ticket\'s open or closed state is kept as the list refreshes', async () => {
  const p = livePage();
  await p.settle();
  p.press(titleOf(p, '0901'));
  for (let i = 0; i < 2; i++) { p.timers.shift()?.(); await p.settle(); }
  assert.ok(isOpen(p, '0901'), 'open stays open');
  assert.ok(!isOpen(p, '0902'), 'closed stays closed');
  p.press(titleOf(p, '0901'));
  p.timers.shift()?.();
  await p.settle();
  assert.ok(!isOpen(p, '0901'), 'closed again stays closed');
});
