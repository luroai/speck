import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T } from './support/panel.mjs';
import { building, board, speckPage } from './support/screen-speck.mjs';

// ---------- 0512: speck mostly sits and watches, with a beat now and then ----------

const ids = n => Array.from({ length: n }, (_, i) => String(362 + i).padStart(4, '0'));
// speck's watch pose with `n` builds, at the rhythm it has now, and its parts.
async function watching(n = 1) {
  const p = speckPage([board(ids(n).map(id => T(id, 'building')), { word: `Building ${n}`, building: ids(n) })]);
  await p.settle();
  p.draw(1000, false);
  const pose = p.cast().poses.watch;
  pose.parts.setRhythm(); // a fresh plan, as when speck first watches
  return { p, pose, parts: pose.parts };
}
// Every beat from the pose's start up to `until`, in order.
function beats(pose, parts, until) {
  pose(0);
  const seen = [];
  for (let t = 0; t < until; t += 200) { const b = parts.beatAt(t); if (b.i === seen.length) seen.push(b); }
  return seen;
}
const tvLookX = m => Math.max(-1, Math.min(1, (m.cx - 14) / 55));
// The TVs whose bar has just filled at t.
const justDone = (parts, n, t) => Array.from({ length: n }, (_, j) => j).filter(j => { const st = parts.tvState(j, t); return st.done && st.since < 500; });

test('0512 AC1: between one beat and the next, a quiet spell of plain watching, 15 to 35 seconds; beats keep their own lengths', async () => {
  const { pose, parts } = await watching(2);
  const seen = beats(pose, parts, 6000000);
  assert.equal(seen[0].kind, 'scan', 'it still starts by keeping an eye on the builds');
  for (let i = 1; i < seen.length; i++) assert.equal(seen[i].kind === 'watch', i % 2 === 1, `beat ${i} (${seen[i].kind}): a quiet spell after each beat, and only there`);
  const quiet = seen.filter(b => b.kind === 'watch').map(b => b.d);
  for (const d of quiet) assert.ok(d >= 15000 && d <= 35000, `a quiet spell lasts ${d} ms`);
  assert.ok(Math.min(...quiet) < 18000 && Math.max(...quiet) > 32000, 'picked at random across the range');
  for (const b of seen.slice(1).filter(b => b.kind !== 'watch')) assert.ok(b.d >= parts.BEATS[b.kind].d[0] && b.d <= parts.BEATS[b.kind].d[1], `${b.kind} lasts ${b.d} ms`);
});

test('0512 AC1: in a quiet spell it breathes and watches one TV at a time, moving on about every 6 seconds', async () => {
  const { pose, parts } = await watching(2); // two, as with three the two furthest TVs are both as far left as its eye goes
  const ms = parts.tvs();
  let frames = 0, moves = 0, was = null;
  const breath = new Set();
  pose(0);
  for (let t = 0; t < 400000; t += 100) {
    const b = parts.beatAt(t), F = pose(t);
    if (b.kind !== 'watch') { was = null; continue; }
    if (b.k * b.d < 500 || (1 - b.k) * b.d < 500 || justDone(parts, 2, t).length) { was = null; continue; } // blending, or a bar filling
    frames++;
    assert.ok(Math.abs(F.B.x - 14) < 1e-9 && Math.abs(F.B.rot) < 1e-9 && Math.abs(F.B.y) < 1e-9, `plain watching at ${t}`);
    assert.equal(F.B.eye, 'open');
    assert.equal(F.props.filter(p => !/^tv\d$/.test(p.key) && p.key !== 'clip').length, 0, `nothing else going on at ${t}`);
    const on = ms.findIndex(m => Math.abs(F.B.lookX - tvLookX(m)) < 1e-9);
    assert.equal(on, Math.floor(t / 6000) % 2, `it watches one TV at a time, for 6 seconds each, at ${t}`);
    if (was !== null && on !== was) moves++;
    was = on;
    breath.add(F.B.sy.toFixed(3));
  }
  assert.ok(frames > 1000 && moves > 10, `${frames} quiet frames, moving on ${moves} times`);
  assert.ok(breath.size > 5, 'it breathes');
});

