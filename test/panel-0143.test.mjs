// 0143: the full ticket pane shows a ticket's priority, size, risk and any bug or fix tag under its title.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, fakePage, T, full, click, top, items, queueRows, shippedRows } from './support/panel.mjs';

const ago = min => new Date(Date.now() - min * 60000).toISOString();
const clone = s => JSON.parse(JSON.stringify(s));
const pane = p => p.byId('full-ticket');
const paneTop = p => pane(p).children[0];
// The pane's tags, as each one's classes and text, or null when it shows none.
const paneTags = p => {
  const box = paneTop(p).children.find(n => n.className === 'tags');
  return box ? box.children.map(n => [n.className, n.textContent]) : null;
};
const fullButtonIn = (p, n) => p.all(n).find(x => x.tagName === 'button' && x.textContent === 'Full ticket');
const css = () => (page().match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
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
    const row = shippedRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
    p.press(p.all(row).find(n => n.className === 'title-link'));
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
    ['plan', '0001', [['tag p1', 'P1'], ['tag', 'M'], ['tag high', 'high']]],
    ['build', '0005', [['tag', 'P3'], ['tag', 'S'], ['tag', 'low']]],
    ['shipped', '0009', [['tag', 'P2'], ['tag', 'M'], ['tag high', 'high']]],
  ]) {
    const p = fakePage([STATE(), STATE(), STATE()]);
    await p.settle();
    openFrom(p, where, id);
    assert.deepEqual(paneTags(p), want, `${where}: the tags`);
    const kids = paneTop(p).children.map(n => n.className);
    assert.deepEqual(kids, ['id', 'title', 'close', 'tags'], `${where}: id, title and Close stay as they were, the tags after them`);
  }
});

test('0143 AC1: the tags are styled as in the lists, and sit on their own line under the title', () => {
  assert.match(rule('.tag.p1'), /color:\s*var\(--text\)/); // the text colour since 0167: the speck red is only for the speck
  assert.match(rule('.tag.high'), /color:\s*var\(--bad\)/); // red since 0151
  assert.match(rule('#full-ticket .top'), /flex-wrap:\s*wrap/);
  assert.match(rule('#full-ticket .top .tags'), /flex-basis:\s*100%/);
});

test('0143 AC1: the pane\'s tags follow a change to the ticket', async () => {
  const s = STATE(), s2 = clone(s);
  s2.tickets[0].priority = 4;
  s2.tickets[0].risk = 'low';
  const p = fakePage([s, s2, clone(s2)]);
  await p.settle();
  openFrom(p, 'plan', '0001');
  const [head, body] = pane(p).children, [id, title] = head.children;
  p.timers.shift()();
  await p.settle();
  assert.deepEqual(paneTags(p), [['tag', 'P4'], ['tag', 'M'], ['tag', 'low']]);
  assert.deepEqual([pane(p).children[0], pane(p).children[1], ...head.children.slice(0, 2)], [head, body, id, title], 'the rest of the pane keeps its nodes');
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
  assert.deepEqual(paneTags(p), [['tag fix', 'fix'], ['tag p0', 'P0'], ['tag', 'S'], ['tag', 'low']]);
  p = fakePage([s(), s(), s()]);
  await p.settle();
  openFrom(p, 'shipped', '0010');
  assert.deepEqual(paneTags(p), [['tag bug', 'bug'], ['tag', 'P2'], ['tag', 'S'], ['tag', 'low']]);
});

test('0143 AC3: a field the ticket doesn\'t have shows no tag, and a ticket with none shows no tags at all', async () => {
  const s = () => ({ ideas: [], tickets: [
    T('0009', 'done', { started: ago(90), finished: ago(60), priority: null, risk: 'high' }),
    T('0011', 'done', { started: ago(40), finished: ago(30), priority: '', size: '', risk: null, type: '' }),
    T('0012', 'done', { started: ago(30), finished: ago(25), priority: undefined, size: undefined, risk: undefined, type: 'feature' }),
  ] });
  let p = fakePage([s(), s(), s()]);
  await p.settle();
  openFrom(p, 'shipped', '0009');
  assert.deepEqual(paneTags(p), [['tag', 'S'], ['tag high', 'high']]);
  for (const id of ['0011', '0012']) {
    p = fakePage([s(), s(), s()]);
    await p.settle();
    openFrom(p, 'shipped', id);
    assert.equal(paneTags(p), null, `${id}: no tags`);
    assert.deepEqual(paneTop(p).children.map(n => n.className), ['id', 'title', 'close'], `${id}: the top row as before`);
  }
});

test('0143 AC3: the rest of the pane is unchanged', async () => {
  const p = fakePage([STATE(), STATE(), STATE()]);
  await p.settle();
  openFrom(p, 'shipped', '0009');
  assert.equal(pane(p).children.length, 2, 'the top row and the body');
  assert.equal(paneTop(p).children[1].textContent, 'Ticket 0009');
  assert.equal(pane(p).children[1].children[0].tagName, 'h4', 'the body starts with its first section');
});

test('0143 AC4: the pane\'s priority tag only shows the value: clicking it opens no priority menu', async () => {
  const p = fakePage([STATE(), STATE(), STATE(), STATE()]);
  await p.settle();
  openFrom(p, 'plan', '0001');
  const tag = p.all(paneTop(p)).find(n => n.textContent === 'P1' && /\btag\b/.test(n.className));
  assert.ok(tag);
  assert.ok(!/\bpick\b/.test(tag.className), 'not styled as clickable');
  assert.equal(tag.title, undefined, 'no "Set the priority" hover text');
  p.press(tag);
  assert.equal(p.byId('tag-tip').textContent, 'Priority 1: built after P0 tickets', 'since 0165 its click shows its tip, not a menu');
  assert.equal(p.all(p.byId('shaping')).filter(n => n.className === 'prio-menu').length, 0, 'no menu in the list');
  assert.equal(p.all(pane(p)).filter(n => n.className === 'prio-menu').length, 0, 'none in the pane');
  assert.equal(paneTop(p).children[0].textContent, '0001', 'the pane stays open');
});

test('0143 AC3: tags come and go with the fields on a refresh, and the rest of the top row stays', async () => {
  const one = o => ({ ideas: [], tickets: [T('0011', 'done', { started: ago(40), finished: ago(30), ...o })] });
  const none = { priority: null, size: '', risk: '' };
  const p = fakePage([one(none), one({ priority: null }), one(none)]);
  await p.settle();
  openFrom(p, 'shipped', '0011');
  const kids = paneTop(p).children.slice();
  assert.equal(paneTags(p), null);
  p.timers.shift()();
  await p.settle();
  assert.deepEqual(paneTags(p), [['tag', 'S'], ['tag', 'low']]);
  p.timers.shift()();
  await p.settle();
  assert.equal(paneTags(p), null);
  assert.deepEqual(paneTop(p).children, kids, 'the id, title and Close as they were');
});
