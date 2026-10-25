import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T } from './support/panel.mjs';
import { building, board, speckPage, shows } from './support/screen-speck.mjs';
import { LCD } from './support/screen.mjs';

// ---------- 0502: speck watches a little retro TV for each build ----------

const ids = n => Array.from({ length: n }, (_, i) => String(362 + i).padStart(4, '0'));
// speck's watch pose with the Foreman's word, and its parts.
async function watching(word = 'Building 1', o = {}) {
  const n = Number((/^Building (\d+)$/.exec(word) || [])[1] || 1);
  const f = /^Shipping/.test(word) ? { word, ship: { running: '0362', waiting: [] } } : { word, building: ids(n) };
  const p = speckPage([board(ids(Math.min(n, 9)).map(id => T(id, 'building')), f)], o);
  await p.settle();
  p.draw(1000, false);
  const pose = p.cast().poses.watch;
  return { p, pose, parts: pose.parts };
}
// The lit dots of a frame's props with the given keys, or of speck itself (`body`), on the panel's 160 × 72 screen.
function dotsOf(F, keys, body = false) {
  const buf = { c: 160, r: 72, v: new Uint8Array(160 * 72) }, pen = new LCD.Pen(buf, .75, 80, 60);
  LCD.render(pen, { B: body ? F.B : { ...F.B, x: 1e4 }, props: F.props.filter(p => keys.includes(p.key)) });
  const out = [];
  buf.v.forEach((v, n) => { if (v) out.push([n % 160, Math.floor(n / 160)]); });
  return out;
}
const tvKeys = F => [...F.props].filter(p => /^tv\d$/.test(p.key)).map(p => p.key);
const armLen = a => { const q = a.pts || [a.s, a.h]; let L = 0; for (let i = 1; i < q.length; i++) L += Math.hypot(q[i].x - q[i - 1].x, q[i].y - q[i - 1].y); return L; };
// A run of beats from the pose's start, sampled every `step` ms.
function sample(pose, until, step, fn) { pose(0); for (let t = 0; t < until; t += step) fn(pose(t), t); }

test('0502 AC1: a TV for each build, up to three, and one while shipping', async () => {
  for (const [word, n] of [['Building 1', 1], ['Building 2', 2], ['Building 3', 3], ['Building 7', 3], ['Shipping 0362', 1]]) {
    const { pose } = await watching(word);
    assert.deepEqual(tvKeys(pose(2000)), Array.from({ length: n }, (_, j) => `tv${j}`), word);
  }
});

test('0502 AC1: the TVs stand on the floor to speck\'s left, on the screen, never over speck', async () => {
  for (const word of ['Building 1', 'Building 2', 'Building 3']) {
    const { pose, parts } = await watching(word);
    sample(pose, 30000, 500, F => {
      const tv = dotsOf(F, tvKeys(F)), me = dotsOf(F, ['clip'], true);
      const mine = new Set(me.map(d => d.join())), tvMid = (Math.min(...tv.map(([c]) => c)) + Math.max(...tv.map(([c]) => c))) / 2;
      assert.ok(tvMid < Math.min(...me.map(([c]) => c)), `${word}: the TVs are left of speck`);
      assert.equal(tv.filter(d => mine.has(d.join())).length, 0, `${word}: no TV dot is one of speck's`);
      for (const [c, r] of tv) assert.ok(c >= 1 && r > 11 && r <= 60, `${word}: a TV dot at ${c},${r} is on the screen, above the floor`);
    });
    for (const m of parts.tvs()) {
      const g = parts.tvGeom(m);
      assert.ok(g.tipL.y < g.y0 && g.tipR.y < g.y0 && g.tipL.x < g.top.x && g.tipR.x > g.top.x, 'two rabbit ears on top');
      assert.ok(g.sx1 < g.x0 + m.w - 5, 'the screen leaves room for the dials and grille on the right');
      assert.equal(g.y1, -3.5, 'it stands on short legs');
    }
  }
});

