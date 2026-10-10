// 0109: builds take turns running the test suite, as many at a time as max_parallel_tests allows.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { shipRepo, CLI, env } from './support/ship.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const noTrace = res => assert.doesNotMatch(res.stderr, /^\s+at /m, 'no stack trace');
const delay = ms => new Promise(r => setTimeout(r, ms));
const WAITING = /^Waiting for a turn to run the tests/m;
// Waits until cond() is true, failing after 15 seconds rather than hanging.
async function until(cond, what) {
  for (const end = Date.now() + 15000; !cond();) {
    if (Date.now() > end) throw new Error(`gave up waiting until ${what}`);
    await delay(20);
  }
}

// A committed repo with speck set up, the given test command and max_parallel_tests (left out when null), and a
// worktree of it on its own branch.
function testRepo({ cmd = 'true', max = null } = {}) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-turns-')));
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', env });
  g('init', '-q', '-b', 'main');
  assert.equal(speck(dir, 'init', '--skip-checks').status, 0);
  assert.equal(speck(dir, 'config', 'set', 'commands.test', cmd).status, 0);
  if (max !== null) {
    const file = path.join(dir, 'speck', 'config.yml');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/^max_parallel_tests:.*$/m, `max_parallel_tests: ${max}`));
  }
  g('add', '-A'); g('commit', '-qm', 'base');
  const wt = path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-turns-wt-'))), 'wt');
  assert.equal(g('worktree', 'add', '-q', '-b', 'side', wt).status, 0);
  return { dir, wt };
}

const speck = (cwd, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd, encoding: 'utf8', env });

// Runs speck in the background, collecting its output. `done` resolves with { status, stdout, stderr }.
function speckAsync(cwd, ...a) {
  const child = spawn(process.execPath, [CLI, ...a], { cwd, env });
  const out = { stdout: '', stderr: '' };
  child.stdout.on('data', d => { out.stdout += d; });
  child.stderr.on('data', d => { out.stderr += d; });
  const done = new Promise(r => child.on('close', status => r({ status, ...out })));
  return { child, out, done };
}

// A turn file in the repo's queue, held by the given pid.
function holdTurn(main, pid, n = 0) {
  const dir = path.join(main, 'speck', '.cache', 'tests');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `slot-${n}.lock`), JSON.stringify({ pid, cwd: '/somewhere/else' }));
}

// A process that runs until killed, and the pid of one that has already ended.
const sleeper = () => spawn('sleep', ['60'], { stdio: 'ignore' });
function deadPid() {
  const r = spawnSync('sh', ['-c', 'echo $$']);
  return Number(String(r.stdout).trim());
}

// A test command that logs when it starts and ends, so overlapping runs show up.
const logged = log => `echo start >> ${log}; sleep 1; echo end >> ${log}`;
const readLog = log => fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n') : [];

test('0109 AC1: speck test runs the test command and exits with its exit code', () => {
  const { dir, wt } = testRepo({ cmd: 'pwd -P > ran.txt; exit 3' });
  const res = speck(dir, 'test');
  assert.equal(res.status, 3, res.stderr);
  noTrace(res);
  assert.equal(fs.readFileSync(path.join(dir, 'ran.txt'), 'utf8').trim(), dir, 'it ran in the checkout it was started from');
  const ok = testRepo({ cmd: 'echo all good' });
  const passed = speck(ok.dir, 'test');
  assert.equal(passed.status, 0, passed.stderr);
  assert.match(passed.stdout, /all good/);
  const fromWt = speck(wt, 'test');
  assert.equal(fromWt.status, 3);
  assert.equal(fs.readFileSync(path.join(wt, 'ran.txt'), 'utf8').trim(), wt, 'from a worktree, it runs there');
});

test('0109 AC1: speck test without a test command set says what to do, with no stack trace', () => {
  const { dir } = testRepo({ cmd: '' });
  const res = speck(dir, 'test');
  assert.notEqual(res.status, 0);
  noTrace(res);
  assert.match(res.stderr, /commands\.test/);
});

test('0109 AC1: with a run already going in another worktree, speck test waits, says so once, and starts when it ends', async () => {
  const log = path.join(fs.realpathSync(os.tmpdir()), 'log.txt');
  const { dir, wt } = testRepo({ cmd: logged(log) });
  const first = speckAsync(dir, 'test');
  await until(() => readLog(log).length, 'the first run started');
  const second = speckAsync(wt, 'test');
  const [a, b] = await Promise.all([first.done, second.done]);
  assert.equal(a.status, 0, a.stderr);
  assert.equal(b.status, 0, b.stderr);
  assert.deepEqual(readLog(log), ['start', 'end', 'start', 'end'], 'the runs took turns');
  assert.equal(b.stdout.match(new RegExp(WAITING.source, 'gm'))?.length, 1, `said once that it's waiting: ${b.stdout}`);
  assert.match(b.stdout, new RegExp(`max_parallel_tests is 1`), 'and why');
  assert.ok(b.stdout.includes(dir), 'naming the folder whose run it waits for');
  assert.doesNotMatch(a.stdout, WAITING, 'the first never waited');
});

test('0109 AC1: max_parallel_tests defaults to 1 when the setting is missing', async () => {
  const log = path.join(fs.realpathSync(os.tmpdir()), 'log.txt');
  const { dir, wt } = testRepo({ cmd: logged(log) });
  const file = path.join(dir, 'speck', 'config.yml');
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/^max_parallel_tests:.*\n/m, ''));
  fs.copyFileSync(file, path.join(wt, 'speck', 'config.yml'));
  const first = speckAsync(dir, 'test');
  await until(() => readLog(log).length, 'the first run started');
  const b = await speckAsync(wt, 'test').done;
  await first.done;
  assert.equal(b.status, 0, b.stderr);
  assert.deepEqual(readLog(log), ['start', 'end', 'start', 'end']);
});