test('0512 AC2: a comic moment or TV trick at most once every 2 minutes, and no beat again until 5 others have played', async () => {
  const { pose, parts } = await watching(2);
  assert.deepEqual([...parts.COMICS].sort(), ['balance', 'bubble', 'dance', 'drumroll', 'mirror', 'peek', 'pong', 'spider', 'tune', 'vhold']);
  const seen = beats(pose, parts, 20000000).filter(b => b.kind !== 'watch');
  const comic = seen.filter(b => parts.COMICS.includes(b.kind));
  for (let i = 1; i < comic.length; i++) assert.ok(comic[i].s - comic[i - 1].s >= 120000, `${comic[i - 1].kind} then ${comic[i].kind} ${comic[i].s - comic[i - 1].s} ms apart`);
  for (let i = 1; i < seen.length; i++) assert.ok(!seen.slice(Math.max(0, i - 5), i).some(b => b.kind === seen[i].kind), `beat ${i}, ${seen[i].kind}, isn't one of the 5 before it`);
  for (const k of parts.COMICS) assert.ok(comic.some(b => b.kind === k), `${k} still comes now and then`);
  assert.ok(comic.length < seen.length / 3, `the other beats fill the rest: ${comic.length} comic of ${seen.length}`);
  const gaps = comic.slice(1).map((b, i) => b.s - comic[i].s);
  assert.ok(Math.min(...gaps) < 200000, 'one comes soon after two minutes are up');
});

test('0512 AC2: across speck\'s pastimes too, no beat again until 5 others have played, and comic ones 2 minutes of watching apart', async () => {
  const { p, parts } = await watching(2), cast = p.cast(), PASTIME = Object.keys(cast.poses).find(k => k !== 'watch' && k !== cast.cur);
  assert.equal(cast.cur, 'watch');
  const seen = [];
  let now = 1e6, watched = 0;
  cast.set(PASTIME, now - 60000); // so each spell of watching starts its own clock
  for (let cycle = 0; cycle < 40; cycle++) {
    cast.set('watch', now);
    const from = now;
    // the beats the watch pose plays, as the cast draws it: while watching, and while it fades into the pastime
    const note = () => {
      const b = parts.beatAt(now - from + 200);
      if (!seen.length || seen.at(-1).cycle !== cycle || seen.at(-1).i !== b.i) seen.push({ cycle, i: b.i, kind: b.kind, at: watched + b.s - 200 });
    };
    for (; now - from < 120000; now += 200) { cast.frame(now); note(); }
    cast.set(PASTIME, now);
    for (const end = now + 60000, off = now; now < end; now += 100) { cast.frame(now); if (now - off < cast.D) note(); }
    watched += 120000 + cast.D;
  }
  assert.ok(new Set(seen.map(b => b.cycle)).size === 40, 'speck came back to watching each time');
  assert.ok(seen.filter(b => b.cycle > 0 && b.i === 0).every(b => b.kind === 'watch'), 'back from a pastime, it starts with a quiet spell');
  const played = seen.filter(b => b.kind !== 'watch');
  for (let i = 1; i < played.length; i++) assert.ok(!played.slice(Math.max(0, i - 5), i).some(b => b.kind === played[i].kind), `beat ${i}, ${played[i].kind}, isn't one of the 5 before it, across pastimes`);
  const comic = played.filter(b => parts.COMICS.includes(b.kind));
  for (let i = 1; i < comic.length; i++) assert.ok(comic[i].at - comic[i - 1].at >= 120000, `${comic[i - 1].kind} then ${comic[i].kind} ${comic[i].at - comic[i - 1].at} ms of watching apart`);
  assert.ok(comic.length > 5, `${comic.length} comic moments seen`);
});