test('0502 AC2: each TV\'s bar fills at its own pace, 10 to 18 seconds, then a tick shows for about a second', async () => {
  const { parts } = await watching('Building 3');
  const periods = [0, 1, 2].map(j => {
    const ends = [];
    let was = parts.tvState(j, 0).done, doneFor = 0, from = null;
    for (let t = 0; t < 80000; t += 10) {
      const st = parts.tvState(j, t);
      if (st.done && !was) { ends.push(t); from = t; }
      if (!st.done && was && from !== null) doneFor = t - from;
      if (!st.done) assert.ok(st.prog >= 0 && st.prog <= 1);
      was = st.done;
    }
    assert.ok(doneFor >= 900 && doneFor <= 1300, `TV ${j}: the tick shows for ${doneFor} ms`);
    return ends[1] - ends[0];
  });
  for (const P of periods) assert.ok(P >= 10000 && P <= 18000, `a bar takes ${P} ms`);
  assert.equal(new Set(periods.map(Math.round)).size, 3, 'each at its own pace');
});

test('0502 AC2: the screen shows the log and its bar, then the tick, drawn in', async () => {
  const { pose, parts } = await watching('Building 1');
  // 0505: a tick the TV's own, not one where a trick of its own shows something else on it; frames always forwards
  const TRICKS = ['tune', 'mirror', 'pong', 'vhold', 'peek', 'drumroll'];
  pose(0);
  for (let t = 5000, seen = 0; seen < 3; t += 10) {
    if (!parts.tvState(0, t).done || parts.tvState(0, t - 10).done) continue;
    const at = [t - 3000, t - 2000, t + 60, t + 500], f = [];
    for (const x of at) { if (TRICKS.includes(parts.beatAt(x).kind)) break; f.push(dotsOf(pose(x), ['tv0'])); }
    t += 600;
    if (f.length < at.length) continue;
    const [log, later, early, drawn] = f;
    assert.notDeepEqual(log, later, 'the log moves');
    assert.ok(drawn.length > early.length, 'the tick draws in');
    assert.notDeepEqual(drawn, log, 'a tick instead of the log');
    seen++;
  }
});

test('0502 AC2: when a bar fills, speck hops and looks at that TV, except while ticking off its checklist', async () => {
  const { pose, parts } = await watching('Building 3');
  let hops = 0, reads = 0;
  pose(0);
  for (let t = 0; t < 600000; t += 50) { // 0504: ten minutes, so a read with a tick is seen however rare the extra beats make it
    const F = pose(t), b = parts.beatAt(t);
    const just = [0, 1, 2].filter(j => { const st = parts.tvState(j, t); return st.done && st.since < 500; });
    const fresh = just.filter(j => parts.tvState(j, t).since > 150 && parts.tvState(j, t).since < 350);
    if (just.length !== 1 || fresh.length !== 1) continue;
    const m = parts.tvs()[fresh[0]], want = Math.max(-1, Math.min(1, (m.cx - 14) / 55));
    if (b.kind === 'read') { reads++; assert.notEqual(F.B.eye, 'wide', 'reading has its own reaction'); continue; }
    if (parts.BEATS[b.kind].own) continue; // 0503: nodding off, sneezing and hiccupping have their own reactions too
    hops++;
    assert.ok(F.B.y < -1, `a hop at ${t}`);
    assert.equal(F.B.eye, 'wide');
    assert.ok(Math.abs(F.B.lookX - want) < 1e-9, 'it looks at that TV');
  }
  assert.ok(hops > 3 && reads > 0, `${hops} hops and ${reads} ticks while reading seen`);
});

