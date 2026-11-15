import './support/tmp.mjs';
// 0698: the panel says when a waiting ticket can start on another's approved work (starts_on), and when an approved
// ticket waits to ship after the one it was built on (ships_after).
import test from 'node:test';
import assert from 'node:assert/strict';
import { T, boardPage, queueRows, fullViewOf } from './support/panel.mjs';

const started = new Date(Date.now() - 600000).toISOString();
const approved = (id, o = {}) => T(id, 'approved', { started, auto_ship: true, build_exit: { code: 0, at: started }, ...o });
const show = async tickets => { const p = boardPage([{ run: { on: true }, ideas: [], tickets }], { getSelection: () => ({ isCollapsed: true, rangeCount: 0 }) }); await p.settle(); return p; };
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).find(c => c.className === 'id')._text === id);
const whereOf = (p, id) => p.all(rowOf(p, id)).find(c => /^where\b/.test(c.className));
// Each fact in the full view: its label and its value's text.
const factsOf = (p, view) => p.all(view).filter(n => n.className === 'fact').map(f => [f.children[0].textContent, f.children[1].textContent]);

test('0698 AC1: a ready ticket that can start on another\'s approved work says so on its row, naming it, not that it waits', async () => {
  const p = await show([approved('0801'), T('0802', 'ready', { after: ['0801'], waiting_on: ['0801'], starts_on: '0801' })]);
  assert.equal(whereOf(p, '0802').textContent, 'Ready · can start on 0801\'s approved work');
});

test('0698 AC1: its full view says it can start on that work, in its facts too, and nothing there says it waits', async () => {
  const p = await show([approved('0801'), T('0802', 'ready', { after: ['0801'], waiting_on: ['0801'], starts_on: '0801' })]);
  const view = await fullViewOf(p, '0802');
  assert.match(view.textContent, /Can start on 0801's approved work/);
  assert.deepEqual(factsOf(p, view).find(([label]) => label === 'Starts on'), ['Starts on', '0801 approved work']);
  assert.doesNotMatch(view.textContent, /Waits (for|on)/);
});

test('0698 AC1: one with two or more after: tickets, all but one shipped, says it can start on the one left', async () => {
  const p = await show([approved('0801'), T('0802', 'ready', { after: ['0800', '0801'], waiting_on: ['0801'], starts_on: '0801' })]);
  assert.equal(whereOf(p, '0802').textContent, 'Ready · can start on 0801\'s approved work');
  const view = await fullViewOf(p, '0802');
  assert.match(view.textContent, /Can start on 0801's approved work/);
  assert.doesNotMatch(view.textContent, /Waits (for|on)/);
  assert.match(factsOf(p, view).find(([label]) => label === 'After')[1], /0800 shipped.*0801 approved work/);
});

test('0698 AC2: an approved ticket built on another says on its row that it ships after that one, naming it', async () => {
  const p = await show([approved('0801'), approved('0802', { built_on: '0801', ships_after: '0801' })]);
  assert.match(whereOf(p, '0802').textContent, / · ships after 0801, which it was built on/);
});

test('0698 AC2: and its full view says so too', async () => {
  const p = await show([approved('0801'), approved('0802', { built_on: '0801', ships_after: '0801' })]);
  const view = await fullViewOf(p, '0802');
  assert.match(view.textContent, /Ships after 0801, which it was built on/);
});

test('0698 AC3: a ticket with neither field reads as today', async () => {
  const p = await show([approved('0801'), T('0802', 'ready', { after: ['0801'], waiting_on: ['0801'] }), approved('0803')]);
  assert.equal(whereOf(p, '0802').textContent, 'Ready · after 0801');
  assert.doesNotMatch(whereOf(p, '0803').textContent, /ships after/);
  const view = await fullViewOf(p, '0802');
  assert.doesNotMatch(view.textContent, /Can start on/);
  assert.match(factsOf(p, view).find(([label]) => label === 'Waits for')[1], /0801 building/);
  const done = await fullViewOf(p, '0803');
  assert.doesNotMatch(done.textContent, /Ships after/);
});
