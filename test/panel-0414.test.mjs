import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T } from './support/panel.mjs';
import { MIN, building, board, speckPage, capDots, shows } from './support/screen-speck.mjs';
import { LCD } from './support/screen.mjs';

// ---------- 0414: speck shows the pipeline through its animations on the screen ----------

test('0414 AC1: a new draft or a draft\'s changed text puts speck at the laptop, WRITING <id>, until 30 seconds after the last change', async () => {
  const d0500 = T('0500', 'draft', { problem: 'One.' });
  const p = speckPage([board([...building(), d0500]), board([...building(), d0500, T('0501', 'draft')]),
    board([...building(), { ...d0500, problem: 'Two.' }, T('0501', 'draft')]), board([...building(), { ...d0500, problem: 'Two.' }, T('0501', 'draft')])]);
  await p.settle();
  shows(p, 'watch', 'WATCHING 2 BUILDS'); // a draft already on the board when the page loads doesn't count
  await p.next();
  shows(p, 'building', 'WRITING 0501');
  p.go(20000);
  await p.next(); // 0500's text changed
  shows(p, 'building', 'WRITING 0500');
  p.go(29000);
  shows(p, 'building', 'WRITING 0500');
  await p.next(); // nothing changed
  p.go(1500);
  shows(p, 'watch', 'WATCHING 2 BUILDS');
});

test('0414 AC1: with several new drafts at once, it names the newest', async () => {
  const p = speckPage([board(building()), board([...building(), T('0502', 'draft'), T('0510', 'draft'), T('0505', 'draft')])]);
  await p.settle();
  await p.next();
  shows(p, 'building', 'WRITING 0510');
});

const EVENTS = [
  ['a ticket starts shipping', board(building()), board([T('0362', 'approved', { auto_ship: true, ship: { running: true, auto: true } }), T('0363', 'building')], { word: 'Shipping 0362', ship: { running: '0362', waiting: [] } }),
    'ship', 'SHIPPING 0362', 3200, 'watch', 'WATCHING THE SHIP'],
  ['a ticket ships', board(building()), board([T('0362', 'done'), T('0363', 'building')], { word: 'Building 1' }), 'celebrating', '0362 SHIPPED', 6000, 'watch', 'WATCHING 1 BUILD'],
  ['a ticket is blocked', board(building()), board([T('0362', 'blocked'), T('0363', 'building')], { word: 'Needs you 1' }), 'ask', '0362 HAS A QUESTION', 6000, 'ask', '1 NEEDS YOU'],
  ['the Foreman agent asks you something', board(building()),
    board(building(), { word: 'Needs you 1', agent: { running: null, waiting: [], did: [], asks: [{ id: '0363', question: 'Which?', at: '2026-10-23T12:00:00Z' }] } }),
    'ask', '0363 HAS A QUESTION', 6000, 'ask', '1 NEEDS YOU'],
  ['a ticket is approved and waits for you', board(building()), board([T('0362', 'approved', { auto_ship: false }), T('0363', 'building')], { word: 'Building 1' }),
    'flag', '0362 IS READY TO SHIP', 6000, 'watch', 'WATCHING 1 BUILD'],
  ['the Foreman agent starts looking into a ticket', board(building()),
    board(building(), { agent: { running: { id: '0363', what: 'its ship was refused' }, waiting: [], did: [], asks: [] } }), 'confused', 'LOOKING INTO 0363', 6000, 'watch', 'WATCHING 2 BUILDS'],
];
for (const [what, before, after, pose, cap, ms, back, backCap] of EVENTS) {
  test(`0414 AC2: when ${what}, speck plays its animation once with ${cap}, then goes back`, async () => {
    const p = speckPage([before, after, after]);
    await p.settle();
    shows(p, 'watch', 'WATCHING 2 BUILDS');
    await p.next();
    shows(p, pose, cap);
    p.go(ms - 200);
    await p.next(); // the same board again: it doesn't play twice
    shows(p, pose, cap);
    p.go(400);
    shows(p, back, backCap);
  });
}

test('0414 AC2: an approved ticket that auto_ship ships while speck run is on plays nothing', async () => {
  const p = speckPage([board(building()), board([T('0362', 'approved', { auto_ship: true }), T('0363', 'building')], { word: 'Building 1' })]);
  await p.settle();
  await p.next();
  shows(p, 'watch', 'WATCHING 1 BUILD');
});

