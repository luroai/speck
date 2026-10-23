import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T } from './support/panel.mjs';
import { wordDots, expected } from './support/screen.mjs';
import { MIN, building, board, speckPage, capDots, shows } from './support/screen-speck.mjs';

// ---------- 0436: speck passes the time during a long wait ----------

const PASTIMES = ['eating', 'playing', 'messy', 'cleaning']; // tea, chess, messy, sweeping
// Math.random's answers, one after another, then the last again.
const seq = (...a) => { let n = 0; return () => a[Math.min(n++, a.length - 1)]; };
// The pose and caption dots speck shows now.
const now = p => { const dots = p.draw(); return { pose: p.cast().cur, cap: [...capDots(dots)].sort().join(' ') }; };

for (const [word, own, cap] of [['Building 2', 'watch', 'WATCHING 2 BUILDS'], ['Shipping 0362', 'watch', 'WATCHING THE SHIP']]) {
  test(`0436 AC1: "${word}": 2 minutes watching, a 1-minute pastime, 2 minutes watching, and so on`, async () => {
    const p = speckPage([board(building(), { word })], { random: seq(0, 0, 0.5, 0.99) });
    await p.settle();
    shows(p, own, cap);
    p.go(2 * MIN - 1000);
    shows(p, own, cap);
    p.go(1000);
    assert.equal(now(p).pose, 'eating', 'a pastime after 2 minutes');
    p.go(MIN - 1000);
    assert.equal(now(p).pose, 'eating', 'for the whole minute');
    p.go(1000);
    shows(p, own, cap);
    p.go(2 * MIN);
    assert.equal(now(p).pose, 'playing', 'the next pastime: never the one before');
    p.go(MIN);
    shows(p, own, cap);
    p.go(2 * MIN);
    assert.equal(now(p).pose, 'messy', 'random 0.5 of the three left: messy');
  });
}

test('0436 AC1: the pastime is picked at random from tea, chess, sweeping and messy, never the same twice running', async () => {
  for (const r of [0, 0.3, 0.6, 0.9]) {
    const p = speckPage([board(building(), { word: 'Building 2' })], { random: r });
    await p.settle();
    let last = null;
    for (let n = 0; n < 6; n++) {
      p.go(n ? 3 * MIN : 2 * MIN);
      const pose = now(p).pose;
      assert.ok(PASTIMES.includes(pose), `${pose} is a pastime`);
      assert.notEqual(pose, last, 'never the one before');
      last = pose;
    }
  }
});

test('0436 AC1: each pastime has its caption from a fixed set, and the top row keeps the status word', async () => {
  const caps = new Map();
  for (const r of [0, 0.3, 0.6, 0.9]) {
    const p = speckPage([board(building(), { word: 'Building 2' })], { random: r });
    await p.settle();
    const before = wordDots(p.draw());
    assert.deepEqual(before, expected('BUILDING 2', 4, 2), 'the word while watching');
    p.go(2 * MIN + 1000);
    const { pose, cap } = now(p);
    assert.ok(cap.length > 0, 'it has a caption');
    assert.deepEqual(wordDots(p.draw()), before, 'the word while it passes the time');
    if (caps.has(pose)) assert.equal(caps.get(pose), cap, 'the same caption each time');
    caps.set(pose, cap);
    p.go(30000);
    assert.equal(now(p).cap, cap, 'the caption holds through the minute');
  }
  assert.equal(caps.size, 4, 'one for each pastime');
  assert.equal(new Set(caps.values()).size, 4, 'a different caption for each');
});

test('0436 AC2: "Waiting": 2 minutes grumpy, then 1-minute pastimes with 2 minutes grumpy between', async () => {
  const p = speckPage([board(building(), { word: 'Waiting: new code' })], { random: seq(0, 0) });
  await p.settle();
  shows(p, 'grumpy', 'WAITING');
  p.go(2 * MIN - 1000);
  shows(p, 'grumpy', 'WAITING');
  p.go(1000);
  assert.equal(now(p).pose, 'eating');
  p.go(MIN);
  shows(p, 'grumpy', 'WAITING');
  p.go(2 * MIN - 1000);
  shows(p, 'grumpy', 'WAITING');
  p.go(1000);
  assert.equal(now(p).pose, 'playing');
});

