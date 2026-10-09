import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { runRepo, startRun, until, alive, killAll, stopRun, record } from './support/run.mjs';

// ---------- 0047: don't relaunch a build that's still running when speck run restarts ----------

const runsPath = (dir, f) => path.join(dir, 'speck', '.cache', 'runs', f);
const wait = ms => new Promise(res => setTimeout(res, ms));
const count = (text, re) => (text.match(new RegExp(re.source, `${re.flags.replace('g', '')}g`)) || []).length;

// A build left running by an earlier speck run: a process that isn't speck run's child, and its run file.
function leftRunning(dir, id, rec = {}) {
  const p = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 60000)'], { detached: true, stdio: 'ignore' });
  p.unref();
  fs.mkdirSync(runsPath(dir, ''), { recursive: true });
  const full = { id, session: `old-${id}`, cwd: dir, started: '2026-10-09T10:00:00.000Z', pid: p.pid, command: ['claude', id], ...rec };
  fs.writeFileSync(runsPath(dir, `${id}.json`), JSON.stringify(full, null, 2));
  return { pid: p.pid, rec: full };
}
// The pid of a process that has already exited.
const deadPid = () => spawnSync(process.execPath, ['-e', 'process.pid'], { stdio: 'ignore' }).pid;

test('0047 AC1: a ready ticket whose run file has a running pid and no exited is not launched, and is reported once', async () => {
  const r = runRepo();
  const b = leftRunning(r.dir, '0001');
  const run = startRun(r.dir);
  try {
    assert.ok(await until(() => /already being built/i.test(run.out())), run.out());
    await wait(600); // several polls
    assert.deepEqual(r.calls(), [], 'not launched again');
    const out = run.out();
    assert.equal(count(out, /already being built/i), 1, out);
    const line = out.split('\n').find(l => /already being built/i.test(l));
    assert.match(line, /0001/);
    assert.match(line, /old-0001/, 'the session');
    assert.match(line, new RegExp(`\\b${b.pid}\\b`), 'the pid');
  } finally { await stopRun(run); killAll([b.pid, ...r.calls().map(c => c.pid)]); }
});

test('0047 AC2: a build left running counts towards max_parallel_builds while it runs', async () => {
  const r = runRepo({ tickets: [['0001', {}], ['0002', {}]], max: 1 });
  const b = leftRunning(r.dir, '0001');
  const run = startRun(r.dir, { FAKE_MS: '3000' });
  try {
    assert.ok(await until(() => /already being built/i.test(run.out())), run.out());
    await wait(600);
    assert.deepEqual(r.calls(), [], '0002 waits for the one slot');
    process.kill(b.pid, 'SIGKILL');
    assert.ok(await until(() => r.calls().length >= 1), run.out());
    assert.deepEqual(r.calls().map(c => c.args[0]), ['0002'], 'the slot frees when it stops, and 0001 is not relaunched');
  } finally { await stopRun(run); killAll([b.pid, ...r.calls().map(c => c.pid)]); }
});

test('0047 AC3: when a build left running stops, its run file gets exited and exit_code null, keeping the other fields, and speck run says so', async () => {
  const r = runRepo({ tickets: [['0001', { status: 'building' }]] });
  const b = leftRunning(r.dir, '0001', { extra: 'kept' });
  const run = startRun(r.dir);
  try {
    assert.ok(await until(() => /already being built/i.test(run.out())), run.out());
    await wait(300);
    assert.ok(!('exited' in record(r.dir, '0001')), 'nothing added while it runs');
    const before = Date.now();
    process.kill(b.pid, 'SIGKILL');
    assert.ok(await until(() => { try { return 'exited' in record(r.dir, '0001'); } catch { return false; } }), run.out());
    const rec = record(r.dir, '0001');
    assert.equal(rec.exit_code, null);
    assert.ok('exit_code' in rec);
    assert.ok(/T.*Z$/.test(rec.exited) && Date.parse(rec.exited) >= before - 1000, `the time it noticed: ${rec.exited}`);
    const { exited, exit_code, ...rest } = rec;
    assert.deepEqual(rest, b.rec, 'the other fields are kept');
    assert.ok(await until(() => /0001[^\n]*stopped/i.test(run.out())), run.out());
    assert.match(run.out().split('\n').find(l => /0001[^\n]*stopped/i.test(l)), /old-0001/, 'the session');
    assert.equal(run.child.exitCode, null, 'speck run keeps going');
  } finally { await stopRun(run); killAll([b.pid]); }
});

