import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { shipRepo, BRANCH } from './support/ship.mjs';
import { startRun, until, stopRun, killAll } from './support/run.mjs';
import { statusData } from '../scripts/speck.mjs';
import { shipQueue, shipOrder } from '../scripts/ship-queue.mjs';

// ---------- 0193: speck run ships approved tickets whose auto-ship didn't finish ----------

// A repo with approved ticket 0001 on its own branch and worktree, and auto_ship on unless `auto` is false.
function repo({ auto = true, risk = 'low', test = 'true' } = {}) {
  const r = shipRepo({ test });
  const cfg = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^auto_ship:.*$/m, `auto_ship: ${auto}`));
  if (risk !== 'low') {
    const t = path.join(r.wt, 'speck', 'tickets', '0001-export-bookings.md');
    fs.writeFileSync(t, fs.readFileSync(t, 'utf8').replace(/^risk:.*$/m, `risk: ${risk}`));
    r.g('-C', r.wt, 'commit', '-qam', 'risk');
  }
  r.g('commit', '-qam', 'config');
  return r;
}

// speck run's queue with a stand-in for `speck ship`: each launch is kept, for the test to end with an exit code.
function queue(r) {
  const cfg = { base_branch: 'main', branch_prefix: 'speck/' };
  const said = [], launches = [];
  const q = shipQueue(r.dir, cfg, { say: s => said.push(s), launch: (repo, id, log, done) => launches.push({ id, log, done }) });
  return { q, said, launches, check: (tickets = statusData(r.dir).tickets) => q.check(tickets) };
}
const T = (id, o = {}) => ({ id, status: 'approved', auto_ship: true, type: '', approved: '2026-10-15T10:00:00.000Z', build_running: false, ...o });
const commitTo = (r, cwd, file) => { fs.writeFileSync(path.join(cwd, file), `${Math.random()}\n`); r.g('-C', cwd, 'add', file); r.g('-C', cwd, 'commit', '-qm', file); };
const count = (said, re) => said.filter(s => re.test(s)).length;

test('0193 AC1: speck run\'s queue ships an approved ticket that auto_ship covers, once', () => {
  const r = repo(), k = queue(r);
  k.check();
  assert.deepEqual(k.launches.map(l => l.id), ['0001']);
  k.check(); k.check();
  assert.equal(k.launches.length, 1, 'no second ship while its own runs');
  assert.match(k.said.join('\n'), /Shipping 0001/);
});

test('0193 AC1: no ship starts while another ship runs in the repo, whoever started it', async () => {
  const r = repo(), k = queue(r);
  // A ship of another ticket, started outside speck run: its record names a live `speck ship 0002` process.
  const other = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 30000)', 'speck', 'ship', '0002'], { detached: true, stdio: 'ignore' });
  other.unref();
  const runs = path.join(r.dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(runs, '0002.ship.json'), JSON.stringify({ pid: other.pid, started: new Date().toISOString(), auto: false }));
  try {
    k.check(); k.check();
    assert.equal(k.launches.length, 0, 'waits for the other ship');
  } finally { killAll([other.pid]); }
  assert.ok(await until(() => { k.check(); return k.launches.length === 1; }), 'starts once the other ship has ended');
});

test('0193 AC1: fix tickets ship first, then the one approved earliest; one at a time', () => {
  const order = shipOrder([
    T('0005', { approved: '2026-10-15T12:00:00.000Z' }),
    T('0003', { approved: '2026-10-15T09:00:00.000Z' }),
    T('0009', { type: 'fix', approved: '2026-10-15T13:00:00.000Z' }),
    T('0004', { approved: '2026-10-15T11:00:00.000Z' }),
  ]).map(t => t.id);
  assert.deepEqual(order, ['0009', '0003', '0004', '0005']);
  const r = repo(), k = queue(r);
  k.check([T('0002', { approved: '2026-10-15T12:00:00.000Z' }), T('0003', { approved: '2026-10-15T11:00:00.000Z' })]);
  assert.deepEqual(k.launches.map(l => l.id), ['0003']);
  k.launches[0].done(0);
  k.check([T('0002', { approved: '2026-10-15T12:00:00.000Z' })]);
  assert.deepEqual(k.launches.map(l => l.id), ['0003', '0002'], 'the next one once the first has ended');
});

