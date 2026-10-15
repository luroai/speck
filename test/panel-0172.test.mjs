import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, queueRows, exitOf, round, page, findChrome, browserPage } from './support/panel.mjs';
import { loadBadge, recorder, body, eye, ticks } from './support/badge.mjs';

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
const script = () => page().match(/<script>([\s\S]*?)<\/script>/)[1];
const loopOf = pose => script().match(new RegExp(` {4}${pose}\\(g, t\\) \\{([\\s\\S]*?)\\n {4}\\},`))[1];

// One frame of the ship pose, with each rectangle (the block) recorded as a four-point path.
function shipFrame(B, t) {
  const g = recorder();
  g.rect = (x, y, w, h) => { g.moveTo(x, y); g.lineTo(x + w, y); g.lineTo(x + w, y + h); g.lineTo(x, y + h); };
  B.draw(g, 'ship', t);
  return g.marks;
}
const xs = path => path.map(q => q.x), ys = path => path.map(q => q.y);
// The boat: a paper-filled outline of six or more points. The block: a paper-filled rectangle. The water: a long thin ink line.
const boat = m => m.find(k => k.op === 'fill' && k.colour === 'paper' && k.path.length >= 6 && k.path.every(q => q.kind === 'point'))?.path;
const block = m => m.find(k => k.op === 'fill' && k.colour === 'paper' && k.path.length === 4 && k.path.every(q => q.kind === 'point'))?.path;
const water = m => m.find(k => k.op === 'stroke' && k.colour === 'ink' && k.path.length >= 8 && k.path.every(q => q.kind === 'point'))?.path;
const segDist = (q, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy, k = l ? Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.y - a.y) * dy) / l)) : 0;
  return Math.hypot(q.x - a.x - k * dx, q.y - a.y - k * dy);
};
const toOutline = (q, path) => Math.min(...path.map((a, i) => segDist(q, a, path[(i + 1) % path.length])));
// The builder's arms on the boat: straight ink strokes from its body to a hand on the boat's outline.
function handsOnBoat(m) {
  const b = body(m), hull = boat(m);
  return m.filter(k => k.op === 'stroke' && k.colour === 'ink' && k.path.length === 2 && k.path.every(q => q.kind === 'point'))
    .filter(k => Math.hypot(k.path[0].x - b.x, k.path[0].y - b.y) <= 20 * .64 + 1 && Math.hypot(k.path[1].x - b.x, k.path[1].y - b.y) > 20 * .64)
    .filter(k => toOutline(k.path[1], hull) < 1.5);
}
const CY = 3200;

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

test('0172 AC2: a ticked block sits on a small paper boat in front of the builder, on a thin line of water', () => {
  const B = loadBadge();
  for (let t = 0; t < 2 * CY; t += 53) {
    const m = shipFrame(B, t), hull = boat(m), w = water(m), b = body(m);
    assert.ok(w, `${t}: a line of water`);
    assert.ok(Math.max(...ys(w)) - Math.min(...ys(w)) < 2, `${t}: thin and level`);
    assert.ok(Math.max(...ys(w)) < 55 && Math.min(...xs(w)) > b.x, `${t}: in front of the builder, in the tile`);
    if (!hull) continue; // it has sailed off
    const blk = block(m), wy = ys(w).reduce((a, y) => a + y, 0) / w.length;
    assert.ok(blk, `${t}: a block on the boat`);
    assert.ok(Math.abs(Math.max(...ys(hull)) - wy) < 2, `${t}: the boat sits on the water`);
    assert.ok(Math.max(...ys(hull)) - Math.min(...ys(hull)) < Math.max(...xs(hull)) - Math.min(...xs(hull)), `${t}: a low, long boat`);
    const bx = (Math.min(...xs(blk)) + Math.max(...xs(blk))) / 2;
    assert.ok(bx > Math.min(...xs(hull)) && bx < Math.max(...xs(hull)), `${t}: the block is over the boat`);
    assert.ok(Math.max(...ys(blk)) <= Math.max(...ys(hull)) && Math.max(...ys(blk)) > Math.min(...ys(hull)) - 1, `${t}: and sits on it`);
    for (const q of hull) assert.ok(q.x > b.x && Math.hypot(q.x - b.x, q.y - b.y) > 20 * .64, `${t}: in front of the builder, not over it`);
    const p = (t % CY) / CY, tk = ticks(m);
    if (p > .2) {
      assert.equal(tk.length, 1, `${t}: a green tick`);
      for (const q of tk[0].path) assert.ok(q.x > Math.min(...xs(blk)) && q.x < Math.max(...xs(blk)) && q.y > Math.min(...ys(blk)) && q.y < Math.max(...ys(blk)), `${t}: on the block`);
    }
  }
});

