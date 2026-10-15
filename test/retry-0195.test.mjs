// 0195: a full test run that fails runs its failing tests' files once more, and passes if they pass the second time.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { shipRepo, runIn, CLI, env, gIn } from './support/ship.mjs';
import { failingTestFiles } from '../scripts/tap.mjs';

const noTrace = res => assert.doesNotMatch(res.stderr, /^\s+at /m, 'no stack trace');
// Without NODE_TEST_CONTEXT, so the node --test runs these start report to them rather than to this file's run.
const { NODE_TEST_CONTEXT, ...plain } = env; // eslint-disable-line no-unused-vars
const speck = (cwd, args, extra = {}) => spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8', env: { ...plain, ...extra } });
const SUITE = "node --test 'test/*.test.mjs'";
const FILES = 'node --test {files}';

// A folder outside the repo whose files count each test file's runs.
const counters = () => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'runs-')));
const runs = (dir, name) => { const f = path.join(dir, name); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').length : 0; };

// A test file that adds a mark to `counter` each time it runs. Its test fails on the runs listed in `failOn` (1 is the
// first), and a second test always passes.
const testFile = (counter, failOn = [], name = 'widget adds up') => `import { test } from 'node:test';
import fs from 'node:fs';
fs.appendFileSync(${JSON.stringify(counter)}, 'x');
const run = fs.readFileSync(${JSON.stringify(counter)}, 'utf8').length;
test(${JSON.stringify(name)}, () => { if (${JSON.stringify(failOn)}.includes(run)) throw new Error('chance failure on run ' + run); });
test('steady', () => {});
`;

// A committed repo with speck set up, commands.test running every test file in test/ and commands.test_files `files`.
// `tests` maps a test file's name to its source.
function testRepo(tests, { files = FILES, cmd = SUITE } = {}) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0195-')));
  const g = (...a) => gIn(dir, ...a);
  g('init', '-q', '-b', 'main');
  assert.equal(speck(dir, ['init', '--skip-checks']).status, 0);
  assert.equal(speck(dir, ['config', 'set', 'commands.test', cmd]).status, 0);
  assert.equal(speck(dir, ['config', 'set', 'commands.test_files', files]).status, 0);
  fs.mkdirSync(path.join(dir, 'test'));
  for (const [name, src] of Object.entries(tests)) fs.writeFileSync(path.join(dir, 'test', name), src);
  g('add', '-A'); g('commit', '-qm', 'base');
  return { dir, g };
}

const flakyLog = dir => { const f = path.join(dir, 'speck', '.cache', 'flaky', 'flaky.log'); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''; };

test('0195 AC1: speck test runs only the failing tests\' files again, and passes when they pass the second time', () => {
  const c = counters();
  const r = testRepo({ 'flaky.test.mjs': testFile(path.join(c, 'flaky'), [1]), 'steady.test.mjs': testFile(path.join(c, 'steady')) });
  const res = speck(r.dir, ['test']);
  assert.equal(res.status, 0, res.stdout + res.stderr);
  noTrace(res);
  assert.equal(runs(c, 'flaky'), 2, 'the failing test\'s file ran twice');
  assert.equal(runs(c, 'steady'), 1, 'the passing file ran once');
  assert.match(res.stdout, /node --test 'test\/flaky\.test\.mjs'/, 'the second run is commands.test_files with just that file');
});

test('0195 AC1: speck ship carries on when the failing tests pass the second time', () => {
  const c = counters();
  const r = shipRepo({ test: SUITE });
  fs.mkdirSync(path.join(r.dir, 'test'));
  fs.writeFileSync(path.join(r.dir, 'test', 'flaky.test.mjs'), testFile(path.join(c, 'flaky'), [1]));
  assert.equal(runIn(r.dir, 'config', 'set', 'commands.test_files', FILES).status, 0);
  r.g('add', '-A'); r.g('commit', '-qm', 'a test that fails by chance');
  const res = speck(r.dir, ['ship', '1']);
  assert.equal(res.status, 0, res.stdout + res.stderr);
  assert.equal(runs(c, 'flaky'), 2);
  assert.match(res.stdout, /^Flaky: widget adds up$/m);
  assert.match(flakyLog(r.dir), /\tspeck\/0001-export-bookings\twidget adds up$/m, 'the log names the ticket branch');
});

