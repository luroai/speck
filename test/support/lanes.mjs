// 0514, 0517: the page with a trackpad or a finger over its lanes, run without a browser.
import { T, fakePage, full } from './panel.mjs';

export const TAB = { capture: 'tab-capture', plan: 'tab-plan', build: 'tab-build', shipped: 'tab-shipped' };
export const board = () => ({ tickets: [full('0001', { title: 'A draft' }), T('0003', 'ready'), full('0005', { status: 'done', finished: new Date().toISOString() })], ideas: [] });
export const lane = p => Object.keys(TAB).filter(l => (p.byId(TAB[l]).attrs || {})['aria-selected'] === 'true').join();

// The page, with a trackpad over its lanes: each scroll sends wheel events as a browser does, one a frame (16 ms), each
// with the time it happened. `pause` is how long it waits before the scroll's first event.
export async function pad(globals, boards = [board()]) {
  const p = fakePage(boards, globals);
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
export const fingers = [3, 7, 12, 18, 22, 20, 16];
export const glide = (cut = Infinity) => { const g = []; for (let d = 14; d >= 1 && g.length < cut; d *= 0.9) g.push(Math.round(d * 10) / 10); return g; };
export const swipe = cut => [...fingers, ...glide(cut)];

// 0517: the page as a browser that slides its cards, with reduced motion when `reduce.on` is set. Its lanes' box is
// `width` px wide, each card's animate() gives an animation the test ends (end()) and `slides` lists them all.
// `p.touch(points)` is a finger: down at the first point, through the rest `gap` ms apart, and up unless `lift` is false.
export async function slidingPage({ width = 400, reduce = { on: false }, boards } = {}) {
  const globals = {
    matchMedia: q => ({ matches: reduce.on && /reduced-motion/.test(q), addEventListener() {} }),
    devicePixelRatio: 1,
    getComputedStyle: () => ({ transform: 'none', overflowX: 'visible' }),
    DOMMatrix: class { constructor() { this.m41 = 0; } },
  };
  const p = await pad(globals, boards);
  const lanes = p.byId('lanes');
  lanes.dataset = {};
  lanes.vars = {};
  lanes.style = { setProperty: (k, v) => { lanes.vars[k] = v; } };
  lanes.clientWidth = width;
  lanes.animate = () => {};
  p.slides = [];
  for (const id of ['capture-section', 'shaping-section', 'build-section', 'shipped-section']) {
    p.byId(id).animate = (frames, opts) => {
      const a = { id, frames, opts, cancelled: false };
      a.finished = new Promise((resolve, reject) => { a.end = resolve; a.cancel = () => { a.cancelled = true; reject(new Error('cancelled')); }; });
      a.finished.catch(() => {});
      p.slides.push(a);
      return a;
    };
  }
  // Ends the slide under way, as the browser does once its time is up.
  p.rest = async () => { for (const a of p.slides) if (!a.cancelled) a.end(); await p.settle(); };
  p.sliding = () => !!lanes.dataset.slide;
  let t = 5000;
  const send = (type, x, y) => lanes.listeners[type]({ type, timeStamp: t, target: lanes, cancelable: true, preventDefault() {},
    touches: type === 'touchend' ? [] : [{ clientX: x, clientY: y }] });
  p.touch = (points, { gap = 16, lift = true } = {}) => {
    send('touchstart', ...points[0]);
    for (const pt of points.slice(1)) { t += gap; send('touchmove', ...pt); }
    if (lift) { t += 5; send('touchend'); }
  };
  return p;
}
