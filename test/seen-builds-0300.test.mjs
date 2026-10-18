// 0300: speck run sees every build of the repo's tickets, however it was started.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { runRepo, startRun, until, alive, killAll, stopRun, record, env, CLI } from './support/run.mjs';
import { buildOfThisProcess, noteBuild, claimResumed } from '../scripts/seen-builds.mjs';
import { statusData } from '../scripts/speck.mjs';
import { cliCopy } from './support/panel.mjs';

const runs = dir => path.join(dir, 'speck', '.cache', 'runs');
const wait = ms => new Promise(res => setTimeout(res, ms));
// The environment of a build speck run didn't start: none of speck run's, nor this session's own Claude Code.
const outside = (() => { const e = { ...env }; for (const k of ['SPECK_BUILD_SESSION', 'CLAUDE_PID', 'CLAUDE_CODE_SESSION_ID']) delete e[k]; return e; })();
const table = list => new Map(list.map(([pid, ppid, args]) => [pid, { ppid, args: args.split(' ') }]));
const setStatus = (dir, id, from, to) => { const f = path.join(dir, 'speck', 'tickets', `${id}-t.md`); fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(`status: ${from}`, `status: ${to}`)); };
const shown = (dir, id) => statusData(dir).tickets.find(t => t.id === id);
const exitedRecord = (dir, id, rec = {}) => {
  fs.mkdirSync(runs(dir), { recursive: true });
  const full = { id, session: `old-${id}`, cwd: dir, started: '2026-10-18T09:00:00.000Z', pid: 1, command: ['claude', id], exited: '2026-10-18T10:00:00.000Z', exit_code: 0, ...rec };
  fs.writeFileSync(path.join(runs(dir), `${id}.json`), JSON.stringify(full, null, 2));
  return full;
};
// A process that stays alive, named on its command line as `args` say.
const sleeper = (...args) => { const p = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 60000)', '--', ...args], { detached: true, stdio: 'ignore' }); p.unref(); return p.pid; };

// A stand-in for an agent outside speck run: a script named `claude`, run by node, which runs a speck command through
// a shell, as a build does, then stays alive until it's killed. Resolves with its pid once the command has finished.
async function agentBuilding(dir, id, cmd = `next ${id}`) {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-agent-'));
  const script = path.join(bin, 'claude'), done = path.join(bin, 'done');
  fs.writeFileSync(script, `
const { execFileSync } = require('child_process'), fs = require('fs');
try { execFileSync('sh', ['-c', ${JSON.stringify(`"${process.execPath}" "${CLI}" ${cmd}`)}], { stdio: 'ignore' }); } catch {}
fs.writeFileSync(${JSON.stringify(done)}, '');
setInterval(() => {}, 1000);
`);
  const p = spawn(process.execPath, [script, '-p', `/speck-build ${id}`, '--session-id', `hand-${id}`], { cwd: dir, env: outside, detached: true, stdio: 'ignore' });
  p.unref();
  assert.ok(await until(() => fs.existsSync(done), 15000), 'the speck command finished');
  return p.pid;
}

