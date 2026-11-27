import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0778: a ticket that another waits on, and is approved and waiting to ship, is shown as approved, not building.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, full, boardPage, items, queueRows, top, click, fullViewOf } from './support/panel.mjs';

const idOf = (p, n) => p.all(n).find(x => x.className === 'id')?._text;
const show = async tickets => { const p = boardPage([{ run: { on: true }, ideas: [], tickets }], { getSelection: () => ({ isCollapsed: true, rangeCount: 0 }) }); await p.settle(); return p; };
const factsOf = (p, view) => Object.fromEntries(p.all(view).filter(n => n.className === 'fact').map(f => [f.children[0].textContent, f.children[1].textContent]));
async function openCard(p, id) {
  const find = () => items(p).find(n => idOf(p, n) === id);
  if (!/\bopen\b/.test(find().className)) { click(top(find())); await p.settle(); }
  return find();
}
const waits = (kind, id, after) => kind(id, { after, waiting_on: after });
const row = (id, o) => T(id, 'ready', o);
const STATES = [['0001', 'approved'], ['0002', 'building'], ['0003', 'reviewing'], ['0004', 'blocked'], ['0005', 'ready'], ['0006', 'done'], ['0007', 'cancelled']];
const all = () => STATES.map(([id, status]) => T(id, status));
const AFTER = STATES.map(([id]) => id);
const mixed = kind => kind('0100', { after: AFTER, waiting_on: ['0001', '0002', '0003', '0004', '0005', '0007'], after_cancelled: ['0007'] });
const SAID = ['approved', 'building', 'building', 'building', 'queued', 'shipped', 'cancelled'];
const said = fact => AFTER.map(id => fact.match(new RegExp(`${id} Ticket ${id} (approved|building|queued|shipped|cancelled)`))?.[1]);

test('0778 AC1: a card and its full view say an approved ticket it waits on is approved', async () => {
  const p = await show([...all(), mixed(full)]);
  assert.equal(said(factsOf(p, await openCard(p, '0100'))['Waits on'])[0], 'approved');
  const q = await show([...all(), mixed(row)]);
  assert.ok(queueRows(q).some(r => idOf(q, r) === '0100'));
  assert.equal(said(factsOf(q, await fullViewOf(q, '0100'))['Waits on'])[0], 'approved');
});

test('0778 AC1: with one ticket to wait for, the card and full view say approved too', async () => {
  const p = await show([T('0001', 'approved'), waits(full, '0100', ['0001'])]);
  assert.equal(factsOf(p, await openCard(p, '0100'))['Waits for'], '0001 approved');
  const q = await show([T('0001', 'approved'), waits(row, '0100', ['0001'])]);
  assert.equal(factsOf(q, await fullViewOf(q, '0100'))['Waits for'], '0001 approved');
});

test('0778 AC2: building, reviewing and blocked stay building; shipped, queued and cancelled as before', async () => {
  const p = await show([...all(), mixed(full)]);
  assert.deepEqual(said(factsOf(p, await openCard(p, '0100'))['Waits on']), SAID);
  const q = await show([...all(), mixed(row)]);
  assert.deepEqual(said(factsOf(q, await fullViewOf(q, '0100'))['Waits on']), SAID);
});
