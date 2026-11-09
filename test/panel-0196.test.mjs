import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, queueRows, round, panelModel, fullViewOf } from './support/panel.mjs';

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

// speck run is on, as its ship queue ships these (0203: with it off, an approved ticket auto-ship covers waits for you).
function fake(tickets = TICKETS) {
  return fakePage([], {
    fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify({ tickets, ideas: [], run: { on: true } }))) }),
  });
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const classes = n => (n.className || '').split(/\s+/).filter(Boolean);
// What a row shows (0585): its sentence (the line's hover text, or its words when they are the sentence), the group it
// is under, its dot, and, from its full view, the lines saying why it stopped.
async function shows(p, id) {
  const row = rowOf(p, id), where = p.all(row).find(n => /^where\b/.test(n.className));
  const kids = p.byId('queue').children;
  const head = kids.slice(0, kids.indexOf(row)).filter(n => n.tagName === 'h3').pop();
  const say = where.title || p.all(where).find(n => n.className === 'said').textContent;
  const full = await fullViewOf(p, id);
  return { say, group: head.children[0].textContent, dot: classes(where)[1],
    acts: p.all(full).filter(n => /\bact\b/.test(n.className || '')).map(n => n.textContent) };
}

test('0196 AC1: an approved ticket auto-ship covers, whose build has ended, waits to ship under Building, as it does while shipping', async () => {
  const p = fake();
  await p.settle();
  const s = await shows(p, '0601');
  assert.equal(s.say, 'Approved · waiting to ship');
  assert.equal(s.group, 'Building', 'not under Needs you');
  assert.notEqual(s.dot, 'needs');
  assert.deepEqual(s.acts, [], 'no "Build finished without shipping"');
  const shipping = await shows(p, '0602');
  assert.equal(s.group, shipping.group, 'with the one being shipped');
  const m = panelModel()({ tickets: TICKETS, ideas: [], run: { on: true } }).queue.find(t => t.id === '0601');
  assert.deepEqual([m.to_ship, m.red, m.exit_label], [false, false, null]);
});

test('0196 AC1: one whose build is still closing out doesn\'t say it waits for you either', async () => {
  const p = fake([T('0611', 'approved', approved({ auto_ship: true, build_running: true }))]);
  await p.settle();
  const s = await shows(p, '0611');
  assert.equal(s.say, 'Approved · waiting to ship');
  assert.equal(s.group, 'Building');
});

test('0196 AC2: an approved ticket being shipped shows as shipping in the Build queue, not as queued', async () => {
  const p = fake();
  await p.settle();
  const s = await shows(p, '0602');
  assert.equal(s.say, 'Shipping');
  assert.equal(s.group, 'Building');
  assert.deepEqual(s.acts, [], 'no separate Shipping line since 0201');
});

test('0196 AC4: one auto-ship doesn\'t cover, or whose last auto-ship didn\'t finish, shows as before', async () => {
  const p = fake();
  await p.settle();
  for (const id of ['0603', '0605']) {
    const s = await shows(p, id);
    assert.equal(s.say, 'Approved · waiting for you to ship it', id);
    assert.equal(s.group, 'Needs you', id);
    assert.equal(s.dot, 'needs', id);
    assert.deepEqual(s.acts, ['Build finished without shipping'], id);
  }
  const failed = await shows(p, '0604');
  assert.equal(failed.say, 'Approved · waiting for you to ship it');
  assert.equal(failed.group, 'Needs you');
  assert.deepEqual(failed.acts, ["Auto-ship didn't finish", 'Ship it from its review pack, or run /speck-ship 0604']);
});