test('0193 AC2: a refused ticket is tried again only after a new commit on the base branch or its own branch, said once', () => {
  const r = repo(), k = queue(r);
  k.check();
  k.launches[0].done(1);
  for (let i = 0; i < 5; i++) k.check();
  assert.equal(k.launches.length, 1, 'nothing changed: not tried again');
  assert.equal(count(k.said, /0001 didn't ship/), 1, k.said.join('\n'));
  commitTo(r, r.dir, 'notes.txt');
  k.check();
  assert.equal(k.launches.length, 2, 'tried again after a commit on main');
  k.launches[1].done(1);
  k.check();
  assert.equal(k.launches.length, 2);
  commitTo(r, r.wt, 'other.txt');
  k.check();
  assert.equal(k.launches.length, 3, 'tried again after a commit on its branch');
});

test('0193 AC2: an earlier auto-ship that ended without shipping counts as the last try, said once', () => {
  const r = repo(), k = queue(r);
  const runs = path.join(r.dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  const started = new Date(Date.now() + 5000).toISOString();
  fs.writeFileSync(path.join(runs, '0001.ship.json'), JSON.stringify({ pid: 999999, started, auto: true, ended: started, message: 'Tests failed.' }));
  for (let i = 0; i < 3; i++) k.check();
  assert.equal(k.launches.length, 0, 'neither branch changed since that try');
  assert.equal(count(k.said, /0001/), 1, k.said.join('\n'));
  assert.match(k.said[0], /Tests failed\./);
  commitTo(r, r.dir, 'notes.txt');
  k.check();
  assert.equal(k.launches.length, 1);
});

test('0193 AC3: after exit 14, no ship starts until the base branch has a new commit, said once', () => {
  const r = repo(), k = queue(r);
  const two = () => [...statusData(r.dir).tickets, T('0002')];
  k.check(two());
  assert.deepEqual(k.launches.map(l => l.id), ['0001']);
  k.launches[0].done(14);
  commitTo(r, r.wt, 'other.txt'); // 0001's own branch moves, which alone would let it be tried again
  for (let i = 0; i < 4; i++) k.check(two());
  assert.equal(k.launches.length, 1, 'on hold: neither 0001 nor 0002 starts');
  assert.equal(count(k.said, /on hold until main passes/), 1, k.said.join('\n'));
  commitTo(r, r.dir, 'notes.txt');
  k.check(two());
  assert.equal(k.launches.length, 2, 'shipping again after a new commit on main');
});

test('0193 AC4: never ships a ticket auto_ship doesn\'t cover, nor one in any other status', () => {
  for (const o of [{ auto: false }, { risk: 'high' }]) {
    const r = repo(o), k = queue(r);
    k.check();
    assert.equal(k.launches.length, 0, JSON.stringify(o));
  }
  const r = repo(), k = queue(r);
  k.check(['draft', 'ready', 'building', 'reviewing', 'blocked', 'done', 'cancelled'].map((status, i) => T(`000${i + 2}`, { status })));
  k.check([T('0002', { auto_ship: false }), T('0003', { build_running: true })]);
  assert.equal(k.launches.length, 0);
});

test('0193 AC1 AC4: speck run ships with speck ship --auto, and stopping it doesn\'t stop the ship', async () => {
  const r = repo({ test: 'sleep 1' });
  const run = startRun(r.dir);
  try {
    const shipping = path.join(r.dir, 'speck', '.cache', 'runs', '0001.ship.json');
    assert.ok(await until(() => fs.existsSync(shipping)), run.out());
    assert.match(run.out(), /Shipping 0001/);
    await stopRun(run);
    assert.match(run.out(), /0001[^\n]*still running/, run.out());
    // Shipped: done on main, and its branch deleted, which ship does last.
    assert.ok(await until(() => r.statusIn(r.dir) === 'done' && r.sha(BRANCH) === '', 15000), fs.readFileSync(path.join(r.dir, 'speck', '.cache', 'runs', '0001.ship.log'), 'utf8'));
  } finally { await stopRun(run); }
});
