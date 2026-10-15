// 0238: a build lists the tests already failing from a recorded result, with `speck test --recorded`, rather than
// running the whole suite before it starts.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runIn, gIn } from './support/ship.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const flat = s => s.replace(/\s+/g, ' ');
const REUSED = /^Reusing the test result from commit [0-9a-f]{7} at /;

// A committed repo with speck set up and a test command that counts its runs in a file outside it, then exits `exit`.
function repo(exit = 0) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0238-')));
  const log = path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'runs-'))), 'runs.txt');
  gIn(dir, 'init', '-q', '-b', 'main');
  assert.equal(runIn(dir, 'init', '--skip-checks').status, 0);
  const set = runIn(dir, 'config', 'set', 'commands.test', `echo run >> ${log}; echo widgets broke; exit ${exit}`);
  assert.equal(set.status, 0, set.stderr);
  gIn(dir, 'add', '-A'); gIn(dir, 'commit', '-qm', 'base');
  const runs = () => fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').length : 0;
  return { dir, runs };
}

const noTrace = res => assert.doesNotMatch(res.stderr, /^\s+at /m, 'no stack trace');

test('0238 AC1: speck test --recorded prints the recorded result as speck test does when it reuses one, and exits with its code, without running tests', () => {
  for (const exit of [0, 3]) {
    const r = repo(exit);
    const first = runIn(r.dir, 'test');
    assert.equal(first.status, exit, first.stderr);
    assert.equal(r.runs(), 1);
    const reuse = runIn(r.dir, 'test');
    const res = runIn(r.dir, 'test', '--recorded');
    assert.equal(res.status, exit, 'exits with the recorded exit code');
    assert.equal(r.runs(), 1, 'no tests ran');
    noTrace(res);
    const line = res.stdout.split('\n')[0];
    assert.match(line, REUSED);
    assert.match(line, exit ? /: failed \(exit code 3\)\./ : /: passed\./);
    assert.equal(line, reuse.stdout.split('\n')[0].replace(' Run `speck test --fresh` to run the suite anyway.', ''), 'the same line speck test prints');
    if (exit) assert.match(res.stdout, /widgets broke/, 'with the failure\'s output');
  }
});

test('0238 AC1: with no result recorded, speck test --recorded runs nothing, says so in one line and exits 0', () => {
  const r = repo(3);
  const res = runIn(r.dir, 'test', '--recorded');
  assert.equal(res.status, 0, res.stderr);
  assert.equal(r.runs(), 0, 'no tests ran');
  noTrace(res);
  const lines = res.stdout.trim().split('\n');
  assert.equal(lines.length, 1, res.stdout);
  assert.match(lines[0], /[Nn]o test result is recorded/);
});

test('0238 AC1: a result recorded for other code is not printed: uncommitted changes, a new commit or another test command', () => {
  const r = repo(3);
  assert.equal(runIn(r.dir, 'test').status, 3);
  fs.writeFileSync(path.join(r.dir, 'app.txt'), 'changed\n');
  const dirty = runIn(r.dir, 'test', '--recorded');
  assert.equal(dirty.status, 0);
  assert.doesNotMatch(dirty.stdout, REUSED);
  gIn(r.dir, 'add', 'app.txt'); gIn(r.dir, 'commit', '-qm', 'change');
  const moved = runIn(r.dir, 'test', '--recorded');
  assert.equal(moved.status, 0);
  assert.doesNotMatch(moved.stdout, REUSED);
  // A change only under speck/, such as a ticket commit, keeps the result.
  assert.equal(runIn(r.dir, 'test').status, 3);
  assert.equal(runIn(r.dir, 'config', 'set', 'commands.test', 'echo other').status, 0);
  gIn(r.dir, 'commit', '-qam', 'other command');
  const other = runIn(r.dir, 'test', '--recorded');
  assert.equal(other.status, 0);
  assert.doesNotMatch(other.stdout, REUSED);
  assert.equal(r.runs(), 2, 'no tests ran for --recorded');
});

test('0238 AC1: --recorded with anything else is a usage error that runs nothing', () => {
  const r = repo();
  for (const args of [['--recorded', '--fresh'], ['--recorded', 'x'], ['--fresh', '--recorded']]) {
    const res = runIn(r.dir, 'test', ...args);
    assert.equal(res.status, 1, args.join(' '));
    assert.match(res.stderr, /Usage: speck test \[--fresh\], speck test --recorded, or speck test --files/);
    noTrace(res);
  }
  assert.equal(r.runs(), 0);
  assert.match(runIn(r.dir, 'help').stdout, /speck test --recorded/, 'help lists it');
});

const step6 = () => flat(read('skills/speck-build/SKILL.md').split('## 1. Pre-flight')[1].split('## 2.')[0]).split('6. In that folder')[1];

test('0238 AC2: /speck-build lists the tests failing before it changes anything with speck test --recorded, not the whole suite', () => {
  const s = step6();
  assert.match(s, /^, before you change anything,/);
  assert.ok(s.includes('`speck test --recorded 2>&1 | tee /tmp/speck-<id>-tests.txt`'), s);
  assert.ok(!s.includes('`speck test 2>&1'), 'no whole-suite run');
  assert.match(s, /[Nn]ever run the whole suite/);
  assert.match(s, /`Failing before this build: <tests>`/);
  assert.match(s, /`Failing before this build: none`/);
  assert.match(s, /`Failing before this build: not checked`/);
  assert.match(s, /no result is recorded/);
});

test('0238 AC3: the reviewer prompt treats "Failing before this build: not checked" as an empty list', () => {
  const p = flat(read('templates/reviewer-prompt.md'));
  assert.match(p, /`Failing before this build: not checked` lists no tests/);
  assert.match(p, /fixing a test unrelated to the ticket is still an unrelated change/);
});

test('0238 AC4: docs/brief.md describes speck test --recorded and says a build does not run the whole suite before it starts', () => {
  const b = flat(read('docs/brief.md'));
  assert.match(b, /`speck test --recorded` prints the result recorded for this checkout's code and test command/);
  assert.match(b, /without running any tests/);
  assert.match(b, /[Ww]ith none recorded, it runs nothing, says so in one line and exits with code 0/);
  assert.match(b, /[Aa] build doesn't run the whole suite before it starts/);
  assert.doesNotMatch(b, /runs the whole suite only before it changes anything/);
  assert.doesNotMatch(b, /apart from one run before it changes anything/);
});

test('0238 AC2: /speck-build no longer says it runs the whole suite before it changes anything', () => {
  const s = flat(read('skills/speck-build/SKILL.md'));
  assert.doesNotMatch(s, /Apart from the run before you change anything/);
  assert.match(s, /The whole suite runs in `speck ship`, not during a build, not even before you change anything \(section 1 step 6\)/);
});
