import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0704: a ticket whose after: names a cancelled ticket (after_cancelled in speck status --json) says that ticket was
// cancelled and should come out of after:, rather than that it waits for it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, full, boardPage, items, queueRows, top, click, fullViewOf, panelModel } from './support/panel.mjs';

const idOf = (p, n) => p.all(n).find(x => x.className === 'id')?._text;
const show = async tickets => { const p = boardPage([{ run: { on: true }, ideas: [], tickets }], { getSelection: () => ({ isCollapsed: true, rangeCount: 0 }) }); await p.settle(); return p; };
const cardOf = (p, id) => items(p).find(n => idOf(p, n) === id);
const rowOf = (p, id) => queueRows(p).find(r => idOf(p, r) === id);
const whereOf = (p, id) => p.all(rowOf(p, id)).find(c => /^where\b/.test(c.className));
const locks = (p, n) => p.all(n).filter(x => x.className === 'lock');
async function openCard(p, id) {
  if (!/\bopen\b/.test(cardOf(p, id).className)) { click(top(cardOf(p, id))); await p.settle(); }
  return cardOf(p, id);
}
const factsOf = (p, view) => p.all(view).filter(n => n.className === 'fact').map(f => [f.children[0].textContent, f.children[1].textContent]);
const GONE = /0690 was cancelled: take it out of after:/;

// speck status --json leaves a cancelled ticket on the board, and lists it in waiting_on and after_cancelled.
const cancelled = () => T('0690', 'cancelled');

test('0704 AC1: a Plan card whose after: names a cancelled ticket says it was cancelled and should come out of after:, with no lock', async () => {
  const p = await show([cancelled(), full('0705', { after: ['0690'], waiting_on: ['0690'], after_cancelled: ['0690'] })]);
  assert.match(cardOf(p, '0705').textContent, GONE, 'closed card');
  const card = await openCard(p, '0705');
  assert.match(card.textContent, GONE, 'open card');
  assert.equal(locks(p, card).length, 0, 'no lock');
  assert.doesNotMatch(card.textContent, /Waiting on 0690/);
});

test('0704 AC1: a Build row says so in place of "after <id>", and its full view says so too', async () => {
  const p = await show([cancelled(), T('0705', 'ready', { after: ['0690'], waiting_on: ['0690'], after_cancelled: ['0690'] })]);
  const where = whereOf(p, '0705').textContent;
  assert.match(where, GONE);
  assert.doesNotMatch(where, /after 0690/);
  const view = await fullViewOf(p, '0705');
  assert.match(view.textContent, GONE);
  assert.doesNotMatch(view.textContent, /Waiting on 0690/);
});

test('0704 AC2: the chain facts show the cancelled ticket as cancelled, not queued', async () => {
  const p = await show([cancelled(), T('0705', 'ready', { after: ['0690'], waiting_on: ['0690'], after_cancelled: ['0690'] })]);
  const view = await fullViewOf(p, '0705');
  assert.deepEqual(factsOf(p, view).find(([label]) => label === 'Waits for'), ['Waits for', '0690 cancelled']);
});

test('0704 AC2: the Waits on facts show it as cancelled, and the model does not count it as queued', async () => {
  const t = T('0705', 'ready', { after: ['0690', '0691'], waiting_on: ['0690', '0691'], after_cancelled: ['0690'] });
  const m = panelModel()({ tickets: [cancelled(), T('0691', 'ready'), t] });
  const deps = m.queue.find(x => x.id === '0705').deps;
  assert.deepEqual(deps.items.map(i => [i.id, i.state]), [['0690', 'cancelled'], ['0691', 'queued']]);
  assert.equal(deps.queued, 1);
  const p = await show([cancelled(), T('0691', 'ready'), t]);
  const view = await fullViewOf(p, '0705');
  assert.match(factsOf(p, view).find(([label]) => label === 'Waits on')[1], /0690 Ticket 0690 cancelled.*0691 Ticket 0691 queued/);
});

test('0704 AC3: one whose after: names a cancelled and an unfinished ticket still says it waits for the unfinished one', async () => {
  const p = await show([cancelled(), T('0691', 'ready'), T('0705', 'ready', { after: ['0690', '0691'], waiting_on: ['0690', '0691'], after_cancelled: ['0690'] }),
    full('0706', { after: ['0690', '0691'], waiting_on: ['0690', '0691'], after_cancelled: ['0690'] })]);
  const where = whereOf(p, '0705').textContent;
  assert.match(where, /after 0691/);
  assert.doesNotMatch(where, /after 0690/);
  assert.match(where, GONE);
  const card = await openCard(p, '0706');
  assert.deepEqual(locks(p, card).map(l => l.title), ['Waiting on 0691']);
  assert.match(card.textContent, GONE);
});

test('0704 AC4: a ticket whose after: names no cancelled ticket reads as it does today', async () => {
  const p = await show([T('0691', 'ready'), T('0705', 'ready', { after: ['0691'], waiting_on: ['0691'] }), full('0706', { after: ['0691'], waiting_on: ['0691'] })]);
  assert.equal(whereOf(p, '0705').textContent, 'Ready · after 0691');
  const card = await openCard(p, '0706');
  assert.deepEqual(locks(p, card).map(l => l.title), ['Waiting on 0691']);
  assert.doesNotMatch(card.textContent, /cancelled/);
  const view = await fullViewOf(p, '0705');
  assert.doesNotMatch(view.textContent, /cancelled/);
  assert.deepEqual(factsOf(p, view).find(([label]) => label === 'Waits for'), ['Waits for', '0691 queued']);
});

test('0704 AC1 (round 1 F1): a blocked or approved ticket in flight says so on its Build row too, keeping where it is', async () => {
  const started = new Date(Date.now() - 60000).toISOString();
  const p = await show([cancelled(),
    T('0705', 'blocked', { started, after: ['0690'], waiting_on: ['0690'], after_cancelled: ['0690'], blocked_question: 'Which?' }),
    T('0706', 'approved', { started, after: ['0690'], waiting_on: ['0690'], after_cancelled: ['0690'], build_exit: { code: 0, at: started } })]);
  for (const id of ['0705', '0706']) {
    const where = whereOf(p, id).textContent;
    assert.match(where, GONE, `${id}: ${where}`);
    assert.doesNotMatch(where, /^Ready ·/, `${id}: ${where}`);
  }
});
