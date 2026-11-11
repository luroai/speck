import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lane, pad, glide, swipe, fingers } from './support/lanes.mjs';

// ---------- 0641: a second trackpad swipe the same way changes lane while the first one's glide still runs ----------

const LANES = ['capture', 'plan', 'build', 'shipped'];
// The page at `at`, got there by swipes with pauses between them, so the next scroll starts fresh.
async function padAt(at) {
  const p = await pad();
  for (let i = LANES.indexOf('build'); i !== LANES.indexOf(at); i += Math.sign(LANES.indexOf(at) - i)) p.scroll(swipe(), { pause: 1000, way: Math.sign(LANES.indexOf(at) - i) });
  assert.equal(lane(p), at);
  return p;
}

// ---------- AC1 ----------

test('0641 AC1: a second swipe the same way, 16 ms after the first one\'s glide, changes lane again, once its steps grow past 20 px', async () => {
  for (const cut of [0, 1, 3, 6, 10, Infinity]) {
    for (const way of [1, -1]) {
      const from = way > 0 ? 'capture' : 'shipped', to = way > 0 ? 'build' : 'plan';
      const p = await padAt(from);
      p.scroll(swipe(cut), { pause: 1000, way });
      assert.equal(lane(p), LANES[LANES.indexOf(from) + way], `glide cut after ${cut}: the first swipe changes lane`);
      p.scroll([3, 7, 12, 18], { way });
      assert.equal(lane(p), LANES[LANES.indexOf(from) + way], `glide cut after ${cut}: the second swipe, under 20 px a step, not yet`);
      p.scroll([22, 20, 16, ...glide()], { way });
      assert.equal(lane(p), to, `glide cut after ${cut}, ${way > 0 ? 'right' : 'left'}: the second swipe changes lane as its step passes 20 px, and its glide no more`);
    }
  }
});

test('0641 AC1: three swipes the same way, each straight after the last one\'s glide, change lane three times', async () => {
  const p = await padAt('capture');
  p.scroll(swipe(5), { pause: 1000 });
  p.scroll(swipe(5));
  p.scroll(swipe());
  assert.equal(lane(p), 'shipped');
});

// ---------- AC2 ----------

test('0641 AC2: one swipe that speeds up, slows down and speeds up again before its glide changes lane only once', async () => {
  const swipes = {
    'one that wobbles under the fingers': [4, 10, 20, 14, 25, 12, 30, 18, 24, ...glide()],
    'one that slows for a moment and speeds up again': [20, 20, 30, 8, 22, 22, 16, 10, 5, 2, 1],
    'one that slows down and speeds up again over a few frames': [20, 20, 30, 24, 18, 12, 8, 6, 22, 22, 16, 10, 5, 2, 1],
    'one that slows over frames and speeds up over two': [3, 7, 12, 18, 22, 20, 16, 12, 15, 24, 20, ...glide()],
    'one that speeds up hard after the change': [5, 12, 25, 40, 60, 70, 65, 50, ...glide().map(d => d * 4), ...glide()],
    'one that slows and speeds up twice': [3, 7, 12, 18, 22, 18, 14, 19, 24, 20, 15, 21, 26, 18, ...glide()],
  };
  for (const [what, deltas] of Object.entries(swipes)) {
    for (const way of [1, -1]) {
      const p = await padAt(way > 0 ? 'plan' : 'shipped');
      p.scroll(deltas, { pause: 1000, way });
      assert.equal(lane(p), 'build', `${what}, ${way > 0 ? 'right from Plan' : 'left from Shipped'}: one lane`);
    }
  }
});

test('0641 AC2: a glide on its own, however long, never changes lane a second time', async () => {
  // A long glide from 60 px a step, slowing by 3% a frame, with a jitter of 0.4 px up and down each frame.
  const long = [];
  for (let d = 60, i = 0; d >= 1; d *= 0.97, i++) long.push(Math.round((d + (i % 2 ? 0.4 : -0.4)) * 10) / 10);
  for (const [what, deltas] of [['a long glide', long], ['the usual glide, many times over', Array(8).fill(glide()).flat().sort((a, b) => b - a)], ['a glide after a swipe', [...fingers, ...long]]]) {
    for (const way of [1, -1]) {
      const p = await padAt(way > 0 ? 'plan' : 'shipped');
      p.scroll(deltas, { pause: 1000, way });
      assert.equal(lane(p), 'build', `${what}, ${way > 0 ? 'right' : 'left'}: one lane`);
    }
  }
});

// ---------- AC3 ----------

test('0641 AC3: after a pause of 50 ms or more, a scroll the same way changes lane again', async () => {
  for (const pause of [50, 51, 100, 5000]) {
    for (const first of [swipe(), swipe(2), [20, 20, 30, 24]]) {
      const p = await padAt('capture');
      p.scroll(first, { pause: 1000 });
      p.scroll([20, 20], { pause });
      assert.equal(lane(p), 'build', `after ${pause} ms`);
    }
  }
});

test('0641 AC3: a scroll the other way changes lane after any pause or none, including after a second swipe\'s change', async () => {
  for (const pause of [1, 8, 16, 30, 49, 50, 1000]) {
    const p = await padAt('capture');
    p.scroll(swipe(4), { pause: 1000 });
    p.scroll(swipe(3));
    assert.equal(lane(p), 'build', 'two swipes right');
    p.scroll([5, 5, 5, 5], { pause, way: -1 });
    assert.equal(lane(p), 'plan', `20 px back, after ${pause} ms`);
    p.scroll([5, 5, 5, 5], { pause });
    assert.equal(lane(p), 'build', `and 20 px right again, after ${pause} ms`);
  }
});
