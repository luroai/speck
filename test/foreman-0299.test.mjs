import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, T, click } from './support/panel.mjs';
import { shipRepo } from './support/ship.mjs';
import { shipQueue } from '../scripts/ship-queue.mjs';
import { foremanView, foremanLines, switchingReady, SWITCHING } from '../scripts/foreman.mjs';

// ---------- 0299: give each waiting ticket its own reason in the Foreman's detail ----------

const ON = { on: true, pid: 4242 };
const rec = (o = {}) => ({ lock: 4242, max: 2, building: [], switching: null, ready: [], ship: { running: null, hold: null, refused: [], waiting: [] }, ...o });
const view = (o, tickets = []) => foremanView({ run: ON, record: rec(o), tickets });
const state = foreman => ({ tickets: [], ideas: [], resume_command: '', run: ON, foreman });
const A = (id, o = {}) => ({ id, status: 'approved', auto_ship: true, type: '', approved: `2026-10-15T10:00:0${id.at(-1)}.000Z`, build_running: false, ...o });
const queue = () => {
  const launches = [];
  const q = shipQueue(shipRepo().dir, { base_branch: 'main', branch_prefix: 'speck/' }, { say: () => {}, launch: (repo, id, log, done) => launches.push({ id, done }) });
  return { q, launches };
};
const whys = s => Object.fromEntries(s.waiting.map(w => [w.id, w.why]));
async function detailOf(f) {
  const p = fakePage([state(f)]);
  await p.settle();
  click(p.byId('run'));
  await p.settle();
  return p.byId('foreman');
}

test('0299 AC1: while speck run switches to new code, a ticket waiting for its after: list says so, naming the tickets not done', () => {
  const tickets = [T('0295', 'ready', { waiting_on: ['0294', '0287'] }), T('0296', 'ready'), T('0297', 'ready'), T('0298', 'draft')];
  const own = t => (t.waiting_on || []).length ? { kind: 'after', why: `waiting for ${t.waiting_on.join(', ')}` } : null;
  const ready = switchingReady(tickets, new Set(['0297']), own);
  assert.deepEqual(ready, [{ id: '0295', kind: 'after', why: 'waiting for 0294, 0287' }, { id: '0296', kind: 'switching', why: SWITCHING }]);
  const v = view({ switching: { builds: ['0287'], ship: null, why: 'speck run is switching to new code once the build of 0287 ends' }, ready },
    [T('0295', 'ready'), T('0296', 'ready')]);
  assert.deepEqual(v.ready, [{ id: '0295', why: 'waiting for 0294, 0287' }, { id: '0296', why: SWITCHING }]);
});

test('0299 AC2: what holds up every build or ship is said once, above the sections, and only on lines with nothing of their own', async () => {
  const why = 'speck run is switching to new code once the build of 0287 ends';
  const f = view({ switching: { builds: ['0287'], ship: null, why },
    ready: [{ id: '0295', kind: 'after', why: 'waiting for 0294' }, { id: '0296', kind: 'switching', why: SWITCHING }],
    ship: { running: null, hold: { message: 'on hold until main has a new commit: 0290\'s ship found main\'s own tests failing. Only a fix ticket ships meanwhile.' }, refused: [],
      waiting: [{ id: '0294', kind: 'hold', why: 'shipping is on hold' }] } }, [T('0295', 'ready'), T('0296', 'ready')]);
  assert.deepEqual(f.held, [why, 'Shipping is on hold until main has a new commit: 0290\'s ship found main\'s own tests failing. Only a fix ticket ships meanwhile.']);
  const box = await detailOf(f);
  const t = box.textContent;
  assert.equal(t.split(why).length, 2, `said once: ${t}`);
  assert.equal(t.split('Shipping is on hold until main').length, 2, `said once: ${t}`);
  assert.ok(t.indexOf(why) < t.indexOf('Building') && t.indexOf('Shipping is on hold') < t.indexOf('Building'), `above the sections: ${t}`);
  assert.match(t, /0295 waiting for 0294/);
  assert.match(t, new RegExp(`0296 ${SWITCHING}`));
  assert.match(t, /0294 shipping is on hold/);
  assert.equal(view({}).held.length, 0, 'nothing held, nothing said');
});

