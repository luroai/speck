import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { CLI, env, runRepo, startRun, until, killAll, stopRun, record } from './support/run.mjs';
import { panelModel, T } from './support/panel.mjs';

// ---------- 0110: recover a build that was killed ----------

const runsPath = (dir, f) => path.join(dir, 'speck', '.cache', 'runs', f);
const wait = ms => new Promise(res => setTimeout(res, ms));
const deadPid = () => spawnSync(process.execPath, ['-e', 'process.pid'], { stdio: 'ignore' }).pid;
const speck = (dir, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env });
const statusOf = (dir, id) => JSON.parse(speck(dir, 'status', '--json').stdout).tickets.find(t => t.id === id);

// A fake build that can be resumed: records its arguments, folder, pid and build session in <out>/<n>.json, prints a
// line, then stays alive for FAKE_MS (default 0) and exits with FAKE_EXIT (default 0), or is stopped by FAKE_SIGNAL.
const FAKE = `
const fs = require('fs'), path = require('path');
const [out, ...args] = process.argv.slice(2);
let n = 0; while (fs.existsSync(path.join(out, n + '.json'))) n++;
fs.writeFileSync(path.join(out, n + '.json'), JSON.stringify({ at: Date.now(), args, cwd: process.cwd(), pid: process.pid, build: process.env.SPECK_BUILD_SESSION }));
console.log('fake build ' + n);
setTimeout(() => process.env.FAKE_SIGNAL ? process.kill(process.pid, process.env.FAKE_SIGNAL) : process.exit(+(process.env.FAKE_EXIT || 0)), +(process.env.FAKE_MS || 0));
`;

// A repo whose build_command resumes, with ticket 0001 in `status` and, unless `rec` is null, a run record of a build
// whose process has gone and that has no exit, as a killed build leaves it.
function killedRepo({ status = 'building', rec = {}, log = 'first build line\n' } = {}) {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'fake-out-'));
  const fake = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fake-')), 'fake-build.cjs');
  fs.writeFileSync(fake, FAKE);
  const r = runRepo({ tickets: [['0001', { status }]], command: `"${process.execPath}" "${fake}" "${out}" "/speck-build {id}" --session-id {session}` });
  const session = crypto.randomUUID();
  const full = rec === null ? null : { id: '0001', session, cwd: r.dir, started: '2026-10-10T10:00:00.000Z', pid: deadPid(), command: ['claude', '-p', '/speck-build 0001'], ...rec };
  fs.mkdirSync(runsPath(r.dir, ''), { recursive: true });
  if (full) fs.writeFileSync(runsPath(r.dir, '0001.json'), JSON.stringify(full, null, 2));
  if (log !== null) fs.writeFileSync(runsPath(r.dir, '0001.log'), log);
  const calls = () => fs.readdirSync(out).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(out, f), 'utf8'))).sort((a, b) => a.at - b.at);
  return { ...r, out, session, rec: full, calls };
}

test('0110 AC1: a building or reviewing ticket whose build has no exit and whose process has gone is build_stopped in speck status --json', () => {
  for (const status of ['building', 'reviewing']) {
    const r = killedRepo({ status });
    const t = statusOf(r.dir, '0001');
    assert.equal(t.build_stopped, true, status);
    assert.equal(t.build_running, false, status);
  }
});

test('0110 AC1: a running build, one with an exit, and a ticket not in hand are not build_stopped', () => {
  const live = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 30000)'], { detached: true, stdio: 'ignore' });
  live.unref();
  try {
    assert.equal(statusOf(killedRepo({ rec: { pid: live.pid } }).dir, '0001').build_stopped, false, 'still running');
    assert.equal(statusOf(killedRepo({ rec: { exited: '2026-10-10T10:05:00.000Z', exit_code: 1 } }).dir, '0001').build_stopped, false, 'exited');
    for (const status of ['ready', 'blocked', 'approved'])
      assert.equal(statusOf(killedRepo({ status }).dir, '0001').build_stopped, false, status);
    assert.equal(statusOf(killedRepo({ rec: { pid: null } }).dir, '0001').build_stopped, false, 'never started');
  } finally { killAll([live.pid]); }
});

test('0110 AC1: speck status says the build stopped unexpectedly, with the command to resume it', () => {
  const r = killedRepo();
  const out = speck(r.dir, 'status').stdout;
  assert.match(out, /0001[^\n]*\n\s*! Build stopped unexpectedly\./, out);
  assert.match(out, new RegExp(`claude --resume ${r.session}`), out);
  const fine = killedRepo({ rec: { exited: '2026-10-10T10:05:00.000Z', exit_code: 0 } });
  assert.doesNotMatch(speck(fine.dir, 'status').stdout, /stopped unexpectedly/);
});

