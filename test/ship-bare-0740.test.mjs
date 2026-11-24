// 0740: while the main checkout isn't a work tree (core.bare is true in its .git/config), speck ship and speck run's
// ship queue ship nothing, change nothing, and say how to set it back.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { shipRepo, gIn, runIn, BRANCH } from './support/ship.mjs';
import { prRepo } from './support/pr.mjs';
import { shipQueue } from '../scripts/ship-queue.mjs';

const CFG = { base_branch: 'main', branch_prefix: 'speck/' };
const TICKETS = [{ id: '0001', status: 'approved', auto_ship: true, type: '', approved: '2026-11-24T10:00:00.000Z', build_running: false }];
const bare = (dir, on) => assert.equal(gIn(dir, 'config', 'core.bare', String(on)).status, 0);
const setBack = dir => `git -C ${dir} config core.bare false`;

// The refusal says the main checkout's core.bare is set, and how to set it back.
function saysBare(text, dir) {
  assert.match(text, /core\.bare/, text);
  assert.match(text, /isn't a work tree/, text);
  assert.ok(text.includes(setBack(dir)), text);
}

test('0740 AC4: speck ship refuses while the main checkout\'s core.bare is true, from either checkout, changing nothing and saying how to set it back', () => {
  for (const from of ['main checkout', 'ticket\'s worktree']) {
    const r = shipRepo();
    const before = r.snapshot();
    bare(r.dir, true);
    const res = runIn(from === 'main checkout' ? r.dir : r.wt, 'ship', '1');
    assert.notEqual(res.status, 0, `${from}: ${res.stdout}`);
    saysBare(res.stderr, r.dir);
    assert.match(res.stderr, /[Nn]othing was shipped/);
    assert.doesNotMatch(res.stdout, /Running tests/, 'it refuses before running the tests');
    bare(r.dir, false);
    assert.deepEqual(r.snapshot(), before, from);
    assert.equal(r.statusIn(r.wt), 'approved');
  }
});

test('0740 AC4: speck ship --auto, as speck run\'s ship queue starts it, refuses the same way', () => {
  const r = prRepo({ mode: 'local', config: ['auto_ship: true'] });
  const before = r.snapshot(), remoteMain = r.remoteHas('main');
  bare(r.dir, true);
  const res = runIn(r.dir, 'ship', '1', '--auto');
  assert.notEqual(res.status, 0, res.stdout);
  saysBare(res.stderr, r.dir);
  bare(r.dir, false);
  assert.deepEqual(r.snapshot(), before);
  assert.equal(r.remoteHas('main'), remoteMain, 'nothing was pushed');
});

test('0740 AC4: speck ship in pull request mode refuses before it asks GitHub for anything', () => {
  const r = prRepo();
  const before = r.snapshot();
  bare(r.dir, true);
  const res = r.cli(r.dir, 'ship', '1');
  assert.notEqual(res.status, 0, res.stdout);
  saysBare(res.stderr, r.dir);
  assert.deepEqual(r.gh.calls(), [], 'gh wasn\'t run');
  bare(r.dir, false);
  assert.deepEqual(r.snapshot(), before);
});

test('0740 AC4: a ship whose tests make the main checkout bare refuses once they end, before it merges, changing nothing', () => {
  const r = shipRepo({ test: 'git -C {main} config core.bare true' });
  const before = r.snapshot();
  const res = r.run('ship', '1');
  assert.notEqual(res.status, 0, res.stdout);
  assert.match(res.stdout, /Running tests/, 'the tests ran');
  saysBare(res.stderr, r.dir);
  bare(r.dir, false);
  assert.deepEqual(r.snapshot(), before);
  assert.equal(r.statusIn(r.wt), 'approved');
});

// speck run's ship queue on a ticket ready to ship, with a stand-in for `speck ship --auto` that records each start.
function queue() {
  const r = shipRepo();
  const said = [], started = [], stuck = [], handedBack = [];
  const q = shipQueue(r.dir, CFG, {
    say: s => said.push(s),
    launch: (repo, id, log, done) => started.push({ id, done }),
    stuck: x => stuck.push(x), handBack: h => handedBack.push(h),
  });
  return { r, q, said, started, stuck, handedBack };
}

test('0740 AC4: speck run\'s ship queue starts no ship while the main checkout\'s core.bare is true, says so once with how to set it back, and ships once it\'s set back', () => {
  const { r, q, said, started } = queue();
  bare(r.dir, true);
  q.check(TICKETS);
  q.check(TICKETS);
  assert.deepEqual(started, [], 'no ship started');
  const told = said.filter(s => /core\.bare/.test(s));
  assert.equal(told.length, 1, said.join('\n'));
  saysBare(told[0], r.dir);
  const state = q.state(TICKETS);
  saysBare(state.hold?.message ?? '', r.dir);
  assert.deepEqual(state.waiting.map(w => [w.id, w.kind]), [['0001', 'hold']]);
  bare(r.dir, false);
  q.check(TICKETS);
  assert.deepEqual(started.map(s => s.id), ['0001']);
  assert.ok(said.some(s => /work tree again/.test(s)), said.join('\n'));
  assert.equal(q.state(TICKETS).hold, null);
});

test('0740 AC4: a queued ship refused while the main checkout is bare is tried again once it\'s set back, without a new commit, and isn\'t handed on', () => {
  const { r, q, started, stuck, handedBack } = queue();
  q.check(TICKETS);
  assert.equal(started.length, 1);
  bare(r.dir, true); // as the ship's tests might
  // The record the refused auto-ship leaves, as if it started well after the branches' last commits, so it would
  // count as the ticket's last try.
  const record = path.join(r.dir, 'speck', '.cache', 'runs', '0001.ship.json'), at = new Date(Date.now() + 5000).toISOString();
  fs.writeFileSync(record, JSON.stringify({ pid: 999999999, auto: true, started: at, ended: at, message: `The main checkout at ${r.dir} isn't a work tree` }));
  started[0].done(1);
  assert.equal(fs.existsSync(record), false, 'no record of a try is left');
  q.check(TICKETS);
  assert.equal(started.length, 1, 'nothing ships while it is bare');
  bare(r.dir, false);
  q.check(TICKETS);
  assert.deepEqual(started.map(s => s.id), ['0001', '0001']);
  assert.deepEqual([stuck, handedBack], [[], []]);
  assert.ok(gIn(r.dir, 'rev-parse', '--verify', '-q', BRANCH).stdout.trim(), 'the branch is still there');
});
