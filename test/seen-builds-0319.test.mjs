// 0319: speck run says a build is outside speck run only when no speck run started it.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { runRepo, startRun, until, killAll, stopRun, leftRunning } from './support/run.mjs';
import { adoptedAs, noteBuild, claimResumed } from '../scripts/seen-builds.mjs';

const runs = dir => path.join(dir, 'speck', '.cache', 'runs');
const sleeper = () => { const p = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 60000)'], { detached: true, stdio: 'ignore' }); p.unref(); return p.pid; };
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

test('0319 AC1, AC3, AC4: speck run tells another speck run\'s build from one outside speck run, and keeps saying a build carries on through a switch', async () => {
  const r = runRepo({ tickets: [['0001', { status: 'building' }], ['0002', { status: 'building' }], ['0003', { status: 'building' }]] });
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
  } finally { await stopRun(run); killAll([own, seen, carried.pid]); }
});
