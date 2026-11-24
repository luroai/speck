// 0724: the 0166 AC1 and 0217 AC2 waited-time checks use bounds measured in the test, not a fixed ±5 s or 10 s limit.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { ROOT } from './support/run.mjs';
import { testBody, brokenCli } from './support/quick-run.mjs';
import { panelRepo, env, cliCopy } from './support/panel.mjs';
import { runsPath } from './support/ticker.mjs';
import { parseTicket } from '../scripts/speck.mjs';
import { assertCounted, assertWrittenSince } from './support/timing.mjs';

const src = f => fs.readFileSync(path.join(ROOT, 'test', f), 'utf8');
const ac1 = name => testBody(src('waiting-0166.test.mjs'), name);
const ac2 = name => testBody(src('stopped-wait-0217.test.mjs'), name);
const fmOf = file => parseTicket(fs.readFileSync(file, 'utf8')).fm;
const realAgo = s => new Date(Date.now() - s * 1000).toISOString();
const deadPid = () => spawnSync(process.execPath, ['-e', 'process.pid'], { stdio: 'ignore' }).pid;
const backdate = (file, key, seconds) => fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(new RegExp(`^${key}: .*$`, 'm'), `${key}: "${realAgo(seconds)}"`));
const runCli = (cli, dir, ...args) => spawnSync(process.execPath, [cli, ...args], { cwd: dir, encoding: 'utf8', env });
const ticketVia = (cli, dir) => JSON.parse(runCli(cli, dir, 'status', '--json').stdout).tickets.find(t => t.id === '0001');

// Fixed ±5 s (`near`) or a fixed 10 s window of "now" leave no room for a speck command that takes longer.
const fixedTolerance = t => /\bnear\s*\(/.test(t) || /Math\.abs\([^)]*\)\s*(?:<=|<)\s*5\b/.test(t) || /<\s*10000\b/.test(t);

// A CLI that under-counts each waited stretch by a minute, as a wrong wait the 0166 AC1 checks must reject.
const shortWaitCli = () => brokenCli('core.mjs',
  "return setField(text, 'waited_seconds', Math.round((Number.isFinite(old) && old > 0 ? old : 0) + seconds));",
  "return setField(text, 'waited_seconds', Math.round((Number.isFinite(old) && old > 0 ? old : 0) + seconds - 60));");
// A CLI whose addWaited takes over 5 s, as a busy machine's speck command can.
const slowWaitCli = () => brokenCli('core.mjs',
  'export function addWaited(text, seconds) {\n',
  'export function addWaited(text, seconds) {\n  const end = Date.now() + 6000; while (Date.now() < end);\n');
// A CLI that records a killed build as noticed a minute earlier than it was.
const earlyStopCli = () => brokenCli('stop-wait.mjs',
  'try { saveMark(file, { session: rec.session, pid: rec.pid, since: new Date(now).toISOString() }); } catch { return { since: null, counted: false, killed: true, resumed: false }; }\n  return { since: now, counted: false, killed: true, resumed: false };',
  'try { saveMark(file, { session: rec.session, pid: rec.pid, since: new Date(now - 60000).toISOString() }); } catch { return { since: null, counted: false, killed: true, resumed: false }; }\n  return { since: now - 60000, counted: false, killed: true, resumed: false };');
// A CLI that takes over 5 s when first noticing a killed build.
const slowStopCli = () => brokenCli('stop-wait.mjs',
  'try { saveMark(file, { session: rec.session, pid: rec.pid, since: new Date(now).toISOString() }); } catch { return { since: null, counted: false, killed: true, resumed: false }; }',
  'try { const end = Date.now() + 6000; while (Date.now() < end); saveMark(file, { session: rec.session, pid: rec.pid, since: new Date(now).toISOString() }); } catch { return { since: null, counted: false, killed: true, resumed: false }; }');
// A CLI that shifts a stopped_at it reads back by a minute when formatting it for status --json.
const skewStopCli = () => brokenCli('speck.mjs',
  'build_stopped_at: stop?.killed && !stop.counted && stop.since !== null ? new Date(stop.since).toISOString() : null',
  'build_stopped_at: stop?.killed && !stop.counted && stop.since !== null ? new Date(stop.since - 60000).toISOString() : null');

function stoppedRepo() {
  const r = panelRepo();
  assert.equal(r.run('set', '1', 'status', 'building').status, 0);
  r.g('commit', '-qam', 'building');
  const full = { id: '0001', session: crypto.randomUUID(), cwd: r.dir, started: realAgo(1200), pid: deadPid(), command: ['claude', '-p', '/speck-build 0001'] };
  fs.mkdirSync(runsPath(r.dir, ''), { recursive: true });
  fs.writeFileSync(runsPath(r.dir, '0001.json'), JSON.stringify(full, null, 2));
  return { ...r, rec: full };
}

