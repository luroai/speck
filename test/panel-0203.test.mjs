import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, queueRows, round, panelModel, boardPage, openQueueRows } from './support/panel.mjs';

// ---------- 0203: say when an approved ticket waits for Auto-build to ship it ----------

const ago = s => new Date(Date.now() - s * 1000).toISOString();
const approved = o => ({ started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], ...o });
const RUN = { on: true, pid: 4242, started: ago(600) };
const TICKETS = [
  T('0701', 'approved', approved({ auto_ship: true, build_exit: { at: ago(30), code: 0, message: 'Approved.' } })), // build ended, ship not started
  T('0702', 'approved', approved({ auto_ship: true, build_running: true })), // build still closing out
  T('0703', 'approved', approved({ auto_ship: true, build_exit: { at: ago(30), code: 0 }, ship: { running: true, auto: true, started: ago(5) } })), // auto-shipping
  T('0704', 'approved', approved({ auto_ship: true, ship: { running: true, started: ago(5) } })), // shipped from the panel
  T('0705', 'approved', approved({ auto_ship: false, build_exit: { at: ago(30), code: 0 } })), // auto-ship doesn't cover it, build ended
  T('0706', 'approved', approved({ auto_ship: false })), // auto-ship doesn't cover it, no build from speck run
  T('0707', 'approved', approved({ build_exit: { at: ago(30), code: 0 } })), // from an older speck status, with no auto_ship field
];
const state = (run, tickets = TICKETS) => ({ tickets, ideas: [], resume_command: '', ...(run ? { run } : {}) });
const fake = async (run, tickets) => { const p = boardPage([state(run, tickets)]); await p.settle(); return p; };

const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const topOf = row => row.children.find(n => n.className === 'top');
const classes = n => (n.className || '').split(/\s+/).filter(Boolean);
// What a card shows: its classes, its sentence and the sentence's classes, the stage its border shows (0171), or null,
// and its labels. 0416: the builder badge's pose went with the badge; the border still shows the stage.
function shows(p, id) {
  const row = rowOf(p, id), text = topOf(row).children.find(n => classes(n)[0] === 'progress');
  const say = text ? text.children.find(n => /\bsay\b/.test(n.className)) : null; // 0462: an open card has its facts in a table instead
  return { card: classes(row), say: say ? say.attrs?.['aria-label'] ?? say.textContent : null, // 0443: a closed card's long sentence is the accessible name of its short words
    sayClass: say ? classes(say) : null, stage: (classes(row).find(c => c.startsWith('at-')) || '').slice(3) || null,
    acts: p.all(row).filter(n => /\bact\b/.test(n.className || '')).map(n => n.textContent) };
}

test('0203 AC1: with speck run off, an approved ticket auto-ship covers says to turn on Auto-build, in purple, with no stage border', async () => {
  const p = await fake(null);
  for (const id of ['0701', '0702']) {
    const s = shows(p, id);
    assert.equal(s.say, 'Approved · turn on Auto-build to ship it', id);
    assert.deepEqual(s.sayClass, ['say', 'to-ship'], `${id}: purple`);
    assert.ok(s.card.includes('to-ship'), `${id}: a purple card: ${s.card}`);
    assert.ok(!s.card.some(c => c.startsWith('at-')), `${id}: no stage border: ${s.card}`);
    assert.deepEqual(s.acts, [], `${id}: no "Build finished without shipping"`);
  }
  const m = panelModel()(state(null)).queue.find(t => t.id === '0701');
  assert.deepEqual([m.to_ship, m.red, m.ship_waiting, m.exit_label], [true, false, false, null]);
});

test('0203 AC1: the Auto-build button\'s builder isn\'t at work for it (0364: the button has no builder)', async () => {
  const p = await fake(null, TICKETS.slice(0, 2));
  const builder = p.all(p.byId('run')).find(n => n.tagName === 'canvas');
  assert.equal(builder, undefined);
});

test('0203 AC2: with speck run on, the same ticket waits to ship in the normal colour, its border at the ship stage', async () => {
  const p = await fake(RUN);
  const s = shows(p, '0701');
  assert.equal(s.say, 'Approved · waiting to ship');
  assert.deepEqual(s.sayClass, ['say'], 'the normal text colour');
  assert.ok(!s.card.includes('to-ship') && !s.card.includes('blocked'), s.card.join(' '));
  assert.equal(s.stage, 'ship', 'as 0196 set out');
  const closing = shows(p, '0702');
  assert.equal(closing.say, 'Approved · waiting to ship');
  assert.deepEqual(closing.sayClass, ['say']);
});

test('0203 AC2: turning speck run on again changes the card back', async () => {
  const p = fakePage([state(null), state(RUN)]);
  await p.settle();
  assert.equal(shows(p, '0701').say, 'Approved · turn on Auto-build to ship it');
  p.timers.shift()(); await p.settle();
  const s = shows(p, '0701');
  assert.equal(s.say, 'Approved · waiting to ship');
  assert.equal(s.stage, 'ship');
});

test('0203 AC3: a ticket that\'s shipping, by anyone, shows as shipping whether speck run is on or off', async () => {
  for (const run of [null, RUN]) {
    const p = await fake(run);
    for (const id of ['0703', '0704']) {
      const s = shows(p, id), where = `${id}, ${run ? 'on' : 'off'}`;
      assert.equal(s.say, 'Shipping', where);
      assert.deepEqual(s.sayClass, ['say'], where);
      assert.equal(s.stage, 'ship', where);
    }
  }
});

test('0203 AC4: an approved ticket auto-ship doesn\'t cover looks the same whether speck run is on or off', async () => {
  const off = await fake(null), on = await fake(RUN);
  for (const id of ['0705', '0706', '0707']) { // 0462: the sentence is in a closed card's line
    assert.deepEqual(shows(off, id), shows(on, id), id);
    assert.equal(shows(off, id).say, 'Approved · waiting for you to ship it', id);
  }
  await openQueueRows(off); // 0434: what's under a Build card's two lines shows while it's open
  await openQueueRows(on);
  for (const id of ['0705', '0706', '0707']) assert.deepEqual(shows(off, id), shows(on, id), id);
  assert.deepEqual(shows(off, '0705').acts, ['Build finished without shipping']);
});