test('0195 AC2: a test that fails again fails the run as today, with both runs\' output in turn', () => {
  const c = counters();
  const r = testRepo({ 'broken.test.mjs': testFile(path.join(c, 'broken'), [1, 2]), 'steady.test.mjs': testFile(path.join(c, 'steady')) });
  const res = speck(r.dir, ['test']);
  assert.equal(res.status, 1);
  noTrace(res);
  assert.equal(runs(c, 'broken'), 2);
  assert.equal(runs(c, 'steady'), 1);
  const first = res.stdout.indexOf('chance failure on run 1'), second = res.stdout.indexOf('chance failure on run 2');
  assert.ok(first >= 0 && second > first, res.stdout);
  assert.equal(res.stdout.match(/^TAP version/mg).length, 2);
  assert.doesNotMatch(res.stdout, /^Flaky:/m);
  assert.equal(flakyLog(r.dir), '');
  // The result recorded for reuse is the failure, with both runs' output.
  const again = speck(r.dir, ['test']);
  assert.equal(again.status, 1);
  assert.equal(runs(c, 'broken'), 2, 'reused, not run again');
  assert.ok(again.stdout.indexOf('chance failure on run 1') < again.stdout.indexOf('chance failure on run 2'), again.stdout);
});

test('0195 AC2: the second run counts only if each test that failed passed in it', () => {
  // The second run passes, but the failing test is defined through a helper file, which runs no tests on its own.
  const c = counters();
  const helper = `import { test } from 'node:test';\nimport fs from 'node:fs';\nexport const check = () => test('helped', () => {\n  fs.appendFileSync(${JSON.stringify(path.join(c, 'helped'))}, 'x');\n  if (fs.readFileSync(${JSON.stringify(path.join(c, 'helped'))}, 'utf8').length === 1) throw new Error('chance');\n});\n`;
  const r = testRepo({ 'uses.test.mjs': "import { check } from './helper.mjs';\ncheck();\n" });
  fs.writeFileSync(path.join(r.dir, 'test', 'helper.mjs'), helper);
  r.g('add', '-A'); r.g('commit', '-qm', 'helper');
  const res = speck(r.dir, ['test']);
  assert.equal(res.status, 1, res.stdout);
  assert.doesNotMatch(res.stdout, /^Flaky:/m);
});

test('0195 AC3: a run that passed only on the second try ends with a Flaky line, and the shared log records it', () => {
  const c = counters();
  const r = testRepo({
    'a.test.mjs': testFile(path.join(c, 'a'), [1], 'first flaky'),
    'b.test.mjs': testFile(path.join(c, 'b'), [1], 'second flaky'),
  });
  // Run from a worktree on its own branch, so the log is shown to be the main checkout's.
  const wt = path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'wt-'))), 'wt');
  assert.equal(r.g('worktree', 'add', '-q', '-b', 'speck/0009-thing', wt).status, 0);
  const before = Date.now();
  const res = speck(wt, ['test']);
  assert.equal(res.status, 0, res.stdout + res.stderr);
  const lines = res.stdout.trimEnd().split('\n');
  assert.equal(lines.at(-1), 'Flaky: first flaky; second flaky');
  const log = flakyLog(r.dir).trim().split('\n').map(l => l.split('\t'));
  assert.deepEqual(log.map(l => [l[1], l[2]]), [['speck/0009-thing', 'first flaky'], ['speck/0009-thing', 'second flaky']]);
  for (const [at] of log) assert.ok(Date.parse(at) >= before - 1000 && Date.parse(at) <= Date.now(), at);
  assert.ok(!fs.existsSync(path.join(wt, 'speck', '.cache', 'flaky')), 'no log of its own in the worktree');
  // A pass on the second try is recorded as a pass.
  const again = speck(wt, ['test']);
  assert.equal(again.status, 0);
  assert.match(again.stdout, /^Reusing the test result .*: passed\./m);
});

test('0195 AC4: no second run when commands.test_files is blank', () => {
  const c = counters();
  const r = testRepo({ 'flaky.test.mjs': testFile(path.join(c, 'flaky'), [1]) }, { files: '' });
  const res = speck(r.dir, ['test']);
  assert.equal(res.status, 1);
  assert.equal(runs(c, 'flaky'), 1);
  // Nor when it has no {files} to stand for them.
  const c2 = counters();
  const r2 = testRepo({ 'flaky.test.mjs': testFile(path.join(c2, 'flaky'), [1]) }, { files: '' });
  const cfg = path.join(r2.dir, 'speck', 'config.yml'); // speck config set refuses it, but the file can say it
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^  test_files: .*$/m, '  test_files: "node --test"'));
  r2.g('commit', '-qam', 'no {files}');
  assert.equal(speck(r2.dir, ['test']).status, 1);
  assert.equal(runs(c2, 'flaky'), 1);
});

