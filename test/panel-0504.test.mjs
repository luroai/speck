import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T } from './support/panel.mjs';
import { board, speckPage } from './support/screen-speck.mjs';
import { LCD } from './support/screen.mjs';

// ---------- 0504: speck's four comic moments while it watches ----------

const NEW = ['bubble', 'spider', 'balance', 'dance'];
const ids = n => Array.from({ length: n }, (_, i) => String(362 + i).padStart(4, '0'));
// speck's watch pose with `n` builds, and its parts.
async function watching(n = 1, o = {}) {
  const p = speckPage([board(ids(n).map(id => T(id, 'building')), { word: `Building ${n}`, building: ids(n) })], o);
  await p.settle();
  p.draw(1000, false);
  const pose = p.cast().poses.watch;
  return { p, pose, parts: pose.parts };
}
// Frames from the pose's start, every `step` ms, always forwards (going back starts a fresh plan), with their beat.
function sample(pose, parts, until, step, fn) { pose(0); for (let t = 0; t < until; t += step) fn(pose(t), parts.beatAt(t), t); }
const armLen = a => { const q = a.pts || [a.s, a.h]; let L = 0; for (let i = 1; i < q.length; i++) L += Math.hypot(q[i].x - q[i - 1].x, q[i].y - q[i - 1].y); return L; };
// The lit dots of a frame's props with the given keys, or of speck itself (`body`), on the panel's 160 × 72 screen.
function dotsOf(F, keys, body = false) {
  const buf = { c: 160, r: 72, v: new Uint8Array(160 * 72) }, pen = new LCD.Pen(buf, .75, 80, 60);
  LCD.render(pen, { B: body ? F.B : { ...F.B, x: 1e4 }, props: F.props.filter(p => keys.includes(p.key)) });
  const out = [];
  buf.v.forEach((v, n) => { if (v) out.push([n % 160, Math.floor(n / 160)]); });
  return out;
}
const extras = F => F.props.filter(p => !/^tv\d$/.test(p.key) && p.key !== 'clip');
const tvKeys = F => F.props.filter(p => /^tv\d$/.test(p.key)).map(p => p.key);

test('0504 AC2: the four comic moments are picked at random with the other beats, by weight, never the same twice running', async () => {
  const { pose, parts } = await watching(2);
  for (const k of NEW) assert.equal(parts.BEATS[k].w, 1, `${k} has weight 1`);
  pose(0);
  const seen = [];
  for (let t = 0; t < 12000000; t += 200) { const b = parts.beatAt(t); if (b.i === seen.length) seen.push(b); }
  for (let i = 1; i < seen.length; i++) assert.notEqual(seen[i].kind, seen[i - 1].kind, `beat ${i} isn't the one before`);
  for (const b of seen) assert.ok(b.d >= parts.BEATS[b.kind].d[0] && b.d <= parts.BEATS[b.kind].d[1], `${b.kind} lasts ${b.d} ms`);
  const n = k => seen.filter(b => b.kind === k).length, ones = Object.keys(parts.BEATS).filter(k => parts.BEATS[k].w === 1);
  const one = ones.reduce((s, k) => s + n(k), 0) / ones.length;
  for (const k of NEW) assert.ok(n(k) > one * .6 && n(k) < one * 1.5, `${k} comes up as often as the other weight-1 beats: ${n(k)} to ${one}`);
  assert.ok(n('scan') > n('bubble') * 2, 'keeping an eye on the builds, at weight 3, is still the likeliest');
});

test('0504 AC2: each comic moment blends in and out of the resting pose', async () => {
  const { pose, parts } = await watching(3);
  const met = new Set();
  sample(pose, parts, 1500000, 10, (F, b, t) => {
    if (!NEW.includes(b.kind) || (b.k * b.d > 15 && (1 - b.k) * b.d > 15)) return; // only at a moment's very start or end
    met.add(b.kind);
    assert.ok(Math.abs(F.B.x - 14) < .3 && Math.abs(F.B.rot) < .01 && Math.abs(F.B.y) < .3, `${b.kind} at rest at ${t}`);
    assert.ok(Math.abs(F.B.lid - 1) < .01 && Math.abs(F.B.droop) < .05 && Math.abs(F.B.ear) < .05, `${b.kind}: lid, head and ears at rest at ${t}`);
    assert.equal(F.B.eye, 'open', `${b.kind}: its eye at rest at ${t}`);
    assert.equal(F.B.arms.length, 1, `${b.kind}: the clipboard in its hand at ${t}`);
    for (const p of extras(F)) assert.ok((p.a ?? 1) < .05, `${b.kind}: its ${p.key} has faded at ${t}`);
  });
  assert.deepEqual([...met].sort(), [...NEW].sort());
});

