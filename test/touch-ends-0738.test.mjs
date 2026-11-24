import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { delivered } from './support/touch-ends.mjs';

// A stand-in for browserPage(): `drops` says, for each gesture in turn, whether the browser drops its touchend.
function fakeBrowser(drops) {
  const w = { touchEnds: 0 };
  let n = 0;
  return {
    w,
    gesture: async () => { if (!drops[n++]) w.touchEnds++; },
    js: async expr => { assert.equal(expr, 'window.touchEnds || 0'); return w.touchEnds; },
    until: async (expr, what) => {
      const want = Number(expr.match(/> (\d+)$/)[1]);
      if (!(w.touchEnds > want)) throw new Error(`timed out waiting for ${what}`);
    },
    runs: () => n,
  };
}

test('0738 AC1: a swipe whose end reached the page runs once', async () => {
  const b = fakeBrowser([false]);
  assert.equal(await delivered(b, b.gesture, { ms: 10 }), 1);
  assert.equal(b.runs(), 1);
});

test('0738 AC1: a swipe whose end the browser dropped runs again, until one reaches the page', async () => {
  const b = fakeBrowser([true, true, false]);
  assert.equal(await delivered(b, b.gesture, { ms: 10 }), 3);
  assert.equal(b.runs(), 3);
});

test('0738 AC2: a browser that drops every end fails plainly after three tries, rather than passing', async () => {
  const b = fakeBrowser([true, true, true, false]);
  await assert.rejects(delivered(b, b.gesture, { ms: 10 }), /dropped the end of the touch 3 times in a row/);
  assert.equal(b.runs(), 3);
});
