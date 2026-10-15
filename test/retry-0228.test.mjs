// 0228: the retry after a failing run leaves out tests that already fail on the base branch.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CLI, env, gIn } from './support/ship.mjs';
import { RETRY_NOTE } from '../scripts/tap.mjs';

// Without NODE_TEST_CONTEXT, so the node --test runs these start report to them rather than to this file's run.
const { NODE_TEST_CONTEXT, ...plain } = env; // eslint-disable-line no-unused-vars
const speck = (cwd, args) => spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8', env: plain });
const noTrace = res => assert.doesNotMatch(res.stderr, /^\s+at /m, 'no stack trace');

// A folder outside the repo whose files count each test file's runs.
const counters = () => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'runs-')));
const runs = (dir, name) => { const f = path.join(dir, name); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').length : 0; };

// A test file that adds a mark to `counter` each time it runs, with a test per entry of `tests`: [name, fails], where
// fails is 'always', 'never' or 'first' (only on the file's first run).
const testFile = (counter, tests) => `import { test } from 'node:test';
import fs from 'node:fs';
fs.appendFileSync(${JSON.stringify(counter)}, 'x');
const run = fs.readFileSync(${JSON.stringify(counter)}, 'utf8').length;
${tests.map(([name, fails]) => `test(${JSON.stringify(name)}, () => { if (${fails === 'always'} || (${fails === 'first'} && run === 1)) throw new Error('fails on run ' + run); });`).join('\n')}
`;

// A committed repo on main with speck set up and `tests` (a test file's name to its source) in test/.
function testRepo(tests, cmd = "node --test 'test/*.test.mjs'") {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0228-')));
  const g = (...a) => gIn(dir, ...a);
  g('init', '-q', '-b', 'main');
  assert.equal(speck(dir, ['init', '--skip-checks']).status, 0);
  assert.equal(speck(dir, ['config', 'set', 'commands.test', cmd]).status, 0);
  assert.equal(speck(dir, ['config', 'set', 'commands.test_files', 'node --test {files}']).status, 0);
  for (const [name, src] of Object.entries(tests)) {
    const f = path.join(dir, name.includes('/') ? name : path.join('test', name));
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, src);
  }
  g('add', '-A'); g('commit', '-qm', 'base');
  return { dir, g };
}

// A worktree of `r` on a new branch from main, with `files` (a path to its content) written and committed.
function branch(r, files) {
  const wt = path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'wt-'))), 'wt');
  assert.equal(r.g('worktree', 'add', '-q', '-b', 'speck/0009-thing', wt).status, 0);
  for (const [f, src] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(wt, f)), { recursive: true }); fs.writeFileSync(path.join(wt, f), src); }
  gIn(wt, 'add', '-A'); gIn(wt, 'commit', '-qm', 'change');
  return wt;
}

// main has a test that always fails, recorded by a run of the suite on main.
function brokenOnMain() {
  const c = counters();
  const r = testRepo({ 'old.test.mjs': testFile(path.join(c, 'old'), [['old broken', 'always'], ['old fine', 'never']]) });
  const base = speck(r.dir, ['test']);
  assert.equal(base.status, 1, base.stdout);
  assert.equal(runs(c, 'old'), 2, 'main\'s run retried it as today');
  return { c, r };
}

test('0228 AC1 AC4: the retry leaves out the files of tests that already fail on the base branch', () => {
  const { c, r } = brokenOnMain();
  const wt = branch(r, { 'test/new.test.mjs': testFile(path.join(c, 'new'), [['new flaky', 'first']]) });
  const res = speck(wt, ['test']);
  noTrace(res);
  assert.equal(res.status, 1, 'still failed: a test failed');
  assert.equal(runs(c, 'old'), 3, 'the base branch\'s failing test\'s file ran only in the full run');
  assert.equal(runs(c, 'new'), 2, 'the new failing test\'s file ran again');
  assert.ok(res.stdout.includes(`${RETRY_NOTE}node --test 'test/new.test.mjs'`), res.stdout);
  assert.match(res.stdout, /^.*already fail on main.*: old broken$/m);
  assert.doesNotMatch(res.stdout, /^Flaky:/m, 'no Flaky line names a test that didn\'t fail and then pass');
  // The result recorded for the branch's code is the failure.
  const again = speck(wt, ['test']);
  assert.equal(again.status, 1);
  assert.match(again.stdout, /^Reusing the test result .*: failed/m);
});