test('0109 AC1: max_parallel_tests 2 lets two runs go at once', async () => {
  const marks = fs.mkdtempSync(path.join(os.tmpdir(), 'marks-'));
  // Each run waits up to 10 seconds for the other to start, and fails if it never does.
  const cmd = `touch ${marks}/$$; i=0; while [ $(ls ${marks} | wc -l) -lt 2 ]; do i=$((i+1)); [ $i -gt 100 ] && exit 1; sleep 0.1; done`;
  const { dir, wt } = testRepo({ cmd, max: 2 });
  const [a, b] = await Promise.all([speckAsync(dir, 'test').done, speckAsync(wt, 'test').done]);
  assert.equal(a.status, 0, a.stdout + a.stderr);
  assert.equal(b.status, 0, b.stdout + b.stderr);
  assert.doesNotMatch(a.stdout + b.stdout, WAITING);
});

test('0109 AC1: a turn ends with the run, even when the tests fail', () => {
  const { dir } = testRepo({ cmd: 'false' });
  assert.equal(speck(dir, 'test').status, 1);
  const again = speck(dir, 'test');
  assert.equal(again.status, 1);
  assert.doesNotMatch(again.stdout, WAITING);
});

test('0109 AC2: the test run in speck ship waits for a turn too', async () => {
  const log = path.join(fs.realpathSync(os.tmpdir()), 'ship.log');
  const r = shipRepo({ test: `echo ran >> ${log}` });
  const holder = sleeper();
  try {
    holdTurn(r.dir, holder.pid);
    const ship = speckAsync(r.dir, 'ship', '1');
    await until(() => WAITING.test(ship.out.stdout), 'ship said it was waiting');
    await delay(700);
    assert.equal(fs.existsSync(log), false, 'the tests have not started while the turn is taken');
    holder.kill();
    const res = await ship.done;
    assert.equal(res.status, 0, res.stdout + res.stderr);
    assert.deepEqual(readLog(log), ['ran']);
    assert.equal(res.stdout.match(new RegExp(WAITING.source, 'gm')).length, 1);
  } finally { holder.kill(); }
});

test('0109 AC3: the build and review skills run the tests with speck test', () => {
  for (const skill of ['speck-build', 'speck-review']) {
    const text = fs.readFileSync(path.join(ROOT, 'skills', skill, 'SKILL.md'), 'utf8');
    assert.match(text, /speck test 2>&1 \| tee \/tmp\/speck-<id>-tests\.txt/, `${skill} runs speck test`);
    assert.doesNotMatch(text, /<test command>/, `${skill} no longer runs the test command directly`);
    assert.doesNotMatch(text, /run the test command from/i, `${skill} no longer runs the test command directly`);
  }
});

test('0109 AC4: a turn held by a process that has died is freed', () => {
  const { dir } = testRepo({ cmd: 'echo ran' });
  holdTurn(dir, deadPid());
  const res = speck(dir, 'test');
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /ran/);
  assert.doesNotMatch(res.stdout, WAITING);
});

test('0109 AC4: a turn file that can\'t be read as one is freed too', () => {
  const { dir } = testRepo({ cmd: 'echo ran' });
  holdTurn(dir, 0);
  fs.writeFileSync(path.join(dir, 'speck', '.cache', 'tests', 'slot-0.lock'), 'not json');
  const res = speck(dir, 'test');
  assert.equal(res.status, 0, res.stderr);
  assert.doesNotMatch(res.stdout, WAITING);
});

test('0109 AC4: a turn whose process dies while another waits is handed on', async () => {
  const { dir, wt } = testRepo({ cmd: 'echo ran' });
  const holder = sleeper();
  try {
    holdTurn(dir, holder.pid);
    const waiting = speckAsync(wt, 'test');
    await until(() => WAITING.test(waiting.out.stdout), 'speck test said it was waiting');
    assert.doesNotMatch(waiting.out.stdout, /^ran$/m);
    holder.kill('SIGKILL');
    const res = await waiting.done;
    assert.equal(res.status, 0, res.stderr);
    assert.match(res.stdout, /^ran$/m);
  } finally { holder.kill(); }
});

test('0109 AC5: max_parallel_tests is in the config template', () => {
  const text = fs.readFileSync(path.join(ROOT, 'templates', 'config.yml'), 'utf8');
  assert.match(text, /^max_parallel_tests: 1\s+#/m);
});

test('0109 AC5: speck config set accepts a whole number of 1 or more for max_parallel_tests', () => {
  const { dir } = testRepo();
  const file = path.join(dir, 'speck', 'config.yml');
  const ok = speck(dir, 'config', 'set', 'max_parallel_tests', '3');
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(fs.readFileSync(file, 'utf8'), /^max_parallel_tests: 3\s+#/m);
  const before = fs.readFileSync(file, 'utf8');
  for (const bad of ['0', '-1', '1.5', 'two', '']) {
    const res = speck(dir, 'config', 'set', 'max_parallel_tests', bad);
    assert.notEqual(res.status, 0, `refuses ${JSON.stringify(bad)}`);
    noTrace(res);
    assert.equal(fs.readFileSync(file, 'utf8'), before, 'the file is unchanged');
  }
});

test('0109 AC5: a max_parallel_tests that isn\'t a whole number of 1 or more stops speck test with a plain message', () => {
  const { dir } = testRepo({ cmd: 'echo ran', max: 0 });
  const res = speck(dir, 'test');
  assert.notEqual(res.status, 0);
  noTrace(res);
  assert.match(res.stderr, /max_parallel_tests/);
  assert.doesNotMatch(res.stdout, /ran/);
});
