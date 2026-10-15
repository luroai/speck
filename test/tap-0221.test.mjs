// 0221: a test that failed on both tries is listed once in the reviewer's test summary, with the full run's totals.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { summariseTap, tapCounts } from '../scripts/tap.mjs';
import { reviewPack } from '../scripts/pack.mjs';
import { shipRepo, runIn, gIn } from './support/ship.mjs';

// A failing test's TAP, with its error.
const fails = (name, n, error) => `# Subtest: ${name}\nnot ok ${n} - ${name}\n  ---\n  location: '/tmp/r/test/b.test.mjs:${n}:1'\n  error: '${error}'\n  ...\n`;
const passes = (name, n) => `# Subtest: ${name}\nok ${n} - ${name}\n  ---\n  duration_ms: 0.2\n  ...\n`;

// A full run of three tests, two failing, then their file run once more, where both fail again.
const FULL = `TAP version 13\n${fails('0221 AC1: adds up', 1, 'first try')}${fails('other', 2, 'first try')}${passes('steady', 3)}1..3\n`
  + '# tests 3\n# suites 0\n# pass 1\n# fail 2\n# duration_ms 90.5\n'
  + "Some tests failed: running their files once more, to tell a chance failure from a real one: node --test 'test/b.test.mjs'\n";
const AGAIN = `TAP version 13\n${fails('0221 AC1: adds up', 1, 'second try')}${fails('other', 2, 'second try')}1..2\n`
  + '# tests 2\n# suites 0\n# pass 0\n# fail 2\n# duration_ms 40.1\n';
const BOTH = FULL + AGAIN;

// The lines of one part of a summary: from its heading to the next blank line.
const part = (s, heading) => {
  const lines = s.split('\n');
  const at = lines.findIndex(l => l.startsWith(heading));
  if (at < 0) return null;
  const end = lines.indexOf('', at);
  return lines.slice(at, end < 0 ? lines.length : end);
};

test('0221 AC1: a test that failed on both tries is listed once, with the second try\'s error details', () => {
  const s = summariseTap(BOTH, '0221', '/t.txt');
  const failing = part(s, 'Failing tests');
  assert.equal(failing[0], 'Failing tests (2):', s);
  assert.equal(failing.filter(l => l === 'not ok - 0221 AC1: adds up').length, 1, s);
  assert.equal(failing.filter(l => l === 'not ok - other').length, 1, s);
  assert.match(s, /error: 'second try'/);
  assert.doesNotMatch(s, /error: 'first try'/);
  assert.deepEqual(part(s, 'Tests named with 0221'), ['Tests named with 0221 (1):', 'failed: 0221 AC1: adds up']);
  assert.equal(part(s, 'Passed on a second try'), null);
  assert.doesNotMatch(s, /^Result:/m);
});

test('0221 AC1: a subtest that failed on both tries, and its parent, are each listed once', () => {
  const sub = (error, top) => `TAP version 13\n# Subtest: group\n    # Subtest: inner\n    not ok 1 - inner\n      ---\n      location: '/tmp/r/test/b.test.mjs:2:3'\n      error: '${error}'\n      ...\n    1..1\nnot ok 1 - group\n  ---\n  error: '1 subtest failed'\n  ...\n1..1\n${top}`;
  const s = summariseTap(sub('first try', "# tests 2\n# fail 2\nSome tests failed: running their files once more, to tell a chance failure from a real one: node --test 'test/b.test.mjs'\n")
    + sub('second try', '# tests 2\n# fail 2\n'), '0221', '/t.txt');
  const failing = part(s, 'Failing tests');
  assert.equal(failing[0], 'Failing tests (2):', s);
  assert.equal(failing.filter(l => l === 'not ok - group > inner').length, 1, s);
  assert.equal(failing.filter(l => l === 'not ok - group').length, 1, s);
  assert.match(s, /error: 'second try'/);
  assert.doesNotMatch(s, /error: 'first try'/);
});

test('0221 AC1: a test that failed in the full run but passed on the second try, while another failed again, stays listed once', () => {
  const again = `TAP version 13\n${passes('0221 AC1: adds up', 1)}${fails('other', 2, 'second try')}1..2\n# tests 2\n# fail 1\n`;
  const s = summariseTap(FULL + again, '0221', '/t.txt');
  const failing = part(s, 'Failing tests');
  assert.equal(failing[0], 'Failing tests (2):', s);
  assert.equal(failing.filter(l => l === 'not ok - 0221 AC1: adds up').length, 1, s);
  assert.equal(failing.filter(l => l === 'not ok - other').length, 1, s);
  assert.match(s, /error: 'second try'/);
});

