import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0411: Shipped lists the latest ten finished tickets, and the board the panel sends keeps those ten whole.
import test from 'node:test';
import assert from 'node:assert/strict';
import { panelModel, fakePage, full, round, shippedRows, openDetails } from './support/panel.mjs';
import { panelBoard } from '../scripts/board-feed.mjs';

const words = (what, n) => `Words about ${what}. `.repeat(n);
const iso = day => new Date(Date.UTC(2026, 8, 1 + day, 10)).toISOString();
const shipped = (n, o = {}) => full(String(n).padStart(4, '0'), {
  status: 'done', problem: words(`the problem of ${n}`, 60), notes: words(`the notes of ${n}`, 120), acceptance_criteria: [words('a criterion', 30)],
  started: iso(n), approved: iso(n).replace('T10', 'T11'), finished: iso(n).replace('T10', 'T12'),
  rounds: [round(1, 1000 + n)], builder_tokens: 5000 + n, builder_cost_usd: 1.25,
  build_exit: { at: iso(n), code: 0, message: words('the log', 300) }, ship: { running: false, auto: true, started: iso(n), ended: iso(n) }, ...o });
const board = (n, extra = []) => ({ tickets: [full('0900', { status: 'ready' }), ...Array.from({ length: n }, (_, i) => shipped(i + 1)), ...extra], ideas: [], resume_command: '' });
const size = v => Buffer.byteLength(JSON.stringify(v));
const latest = (b, k) => b.tickets.filter(t => t.status === 'done').sort((x, y) => Date.parse(y.finished) - Date.parse(x.finished)).slice(0, k).map(t => t.id);
const fullText = t => [t.id, t.title, t.problem, t.outcome, t.acceptance_criteria, t.out_of_scope, t.notes];

// ---------- AC1: the latest ten, newest first, plus any not pushed ----------

test('0411 AC1: Shipped lists the latest ten finished tickets, newest first', async () => {
  const b = board(30), want = latest(b, 10);
  assert.equal(want.length, 10);
  assert.deepEqual(panelModel()(panelBoard(b)).shipped.map(t => t.id), want);
  const p = fakePage([panelBoard(b)]);
  await p.settle();
  assert.deepEqual(shippedRows(p).map(r => want.find(id => r.textContent.includes(id))), want, 'ten cards, newest first');
});

test('0411 AC1: an older ticket whose ship did not push still shows, whole, after the ten', () => {
  const old = shipped(0, { id: '0950', ship: { running: false, auto: true, started: iso(0), ended: iso(0), unpushed: true, message: 'Merged, not pushed.' } });
  const b = board(30, [old]), out = panelBoard(b);
  assert.deepEqual(out.tickets.find(t => t.id === '0950'), old, 'kept whole');
  assert.deepEqual(panelModel()(out).shipped.map(t => t.id), [...latest(board(30), 10), '0950']);
});

test('0411 AC1: with fewer than ten finished tickets, Shipped lists them all', () => {
  for (const n of [1, 7, 9, 10]) {
    const b = board(n);
    assert.deepEqual(panelModel()(panelBoard(b)).shipped.map(t => t.id), latest(b, n), `${n} finished`);
    assert.deepEqual(panelBoard(b), b, `${n} finished: nothing cut`);
  }
});

// ---------- AC2: each of the ten opens with its whole text ----------

test('0411 AC2: each of the ten has its whole text for its Details and full ticket', () => {
  const b = board(30), m = panelModel()(panelBoard(b));
  assert.equal(m.shipped.length, 10);
  for (const t of m.shipped) assert.deepEqual(fullText(t), fullText(b.tickets.find(x => x.id === t.id)), t.id);
});

test('0411 AC2: each of the ten opens its full ticket with its whole text, and its Review pack', async () => {
  const b = board(30), want = latest(b, 10);
  const p = fakePage([panelBoard(b)]);
  await p.settle();
  await openDetails(p);
  for (const id of want) {
    const row = shippedRows(p).find(r => r.textContent.includes(id));
    p.press(p.all(row).find(n => n.tagName === 'button' && n.textContent === 'Full ticket')); // 0466: in its open card
    await p.settle();
    const text = p.byId('full-ticket').textContent, t = b.tickets.find(x => x.id === id);
    assert.ok(text.includes(t.notes.trim()) && text.includes(t.problem.trim()), `${id}: the full ticket has its whole notes and problem`);
    const pack = p.all(shippedRows(p).find(r => r.textContent.includes(id))).find(n => n.tagName === 'button' && n.textContent === 'Review pack');
    assert.ok(pack, `${id} has a Review pack button`);
    p.press(pack);
    await p.settle();
    assert.equal(p.calls.at(-1).url, `/api/tickets/${id}/pack`, `${id}: its review pack`);
  }
});

// ---------- AC3: every finished ticket outside the ten is cut down ----------

test('0411 AC3: every finished ticket outside the ten is no more than 500 bytes, and the ten the page lists stay whole', () => {
  const b = board(40), out = panelBoard(b), keep = latest(b, 10);
  const cut = out.tickets.filter(t => t.status === 'done' && !keep.includes(t.id));
  assert.equal(cut.length, 30);
  for (const t of cut) assert.ok(size(t) <= 500, `${t.id} is ${size(t)} bytes`);
  assert.deepEqual(out.tickets.filter(t => keep.includes(t.id)), b.tickets.filter(t => keep.includes(t.id)), 'the ten whole');
  // The server and the page pick the same ten.
  const whole = out.tickets.filter(t => t.status === 'done' && typeof t.notes === 'string').map(t => t.id).sort();
  assert.deepEqual(panelModel()(out).shipped.map(t => t.id).sort(), whole);
});
