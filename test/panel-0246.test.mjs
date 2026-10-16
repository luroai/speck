import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0246: 0178's AC3 test compares the panel's models of two boards with the page's clock stopped at one moment.
import test from 'node:test';
import assert from 'node:assert/strict';
import { panelModel, modelsAtOneMoment, stoppedClock, full, round } from './support/panel.mjs';
import { panelBoard } from '../scripts/board-feed.mjs';

const iso = day => new Date(Date.UTC(2026, 8, 1 + day, 10)).toISOString();
const shipped = n => full(String(n).padStart(4, '0'), {
  status: 'done', started: iso(n), approved: iso(n).replace('T10', 'T11'), finished: iso(n).replace('T10', 'T12'),
  rounds: [round(1, 1000 + n)], builder_tokens: 5000 + n, builder_cost_usd: 1.25 });
// A building ticket, whose live counter moves with the clock, and enough finished ones for the board to be cut down.
const board = () => ({ tickets: [full('0901', { status: 'building', started: iso(40) }), ...Array.from({ length: 12 }, (_, i) => shipped(i + 1))], ideas: [] });
// Just before a second ticks over, so the next second is a different counter.
const T0 = Date.UTC(2026, 9, 15, 9, 0, 0, 999);

test('0246 AC1: the two models compare equal when a second passes between working them out', () => {
  const whole = board(), cut = panelBoard(whole);
  // The page's clock a second apart does change the model: this is the chance failure.
  const at = ms => panelModel({ Date: stoppedClock(ms) });
  assert.notDeepEqual(at(T0)(cut), at(T0 + 1000)(whole), 'a second apart, the live counter differs');
  // A clock that moves on a second each time it's read, between the two models.
  let now = T0;
  const ticking = () => { const t = now; now += 1000; return t; };
  const [a, b] = modelsAtOneMoment([cut, whole], ticking);
  assert.deepEqual(a, b);
  assert.ok(a.queue.some(t => t.counter), 'the building ticket has a live counter');
});

test('0246 AC2: a board cut wrongly does not compare equal to the whole board', () => {
  const whole = board(), cut = panelBoard(whole);
  const finished = cut.tickets.filter(t => t.status === 'done').map(t => t.id);
  for (const id of [finished[0], finished.at(-1)]) {
    const wrong = { ...cut, tickets: cut.tickets.filter(t => t.id !== id) };
    const [a, b] = modelsAtOneMoment([wrong, whole]);
    assert.notDeepEqual(a, b, `with ${id} left out`);
  }
  const [a, b] = modelsAtOneMoment([cut, whole]);
  assert.deepEqual(a, b, 'cut rightly, it does');
});