test('0300 AC4: a speck command finds the agent it runs in, through shells, with its session', () => {
  const claude = buildOfThisProcess({ pid: 100, env: { CLAUDE_PID: '98', CLAUDE_CODE_SESSION_ID: 'S1' },
    rows: table([[100, 99, 'node .speck/scripts/speck.mjs next 0001'], [99, 98, '/bin/bash -c node .speck/scripts/speck.mjs next 0001'], [98, 50, 'claude -p /speck-build 0001'], [50, 1, 'bash']]) });
  assert.equal(claude.pid, 98);
  assert.equal(claude.session, 'S1', 'Claude Code says its own session');
  assert.equal(claude.agent, null);
  const codex = buildOfThisProcess({ pid: 100, env: {}, rows: table([[100, 99, 'node speck.mjs test'], [99, 97, '/usr/bin/zsh -lc node speck.mjs test'], [97, 1, '/opt/codex/codex-x86_64-unknown-linux-musl exec resume T9 go']]) });
  assert.deepEqual([codex.pid, codex.agent, codex.session], [97, 'codex', 'T9']);
  const cursor = buildOfThisProcess({ pid: 100, env: {}, rows: table([[100, 96, 'node speck.mjs next 0001'], [96, 1, 'agent -p --resume C4 carry on']]) });
  assert.deepEqual([cursor.pid, cursor.agent, cursor.session], [96, 'cursor', 'C4']);
  const elsewhere = buildOfThisProcess({ pid: 100, env: { CLAUDE_PID: '12', CLAUDE_CODE_SESSION_ID: 'OTHER' }, rows: table([[100, 99, 'node speck.mjs next'], [99, 1, 'claude --resume R2']]) });
  assert.equal(elsewhere.session, 'R2', "another Claude Code's session isn't taken for this one's");
  // Not in a build: a terminal, or a test runner between it and the agent.
  assert.equal(buildOfThisProcess({ pid: 100, env: {}, rows: table([[100, 99, 'node speck.mjs next'], [99, 98, '-bash'], [98, 1, 'tmux']]) }), null);
  assert.equal(buildOfThisProcess({ pid: 100, env: {}, rows: table([[100, 99, 'node speck.mjs next'], [99, 98, 'node --test'], [98, 1, 'claude']]) }), null);
  assert.equal(buildOfThisProcess({ pid: 100, env: {}, rows: table([]) }), null);
});

test('0300 AC4: a build outside speck run keeps its own process in its ticket\'s run record just by running a speck command', async () => {
  const r = runRepo({ tickets: [['0001', { status: 'building' }]] });
  const pid = await agentBuilding(r.dir, '0001');
  try {
    const rec = record(r.dir, '0001');
    assert.equal(rec.pid, pid, 'the agent, not the speck command or its shell');
    assert.equal(rec.session, 'hand-0001');
    assert.ok(!('exited' in rec));
  } finally { killAll([pid]); }
  // speck start, as a build resuming a ticket runs it, even though it refuses to start it again.
  fs.rmSync(path.join(runs(r.dir), '0001.json'));
  const again = await agentBuilding(r.dir, '0001', 'start 0001');
  try { assert.equal(record(r.dir, '0001').pid, again); } finally { killAll([again]); }
});

test('0300 AC4: a command that names no ticket keeps the build of the ticket whose branch it runs on', async () => {
  const r = runRepo({ tickets: [['0001', { status: 'building' }]] });
  r.g('switch', '-q', '-c', 'speck/0001-t');
  const pid = await agentBuilding(r.dir, '0001', 'diffstat');
  try { assert.equal(record(r.dir, '0001').pid, pid); } finally { killAll([pid]); }
});

test('0300 AC1: a build outside speck run stops counting once its ticket is approved, though its conversation carries on', async () => {
  const r = runRepo({ tickets: [['0001', { status: 'building' }], ['0002', { status: 'draft' }]], max: 1 });
  const run = startRun(r.dir, { FAKE_MS: '3000' });
  let pid = null;
  try {
    assert.ok(await until(() => /watching for ready tickets/.test(run.out())), run.out());
    pid = await agentBuilding(r.dir, '0001');
    assert.ok(await until(() => /0001 is being built outside speck run/.test(run.out())), run.out());
    setStatus(r.dir, '0002', 'draft', 'ready');
    setStatus(r.dir, '0001', 'building', 'approved');
    r.g('commit', '-qam', '0001 approved, 0002 ready');
    assert.ok(await until(() => r.calls().length >= 1), run.out());
    assert.deepEqual(r.calls().map(c => c.args[0]), ['0002']);
    assert.match(run.out(), /0001 is approved, so its build outside speck run no longer counts/);
    assert.ok(alive(pid));
    assert.ok('exited' in record(r.dir, '0001'));
  } finally { await stopRun(run); killAll([pid, ...r.calls().map(c => c.pid)].filter(Boolean)); }
});

