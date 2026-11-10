import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0613: a ticket's Waits on is shown as plain facts, as its chain is, in its full view and its open Plan card.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, full, boardPage, items, queueRows, top, click } from './support/panel.mjs';
import { css, rules, selectors, get } from './support/css.mjs';

// A draft waiting on three: one shipped, one building, one queued.
const TICKETS = () => [
  full('0100', { title: 'Waits on three', after: ['0203', '0201', '0202'], waiting_on: ['0202', '0203'] }),
  T('0201', 'done', { title: 'Shipped one' }), T('0202', 'building', { title: 'Building one', started: new Date().toISOString() }),
  T('0203', 'ready', { title: 'Queued one' }),
];
const page = async () => { const p = boardPage([{ run: { on: false }, ideas: [], tickets: TICKETS() }]); await p.settle(); return p; };
const cls = n => (n.className || '').split(' ');
const of = (p, c, root) => p.all(root).find(n => cls(n).includes(c));
const allOf = (p, c, root) => p.all(root).filter(n => cls(n).includes(c));
const idOf = (p, n) => p.all(n).find(x => x.className === 'id')?._text;
async function openCard(p, id) {
  let card = items(p).find(n => idOf(p, n) === id);
  if (!/\bopen\b/.test(card.className)) { click(top(card)); await p.settle(); }
  card = items(p).find(n => idOf(p, n) === id);
  return card;
}
// A draft's full view, from its open card's Full ticket button.
async function fullViewOf(p, id) {
  const card = await openCard(p, id);
  p.press(p.all(card).find(n => n.tagName === 'button' && n.textContent === 'Full ticket'));
  await p.settle();
  return p.byId('full-ticket');
}
const WANT = [['Waits on', '0201 Shipped one shipped0202 Building one building0203 Queued one queued']];
const cellsOf = facts => facts.children.map(c => [c.children[0].textContent, c.children[1].textContent]);
const lines = (p, facts) => allOf(p, 'waits-item', facts).map(n => n.textContent);
const LINES = ['0201 Shipped one shipped', '0202 Building one building', '0203 Queued one queued'];

function noBox(p, root) {
  assert.equal(of(p, 'deps', root), undefined, 'no bordered box');
  assert.equal(of(p, 'deps-bar', root), undefined, 'no coloured bar');
  assert.equal(of(p, 'chip', root), undefined, 'no boxed chips');
  assert.equal(of(p, 'deps-grid', root), undefined);
}

test('0613 AC1: the full view shows what a ticket waits on as a fact: each id and title with its state, with no box, bar or chips', async () => {
  const p = await page();
  const steps = (await fullViewOf(p, '0100')).children[1];
  const facts = steps.children.find(n => cls(n).includes('waits-facts'));
  assert.equal(facts.tagName, 'dl');
  assert.deepEqual(cls(facts), ['facts', 'waits-facts']);
  assert.deepEqual(cellsOf(facts), WANT);
  assert.deepEqual(lines(p, facts), LINES, 'one line for each, in id order');
  noBox(p, steps);
  // the ones on the page are links, with their id and title in the link
  const links = p.all(facts).filter(n => n.tagName === 'button');
  assert.deepEqual(links.map(b => b.textContent), ['0202 Building one', '0203 Queued one']);
  assert.equal(links[1].attrs['aria-label'], 'Go to ticket 0203, queued');
  assert.equal(of(p, 'waits-link', facts).tagName, 'span', 'a shipped one, not on the page, is plain');
});

test('0613 AC1: a ticket it waits on that is not on the board shows its id and state', async () => {
  const p = boardPage([{ run: { on: false }, ideas: [], tickets: [full('0100', { after: ['9', '0203'], waiting_on: ['0203'] }), T('0203', 'ready', { title: 'Queued one' })] }]);
  await p.settle();
  const facts = of(p, 'waits-facts', (await fullViewOf(p, '0100')).children[1]);
  assert.deepEqual(lines(p, facts), ['9 shipped', '0203 Queued one queued']);
});

test('0613 AC2: an open Plan card shows them the same way, with no box, bar or chips', async () => {
  const p = await page();
  const card = await openCard(p, '0100');
  const facts = of(p, 'waits-facts', card);
  assert.deepEqual(cls(facts), ['facts', 'waits-facts']);
  assert.deepEqual(cellsOf(facts), WANT);
  assert.deepEqual(lines(p, facts), LINES);
  noBox(p, card);
  assert.equal(of(p, 'detail', card).children[0], facts, 'first in its details, where the box was');
});

test('0613 AC2: the facts have no border, bar or rounded chip in their styles', () => {
  for (const r of rules().filter(r => selectors(r).some(s => /\.waits-facts\b/.test(s)))) {
    assert.ok(!get(r, 'border') || /^0|none/.test(get(r, 'border')), `${r.sel}: no border`);
    assert.ok(!get(r, 'border-radius'), `${r.sel}: no rounded chip`);
    assert.ok(!get(r, 'background') || get(r, 'background') === 'none', `${r.sel}: no fill`);
  }
});

test('0613 AC3: pressing one in a Plan card goes to that ticket, and the card stays open', async () => {
  const p = await page();
  const card = await openCard(p, '0100');
  const link = p.all(of(p, 'waits-facts', card)).find(n => n.tagName === 'button' && n.textContent === '0203 Queued one');
  p.press(link);
  await p.settle();
  assert.equal(p.byId('tab-build').attrs['aria-selected'], 'true', 'its tab opens');
  assert.match(queueRows(p).find(n => idOf(p, n) === '0203').className, /\bflash\b/, 'and it lights up');
  assert.match((await openCard(p, '0100')).className, /\bopen\b/);
});

test('0613 AC3: pressing one in the full view shows that ticket there', async () => {
  const p = await page();
  const facts = of(p, 'waits-facts', (await fullViewOf(p, '0100')).children[1]);
  p.press(p.all(facts).find(n => n.tagName === 'button' && n.textContent === '0203 Queued one'));
  await p.settle();
  assert.equal(p.byId('full-ticket').hidden, false);
  assert.equal(p.byId('full-ticket').children[0].children[0].textContent, '0203', 'the view shows 0203');
});

test('0613 AC3: a link is at least 44 px high on a touch screen', () => {
  const touch = (css().match(/@media \(pointer: coarse\) \{([\s\S]*)$/) || [])[1] || '';
  assert.match(touch, /\.waits-facts button\.waits-link \{ min-height: 44px; \}/);
});