test('0195 AC4: no second run when a failing test has no location in a test file', () => {
  const c = counters();
  const count = path.join(c, 'flaky');
  // One failing test with its location in a test file, and one with none.
  const tap = (where, rest) => `printf 'TAP version 13\\n# Subtest: located\\nnot ok 1 - located\\n  ---\\n  location: '"'"'${where}:1:1'"'"'\\n  ...\\n${rest}1..2\\n'; exit 1`;
  const r = testRepo({ 'flaky.test.mjs': testFile(count, [1]) }, { cmd: tap('{dir}/test/flaky.test.mjs', 'not ok 2 - nowhere\\n') });
  const cfg = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replaceAll('{dir}', r.dir));
  r.g('commit', '-qam', 'cmd');
  assert.equal(speck(r.dir, ['test']).status, 1);
  assert.equal(runs(c, 'flaky'), 0, 'no second run');
  // A location outside the repo isn't in a test file of it.
  const r2 = testRepo({ 'flaky.test.mjs': testFile(count, [1]) }, { cmd: tap(path.join(c, 'outside.test.mjs'), '') });
  fs.writeFileSync(path.join(c, 'outside.test.mjs'), testFile(count, [1]));
  assert.equal(speck(r2.dir, ['test']).status, 1);
  assert.equal(runs(c, 'flaky'), 0, 'no second run');
});

test('0195 AC4: no second run when the run stalled', () => {
  const c = counters();
  const count = path.join(c, 'flaky');
  const r = testRepo({ 'flaky.test.mjs': testFile(count, []) }, {
    cmd: `printf 'TAP version 13\\n# Subtest: x\\nnot ok 1 - x\\n  ---\\n  location: '"'"'{dir}/test/flaky.test.mjs:1:1'"'"'\\n  ...\\n'; sleep 5`,
  });
  const cfg = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replaceAll('{dir}', r.dir));
  r.g('commit', '-qam', 'cmd');
  const res = speck(r.dir, ['test'], { SPECK_STALL_MS: '300' });
  assert.equal(res.status, 1);
  assert.match(res.stdout, /The tests stalled/);
  assert.equal(runs(c, 'flaky'), 0, 'no second run');
});

test('0195 AC1: failing tests\' files are read from their location lines', () => {
  const tap = [
    'TAP version 13',
    '# Subtest: outer',
    '    # Subtest: inner',
    '    not ok 1 - inner',
    '      ---',
    "      location: '/repo/test/it''s.test.mjs:2:36'",
    '      ...',
    '    1..1',
    'not ok 1 - outer',
    '  ---',
    "  location: '/repo/test/a.test.mjs:2:1'",
    "  failureType: 'subtestsFailed'",
    '  ...',
    'not ok 2 - bare',
    'ok 3 - fine',
    '1..3',
  ].join('\n');
  assert.deepEqual(failingTestFiles(tap), [{ name: 'outer > inner', file: "/repo/test/it's.test.mjs" }, { name: 'bare', file: null }]);
  assert.deepEqual(failingTestFiles('no tap here'), []);
});

test('0195 AC1 AC2: failing tests with the same name in two files each need to pass the second time', () => {
  const c = counters();
  const r = testRepo({
    'a.test.mjs': testFile(path.join(c, 'a'), [1], 'same name'),
    'b.test.mjs': testFile(path.join(c, 'b'), [1, 2], 'same name'),
  });
  const res = speck(r.dir, ['test']);
  assert.equal(res.status, 1, res.stdout);
  assert.equal(runs(c, 'a'), 2);
  assert.equal(runs(c, 'b'), 2, 'both files ran again');
  assert.doesNotMatch(res.stdout, /^Flaky:/m);
});

test('0195 AC4: a failing test with no location is kept even when another failing test has its name', () => {
  const tap = [
    'TAP version 13',
    'not ok 1 - same name',
    '  ---',
    "  location: '/repo/test/a.test.mjs:2:1'",
    '  ...',
    'not ok 2 - same name',
    '1..2',
  ].join('\n');
  assert.deepEqual(failingTestFiles(tap), [{ name: 'same name', file: '/repo/test/a.test.mjs' }, { name: 'same name', file: null }]);
});

test('0195 AC2: two failing tests with one name need two passes the second time', () => {
  // One file has two tests named alike that fail by chance; on the second run only one of them is defined.
  const c = counters();
  const counter = path.join(c, 'twice');
  const src = `import { test } from 'node:test';
import fs from 'node:fs';
fs.appendFileSync(${JSON.stringify(counter)}, 'x');
const run = fs.readFileSync(${JSON.stringify(counter)}, 'utf8').length;
test('twin', () => { if (run === 1) throw new Error('chance'); });
if (run === 1) test('twin', () => { throw new Error('chance'); });
`;
  const r = testRepo({ 'twice.test.mjs': src });
  const res = speck(r.dir, ['test']);
  assert.equal(res.status, 1, res.stdout);
  assert.equal(runs(c, 'twice'), 2);
  assert.doesNotMatch(res.stdout, /^Flaky:/m);
});