test('0512 AC3: each TV\'s bar takes 20 to 40 seconds to fill', async () => {
  const { parts } = await watching(3);
  const periods = [0, 1, 2].map(j => {
    const ends = [];
    let was = parts.tvState(j, 0).done;
    for (let t = 0; t < 130000; t += 10) { const st = parts.tvState(j, t); if (st.done && !was) ends.push(t); was = st.done; }
    return ends[1] - ends[0];
  });
  for (const P of periods) assert.ok(P >= 20000 && P <= 40000, `a bar takes ${P} ms`);
  for (let j = 0; j < 20; j++) { const P = parts.period(j); assert.ok(P >= 20000 && P <= 40000, `TV ${j}'s bar takes ${P} ms`); }
});

test('0512 AC3: when a bar fills, speck looks at that TV, and hops only if it hasn\'t hopped in the last 30 seconds', async () => {
  const { pose, parts } = await watching(3);
  const ms = parts.tvs(), hops = [];
  let looks = 0, still = 0, lastHop = -Infinity;
  pose(0);
  for (let t = 0; t < 1200000; t += 50) {
    const b = parts.beatAt(t), F = pose(t);
    const just = justDone(parts, 3, t), fresh = just.filter(j => { const s = parts.tvState(j, t).since; return s > 150 && s < 350; });
    if (just.length !== 1 || fresh.length !== 1 || parts.BEATS[b.kind]?.own) continue;
    const f = t - parts.tvState(fresh[0], t).since;
    assert.ok(Math.abs(F.B.lookX - tvLookX(ms[fresh[0]])) < 1e-9, `it looks at that TV at ${t}`);
    looks++;
    if (F.hop !== null) {
      assert.equal(F.hop, fresh[0], `a hop at that TV at ${t}`);
      if (b.kind === 'watch') { assert.ok(F.B.y < -1, `a hop at ${t}`); assert.equal(F.B.eye, 'wide'); }
      if (hops.at(-1) !== f) { assert.ok(f - lastHop >= 30000, `a hop ${f - lastHop} ms after the last`); hops.push(f); lastHop = f; }
    } else {
      if (b.kind === 'watch') assert.ok(Math.abs(F.B.y) < 1e-9 && F.B.eye !== 'wide', `no hop at ${t}`);
      if (f - lastHop < 30000) still++;
    }
  }
  assert.ok(hops.length > 5 && still > 5 && looks > 20, `${hops.length} hops and ${still} bars filling without a hop, of ${looks}`);
});

test('0512 AC3: a bar filling more than 30 seconds after the last hop, in a quiet spell, makes speck hop', async () => {
  const { pose, parts } = await watching(1);
  let checked = 0, lastHop = -Infinity;
  pose(0);
  for (let t = 0; t < 1200000; t += 50) {
    const b = parts.beatAt(t), F = pose(t), st = parts.tvState(0, t);
    if (F.hop !== null) lastHop = t - st.since;
    if (b.kind !== 'watch' || !st.done || st.since < 150 || st.since > 350) continue;
    const f = t - st.since;
    if (f - lastHop < 30000 && f !== lastHop) continue;
    if (b.s > f) continue; // the bar filled in this quiet spell (asking beatAt about an earlier time would start the plan again)
    assert.equal(F.hop, 0, `a hop at ${t}`);
    assert.equal(F.B.eye, 'wide');
    checked++;
  }
  assert.ok(checked > 5, `${checked} hops in quiet spells checked`);
});

test('0512 AC4: with reduced motion, still one still frame', async () => {
  const p = speckPage([board(building(), { word: 'Building 2' })], { reduced: true });
  await p.settle();
  const scene = dots => dots.filter(([, r]) => r > 11 && r < 63).map(d => d.join()).sort();
  const a = scene(p.draw(1000, false));
  for (const t of [9876, 54321, 300000]) assert.deepEqual(a, scene(p.draw(t, false)), `still at ${t}`);
});