test('0299 AC3: every approved ticket auto_ship covers that isn\'t shipping is listed with why: next, behind a running ship, or switching', () => {
  const { q } = queue();
  const tickets = [A('0001'), A('0002'), A('0003', { auto_ship: false }), A('0004', { status: 'ready' })];
  assert.deepEqual(whys(q.state(tickets)), { '0001': 'next to ship', '0002': 'next to ship after 0001' });
  assert.deepEqual(whys(q.state(tickets, { switching: true })), { '0001': SWITCHING, '0002': SWITCHING });
  q.check(tickets);
  const s = q.state(tickets);
  assert.equal(s.running, '0001');
  assert.deepEqual(whys(s), { '0002': 'waiting for the ship of 0001 to end' });
});

test('0299 AC3: a ticket whose last ship was refused gives the message, and one the hold covers says shipping is on hold', () => {
  const { q, launches } = queue();
  q.check([A('0001')]);
  launches[0].done(1, 'tests failed');
  const s = q.state([A('0001'), A('0002')]);
  assert.equal(s.waiting.find(w => w.id === '0001').why, 'waiting for a new commit on main or its branch. Its last try: tests failed');
  assert.equal(whys(s)['0002'], 'next to ship');
  q.check([A('0002')]);
  launches[1].done(14, 'main is failing');
  const h = q.state([A('0001'), A('0003'), A('0005', { type: 'fix' }), A('0006', { build_running: true })]);
  assert.equal(whys(h)['0003'], 'shipping is on hold');
  assert.equal(whys(h)['0005'], 'next to ship', 'a fix ticket ships despite the hold');
  assert.equal(whys(h)['0006'], 'its build is still running');
  assert.ok(h.hold);
});

test('0299 AC4: "Nothing is waiting to ship" shows only when no approved ticket auto_ship covers is waiting', async () => {
  const waiting = await detailOf(view({ ship: { running: null, hold: null, refused: [], waiting: [{ id: '0294', kind: 'switching', why: SWITCHING }] } }));
  assert.doesNotMatch(waiting.textContent, /Nothing is waiting to ship/);
  assert.match(waiting.textContent, new RegExp(`0294 ${SWITCHING}`));
  const none = await detailOf(view({}));
  assert.match(none.textContent, /Nothing is waiting to ship/);
});

test('0299 AC5: speck status gives the same reasons as the panel\'s detail', async () => {
  const why = 'speck run is switching to new code once the build of 0287 ends';
  const f = view({ switching: { builds: ['0287'], ship: null, why }, building: ['0287'],
    ready: [{ id: '0295', kind: 'after', why: 'waiting for 0294' }, { id: '0296', kind: 'switching', why: SWITCHING }],
    ship: { running: null, hold: null, refused: [], waiting: [{ id: '0294', kind: 'switching', why: SWITCHING }] } }, [T('0295', 'ready'), T('0296', 'ready')]);
  const lines = foremanLines(f), t = (await detailOf(f)).textContent;
  assert.ok(lines.includes(`  ${why}`), lines.join('\n'));
  assert.ok(lines.includes('  0295 ready, not building: waiting for 0294'), lines.join('\n'));
  assert.ok(lines.includes(`  0296 ready, not building: ${SWITCHING}`), lines.join('\n'));
  assert.ok(lines.includes(`  0294 waiting to ship: ${SWITCHING}`), lines.join('\n'));
  for (const r of [...f.ready, ...f.ship.waiting]) assert.ok(t.includes(`${r.id} ${r.why}`), `the panel has ${r.id}: ${t}`);
  assert.ok(t.includes(why));
});
