// 0691: a build handed back on an approved ticket that stops on a usage limit is carried on after the reset, like any other.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { usageLimitQueue, limitWaiting, readLimit, GRACE_MS } from '../scripts/usage-limit.mjs';
import { handBackQueue } from '../scripts/hand-back.mjs';
import { shipQueue } from '../scripts/ship-queue.mjs';
import { saveRecord } from '../scripts/build-records.mjs';
import { T } from './support/panel.mjs';

const RESET = Date.parse('2026-11-10T12:30:00Z'), HANDED = '2026-11-10T11:40:00.000Z';
const REFUSED = `${JSON.stringify({ type: 'rate_limit_event', rate_limit_info: { status: 'rejected', resetsAt: RESET / 1000, rateLimitType: 'five_hour' } })}\n`;

// A runs folder, a usage-limit queue and a hand-back queue over it, with a clock the test moves. stop() leaves the
// ticket's build stopped on the limit, its record holding what speck run's hand-back left in it.
function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0691-'));
  const clock = { now: Date.parse('2026-11-10T11:57:00Z') }, said = [], starts = [], running = new Set();
  const cfg = { base_branch: 'main', branch_prefix: 'speck/', builder: 'claude' };
  const words = ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'];
  const startBuild = (id, argv, cwd, shown, flags, rec) => { running.add(id); starts.push({ id, argv, rec: JSON.parse(rec(123)) }); };
  const q = usageLimitQueue({ repo: dir, runs: () => dir, settings: () => ({ cfg, words, max: 4 }), running, say: m => said.push(m), now: () => clock.now,
    statusOf: () => 'approved', resumeHint: () => 'Resume it by hand', startBuild });
  const hb = handBackQueue({ repo: dir, cfg, settings: () => ({ cfg, words, max: 4 }), running, startBuild, saveRecord, resumeHint: () => '', runs: () => dir, heldBuild: id => q.holdsBuild(id) });
  const file = id => path.join(dir, `${id}.json`);
  const stop = (id, rec = {}) => {
    fs.writeFileSync(path.join(dir, `${id}.log`), REFUSED);
    saveRecord(file(id), { id, session: `s-${id}`, cwd: dir, pid: 1, handed_back: HANDED, hand_backs: 1, hand_back_command: ['x'], exited: new Date(clock.now).toISOString(), exit_code: 1, ...rec });
    return q.ended(id, path.join(dir, `${id}.log`), file(id));
  };
  return { dir, clock, said, starts, running, q, hb, stop, rec: id => JSON.parse(fs.readFileSync(file(id), 'utf8')) };
}

test('0691 AC1: an approved ticket\'s handed-back build that stopped on the limit is resumed once it resets, in its own session', () => {
  const s = setup();
  assert.equal(s.stop('0001'), true);
  assert.deepEqual(limitWaiting(s.dir), ['0001']);
  const tickets = [T('0001', 'approved')];
  s.clock.now = RESET + GRACE_MS - 1;
  s.q.check(tickets);
  assert.equal(s.starts.length, 0, 'not before the reset');
  s.clock.now = RESET + GRACE_MS;
  s.q.check(tickets);
  assert.equal(s.starts.length, 1);
  const { argv, rec } = s.starts[0];
  assert.equal(argv[argv.indexOf('--resume') + 1], 's-0001');
  assert.match(argv[2], /usage limit has reset/);
  assert.match(argv[2], /carry on with \/speck-build 0001 from where you left off/i);
  assert.equal(Object.hasOwn(rec, 'exited'), false, 'the board shows it running');
  assert.equal(readLimit(s.dir), null, 'nothing left to carry on');
});

test('0691 AC1: an approved ticket whose build was never handed back still isn\'t carried on', () => {
  const s = setup();
  assert.equal(s.stop('0001', { handed_back: undefined, hand_backs: undefined }), false);
  assert.deepEqual(limitWaiting(s.dir), []);
  for (const handed_back of ['', 'not a time', 7]) assert.equal(setup().stop('0002', { handed_back }), false, String(handed_back));
});

test('0691 AC1: a handed-back build whose ticket has since been finished or blocked is left as it is', () => {
  for (const status of ['done', 'blocked', 'cancelled']) {
    const s = setup();
    s.stop('0001');
    s.clock.now = RESET + GRACE_MS;
    s.q.check([T('0001', status)]);
    assert.equal(s.starts.length, 0, status);
    assert.equal(readLimit(s.dir), null, status);
  }
});

test('0691 AC2: resuming it isn\'t another hand-back, and the ticket keeps the hand-backs it had left', () => {
  const s = setup();
  s.stop('0001', { hand_backs: 2 });
  s.clock.now = RESET + GRACE_MS;
  s.q.check([T('0001', 'approved')]);
  const { argv, rec } = s.starts[0];
  assert.equal(rec.hand_backs, 2);
  assert.equal(rec.handed_back, HANDED, 'not handed back again');
  assert.doesNotMatch(argv[2], /ship queue tried|Handed back again/);
  assert.ok(s.said.every(l => !/handing it back/.test(l)));
});

test('0691 AC3: while it waits for the reset, the ship queue neither ships it nor hands it back', () => {
  const s = setup();
  s.stop('0001');
  assert.equal(s.hb.waiting('0001'), true, 'counted as waiting for its build');
  const launched = [];
  const ships = shipQueue(s.dir, { base_branch: 'main' }, { say: () => {}, launch: id => launched.push(id), handBack: h => s.hb.keep(h), waiting: id => s.hb.waiting(id) });
  ships.check([{ ...T('0001', 'approved'), auto_ship: true }]);
  assert.deepEqual(launched, [], 'not shipped');
  s.hb.check([T('0001', 'approved')]);
  assert.equal(s.starts.length, 0, 'not handed back');
  // Once the reset has passed and its build is resumed, it's no longer waiting on the limit.
  s.clock.now = RESET + GRACE_MS;
  s.q.check([T('0001', 'approved')]);
  assert.equal(s.hb.waiting('0001'), false);
});