test('0436 AC3: Idle changes pastime every 3 minutes, never the same as the one before, and sleeps after 15 minutes', async () => {
  const p = speckPage([board([], { word: 'Idle' }), board([], { word: 'Idle' })], { random: 0 });
  await p.settle();
  const seen = [];
  for (let n = 0; n < 5; n++) {
    const a = now(p);
    p.go(3 * MIN - 1000);
    const b = now(p);
    assert.deepEqual(b, a, 'the same for 3 minutes');
    assert.ok(PASTIMES.includes(a.pose));
    if (seen.length) assert.notEqual(a.pose, seen[seen.length - 1], 'never the one before');
    seen.push(a.pose);
    p.go(1000);
  }
  shows(p, 'sleeping', 'NAPPING');
  p.go(60 * MIN);
  await p.next(); // nothing changed
  shows(p, 'sleeping', 'NAPPING');
});

test('0436 AC3: Idle stays asleep until the word changes', async () => {
  const p = speckPage([board([], { word: 'Idle' }), board(building(), { word: 'Building 2' })], { random: 0 });
  await p.settle();
  p.go(15 * MIN);
  shows(p, 'sleeping', 'NAPPING');
  await p.next();
  shows(p, 'watch', 'WATCHING 2 BUILDS');
});

for (const [word, pose, cap] of [['Needs you 2', 'ask', '2 NEEDS YOU'], ['Off', 'sleeping', 'SPECK RUN IS OFF']]) {
  test(`0436 AC4: "${word}" keeps ${pose} with no pastimes`, async () => {
    const p = speckPage([board(building(), { word })], { random: 0 });
    await p.settle();
    for (let n = 0; n < 40; n++) { shows(p, pose, cap); p.go(30000); }
  });
}

test('0436 AC5: an event interrupts a pastime at once, and after it the rhythm starts again from watching', async () => {
  const p = speckPage([board(building(), { word: 'Building 2' }), board([T('0362', 'done'), T('0363', 'building')], { word: 'Building 2' })], { random: 0 });
  await p.settle();
  p.go(2 * MIN + 10000);
  assert.equal(now(p).pose, 'eating');
  await p.next(); // it ships
  shows(p, 'celebrating', '0362 SHIPPED');
  p.go(6100);
  shows(p, 'watch', 'WATCHING 2 BUILDS');
  p.go(2 * MIN - 2000);
  shows(p, 'watch', 'WATCHING 2 BUILDS', 1000);
  p.go(2000);
  assert.ok(PASTIMES.includes(now(p).pose), 'a pastime 2 minutes after the event');
});

test('0436 AC5: a new status word starts the rhythm again from its own animation', async () => {
  const p = speckPage([board(building(), { word: 'Building 2' }), board(building(), { word: 'Building 1' }), board(building(), { word: 'Waiting' })], { random: 0 });
  await p.settle();
  p.go(2 * MIN + 10000);
  assert.equal(now(p).pose, 'eating');
  await p.next();
  shows(p, 'watch', 'WATCHING 1 BUILD');
  p.go(2 * MIN - 1000);
  shows(p, 'watch', 'WATCHING 1 BUILD');
  await p.next();
  shows(p, 'grumpy', 'WAITING');
  p.go(2 * MIN - 1000);
  shows(p, 'grumpy', 'WAITING');
});

test('0436 AC5: after an event while Idle, the 15 minutes start again', async () => {
  const p = speckPage([board([T('0362', 'approved')], { word: 'Idle' }), board([T('0362', 'done')], { word: 'Idle' })], { random: 0 });
  await p.settle();
  p.go(14 * MIN);
  assert.ok(PASTIMES.includes(now(p).pose));
  await p.next();
  shows(p, 'celebrating', '0362 SHIPPED');
  p.go(6100);
  assert.ok(PASTIMES.includes(now(p).pose), 'back to a pastime');
  p.go(14 * MIN);
  assert.ok(PASTIMES.includes(now(p).pose), 'not asleep 14 minutes after the event');
  p.go(MIN);
  shows(p, 'sleeping', 'NAPPING');
});

test('0436: every pastime\'s caption fits on the screen', async () => {
  for (const r of [0, 0.3, 0.6, 0.9]) {
    const p = speckPage([board(building(), { word: 'Building 2' })], { random: r });
    await p.settle();
    p.go(2 * MIN + 1000);
    for (const d of capDots(p.draw())) { const x = Number(d.split(',')[0]); assert.ok(x >= 4 && x <= 155, `inside the margins: ${d}`); }
  }
});
