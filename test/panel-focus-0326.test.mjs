import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, page, full, round, click, items, top, queueRows } from './support/panel.mjs';

// ---------- 0326: closing the full ticket pane puts the focus back on the Full ticket button that opened it ----------

const clone = s => JSON.parse(JSON.stringify(s));
const at = h => new Date(Date.UTC(2026, 9, 9, h)).toISOString();
const any = (id, status, o = {}) => full(id, { status, ...o });
const shipped = (id, h, o = {}) => any(id, 'done', { started: at(h - 1), finished: at(h), rounds: [round(1, 100)], ...o });
const board = (o = {}) => ({
  tickets: [full('0001', { title: 'A draft', ...o['0001'] }), full('0002', { title: 'Another draft' }),
    any('0003', 'ready', { title: 'Queued one', ...o['0003'] }), shipped('0005', 8, { title: 'Shipped one' })],
  ideas: [],
});

// A fake page whose /api/state answers with `p.state` at that moment, where each node can take the focus, and
// `p.focused()` is the node holding it.
function livePage(s) {
  const box = { state: s };
  let focused = null;
  const focusable = n => { n.focus = () => { focused = n; p.document.activeElement = n; }; return n; };
  const p = fakePage([], {
    fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: 'built', truncated: false } : clone(box.state)) }),
  }, { made: focusable });
  for (const id of ['full-ticket', 'shaping-section', 'build-section']) focusable(p.byId(id));
  p.set = next => { box.state = next; };
  p.focused = () => focused;
  return p;
}
const refresh = async p => { p.timers.shift()(); await p.settle(); };
const pane = p => p.byId('full-ticket');
const paneOpen = p => !pane(p).hidden && pane(p).children.length > 0;
const itemOf = (p, id) => items(p).find(n => n.textContent.startsWith(id));
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const topOf = row => row.children.find(n => n.className === 'top');
const named = (p, node, text) => node && p.all(node).find(n => n.tagName === 'button' && n.textContent === text);
const fullOf = (p, node) => named(p, node, 'Full ticket');
const at0 = target => ({ target, stopPropagation() {} });
const closers = {
  'its Close button': p => click(p.all(pane(p)).find(n => n.tagName === 'button' && /\bclose\b/.test(n.className))),
  Escape: p => p.key('Escape'),
  'a click outside': p => p.byId('full-backdrop').listeners.click(at0(p.byId('full-backdrop'))),
};
async function openFromPlan(p, id) {
  click(top(itemOf(p, id)));
  await p.settle();
  click(fullOf(p, itemOf(p, id)));
  assert.ok(paneOpen(p), 'the pane opens');
  assert.equal(p.focused(), pane(p), 'with the focus in it, as before');
}
async function openFromBuild(p, id) {
  click(topOf(rowOf(p, id)));
  await p.settle();
  click(fullOf(p, rowOf(p, id)));
  assert.ok(paneOpen(p), 'the pane opens');
}

for (const [how, close] of Object.entries(closers)) {
  test(`0326 AC1: closing the pane with ${how} puts the focus on the Plan ticket's Full ticket button`, async () => {
    const p = livePage(board());
    await p.settle();
    await openFromPlan(p, '0001');
    close(p);
    assert.ok(!paneOpen(p), 'the pane closes');
    assert.equal(p.focused(), fullOf(p, itemOf(p, '0001')), 'the focus is on its Full ticket button');
  });
  test(`0326 AC1: closing the pane with ${how} puts the focus on the Build ticket's Full ticket button`, async () => {
    const p = livePage(board());
    await p.settle();
    click(top(itemOf(p, '0001'))); // a Plan ticket open too, so its button is on the page
    await openFromBuild(p, '0003');
    close(p);
    assert.ok(!paneOpen(p), 'the pane closes');
    assert.equal(p.focused(), fullOf(p, rowOf(p, '0003')), 'the focus is on the Build ticket\'s button, not the Plan one\'s');
  });
}

test('0326 AC2: after a refresh draws the Plan ticket again, closing puts the focus on its new button', async () => {
  const p = livePage(board());
  await p.settle();
  await openFromPlan(p, '0001');
  const old = fullOf(p, itemOf(p, '0001'));
  p.set(board({ '0001': { title: 'A draft, renamed' } }));
  await refresh(p);
  const now = fullOf(p, itemOf(p, '0001'));
  assert.ok(now && now !== old, 'the button was drawn again');
  p.key('Escape');
  assert.equal(p.focused(), now, 'the focus is on the new button');
});

