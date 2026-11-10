import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, queueRows, exitOf, round } from './support/panel.mjs';

// ---------- 0171: colour a running ticket's border by its build stage ----------
// 0585: Build's rows have no border to colour; these check the stage a row says and its dot.

const ago = s => new Date(Date.now() - s * 1000).toISOString();
const TICKETS = [
  T('0501', 'building', { title: 'Writing its code', started: ago(65), build_running: true }),
  T('0502', 'building', { title: 'Checking itself', started: ago(65), build_running: true, self_check: 'no changes' }),
  T('0503', 'reviewing', { title: 'Under review, round 1', started: ago(65), build_running: true, self_check: 'no changes' }),
  T('0504', 'reviewing', { title: 'Under review, round 2', started: ago(65), build_running: true, self_check: 'no changes',
    rounds: [{ ...round(1, 10), verdict: 'request_changes' }] }),
  T('0505', 'approved', { title: 'Being shipped by auto-ship', started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)],
    auto_ship: true, ship: { running: true, auto: true, started: ago(5) } }),
  T('0506', 'approved', { title: 'Being shipped by hand', started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)],
    auto_ship: false, build_exit: { code: 0 }, ship: { running: true, auto: false, started: ago(5) } }),
  T('0507', 'blocked', { title: 'Blocked in review', started: ago(300), self_check: 'no changes', blocked_question: 'Which one?' }),
  T('0508', 'reviewing', { title: 'A build that stopped in review', started: ago(200), self_check: 'no changes', ...exitOf('It ended.') }),
  T('0509', 'approved', { title: 'Waiting for you to ship it', started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)],
    auto_ship: false, build_exit: { code: 0 } }),
  T('0510', 'ready', { title: 'A ready ticket' }),
  T('0511', 'reviewing', { title: 'Paused in review', started: ago(65), build_running: true, paused: true, self_check: 'no changes' }),
  T('0512', 'approved', { title: 'Approved, auto-ship about to start', started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)],
    auto_ship: true, build_running: true }),
];
// 0585: what each row's where line says first and its dot's class: the card's stage border went, so the stage is in
// the words and a blue dot while an agent is at work, orange for a ticket that needs you and grey for the rest.
const EXPECT = { '0501': ['Writing', 'run'], '0502': ['Checking', 'run'], '0503': ['Reviewing · round 1', 'run'], '0504': ['Reviewing · round 1', 'run'], '0505': ['Shipping', 'run'], '0506': ['Shipping', 'run'],
  '0507': ['Has a question', 'needs'], '0508': ['Build stopped', 'needs'], '0509': ['Ready to ship', 'needs'], '0510': ['Ready', 'wait'], '0511': ['Paused', 'wait'], '0512': ['Shipping next', 'wait'] };

// speck run is on, as its ship queue ships the approved tickets auto-ship covers (0203: with it off, they wait for you).
function fake(state) {
  return fakePage([], {
    fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify({ tickets: state.tickets, ideas: [], run: { on: true } }))) }),
  });
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
// The row's where line: its first words, and its dot's class.
const looks = (p, id) => { const w = p.all(rowOf(p, id)).find(n => /^where\b/.test(n.className || '')); return [p.all(w).find(n => n.className === 'said').textContent, w.className.split(' ')[1]]; };

test('0171 AC1: a row whose agent is at work says its stage: building, self-check, review (any round) or shipping, with a blue dot', async () => {
  const p = fake({ tickets: TICKETS });
  await p.settle();
  for (const id of ['0501', '0502', '0503', '0504', '0505', '0506']) assert.deepEqual(looks(p, id), EXPECT[id], id);
});

test('0171 AC2: when a running ticket moves to its next stage, its row says the new stage on the next update', async () => {
  const state = { tickets: [T('0601', 'building', { title: 'Moving on', started: ago(65), build_running: true })] };
  const p = fake(state);
  await p.settle();
  const next = async tickets => { state.tickets = tickets; for (const fn of p.timers.splice(0)) fn(); await p.settle(); };
  assert.deepEqual(looks(p, '0601'), ['Writing', 'run']);
  await next([T('0601', 'building', { title: 'Moving on', started: ago(65), build_running: true, self_check: 'no changes' })]);
  assert.deepEqual(looks(p, '0601'), ['Checking', 'run']);
  await next([T('0601', 'reviewing', { title: 'Moving on', started: ago(65), build_running: true, self_check: 'no changes' })]);
  assert.deepEqual(looks(p, '0601'), ['Reviewing · round 1', 'run']);
  await next([T('0601', 'approved', { title: 'Moving on', started: ago(65), approved: ago(1), self_check: 'no changes', rounds: [round(1, 10)],
    auto_ship: true, ship: { running: true, auto: true, started: ago(1) } })]);
  assert.deepEqual(looks(p, '0601'), ['Shipping', 'run']);
});

// 0616: a stopped build nothing will carry on has the orange dot, as it needs you.
test('0171 AC3: blocked, stopped and waiting tickets have no blue dot', async () => {
  const p = fake({ tickets: TICKETS });
  await p.settle();
  for (const id of ['0507', '0508', '0509', '0510', '0511', '0512']) assert.deepEqual(looks(p, id), EXPECT[id], id);
});
