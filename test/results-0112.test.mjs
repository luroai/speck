// 0112: speck test and speck ship reuse a test run's result when nothing outside speck/ has changed.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { shipRepo, CLI, env, gIn } from './support/ship.mjs';

const noTrace = res => assert.doesNotMatch(res.stderr, /^\s+at /m, 'no stack trace');
const speck = (cwd, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd, encoding: 'utf8', env });
const REUSED = /^Reusing the test result/m;

// A test command that counts its runs in a file outside the repo, then prints `say` and exits with `code`.
function counted(code = 0, say = 'all good') {
  const log = path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'runs-'))), 'runs.txt');
  return { log, cmd: `echo run >> ${log}; echo ${say}; exit ${code}`, runs: () => fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').length : 0 };
}

// A committed repo with speck set up and the given test command, plus a tracked file app.txt outside speck/.
function testRepo(cmd) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-results-')));
  const g = (...a) => gIn(dir, ...a);
  g('init', '-q', '-b', 'main');
  assert.equal(speck(dir, 'init', '--skip-checks').status, 0);
  assert.equal(speck(dir, 'config', 'set', 'commands.test', cmd).status, 0);
  fs.writeFileSync(path.join(dir, 'app.txt'), 'one\n');
  g('add', '-A'); g('commit', '-qm', 'base');
  const commit = (msg = 'change') => { g('add', '-A'); g('commit', '-qm', msg); };
  return { dir, g, commit, head: () => g('rev-parse', 'HEAD').stdout.trim() };
}

test('0112 AC1 AC2: a second speck test on the same code reuses the result, saying so with the commit and when', () => {
  const c = counted(0);
  const r = testRepo(c.cmd);
  const first = speck(r.dir, 'test');
  assert.equal(first.status, 0, first.stderr);
  assert.doesNotMatch(first.stdout, REUSED);
  assert.equal(c.runs(), 1);
  const again = speck(r.dir, 'test');
  assert.equal(again.status, 0, again.stderr);
  noTrace(again);
  assert.equal(c.runs(), 1, 'the suite did not run again');
  const line = again.stdout.split('\n').find(l => REUSED.test(l));
  assert.ok(line, again.stdout);
  assert.ok(line.includes(r.head().slice(0, 7)), `names the commit: ${line}`);
  assert.match(line, /\d{4}-\d{2}-\d{2} \d{2}:\d{2}/, 'and when');
  assert.match(line, /passed/);
  assert.equal(again.stdout.trim().split('\n').length, 1, 'a passing result is one line');
});

test('0112 AC1 AC2: a recorded failure is reused with its output and exit code', () => {
  const c = counted(3, 'not ok 1 - widgets');
  const r = testRepo(c.cmd);
  const first = speck(r.dir, 'test');
  assert.equal(first.status, 3);
  assert.match(first.stdout, /not ok 1 - widgets/, 'the run still shows its output');
  const again = speck(r.dir, 'test');
  assert.equal(again.status, 3);
  noTrace(again);
  assert.equal(c.runs(), 1);
  assert.match(again.stdout, REUSED);
  assert.match(again.stdout, /failed/);
  assert.match(again.stdout, /not ok 1 - widgets/, 'the failing tests\' output is printed again');
});

test('0112 AC1: a commit that changes only speck/ still reuses the result', () => {
  const c = counted(0);
  const r = testRepo(c.cmd);
  assert.equal(speck(r.dir, 'test').status, 0);
  const ticket = speck(r.dir, 'new', 'Something else');
  assert.equal(ticket.status, 0, ticket.stderr);
  r.commit('a ticket');
  const again = speck(r.dir, 'test');
  assert.equal(again.status, 0);
  assert.equal(c.runs(), 1);
  assert.match(again.stdout, REUSED);
});

