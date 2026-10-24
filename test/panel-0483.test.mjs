import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, full, boardPage, fakePage, items, queueRows, click } from './support/panel.mjs';

// ---------- 0483: a closed Plan or Build card has no chain or padlock icon; its dependency chip says it ----------

// 0100 (Plan) and 0500 (Build) wait on others; 0200 (Plan) and 0600 (Build) are waited on; 0900 is in flight and waited on.
const at = new Date().toISOString();
const TICKETS = (extra = []) => [
  full('0090', { title: 'Plan, first' }), full('0100', { title: 'Plan, waits', after: ['0090'], waiting_on: ['0090'] }),
  full('0200', { title: 'Plan, starts a chain' }), full('0201', { after: ['0200'], waiting_on: ['0200'] }),
  T('0490', 'ready'), T('0500', 'ready', { title: 'Build, waits', after: ['0490'], waiting_on: ['0490'] }),
  T('0600', 'ready', { title: 'Build, starts a chain' }), T('0601', 'ready', { after: ['0600'], waiting_on: ['0600'] }),
  T('0900', 'building', { title: 'Being built', started: at, build_running: true }),
  T('0901', 'ready', { after: ['0900'], waiting_on: ['0900'] }),
  ...extra,
];
const board = (tickets = TICKETS()) => ({ run: { on: false }, ideas: [], tickets });
const idOf = (p, n) => p.all(n).find(x => x.className === 'id')?._text;
const card = (p, id) => [...items(p), ...queueRows(p)].find(n => idOf(p, n) === id);
const topOf = n => n.children[0];
const lineOf = n => topOf(n).children[0];
const icons = (p, n) => p.all(topOf(n)).filter(x => x.className === 'chain' || x.className === 'lock');
const iconOf = (p, id) => { const [i, more] = icons(p, card(p, id)); assert.equal(more, undefined, `${id}: one icon at most`); return i || null; };
const shape = (p, id) => lineOf(card(p, id)).children.map(c => c.className);

test('0483 AC1: a closed Plan or Build card shows no chain or padlock icon, waiting, waited on or in flight', async () => {
  const p = boardPage([board()]);
  await p.settle();
  for (const id of ['0100', '0200', '0201', '0500', '0600', '0601', '0900', '0901']) assert.equal(iconOf(p, id), null, `${id}: no icon`);
});

test('0483 AC1: a closed card\'s chip still ends its title row', async () => {
  const p = boardPage([board()]);
  await p.settle();
  for (const [id, said] of [['0100', 'Waits on 1 ticket'], ['0200', '1 ticket waits on this'], ['0500', 'Waits on 1 ticket'], ['0600', '1 ticket waits on this'], ['0900', '1 ticket waits on this']]) {
    const line = lineOf(card(p, id)), last = line.children[line.children.length - 1];
    assert.equal(last.className, 'dep-chip', `${id}: the chip is last`);
    assert.equal(last.title, said, `${id}: what it says`);
  }
});

test('0483 AC2: an open Plan or Build card shows its icon with its hover text, as today', async () => {
  const p = boardPage([board()]);
  await p.settle();
  for (const id of ['0100', '0200', '0500', '0600']) click(topOf(card(p, id)));
  await p.settle();
  const want = { '0100': ['lock', 'Waiting on 0090'], '0200': ['chain', 'Starts a chain: unlocks 0201'],
    '0500': ['lock', 'Waiting on 0490'], '0600': ['chain', 'Starts a chain: unlocks 0601'] };
  for (const [id, [cls, title]] of Object.entries(want)) {
    const icon = iconOf(p, id);
    assert.ok(icon, `${id}: an icon`);
    assert.deepEqual([icon.className, icon.title], [cls, title], id);
    assert.deepEqual(shape(p, id).slice(0, 3), ['id', cls, 'title'], `${id}: right after its id`);
  }
});

test('0483 AC2: opening adds the icon and closing takes it away, without a reload', async () => {
  // a board for each state request and an empty log for each log one, counting the state requests
  let states = 0;
  const fetch = async url => { const b = /\/log$/.test(String(url)) ? { text: '', truncated: false } : (states++, board()); return { ok: true, status: 200, json: async () => b }; };
  const p = fakePage([], { fetch });
  await p.settle();
  const asked = states;
  for (const id of ['0100', '0600']) {
    click(topOf(card(p, id)));
    await p.settle();
    assert.ok(iconOf(p, id), `${id}: open, an icon`);
    click(topOf(card(p, id)));
    await p.settle();
    assert.equal(iconOf(p, id), null, `${id}: closed again, none`);
  }
  assert.equal(states, asked, 'the board was not asked for again');
});

test('0483 AC2: the 2-second refresh never brings an icon back on a closed card, and keeps an open one\'s right', async () => {
  // the next boards change who waits on whom, which puts kept cards right in place
  const p = boardPage([board(), board(TICKETS([T('0602', 'ready', { after: ['0600', '0500'], waiting_on: ['0600', '0500'] }), full('0202', { after: ['0100'], waiting_on: ['0100'] })])), board()]);
  await p.settle();
  click(topOf(card(p, '0500')));
  click(topOf(card(p, '0100')));
  await p.settle();
  for (let i = 0; i < 2; i++) {
    p.timers.shift()();
    await p.settle();
    for (const id of ['0200', '0600', '0601', '0900', '0901']) assert.equal(iconOf(p, id), null, `refresh ${i + 1}, ${id}: no icon`);
    assert.equal(iconOf(p, '0500')?.className, 'lock', `refresh ${i + 1}: the open Build card keeps its padlock`);
    assert.equal(iconOf(p, '0100')?.className, 'lock', `refresh ${i + 1}: the open Plan card keeps its padlock`);
  }
});

test('0483 AC3: a closed card\'s title comes straight after its id', async () => {
  const p = boardPage([board()]);
  await p.settle();
  for (const id of ['0100', '0200', '0500', '0600', '0900']) assert.deepEqual(shape(p, id), ['id', 'title', 'dep-chip'], id);
});
