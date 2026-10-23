// 0217: a build that stops before finishing leaves its ticket waiting for you, so its timer stops at when it stopped,
// and the stretch until a build of it starts again is left out of its build time.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { T, round, panelModel, panelRepo, fakePage, queueRows, openQueueRows } from './support/panel.mjs';
import { runsPath, speck, json } from './support/ticker.mjs';
import { runRepo, startRun, until, stopRun, record, killAll } from './support/run.mjs';
import { parseTicket, statusData } from '../scripts/speck.mjs';

const NOW = Date.parse('2026-10-15T12:00:00.000Z');
const iso = ms => new Date(ms).toISOString();
const ago = m => iso(NOW - m * 60000);
const realAgo = s => iso(Date.now() - s * 1000);
const clock = start => {
  const c = { now: start };
  c.Date = class extends Date { constructor(...a) { super(...(a.length ? a : [c.now])); } static now() { return c.now; } };
  return c;
};
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const subOf = (p, id) => p.all(rowOf(p, id)).find(n => n.className === 'sub');
const tick = async (p, c, ms) => { c.now += ms; for (const { fn } of p.intervals.values()) fn(); await p.settle(); };
const fmOf = file => parseTicket(fs.readFileSync(file, 'utf8')).fm;
const near = (actual, expected, msg) => assert.ok(Math.abs(actual - expected) <= 5, `${msg}: ${actual} isn't about ${expected}`);
const deadPid = () => spawnSync(process.execPath, ['-e', 'process.pid'], { stdio: 'ignore' }).pid;
const ticketOf = (dir, id = '0001') => statusData(dir).tickets.find(t => t.id === id);

// A panel repo with ticket 0001 building and a run record from speck run for it: `rec` is added to a build whose
// process has gone, with no exit, as a killed build leaves it.
function stoppedRepo(rec = {}, status = 'building') {
  const r = panelRepo();
  assert.equal(r.run('set', '1', 'status', status).status, 0);
  r.g('commit', '-qam', status);
  const full = { id: '0001', session: crypto.randomUUID(), cwd: r.dir, started: realAgo(1200), pid: deadPid(), command: ['claude', '-p', '/speck-build 0001'], ...rec };
  fs.mkdirSync(runsPath(r.dir, ''), { recursive: true });
  fs.writeFileSync(runsPath(r.dir, '0001.json'), JSON.stringify(full, null, 2));
  return { ...r, rec: full };
}
// Moves the time speck noticed a killed build back, as if that much time had gone by since.
const backdateMark = (dir, seconds) => {
  const file = runsPath(dir, '0001.waiting');
  fs.writeFileSync(file, JSON.stringify({ ...JSON.parse(fs.readFileSync(file, 'utf8')), since: realAgo(seconds) }));
};

// ---------- AC1: a build that exited before finishing ----------

test('0217 AC1: a ticket whose build stopped before finishing has its timer stop at the exit, less waiting, and not count up', async () => {
  const c = clock(NOW);
  const t = T('0001', 'building', { started: ago(13), waited_seconds: 60, build_exit: { at: ago(3), code: 1, message: 'gone' } });
  const p = fakePage([{ tickets: [t], ideas: [] }], { Date: c.Date });
  await p.settle();
  await openQueueRows(p); // 0434: what's under a Build card's two lines shows while it's open
  assert.match(p.all(rowOf(p, '0001')).map(n => n._text || '').join(' '), /Build stopped before finishing/);
  assert.equal(subOf(p, '0001').textContent, '09:00');
  await tick(p, c, 5000);
  assert.equal(subOf(p, '0001').textContent, '09:00', 'it has stopped');
});

test('0217 AC1: a reviewing ticket\'s stopped build holds its timer too', () => {
  const m = panelModel()({ tickets: [T('0001', 'reviewing', { started: iso(Date.now() - 10 * 60000), build_exit: { at: iso(Date.now() - 4 * 60000), code: 0 } })], ideas: [] });
  assert.equal(m.queue[0].exit_label, 'Build stopped before finishing');
  assert.equal(m.queue[0].counter, '06:00');
  assert.notEqual(m.queue[0].held_at, null);
});

// ---------- AC2: a build that was killed ----------

test('0217 AC2: a killed build\'s stop is recorded when speck first notices it, and stays the same after', () => {
  const r = stoppedRepo();
  const first = ticketOf(r.dir);
  assert.equal(first.build_stopped, true);
  assert.ok(Math.abs(Date.parse(first.build_stopped_at) - Date.now()) < 10000, `noticed now: ${first.build_stopped_at}`);
  backdateMark(r.dir, 300);
  const again = ticketOf(r.dir).build_stopped_at;
  near((Date.now() - Date.parse(again)) / 1000, 300, 'the time first noticed, not now');
  // A panel restart reads it afresh, in a new process.
  assert.equal(json(r.dir).tickets.find(t => t.id === '0001').build_stopped_at, again);
});

