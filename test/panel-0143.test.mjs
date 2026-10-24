// 0143: the full ticket pane shows a ticket's priority, size, risk and any bug or fix tag under its title. 0465: in the
// table under it, as its open card shows them, in place of the tags; a shipped ticket's table has its figures instead.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, fakePage, T, full, click, top, items, queueRows, shippedRows, shippedFull, styles } from './support/panel.mjs';

const ago = min => new Date(Date.now() - min * 60000).toISOString();
const clone = s => JSON.parse(JSON.stringify(s));
const pane = p => p.byId('full-ticket');
const paneTop = p => pane(p).children[0];
// 0465: the pane's Priority, Size · risk and Type cells, as [label, value] each, or null when its table has none.
const paneTags = p => {
  const f = pane(p).children[1] && pane(p).children[1].children[1];
  const kept = f ? f.children.map(c => [c.children[0].textContent, c.children[1].textContent]).filter(([l]) => ['Priority', 'Size · risk', 'Type'].includes(l)) : [];
  return kept.length ? kept : null;
};
const fullButtonIn = (p, n) => p.all(n).find(x => x.tagName === 'button' && x.textContent === 'Full ticket');
const css = () => styles();
const rule = sel => (css().match(new RegExp(`\\n\\s*${sel.replace(/[.:#]/g, '\\$&')}\\s*\\{([^}]*)\\}`)) || [])[1] || '';

// Opens a ticket in the pane from Plan, Build or Shipped, as the user does.
function openFrom(p, where, id) {
  if (where === 'plan') {
    const item = items(p).find(i => p.all(i).some(n => n.className === 'id' && n._text === id));
    click(top(item));
    click(fullButtonIn(p, items(p).find(i => p.all(i).some(n => n.className === 'id' && n._text === id))));
  } else if (where === 'build') {
    const row = () => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
    if (!fullButtonIn(p, row())) click(row().children.find(n => /\btop\b/.test(n.className)));
    click(fullButtonIn(p, row()));
  } else {
    p.press(shippedFull(p, () => shippedRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id)))); // 0466
  }
  assert.equal(paneTop(p).children[0].textContent, id, `${id} is open in the pane`);
}

const STATE = () => ({ ideas: [], tickets: [
  full('0001', { priority: 1, size: 'M', risk: 'high' }),
  T('0005', 'ready', { priority: 3, size: 'S', risk: 'low' }),
  T('0009', 'done', { started: ago(90), finished: ago(60), priority: 2, size: 'M', risk: 'high' }),
] });

test('0143 AC1: the pane shows priority, size and risk under the title, whichever list it was opened from', async () => {
  for (const [where, id, want] of [
    ['plan', '0001', [['Priority', 'P1'], ['Size · risk', 'M · high'], ['Type', 'code']]],
    ['build', '0005', [['Priority', 'P3'], ['Size · risk', 'S · low'], ['Type', 'code']]],
    ['shipped', '0009', null], // 0465: its table has its figures, as its open card's has
  ]) {
    const p = fakePage([STATE(), STATE(), STATE()]);
    await p.settle();
    openFrom(p, where, id);
    assert.deepEqual(paneTags(p), want, `${where}: the cells`);
    const kids = paneTop(p).children.map(n => n.className);
    assert.deepEqual(kids, ['id', 'state', 'close', 'title'], `${where}: id, status and Close, then the title (0424)`);
    assert.equal(pane(p).children[1].className, 'steps', `${where}: the track and table after them (0465)`);
  }
});

test('0143 AC1: the tags are styled as in the lists, and sit on their own line under the title', () => {
  assert.match(rule('.tag.p1'), /color:\s*var\(--text\)/); // the text colour since 0167: the speck red is only for the speck
  assert.match(rule('.tag.high'), /color:\s*var\(--bad\)/); // red since 0151
  assert.match(rule('#full-ticket .top'), /flex-wrap:\s*wrap/);
});

test('0143 AC1: the pane\'s tags follow a change to the ticket', async () => {
  const s = STATE(), s2 = clone(s);
  s2.tickets[0].priority = 4;
  s2.tickets[0].risk = 'low';
  const p = fakePage([s, s2, clone(s2)]);
  await p.settle();
  openFrom(p, 'plan', '0001');
  const [head, , body] = pane(p).children, [id, title] = head.children;
  p.timers.shift()();
  await p.settle();
  assert.deepEqual(paneTags(p), [['Priority', 'P4'], ['Size · risk', 'M · low'], ['Type', 'code']]);
  assert.deepEqual([pane(p).children[0], pane(p).children[2], ...head.children.slice(0, 2)], [head, body, id, title], 'the rest of the pane keeps its nodes');
  assert.equal(body.detached || 0, 0);
});