test('0112 AC1: no result is recorded with uncommitted changes outside speck/, tracked or untracked', () => {
  for (const dirty of [d => fs.writeFileSync(path.join(d, 'app.txt'), 'two\n'), d => fs.writeFileSync(path.join(d, 'new.txt'), 'x\n')]) {
    const c = counted(0);
    const r = testRepo(c.cmd);
    dirty(r.dir);
    assert.equal(speck(r.dir, 'test').status, 0);
    const again = speck(r.dir, 'test');
    assert.equal(again.status, 0);
    assert.equal(c.runs(), 2, 'both runs ran the suite');
    assert.doesNotMatch(again.stdout, REUSED);
    r.g('checkout', '-q', '--', 'app.txt');
    fs.rmSync(path.join(r.dir, 'new.txt'), { force: true });
    const clean = speck(r.dir, 'test');
    assert.equal(c.runs(), 3, 'nothing was recorded while it was dirty, so the clean run runs the suite');
    assert.doesNotMatch(clean.stdout, REUSED);
  }
});

test('0112 AC1: uncommitted changes inside speck/ still let a result be recorded and reused', () => {
  const c = counted(0);
  const r = testRepo(c.cmd);
  fs.writeFileSync(path.join(r.dir, 'speck', 'ideas', 'note.md'), '# an idea\n');
  assert.equal(speck(r.dir, 'test').status, 0);
  const again = speck(r.dir, 'test');
  assert.equal(c.runs(), 1);
  assert.match(again.stdout, REUSED);
});

test('0112 AC1: a run whose files change while it runs records nothing', () => {
  const c = counted(0);
  const r = testRepo(`${c.cmd.replace(/; exit 0$/, '')}; echo changed > app.txt`);
  assert.equal(speck(r.dir, 'test').status, 0);
  r.g('checkout', '-q', '--', 'app.txt');
  const again = speck(r.dir, 'test');
  assert.equal(c.runs(), 2);
  assert.doesNotMatch(again.stdout, REUSED);
});

test('0112 AC5: a change to a file outside speck/ means the result is not reused', () => {
  const c = counted(0);
  const r = testRepo(c.cmd);
  assert.equal(speck(r.dir, 'test').status, 0);
  fs.writeFileSync(path.join(r.dir, 'app.txt'), 'two\n');
  r.commit();
  const again = speck(r.dir, 'test');
  assert.equal(c.runs(), 2);
  assert.doesNotMatch(again.stdout, REUSED);
  fs.mkdirSync(path.join(r.dir, 'lib', 'deep'), { recursive: true });
  fs.writeFileSync(path.join(r.dir, 'lib', 'deep', 'x.js'), '1\n');
  r.commit();
  speck(r.dir, 'test');
  assert.equal(c.runs(), 3, 'a new file deep in a folder counts too');
});

test('0112 AC5: a change to commands.test means the result is not reused', () => {
  const c = counted(0);
  const r = testRepo(c.cmd);
  assert.equal(speck(r.dir, 'test').status, 0);
  assert.equal(speck(r.dir, 'config', 'set', 'commands.test', `${c.cmd} # changed`).status, 0);
  r.commit();
  const again = speck(r.dir, 'test');
  assert.equal(c.runs(), 2);
  assert.doesNotMatch(again.stdout, REUSED);
});

test('0112 AC4: speck test --fresh always runs the suite, and records its result', () => {
  const c = counted(0);
  const r = testRepo(c.cmd);
  assert.equal(speck(r.dir, 'test').status, 0);
  const fresh = speck(r.dir, 'test', '--fresh');
  assert.equal(fresh.status, 0, fresh.stderr);
  assert.equal(c.runs(), 2);
  assert.doesNotMatch(fresh.stdout, REUSED);
  // --fresh on code with no result yet records one, which the next run reuses.
  fs.writeFileSync(path.join(r.dir, 'app.txt'), 'two\n');
  r.commit();
  assert.equal(speck(r.dir, 'test', '--fresh').status, 0);
  assert.equal(c.runs(), 3);
  assert.match(speck(r.dir, 'test').stdout, REUSED);
  assert.equal(c.runs(), 3);
});

test('0112 AC4: speck test refuses anything but --fresh, with no stack trace', () => {
  const r = testRepo('true');
  const res = speck(r.dir, 'test', '--frsh');
  assert.notEqual(res.status, 0);
  noTrace(res);
  assert.match(res.stderr, /speck test \[--fresh\]/);
});

