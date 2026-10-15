// 0209: the reviewer's test summary, and the review pack, tell tests that passed on a second try from failing ones.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { summariseTap } from '../scripts/tap.mjs';
import { reviewPack } from '../scripts/pack.mjs';
import { shipRepo, runIn, gIn } from './support/ship.mjs';
import { commandRepo } from './support/speck.mjs';

// What `speck test` prints, as node --test writes it: a full run with one failing subtest, and the run of its file once more.
const FULL = `TAP version 13
# Subtest: group
    # Subtest: 0001 AC1: widget adds up
    not ok 1 - 0001 AC1: widget adds up
      ---
      duration_ms: 1.08
      type: 'test'
      location: '/tmp/r/test/a.test.mjs:5:36'
      failureType: 'testCodeFailure'
      error: 'chance'
      code: 'ERR_TEST_FAILURE'
      ...
    1..1
not ok 1 - group
  ---
  duration_ms: 2.51
  type: 'test'
  location: '/tmp/r/test/a.test.mjs:5:1'
  failureType: 'subtestsFailed'
  error: '1 subtest failed'
  code: 'ERR_TEST_FAILURE'
  ...
# Subtest: steady
ok 2 - steady
  ---
  duration_ms: 0.24
  type: 'test'
  ...
1..2
# tests 3
# suites 0
# pass 1
# fail 2
# cancelled 0
# skipped 0
# todo 0
# duration_ms 144.72
Some tests failed: running their files once more, to tell a chance failure from a real one: node --test 'test/a.test.mjs'
`;

const again = ok => `TAP version 13
# Subtest: group
    # Subtest: 0001 AC1: widget adds up
    ${ok ? 'ok' : 'not ok'} 1 - 0001 AC1: widget adds up
      ---
      duration_ms: 1.14
      type: 'test'
${ok ? '' : `      location: '/tmp/r/test/a.test.mjs:5:36'
      failureType: 'testCodeFailure'
      error: 'not chance'
      code: 'ERR_TEST_FAILURE'
`}      ...
    1..1
${ok ? 'ok' : 'not ok'} 1 - group
  ---
  duration_ms: 2.73
  type: 'test'
  ...
# Subtest: steady
ok 2 - steady
  ---
  duration_ms: 0.24
  type: 'test'
  ...
1..2
# tests 3
# suites 0
# pass ${ok ? 3 : 1}
# fail ${ok ? 0 : 2}
# cancelled 0
# skipped 0
# todo 0
# duration_ms 177.28
`;

const PASSED_AGAIN = `${FULL}${again(true)}Flaky: group > 0001 AC1: widget adds up\n`;
const FAILED_AGAIN = `${FULL}${again(false)}`;

// The lines of one part of a summary: from its heading to the next blank line.
const part = (s, heading) => {
  const lines = s.split('\n');
  const at = lines.findIndex(l => l.startsWith(heading));
  if (at < 0) return null;
  const end = lines.indexOf('', at);
  return lines.slice(at, end < 0 ? lines.length : end);
};

test('0209 AC1: a run that passed on its second try is summarised as passed, with the tests that failed then passed apart from failing tests', () => {
  const s = summariseTap(PASSED_AGAIN, '0001', '/t.txt');
  assert.match(s, /^Result: passed\b/m);
  assert.deepEqual(part(s, 'Failing tests'), ['Failing tests (0):', '(none)']);
  assert.deepEqual(part(s, 'Passed on a second try'), ['Passed on a second try (1):', 'group > 0001 AC1: widget adds up']);
  assert.doesNotMatch(s, /error: 'chance'/, 'no failure details for a test that passed on a second try');
  assert.deepEqual(part(s, 'Tests named with 0001'), ['Tests named with 0001 (1):', 'passed on a second try: group > 0001 AC1: widget adds up']);
  // The totals are the full run's, not the second run's few files.
  assert.ok(part(s, 'Totals').includes('# tests 3') && part(s, 'Totals').includes('# fail 2'), s);
});

// Two top-level tests that failed in the full run and passed when their file ran once more.
const fails = name => `# Subtest: ${name}\nnot ok 1 - ${name}\n  ---\n  location: '/tmp/r/test/b.test.mjs:1:1'\n  error: 'x'\n  ...\n`;
const TWO = `TAP version 13\n${fails('first')}${fails('second')}1..2\n# tests 2\n# fail 2\n`
  + "Some tests failed: running their files once more, to tell a chance failure from a real one: node --test 'test/b.test.mjs'\n"
  + 'TAP version 13\n# Subtest: first\nok 1 - first\n# Subtest: second\nok 2 - second\n1..2\n# tests 2\n# pass 2\n# fail 0\nFlaky: first; second\n';

test('0209 AC1: two tests that each passed on a second try are both listed, and neither as failing', () => {
  const s = summariseTap(TWO, '0001', '/t.txt');
  assert.deepEqual(part(s, 'Passed on a second try'), ['Passed on a second try (2):', 'first', 'second']);
  assert.deepEqual(part(s, 'Failing tests'), ['Failing tests (0):', '(none)']);
  assert.deepEqual(part(s, 'Totals'), ['Totals (the full run):', '# tests 2', '# fail 2']);
});