test('0504 AC2: no arm reaches beyond its usual length, and the clipboard\'s arm folds away while it is on its head or the floor', async () => {
  let usual = 0;
  for (const p of [...Object.values(LCD.STATES), ...Object.values(LCD.PANEL)]) for (let t = 0; t < 8000; t += 40) for (const a of [...(p(t).B.arms || []), ...(p(t).B.backArms || [])]) usual = Math.max(usual, armLen(a));
  for (const n of [1, 3]) {
    const { pose, parts } = await watching(n), met = new Set();
    let onHead = 0, onFloor = 0;
    sample(pose, parts, 900000, 30, (F, b, t) => {
      if (!NEW.includes(b.kind)) return;
      met.add(b.kind);
      for (const a of F.B.arms) assert.ok(armLen(a) <= usual + 1e-9, `${b.kind} at ${t}: an arm ${armLen(a).toFixed(1)} long, more than ${usual.toFixed(1)}`);
      if (b.kind !== 'balance') return assert.equal(F.B.arms.length, 1, `${b.kind}: the clipboard stays in its hand at ${t}`);
      const clip = dotsOf(F, ['clip']), me = dotsOf(F, [], true), tv = new Set(dotsOf(F, tvKeys(F)).map(d => d.join()));
      assert.equal(clip.filter(d => tv.has(d.join())).length, 0, `${n} builds: the clipboard never lands on a TV, at ${t}`);
      if (b.k > .3 && b.k < .68) { // on its head
        onHead++;
        assert.equal(F.B.arms.length, 0, `on its head, the clipboard's arm is folded away, at ${t}`);
        assert.ok(Math.min(...clip.map(([, r]) => r)) < Math.min(...me.map(([, r]) => r)), `the clipboard sits on top of its head at ${t}`);
      }
      if (b.k > .82 && b.k < .92) { // on the floor
        onFloor++;
        assert.equal(F.B.arms.length, 0, `on the floor, the clipboard's arm is folded away, at ${t}`);
        assert.ok(Math.max(...clip.map(([, r]) => r)) >= 57, `the clipboard is down on the floor at ${t}`);
      }
    });
    assert.deepEqual([...met].sort(), [...NEW].sort(), `${n} builds: every comic moment seen`);
    assert.ok(onHead > 0 && onFloor > 0, `${n} builds: the clipboard seen on its head and on the floor`);
  }
});

test('0504 AC2: after balancing, the clipboard is back in its hand where it started', async () => {
  const { pose, parts } = await watching(2);
  const starts = {};
  let ends = 0;
  sample(pose, parts, 1500000, 5, (F, b) => {
    if (b.kind !== 'balance') return;
    if (b.k * b.d < 5 && !(b.i in starts)) starts[b.i] = dotsOf(F, ['clip']);
    if ((1 - b.k) * b.d < 5 && b.i in starts) { assert.deepEqual(dotsOf(F, ['clip']), starts[b.i], 'the clipboard is drawn just where it was before'); delete starts[b.i]; ends++; }
  });
  assert.ok(ends > 0, 'a balance seen to its end');
});

test('0504 AC3: a step finishing makes speck hop and look, except during the four comic moments', async () => {
  const { pose, parts } = await watching(3);
  for (const k of NEW) assert.ok(parts.BEATS[k].own, `${k} keeps its own reaction`);
  // where a moment has a wide eye of its own: the bubble as it grows big, the spider close up, and noticing you mid-dance
  const ownWide = b => (b.kind === 'bubble' && b.k > .45 && b.k < .68) || (b.kind === 'spider' && b.k > .36 && b.k < .74) || (b.kind === 'dance' && b.k >= .68 && b.k < .86);
  const kept = {};
  sample(pose, parts, 3000000, 50, (F, b, t) => {
    if (!NEW.includes(b.kind) || b.k < .1 || b.k > .9) return;
    const just = [0, 1, 2].filter(j => { const st = parts.tvState(j, t); return st.done && st.since < 500; });
    const fresh = just.filter(j => { const s = parts.tvState(j, t).since; return s > 150 && s < 350; });
    if (just.length !== 1 || fresh.length !== 1) return;
    const m = parts.tvs()[fresh[0]], want = Math.max(-1, Math.min(1, (m.cx - 14) / 55));
    if (!ownWide(b)) assert.notEqual(F.B.eye, 'wide', `${b.kind}: no hop at ${t}`);
    assert.ok(Math.abs(F.B.lookX - want) > 1e-9 || b.kind === 'dance', `${b.kind}: it doesn't turn to look at that TV, at ${t}`);
    kept[b.kind] = (kept[b.kind] || 0) + 1;
  });
  assert.deepEqual(Object.keys(kept).sort(), [...NEW].sort(), 'a tick seen during each of them');
});

test('0504 AC3: with reduced motion, speck holds 0502\'s still frame, with none of the comic moments', async () => {
  const { p } = await watching(3, { reduced: true });
  const scene = dots => dots.filter(([, r]) => r > 11 && r < 63).map(d => d.join()).sort();
  const a = scene(p.draw(1000, false)), F = p.cast().poses.watch(1000);
  assert.equal(F.beat, 'scan');
  assert.equal(extras(F).length, 0);
  assert.equal(F.B.arms.length, 1);
  assert.deepEqual(scene(p.draw(123456, false)), a, 'still');
});