test('0326 AC2: after a refresh draws the Build ticket again, closing puts the focus on its new button', async () => {
  const p = livePage(board());
  await p.settle();
  await openFromBuild(p, '0003');
  const old = fullOf(p, rowOf(p, '0003'));
  p.set(board({ '0003': { title: 'Queued one, renamed' } }));
  await refresh(p);
  const now = fullOf(p, rowOf(p, '0003'));
  assert.ok(now && now !== old, 'the button was drawn again');
  closers['a click outside'](p);
  assert.equal(p.focused(), now, 'the focus is on the new button');
});

test('0326 AC3: when the Plan ticket has left the board, closing puts the focus at the top of Plan', async () => {
  const p = livePage(board());
  await p.settle();
  await openFromPlan(p, '0001');
  p.set(board({ '0001': { status: 'done', started: at(9), finished: at(10), rounds: [round(1, 100)] } })); // shipped, so the pane still shows it
  await refresh(p);
  assert.ok(paneOpen(p), 'still open, on the shipped ticket');
  assert.equal(itemOf(p, '0001'), undefined, 'no longer in Plan');
  p.key('Escape');
  assert.equal(p.focused(), p.byId('shaping-section'), 'the focus is at the top of Plan');
});

test('0326 AC3: when the Build ticket has left the board, closing puts the focus at the top of Build', async () => {
  const p = livePage(board());
  await p.settle();
  await openFromBuild(p, '0003');
  p.set(board({ '0003': { status: 'done', started: at(9), finished: at(10), rounds: [round(1, 100)] } }));
  await refresh(p);
  assert.ok(paneOpen(p) && rowOf(p, '0003') === undefined, 'still open, and gone from Build');
  closers['its Close button'](p);
  assert.equal(p.focused(), p.byId('build-section'), 'the focus is at the top of Build');
});

test('0326 AC3: when the ticket leaves the board altogether, the pane closes and the focus goes to the top of its section', async () => {
  const p = livePage(board());
  await p.settle();
  await openFromPlan(p, '0001');
  const s = board();
  s.tickets = s.tickets.filter(t => t.id !== '0001');
  p.set(s);
  await refresh(p);
  assert.ok(!paneOpen(p), 'the pane closes, as before');
  assert.equal(p.focused(), p.byId('shaping-section'), 'the focus is at the top of Plan');
});

test('0326 AC3: the Plan and Build sections can take the focus', () => {
  const html = page();
  assert.match(html, /<section id="shaping-section" [^>]*tabindex="-1"/);
  assert.match(html, /<section id="build-section" [^>]*tabindex="-1"/);
});

test('0326 AC4: opening from a Shipped title and closing moves the focus nowhere new', async () => {
  const p = livePage(board());
  await p.settle();
  const shipRow = p.byId('shipped').children.find(r => p.all(r).some(n => n.className === 'id' && n._text === '0005'));
  click(p.all(shipRow).find(n => n.className === 'title-link'));
  assert.ok(paneOpen(p));
  assert.equal(p.focused(), pane(p), 'the pane takes the focus, as before');
  p.key('Escape');
  assert.ok(!paneOpen(p));
  assert.equal(p.focused(), pane(p), 'nothing else takes it');
});

test('0326 AC4: a Full ticket opening followed by another opening clears the first, and a second Escape does nothing more', async () => {
  const p = livePage(board());
  await p.settle();
  await openFromPlan(p, '0001');
  p.key('Escape');
  const b = fullOf(p, itemOf(p, '0001'));
  assert.equal(p.focused(), b);
  const shipRow = p.byId('shipped').children.find(r => p.all(r).some(n => n.className === 'id' && n._text === '0005'));
  click(p.all(shipRow).find(n => n.className === 'title-link'));
  p.key('Escape');
  assert.equal(p.focused(), pane(p), 'the Shipped opening doesn\'t send it back to the Plan button');
  p.key('Escape');
  assert.equal(p.focused(), pane(p), 'and an Escape with nothing open moves nothing');
});

test('0326 AC4: opening a Review pack after a Full ticket and closing it moves the focus nowhere new', async () => {
  const s = board();
  s.tickets.push(any('0004', 'approved', { title: 'Approved one' }));
  const p = livePage(s);
  await p.settle();
  await openFromBuild(p, '0004');
  p.key('Escape');
  assert.equal(p.focused(), fullOf(p, rowOf(p, '0004')), 'back on Full ticket');
  click(named(p, rowOf(p, '0004'), 'Review pack'));
  await p.settle();
  assert.ok(paneOpen(p));
  assert.equal(p.focused(), pane(p), 'the pane takes the focus, as before');
  p.key('Escape');
  assert.ok(!paneOpen(p));
  assert.equal(p.focused(), pane(p), 'nothing else takes it');
});
