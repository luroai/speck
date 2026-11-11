// 0632: `speck test --recorded` prints the full suite's recorded result when there is one for the same code, so a
// build's "Failing before this build" list covers the full suite, not just the quick tests.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gIn, runIn } from './support/ship.mjs';
import { testedCode, testRun } from '../scripts/results.mjs';
import { sharedCacheDir } from '../scripts/turns.mjs';
import { loadConfig } from '../scripts/core.mjs';

// A committed repo whose quick and full test commands each count their runs in a file outside it.
function repo({ full = true } = {}) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0632-')));
  const logs = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'runs-')));
  const quick = `echo run >> ${logs}/quick.txt; echo quick broke; exit 3`;
  const fullCmd = `echo run >> ${logs}/full.txt; echo slow broke; exit 4`;
  gIn(dir, 'init', '-q', '-b', 'main');
  fs.mkdirSync(path.join(dir, 'speck'));
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), `base_branch: main\nmax_parallel_tests: 1\ncommands:\n  test: ${JSON.stringify(quick)}\n  test_files: "node --test {files}"\n${full === true ? `  test_full: ${JSON.stringify(fullCmd)}\n` : full === '' ? '  test_full: ""\n' : ''}`);
  fs.writeFileSync(path.join(dir, 'app.txt'), 'one\n');
  gIn(dir, 'add', '-A'); gIn(dir, 'commit', '-qm', 'base');
  const runs = name => { const f = path.join(logs, `${name}.txt`); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim().split('\n').length : 0; };
  return { dir, quick, fullCmd, runs, cfg: () => loadConfig(dir) };
}

// Records `status` and `output` for the code the checkout holds and the test command `cmd`, as a run would.
function record(r, cmd, status, output = '') {
  const code = testedCode(r.dir, cmd);
  fs.writeFileSync(path.join(sharedCacheDir(r.dir, 'results'), `${code.key}.json`), JSON.stringify({ cmd, status, commit: code.commit, at: new Date().toISOString(), output, root: r.dir }));
  return code.commit;
}

const noTrace = res => assert.doesNotMatch(res.stderr, /^\s+at /m, 'no stack trace');

test('0632 AC1: with a full-suite result recorded for the same code, --recorded prints it, saying it is the full suite\'s, its commit and when, and exits with its code', () => {
  for (const status of [0, 4]) {
    const r = repo();
    record(r, r.quick, 3, 'quick broke\n');
    const commit = record(r, r.fullCmd, status, status ? 'slow broke\n' : '');
    const res = runIn(r.dir, 'test', '--recorded');
    assert.equal(res.status, status, res.stderr);
    noTrace(res);
    const line = res.stdout.split('\n')[0];
    assert.match(line, /full suite/);
    assert.ok(line.includes(commit.slice(0, 7)), line);
    assert.match(line, / at \d{4}-\d\d-\d\d \d\d:\d\d/);
    assert.match(line, status ? /: failed \(exit code 4\)\./ : /: passed\./);
    if (status) assert.match(res.stdout, /slow broke/);
    assert.doesNotMatch(res.stdout, /quick broke/, 'not the quick tests\' result');
    assert.equal(r.runs('quick') + r.runs('full'), 0, 'no tests ran');
  }
});

test('0632 AC1: a full-suite result for other code, or for another full command, is not printed', () => {
  const r = repo();
  record(r, r.fullCmd, 4, 'slow broke\n');
  fs.writeFileSync(path.join(r.dir, 'app.txt'), 'two\n');
  gIn(r.dir, 'commit', '-qam', 'two');
  const moved = runIn(r.dir, 'test', '--recorded');
  assert.equal(moved.status, 0, moved.stderr);
  assert.doesNotMatch(moved.stdout, /full suite|slow broke/);
  record(r, `${r.fullCmd} # old`, 4, 'slow broke\n');
  const other = runIn(r.dir, 'test', '--recorded');
  assert.equal(other.status, 0, other.stderr);
  assert.doesNotMatch(other.stdout, /full suite|slow broke/);
});

test('0632 AC2: with no full-suite result, or test_full blank or missing, --recorded prints commands.test\'s result as before', () => {
  for (const full of [true, '', false]) {
    const r = repo({ full });
    record(r, r.quick, 3, 'quick broke\n');
    if (full !== true) record(r, repo().fullCmd, 4, 'slow broke\n'); // a full-looking result, but not test_full's
    const res = runIn(r.dir, 'test', '--recorded');
    assert.equal(res.status, 3, res.stderr);
    noTrace(res);
    const line = res.stdout.split('\n')[0];
    assert.match(line, /^Reusing the test result from commit [0-9a-f]{7} at /);
    assert.doesNotMatch(line, /full suite/);
    assert.match(res.stdout, /quick broke/);
    assert.doesNotMatch(res.stdout, /slow broke/);
  }
});

test('0632 AC2: with neither recorded, --recorded says so in one line and exits 0', () => {
  for (const full of [true, '']) {
    const r = repo({ full });
    const res = runIn(r.dir, 'test', '--recorded');
    assert.equal(res.status, 0, res.stderr);
    noTrace(res);
    const lines = res.stdout.trim().split('\n');
    assert.equal(lines.length, 1, res.stdout);
    assert.match(lines[0], /[Nn]o test result is recorded/);
    assert.equal(r.runs('quick') + r.runs('full'), 0);
  }
});

test('0632 AC3: speck test without --recorded runs commands.test even when only a full-suite result is recorded', () => {
  const r = repo();
  record(r, r.fullCmd, 0);
  const res = runIn(r.dir, 'test');
  assert.equal(res.status, 3, res.stderr);
  assert.equal(r.runs('quick'), 1, 'the quick tests ran');
  assert.equal(r.runs('full'), 0);
  assert.doesNotMatch(res.stdout, /full suite/);
});

test('0632 AC3: a test run reuses only a result recorded with its own command, as ship\'s and the full run\'s do', () => {
  const r = repo();
  const cfg = r.cfg();
  const quiet = console.log; console.log = () => {};
  try {
    record(r, r.fullCmd, 0);
    assert.equal(testRun(r.dir, cfg, r.quick, { reuse: 'pass' }).status, 3, 'ship\'s run of commands.test ignores the full result');
    assert.equal(r.runs('quick'), 1);
    const q = repo();
    record(q, q.quick, 0);
    assert.equal(testRun(q.dir, q.cfg(), q.fullCmd, { reuse: 'any', lane: 'full' }).status, 4, 'the full run ignores commands.test\'s result');
    assert.equal(q.runs('full'), 1);
  } finally { console.log = quiet; }
});

const ROOT = path.resolve(import.meta.dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// Facts only: the setting's name in the skill and the brief, and the help line. How they read is checked by review.
test('0632 AC1: /speck-build and the brief name commands.test_full, and the help says --recorded prints the full suite\'s result', () => {
  assert.ok(read('skills/speck-build/SKILL.md').includes('`commands.test_full`'), 'the build skill names it');
  assert.ok(read('docs/brief.md').split('`commands.test_full`').length > 2, 'the brief names it beside --recorded as well as for speck run');
  assert.match(runIn(ROOT, 'help').stdout, /speck test --recorded .*full suite/);
});
