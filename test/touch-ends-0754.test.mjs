import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { delivered, steady, CAUGHT_UP } from './support/touch-ends.mjs';

// 0754: 0476 AC2's swipes still lost their ends three times in a row under the full suite's load, each time on the first
// gesture after a drag held down and lifted by hand. The touch helpers now let the page catch up before each try, pause
// longer before each retry, and check the held drags' ends too.

// A stand-in for browserPage() that logs each call in order: `drops` says, for each gesture in turn, whether the
// browser drops its touchend.
function fakeBrowser(drops) {
  const w = { touchEnds: 0 }, log = [];
  let n = 0;
  return {
    log,
    gesture: async () => { log.push('gesture'); if (!drops[n++]) w.touchEnds++; },
    js: async (expr, ms) => {
      if (expr === CAUGHT_UP) { log.push(`caught up (${ms} ms)`); return 1; }
      assert.equal(expr, 'window.touchEnds || 0');
      return w.touchEnds;
    },
    until: async (expr, what) => {
      if (!(w.touchEnds > Number(expr.match(/> (\d+)$/)[1]))) throw new Error(`timed out waiting for ${what}`);
    },
  };
}

test('0754 AC1: a gesture waits for the page to catch up before it starts, and a retry pauses longer first', async () => {
  const b = fakeBrowser([true, true, false]), paused = [];
  const ready = (page, n) => steady(page, n, { pause: async ms => { paused.push(ms); b.log.push(`pause ${ms}`); } });
  assert.equal(await delivered(b, b.gesture, { ms: 10, ready }), 3);
  assert.deepEqual(b.log, [
    'caught up (30000 ms)', 'gesture',
    'pause 1000', 'caught up (30000 ms)', 'gesture',
    'pause 2000', 'caught up (30000 ms)', 'gesture',
  ]);
});

test('0754 AC1: a gesture whose end reaches the page first time doesn\'t pause', async () => {
  const b = fakeBrowser([false]);
  const ready = (page, n) => steady(page, n, { pause: async ms => b.log.push(`pause ${ms}`) });
  assert.equal(await delivered(b, b.gesture, { ms: 10, ready }), 1);
  assert.deepEqual(b.log, ['caught up (30000 ms)', 'gesture']);
});

test('0754 AC1: the page catching up is a frame drawn, waited for in the page', () => {
  assert.match(CAUGHT_UP, /requestAnimationFrame\(.*requestAnimationFrame/);
});

test('0754 AC1: every swipe in 0476, the held drags lifted by hand among them, has its end checked and waits for the page', () => {
  const src = fs.readFileSync(new URL('./panel-0476.test.mjs', import.meta.url), 'utf8');
  const calls = [...src.matchAll(/delivered\(b,/g)].length, steadied = [...src.matchAll(/ready: steady/g)].length;
  assert.equal(steadied, calls, 'each delivered() call in 0476 lets the page catch up first');
  // Each touchEnd sent by hand, after a drag held down, is inside a delivered() gesture: the line before the gesture's
  // closing `});` (with nothing but the touchEnd on it).
  const lines = src.split('\n');
  const ends = lines.map((l, i) => [l, i]).filter(([l]) => l.includes(`type: 'touchEnd', touchPoints: []`) && !l.includes('const touch'));
  assert.ok(ends.length >= 5, `the held drags lifted by hand (${ends.length})`);
  for (const [l, i] of ends) assert.match(lines[i + 1], /^\s*\}(, \{ ready: steady \})?\);/, `a hand-lifted drag's end is checked: line ${i + 1}: ${l.trim()}`);
});