test('0209 AC2: a run that failed on both tries lists its failing tests as before, with no second-try part', () => {
  const s = summariseTap(FAILED_AGAIN, '0001', '/t.txt');
  assert.doesNotMatch(s, /^Result:/m);
  assert.equal(part(s, 'Passed on a second try'), null);
  const failing = part(s, 'Failing tests');
  assert.equal(failing[0], 'Failing tests (4):', s);
  assert.match(s, /error: 'chance'/);
  assert.match(s, /error: 'not chance'/);
});

test('0209 AC2: a Flaky line that comes before the second try is not taken as a pass', () => {
  const s = summariseTap(`Flaky: group > 0001 AC1: widget adds up\n${FAILED_AGAIN}`, '0001', '/t.txt');
  assert.equal(part(s, 'Passed on a second try'), null);
  assert.equal(part(s, 'Failing tests')[0], 'Failing tests (4):');
});

test('0209 AC3: a run that passed first time is summarised exactly as before', () => {
  const s = summariseTap(again(true), '0001', '/t.txt');
  assert.equal(s, [
    'Test output summarised for the reviewer: the run\'s totals, every failing test with its details, and every test named with 0001. The full output is in /t.txt.',
    '', 'Totals:', '# tests 3', '# suites 0', '# pass 3', '# fail 0', '# cancelled 0', '# skipped 0', '# todo 0', '# duration_ms 177.28',
    '', 'Failing tests (0):', '(none)',
    '', 'Tests named with 0001 (1):', 'passed: group > 0001 AC1: widget adds up',
  ].join('\n'));
});

// The pack's test lines.
const testsPart = pack => part(pack, '### Tests');

test('0209 AC4: the pack says what the reviewer was told about the tests, for a round recorded with speck record', () => {
  const r = shipRepo();
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tests-')), 'tests.txt');
  fs.writeFileSync(out, PASSED_AGAIN);
  const v = path.join(path.dirname(out), 'v.json');
  fs.writeFileSync(v, JSON.stringify({ verdict: 'approve', summary: 'ok', criteria: [{ id: 1, status: 'pass', evidence: 'e' }], findings: [] }));
  const res = runIn(r.wt, 'record', '1', v, `--tests=${out}`);
  assert.equal(res.status, 0, res.stdout + res.stderr);
  gIn(r.wt, 'add', '-A'); gIn(r.wt, 'commit', '-qm', 'round 2');
  const summary = summariseTap(PASSED_AGAIN, '0001', out);
  const pack = reviewPack(r.wt, '1');
  assert.deepEqual(testsPart(pack), ['### Tests',
    '- Test output the reviewer was given in round 2: 0 failing tests, 1 passed on a second try',
    '- Passed on a second try: `group > 0001 AC1: widget adds up`']);
  // It agrees with the reviewer's summary.
  assert.deepEqual(part(summary, 'Failing tests'), ['Failing tests (0):', '(none)']);
  assert.deepEqual(part(summary, 'Passed on a second try'), ['Passed on a second try (1):', 'group > 0001 AC1: widget adds up']);
});

test('0209 AC4: the pack counts the failing tests as the reviewer\'s summary does, for a round run with speck review', () => {
  const r = commandRepo();
  const out = path.join(r.dir, '..', `tests-0209-${path.basename(r.dir)}.txt`);
  fs.writeFileSync(out, FAILED_AGAIN);
  assert.equal(r.run('review', '1', `--tests=${out}`).status, 10);
  assert.deepEqual(r.roundFile(1).meta.tests, { failing: 4, second_try: [] });
  const s = summariseTap(FAILED_AGAIN, '1', out);
  assert.equal(part(s, 'Failing tests')[0], 'Failing tests (4):');
});

test('0209 AC4: a round given no TAP output records nothing about the tests, and the pack has no tests part', () => {
  const r = shipRepo();
  assert.equal(testsPart(reviewPack(r.wt, '1')), null);
});

test('0209 AC4: speck record given a test output file that isn\'t there refuses in plain words and records nothing', () => {
  const r = shipRepo();
  const v = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'v-')), 'v.json');
  fs.writeFileSync(v, JSON.stringify({ verdict: 'approve', summary: 'ok', criteria: [{ id: 1, status: 'pass', evidence: 'e' }], findings: [] }));
  const before = gIn(r.wt, 'status', '--porcelain').stdout;
  const res = runIn(r.wt, 'record', '1', v, `--tests=${path.join(path.dirname(v), 'missing.txt')}`);
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /Can't read the test output in .*missing\.txt \(ENOENT\)\. Check the file given with --tests/);
  assert.doesNotMatch(res.stderr, /^\s+at /m, 'no stack trace');
  assert.equal(gIn(r.wt, 'status', '--porcelain').stdout, before, 'nothing recorded');
});
