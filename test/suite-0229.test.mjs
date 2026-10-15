import './support/tmp.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { orderFiles, readTimes, timesFile } from './support/suite.mjs';
import { summariseTap, failingTestFiles } from '../scripts/tap.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SUITE = path.join(ROOT, 'test', 'support', 'suite.mjs');

// A folder with a test/ folder of test files, each named as given, that logs its name to started.log when it starts and
// waits `ms` milliseconds in a test that fails when `fail` is set.
function fixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'suite-0229-'));
  fs.mkdirSync(path.join(dir, 'test'));
  for (const [name, { ms = 0, fail = false } = {}] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, 'test', name), [
      "import { test } from 'node:test';",
      "import fs from 'node:fs';",
      `fs.appendFileSync(${JSON.stringify(path.join(dir, 'started.log'))}, ${JSON.stringify(`${name}\n`)});`,
      `test(${JSON.stringify(`${name} waits`)}, async () => { await new Promise(r => setTimeout(r, ${ms})); });`,
      `test(${JSON.stringify(`${name} checks`)}, () => { if (${fail}) throw new Error('it failed'); });`,
    ].join('\n'));
  }
  return dir;
}

const env = () => { const e = { ...process.env }; delete e.NODE_TEST_CONTEXT; return e; };

// Runs the suite in `dir` one file at a time, so the files start in the order the runner gives them. It's started from
// a script file rather than with `node -e`, since run() hands the -e code on to each test file's process.
function runOneAtATime(dir) {
  const script = path.join(dir, 'one-at-a-time.mjs');
  fs.writeFileSync(script, `import { runSuite } from ${JSON.stringify(pathToFileURL(SUITE).href)};\nprocess.exitCode = await runSuite(process.cwd(), { concurrency: 1 });\n`);
  return spawnSync(process.execPath, [script], { cwd: dir, env: env(), encoding: 'utf8', timeout: 60000 });
}

const started = dir => fs.readFileSync(path.join(dir, 'started.log'), 'utf8').trim().split('\n');
const writeTimes = (dir, times) => {
  fs.mkdirSync(path.dirname(timesFile(dir)), { recursive: true });
  fs.writeFileSync(timesFile(dir), JSON.stringify(times));
};

test('0229 AC1: files with recorded times come longest first, then the rest alphabetically', () => {
  const files = ['test/e.test.mjs', 'test/a.test.mjs', 'test/d.test.mjs', 'test/b.test.mjs', 'test/c.test.mjs'];
  const times = new Map([['test/b.test.mjs', 5], ['test/c.test.mjs', 900], ['test/a.test.mjs', 40], ['test/gone.test.mjs', 9999]]);
  assert.deepEqual(orderFiles(files, times), ['test/c.test.mjs', 'test/a.test.mjs', 'test/b.test.mjs', 'test/d.test.mjs', 'test/e.test.mjs']);
});

test('0229 AC1: files with the same recorded time come alphabetically', () => {
  const times = new Map([['test/b.test.mjs', 7], ['test/a.test.mjs', 7]]);
  assert.deepEqual(orderFiles(['test/b.test.mjs', 'test/a.test.mjs'], times), ['test/a.test.mjs', 'test/b.test.mjs']);
});

test('0229 AC1: a full run starts its files by their last recorded times, and records each file\'s time for the next', () => {
  const dir = fixture({ 'a.test.mjs': {}, 'b.test.mjs': { ms: 400 }, 'c.test.mjs': {}, 'd.test.mjs': {} });
  writeTimes(dir, { 'test/c.test.mjs': 50, 'test/a.test.mjs': 10 });
  const first = runOneAtATime(dir);
  assert.equal(first.status, 0, first.stderr);
  assert.deepEqual(started(dir), ['c.test.mjs', 'a.test.mjs', 'b.test.mjs', 'd.test.mjs']);

  const times = readTimes(timesFile(dir));
  assert.deepEqual([...times.keys()].sort(), ['test/a.test.mjs', 'test/b.test.mjs', 'test/c.test.mjs', 'test/d.test.mjs']);
  for (const ms of times.values()) assert.ok(Number.isFinite(ms) && ms > 0);
  assert.ok(times.get('test/b.test.mjs') > times.get('test/a.test.mjs') + 300, JSON.stringify([...times]));

  fs.rmSync(path.join(dir, 'started.log'));
  const second = runOneAtATime(dir);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(started(dir)[0], 'b.test.mjs');
});

test('0229 AC1: the recorded times are kept under speck/.cache/, which git ignores', () => {
  const dir = fixture({ 'a.test.mjs': {} });
  assert.equal(spawnSync('git', ['init', '-q'], { cwd: dir }).status, 0);
  assert.equal(path.relative(dir, timesFile(dir)), path.join('speck', '.cache', 'test-times.json'));
  assert.equal(runOneAtATime(dir).status, 0);
  assert.ok(fs.existsSync(timesFile(dir)));
  const ignored = spawnSync('git', ['check-ignore', '-q', path.relative(dir, timesFile(dir))], { cwd: dir });
  assert.equal(ignored.status, 0, 'git should ignore the times file');
});