test('0172 AC2: in a loop of about 3 seconds the builder pushes the boat with both arms and it slides off to the right, then a new one appears', () => {
  const B = loadBadge(), at = p => shipFrame(B, p * CY), left = m => Math.min(...xs(boat(m)));
  const rest = left(at(.15));
  assert.ok(handsOnBoat(at(.45)).length >= 2, 'both hands on the boat as it pushes');
  assert.ok(left(at(.5)) > rest + 1, 'and the boat moves');
  let last = rest, gone = null;
  for (let p = .3; p < 1; p += .01) {
    const m = at(p);
    if (!boat(m) || left(m) > 55) { gone = gone ?? p; continue; }
    assert.ok(left(m) >= last - .01, `${p}: the boat only moves right`);
    assert.ok(Math.abs(Math.max(...ys(boat(m))) - Math.max(...ys(boat(at(.15))))) < 1.5, `${p}: along the water`);
    last = left(m);
  }
  assert.ok(gone !== null && gone < .95, `out of the tile before the loop ends: ${gone}`);
  const mid = m => (Math.min(...xs(boat(m))) + Math.max(...xs(boat(m)))) / 2;
  for (const p of [.04, .1, .15]) assert.ok(boat(at(1 + p)) && Math.abs(mid(at(1 + p)) - mid(at(.15))) < .5, `${p}: a new boat in the next loop, where the last one was`);
  assert.ok(ticks(at(1.25)).length === 1, 'with a ticked block');
  assert.equal(JSON.stringify(boat(at(.3))), JSON.stringify(boat(at(1.3))), 'the same loop again');
  assert.match(loopOf('ship'), /const CY = 3200/, 'about 3 seconds');
});

test('0172 AC3: the block is the laptop loop\'s finished block, the tick is the panel\'s green, the boat is paper and ink', () => {
  const B = loadBadge(), js = loopOf('ship');
  assert.match(js, /\bbox\(g, /, 'the same block');
  assert.match(js, /\btick\(g, /, 'the same tick, in C.ok');
  assert.match(script(), /ok: v\('ok'\)/, 'the panel\'s green');
  const m = shipFrame(B, .3 * CY), hull = boat(m);
  assert.ok(m.some(k => k.op === 'stroke' && k.colour === 'ink' && k.path === hull), 'the boat is outlined in ink');
  assert.ok(ticks(m).every(k => k.colour === 'ok'));
});

// Whether (x, y), with a margin of m, is inside the tile's rounded edge (the clip): 1 to 55, with corners of radius 12.
function inside(x, y, m) {
  if (x < 1 + m || x > 55 - m || y < 1 + m || y > 55 - m) return false;
  const cx = Math.min(Math.max(x, 13), 43), cy = Math.min(Math.max(y, 13), 43);
  return Math.hypot(x - cx, y - cy) <= Math.max(12 - m, 0);
}
test('0172 AC3: nothing reaches the tile\'s edge except the boat and block as they leave on the right', () => {
  const B = loadBadge();
  for (let t = 0; t < 2 * CY; t += 23) {
    const m = shipFrame(B, t), p = (t % CY) / CY, hull = boat(m), from = hull && p >= .42 ? Math.min(...xs(hull)) - 1 : Infinity;
    for (const k of m) {
      if (k.path.every(q => q.x >= from)) continue; // the boat, its block and the tick, once pushed off
      for (const q of k.path) {
        const r = q.kind === 'arc' ? q.r : q.kind === 'ellipse' ? Math.max(q.rx, q.ry) : 0;
        assert.ok(inside(q.x, q.y, r + .7), `${t}: a ${k.colour} ${k.op} at (${q.x.toFixed(1)}, ${q.y.toFixed(1)}) reaches the edge`);
      }
    }
  }
});

// How many pixels the ship pose draws outside the tile's rounded edge over two loops, in a real browser on a blank page:
// at any point before the boat is pushed off, and on the tile's left half at any point.
const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
test('0172 AC3: in a real browser, nothing but the leaving boat and block is clipped by the tile\'s edge', skip, async () => {
  const src = page().match(/const BADGE = \(\(\) => \{[\s\S]*?\n\}\)\(\);/)[0];
  const b = await browserPage('about:blank');
  try {
    const out = await b.js(`(() => {
      ${src}
      Object.assign(BADGE.C, { ink: '#222', paper: '#fff', speck: '#c33', line: '#ccc', wait: '#a6c', bad: '#c00', tile: '#eee', ok: '#2a2', code: '#222' });
      const c = document.createElement('canvas'); c.width = c.height = 224; const g = c.getContext('2d'), out = { before: 0, left: 0 };
      const edge = new Path2D(); edge.roundRect(56 - 1.4, 56 - 1.4, 112 + 2.8, 112 + 2.8, 25.4); // the tile's edge and its line, at twice the size
      for (let t = 0; t < ${2 * CY}; t += 23) {
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 224, 224); g.setTransform(2, 0, 0, 2, 56, 56);
        BADGE.draw(g, 'ship', t, false);
        g.setTransform(1, 0, 0, 1, 0, 0);
        const d = g.getImageData(0, 0, 224, 224).data, pushed = (t % ${CY}) / ${CY} >= .42;
        for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 24) {
          const x = (i / 4) % 224 + .5, y = Math.floor(i / 4 / 224) + .5;
          if (!g.isPointInPath(edge, x, y)) { if (!pushed) out.before++; else if (x < 112) out.left++; }
        }
      }
      return out;
    })()`, 60000);
    assert.deepEqual(out, { before: 0, left: 0 });
  } finally { await b.close(); }
});

test('0172 AC4: with reduced motion, a still frame of the builder with both hands on the boat carrying the ticked block', () => {
  const B = loadBadge(), t = B.STILL_AT.ship;
  assert.ok(Number.isFinite(t), 'the ship pose has a still frame');
  const m = shipFrame(B, t);
  assert.ok(handsOnBoat(m).length >= 2, 'both hands on the boat');
  assert.ok(block(m), 'the block on it');
  const tk = ticks(m);
  assert.equal(tk.length, 1, 'with its tick');
  assert.ok(tk[0].dash[0] >= 19.2, 'drawn in full');
  assert.ok(t % 3700 >= 120, 'not mid-blink');
  assert.ok(eye(m), 'the builder is there');
});