test('0414 AC2: the push is one loop of the panel\'s ship pose, from its start', async () => {
  const p = speckPage([board(building()), board([T('0362', 'approved', { auto_ship: true, ship: { running: true, auto: true } }), T('0363', 'building')], { word: 'Shipping 0362', ship: { running: '0362', waiting: [] } })]);
  await p.settle();
  p.draw(5000, false);
  await p.next();
  p.draw(9000, false); // the event starts here
  const c = p.cast();
  assert.equal(c.cur, 'ship');
  assert.equal(c.poses.ship, LCD.PANEL.ship, 'the panel\'s ship pose');
  assert.ok(Math.abs(c.cs - 9000) < 1, 'its loop starts as the event does');
  p.go(3100);
  p.draw(12100, false);
  assert.equal(c.cur, 'ship', 'still pushing within the loop');
  p.go(200);
  p.draw(12300, false);
  assert.equal(c.cur, 'watch', 'one loop, 3.2 seconds');
});

const WORDS = [['Off', 'sleeping', 'SPECK RUN IS OFF'], ['Building 3', 'watch', 'WATCHING 3 BUILDS'], ['Building 1', 'watch', 'WATCHING 1 BUILD'],
  ['Shipping 0362', 'watch', 'WATCHING THE SHIP'], ['Needs you 2', 'ask', '2 NEEDS YOU'], ['Waiting: new code', 'grumpy', 'WAITING'], ['Waiting', 'grumpy', 'WAITING']];
for (const [word, pose, cap] of WORDS) {
  test(`0414 AC3: the word "${word}" shows ${pose} with ${cap}`, async () => {
    const p = speckPage([board(building(), { word })]);
    await p.settle();
    shows(p, pose, cap);
    p.go(/^(Off|Needs you)/.test(word) ? 60 * MIN : 2 * MIN - 1000); // 0436: the others pass the time after 2 minutes
    shows(p, pose, cap);
  });
}

const IDLE = [[0, 'eating'], [0.3, 'playing'], [0.6, 'messy'], [0.9, 'cleaning']];
for (const [random, pose] of IDLE) {
  test(`0414 AC3: Idle picks ${pose} at random, with its caption, and naps after 15 minutes until an event plays`, async () => {
    const shipped = board([T('0362', 'done')], { word: 'Idle' });
    const p = speckPage([board([T('0362', 'approved')], { word: 'Idle' }), board([T('0362', 'approved')], { word: 'Idle' }), shipped], { random });
    await p.settle();
    p.draw();
    assert.equal(p.cast().cur, pose);
    const cap = capDots(p.draw());
    assert.ok(cap.size > 0, 'it has a caption');
    p.go(3 * MIN - 1000);
    await p.next();
    assert.equal(p.cast().cur, pose, 'the same for its first 3 minutes (0436)');
    assert.deepEqual(capDots(p.draw()), cap, 'the same caption');
    p.go(12 * MIN + 2000);
    shows(p, 'sleeping', 'NAPPING');
    p.go(60 * MIN);
    shows(p, 'sleeping', 'NAPPING');
    await p.next(); // it ships
    shows(p, 'celebrating', '0362 SHIPPED');
    p.go(6100);
    p.draw();
    assert.notEqual(p.cast().cur, 'sleeping', 'awake again after the event');
  });
}

test('0414 AC3: Idle\'s captions come from a fixed set, one for each pick', async () => {
  const caps = new Set();
  for (const [random] of IDLE) {
    const p = speckPage([board([], { word: 'Idle' })], { random });
    await p.settle();
    caps.add([...capDots(p.draw())].sort().join(' '));
  }
  assert.equal(caps.size, 4);
});

test('0414 AC3: a build\'s stages change nothing, and no model is asked', async () => {
  const p = speckPage([board([T('0362', 'building')], { word: 'Building 1' }), board([T('0362', 'reviewing', { review_running: 'reviewer' })], { word: 'Building 1' }),
    board([T('0362', 'reviewing', { review_running: 'builder', self_check: 'Self-check: no changes' })], { word: 'Building 1' })]);
  await p.settle();
  shows(p, 'watch', 'WATCHING 1 BUILD');
  const calls = p.calls.length;
  await p.next();
  shows(p, 'watch', 'WATCHING 1 BUILD');
  await p.next();
  shows(p, 'watch', 'WATCHING 1 BUILD');
  assert.equal(p.calls.length, calls + 2, 'only the two boards are fetched: no model is asked');
});