test('0217 AC2: a mark left by an earlier build of the ticket is not its stop', () => {
  const r = stoppedRepo();
  fs.writeFileSync(runsPath(r.dir, '0001.waiting'), JSON.stringify({ session: r.rec.session, pid: r.rec.pid + 1, since: realAgo(900) }));
  assert.ok(Math.abs(Date.parse(ticketOf(r.dir).build_stopped_at) - Date.now()) < 10000, 'noticed now');
});

test('0217 AC2: a ticket shown as "Build stopped unexpectedly" has its timer stop at when speck noticed and not count up', async () => {
  const c = clock(NOW);
  const t = T('0001', 'building', { started: ago(10), waited_seconds: 60, build_stopped: true, build_stopped_at: ago(2) });
  const p = fakePage([{ tickets: [t], ideas: [] }], { Date: c.Date });
  await p.settle();
  await openQueueRows(p); // 0434: what's under a Build card's two lines shows while it's open
  assert.match(p.all(rowOf(p, '0001')).map(n => n._text || '').join(' '), /Build stopped unexpectedly/);
  assert.equal(subOf(p, '0001').textContent, '07:00');
  await tick(p, c, 5000);
  assert.equal(subOf(p, '0001').textContent, '07:00', 'it has stopped');
});

// ---------- AC3: the build starting again ----------

test('0217 AC3: starting a stopped build again by hand adds the stretch since its exit to waited_seconds, once, committed', () => {
  const r = stoppedRepo({ exited: realAgo(600), exit_code: 1 });
  assert.equal(ticketOf(r.dir).build_exit !== null, true, 'stopped before finishing');
  const s = r.run('start', '1');
  assert.notEqual(s.status, 0, 'a building ticket isn\'t started again');
  assert.doesNotMatch(s.stdout + s.stderr, /\n\s+at /, 'no stack trace');
  near(fmOf(r.file).waited_seconds, 600, 'the stopped stretch');
  assert.equal(r.g('status', '--porcelain', '--', 'speck/tickets'), '', 'the ticket is committed');
  const t = ticketOf(r.dir);
  assert.equal(t.build_exit, null, 'no longer shown as stopped');
  assert.equal(t.build_stopped, false);
  const m = panelModel()({ tickets: [t], ideas: [] });
  assert.equal(m.queue[0].held_at, null, 'its timer counts on');
  r.run('start', '1');
  near(fmOf(r.file).waited_seconds, 600, 'added once');
});

test('0217 AC3: starting a killed build again by hand adds the stretch since speck noticed it', () => {
  const r = stoppedRepo();
  ticketOf(r.dir);
  backdateMark(r.dir, 300);
  r.run('start', '1');
  near(fmOf(r.file).waited_seconds, 300, 'the stopped stretch');
  const t = ticketOf(r.dir);
  assert.equal(t.build_stopped, false);
  assert.equal(t.build_stopped_at, null);
});

// A fake build that can be resumed: notes that it ran in `out`, then exits.
const FAKE = "require('fs').writeFileSync(require('path').join(process.argv[2], String(process.pid)), '')";

test('0217 AC3: speck run resuming a killed build adds the stretch since speck noticed it to waited_seconds', async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'fake-out-'));
  const fake = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fake-')), 'fake-build.cjs');
  fs.writeFileSync(fake, FAKE);
  const r = runRepo({ tickets: [['0001', { status: 'building', started: `"${realAgo(1200)}"` }]], command: `"${process.execPath}" "${fake}" "${out}" "/speck-build {id}" --session-id {session}` });
  const file = path.join(r.dir, 'speck', 'tickets', '0001-t.md');
  fs.mkdirSync(runsPath(r.dir, ''), { recursive: true });
  const session = crypto.randomUUID(), pid = deadPid();
  fs.writeFileSync(runsPath(r.dir, '0001.json'), JSON.stringify({ id: '0001', session, cwd: r.dir, started: realAgo(1200), pid, command: ['claude'] }));
  fs.writeFileSync(runsPath(r.dir, '0001.waiting'), JSON.stringify({ session, pid, since: realAgo(240) }));
  const run = startRun(r.dir);
  try {
    assert.ok(await until(() => { try { return !!record(r.dir, '0001').resumed; } catch { return false; } }), run.out());
  } finally { await stopRun(run); }
  near(fmOf(file).waited_seconds, 240, 'the stopped stretch');
  assert.equal(r.g('status', '--porcelain', '--', 'speck/tickets'), '', 'the ticket is committed');
});

test('0217 AC3: the stopped stretch is left out of the time to approval and the shipped minutes', () => {
  const m = panelModel()({ tickets: [
    T('0001', 'approved', { started: iso(Date.now() - 40 * 60000), approved: iso(Date.now() - 5 * 60000), waited_seconds: 900 }),
    T('0002', 'done', { started: ago(40), approved: ago(5), finished: ago(1), waited_seconds: 900, rounds: [round(1, 10)] }),
  ], ideas: [] });
  assert.equal(m.queue[0].counter, '20:00');
  assert.equal(m.shipped.find(t => t.id === '0002').minutes, 20);
});

