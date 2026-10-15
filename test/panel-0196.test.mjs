import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, queueRows, round, panelModel } from './support/panel.mjs';

// ---------- 0196: show an auto-shipping ticket as shipping from approval until it ships ----------

const ago = s => new Date(Date.now() - s * 1000).toISOString();
const approved = o => ({ started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], ...o });
const TICKETS = [
  T('0601', 'approved', approved({ auto_ship: true, build_exit: { at: ago(30), code: 0, message: 'Approved.' } })), // build ended, ship not started
  T('0602', 'approved', approved({ auto_ship: true, build_exit: { at: ago(30), code: 0 }, ship: { running: true, auto: true, started: ago(5) } })), // shipping
  T('0603', 'approved', approved({ auto_ship: false, build_exit: { at: ago(30), code: 0 } })), // auto-ship doesn't cover it
  T('0604', 'approved', approved({ auto_ship: true, build_exit: { at: ago(30), code: 0 },
    ship: { running: false, auto: true, started: ago(20), ended: ago(10), message: 'Tests failed.' } })), // its last auto-ship didn't finish
  T('0605', 'approved', approved({ build_exit: { at: ago(30), code: 0 } })), // from an older speck status, with no auto_ship field
];

function fake(tickets = TICKETS) {
  return fakePage([], {
    fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify({ tickets, ideas: [] }))) }),
  });
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const topOf = row => row.children.find(n => n.className === 'top');
const classes = n => (n.className || '').split(/\s+/).filter(Boolean);
// What a card shows: its classes, its sentence and the sentence's classes, its badge's pose and name, and its labels.
function shows(p, id) {
  const row = rowOf(p, id), [badge, text] = topOf(row).children.find(n => n.className === 'badgerow').children;
  const say = text.children.find(n => /\bsay\b/.test(n.className));
  return { card: classes(row), say: say.textContent, sayClass: classes(say), pose: classes(badge)[1], label: badge.attrs['aria-label'],
    acts: p.all(row).filter(n => /\bact\b/.test(n.className || '')).map(n => n.textContent) };
}

test('0196 AC1: an approved ticket auto-ship covers, whose build has ended, waits to ship in the normal colour with its badge at work', async () => {
  const p = fake();
  await p.settle();
  const s = shows(p, '0601');
  assert.equal(s.say, 'Approved · waiting to ship');
  assert.deepEqual(s.sayClass, ['say'], 'the normal text colour');
  assert.ok(!s.card.includes('to-ship') && !s.card.includes('blocked'), `not purple or crimson: ${s.card}`);
  assert.deepEqual(s.acts, [], 'no "Build finished without shipping"');
  const shipping = shows(p, '0602');
  assert.equal(s.pose, shipping.pose, 'the badge moves as it does while shipping');
  assert.equal(s.pose, 'ship'); // the shipping loop since 0172
  assert.ok(s.card.includes('at-ship'), 'its border shows the ship stage');
  const m = panelModel()({ tickets: TICKETS, ideas: [] }).queue.find(t => t.id === '0601');
  assert.deepEqual([m.to_ship, m.red, m.exit_label], [false, false, null]);
});

test('0196 AC1: one whose build is still closing out doesn\'t say it waits for you either', async () => {
  const p = fake([T('0611', 'approved', approved({ auto_ship: true, build_running: true }))]);
  await p.settle();
  const s = shows(p, '0611');
  assert.equal(s.say, 'Approved · waiting to ship');
  assert.deepEqual(s.sayClass, ['say']);
});

test('0196 AC2: an approved ticket being shipped shows as shipping in the Build queue, not as queued', async () => {
  const p = fake();
  await p.settle();
  const s = shows(p, '0602');
  assert.equal(s.say, 'Shipping');
  assert.ok(!s.card.includes('queued'));
  assert.ok(s.acts.some(a => a.startsWith('Shipping…')));
});

test('0196 AC4: one auto-ship doesn\'t cover, or whose last auto-ship didn\'t finish, shows as before', async () => {
  const p = fake();
  await p.settle();
  for (const id of ['0603', '0605']) {
    const s = shows(p, id);
    assert.equal(s.say, 'Approved · waiting for you to ship it', id);
    assert.deepEqual(s.sayClass, ['say', 'to-ship'], id);
    assert.ok(s.card.includes('to-ship'), id);
    assert.equal(s.pose, 'wait', id);
    assert.deepEqual(s.acts, ['Build finished without shipping'], id);
  }
  const failed = shows(p, '0604');
  assert.equal(failed.say, 'Approved · waiting for you to ship it');
  assert.deepEqual(failed.sayClass, ['say', 'bad']);
  assert.ok(failed.card.includes('blocked'));
  assert.equal(failed.pose, 'bad');
  assert.deepEqual(failed.acts, ["Auto-ship didn't finish", 'Ship it from its review pack, or run /speck-ship 0604']);
});
