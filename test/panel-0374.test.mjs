import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { foreman, state, boardPage, dotsOf, expected, LONG, LONG_W } from './support/board.mjs';

// ---------- 0374: the Foreman's notice board scrolls at 10 dots a second ----------

const TEXT = 'Building 2 · 0362 building · 0363 building · 0358 blocked';

test('0374 AC1: text wider than the board scrolls from right to left at 10 dots a second, and loops with the same 16-dot gap', async () => {
  const p = boardPage([state(LONG)]);
  await p.settle();
  const cols = 90, P = LONG_W + 16;
  assert.equal(p.x(), cols, 'it starts at the right-hand edge');
  p.frame(1000);
  p.frame(2000);
  assert.equal(p.x(), cols - 10, '10 dots in a second');
  p.frame(1000 + 3000);
  assert.equal(p.x(), cols - 30, '30 dots in three seconds, a third of the old pace');
  p.frame(1000 + 950);
  assert.equal(p.x(), cols - 9, 'one dot at a time');
  const copy = p.all(p.group()).filter(n => n.attrs && n.attrs.class === 'lit')[1];
  assert.equal(copy.attrs.transform, `translate(${P} 0)`, 'its copy follows a 16-dot gap after its end');
  assert.equal(copy.attrs.display, 'inline');
  for (const s of [cols + P - 1, cols + P, cols + P + 1, cols + 2 * P + 5]) {
    p.frame(1000 + (s * 1000) / 10 + 1);
    const x = p.x();
    assert.ok(x > -P && x <= cols, `${s} dots in: ${x}`);
    assert.equal(((cols - s - x) % P + P) % P, 0, `${s} dots in: on the loop`);
  }
  assert.ok(p.frames.length > 0, 'it keeps going');
});

test('0374 AC2: text that fits stays still, and with reduced motion it never scrolls and shows the word alone', async () => {
  const fits = boardPage([state(foreman())]);
  await fits.settle();
  fits.frame(0); fits.frame(5000);
  assert.equal(fits.x(), 1, 'still, a dot in from the left');
  const still = boardPage([state(LONG), state(LONG)], { reduce: true });
  await still.settle();
  assert.equal(still.frames.length, 0, 'no frames asked for');
  assert.equal(still.x(), 1);
  assert.deepEqual(dotsOf(still.all(still.svg()).find(n => n.attrs && n.attrs.class === 'lit').attrs.d), expected('Building 2'));
});

test('0374 AC2: a refresh with the same text carries on without a jump; new text starts again from the right-hand edge', async () => {
  const BUSY = foreman({ word: 'Building 3', building: ['0362', '0363', '0364'], blocked: [{ id: '0358' }] });
  const p = boardPage([state(LONG), state(LONG), state(BUSY)]);
  await p.settle();
  p.frame(0); p.frame(2000);
  assert.equal(p.x(), 90 - 20);
  await p.timers.shift()(); await p.settle(); // the same text
  assert.equal(p.x(), 90 - 20, 'no jump');
  p.frame(3000);
  assert.equal(p.x(), 90 - 30, 'carries on');
  await p.timers.shift()(); await p.settle(); // new text
  assert.equal(p.x(), 90, 'back at the right-hand edge');
  p.frame(4000); p.frame(5000);
  assert.equal(p.x(), 90 - 10, 'and scrolls from there at 10 dots a second');
});

test('0374 AC3: its words, colour, tooltip, what pressing it does and its name are unchanged while it scrolls', async () => {
  const p = boardPage([state(LONG), state(LONG)]);
  await p.settle();
  p.frame(0); p.frame(4000);
  const run = p.byId('run');
  assert.deepEqual(dotsOf(p.all(p.svg()).find(n => n.attrs && n.attrs.class === 'lit').attrs.d), expected(TEXT));
  assert.equal(run.className, 'run-state fm-ok');
  assert.equal(run.title, 'What speck run is doing, and what is waiting');
  assert.equal(p.name(), TEXT);
  assert.equal(run.attrs['aria-label'], TEXT);
  p.press(run);
  assert.equal(run.attrs['aria-expanded'], 'true');
  assert.equal(p.byId('foreman').hidden, false);
});
