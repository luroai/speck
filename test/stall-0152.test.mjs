// 0152: a test run that writes no output for test_stall_minutes is ended and reported as a stalled, failed run.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { shipRepo, CLI, env, gIn } from './support/ship.mjs';
import { testStallMs } from '../scripts/turns.mjs';

// speck's own tests can't wait minutes for a stall, so they set it in milliseconds.
const STALL_MS = 1500;
const fast = { ...env, SPECK_STALL_MS: String(STALL_MS) };
const noTrace = res => assert.doesNotMatch(res.stderr, /^\s+at /m, 'no stack trace');
const speck = (cwd, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd, encoding: 'utf8', env: fast, timeout: 60000 });
const STALLED = /The tests stalled: no output for 1\.5 seconds/;
const alive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };

// A test command that starts a background process, writing its pid to a file, then says `last` and hangs.
function hanging(last = 'ok 714 - the last test before the hang') {
  const pidFile = path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'hang-'))), 'pid');
  return { pidFile, cmd: `sleep 300 & echo $! > ${pidFile}; echo first line; echo '${last}'; wait`, pid: () => Number(fs.readFileSync(pidFile, 'utf8')) };
}

// A committed repo with speck set up and the given test command.
function testRepo(cmd) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-stall-')));
  const g = (...a) => gIn(dir, ...a);
  g('init', '-q', '-b', 'main');
  assert.equal(speck(dir, 'init', '--skip-checks').status, 0);
  assert.equal(speck(dir, 'config', 'set', 'commands.test', cmd).status, 0);
  fs.writeFileSync(path.join(dir, 'app.txt'), 'one\n');
  g('add', '-A'); g('commit', '-qm', 'base');
  return { dir, g };
}

const setStall = (dir, line) => {
  const file = path.join(dir, 'speck', 'config.yml');
  fs.writeFileSync(file, `${fs.readFileSync(file, 'utf8').replace(/^test_stall_minutes:.*\n/m, '')}${line}\n`);
};

test('0152 AC1: speck test ends a run that writes nothing for the stall time, and every process it started', () => {
  const h = hanging();
  const r = testRepo(h.cmd);
  const started = Date.now();
  const res = speck(r.dir, 'test');
  assert.notEqual(res.status, 0, 'a stalled run fails');
  assert.ok(Date.now() - started < 30000, 'it did not wait for the hang');
  noTrace(res);
  assert.match(res.stdout + res.stderr, STALLED);
  assert.equal(alive(h.pid()), false, 'the background process the tests started was ended too');
});

test('0152 AC1: a run with uncommitted changes, which records nothing, is ended too', () => {
  const h = hanging();
  const r = testRepo(h.cmd);
  fs.writeFileSync(path.join(r.dir, 'app.txt'), 'changed\n');
  const res = speck(r.dir, 'test');
  assert.notEqual(res.status, 0);
  noTrace(res);
  assert.match(res.stdout + res.stderr, STALLED);
  assert.equal(alive(h.pid()), false);
});

test('0152 AC1: test_stall_minutes defaults to 5', () => {
  const was = process.env.SPECK_STALL_MS;
  delete process.env.SPECK_STALL_MS;
  try {
    assert.equal(testStallMs({}), 5 * 60 * 1000);
    assert.equal(testStallMs({ test_stall_minutes: 2 }), 2 * 60 * 1000);
  } finally { if (was !== undefined) process.env.SPECK_STALL_MS = was; }
});

test('0152 AC2: the failure says the tests stalled, for how long, and the last line before they did', () => {
  const h = hanging('ok 714 - widgets export');
  const r = testRepo(h.cmd);
  const res = speck(r.dir, 'test');
  const out = res.stdout + res.stderr;
  const line = out.split('\n').find(l => STALLED.test(l));
  assert.ok(line, out);
  assert.match(line, /ok 714 - widgets export/, 'names the last line of output');
  assert.doesNotMatch(out, /Error:|^\s+at /m);
});

test('0152 AC2: a stalled run is recorded as a failure, and never reused as a pass', () => {
  const h = hanging();
  const r = testRepo(h.cmd);
  const first = speck(r.dir, 'test');
  assert.notEqual(first.status, 0);
  const again = speck(r.dir, 'test');
  assert.notEqual(again.status, 0, 'the reused result is still a failure');
  assert.match(again.stdout, /^Reusing the test result.*failed/m);
  assert.match(again.stdout, STALLED, 'the reused failure still says the tests stalled');
  const results = path.join(r.dir, 'speck', '.cache', 'results');
  const recorded = fs.readdirSync(results).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(results, f), 'utf8')));
  assert.equal(recorded.length, 1);
  assert.notEqual(recorded[0].status, 0);
});

test('0152 AC3: speck ship whose tests stall merges nothing, leaves the ticket approved and says to ship again', () => {
  const pidFile = path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'hang-'))), 'pid');
  const r = shipRepo({ test: `sleep 300 & echo $! > ${pidFile}; echo ok 1 - export; wait` });
  const before = r.snapshot();
  const res = speck(r.dir, 'ship', '1');
  assert.notEqual(res.status, 0);
  assert.notEqual(res.status, 14, 'a stall is not blamed on the base branch');
  noTrace(res);
  const out = res.stdout + res.stderr;
  assert.match(out, STALLED);
  assert.match(res.stderr, /stalled/);
  assert.match(res.stderr, /nothing was shipped/i);
  assert.match(res.stderr, /ship (it )?again/i);
  assert.deepEqual(r.snapshot(), before, 'nothing merged or changed');
  assert.equal(r.statusIn(r.wt), 'approved');
  assert.equal(alive(Number(fs.readFileSync(pidFile, 'utf8'))), false);
});