test('0228 AC1: a file holding a new failing test runs again, with the base branch\'s failing test in it', () => {
  const { c, r } = brokenOnMain();
  const wt = branch(r, { 'test/old.test.mjs': testFile(path.join(c, 'old'), [['old broken', 'always'], ['old fine', 'never'], ['old new', 'always']]) });
  const res = speck(wt, ['test']);
  noTrace(res);
  assert.equal(res.status, 1);
  assert.equal(runs(c, 'old'), 4, 'the full run and the retry');
  assert.ok(res.stdout.includes(`${RETRY_NOTE}node --test 'test/old.test.mjs'`), res.stdout);
  assert.doesNotMatch(res.stdout, /^Flaky:/m);
});

test('0228 AC2 AC4: when every failing test already fails on the base branch there is no retry, and one line says so', () => {
  const { c, r } = brokenOnMain();
  const wt = branch(r, { 'README.md': 'changed\n' });
  const res = speck(wt, ['test']);
  noTrace(res);
  assert.equal(res.status, 1);
  assert.equal(runs(c, 'old'), 3, 'no retry');
  assert.ok(!res.stdout.includes(RETRY_NOTE), res.stdout);
  const lines = res.stdout.split('\n').filter(l => /already fail on main/.test(l));
  assert.equal(lines.length, 1, res.stdout);
  assert.match(lines[0], /old broken/);
  assert.doesNotMatch(res.stdout, /^Flaky:/m);
});

test('0228 AC1: a test with the same name failing in another file still runs again', () => {
  const { c, r } = brokenOnMain();
  const wt = branch(r, { 'test/other.test.mjs': testFile(path.join(c, 'other'), [['old broken', 'first']]) });
  const res = speck(wt, ['test']);
  assert.equal(res.status, 1);
  assert.equal(runs(c, 'old'), 3);
  assert.equal(runs(c, 'other'), 2, 'not mistaken for the base branch\'s failing test');
});

test('0228 AC3: with no result recorded for the base branch\'s code, the retry works as today', () => {
  const c = counters();
  const r = testRepo({ 'old.test.mjs': testFile(path.join(c, 'old'), [['old broken', 'always']]) });
  const wt = branch(r, { 'test/new.test.mjs': testFile(path.join(c, 'new'), [['new flaky', 'first']]) });
  const res = speck(wt, ['test']);
  noTrace(res);
  assert.equal(res.status, 1);
  assert.equal(runs(c, 'old'), 2, 'retried as today');
  assert.equal(runs(c, 'new'), 2);
  assert.doesNotMatch(res.stdout, /already fail on main/);
});

test('0228 AC3 AC4: a passing result recorded for the base branch leaves nothing out, and a flaky pass still passes', () => {
  const c = counters();
  const r = testRepo({ 'old.test.mjs': testFile(path.join(c, 'old'), [['old fine', 'never']]) });
  assert.equal(speck(r.dir, ['test']).status, 0);
  const wt = branch(r, { 'test/new.test.mjs': testFile(path.join(c, 'new'), [['new flaky', 'first']]) });
  const res = speck(wt, ['test']);
  assert.equal(res.status, 0, res.stdout);
  assert.equal(runs(c, 'new'), 2);
  assert.equal(res.stdout.trimEnd().split('\n').at(-1), 'Flaky: new flaky');
});

test('0228 AC1: a test of the same name failing in a file whose path ends the same way still runs again', () => {
  const c = counters();
  const r = testRepo({ 'packages/widget/test/check.test.mjs': testFile(path.join(c, 'deep'), [['check', 'always']]) },
    "node --test 'test/*.test.mjs' 'packages/widget/test/*.test.mjs'");
  assert.equal(speck(r.dir, ['test']).status, 1);
  const wt = branch(r, { 'test/check.test.mjs': testFile(path.join(c, 'top'), [['check', 'first']]) });
  const res = speck(wt, ['test']);
  assert.equal(res.status, 1, res.stdout);
  assert.equal(runs(c, 'top'), 2, 'the new failing file ran again');
  assert.equal(runs(c, 'deep'), 3, 'the base branch\'s failing file didn\'t');
  assert.ok(res.stdout.includes(`${RETRY_NOTE}node --test 'test/check.test.mjs'`), res.stdout);
});

test('0228 AC3: a result recorded for the base branch without the checkout that ran it leaves nothing out', () => {
  const { c, r } = brokenOnMain();
  const dir = path.join(r.dir, 'speck', '.cache', 'results');
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const { root, ...rest } = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); // eslint-disable-line no-unused-vars
    fs.writeFileSync(path.join(dir, f), JSON.stringify(rest));
  }
  const wt = branch(r, { 'README.md': 'changed\n' });
  const res = speck(wt, ['test']);
  assert.equal(res.status, 1);
  assert.equal(runs(c, 'old'), 4, 'retried as today');
  assert.doesNotMatch(res.stdout, /already fail on main/);
});