test('0112 AC2: a result recorded in one worktree is reused in another on the same code', () => {
  const c = counted(0);
  const r = testRepo(c.cmd);
  const wt = path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-results-wt-'))), 'wt');
  assert.equal(r.g('worktree', 'add', '-q', '-b', 'side', wt).status, 0);
  assert.equal(speck(r.dir, 'test').status, 0);
  const there = speck(wt, 'test');
  assert.equal(there.status, 0, there.stderr);
  assert.equal(c.runs(), 1);
  assert.match(there.stdout, REUSED);
});

test('0112 AC2: a recorded result that can\'t be read is ignored, and the suite runs', () => {
  const c = counted(0);
  const r = testRepo(c.cmd);
  assert.equal(speck(r.dir, 'test').status, 0);
  const dir = path.join(r.dir, 'speck', '.cache', 'results');
  const files = fs.readdirSync(dir);
  assert.equal(files.length, 1);
  for (const bad of ['not json', 'null', '{"status":"x"}', '[]']) {
    fs.writeFileSync(path.join(dir, files[0]), bad);
    const res = speck(r.dir, 'test');
    assert.equal(res.status, 0, res.stderr);
    noTrace(res);
    assert.doesNotMatch(res.stdout, REUSED);
  }
  assert.equal(c.runs(), 5);
});

test('0112 AC3: speck ship reuses a recorded passing result, saying so in one line', () => {
  const c = counted(0);
  const r = shipRepo({ test: c.cmd });
  const built = speck(r.wt, 'test');
  assert.equal(built.status, 0, built.stderr);
  assert.equal(c.runs(), 1);
  const res = speck(r.dir, 'ship', '1');
  assert.equal(res.status, 0, res.stdout + res.stderr);
  assert.equal(c.runs(), 1, 'ship did not run the suite again');
  assert.equal(res.stdout.split('\n').filter(l => REUSED.test(l)).length, 1, res.stdout);
  assert.doesNotMatch(res.stdout, /^Running tests:/m);
});

test('0112 AC3: speck ship never reuses a recorded failure: it runs the suite', () => {
  const c = counted(0);
  const flag = path.join(path.dirname(c.log), 'fail');
  fs.writeFileSync(flag, '');
  const r = shipRepo({ test: `echo run >> ${c.log}; if [ -e ${flag} ]; then exit 1; fi` });
  assert.equal(speck(r.wt, 'test').status, 1);
  assert.equal(c.runs(), 1);
  fs.rmSync(flag);
  const res = speck(r.dir, 'ship', '1');
  assert.equal(res.status, 0, res.stdout + res.stderr);
  assert.ok(c.runs() >= 2, 'ship ran the suite');
  assert.doesNotMatch(res.stdout, REUSED);
});

test('0112 AC1 AC2: speck ship records its result, which the next build on the shipped code reuses', () => {
  const c = counted(0);
  const r = shipRepo({ test: c.cmd });
  const res = speck(r.dir, 'ship', '1');
  assert.equal(res.status, 0, res.stdout + res.stderr);
  assert.equal(c.runs(), 1);
  const next = speck(r.dir, 'test');
  assert.equal(next.status, 0, next.stderr);
  assert.equal(c.runs(), 1, 'the shipped code was already tested');
  assert.match(next.stdout, REUSED);
});

test('0112 AC1 AC2: a failure that ends normally with an exit code above 128 is recorded and reused', () => {
  const c = counted(200, 'not ok 1 - big exit');
  const r = testRepo(c.cmd);
  assert.equal(speck(r.dir, 'test').status, 200);
  const again = speck(r.dir, 'test');
  assert.equal(again.status, 200);
  assert.equal(c.runs(), 1);
  assert.match(again.stdout, REUSED);
  assert.match(again.stdout, /not ok 1 - big exit/);
});

test('0112 AC1: tests stopped by a signal record nothing, and say they were stopped', () => {
  const c = counted(0);
  const r = testRepo(`echo run >> ${c.log}; kill -TERM $$`);
  const first = speck(r.dir, 'test');
  assert.notEqual(first.status, 0);
  noTrace(first);
  assert.match(first.stderr, /stopped by SIGTERM/);
  const again = speck(r.dir, 'test');
  assert.notEqual(again.status, 0);
  assert.equal(c.runs(), 2, 'the second run ran the suite');
  assert.doesNotMatch(again.stdout, REUSED);
});