// ---------- AC4: running, blocked and paused builds as today ----------

test('0217 AC4: a running build is not stopped, and its timer counts on', () => {
  const live = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 30000)'], { detached: true, stdio: 'ignore' });
  live.unref();
  try {
    const r = stoppedRepo({ pid: live.pid });
    const t = ticketOf(r.dir);
    assert.equal(t.build_stopped, false);
    assert.equal(t.build_stopped_at, null);
    assert.equal(fs.existsSync(runsPath(r.dir, '0001.waiting')), false, 'nothing noticed');
    r.run('start', '1');
    assert.equal(fmOf(r.file).waited_seconds, undefined, 'nothing added');
  } finally { killAll([live.pid]); }
});

test('0217 AC4: a blocked ticket whose build exited stops at when it blocked, and a paused one at its pause', () => {
  const m = panelModel()({ tickets: [
    T('0001', 'blocked', { started: iso(Date.now() - 10 * 60000), blocked_at: iso(Date.now() - 2 * 60000), build_exit: { at: iso(Date.now() - 1 * 60000), code: 0 } }),
    T('0002', 'building', { started: iso(Date.now() - 5 * 60000), build_running: true, paused: true, paused_at: iso(Date.now() - 60000) }),
    T('0003', 'building', { started: iso(Date.now() - 5 * 60000), build_running: true }),
  ], ideas: [] });
  const by = id => m.queue.find(t => t.id === id);
  assert.equal(by('0001').counter, '08:00');
  assert.equal(by('0002').counter, '04:00');
  assert.equal(by('0003').held_at, null);
  assert.equal(by('0003').counter, '05:00');
});

test('0217 AC4: a blocked or approved ticket with a killed build notices nothing', () => {
  for (const status of ['blocked', 'approved']) {
    const r = stoppedRepo({}, status);
    assert.equal(ticketOf(r.dir).build_stopped_at, null, status);
    assert.equal(fs.existsSync(runsPath(r.dir, '0001.waiting')), false, status);
  }
});

// ---------- self-check ----------

test('0217 AC3: a stopped time that can\'t be written to the ticket says so, changes nothing and stays stopped', () => {
  const r = stoppedRepo({ exited: realAgo(600), exit_code: 1 });
  fs.chmodSync(r.file, 0o444);
  try {
    const s = r.run('start', '1');
    assert.match(s.stdout, /time its stopped build waited couldn't be recorded/);
    assert.doesNotMatch(s.stdout + s.stderr, /\n\s+at /, 'no stack trace');
    assert.equal(fmOf(r.file).waited_seconds, undefined);
    assert.notEqual(ticketOf(r.dir).build_exit, null, 'still shown as stopped');
  } finally { fs.chmodSync(r.file, 0o644); }
  r.run('start', '1');
  near(fmOf(r.file).waited_seconds, 600, 'counted once it can be written');
});

// ---------- review round 1 ----------

test('0217 AC3: a killed build resumed by hand in its own session counts the stretch once, and its next stop is noticed afresh', () => {
  const r = stoppedRepo();
  ticketOf(r.dir);
  backdateMark(r.dir, 300);
  const resumed = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 30000)', r.rec.session], { detached: true, stdio: 'ignore' });
  resumed.unref();
  try {
    r.run('start', '1');
    near(fmOf(r.file).waited_seconds, 300, 'the stopped stretch');
    r.run('start', '1');
    near(fmOf(r.file).waited_seconds, 300, 'added once');
    assert.equal(r.g('status', '--porcelain', '--', 'speck/tickets'), '', 'the ticket is committed');
  } finally { killAll([resumed.pid]); }
  assert.ok(Math.abs(Date.parse(ticketOf(r.dir).build_stopped_at) - Date.now()) < 10000, 'the resumed session stopping is noticed now');
});

test('0217 AC3: a stop that can\'t be marked counted adds nothing, and is counted once when it can be', () => {
  const r = stoppedRepo({ exited: realAgo(600), exit_code: 1 });
  const runs = runsPath(r.dir, '');
  fs.chmodSync(runs, 0o555);
  try {
    const s = r.run('start', '1');
    assert.match(s.stdout, /time its stopped build waited couldn't be recorded/);
    assert.equal(fmOf(r.file).waited_seconds, undefined, 'nothing added');
    r.run('start', '1');
    assert.equal(fmOf(r.file).waited_seconds, undefined, 'still nothing added');
  } finally { fs.chmodSync(runs, 0o755); }
  r.run('start', '1');
  r.run('start', '1');
  near(fmOf(r.file).waited_seconds, 600, 'counted once');
});