test('0300 AC1: a build outside speck run that approves its ticket doesn\'t hold up switching to new code', async () => {
  const r = runRepo({ tickets: [['0001', { status: 'building' }]] });
  const { cli } = cliCopy();
  const run = startRun(r.dir, {}, cli);
  let pid = null;
  try {
    assert.ok(await until(() => /watching for ready tickets/.test(run.out())), run.out());
    pid = await agentBuilding(r.dir, '0001');
    assert.ok(await until(() => /0001 is being built outside speck run/.test(run.out())), run.out());
    const f = path.join(path.dirname(cli), 'run-switch.mjs');
    fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace("'speck run switched to the new code.'", "'speck run switched to the new code. v2'"));
    assert.ok(await until(() => /switch to the new code when its running builds and ships have ended: the build of 0001/.test(run.out())), run.out());
    setStatus(r.dir, '0001', 'building', 'approved');
    r.g('commit', '-qam', '0001 approved');
    assert.ok(await until(() => run.out().includes('switched to the new code. v2')), run.out());
    assert.ok(alive(pid), 'its conversation carries on');
  } finally { await stopRun(run); killAll([pid].filter(Boolean)); }
});

test('0300 AC1: a build speck run started, resumed by hand after it exited, stops counting once it approves its ticket', async () => {
  const r = runRepo({ tickets: [['0001', {}], ['0002', { status: 'draft' }]], max: 1 });
  const run = startRun(r.dir);
  let pid = null;
  try {
    assert.ok(await until(() => /0001 is still ready/.test(run.out())), run.out());
    const session = record(r.dir, '0001').session;
    setStatus(r.dir, '0001', 'ready', 'building');
    r.g('commit', '-qam', '0001 building');
    pid = sleeper('claude', '--resume', session);
    assert.ok(await until(() => /0001 is being built outside speck run/.test(run.out())), run.out());
    setStatus(r.dir, '0002', 'draft', 'ready');
    setStatus(r.dir, '0001', 'building', 'approved');
    r.g('commit', '-qam', '0001 approved, 0002 ready');
    assert.ok(await until(() => r.calls().some(c => c.args[0] === '0002')), run.out());
    assert.ok(alive(pid));
  } finally { await stopRun(run); killAll([pid, ...r.calls().map(c => c.pid)].filter(Boolean)); }
});

test('0300 AC1, AC3: speck run counts a build started outside it, and treats it as its own when it stops partway', async () => {
  const r = runRepo({ tickets: [['0001', { status: 'building' }], ['0002', { status: 'draft' }]], max: 1 });
  const run = startRun(r.dir, { FAKE_MS: '3000' });
  let pid = null;
  try {
    assert.ok(await until(() => /watching for ready tickets/.test(run.out())), run.out());
    pid = await agentBuilding(r.dir, '0001');
    assert.ok(await until(() => /0001 is being built outside speck run/.test(run.out())), run.out());
    // 0002 set ready and committed: the one build slot is in use.
    setStatus(r.dir, '0002', 'draft', 'ready');
    r.g('commit', '-qam', '0002 ready');
    assert.ok(await until(() => { try { return JSON.stringify(JSON.parse(fs.readFileSync(path.join(runs(r.dir), 'run.foreman.json'), 'utf8')).ready ?? []).includes('slots'); } catch { return false; } }), run.out());
    assert.deepEqual(r.calls(), [], '0002 waits for the slot, and 0001 is not launched');
    process.kill(pid, 'SIGKILL');
    // As a build of its own that was killed with its ticket in hand: it's said to have stopped partway.
    assert.ok(await until(() => /0001 build \(session hand-0001\) stopped unexpectedly/.test(run.out())), run.out());
    assert.ok(await until(() => r.calls().length >= 1), run.out());
    assert.deepEqual(r.calls().map(c => c.args[0]), ['0002'], 'the slot frees when it stops');
  } finally { await stopRun(run); killAll([pid, ...r.calls().map(c => c.pid)].filter(Boolean)); }
});