test('0143 AC2: a bug or fix ticket shows its bug or fix tag in the pane, as in the lists', async () => {
  const s = () => ({ ideas: [], tickets: [
    T('0006', 'ready', { type: 'fix', priority: 0 }),
    T('0010', 'done', { started: ago(50), finished: ago(20), type: 'bug' }),
  ] });
  let p = fakePage([s(), s(), s()]);
  await p.settle();
  openFrom(p, 'build', '0006');
  assert.deepEqual(paneTags(p), [['Priority', 'P0'], ['Size · risk', 'S · low'], ['Type', 'fix']]);
  assert.equal(pane(p).children[1].children[1].children[5].children[1].className, 'value fix', 'in the fix tag\'s colour');
  p = fakePage([s(), s(), s()]);
  await p.settle();
  openFrom(p, 'shipped', '0010');
  assert.equal(paneTags(p), null, '0465: a shipped one\'s table has its figures, as its open card\'s has');
});

test('0143 AC3: a field the ticket doesn\'t have shows no tag, and a ticket with none shows no tags at all', async () => {
  const s = () => ({ ideas: [], tickets: [
    T('0009', 'ready', { priority: null, risk: 'high' }),
    T('0011', 'ready', { priority: '', size: '', risk: null, type: '' }),
    T('0012', 'ready', { priority: undefined, size: undefined, risk: undefined, type: 'feature' }),
  ] });
  let p = fakePage([s(), s(), s()]);
  await p.settle();
  openFrom(p, 'build', '0009');
  assert.deepEqual(paneTags(p), [['Priority', '–'], ['Size · risk', 'S · high'], ['Type', 'code']]);
  for (const id of ['0011', '0012']) {
    p = fakePage([s(), s(), s()]);
    await p.settle();
    openFrom(p, 'build', id);
    assert.deepEqual(paneTags(p), [['Priority', '–'], ['Size · risk', '– · –'], ['Type', 'code']], `${id}: a dash for each, as on its card (0465)`);
    assert.deepEqual(paneTop(p).children.map(n => n.className), ['id', 'state', 'close', 'title'], `${id}: the top row as before (0424: with its status)`);
  }
});

test('0143 AC3: the rest of the pane is unchanged', async () => {
  const p = fakePage([STATE(), STATE(), STATE()]);
  await p.settle();
  openFrom(p, 'shipped', '0009');
  assert.equal(pane(p).children.length, 3, 'the top row, the track and table (0465), and the body');
  assert.equal(paneTop(p).children.find(n => n.className === 'title').textContent, 'Ticket 0009');
  assert.equal(pane(p).children[2].children[0].tagName, 'h4', 'the body starts with its first section');
});

test('0143 AC4: the pane\'s priority tag only shows the value: clicking it opens no priority menu', async () => {
  const p = fakePage([STATE(), STATE(), STATE(), STATE()]);
  await p.settle();
  openFrom(p, 'plan', '0001');
  // 0465: its Priority cell, in the table under the title
  const tag = pane(p).children[1].children[1].children[3].children[1];
  assert.equal(tag.textContent, 'P1');
  assert.ok(!p.all(tag).some(n => /\bpick\b/.test(n.className || '') || n.attrs?.role === 'button'), 'not styled as clickable');
  assert.ok(!p.all(tag).some(n => n.title === 'Set the priority'), 'no "Set the priority" hover text');
  p.press(tag);
  assert.equal(p.all(p.byId('shaping')).filter(n => n.className === 'prio-menu').length, 0, 'no menu in the list');
  assert.equal(p.all(pane(p)).filter(n => n.className === 'prio-menu').length, 0, 'none in the pane');
  assert.equal(paneTop(p).children[0].textContent, '0001', 'the pane stays open');
});

test('0143 AC3: tags come and go with the fields on a refresh, and the rest of the top row stays', async () => {
  const one = o => ({ ideas: [], tickets: [T('0011', 'ready', o)] });
  const none = { priority: null, size: '', risk: '' }, empty = [['Priority', '–'], ['Size · risk', '– · –'], ['Type', 'code']];
  const boards = [one(none), one({ priority: null }), one(none)]; // 0465: an open Build card fetches its log too
  const p = fakePage([], { fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : clone(boards.length > 1 ? boards.shift() : boards[0])) }) });
  await p.settle();
  openFrom(p, 'build', '0011');
  const kids = paneTop(p).children.slice();
  assert.deepEqual(paneTags(p), empty);
  p.timers.shift()();
  await p.settle();
  assert.deepEqual(paneTags(p), [['Priority', '–'], ['Size · risk', 'S · low'], ['Type', 'code']]);
  p.timers.shift()();
  await p.settle();
  assert.deepEqual(paneTags(p), empty);
  assert.deepEqual(paneTop(p).children, kids, 'the id, title and Close as they were');
});
