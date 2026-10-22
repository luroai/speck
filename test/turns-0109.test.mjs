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
import { TEST_SHELL, claimTurn } from '../scripts/turns.mjs';

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
  fs.writeFileSync(path.join(dir, `slot-${n}.g0.lock`), JSON.stringify({ pid, cwd: '/somewhere/else' }));
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
  // --fresh: on the same code, a plain run would reuse the result the first records while it waits (0237).
  const second = speckAsync(wt, 'test', '--fresh');
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
  const b = await speckAsync(wt, 'test', '--fresh').done; // --fresh: see above
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
    assert.match(text, /speck test (--files <file>… )?2>&1 \| tee \/tmp\/speck-<id>-tests\.txt/, `${skill} runs speck test`); // with --files before a round since 0235
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
  fs.writeFileSync(path.join(dir, 'speck', '.cache', 'tests', 'slot-0.g0.lock'), 'not json');
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

test('0109 AC4: a speck test killed outright keeps its turn while the tests it started are still running', async () => {
  const log = path.join(fs.realpathSync(os.tmpdir()), 'log.txt');
  const once = path.join(fs.realpathSync(os.tmpdir()), 'first');
  // The first run's tests take a second to end when asked to (0174 ends them once their speck test has gone). The
  // second run's just take a moment.
  const { dir, wt } = testRepo({ cmd: `echo start >> ${log}; if mkdir ${once} 2>/dev/null; then trap 'sleep 1; echo end >> ${log}; exit 0' TERM; while :; do sleep 0.05; done; else sleep 0.5; echo end >> ${log}; fi` });
  const first = speckAsync(dir, 'test');
  await until(() => readLog(log).length, 'the first run started');
  const exited = new Promise(r => first.child.once('exit', r));
  first.child.kill('SIGKILL'); // the tests it started are ended without it, but take a second to end
  await exited; // not first.done: the orphaned tests hold its output open until they end
  const b = await speckAsync(wt, 'test').done;
  assert.equal(b.status, 0, b.stderr);
  assert.match(b.stdout, WAITING, 'the second run waited for the orphaned tests');
  assert.deepEqual(readLog(log), ['start', 'end', 'start', 'end'], 'the runs never overlapped');
});

test('0109 AC4: many runs taking over a dead turn at once never overlap', async () => {
  const marks = fs.mkdtempSync(path.join(os.tmpdir(), 'marks-'));
  // mkdir fails if another run is inside the command at the same time.
  const cmd = `mkdir ${marks}/running || exit 7; sleep 0.2; rmdir ${marks}/running`;
  const { dir, wt } = testRepo({ cmd });
  for (let round = 0; round < 2; round++) {
    const tests = path.join(dir, 'speck', '.cache', 'tests');
    if (fs.existsSync(tests)) for (const f of fs.readdirSync(tests)) fs.rmSync(path.join(tests, f));
    holdTurn(dir, deadPid());
    holdTurn(dir, deadPid());
    fs.renameSync(path.join(tests, 'slot-0.g0.lock'), path.join(tests, 'slot-0.g3.lock'));
    holdTurn(dir, deadPid());
    const runs = await Promise.all(Array.from({ length: 8 }, (_, i) => speckAsync(i % 2 ? wt : dir, 'test').done));
    for (const r of runs) assert.equal(r.status, 0, `a run overlapped another: ${r.stdout}${r.stderr}`);
  }
});

test('0109 AC4: when speck test dies before its shell starts the tests, a waiter takes over and that shell never starts them', () => {
  const { dir } = testRepo({ cmd: 'echo ran' });
  const tests = path.join(dir, 'speck', '.cache', 'tests');
  fs.mkdirSync(tests, { recursive: true });
  const run = '0109aaaa-0000-4000-8000-000000000001';
  fs.writeFileSync(path.join(tests, 'slot-0.g0.lock'), JSON.stringify({ pid: deadPid(), cwd: dir, run }));
  // The waiter takes the turn over.
  const res = speck(dir, 'test');
  assert.equal(res.status, 0, res.stderr);
  assert.doesNotMatch(res.stdout, WAITING);
  // Then the dead run's shell, paused until now, resumes: it must not start its tests.
  const marker = path.join(fs.realpathSync(os.tmpdir()), 'late.txt');
  fs.writeFileSync(path.join(tests, 'slot-0.g0.lock'), JSON.stringify({ pid: deadPid(), cwd: dir, run }));
  speck(dir, 'test'); // takes the turn over again, as above
  const late = spawnSync('sh', ['-c', TEST_SHELL, 'sh', path.join(tests, `run.${run}.pid`), path.join(tests, `run.${run}.started`), `touch ${marker}`], { cwd: dir });
  assert.notEqual(late.status, 0);
  assert.equal(fs.existsSync(marker), false, 'the late shell ran nothing');
});