// ---------- AC1: measured bounds, no fixed ±5 s or 10 s ----------

test('0724 AC1: 0166 AC1 checks waited_seconds with assertCounted, and has no fixed ±5 s tolerance', () => {
  for (const name of [
    '0166 AC1: blocking records the time, and leaving blocked adds the stretch to waited_seconds and clears it',
    '0166 AC1: a ticket that blocks more than once adds each stretch, and setting blocked again keeps the first time',
    '0166 AC1: cancelling a blocked ticket adds its blocked stretch and clears blocked_at',
  ]) {
    const t = ac1(name);
    assert.match(t, /assertCounted\(/, name);
    assert.ok(!fixedTolerance(t), `${name} still has a fixed ±5 s or 10 s check`);
  }
  assert.doesNotMatch(src('waiting-0166.test.mjs'), /\bconst near\b/, 'near is gone from the file');
});

test('0724 AC1: 0217 AC2 checks noticed times with measured bounds, and has no fixed ±5 s or 10 s limit', () => {
  const first = ac2("0217 AC2: a killed build\\'s stop is recorded when speck first notices it, and stays the same after");
  assert.match(first, /assertWrittenSince\(/, 'noticed now');
  assert.match(first, /assert\.equal\([^,]+,\s*marked/, 'backdated time is the mark, not an age with a tolerance');
  assert.ok(!fixedTolerance(first), 'first AC2 test');
  const other = ac2('0217 AC2: a mark left by an earlier build of the ticket is not its stop');
  assert.match(other, /assertWrittenSince\(/, 'noticed now');
  assert.ok(!fixedTolerance(other), 'other AC2 test');
  assert.doesNotMatch(src('stopped-wait-0217.test.mjs'), /\bconst near\b/, 'near is gone from the file');
});

// ---------- AC2: each affected check fails when speck's wait is a minute out ----------

test('0724 AC2: 0166 AC1 fails when leaving blocked adds a wait a minute short', () => {
  const r = panelRepo();
  assert.equal(r.run('set', '1', 'status', 'building').status, 0);
  assert.equal(r.run('set', '1', 'status', 'blocked').status, 0);
  const since = Date.now();
  backdate(r.file, 'blocked_at', 600);
  const leave = runCli(shortWaitCli(), r.dir, 'set', '1', 'status', 'reviewing');
  assert.equal(leave.status, 0, leave.stderr);
  assert.throws(() => assertCounted(fmOf(r.file).waited_seconds, 600, since, 'the blocked stretch'), /isn't between/);
});

test('0724 AC2: 0166 AC1 fails when two blocked stretches add up a minute short', () => {
  const r = panelRepo();
  assert.equal(r.run('set', '1', 'status', 'building').status, 0);
  assert.equal(r.run('set', '1', 'status', 'blocked').status, 0);
  const since = Date.now();
  backdate(r.file, 'blocked_at', 300);
  assert.equal(runCli(shortWaitCli(), r.dir, 'set', '1', 'status', 'building').status, 0);
  assert.equal(r.run('set', '1', 'status', 'blocked').status, 0);
  backdate(r.file, 'blocked_at', 200);
  assert.equal(runCli(shortWaitCli(), r.dir, 'set', '1', 'status', 'approved').status, 0);
  assert.throws(() => assertCounted(fmOf(r.file).waited_seconds, 500, since, 'both stretches'), /isn't between/);
});

test('0724 AC2: 0166 AC1 fails when cancelling adds a blocked wait a minute short', () => {
  const r = panelRepo();
  assert.equal(r.run('set', '1', 'status', 'building').status, 0);
  assert.equal(r.run('set', '1', 'status', 'blocked').status, 0);
  const since = Date.now();
  backdate(r.file, 'blocked_at', 300);
  const c = runCli(shortWaitCli(), r.dir, 'cancel', '1', 'Not needed');
  assert.equal(c.status, 0, c.stderr);
  const file = path.join(r.dir, c.stdout.trim().split(' → ')[1]);
  assert.throws(() => assertCounted(fmOf(file).waited_seconds, 300, since, 'the blocked stretch'), /isn't between/);
});

test('0724 AC2: 0217 AC2 fails when speck notices a killed build a minute early', () => {
  const r = stoppedRepo();
  const noticing = Date.now();
  const first = ticketVia(earlyStopCli(), r.dir);
  assert.equal(first.build_stopped, true);
  assert.throws(() => assertWrittenSince(first.build_stopped_at, noticing, 'noticed now'), /isn't between/);
});

test('0724 AC2: 0217 AC2 fails when the stopped_at speck returns is a minute off the mark', () => {
  const r = stoppedRepo();
  ticketVia(cliCopy().cli, r.dir);
  const marked = realAgo(300);
  fs.writeFileSync(runsPath(r.dir, '0001.waiting'), JSON.stringify({ ...JSON.parse(fs.readFileSync(runsPath(r.dir, '0001.waiting'), 'utf8')), since: marked }));
  const again = ticketVia(skewStopCli(), r.dir).build_stopped_at;
  assert.notEqual(again, marked, 'a minute-skewed stopped_at is not the mark the 0217 AC2 check requires');
});

// ---------- AC3: each affected check passes when its speck command takes more than 5 s ----------

test('0724 AC3: 0166 AC1 passes when leaving blocked takes more than 5 s', () => {
  const r = panelRepo();
  assert.equal(r.run('set', '1', 'status', 'building').status, 0);
  assert.equal(r.run('set', '1', 'status', 'blocked').status, 0);
  const since = Date.now();
  backdate(r.file, 'blocked_at', 600);
  const leave = runCli(slowWaitCli(), r.dir, 'set', '1', 'status', 'reviewing');
  assert.equal(leave.status, 0, leave.stderr);
  assert.ok(Date.now() - since > 5000, 'the command took more than 5 s');
  assertCounted(fmOf(r.file).waited_seconds, 600, since, 'the blocked stretch');
});

test('0724 AC3: 0166 AC1 passes when the second leave-blocked takes more than 5 s', () => {
  const r = panelRepo();
  assert.equal(r.run('set', '1', 'status', 'building').status, 0);
  assert.equal(r.run('set', '1', 'status', 'blocked').status, 0);
  const since = Date.now();
  backdate(r.file, 'blocked_at', 300);
  assert.equal(r.run('set', '1', 'status', 'building').status, 0);
  assert.equal(r.run('set', '1', 'status', 'blocked').status, 0);
  backdate(r.file, 'blocked_at', 200);
  const slow = Date.now();
  const leave = runCli(slowWaitCli(), r.dir, 'set', '1', 'status', 'approved');
  assert.equal(leave.status, 0, leave.stderr);
  assert.ok(Date.now() - slow > 5000, 'the second leave took more than 5 s');
  assertCounted(fmOf(r.file).waited_seconds, 500, since, 'both stretches');
});

test('0724 AC3: 0166 AC1 passes when cancelling a blocked ticket takes more than 5 s', () => {
  const r = panelRepo();
  assert.equal(r.run('set', '1', 'status', 'building').status, 0);
  assert.equal(r.run('set', '1', 'status', 'blocked').status, 0);
  const since = Date.now();
  backdate(r.file, 'blocked_at', 300);
  const c = runCli(slowWaitCli(), r.dir, 'cancel', '1', 'Not needed');
  assert.equal(c.status, 0, c.stderr);
  assert.ok(Date.now() - since > 5000, 'the command took more than 5 s');
  const file = path.join(r.dir, c.stdout.trim().split(' → ')[1]);
  assertCounted(fmOf(file).waited_seconds, 300, since, 'the blocked stretch');
});

test('0724 AC3: 0217 AC2 passes when noticing a killed build takes more than 5 s', () => {
  const r = stoppedRepo();
  const noticing = Date.now();
  const first = ticketVia(slowStopCli(), r.dir);
  assert.ok(Date.now() - noticing > 5000, 'noticing took more than 5 s');
  assert.equal(first.build_stopped, true);
  assertWrittenSince(first.build_stopped_at, noticing, 'noticed now');
});

test('0724 AC3: 0217 AC2 passes when reading a backdated mark takes more than 5 s', () => {
  const r = stoppedRepo();
  const noticing = Date.now();
  const first = ticketVia(cliCopy().cli, r.dir);
  assertWrittenSince(first.build_stopped_at, noticing, 'noticed now');
  const marked = realAgo(300);
  fs.writeFileSync(runsPath(r.dir, '0001.waiting'), JSON.stringify({ ...JSON.parse(fs.readFileSync(runsPath(r.dir, '0001.waiting'), 'utf8')), since: marked }));
  const slowRead = brokenCli('speck.mjs',
    'build_stopped_at: stop?.killed && !stop.counted && stop.since !== null ? new Date(stop.since).toISOString() : null',
    'build_stopped_at: (() => { const end = Date.now() + 6000; while (Date.now() < end); return stop?.killed && !stop.counted && stop.since !== null ? new Date(stop.since).toISOString() : null; })()');
  const since = Date.now();
  const again = ticketVia(slowRead, r.dir).build_stopped_at;
  assert.ok(Date.now() - since > 5000, 'the read took more than 5 s');
  assert.equal(again, marked, 'the time first noticed, not now');
});
