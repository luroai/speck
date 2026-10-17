import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { shipRepo } from './support/ship.mjs';
import { shipQueue } from '../scripts/ship-queue.mjs';

// ---------- 0263: speck run ships a fix ticket while shipping is on hold for a failing base branch ----------

const T = (id, o = {}) => ({ id, status: 'approved', auto_ship: true, type: '', approved: '2026-10-15T10:00:00.000Z', build_running: false, ...o });
const FIX = o => T('0001', { type: 'fix', ...o }); // 0001 has its own branch in shipRepo's repo
const commitTo = (r, cwd, file) => { fs.writeFileSync(path.join(cwd, file), `${Math.random()}\n`); r.g('-C', cwd, 'add', file); r.g('-C', cwd, 'commit', '-qm', file); };

// The queue with a stand-in for `speck ship`, put on hold by ticket 0002's ship exiting 14.
function held() {
  const r = shipRepo();
  const said = [], launches = [];
  const q = shipQueue(r.dir, { base_branch: 'main', branch_prefix: 'speck/' }, { say: s => said.push(s), launch: (repo, id, log, done) => launches.push({ id, done }) });
  q.check([T('0002')]);
  launches[0].done(14);
  assert.match(said.join('\n'), /on hold until main passes/);
  return { r, q, said, launches, ids: () => launches.map(l => l.id) };
}

test('0263 AC1: during the hold, an approved fix ticket that auto_ship covers ships on the next check, with no new commit on main', () => {
  const k = held();
  const main = k.r.sha('main');
  k.q.check([FIX(), T('0003')]);
  assert.deepEqual(k.ids(), ['0002', '0001']);
  assert.equal(k.r.sha('main'), main, 'main has no new commit');
});

test('0263 AC1: during the hold, a fix ticket auto_ship doesn\'t cover, or that isn\'t approved, still waits', () => {
  const k = held();
  for (let i = 0; i < 3; i++) k.q.check([FIX({ auto_ship: false }), FIX({ status: 'reviewing' })]);
  assert.deepEqual(k.ids(), ['0002']);
});

test('0263 AC2: during the hold, tickets of any other type still wait for a new commit on main', () => {
  const k = held();
  for (let i = 0; i < 3; i++) k.q.check([T('0003'), T('0004', { type: 'bug' })]);
  assert.deepEqual(k.ids(), ['0002'], 'nothing else ships on hold');
  k.q.check([FIX(), T('0003')]);
  k.launches[1].done(1);
  for (let i = 0; i < 3; i++) k.q.check([FIX(), T('0003')]);
  assert.deepEqual(k.ids(), ['0002', '0001'], 'still nothing but the fix ticket');
  commitTo(k.r, k.r.dir, 'notes.txt');
  k.q.check([T('0003')]);
  assert.deepEqual(k.ids(), ['0002', '0001', '0003'], 'ships again once main has a new commit');
});

for (const code of [1, 14]) {
  test(`0263 AC3: a fix ticket's ship that exits ${code} leaves the hold on, and the fix ticket waits for a new commit`, () => {
    const k = held();
    k.q.check([FIX()]);
    k.launches[1].done(code);
    for (let i = 0; i < 3; i++) k.q.check([FIX(), T('0003')]);
    assert.deepEqual(k.ids(), ['0002', '0001'], 'neither the fix ticket again nor any other ticket');
    commitTo(k.r, k.r.wt, 'other.txt'); // the fix ticket's own branch moves
    k.q.check([FIX(), T('0003')]);
    assert.deepEqual(k.ids(), ['0002', '0001', '0001'], 'the fix ticket is tried again after a commit on its branch');
    k.launches[2].done(1);
    k.q.check([FIX(), T('0003')]);
    assert.equal(k.launches.length, 3, 'still on hold for every other ticket');
  });
}

test('0263 AC3: a fix ticket\'s ship that ends without shipping is tried again once main has a new commit', () => {
  const k = held();
  k.q.check([FIX()]);
  k.launches[1].done(1);
  k.q.check([FIX()]);
  assert.equal(k.launches.length, 2);
  commitTo(k.r, k.r.dir, 'notes.txt');
  k.q.check([FIX()]);
  assert.deepEqual(k.ids(), ['0002', '0001', '0001']);
});

test('0263 AC4: shipping a fix ticket during the hold prints a line saying so', () => {
  const k = held();
  const before = k.said.length;
  k.q.check([FIX()]);
  const now = k.said.slice(before).join('\n');
  assert.match(now, /0001/);
  assert.match(now, /fix ticket/);
  assert.match(now, /despite the hold/);
});

test('0263 AC4: with no hold, shipping a fix ticket says nothing about a hold', () => {
  const r = shipRepo();
  const said = [];
  const q = shipQueue(r.dir, { base_branch: 'main', branch_prefix: 'speck/' }, { say: s => said.push(s), launch: () => {} });
  q.check([FIX()]);
  assert.match(said.join('\n'), /Shipping 0001/);
  assert.doesNotMatch(said.join('\n'), /hold/);
});

test('0263 AC4: the line putting shipping on hold says a fix ticket still ships', () => {
  const k = held();
  assert.match(k.said.join('\n'), /on hold until main passes: .*other than a fix ticket's/);
});