test('0110 AC1: the panel shows a killed build as "Build stopped unexpectedly", red and not at work', () => {
  const model = panelModel();
  const session = { id: 'abc-123', cwd: '/repo' };
  const m = model({ tickets: [T('0001', 'building', { build_stopped: true, build_running: false, session }), T('0002', 'reviewing', { build_stopped: true, session }), T('0003', 'building', { build_running: true, session })], resume_command: 'claude --resume {session}' });
  const [a, b, c] = m.queue;
  for (const q of [a, b]) {
    assert.equal(q.exit_label, 'Build stopped unexpectedly', q.id);
    assert.equal(q.red, true, `${q.id}: red, so its dot doesn't move`);
    assert.equal(q.pausable, false);
    assert.equal(q.exit_message, null);
  }
  assert.equal(c.exit_label, null, 'a running build is in progress');
  assert.equal(c.red, false);
});

test('0110 AC2: speck run resumes a killed build once, in its own session and folder, telling it to carry on', async () => {
  const r = killedRepo();
  const run = startRun(r.dir, { FAKE_MS: '5000' });
  try {
    assert.ok(await until(() => r.calls().length >= 1), run.out());
    const c = r.calls()[0];
    const at = c.args.indexOf('--resume');
    assert.ok(at >= 0 && c.args[at + 1] === r.session, `continues the same session: ${JSON.stringify(c.args)}`);
    assert.ok(!c.args.includes('--session-id'), 'not a new session');
    const message = c.args.find(a => /stopped unexpectedly/i.test(a));
    assert.ok(message, `a message saying it was stopped: ${JSON.stringify(c.args)}`);
    assert.match(message, /carry on/i);
    assert.match(message, /0001/);
    assert.equal(fs.realpathSync(c.cwd), fs.realpathSync(r.dir), 'from the folder its session started in');
    assert.equal(c.build, r.session, 'its processes carry its session, as pause and stop look for');
    assert.match(run.out(), /0001[^\n]*resum/i, run.out());
    await wait(300);
    assert.equal(r.calls().length, 1, 'resumed once');
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});

test('0110 AC2: the resumed build logs to the same log and keeps its record, which the panel, pause and play use as for any build', async () => {
  const r = killedRepo();
  const run = startRun(r.dir, { FAKE_MS: '8000' });
  try {
    assert.ok(await until(() => r.calls().length >= 1 && record(r.dir, '0001').pid === r.calls()[0].pid), run.out());
    assert.ok(await until(() => /fake build/.test(fs.readFileSync(runsPath(r.dir, '0001.log'), 'utf8'))), 'the resumed build writes to the log');
    const log = fs.readFileSync(runsPath(r.dir, '0001.log'), 'utf8');
    assert.ok(log.startsWith('first build line\n'), `appended, not replaced: ${log}`);
    const rec = record(r.dir, '0001');
    for (const k of ['id', 'session', 'cwd', 'started', 'command']) assert.deepEqual(rec[k], r.rec[k], k);
    assert.ok(!('exited' in rec));
    assert.ok(!Number.isNaN(Date.parse(rec.resumed)), 'marked resumed');
    const t = statusOf(r.dir, '0001');
    assert.equal(t.build_running, true, 'running again');
    assert.equal(t.build_stopped, false);
    assert.equal(t.session.id, r.session);
    if (process.platform !== 'win32') {
      assert.equal(speck(r.dir, 'pause', '0001').status, 0, 'pause works');
      assert.equal(statusOf(r.dir, '0001').paused, true);
      assert.equal(speck(r.dir, 'play', '0001').status, 0, 'play works');
    }
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});

test('0110 AC2: a build that speck run launched and that is then killed is resumed by the same speck run', async () => {
  // Launched while ready, then set building as its build would, then killed.
  const r = killedRepo({ status: 'ready', rec: null, log: null });
  const file = path.join(r.dir, 'speck', 'tickets', '0001-t.md');
  const run = startRun(r.dir, { FAKE_MS: '600', FAKE_SIGNAL: 'SIGKILL' });
  try {
    assert.ok(await until(() => r.calls().length >= 1), run.out());
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/^status: ready$/m, 'status: building'));
    assert.ok(await until(() => r.calls().length >= 2, 10000), run.out());
    assert.ok(r.calls()[1].args.includes('--resume'), JSON.stringify(r.calls()[1].args));
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});

test('0110 AC3: a resumed build killed again is not resumed a second time, and shows as stopped with the command to resume it', async () => {
  const r = killedRepo();
  const run = startRun(r.dir, { FAKE_MS: '400', FAKE_SIGNAL: 'SIGKILL' });
  try {
    assert.ok(await until(() => r.calls().length >= 1), run.out());
    assert.ok(await until(() => /won't resume it again/i.test(run.out())), run.out());
    await wait(500);
    assert.equal(r.calls().length, 1, 'not resumed a second time');
    const line = run.out().split('\n').find(l => /won't resume it again/i.test(l));
    assert.match(line, new RegExp(`claude --resume ${r.session}`), line);
    assert.equal(statusOf(r.dir, '0001').build_stopped, true, 'still shows as stopped');
    assert.match(speck(r.dir, 'status').stdout, /Build stopped unexpectedly/);
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});

test('0110 AC3: a later speck run does not resume a build that was resumed before', async () => {
  const r = killedRepo({ rec: { resumed: '2026-10-10T10:30:00.000Z' } });
  const run = startRun(r.dir, { FAKE_MS: '3000' });
  try {
    assert.ok(await until(() => /won't resume it again/i.test(run.out())), run.out());
    await wait(400);
    assert.deepEqual(r.calls(), []);
    assert.ok(!('exited' in record(r.dir, '0001')), 'left as stopped');
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});

test('0110 AC3: the panel shows the command to resume a killed build', () => {
  const m = panelModel()({ tickets: [T('0001', 'building', { build_stopped: true, session: { id: 'abc-123', cwd: '/repo' } })], resume_command: 'claude --resume {session}' });
  assert.deepEqual(m.queue[0].resume, { text: 'cd /repo && claude --resume abc-123', command: true });
});

test('0110 AC4: a build ended by speck stop is never resumed', async () => {
  const r = killedRepo();
  fs.writeFileSync(runsPath(r.dir, '0001.stopped'), JSON.stringify({ session: r.session, pid: r.rec.pid, stopped: '2026-10-10T10:10:00.000Z', ticket_commit: null }));
  assert.equal(statusOf(r.dir, '0001').build_stopped, false);
  const run = startRun(r.dir, { FAKE_MS: '3000' });
  try {
    assert.ok(await until(() => { try { return 'exited' in record(r.dir, '0001'); } catch { return false; } }), run.out());
    await wait(400);
    assert.deepEqual(r.calls(), []);
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});

test('0110 AC4: a build that exited by itself is never resumed, whether or not speck run saw it exit', async () => {
  const withExit = killedRepo({ rec: { exited: '2026-10-10T10:05:00.000Z', exit_code: 1 } });
  // speck run wasn't running when it ended: its stream-json log ends with the result a build writes as it ends.
  const withResult = killedRepo({ log: `${JSON.stringify({ type: 'system' })}\n${JSON.stringify({ type: 'result', subtype: 'success', result: 'Done.' })}\n` });
  assert.equal(statusOf(withResult.dir, '0001').build_stopped, false);
  for (const r of [withExit, withResult]) {
    const run = startRun(r.dir, { FAKE_MS: '3000' });
    try {
      assert.ok(await until(() => /watching/i.test(run.out())), run.out());
      await wait(500);
      assert.deepEqual(r.calls(), [], run.out());
    } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
  }
});

test('0110 AC4: a resumed build that exits by itself gets its exit recorded and is not resumed again', async () => {
  const r = killedRepo();
  const run = startRun(r.dir, { FAKE_MS: '200', FAKE_EXIT: '3' });
  try {
    assert.ok(await until(() => { try { return record(r.dir, '0001').exit_code === 3; } catch { return false; } }), run.out());
    await wait(500);
    assert.equal(r.calls().length, 1);
    assert.equal(statusOf(r.dir, '0001').build_stopped, false);
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});

test('0110 AC2: a killed build whose session is already resumed by hand is not resumed again', async () => {
  const r = killedRepo();
  const byHand = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 30000)', '--', '--resume', r.session], { detached: true, stdio: 'ignore' });
  byHand.unref();
  const run = startRun(r.dir, { FAKE_MS: '3000' });
  try {
    assert.ok(await until(() => /watching/i.test(run.out())), run.out());
    await wait(500);
    assert.deepEqual(r.calls(), [], run.out());
  } finally { await stopRun(run); killAll([byHand.pid, ...r.calls().map(c => c.pid)]); }
});

test('0110 AC2: a build_command speck run can\'t turn into a resume leaves the build stopped, saying how to resume it', async () => {
  const r = killedRepo();
  fs.writeFileSync(r.cfgFile, fs.readFileSync(r.cfgFile, 'utf8').replace(/ --session-id \{session\}/, ' {session}'));
  const run = startRun(r.dir, { FAKE_MS: '3000' });
  try {
    assert.ok(await until(() => /can't resume it/i.test(run.out())), run.out());
    assert.match(run.out(), new RegExp(`claude --resume ${r.session}`));
    await wait(300);
    assert.deepEqual(r.calls(), []);
    assert.doesNotMatch(run.out(), /\.mjs:\d+/, 'no stack trace');
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});