test('0502 AC3: one beat after another, 3.5 to 7 seconds each, by weight, never the same twice running', async () => {
  const { pose, parts } = await watching('Building 2');
  pose(0);
  const seen = [];
  for (let t = 0; t < 12000000; t += 200) { const b = parts.beatAt(t); if (b.i === seen.length) seen.push(b); } // 0505: longer, as more beats make each rarer
  assert.equal(seen[0].kind, 'scan', 'it starts by keeping an eye on the builds');
  for (const k of ['lean', 'read', 'scan']) assert.ok(seen.some(b => b.kind === k), `${k} is one of them`); // 0503 adds more
  for (let i = 1; i < seen.length; i++) assert.notEqual(seen[i].kind, seen[i - 1].kind, `beat ${i} isn't the one before`);
  for (const b of seen) assert.ok(b.d >= 3500 && b.d <= 7000, `${b.kind} lasts ${b.d} ms`);
  const n = k => seen.filter(b => b.kind === k).length;
  assert.ok(n('scan') > n('lean') && n('scan') > n('read'), `keeping an eye on the builds is the likeliest: ${n('scan')}, ${n('read')}, ${n('lean')}`);
});

test('0502 AC3: each beat blends in and out of the resting pose, which watches one TV at a time', async () => {
  const { pose, parts } = await watching('Building 3');
  pose(0);
  const looks = new Set();
  for (let t = 0; t < 60000; t += 20) {
    const b = parts.beatAt(t), F = pose(t);
    if (b.k * b.d > 20 && (1 - b.k) * b.d > 20) continue; // only at a beat's very start or end
    if (F.B.eye === 'wide') continue; // a hop
    assert.ok(Math.abs(F.B.x - 14) < .3 && Math.abs(F.B.rot) < .01, `at rest at ${t}`);
    looks.add(Math.round(F.B.lookX * 100));
  }
  const tvLooks = new Set(parts.tvs().map(m => Math.round(Math.max(-1, (m.cx - 14) / 55) * 100)));
  for (const l of looks) assert.ok([...tvLooks].some(v => Math.abs(v - l) <= 1), `at rest it looks at a TV (${l})`);
  assert.ok(looks.size > 1, 'and moves on from one to the next');
});

test('0502 AC3: the checklist\'s ticks add up to four, then a fresh page', async () => {
  const { pose, parts } = await watching('Building 1');
  pose(0);
  const after = [];
  let last = -1;
  for (let t = 0; t < 2400000; t += 100) { // 0505: longer, so ten reads are seen however many beats there are
    const b = parts.beatAt(t);
    if (b.kind === 'read' && b.k > .9 && b.i !== last) { last = b.i; after.push(pose(t).ticks); }
  }
  assert.deepEqual(after.slice(0, 10), [1, 2, 3, 4, 0, 1, 2, 3, 4, 0]);
});

test('0502 AC4: no arm reaches beyond the longest arm in speck\'s other poses', async () => {
  let usual = 0;
  for (const p of [...Object.values(LCD.STATES), ...Object.values(LCD.PANEL)]) for (let t = 0; t < 8000; t += 40) for (const a of [...(p(t).B.arms || []), ...(p(t).B.backArms || [])]) usual = Math.max(usual, armLen(a));
  for (const word of ['Building 1', 'Building 3']) {
    const { pose } = await watching(word);
    sample(pose, 200000, 40, (F, t) => { for (const a of F.B.arms) assert.ok(armLen(a) <= usual + 1e-9, `${F.beat} at ${t}: an arm ${armLen(a).toFixed(1)} long, more than ${usual.toFixed(1)}`); });
  }
});

test('0502 AC4: with reduced motion, one still frame of speck watching beside the TVs', async () => {
  const p = speckPage([board(building(), { word: 'Building 2' })], { reduced: true });
  await p.settle();
  const scene = dots => dots.filter(([, r]) => r > 11 && r < 63).map(d => d.join()).sort();
  const a = scene(p.draw(1000, false));
  assert.deepEqual(a, scene(p.draw(9876, false)), 'still');
  assert.deepEqual(a, scene(p.draw(54321, false)), 'still');
  const F = p.cast().poses.watch(1000);
  assert.equal(F.beat, 'scan');
  assert.deepEqual(tvKeys(F), ['tv0', 'tv1']);
  assert.ok(a.some(d => Number(d.split(',')[0]) < 50), 'the TVs are on it');
  shows(p, 'watch', 'WATCHING 0362 AND 0363', 1000, false);
});