test('0221 AC2: the totals are the full run\'s, not the second try\'s', () => {
  const s = summariseTap(BOTH, '0221', '/t.txt');
  assert.deepEqual(part(s, 'Totals'), ['Totals:', '# tests 3', '# suites 0', '# pass 1', '# fail 2', '# duration_ms 90.5']);
});

test('0221 AC3: the failing count saved with the round counts each test that failed on both tries once', () => {
  assert.deepEqual(tapCounts(BOTH), { failing: 2, second_try: [] });
});

test('0221 AC3: the review pack shows that count', () => {
  const r = shipRepo();
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tests-')), 'tests.txt');
  fs.writeFileSync(out, BOTH);
  const v = path.join(path.dirname(out), 'v.json');
  fs.writeFileSync(v, JSON.stringify({ verdict: 'approve', summary: 'ok', criteria: [{ id: 1, status: 'pass', evidence: 'e' }], findings: [] }));
  const res = runIn(r.wt, 'record', '1', v, `--tests=${out}`);
  assert.equal(res.status, 0, res.stdout + res.stderr);
  gIn(r.wt, 'add', '-A'); gIn(r.wt, 'commit', '-qm', 'round 2');
  assert.deepEqual(part(reviewPack(r.wt, '1'), '### Tests'), ['### Tests', '- Test output the reviewer was given in round 2: 2 failing tests']);
});

test('0221 AC4: a run with no second try is summarised as before', () => {
  const s = summariseTap(FULL.split('Some tests failed')[0], '0221', '/t.txt');
  assert.equal(part(s, 'Failing tests')[0], 'Failing tests (2):');
  assert.match(s, /error: 'first try'/);
  assert.deepEqual(part(s, 'Totals'), ['Totals:', '# tests 3', '# suites 0', '# pass 1', '# fail 2', '# duration_ms 90.5']);
});

test('0221 AC1 AC3 (F1): two tests with the same name, each failing on a different try, are both listed and counted', () => {
  const at = (ok, line, error) => `# Subtest: repeated\n${ok ? 'ok' : 'not ok'} 1 - repeated\n  ---\n  location: '/tmp/r/test/b.test.mjs:${line}:1'\n${ok ? '' : `  error: '${error}'\n`}  ...\n`;
  const text = `TAP version 13\n${at(false, 1, 'one first try')}${at(true, 10)}1..2\n# tests 2\n# fail 1\n`
    + "Some tests failed: running their files once more, to tell a chance failure from a real one: node --test 'test/b.test.mjs'\n"
    + `TAP version 13\n${at(true, 1)}${at(false, 10, 'ten second try')}1..2\n# tests 2\n# fail 1\n`;
  const s = summariseTap(text, '0221', '/t.txt');
  assert.equal(part(s, 'Failing tests')[0], 'Failing tests (2):', s);
  assert.match(s, /error: 'one first try'/);
  assert.match(s, /error: 'ten second try'/);
  assert.deepEqual(tapCounts(text), { failing: 2, second_try: [] });
});

test('0221 AC1 (F1): two tests with the same name that both failed on both tries are each listed once, with their own second-try details', () => {
  const at = (line, error) => `# Subtest: repeated\nnot ok 1 - repeated\n  ---\n  location: '/tmp/r/test/b.test.mjs:${line}:1'\n  error: '${error}'\n  ...\n`;
  const text = `TAP version 13\n${at(1, 'one first')}${at(10, 'ten first')}1..2\n# tests 2\n# fail 2\n`
    + "Some tests failed: running their files once more, to tell a chance failure from a real one: node --test 'test/b.test.mjs'\n"
    + `TAP version 13\n${at(10, 'ten second')}${at(1, 'one second')}1..2\n# tests 2\n# fail 2\n`;
  const s = summariseTap(text, '0221', '/t.txt');
  const failing = part(s, 'Failing tests');
  assert.equal(failing[0], 'Failing tests (2):', s);
  assert.ok(failing.indexOf("  error: 'one second'") < failing.indexOf("  error: 'ten second'"), s);
  assert.doesNotMatch(s, /first'/);
});
