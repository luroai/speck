import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { statusData } from '../scripts/speck.mjs';
import { shipQueue } from '../scripts/ship-queue.mjs';
import { afterWait } from '../scripts/built-on.mjs';
import { builtOnRepo, speckIn, gitIn, startedAt, commitFile, approve } from './support/built-on.mjs';

// ---------- 0675: start a waiting ticket once what it waits for is approved ----------

const shown = (r, id) => statusData(r.dir).tickets.find(t => t.id === id);
const cfg = { base_branch: 'main', branch_prefix: 'speck/' };

// speck run's ship queue with a stand-in for `speck ship`: each launch is kept, for the test to end it.
function queue(r) {
  const said = [], launches = [];
  const q = shipQueue(r.dir, cfg, { say: s => said.push(s), launch: (repo, id, log, done) => launches.push({ id, done }) });
  return { said, launches, check: () => q.check(statusData(r.dir).tickets) };
}

test('0675 AC1: speck run starts a ready ticket whose one waiting after: ticket is approved', () => {
  const r = builtOnRepo();
  const t = shown(r, '0001');
  assert.equal(t.status, 'ready');
  assert.deepEqual(t.waiting_on, ['0002']);
  assert.equal(t.starts_on, '0002', 'it can start on 0002, as speck start allows');
  assert.equal(afterWait(t), null, 'nothing in after: holds speck run back');
});

test('0675 AC1: it still skips one whose after: ticket is building, reviewing or blocked', () => {
  for (const status of ['building', 'reviewing', 'blocked']) {
    const r = builtOnRepo({ status });
    const t = shown(r, '0001');
    assert.equal(t.starts_on, null, status);
    assert.match(afterWait(t), /waiting for 0002/, status);
  }
});

test('0675 AC1: it still skips one with more than one after: ticket not done, even when both are approved', () => {
  const r = builtOnRepo({ tickets: [['0001', { after: '["0002", "0003"]' }], ['0002', {}], ['0003', {}]] });
  const third = startedAt(speckIn(r.dir, 'start', '0003'));
  commitFile(third, 'c.txt', 2);
  approve(third, '0003');
  const t = shown(r, '0001');
  assert.equal(t.starts_on, null);
  assert.match(afterWait(t), /waiting for 0002, 0003/);
});

test('0675 AC1: a ticket that isn\'t ready, or waits on nothing, gets no starts_on, and afterWait reads odd rows as nothing to wait for', () => {
  const r = builtOnRepo();
  assert.equal(shown(r, '0002').starts_on, null);
  for (const row of [{}, { waiting_on: [] }, { waiting_on: null }, { waiting_on: 'x' }]) assert.equal(afterWait(row), null, JSON.stringify(row));
});

// 0001 started on approved 0002 and approved itself, with auto_ship on.
function bothApproved() {
  const r = builtOnRepo();
  fs.writeFileSync(r.cfgFile, fs.readFileSync(r.cfgFile, 'utf8').replace(/^auto_ship:.*$/m, 'auto_ship: true'));
  gitIn(r.dir, 'commit', '-qam', 'auto_ship on');
  const res = speckIn(r.dir, 'start', '0001');
  assert.equal(res.status, 0, res.stderr);
  const first = startedAt(res);
  commitFile(first, 'b.txt', 3);
  approve(first, '0001');
  return { ...r, first };
}

test('0675 AC2: with auto-ship on, speck run ships the ticket built on another on its first check once that one is done', () => {
  const r = bothApproved(), k = queue(r);
  k.check();
  assert.deepEqual(k.launches.map(l => l.id), ['0002'], 'only the ticket it was built on ships first');
  const shipped = speckIn(r.dir, 'ship', '0002', '--auto');
  assert.equal(shipped.status, 0, shipped.stderr);
  k.launches[0].done(0);
  assert.equal(shown(r, '0001').auto_ship, true);
  k.check();
  assert.deepEqual(k.launches.map(l => l.id), ['0002', '0001'], 'shipped on the first check after');
  const res = speckIn(r.dir, 'ship', '0001', '--auto');
  assert.equal(res.status, 0, res.stderr);
  for (const f of ['a.txt', 'b.txt']) assert.ok(gitIn(r.dir, 'ls-tree', '--name-only', 'main', f), f);
});

test('0675 AC3: until then, waiting_on names the ticket it was built on, and speck run says once that it waits to ship after it', () => {
  const r = bothApproved(), k = queue(r);
  const t = shown(r, '0001');
  assert.deepEqual(t.waiting_on, ['0002']);
  assert.equal(t.ships_after, '0002');
  k.check(); k.check();
  k.launches[0]?.done(1);
  k.check();
  const lines = k.said.filter(s => /0001 is approved and waits to ship after 0002/.test(s));
  assert.equal(lines.length, 1, k.said.join('\n'));
  assert.ok(!k.launches.some(l => l.id === '0001'));
});

test('0675 AC3: once it has shipped, nothing is waited for', () => {
  const r = bothApproved();
  assert.equal(speckIn(r.dir, 'ship', '0002').status, 0);
  const t = shown(r, '0001');
  assert.deepEqual(t.waiting_on, []);
  assert.equal(t.ships_after, null);
});