test('0047 AC4: a build left running that stops with its ticket still ready is reported with the last five log lines, and not launched again', async () => {
  const r = runRepo();
  const b = leftRunning(r.dir, '0001');
  fs.writeFileSync(runsPath(r.dir, '0001.log'), `${Array.from({ length: 7 }, (_, i) => `log line ${i + 1}`).join('\n')}\n\n`);
  const run = startRun(r.dir);
  try {
    assert.ok(await until(() => /already being built/i.test(run.out())), run.out());
    process.kill(b.pid, 'SIGKILL');
    assert.ok(await until(() => /0001 is still ready/i.test(run.out())), run.out());
    await wait(600);
    const out = run.out();
    const tail = out.slice(out.search(/0001 is still ready/i));
    for (let i = 3; i <= 7; i++) assert.match(tail, new RegExp(`log line ${i}\\b`), out);
    assert.doesNotMatch(tail, /log line [12]\b/, 'only the last five');
    assert.match(tail, /won't launch it again/i);
    assert.deepEqual(r.calls(), [], 'not launched again');
  } finally { await stopRun(run); killAll([b.pid, ...r.calls().map(c => c.pid)]); }
});

test('0047 AC5: a run file whose pid is not running and has no exited gets exited and exit_code null at start, and the ticket is treated as now', async () => {
  const r = runRepo({ tickets: [['0001', {}], ['0002', { status: 'draft' }], ['0003', { status: 'building' }]], max: 3 });
  fs.mkdirSync(runsPath(r.dir, ''), { recursive: true });
  const dead = deadPid();
  assert.ok(!alive(dead));
  for (const id of ['0001', '0002'])
    fs.writeFileSync(runsPath(r.dir, `${id}.json`), JSON.stringify({ id, session: `old-${id}`, started: '2026-10-09T10:00:00.000Z', pid: dead, command: ['x'] }));
  // pid null: speck run stopped before the build started.
  fs.writeFileSync(runsPath(r.dir, '0003.json'), JSON.stringify({ id: '0003', session: 'old-0003', started: '2026-10-09T10:00:00.000Z', pid: null }));
  const run = startRun(r.dir, { FAKE_MS: '3000' });
  try {
    assert.ok(await until(() => r.calls().length >= 1), run.out());
    for (const id of ['0002', '0003']) {
      const rec = record(r.dir, id);
      assert.ok(typeof rec.exited === 'string' && !Number.isNaN(Date.parse(rec.exited)), `${id}: ${JSON.stringify(rec)}`);
      assert.equal(rec.exit_code, null);
      assert.equal(rec.session, `old-${id}`, 'other fields kept');
    }
    await wait(400);
    assert.deepEqual(r.calls().map(c => c.args[0]), ['0001'], 'the ready ticket is launched as before');
    assert.doesNotMatch(run.out(), /already being built/i);
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});

test('0047 AC5: a run file that already has exited, or is not JSON, is left as it is', async () => {
  const r = runRepo({ tickets: [['0001', { status: 'draft' }], ['0002', { status: 'draft' }]] });
  fs.mkdirSync(runsPath(r.dir, ''), { recursive: true });
  const done = JSON.stringify({ id: '0001', session: 's', pid: deadPid(), exited: '2026-10-09T10:05:00.000Z', exit_code: 2 });
  fs.writeFileSync(runsPath(r.dir, '0001.json'), done);
  fs.writeFileSync(runsPath(r.dir, '0002.json'), 'not json');
  const run = startRun(r.dir);
  try {
    assert.ok(await until(() => /watching/i.test(run.out())), run.out());
    await wait(400);
    assert.equal(fs.readFileSync(runsPath(r.dir, '0001.json'), 'utf8'), done);
    assert.equal(fs.readFileSync(runsPath(r.dir, '0002.json'), 'utf8'), 'not json');
    assert.doesNotMatch(run.out(), /\.mjs:\d+/, 'no stack trace');
  } finally { await stopRun(run); }
});

test('0047 AC1: a run file with no session still reports the build plainly', async () => {
  const r = runRepo();
  const b = leftRunning(r.dir, '0001', { session: undefined });
  const run = startRun(r.dir);
  try {
    assert.ok(await until(() => /already being built/i.test(run.out())), run.out());
    assert.doesNotMatch(run.out(), /undefined/);
    assert.deepEqual(r.calls(), []);
  } finally { await stopRun(run); killAll([b.pid]); }
});
