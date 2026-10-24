// 0319: speck run says a build is outside speck run only when no speck run started it.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { runRepo, startRun, until, killAll, stopRun, leftRunning, FAKE } from './support/run.mjs';
import { keptFile } from './support/copy.mjs';
import { adoptedAs, noteBuild, claimResumed } from '../scripts/seen-builds.mjs';
import { statusData } from '../scripts/speck.mjs';
import { loadConfig } from '../scripts/core.mjs';
import { handBackQueue } from '../scripts/hand-back.mjs';
import { goWith, goWithQueue } from '../scripts/go-with.mjs';
import { foremanAgentQueue, foremanAction } from '../scripts/foreman-agent.mjs';
import { ENDED, blockedRepo } from './support/blocked.mjs';
import { T, gitEnv } from './support/panel.mjs';

Object.assign(process.env, gitEnv); // goWith and speck foreman commit in this process

const runs = dir => path.join(dir, 'speck', '.cache', 'runs');
const sleeper = () => { const p = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 60000)'], { detached: true, stdio: 'ignore' }); p.unref(); return p.pid; };
const spawnDead = () => spawnSync(process.execPath, ['-e', '0'], { stdio: 'ignore' }).pid;
const write = (dir, id, rec) => { fs.mkdirSync(runs(dir), { recursive: true }); fs.writeFileSync(path.join(runs(dir), `${id}.json`), JSON.stringify(rec, null, 2)); };
// A record as speck run writes it for a build it launches.
const launchedRec = (id, pid) => ({ id, session: `s-${id}`, cwd: '/r', started: '2026-10-18T09:00:00.000Z', pid, command: ['claude', '-p', `/speck-build ${id}`] });

test('0319 AC1: a build a speck run launched is never said to be outside speck run', () => {
  assert.doesNotMatch(adoptedAs(launchedRec('0001', 5)), /outside speck run/);
  assert.doesNotMatch(adoptedAs({ ...launchedRec('0001', 5), agent: 'codex', env_session: 'x', session: null }), /outside speck run/);
});

test('0319 AC2: a build a speck run resumed (a hand-back, a stopped build, a recommendation taken) is never said to be outside speck run', () => {
  const resumed = { ...launchedRec('0001', 5), resumed: '2026-10-18T10:00:00.000Z', resume_command: ['claude', '--resume', 's-0001'] };
  assert.doesNotMatch(adoptedAs(resumed), /outside speck run/);
  assert.doesNotMatch(adoptedAs({ ...resumed, went_with: { option: 'B', at: '2026-10-18T10:00:00.000Z' } }), /outside speck run/);
  assert.doesNotMatch(adoptedAs({ ...resumed, handed_back: { at: '2026-10-18T10:00:00.000Z' } }), /outside speck run/);
});

// A build first started outside speck run: its record is marked seen, as noteBuild and claimResumed mark it.
const SEEN = { ...ENDED, seen: true };
const WORDS = ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'];
const CFG = { base_branch: 'main', branch_prefix: 'speck/' };
const save = (f, rec) => fs.writeFileSync(f, JSON.stringify(rec));
// startBuild as speck run calls it, keeping the record each resumed build is given, and the one saved before it starts.
const starter = (r, running, started) => (id, argv, cwd, session, flags, record) => {
  started.push({ id, saved: JSON.parse(fs.readFileSync(r.record, 'utf8')), rec: JSON.parse(record(4242)) });
  running.add(id);
};
const notOutside = (s, what) => {
  assert.equal(Object.hasOwn(s.saved, 'seen'), false, `${what}: the record saved before it starts`);
  assert.equal(Object.hasOwn(s.rec, 'seen'), false, `${what}: the record of the resumed build`);
  assert.doesNotMatch(adoptedAs(s.rec), /outside speck run/, what);
};

test('0319 AC2: a hand-back of a build first started outside speck run is speck run\'s own once resumed', () => {
  const r = blockedRepo({ status: 'approved', record: SEEN });
  fs.writeFileSync(r.record, JSON.stringify({ ...JSON.parse(fs.readFileSync(r.record, 'utf8')), hand_back: { kind: 'conflict', why: 'clash', head: r.head(), at: '2026-10-18T10:00:00.000Z' } }));
  const running = new Set(), started = [];
  const q = handBackQueue({ repo: r.dir, cfg: CFG, words: WORDS, max: 1, running, startBuild: starter(r, running, started), saveRecord: save, resumeHint: () => '', runs: () => r.runs });
  q.check(statusData(r.dir).tickets);
  assert.equal(started.length, 1);
  notOutside(started[0], 'hand-back');
});