test('0229 AC2: with no recorded times, the files start alphabetically', () => {
  assert.deepEqual(orderFiles(['test/c.test.mjs', 'test/a.test.mjs', 'test/b.test.mjs'], new Map()),
    ['test/a.test.mjs', 'test/b.test.mjs', 'test/c.test.mjs']);
  const dir = fixture({ 'c.test.mjs': {}, 'a.test.mjs': {}, 'b.test.mjs': {} });
  assert.equal(fs.existsSync(timesFile(dir)), false);
  const r = runOneAtATime(dir);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(started(dir), ['a.test.mjs', 'b.test.mjs', 'c.test.mjs']);
});

test('0229 AC2: recorded times that can\'t be read count as none', () => {
  const dir = fixture({});
  assert.equal(readTimes(timesFile(dir)).size, 0);
  for (const text of ['not json', '[1,2]', 'null', '"x"']) {
    writeTimes(dir, 0);
    fs.writeFileSync(timesFile(dir), text);
    assert.equal(readTimes(timesFile(dir)).size, 0, text);
  }
  fs.writeFileSync(timesFile(dir), '{"__proto__": 5, "constructor": 3, "test/a.test.mjs": "9", "test/b.test.mjs": -1, "test/c.test.mjs": 12}');
  assert.deepEqual([...readTimes(timesFile(dir))], [['__proto__', 5], ['constructor', 3], ['test/c.test.mjs', 12]]);
  assert.deepEqual(orderFiles(['test/b.test.mjs', 'test/a.test.mjs', 'constructor'], readTimes(timesFile(dir))),
    ['constructor', 'test/a.test.mjs', 'test/b.test.mjs']);
});

test('0229 AC3: npm test runs the runner', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.test, 'node test/support/suite.mjs');
});

test('0229 AC3: a run with a failing test runs every file once, fails, and its output is read as today', () => {
  const dir = fixture({ 'a.test.mjs': {}, 'b.test.mjs': { fail: true }, 'c.test.mjs': {} });
  fs.writeFileSync(path.join(dir, 'test', 'helper.mjs'), "throw new Error('not a test file');");
  const r = spawnSync(process.execPath, [SUITE], { cwd: dir, env: env(), encoding: 'utf8', timeout: 60000 });
  assert.equal(r.status, 1, r.stderr);
  assert.deepEqual(started(dir).sort(), ['a.test.mjs', 'b.test.mjs', 'c.test.mjs']);
  assert.match(r.stdout, /^TAP version 13$/m);
  const summary = summariseTap(r.stdout, '0229', 'out.txt');
  assert.match(summary, /^# tests 6$/m);
  assert.match(summary, /^# fail 1$/m);
  assert.match(summary, /Failing tests \(1\):\nnot ok - b\.test\.mjs checks/);
  assert.deepEqual(failingTestFiles(r.stdout).map(t => ({ ...t, file: path.relative(dir, t.file) })),
    [{ name: 'b.test.mjs checks', file: path.join('test', 'b.test.mjs') }]);
});

test('0229 AC3: a run whose tests all pass exits 0', () => {
  const dir = fixture({ 'a.test.mjs': {}, 'b.test.mjs': {} });
  const r = spawnSync(process.execPath, [SUITE], { cwd: dir, env: env(), encoding: 'utf8', timeout: 60000 });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^# pass 4$/m);
});

test('0229 AC3: a run whose times can\'t be recorded still exits with the tests\' result, saying why', () => {
  const dir = fixture({ 'a.test.mjs': {} });
  fs.mkdirSync(path.join(dir, 'speck'));
  fs.writeFileSync(path.join(dir, 'speck', '.cache'), 'not a folder');
  const r = spawnSync(process.execPath, [SUITE], { cwd: dir, env: env(), encoding: 'utf8', timeout: 60000 });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /^Couldn't record the test files' times in .*test-times\.json \(EEXIST\)\. The next run starts them alphabetically\.\n$/);
});

test('0229 AC3: a file that can\'t run fails the run, and a todo test that fails doesn\'t', () => {
  const dir = fixture({ 'a.test.mjs': {} });
  fs.writeFileSync(path.join(dir, 'test', 'todo.test.mjs'),
    "import { test } from 'node:test';\ntest('to do', { todo: true }, () => { throw new Error('not yet'); });\n");
  const todo = spawnSync(process.execPath, [SUITE], { cwd: dir, env: env(), encoding: 'utf8', timeout: 60000 });
  assert.equal(todo.status, 0, todo.stderr);
  assert.match(todo.stdout, /^# todo 1$/m);
  fs.writeFileSync(path.join(dir, 'test', 'broken.test.mjs'), "throw new Error('it broke on loading');\n");
  const broken = spawnSync(process.execPath, [SUITE], { cwd: dir, env: env(), encoding: 'utf8', timeout: 60000 });
  assert.equal(broken.status, 1, broken.stderr);
  assert.match(summariseTap(broken.stdout, '0229', 'out.txt'), /Failing tests \(1\):\nnot ok - .*broken\.test\.mjs/);
});