test('0414 AC4: two events at once play one after the other', async () => {
  const p = speckPage([board(building()), board([T('0362', 'done'), T('0363', 'blocked')], { word: 'Needs you 1' })]);
  await p.settle();
  await p.next();
  shows(p, 'celebrating', '0362 SHIPPED');
  p.go(6100);
  shows(p, 'ask', '0363 HAS A QUESTION');
  p.go(6100);
  shows(p, 'ask', '1 NEEDS YOU');
});

test('0414 AC4: what happened before the page loaded doesn\'t play', async () => {
  const p = speckPage([board([T('0362', 'done'), T('0363', 'blocked'), T('0364', 'approved', { auto_ship: false }), T('0365', 'approved', { ship: { running: true } })],
    { word: 'Needs you 1', agent: { running: { id: '0363', what: 'x' }, waiting: [], did: [], asks: [{ id: '0364', question: 'Q', at: '2026-10-23T11:00:00Z' }] } })]);
  await p.settle();
  shows(p, 'ask', '1 NEEDS YOU');
});

test('0414 AC5: every caption fits on the screen, centred, without scrolling', async () => {
  const caps = ['WATCHING 99 BUILDS', '99 NEEDS YOU', 'SPECK RUN IS OFF', 'WATCHING THE SHIP', 'NAPPING', 'WRITING 0414', 'SHIPPING 0414', '0414 SHIPPED',
    '0414 HAS A QUESTION', '0414 IS READY TO SHIP', 'LOOKING INTO 0414'];
  for (const c of caps) assert.ok(c.length * 6 - 1 <= 152, `${c} fits between the 4-dot margins`);
  for (const [random] of IDLE) {
    const p = speckPage([board([], { word: 'Idle' })], { random });
    await p.settle();
    const a = capDots(p.draw(1000, false)), b = capDots(p.draw(20000, false));
    assert.deepEqual(a, b, 'the caption doesn\'t move');
    for (const d of a) { const x = Number(d.split(',')[0]); assert.ok(x >= 4 && x <= 155, `inside the margins: ${d}`); }
  }
  const p = speckPage([board(building(), { word: 'Building 99' })]);
  await p.settle();
  shows(p, 'watch', 'WATCHING 99 BUILDS', 1000, false);
  assert.equal(p.made().rows, 72, 'a row of dots for the caption under speck');
});

test('0414 AC5: with reduced motion each animation is one still frame, and the captions still change', async () => {
  const p = speckPage([board(building()), board([T('0362', 'done'), T('0363', 'building')], { word: 'Building 1' })], { reduced: true });
  await p.settle();
  const speck = dots => dots.filter(([, r]) => r > 11 && r < 63).map(d => d.join()).sort();
  assert.deepEqual(speck(p.draw(1000, false)), speck(p.draw(4321, false)), 'watching is still');
  shows(p, 'watch', 'WATCHING 2 BUILDS', 1000, false);
  await p.next();
  shows(p, 'celebrating', '0362 SHIPPED', 5000, false);
  assert.deepEqual(speck(p.draw(5000, false)), speck(p.draw(7777, false)), 'celebrating is still');
  p.go(6100);
  shows(p, 'watch', 'WATCHING 1 BUILD', 9000, false);
});

test('0414 AC4: every event seen plays, however many, including a ticket blocked and the Foreman asking about it at once', async () => {
  const ids = Array.from({ length: 10 }, (_, i) => String(500 + i).padStart(4, '0'));
  const ask = { running: null, waiting: [], did: [], asks: [{ id: '0510', question: 'Q', at: '2026-10-23T12:00:00Z' }] };
  const p = speckPage([board([...ids.map(id => T(id, 'building')), T('0510', 'building')], { word: 'Building 11' }),
    board([...ids.map(id => T(id, 'done')), T('0510', 'blocked')], { word: 'Needs you 2', agent: ask })]);
  await p.settle();
  await p.next();
  for (const id of ids) { shows(p, 'celebrating', `${id} SHIPPED`); p.go(6100); }
  shows(p, 'ask', '0510 HAS A QUESTION');
  p.go(6100);
  shows(p, 'ask', '0510 HAS A QUESTION');
  p.go(6100);
  shows(p, 'ask', '2 NEEDS YOU');
});