test('0109 AC4: a turn whose speck process has died but whose tests have started stays held while they run', async () => {
  const { dir } = testRepo({ cmd: 'echo ran' });
  const tests = path.join(dir, 'speck', '.cache', 'tests');
  fs.mkdirSync(tests, { recursive: true });
  const run = '0109aaaa-0000-4000-8000-000000000002';
  const shell = sleeper();
  try {
    fs.writeFileSync(path.join(tests, 'slot-0.g0.lock'), JSON.stringify({ pid: deadPid(), cwd: dir, run }));
    fs.writeFileSync(path.join(tests, `run.${run}.pid`), String(shell.pid));
    fs.mkdirSync(path.join(tests, `run.${run}.started`));
    const waiting = speckAsync(dir, 'test');
    await until(() => WAITING.test(waiting.out.stdout), 'speck test said it was waiting');
    shell.kill('SIGKILL');
    const res = await waiting.done;
    assert.equal(res.status, 0, res.stderr);
    assert.match(res.stdout, /^ran$/m);
  } finally { shell.kill(); }
});

test('0109 AC4: a run that claims a turn from an out-of-date listing backs off when a lower claim is held', async () => {
  const { dir } = testRepo();
  const tests = path.join(dir, 'speck', '.cache', 'tests');
  fs.mkdirSync(tests, { recursive: true });
  const holder = sleeper();
  try {
    // A run took the turn as claim 0, after the claims this stale run had seen were cleared away.
    const held = JSON.stringify({ pid: holder.pid, cwd: dir });
    fs.writeFileSync(path.join(tests, 'slot-0.g0.lock'), held);
    const mine = path.join(tests, 'mine.tmp');
    fs.writeFileSync(mine, JSON.stringify({ pid: process.pid, cwd: dir }));
    assert.equal(claimTurn(tests, 0, 1, mine), null, 'the stale run backs off');
    assert.equal(fs.existsSync(path.join(tests, 'slot-0.g1.lock')), false, 'and withdraws its claim');
    assert.equal(fs.readFileSync(path.join(tests, 'slot-0.g0.lock'), 'utf8'), held, 'the held claim is untouched');
    // With no other claim held, the same claim is kept.
    const ended = new Promise(r => holder.once('exit', r));
    holder.kill('SIGKILL');
    await ended;
    assert.equal(claimTurn(tests, 0, 1, mine), path.join(tests, 'slot-0.g1.lock'));
  } finally { holder.kill(); }
});

test('0109 AC4: files of killed runs that no claim names are cleared once they are a day old', () => {
  const { dir } = testRepo({ cmd: 'true' });
  const tests = path.join(dir, 'speck', '.cache', 'tests');
  fs.mkdirSync(tests, { recursive: true });
  const old = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const make = (name, folder) => { const f = path.join(tests, name); folder ? fs.mkdirSync(f) : fs.writeFileSync(f, '1'); fs.utimesSync(f, old, old); return f; };
  const gone = [make('run.0109bbbb.pid'), make('run.0109bbbb.started', true), make(`turn.${deadPid()}.x.tmp`)];
  const kept = [make('run.0109cccc.started', true), make('run.0109dddd.pid')];
  fs.utimesSync(kept[1], new Date(), new Date());
  fs.writeFileSync(path.join(tests, 'slot-5.g0.lock'), JSON.stringify({ pid: deadPid(), run: '0109cccc' }));
  assert.equal(speck(dir, 'test').status, 0);
  for (const f of gone) assert.equal(fs.existsSync(f), false, `${path.basename(f)} is cleared`);
  for (const f of kept) assert.equal(fs.existsSync(f), true, `${path.basename(f)} is kept`);
});

test('0109 AC5: max_parallel_tests is in the config template', () => {
  const text = fs.readFileSync(path.join(ROOT, 'templates', 'config.yml'), 'utf8');
  assert.match(text, /^max_parallel_tests: 1\s+#/m);
});

test('0109 AC5: speck config set accepts a whole number of 1 or more for max_parallel_tests', () => {
  const { dir } = testRepo();
  const file = path.join(dir, 'speck', 'config.yml');
  const ok = speck(dir, 'config', 'set', '--repo', 'max_parallel_tests', '3');
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(fs.readFileSync(file, 'utf8'), /^max_parallel_tests: 3\s+#/m);
  const before = fs.readFileSync(file, 'utf8');
  for (const bad of ['0', '-1', '1.5', 'two', '']) {
    const res = speck(dir, 'config', 'set', '--repo', 'max_parallel_tests', bad);
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