test('0152 AC4: speck config set refuses a test_stall_minutes that is not a whole number of 1 or more', () => {
  const r = testRepo('true');
  for (const bad of ['0', '-1', '1.5', 'five', '']) {
    const res = speck(r.dir, 'config', 'set', 'test_stall_minutes', bad);
    assert.notEqual(res.status, 0, bad);
    noTrace(res);
    assert.match(res.stderr, /test_stall_minutes must be a whole number of 1 or more/);
  }
  const ok = speck(r.dir, 'config', 'set', 'test_stall_minutes', '7');
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(fs.readFileSync(path.join(r.dir, 'speck', 'config.yml'), 'utf8'), /^test_stall_minutes: 7\b/m);
});

test('0152 AC4: a test run refuses a bad test_stall_minutes in speck/config.yml, saying how to fix it, and runs nothing', () => {
  const log = path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'runs-'))), 'runs.txt');
  const r = testRepo(`echo run >> ${log}`);
  for (const bad of ['0', '1.5', 'soon', '""']) {
    setStall(r.dir, `test_stall_minutes: ${bad}`);
    const res = speck(r.dir, 'test', '--fresh');
    assert.notEqual(res.status, 0, bad);
    noTrace(res);
    assert.match(res.stderr, /test_stall_minutes in speck\/config\.yml must be a whole number of 1 or more/);
    assert.match(res.stderr, /speck config set test_stall_minutes 5/);
    assert.equal(fs.existsSync(log), false, 'the tests did not run');
  }
});

test('0152 AC4: a run that keeps writing output is never ended, however long it takes', () => {
  const r = testRepo('for i in 1 2 3 4 5 6 7 8; do echo "ok $i"; sleep 0.5; done');
  const res = speck(r.dir, 'test', '--fresh');
  assert.equal(res.status, 0, res.stdout + res.stderr);
  assert.doesNotMatch(res.stdout + res.stderr, /stalled/);
  assert.match(res.stdout, /ok 8/);
});

test('0152 AC1: a test command that exits on its own keeps its exit code and output', () => {
  const r = testRepo('echo "not ok 1 - widgets"; echo oops >&2; exit 3');
  const res = speck(r.dir, 'test', '--fresh');
  assert.equal(res.status, 3);
  assert.match(res.stdout, /not ok 1 - widgets/);
  assert.match(res.stdout + res.stderr, /oops/);
  assert.doesNotMatch(res.stdout + res.stderr, /stalled/);
});

test('0152 AC1: speck test --files ends a run of only some test files that stalls, and every process it started', () => {
  const pidFile = path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'hang-'))), 'pid');
  const r = testRepo('true');
  assert.equal(speck(r.dir, 'config', 'set', 'commands.test_files', `sleep 300 & echo $! > ${pidFile}; echo 'ok 3 - {files}'; wait`).status, 0);
  const res = speck(r.dir, 'test', '--files', 'app.txt');
  assert.notEqual(res.status, 0);
  noTrace(res);
  const line = (res.stdout + res.stderr).split('\n').find(l => STALLED.test(l));
  assert.ok(line, res.stdout + res.stderr);
  assert.match(line, /ok 3 - app\.txt/);
  assert.equal(alive(Number(fs.readFileSync(pidFile, 'utf8'))), false);
  const passing = speck(r.dir, 'config', 'set', 'commands.test_files', 'echo ok 1 - {files}; exit 0');
  assert.equal(passing.status, 0);
  const ok = speck(r.dir, 'test', '--files', 'app.txt');
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(ok.stdout, /ok 1 - app\.txt/);
});

test('0152 AC4: a bad test_stall_minutes is refused even when a recorded result would be reused, by speck test and speck ship', () => {
  const r = testRepo('echo ran');
  assert.equal(speck(r.dir, 'test').status, 0, 'records a pass');
  setStall(r.dir, 'test_stall_minutes: 0');
  const res = speck(r.dir, 'test');
  assert.notEqual(res.status, 0);
  noTrace(res);
  assert.doesNotMatch(res.stdout, /^Reusing the test result/m);
  assert.match(res.stderr, /test_stall_minutes in speck\/config\.yml must be a whole number of 1 or more/);
  const s = shipRepo({ test: 'echo ran' });
  assert.equal(speck(s.wt, 'test').status, 0, 'records a pass for the ticket branch');
  // ship reads the setting from the checkout it runs in.
  setStall(s.dir, 'test_stall_minutes: soon');
  gIn(s.dir, 'commit', '-qam', 'bad setting');
  const ship = speck(s.dir, 'ship', '1');
  assert.notEqual(ship.status, 0);
  noTrace(ship);
  assert.match(ship.stderr, /test_stall_minutes/);
  assert.equal(s.statusIn(s.wt), 'approved');
});
