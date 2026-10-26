import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T } from './support/panel.mjs';
import { board, speckPage } from './support/screen-speck.mjs';
import { LCD } from './support/screen.mjs';
import { BEFORE_0512 } from './support/watch-rhythm.mjs';

// ---------- 0505: the tricks speck's TVs play while it watches ----------

const NEW = ['tune', 'mirror', 'pong', 'vhold', 'peek', 'drumroll'];
const ids = n => Array.from({ length: n }, (_, i) => String(362 + i).padStart(4, '0'));
// speck's watch pose with `n` builds, and its parts.
async function watching(n = 1, o = {}) {
  const p = speckPage([board(ids(n).map(id => T(id, 'building')), { word: `Building ${n}`, building: ids(n) })], o);
  await p.settle();
  p.draw(1000, false);
  const pose = p.cast().poses.watch;
  pose.parts.setRhythm(BEFORE_0512); // 0512: these tests check what each beat does, at the rhythm they were written for
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
// The same, on a screen with room round the panel's, without its clip, so a dot off the screen still counts.
const PAD = 40;
function looseDots(F) {
  const c = 160 + 2 * PAD, r = 72 + 2 * PAD, buf = { c, r, v: new Uint8Array(c * r) };
  LCD.render(new LCD.Pen(buf, .75, 80 + PAD, 60 + PAD), F);
  const out = [];
  buf.v.forEach((v, n) => { if (v) out.push([n % c - PAD, Math.floor(n / c) - PAD]); });
  return out;
}
const extras = F => F.props.filter(p => !/^tv\d$/.test(p.key) && p.key !== 'clip');
const tvKeys = F => F.props.filter(p => /^tv\d$/.test(p.key)).map(p => p.key);
const usualArm = () => {
  let usual = 0;
  for (const p of [...Object.values(LCD.STATES), ...Object.values(LCD.PANEL)]) for (let t = 0; t < 8000; t += 40) for (const a of [...(p(t).B.arms || []), ...(p(t).B.backArms || [])]) usual = Math.max(usual, armLen(a));
  return usual;
};
const plain = sc => sc.show === 'log' && sc.wig === 0 && sc.roll === null;

test('0505 AC1: each trick shows on the nearest TV, as the prototype has it', async () => {
  const { pose, parts } = await watching(2);
  const got = {};
  const note = (k, what) => { (got[k] = got[k] || new Set()).add(what); };
  sample(pose, parts, 2400000, 25, (F, b, t) => {
    if (!NEW.includes(b.kind)) return;
    const tv = F.screens[1], k = b.k;
    if (b.kind === 'tune' && k > .3 && k < .6) { assert.equal(tv.show, 'snow', `snow at ${t}`); if (Math.abs(tv.wig) > .1) note('tune', 'aerials'); if (Math.abs(F.B.ear) > 1) note('tune', 'ear'); }
    if (b.kind === 'tune' && k > .66 && k < .74) { assert.equal(tv.show, 'log', 'the picture comes back'); note('tune', 'back'); }
    if (b.kind === 'mirror' && k > .3 && k < .8) { assert.equal(tv.show, 'mirror'); assert.equal(tv.me, F.B, 'the tiny speck copies speck'); note('mirror', 'me'); }
    if (b.kind === 'pong') {
      if (k > .09 && k < .11) { assert.equal(tv.show, 'snow', 'static before Pong'); note('pong', 'before'); }
      if (k > .87 && k < .89) { assert.equal(tv.show, 'snow', 'static after Pong'); note('pong', 'after'); }
      if (k > .3 && k < .7) {
        assert.equal(tv.show, 'pong');
        const ball = parts.pongBall(parts.tvGeom(parts.tvs()[1]), t);
        if (F.B.eye !== 'wide') { const want = Math.max(-1, Math.min(1, (ball.x - 14) / 55)); assert.ok(Math.abs(F.B.lookX - want) < .02, `its eye follows the ball at ${t}`); note('pong', 'ball'); }
      }
    }
    if (b.kind === 'vhold' && k > .2 && k < .7) { assert.ok(tv.roll !== null, 'the picture rolls'); if (F.B.rot < -.05) note('vhold', 'tilt'); }
    if (b.kind === 'vhold' && k > .75 && k < .85) { assert.equal(tv.roll, null, 'and stops'); note('vhold', 'upright'); }
    if (b.kind === 'peek' && k > .2 && k < .3) { assert.equal(F.B.eye, 'flat'); note('peek', 'hidden'); }
    if (b.kind === 'peek' && k > .34 && k < .4) { assert.equal(F.B.eye, 'wide', 'a peek'); note('peek', 'peek'); }
    if (b.kind === 'drumroll' && k > .2 && k < .65) { assert.ok(F.props.some(p => p.key === 'drr'), 'DRRR'); note('drumroll', 'drr'); }
    if (b.kind === 'drumroll' && k > .75 && k < .9) { assert.ok(F.props.some(p => p.key === 'tada'), 'TA-DA'); note('drumroll', 'tada'); }
  });
  assert.deepEqual(Object.fromEntries(Object.entries(got).map(([k, v]) => [k, [...v].sort()])), {
    tune: ['aerials', 'back', 'ear'], mirror: ['me'], pong: ['after', 'ball', 'before'], vhold: ['tilt', 'upright'], peek: ['hidden', 'peek'], drumroll: ['drr', 'tada'] });
});

test('0505 AC1: hidden behind the clipboard, it holds it up in front of its eye', async () => {
  const { pose, parts } = await watching(1);
  let hid = 0;
  sample(pose, parts, 1500000, 40, (F, b) => {
    if (b.kind !== 'peek' || b.k < .2 || b.k > .3) return;
    const clip = dotsOf(F, ['clip']), me = dotsOf(F, [], true), top = Math.min(...me.map(([, r]) => r));
    assert.ok(Math.min(...clip.map(([, r]) => r)) < top + 12, 'the clipboard is up by its face');
    hid++;
  });
  assert.ok(hid > 0, 'seen hiding');
});

test('0505 AC2: in the peek and the drumroll, the nearest TV\'s bar fills and ticks when the beat says, then goes back to its own pace', async () => {
  for (const n of [1, 3]) {
    const { pose, parts } = await watching(n), near = n - 1, met = new Set(), last = {};
    let after = 0;
    sample(pose, parts, 2400000, 20, (F, b, t) => {
      const tv = F.screens[near];
      if (b.kind === 'peek' || b.kind === 'drumroll') {
        met.add(b.kind);
        const at = b.kind === 'peek' ? .76 : .7, k = b.k;
        if (k < at - .01) { assert.equal(tv.st.done, false, `${b.kind}: no tick before the beat says, at ${t}`); assert.ok(tv.st.prog > .8 && tv.st.prog < 1, `${b.kind}: the bar near full at ${t}`); }
        if (k > at + .01) { assert.equal(tv.st.done, true, `${b.kind}: the tick when the beat says, at ${t}`); assert.ok(tv.st.since > 0 && tv.st.since < (1 - at) * b.d + 1); }
        if (k < at && last[b.i] !== undefined) assert.ok(tv.st.prog >= last[b.i], `${b.kind}: the bar keeps filling at ${t}`);
        if (k < at) last[b.i] = tv.st.prog;
      } else {
        const st = parts.tvState(near, t);
        assert.deepEqual(tv.st, st, `${b.kind}: at its own pace at ${t}`);
        after++;
      }
    });
    assert.deepEqual([...met].sort(), ['drumroll', 'peek'], `${n} builds: both seen`);
    assert.ok(after > 0);
  }
});

test('0505 AC2: each trick happens on one TV only, and the others carry on', async () => {
  const { pose, parts } = await watching(3);
  const met = new Set();
  sample(pose, parts, 2400000, 30, (F, b, t) => {
    for (let j = 0; j < 2; j++) {
      assert.ok(plain(F.screens[j]), `${b.kind}: TV ${j} shows its log at ${t}`);
      assert.deepEqual(F.screens[j].st, parts.tvState(j, t), `${b.kind}: TV ${j} at its own pace at ${t}`);
    }
    if (!NEW.includes(b.kind)) return assert.ok(plain(F.screens[2]) && F.screens[2].me === null, `${b.kind}: no trick at ${t}`);
    if (b.k > .3 && b.k < .6) met.add(b.kind);
    if (t % 300) return;
    // and the TVs stay on the floor to its left, never over speck
    const tv = dotsOf(F, tvKeys(F)), mine = new Set(dotsOf(F, ['clip'], true).map(d => d.join()));
    assert.equal(tv.filter(d => mine.has(d.join())).length, 0, `${b.kind}: no TV dot is one of speck's, at ${t}`);
    for (const [c, r] of tv) assert.ok(c >= 1 && r > 11 && r <= 60, `${b.kind}: a TV dot at ${c},${r} is on the screen, above the floor`);
  });
  assert.deepEqual([...met].sort(), [...NEW].sort());
});

test('0505 AC3: the six tricks are picked at random with the other beats, by weight, never the same twice running', async () => {
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
  assert.ok(n('scan') > n('pong') * 2, 'keeping an eye on the builds, at weight 3, is still the likeliest');
});

test('0505 AC3: each trick blends in and out of the resting pose, with no arm beyond its usual length and nothing outside the scene', async () => {
  const usual = usualArm();
  for (const n of [1, 3]) {
    const { pose, parts } = await watching(n), met = new Set();
    sample(pose, parts, 1500000, 10, (F, b, t) => {
      if (!NEW.includes(b.kind)) return;
      met.add(b.kind);
      for (const a of F.B.arms) assert.ok(armLen(a) <= usual + 1e-9, `${b.kind} at ${t}: an arm ${armLen(a).toFixed(1)} long, more than ${usual.toFixed(1)}`);
      assert.equal(F.B.arms.length, 1, `${b.kind}: only the clipboard's hand out at ${t}`);
      if (b.k * b.d < 15 || (1 - b.k) * b.d < 15) { // a trick's very start or end
        assert.ok(Math.abs(F.B.x - 14) < .3 && Math.abs(F.B.rot) < .01 && Math.abs(F.B.y) < .3, `${b.kind} at rest at ${t}`);
        assert.ok(Math.abs(F.B.lid - 1) < .01 && Math.abs(F.B.ear) < .05, `${b.kind}: lid and ears at rest at ${t}`);
        assert.equal(F.B.eye, 'open', `${b.kind}: its eye at rest at ${t}`);
        for (const p of extras(F)) assert.ok((p.a ?? 1) < .05, `${b.kind}: its ${p.key} has faded at ${t}`);
        if (b.kind !== 'peek' && b.kind !== 'drumroll') assert.ok(plain(F.screens[n - 1]), `${b.kind}: the TV shows its log at ${t}`);
      }
      if (t % 90) return;
      for (const [c, r] of looseDots(F)) assert.ok(c >= 0 && c < 160 && r > 11 && r <= 61, `${b.kind} at ${t}: a dot at ${c},${r}, outside the scene`);
    });
    assert.deepEqual([...met].sort(), [...NEW].sort(), `${n} builds: every trick seen`);
  }
});

test('0505 AC3: a step finishing makes speck hop and look, except during the six tricks', async () => {
  const { pose, parts } = await watching(3);
  for (const k of NEW) assert.ok(parts.BEATS[k].own, `${k} keeps its own reaction`);
  // where a trick has a wide eye of its own: the snow coming on, the mirror's jump, and each peek
  const ownWide = b => (b.kind === 'tune' && b.k > .08 && b.k < .22) || (b.kind === 'mirror' && b.k > .64 && b.k < .72) || (b.kind === 'peek' && [.32, .55].some(p => b.k > p && b.k < p + .09));
  const kept = {};
  sample(pose, parts, 3000000, 50, (F, b, t) => {
    if (!NEW.includes(b.kind) || b.k < .1 || b.k > .9) return;
    const just = [0, 1].filter(j => { const st = parts.tvState(j, t); return st.done && st.since > 150 && st.since < 350; });
    if (just.length !== 1) return;
    if (!ownWide(b)) assert.notEqual(F.B.eye, 'wide', `${b.kind}: no hop at ${t}`);
    const look = m => Math.max(-1, Math.min(1, (m.cx - 14) / 55)), want = look(parts.tvs()[just[0]]);
    const resting = look(parts.tvs()[Math.floor(t / 3100) % 3]); // where its eye rests when the trick doesn't move it
    if (Math.abs(resting - want) > 1e-9) assert.ok(Math.abs(F.B.lookX - want) > 1e-9, `${b.kind}: it doesn't turn to look at that TV, at ${t}`);
    kept[b.kind] = (kept[b.kind] || 0) + 1;
  });
  assert.deepEqual(Object.keys(kept).sort(), [...NEW].sort(), 'a tick seen during each of them');
});

test('0505 AC3: with reduced motion, speck holds 0502\'s still frame, with none of the tricks', async () => {
  const { p } = await watching(3, { reduced: true });
  const scene = dots => dots.filter(([, r]) => r > 11 && r < 63).map(d => d.join()).sort();
  const a = scene(p.draw(1000, false)), F = p.cast().poses.watch(1000);
  assert.equal(F.beat, 'scan');
  assert.equal(extras(F).length, 0);
  assert.ok(F.screens.every(plain));
  assert.deepEqual(scene(p.draw(123456, false)), a, 'still');
});