test('0319 AC2: a recommendation taken for a build first started outside speck run is speck run\'s own once resumed', () => {
  const r = blockedRepo({ record: SEEN });
  assert.equal(goWith(r.dir, '0001').status, 200);
  const running = new Set(), started = [];
  const q = goWithQueue({ repo: r.dir, cfg: CFG, words: WORDS, max: 1, running, startBuild: starter(r, running, started), saveRecord: save, resumeHint: () => '', runs: () => r.runs });
  q.check(statusData(r.dir).tickets);
  assert.equal(started.length, 1);
  notOutside(started[0], 'recommendation taken');
});

test('0319 AC2: a resume the Foreman asks for, of a build first started outside speck run, is speck run\'s own', () => {
  const r = blockedRepo({ status: 'building', record: SEEN });
  const running = new Set(), started = [], starts = [], live = new Set();
  const q = foremanAgentQueue({ repo: r.dir, runs: () => r.runs, readConfig: () => ({ ...loadConfig(r.dir), watch: 'fix' }),
    words: WORDS, cfg: CFG, max: 1, running, ships: { again: () => {} }, say: () => {}, startBuild: starter(r, running, started),
    start: (argv, cwd, log, env) => { const pid = 90000 + starts.length; starts.push({ token: env.SPECK_FOREMAN_RUN, pid }); live.add(pid); return { pid, exited: () => !live.has(pid) }; },
    alive: pid => live.has(pid), withToken: () => [] });
  const tickets = [T('0001', 'building')];
  q.stuck({ id: '0001', what: 'its build ended', log: '' });
  q.check(tickets);
  foremanAction(r.dir, ['resume', '0001', 'Carry on.', '--why=it stopped'], { token: starts[0].token, now: new Date('2026-10-18T14:00:00Z') });
  live.delete(starts[0].pid);
  q.check(tickets);
  assert.equal(started.length, 1);
  notOutside(started[0], 'Foreman resume');
});

test('0319 AC3: a build started in a conversation, or resumed by hand, is said to be outside speck run', () => {
  const r = runRepo({ tickets: [['0001', { status: 'building' }]] });
  const build = () => ({ pid: process.pid, session: 'conv', args: ['claude'] });
  const env = { ...process.env }; delete env.SPECK_BUILD_SESSION;
  const noted = noteBuild(runs(r.dir), '0001', 'building', { env, build });
  assert.ok(noted);
  assert.match(adoptedAs(noted), /is being built outside speck run/);
  write(r.dir, '0001', { ...launchedRec('0001', 1), exited: '2026-10-18T10:00:00.000Z', exit_code: 0 });
  const claimed = claimResumed(runs(r.dir), '0001', { find: () => process.pid });
  assert.ok(claimed);
  assert.match(adoptedAs(claimed), /is being built outside speck run/);
});

test('0319 AC1, AC2, AC3, AC4: speck run tells another speck run\'s build from one outside speck run, and keeps saying a build carries on through a switch', async () => {
  const r = runRepo({ tickets: [['0001', { status: 'building' }], ['0002', { status: 'building' }], ['0003', { status: 'building' }], ['0004', { status: 'building' }]], max: 5,
    command: `"${process.execPath}" "${keptFile('fake-build.cjs', FAKE)}" @repo {id} --session-id {session}` }); // resumable
  // 0004: a build first started outside speck run, killed with its ticket in hand: speck run resumes it once.
  write(r.dir, '0004', { ...launchedRec('0004', ENDED.pid), pid: spawnDead(), seen: true });
  const carried = leftRunning(r.dir, '0003');
  const run = startRun(r.dir, { SPECK_RUN_RUNNING: JSON.stringify(['0003']) });
  const own = sleeper(), seen = sleeper();
  try {
    assert.ok(await until(() => /watching for ready tickets/.test(run.out())), run.out());
    // A build another speck run launched, and one a conversation started (its record marked seen, as noteBuild writes it).
    write(r.dir, '0001', launchedRec('0001', own));
    write(r.dir, '0002', { ...launchedRec('0002', seen), seen: true });
    assert.ok(await until(() => /0001 is already being built/.test(run.out()) && /0002 is being built outside speck run/.test(run.out())), run.out());
    assert.doesNotMatch(run.out(), /0001 is being built outside speck run/);
    assert.equal(run.out().match(/0002 is being built outside speck run/g).length, 1, 'said once');
    assert.match(run.out(), /0003 carries on through the switch/);
    // AC2: a stopped build speck run resumes is its own from then on.
    assert.ok(await until(() => /Resumed 0004/.test(run.out())), run.out());
    assert.equal(Object.hasOwn(JSON.parse(fs.readFileSync(path.join(runs(r.dir), '0004.json'), 'utf8')), 'seen'), false);
    assert.doesNotMatch(run.out(), /0004 is being built outside speck run/);
  } finally { await stopRun(run); killAll([own, seen, carried.pid]); }
});
