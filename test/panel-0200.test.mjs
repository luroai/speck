import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { panelModel, T, round, fakePage, queueRows } from './support/panel.mjs';

// ---------- 0200: keep each ticket in its place in the Build list until it ships ----------

const at = minutes => new Date(Date.UTC(2026, 9, 15, 9, minutes)).toISOString();
const ids = state => panelModel()(state).queue.map(t => t.id);
const rowIds = p => queueRows(p).map(r => p.all(r).find(n => n.className === 'id')._text);
const shipping = (started, o = {}) => ({ started, approved: at(50), finished: at(55), rounds: [round(1, 1)], ship: { running: true, started: at(55) }, ...o });

test('0200 AC1: in-flight tickets are listed in the order their builds started, whatever their priority, then ready ones in JSON order', () => {
  // As speck status --json gives them: by priority, so the fix and the priority 1 ticket come first.
  const state = { tickets: [
    T('0009', 'building', { type: 'fix', priority: 0, started: at(40) }),
    T('0005', 'reviewing', { priority: 1, started: at(30) }),
    T('0011', 'ready', { priority: 1 }),
    T('0003', 'approved', { priority: 2, started: at(10) }),
    T('0004', 'done', { priority: 2, ...shipping(at(5)) }),
    T('0010', 'ready', { priority: 3 }),
    T('0002', 'blocked', { priority: 4, started: at(20) }),
  ], ideas: [] };
  assert.deepEqual(ids(state), ['0004', '0003', '0002', '0005', '0009', '0011', '0010']);
});

test('0200 AC2: a ticket keeps its place through every stage until it ships, and those around it keep theirs', () => {
  const others = [T('0001', 'reviewing', { priority: 3, started: at(1) }), T('0003', 'building', { priority: 1, started: at(3) })];
  const stages = [
    T('0002', 'building', { started: at(2) }),
    T('0002', 'reviewing', { started: at(2), rounds: [round(1, 1)] }),
    T('0002', 'blocked', { started: at(2), blocked_question: 'Which?' }),
    T('0002', 'approved', { started: at(2), approved: at(50), auto_ship: true, build_exit: { code: 0 } }),
    T('0002', 'done', { ...shipping(at(2)) }),
    // Handed back after a failed ship: approved again, with its auto-ship ended.
    T('0002', 'approved', { started: at(2), approved: at(50), auto_ship: true, ship: { running: false, auto: true, started: at(55), ended: at(56) } }),
    T('0002', 'reviewing', { started: at(2), approved: at(50), rounds: [round(1, 1), round(2, 1)] }),
  ];
  for (const t of stages) {
    // Whether it sorts above or below the others by priority, its place is the same.
    for (const priority of [1, 5]) {
      assert.deepEqual(ids({ tickets: [{ ...t, priority }, ...others], ideas: [] }), ['0001', '0002', '0003'], `${t.status}, priority ${priority}`);
      assert.deepEqual(ids({ tickets: [...others, { ...t, priority }], ideas: [] }), ['0001', '0002', '0003'], `${t.status}, priority ${priority}, listed last`);
    }
  }
  // Once shipped it leaves the list, and the others keep their order.
  const shipped = T('0002', 'done', { started: at(2), approved: at(50), finished: at(55), ship: { running: false, started: at(55), ended: at(56) } });
  assert.deepEqual(ids({ tickets: [shipped, ...others], ideas: [] }), ['0001', '0003']);
});

test('0200 AC3: a ticket whose build start is missing or unreadable goes after those that have one, by id', () => {
  const state = { tickets: [
    T('0012', 'building', { priority: 1 }),
    T('0004', 'approved', { priority: 1, started: 'not a time' }),
    T('0030', 'blocked', { priority: 2, started: at(20) }),
    T('0007', 'reviewing', { priority: 2, started: null }),
    T('0020', 'building', { priority: 3, started: at(10) }),
    T('0001', 'ready', { priority: 1 }),
  ], ideas: [] };
  assert.deepEqual(ids(state), ['0020', '0030', '0004', '0007', '0012', '0001']);
  // Two started at the same time go by id.
  assert.deepEqual(ids({ tickets: [T('0009', 'building', { started: at(5) }), T('0008', 'building', { priority: 5, started: at(5) })], ideas: [] }), ['0008', '0009']);
});

test('0200 AC4: the order is the same after a refresh or reload, and on every open page', async () => {
  const a = T('0006', 'building', { priority: 1, started: at(30) }), b = T('0002', 'reviewing', { priority: 3, started: at(10) });
  const c = T('0004', 'approved', { priority: 2, started: at(20) }), r = T('0001', 'ready', { priority: 1 });
  // The same board, listed in a different order as priorities and statuses change between reads.
  const first = { tickets: [a, c, b, r], ideas: [] }, later = { tickets: [r, b, { ...c, status: 'done', ...shipping(at(20)) }, a], ideas: [] };
  const want = ['0002', '0004', '0006', '0001'];
  const p = fakePage([first, later]);
  await p.settle();
  assert.deepEqual(rowIds(p), want);
  p.timers.shift()(); await p.settle();
  assert.deepEqual(rowIds(p), want, 'after a refresh');
  for (const state of [first, later]) {
    const other = fakePage([state]); // a reload, or another open page
    await other.settle();
    assert.deepEqual(rowIds(other), want);
  }
});