test('0300 AC2: a build resumed outside speck run, whose run record says it exited, shows as building, not stopped', async () => {
  const r = runRepo({ tickets: [['0001', { status: 'building' }], ['0002', { status: 'reviewing' }]] });
  exitedRecord(r.dir, '0001');
  exitedRecord(r.dir, '0002', { session: 'resumed-0002' });
  assert.ok(shown(r.dir, '0001').build_exit, 'shown as stopped before');
  // Resumed by hand and running a speck command.
  const live = sleeper();
  try {
    assert.ok(noteBuild(runs(r.dir), '0001', 'building', { env: outside, build: () => ({ pid: live, session: 'old-0001', args: ['claude', '--resume', 'old-0001'] }) }));
    assert.equal(shown(r.dir, '0001').build_exit, null);
    assert.equal(shown(r.dir, '0001').build_stopped, false);
  } finally { killAll([live]); }
  // Resumed by hand and found by its session on speck run's check, before it runs any speck command.
  const resumed = sleeper('claude', '--resume', 'resumed-0002');
  try {
    const rec = claimResumed(runs(r.dir), '0002');
    assert.equal(rec?.pid, resumed);
    assert.ok(!('exited' in record(r.dir, '0002')));
    assert.equal(shown(r.dir, '0002').build_exit, null);
    assert.equal(shown(r.dir, '0002').build_stopped, false);
    assert.equal(claimResumed(runs(r.dir), '0002'), null, 'claimed once');
  } finally { killAll([resumed]); }
  exitedRecord(r.dir, '0002', { session: 'nobody-has-it' });
  assert.equal(claimResumed(runs(r.dir), '0002'), null, 'no process names its session: left as it is');
});

test('0300 AC5: a build speck run started is left as it is', () => {
  const r = runRepo({ tickets: [['0001', { status: 'building' }]] });
  const own = sleeper();
  try {
    const rec = { id: '0001', session: 'own', cwd: r.dir, started: '2026-10-18T09:00:00.000Z', pid: own, command: ['claude'] };
    fs.mkdirSync(runs(r.dir), { recursive: true });
    fs.writeFileSync(path.join(runs(r.dir), '0001.json'), JSON.stringify(rec));
    const build = () => ({ pid: process.pid, session: 'x', args: ['claude'] });
    assert.equal(noteBuild(runs(r.dir), '0001', 'building', { env: { ...outside, SPECK_BUILD_SESSION: 'own' }, build }), null, 'its own builds have its session');
    assert.equal(noteBuild(runs(r.dir), '0001', 'building', { env: outside, build }), null, 'a record naming a running build is kept');
    assert.deepEqual(record(r.dir, '0001'), rec);
    assert.equal(claimResumed(runs(r.dir), '0001', { find: () => process.pid }), null);
    assert.deepEqual(record(r.dir, '0001'), rec);
  } finally { killAll([own]); }
});

test('0300 AC5: a speck command outside a build, or for a ticket no build has in hand, writes nothing', () => {
  const r = runRepo({ tickets: [['0001', { status: 'ready' }]] });
  const build = () => ({ pid: process.pid, session: 'x', args: ['claude'] });
  for (const status of ['ready', 'draft', 'approved', 'blocked', undefined]) assert.equal(noteBuild(runs(r.dir), '0001', status, { env: outside, build }), null, String(status));
  assert.equal(noteBuild(runs(r.dir), '0001', 'building', { env: outside, build: () => null }), null);
  assert.equal(noteBuild(runs(r.dir), '../x', 'building', { env: outside, build }), null);
  assert.equal(fs.existsSync(path.join(runs(r.dir), '0001.json')), false);
  // The real thing: a speck command run by this test, which isn't a build.
  assert.equal(spawnSync(process.execPath, [CLI, 'next', '0001'], { cwd: r.dir, env: outside }).error, undefined);
  assert.equal(fs.existsSync(path.join(runs(r.dir), '0001.json')), false);
});

test('0300 AC5: speck run doesn\'t take a build it started itself for one started outside it', async () => {
  const r = runRepo();
  const run = startRun(r.dir, { FAKE_MS: '1500' });
  try {
    assert.ok(await until(() => /Launched 0001/.test(run.out())), run.out());
    assert.ok(await until(() => /0001 build exited/.test(run.out())), run.out());
    assert.doesNotMatch(run.out(), /outside speck run/);
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});
