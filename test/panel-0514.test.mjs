import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, full } from './support/panel.mjs';

// ---------- 0514: a sideways trackpad scroll changes lane on each scroll, without a click between ----------

const TAB = { plan: 'tab-plan', build: 'tab-build', shipped: 'tab-shipped' };
const board = () => ({ tickets: [full('0001', { title: 'A draft' }), T('0003', 'ready'), full('0005', { status: 'done', finished: new Date().toISOString() })], ideas: [] });
const lane = p => Object.keys(TAB).filter(l => (p.byId(TAB[l]).attrs || {})['aria-selected'] === 'true').join();

// The page, with a trackpad over its lanes: each scroll sends wheel events as a browser does, one a frame (16 ms), each
// with the time it happened. `pause` is how long it waits before the scroll's first event.
async function pad(globals) {
  const p = fakePage([board()], globals);
  await p.settle();
  let now = 1000;
  const lanes = p.byId('lanes');
  p.wheel = (deltaX, deltaY = 0, gap = 16) => {
    now += gap;
    lanes.listeners.wheel({ deltaX, deltaY, timeStamp: now, target: lanes, cancelable: true, preventDefault() {} });
  };
  p.now = () => now;
  p.scroll = (deltas, { pause = 16, way = 1 } = {}) => deltas.forEach((d, i) => p.wheel(way * d, 0, i ? 16 : pause));
  return p;
}
// A swipe as a trackpad sends it: the fingers speeding up and slowing down, then its glide after they lift, slowing
// down until it stops. `cut` stops the glide after that many of its events, as the next swipe's fingers do.
const fingers = [3, 7, 12, 18, 22, 20, 16];
const glide = (cut = Infinity) => { const g = []; for (let d = 14; d >= 1 && g.length < cut; d *= 0.9) g.push(Math.round(d * 10) / 10); return g; };
const swipe = cut => [...fingers, ...glide(cut)];

// ---------- AC1 ----------

test('0514 AC1: a sideways scroll that changes lane is followed by one the other way that changes back, and a third, with nothing between them', async () => {
  const p = await pad();
  assert.equal(lane(p), 'build', 'as the page opens');
  p.scroll(swipe());
  assert.equal(lane(p), 'shipped', 'a scroll right changes lane');
  p.scroll(swipe(), { way: -1 });
  assert.equal(lane(p), 'build', 'and one straight back, the next frame after its glide stopped');
  p.scroll(swipe());
  assert.equal(lane(p), 'shipped', 'and a third');
});

test('0514 AC1: a swipe the other way that stops the last one\'s glide while it is still going changes lane back', async () => {
  const p = await pad();
  p.scroll(swipe(6));
  assert.equal(lane(p), 'shipped', 'a scroll right');
  p.scroll(swipe(4), { way: -1 });
  assert.equal(lane(p), 'build', 'one back, during the first one\'s glide');
  p.scroll(swipe(2));
  assert.equal(lane(p), 'shipped', 'and a third, during that one\'s glide');
  p.scroll(swipe(0), { way: -1 });
  assert.equal(lane(p), 'build', 'and a fourth, as the fingers of the third lift');
});

// ---------- AC2 ----------

test('0514 AC2: a pause of any length between two sideways scrolls still lets the second one change lane, either way, however the first one ended', async () => {
  // From a pause of 50 ms: anything shorter is the time between two frames of one scroll.
  for (const pause of [50, 100, 149, 150, 400, 5000, 600000]) {
    for (const [what, first] of [['its glide run out', swipe()], ['cut short in its glide', swipe(2)], ['stopped under the fingers', [20, 20, 30, 24]]]) {
      const p = await pad();
      p.scroll(first, { way: -1 });
      assert.equal(lane(p), 'plan', `${what}: a scroll left`);
      p.scroll([20, 20], { pause });
      assert.equal(lane(p), 'build', `${what}: a second, right, after ${pause} ms`);
      p.scroll(first, { pause });
      p.scroll([20, 20], { pause });
      assert.equal(lane(p), 'shipped', `${what}: the same way, after ${pause} ms`);
      p.scroll(first, { pause, way: -1 });
      assert.equal(lane(p), 'build', `${what}: and back, after ${pause} ms`);
    }
  }
});

test('0514 AC2: a scroll the other way changes lane after any pause, however short, as a glide never turns back', async () => {
  for (const pause of [8, 16, 30, 49]) {
    const p = await pad();
    p.scroll(swipe(3));
    p.scroll(swipe(3), { pause, way: -1 });
    assert.equal(lane(p), 'build', `back, after ${pause} ms`);
    p.scroll(swipe(3), { pause, way: -1 });
    assert.equal(lane(p), 'build', `on the same way after only ${pause} ms counts as the same scroll`);
    p.scroll(swipe(3), { pause });
    assert.equal(lane(p), 'shipped', `and back again, after ${pause} ms`);
  }
});

