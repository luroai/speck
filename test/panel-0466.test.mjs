import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, round, fakePage, shippedRows, queueRows, click } from './support/panel.mjs';

// ---------- 0466: a shipped ticket opens from its row. 0587: its full view, as a Build ticket's does ----------

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
const titleOf = (p, id) => p.all(card(p, id)).find(n => n.className === 'title');
const cell = (p, id, cls) => card(p, id).children.find(n => n && n.className === cls);
const buttons = (p, id) => p.all(card(p, id)).filter(n => n.tagName === 'button');
const pane = p => p.byId('full-ticket');
const paneOpen = p => !pane(p).hidden && pane(p).children.length > 0;
const closePane = async p => { click(p.all(pane(p)).find(n => /\bclose\b/.test(n.className))); await p.settle(); };
// A key pressed on a node, as the browser sends it to the node holding the focus.
function keyOn(n, key) {
  let prevented = false;
  n.listeners.keydown({ key, currentTarget: n, target: n, preventDefault() { prevented = true; }, stopPropagation() {} });
  return prevented;
}

test('0466 AC1 (0587): pressing a shipped ticket\'s title or anywhere on its row opens its full view', async () => {
  const p = livePage();
  await p.settle();
  for (const [what, node] of [['the title', () => titleOf(p, '0901')], ['the second line', () => cell(p, '0901', 'sum').children[0]],
    ['the id', () => cell(p, '0901', 'name').children[0].children[0]], ['the row\'s own edge', () => card(p, '0901')]]) {
    p.press(node());
    assert.ok(paneOpen(p), `${what} opens it`);
    assert.equal(pane(p).children[0].children[0].textContent, '0901', `${what}: that ticket`);
    assert.doesNotMatch(card(p, '0901').className, /\bopen\b/, `${what}: the row stays a row`);
    await closePane(p);
  }
});

test('0466 AC1 (0587): a click on the push warning under a row leaves it as it is', async () => {
  const s = board();
  s.tickets.push(T('0903', 'done', { title: 'Not pushed', ship: { unpushed: true, message: 'Push it yourself.' } }));
  const p = livePage(s);
  await p.settle();
  assert.ok(cell(p, '0903', 'unpushed'), 'a push warning');
  p.press(p.all(cell(p, '0903', 'unpushed')).find(n => n.className === 'unpushed-said') || cell(p, '0903', 'unpushed'));
  assert.ok(!paneOpen(p), 'the warning opens no full view');
  p.press(cell(p, '0903', 'unpushed'));
  assert.ok(!paneOpen(p), 'nor does the space around its words');
});

test('0466 AC1 (0587): a shipped ticket\'s title is reached with Tab and opens the full view with Enter or Space', async () => {
  const p = livePage();
  await p.settle();
  for (const key of ['Enter', ' ']) {
    const title = titleOf(p, '0901');
    assert.equal(title.tabIndex, 0, 'Tab reaches it');
    assert.equal(title.attrs.role, 'button');
    assert.ok(!keyOn(title, 'a'), 'other keys do nothing');
    assert.ok(!paneOpen(p));
    title.focus();
    assert.ok(keyOn(title, key), `${JSON.stringify(key)} is taken, so the page doesn't scroll`);
    assert.ok(paneOpen(p), `${JSON.stringify(key)} opens it`);
    await closePane(p);
  }
});

test('0466 AC1: a Build ticket\'s top row opens its full ticket, not the row itself (0585)', async () => {
  const p = livePage();
  await p.settle();
  const row = () => queueRows(p).find(r => idOf(p, r) === '0811');
  assert.ok(!paneOpen(p), 'closed to begin with');
  click(row().children[0]);
  await p.settle();
  assert.ok(paneOpen(p), 'its full ticket opens');
  assert.ok(!/\bopen\b/.test(row().className), 'the row stays as it was');
});

test('0466 AC2 (0587): a shipped row has no buttons, Details or otherwise', async () => {
  const p = livePage();
  await p.settle();
  for (const id of ['0901', '0902']) assert.deepEqual(buttons(p, id).map(b => b.textContent), [], id);
});

test('0466 AC3 (0587): the full view of a ticket with rounds has a Review pack row, which opens the review pack', async () => {
  const p = livePage();
  await p.settle();
  p.press(titleOf(p, '0901'));
  const b = p.all(pane(p)).find(n => n.tagName === 'button' && n.textContent === 'Review pack');
  assert.equal(b.className, 'pane-row');
  p.press(b);
  await p.settle();
  assert.equal(p.all(pane(p)).find(n => n.className === 'title').textContent, 'Review pack');
});

test('0466 AC3 (0587): Close brings the focus back to the shipped row\'s title', async () => {
  const p = livePage();
  await p.settle();
  p.press(titleOf(p, '0901'));
  assert.equal(p.focused(), pane(p), 'the pane takes the focus');
  await closePane(p);
  assert.ok(!paneOpen(p));
  assert.equal(p.focused(), titleOf(p, '0901'), 'back on its title');
});

test('0466 AC4 (0587): a shipped row and an open full view are kept as the list refreshes', async () => {
  const p = livePage();
  await p.settle();
  const row = card(p, '0901');
  p.press(titleOf(p, '0901'));
  for (let i = 0; i < 2; i++) { p.timers.shift()?.(); await p.settle(); }
  assert.equal(card(p, '0901'), row, 'the same row');
  assert.ok(paneOpen(p), 'the full view stays open');
});
