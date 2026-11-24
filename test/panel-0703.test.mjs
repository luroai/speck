import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0703: an open Plan card shows its chain as the facts Waits for and Waiting on it, as the full view does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, full, boardPage, items, queueRows, top, click } from './support/panel.mjs';

const TICKETS = () => [
  full('0010'), full('0011', { after: ['0010'], waiting_on: ['0010'] }), full('0012', { after: ['0011'], waiting_on: ['0011'] }),
  full('0300', { title: 'Alone' }), T('0400', 'ready', { after: [] }),
];
const idOf = (p, n) => p.all(n).find(x => x.className === 'id')?._text;
const factsIn = (p, n) => p.all(n).filter(x => x.className === 'facts chain-facts');
const boxes = (p, n) => p.all(n).filter(x => /^deps\b/.test(x.className || ''));
async function openCard(p, id) {
  let card = items(p).find(n => idOf(p, n) === id);
  if (!/\bopen\b/.test(card.className)) { click(top(card)); await p.settle(); }
  return items(p).find(n => idOf(p, n) === id);
}
const page = async () => { const p = boardPage([{ run: { on: false }, ideas: [], tickets: TICKETS() }]); await p.settle(); return p; };

test('0703 AC1: an open Plan card shows Waits for and Waiting on it as facts, and no Chain box', async () => {
  const p = await page();
  const card = await openCard(p, '0011');
  const [facts] = factsIn(p, card);
  assert.ok(facts, 'chain facts');
  assert.deepEqual(facts.children.map(c => c.children[0].textContent), ['Waits for', 'Waiting on it']);
  assert.match(facts.textContent, /Waits for0010 queued/);
  assert.match(facts.textContent, /Waiting on it0012 queued/);
  assert.equal(boxes(p, card).length, 0, 'no Chain box');
});

test('0703 AC2: pressing an id in a Plan card\'s chain facts goes to that ticket on the page, not its full view', async () => {
  const p = await page();
  const card = await openCard(p, '0011');
  const link = p.all(card).find(n => n.tagName === 'button' && /^chain-id/.test(n.className) && n.textContent === '0012');
  assert.ok(link);
  p.press(link);
  await p.settle();
  assert.equal(p.byId('full-ticket').hidden !== false, true, 'its full view stays closed');
  assert.ok(queueRows(p).find(n => idOf(p, n) === '0012') || items(p).find(n => idOf(p, n) === '0012'), 'it is on the page');
});

test('0703 AC3: after a state refresh the card has exactly one set of chain facts', async () => {
  const p = await page();
  const card = await openCard(p, '0011');
  assert.equal(factsIn(p, card).length, 1);
  for (let i = 0; i < 2; i++) { assert.ok(p.timers.length, 'a refresh is waiting'); p.timers.shift()(); await p.settle(); }
  assert.equal(factsIn(p, await openCard(p, '0011')).length, 1);
});

test('0703 AC4: an open Plan card with no chain shows no chain facts and no Chain box', async () => {
  const p = await page();
  const card = await openCard(p, '0300');
  assert.equal(factsIn(p, card).length, 0);
  assert.equal(boxes(p, card).length, 0);
});
