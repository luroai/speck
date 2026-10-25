import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T } from './support/panel.mjs';
import { board, speckPage } from './support/screen-speck.mjs';
import { LCD } from './support/screen.mjs';

// ---------- 0503: speck's eight small habits while it watches ----------

const NEW = ['popcorn', 'clock', 'yoyo', 'hum', 'mote', 'sneeze', 'doze', 'hiccup'];
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
// A frame's lit dots on a screen with room round the panel's 160 × 72, without the panel's clip, in the panel's own
// columns and rows (so a dot left of the screen has a column below 0).
const PAD = 40;
function looseDots(F) {
  const c = 160 + 2 * PAD, r = 72 + 2 * PAD, buf = { c, r, v: new Uint8Array(c * r) };
  LCD.render(new LCD.Pen(buf, .75, 80 + PAD, 60 + PAD), F);
  const out = [];
  buf.v.forEach((v, n) => { if (v) out.push([n % c - PAD, Math.floor(n / c) - PAD]); });
  return out;
}
const extras = F => F.props.filter(p => !/^tv\d$/.test(p.key) && p.key !== 'clip');

test('0503 AC2: the eight habits are picked at random with 0502\'s beats, by weight, never the same twice running', async () => {
  const { pose, parts } = await watching(2);
  assert.deepEqual(Object.keys(parts.BEATS).filter(k => !['bubble', 'spider', 'balance', 'dance'].includes(k)).sort(), ['lean', 'read', 'scan', ...NEW].sort()); // 0504 adds four more
  pose(0);
  const seen = [];
  for (let t = 0; t < 12000000; t += 200) { const b = parts.beatAt(t); if (b.i === seen.length) seen.push(b); }
  for (let i = 1; i < seen.length; i++) assert.notEqual(seen[i].kind, seen[i - 1].kind, `beat ${i} isn't the one before`);
  const n = k => seen.filter(b => b.kind === k).length;
  for (const k of NEW) assert.ok(n(k) > 0, `${k} is picked`);
  for (const b of seen) assert.ok(b.d >= parts.BEATS[b.kind].d[0] && b.d <= parts.BEATS[b.kind].d[1], `${b.kind} lasts ${b.d} ms`);
  const ones = NEW.filter(k => k !== 'popcorn'), one = ones.reduce((s, k) => s + n(k), 0) / ones.length;
  assert.ok(n('popcorn') > one * 1.5, `popcorn, at weight 2, comes up about twice as often as a weight-1 habit: ${n('popcorn')} to ${one}`);
});

test('0503 AC2: each habit blends in and out of the resting pose', async () => {
  const { pose, parts } = await watching(3);
  const met = new Set();
  sample(pose, parts, 1500000, 10, (F, b, t) => {
    if (!NEW.includes(b.kind) || (b.k * b.d > 15 && (1 - b.k) * b.d > 15)) return; // only at a habit's very start or end
    met.add(b.kind);
    if (F.B.eye === 'wide' && !parts.BEATS[b.kind].own) return; // a hop as a step finishes
    assert.ok(Math.abs(F.B.x - 14) < .3 && Math.abs(F.B.rot) < .01, `${b.kind} at rest at ${t}`);
    assert.ok(Math.abs(F.B.lid - 1) < .01 && Math.abs(F.B.droop) < .05 && Math.abs(F.B.ear) < .05, `${b.kind}: lid, head and ears at rest at ${t}`);
    assert.equal(F.B.arms.length, 1, `${b.kind}: only the clipboard's hand out at ${t}`);
    for (const p of extras(F)) assert.ok((p.a ?? 1) < .05, `${b.kind}: its ${p.key} has faded at ${t}`);
  });
  assert.deepEqual([...met].sort(), [...NEW].sort());
});