test('0514 AC2: scrolling a lane\'s list up and down between two sideways scrolls leaves the next one able to change lane', async () => {
  for (const [ups, way, to] of [[1, -1, 'plan'], [3, 1, 'shipped'], [40, -1, 'plan'], [40, 1, 'shipped']]) {
    const p = await pad();
    p.scroll(swipe(), { way: -1 });
    p.scroll(swipe());
    assert.equal(lane(p), 'build', 'from Plan to Build');
    for (let i = 0; i < ups; i++) p.wheel(i % 3 ? 1 : 0, i % 2 ? 30 : -25);
    p.scroll(swipe(), { way });
    assert.equal(lane(p), to, `after ${ups} up-and-down scroll events, a sideways scroll ${way > 0 ? 'right' : 'left'} changes lane`);
  }
});

// ---------- AC3 ----------

test('0514 AC3: one continuous glide changes lane only once, however long, with jitter, or speeding up and slowing down under the fingers', async () => {
  const glides = {
    'a swipe and its glide': swipe(),
    'a long, fast one': [5, 12, 25, 40, 60, 70, 65, 50, ...glide().map(d => d * 4), ...glide()],
    'one that wobbles under the fingers': [4, 10, 20, 14, 25, 12, 30, 18, 24, ...glide()],
    'a glide with jitter at its end': [...swipe(), 1, -1, 2, 1, -0.5, 1, 2, 1, 1, -1, 2, 1, 2, 1, 1, 2, 1, 1],
    'one that slows for a moment and speeds up again': [20, 20, 30, 8, 22, 22, 16, 10, 5, 2, 1],
    'one that slows down and speeds up again over a few frames': [20, 20, 30, 24, 18, 12, 8, 6, 22, 22, 16, 10, 5, 2, 1],
    'a slow one that crawls on': [2, 3, 4, 5, 6, 6, 5, 6, 7, 6, 5, 6, 5, 4, 3, 2, 2, 1, 2, 1, 1],
  };
  for (const [what, deltas] of Object.entries(glides)) {
    for (const way of [1, -1]) {
      const p = await pad();
      p.scroll(swipe(), { way: -way }); // to Plan or Shipped, so the glide has two lanes it could skip across
      assert.equal(lane(p), way > 0 ? 'plan' : 'shipped');
      p.scroll(deltas, { pause: 1000, way });
      assert.equal(lane(p), 'build', `${what}, ${way > 0 ? 'right from Plan' : 'left from Shipped'}: one lane`);
    }
  }
});

test('0514 AC3: steps held up while the page changes lane don\'t count as a pause, so the rest of the swipe changes nothing', async () => {
  let p = null;
  const slow = { now: () => p.now() + 110 }; // the page takes 110 ms to change lane, and the browser holds the steps meanwhile
  p = await pad({ performance: slow });
  p.scroll([3, 7, 12, 18]);
  assert.equal(lane(p), 'shipped', 'the swipe changes lane');
  p.wheel(22 + 20 + 16, 0, 120); // the steps held up, as one, timed by the last of them
  p.scroll(glide());
  p.scroll(swipe(), { way: -1, pause: 1000 });
  p.scroll([3, 7, 12, 18], { way: -1, pause: 1000 });
  assert.equal(lane(p), 'plan', 'and from Shipped, two scrolls left go to Plan');
  p.scroll([3, 7, 12, 18]);
  p.wheel(58, 0, 120);
  p.scroll(glide());
  assert.equal(lane(p), 'build', 'a swipe right from Plan, held up the same way, stops at Build');
});

test('0514 AC3: a short sideways scroll, under 40 px, changes nothing, nor does a second one after a pause', async () => {
  const p = await pad();
  p.scroll([5, 10, 12, 8, 3]);
  p.scroll([5, 10, 12, 8, 3], { pause: 200 });
  assert.equal(lane(p), 'build');
});

test('0514 AC3: the arrow keys and tapping the strip still change lane', async () => {
  const p = await pad();
  p.scroll(swipe());
  const press = key => p.document.listeners.keydown({ key, target: { tagName: 'BODY' }, preventDefault() {} });
  press('ArrowLeft');
  assert.equal(lane(p), 'build', '← straight after a sideways scroll');
  press('ArrowLeft');
  assert.equal(lane(p), 'plan', '← again');
  p.byId('tab-shipped').listeners.click({ stopPropagation() {} });
  assert.equal(lane(p), 'shipped', 'tapping Shipped');
  p.scroll(swipe(), { way: -1 });
  assert.equal(lane(p), 'build', 'and a sideways scroll after them');
});
