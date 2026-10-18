import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, queueRows, exitOf, round } from './support/panel.mjs';

// ---------- 0172: the shipping stage's own badge loop ----------

const ago = s => new Date(Date.now() - s * 1000).toISOString();
const approved = o => ({ started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], ...o });
const TICKETS = [
  T('0701', 'approved', approved({ build_running: true, ship: { running: true, started: ago(5) } })), // by hand, its build still closing out
  T('0702', 'approved', approved({ auto_ship: true, build_exit: { at: ago(30), code: 0 }, ship: { running: true, auto: true, started: ago(5) } })), // the ship queue
  T('0703', 'approved', approved({ auto_ship: true, build_exit: { at: ago(30), code: 0 } })), // auto-ship, between approval and its ship
  T('0704', 'building', { title: 'Writing its code', started: ago(65), build_running: true }),
  T('0705', 'approved', approved({ ...exitOf('Approved.'), ship: { running: true, started: ago(5) } })), // by hand, its build ended
];
// speck run is on, as its ship queue ships the approved tickets auto-ship covers (0203: with it off, they wait for you).
function fake(tickets = TICKETS) {
  return fakePage([], {
    fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify({ tickets, ideas: [], run: { on: true } }))) }),
  });
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const badgeIn = (p, id) => rowOf(p, id).children.find(n => n.className === 'top').children.find(n => n.className === 'badgerow').children[0];
// Since 0302 the poses are drawn by the design's LCD renderer (test/panel-0302.test.mjs), so what they draw is its own.

test('0172 AC1: a shipping ticket\'s badge plays the shipping loop, whoever ships it and whether or not its build is running; writing code keeps the laptop', async () => {
  const p = fake();
  await p.settle();
  const shows = id => [badgeIn(p, id).className, badgeIn(p, id).attrs['aria-label']];
  assert.deepEqual(shows('0701'), ['badge ship', 'The builder is shipping'], 'by hand, its build still running');
  assert.deepEqual(shows('0702'), ['badge ship', 'The builder is shipping'], 'by the ship queue, its build ended');
  assert.deepEqual(shows('0705'), ['badge ship', 'The builder is shipping'], 'by hand, its build ended');
  assert.deepEqual(shows('0703'), ['badge ship', 'The builder is about to ship'], 'auto-ship, from approval until it ships');
  assert.deepEqual(shows('0704'), ['badge type', 'The builder is writing code']);
});
