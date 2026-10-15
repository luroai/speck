import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { shipRepo, BRANCH, CLI, env } from './support/ship.mjs';
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

// A ship of ticket `id` started outside speck run: a live `speck ship <id>` process, and its ship record naming it.
function otherShip(r, id) {
  const p = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 30000)', 'speck', 'ship', id], { detached: true, stdio: 'ignore' });
  p.unref();
  const runs = path.join(r.dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(runs, `${id}.ship.json`), JSON.stringify({ pid: p.pid, started: new Date().toISOString(), auto: false }));
  return p.pid;
}

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
  const pid = otherShip(r, '0002');
  try {
    k.check(); k.check();
    assert.equal(k.launches.length, 0, 'waits for the other ship');
  } finally { killAll([pid]); }
  assert.ok(await until(() => { k.check(); return k.launches.length === 1; }), 'starts once the other ship has ended');
});

// The repo's ship lock, held by a live `speck ship <id>` process as a ship that has it is.
function lockHeld(r, id) {
  const p = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 30000)', 'speck', 'ship', id], { detached: true, stdio: 'ignore' });
  p.unref();
  const runs = path.join(r.dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(runs, 'ship.lock'), JSON.stringify({ pid: p.pid, started: new Date().toISOString(), id }));
  return p.pid;
}

test('0193 AC1: a ship speck run starts changes nothing and exits 15 if another ship is running as it starts', () => {
  const r = repo();
  const before = r.snapshot();
  const pid = lockHeld(r, '0002');
  try {
    const s = spawnSync(process.execPath, [CLI, 'ship', '0001', '--auto'], { cwd: r.dir, encoding: 'utf8', env: { ...env, SPECK_SHIP_ALONE: '1' } });
    assert.equal(s.status, 15, s.stdout + s.stderr);
    assert.match(s.stderr, /Another ship is running/);
    assert.deepEqual(r.snapshot(), before, 'nothing changed');
    assert.ok(!fs.existsSync(path.join(r.dir, 'speck', '.cache', 'runs', '0001.ship.json')), 'its ship record is gone, so the panel shows no ship');
  } finally { killAll([pid]); }
});

test('0193 AC1: any other ship started while a ship has the lock waits for it to finish, then ships', async () => {
  const r = repo();
  const pid = lockHeld(r, '0002'); // speck run's ship of 0002, which checked first
  const child = spawn(process.execPath, [CLI, 'ship', '0001'], { cwd: r.dir, env: { ...env, SPECK_SHIP_POLL_MS: '50' } });
  let out = '';
  child.stdout.on('data', d => { out += d; }); child.stderr.on('data', d => { out += d; });
  const exited = new Promise(res => child.on('exit', res));
  try {
    assert.ok(await until(() => /0002's ship is running in this repo, so this ship is waiting/.test(out)), out);
    await new Promise(res => setTimeout(res, 300));
    assert.equal(r.statusIn(r.wt), 'approved', 'not shipped while the other ship runs');
  } finally { killAll([pid]); }
  assert.equal(await exited, 0, out);
  assert.equal(count(out.split('\n'), /is waiting/), 1, 'said once');
  assert.equal(r.statusIn(r.dir), 'done');
  assert.ok(!fs.existsSync(path.join(r.dir, 'speck', '.cache', 'runs', 'ship.lock')), 'the lock is released');
});

test('0193 AC1: a ship lock whose ship has gone is taken over', () => {
  const r = repo();
  const runs = path.join(r.dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(runs, 'ship.lock'), JSON.stringify({ pid: 999999, started: '2026-10-15T10:00:00.000Z', id: '0002' }));
  const s = spawnSync(process.execPath, [CLI, 'ship', '0001', '--auto'], { cwd: r.dir, encoding: 'utf8', env: { ...env, SPECK_SHIP_ALONE: '1' } });
  assert.equal(s.status, 0, s.stdout + s.stderr);
  assert.equal(r.statusIn(r.dir), 'done');
});

test('0193 AC1: a ship that exited 15 is not a try: no refusal is said, and it is tried again', () => {
  const r = repo(), k = queue(r);
  k.check();
  k.launches[0].done(15);
  assert.equal(count(k.said, /didn't ship/), 0, k.said.join('\n'));
  k.check();
  assert.equal(k.launches.length, 2);
});

test('0193 AC1: speck run\'s ship doesn\'t pass SPECK_SHIP_ALONE on to the tests it runs', () => {
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'env-')), 'env.txt');
  const r = repo({ test: `env > ${out}` });
  const s = spawnSync(process.execPath, [CLI, 'ship', '0001', '--auto'], { cwd: r.dir, encoding: 'utf8', env: { ...env, SPECK_SHIP_ALONE: '1' } });
  assert.equal(s.status, 0, s.stdout + s.stderr);
  assert.doesNotMatch(fs.readFileSync(out, 'utf8'), /SPECK_SHIP_ALONE/);
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
  const two = () => [...statusData(r.dir).tickets, T('0002', { approved: '2999-01-01T00:00:00.000Z' })]; // approved after 0001
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

test('0193 AC3: the hold is on the base branch as the ship ended, so commits made while it ran don\'t lift it', () => {
  const r = repo(), k = queue(r);
  k.check([T('0002')]);
  commitTo(r, r.dir, 'notes.txt'); // made while the ship ran, which tested it and found it failing
  k.launches[0].done(14);
  for (let i = 0; i < 3; i++) k.check([T('0002'), T('0003')]);
  assert.equal(k.launches.length, 1, 'still on hold');
  commitTo(r, r.dir, 'notes.txt');
  k.check([T('0002'), T('0003')]);
  assert.equal(k.launches.length, 2);
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