test('0503 AC2: no arm reaches beyond its usual length, and nothing a habit draws goes outside the scene', async () => {
  let usual = 0;
  for (const p of [...Object.values(LCD.STATES), ...Object.values(LCD.PANEL)]) for (let t = 0; t < 8000; t += 40) for (const a of [...(p(t).B.arms || []), ...(p(t).B.backArms || [])]) usual = Math.max(usual, armLen(a));
  for (const n of [1, 3]) {
    const { pose, parts } = await watching(n), met = new Set();
    sample(pose, parts, 900000, 30, (F, b, t) => {
      if (!NEW.includes(b.kind)) return;
      met.add(b.kind);
      for (const a of F.B.arms) assert.ok(armLen(a) <= usual + 1e-9, `${b.kind} at ${t}: an arm ${armLen(a).toFixed(1)} long, more than ${usual.toFixed(1)}`);
      if (t % 90) return;
      for (const [c, r] of looseDots(F)) assert.ok(c >= 0 && c < 160 && r > 11 && r <= 61, `${b.kind} at ${t}: a dot at ${c},${r}, outside the scene`);
    });
    assert.deepEqual([...met].sort(), [...NEW].sort(), `${n} builds: every habit seen`);
  }
});

test('0503 AC3: a step finishing makes speck hop and look, except while nodding off, sneezing or hiccupping', async () => {
  const { pose, parts } = await watching(3);
  const comic = ['bubble', 'spider', 'balance', 'dance']; // 0504: its comic moments keep their own reactions too
  assert.deepEqual(Object.keys(parts.BEATS).filter(k => parts.BEATS[k].own && !comic.includes(k)).sort(), ['doze', 'hiccup', 'read', 'sneeze']);
  const hops = {}, kept = {};
  sample(pose, parts, 3000000, 50, (F, b, t) => {
    if (!NEW.includes(b.kind)) return;
    const just = [0, 1, 2].filter(j => { const st = parts.tvState(j, t); return st.done && st.since < 500; });
    const fresh = just.filter(j => { const s = parts.tvState(j, t).since; return s > 150 && s < 350; });
    if (just.length !== 1 || fresh.length !== 1) return;
    if (parts.BEATS[b.kind].own) {
      // its own wide eye only where the habit has one: the jolt awake, and each hiccup
      const ownWide = (b.kind === 'doze' && b.k >= .64 && b.k < .86) || (b.kind === 'hiccup' && [.18, .42, .66].some(h => b.k >= h && b.k < h + .06));
      if (!ownWide) assert.notEqual(F.B.eye, 'wide', `${b.kind} has its own reaction, at ${t}`);
      kept[b.kind] = (kept[b.kind] || 0) + 1;
      return;
    }
    const m = parts.tvs()[fresh[0]], want = Math.max(-1, Math.min(1, (m.cx - 14) / 55));
    assert.ok(F.B.y < -1, `${b.kind}: a hop at ${t}`);
    assert.equal(F.B.eye, 'wide');
    assert.ok(Math.abs(F.B.lookX - want) < 1e-9, `${b.kind}: it looks at that TV`);
    hops[b.kind] = (hops[b.kind] || 0) + 1;
  });
  assert.deepEqual(Object.keys(hops).sort(), ['clock', 'hum', 'mote', 'popcorn', 'yoyo'], 'a hop in each of the others');
  assert.deepEqual(Object.keys(kept).sort(), ['doze', 'hiccup', 'sneeze'], 'and a tick seen during each of these');
});

test('0503 AC3: with reduced motion, speck holds 0502\'s still frame, with none of the habits', async () => {
  const { p } = await watching(2, { reduced: true });
  const scene = dots => dots.filter(([, r]) => r > 11 && r < 63).map(d => d.join()).sort();
  const a = scene(p.draw(1000, false)), F = p.cast().poses.watch(1000);
  assert.equal(F.beat, 'scan');
  assert.equal(extras(F).length, 0);
  assert.deepEqual(scene(p.draw(77777, false)), a, 'still');
});
