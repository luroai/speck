import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT, reviewRepo } from './support/speck.mjs';
import { summariseTap } from '../scripts/tap.mjs';

// ---------- 0119: send the reviewer a summary of the test output ----------

// TAP as `node --test` writes it: passing, failing, nested, skipped and todo tests, and the ticket's own (0001).
const TAP = `TAP version 13
# Subtest: 0001 AC1: export works
ok 1 - 0001 AC1: export works
  ---
  duration_ms: 0.9
  type: 'test'
  ...
# Subtest: OTHER-PASSING-MARKER from another ticket
ok 2 - OTHER-PASSING-MARKER from another ticket
  ---
  duration_ms: 0.1
  type: 'test'
  ...
# Subtest: 0042 AC3: breaks
not ok 3 - 0042 AC3: breaks
  ---
  duration_ms: 0.7
  type: 'test'
  location: '/x/a.test.mjs:5:1'
  failureType: 'testCodeFailure'
  error: '1 == 2'
  code: 'ERR_ASSERTION'
  stack: |-
    STACK-LINE-MARKER (file:///x/a.test.mjs:5:30)
  ...
# Subtest: a suite
    # Subtest: NESTED-PASSING-MARKER
    ok 1 - NESTED-PASSING-MARKER
      ---
      duration_ms: 1.2
      type: 'test'
      ...
    # Subtest: nested bad
    not ok 2 - nested bad
      ---
      duration_ms: 0.1
      type: 'test'
      error: |-
        NESTED-ERROR-MARKER
      ...
    # Subtest: 0001 AC2: nested own test
    ok 3 - 0001 AC2: nested own test
      ---
      duration_ms: 0.1
      type: 'test'
      ...
    1..3
not ok 4 - a suite
  ---
  duration_ms: 1.7
  type: 'suite'
  failureType: 'subtestsFailed'
  error: '1 subtest failed'
  ...
# Subtest: 0001 AC3: not yet
ok 5 - 0001 AC3: not yet # SKIP
  ---
  duration_ms: 0.1
  type: 'test'
  ...
# Subtest: 10001 is not the ticket
ok 6 - 10001 is not the ticket
  ---
  duration_ms: 0.1
  type: 'test'
  ...
1..6
# tests 7
# suites 1
# pass 4
# fail 2
# cancelled 0
# skipped 1
# todo 0
# duration_ms 78.4
`;

test('0119 AC1: a TAP summary keeps the totals, every failing test with its details, and the ticket\'s own tests with their result', () => {
  const s = summariseTap(TAP, '0001', '/tmp/speck-0001-tests.txt');
  for (const line of ['# tests 7', '# suites 1', '# pass 4', '# fail 2', '# cancelled 0', '# skipped 1', '# todo 0', '# duration_ms 78.4']) assert.ok(s.includes(line), `totals keep ${line}`);
  assert.match(s, /not ok - 0042 AC3: breaks/);
  for (const detail of ["error: '1 == 2'", "code: 'ERR_ASSERTION'", "location: '/x/a.test.mjs:5:1'", 'STACK-LINE-MARKER']) assert.ok(s.includes(detail), `failing test keeps ${detail}`);
  assert.match(s, /not ok - a suite > nested bad/, 'a nested failing test is named with its suite');
  assert.ok(s.includes('NESTED-ERROR-MARKER'));
  assert.match(s, /not ok - a suite\n/, 'the failing suite is listed too');
  assert.match(s, /passed: 0001 AC1: export works/);
  assert.match(s, /passed: a suite > 0001 AC2: nested own test/);
  assert.match(s, /skipped: 0001 AC3: not yet/);
});

test('0119 AC1: a failing test named with the ticket\'s id is listed with its details and as failed', () => {
  const tap = TAP.replace('ok 1 - 0001 AC1: export works\n  ---\n', "not ok 1 - 0001 AC1: export works\n  ---\n  error: 'OWN-FAIL-MARKER'\n");
  const s = summariseTap(tap, '0001', '/t.txt');
  assert.match(s, /failed: 0001 AC1: export works/);
  assert.ok(s.includes('OWN-FAIL-MARKER'));
});

test('0119 AC2: the summary says it was summarised and gives the full output\'s path', () => {
  const s = summariseTap(TAP, '0001', '/tmp/speck-0001-tests.txt');
  assert.match(s.split('\n')[0], /summarised/i);
  assert.ok(s.split('\n')[0].includes('/tmp/speck-0001-tests.txt'));
});

test('0119 AC3: passing tests not named with the ticket\'s id are left out', () => {
  const s = summariseTap(TAP, '0001', '/t.txt');
  assert.doesNotMatch(s, /OTHER-PASSING-MARKER|NESTED-PASSING-MARKER/);
  assert.doesNotMatch(s, /10001 is not the ticket/, 'an id inside a longer number is not the ticket\'s id');
  assert.doesNotMatch(s, /duration_ms: 0\.9/, 'a passing test\'s details are left out');
});

test('0119 AC1: output before the TAP header, as speck test may print, doesn\'t stop it being TAP', () => {
  const s = summariseTap(`Waiting for a turn to run the tests.\n${TAP}`, '0001', '/t.txt');
  assert.ok(s && s.includes('# fail 2'));
});

test('0119 AC4: output that isn\'t TAP isn\'t summarised', () => {
  assert.equal(summariseTap('PASS src/a.test.js\nTests: 3 passed\n', '0001', '/t.txt'), null);
  assert.equal(summariseTap('', '0001', '/t.txt'), null);
  assert.equal(summariseTap('Reusing the test result from an earlier commit: passed.\n', '0001', '/t.txt'), null);
});

// The prompt as `speck prompt` prints it and as `speck review` sends it, for the same test output file.
function prompts(text) {
  const r = reviewRepo();
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-tests-')), 'tests.txt');
  fs.writeFileSync(file, text);
  const printed = r.run('prompt', '0001', `--tests=${file}`);
  assert.equal(printed.status, 0, printed.stderr);
  r.run('review', '0001', `--tests=${file}`);
  const [sent] = r.prompts();
  assert.ok(sent, 'the reviewer was sent a prompt');
  return { file, printed: printed.stdout, sent };
}

test('0119 AC1 AC2 AC3: speck prompt and speck review give the reviewer the summary of TAP output', () => {
  const { file, printed, sent } = prompts(TAP);
  for (const p of [printed, sent]) {
    assert.ok(p.includes('# fail 2'));
    assert.ok(p.includes('STACK-LINE-MARKER'));
    assert.match(p, /passed: 0001 AC1: export works/);
    assert.match(p, /summarised/i);
    assert.ok(p.includes(file), 'the full output\'s path is given');
    assert.doesNotMatch(p, /OTHER-PASSING-MARKER|NESTED-PASSING-MARKER/);
  }
});

test('0119 AC4: speck prompt and speck review give the reviewer output that isn\'t TAP in full', () => {
  const jest = 'PASS src/a.test.js\n  ✓ OTHER-PASSING-MARKER (3 ms)\nTests: 1 passed, 1 total\n';
  const { printed, sent } = prompts(jest);
  for (const p of [printed, sent]) {
    assert.ok(p.includes(jest.trimEnd()), 'the output is there as it was');
    assert.doesNotMatch(p, /summarised/i);
  }
});

test('0119 AC5: the build skill tells the builder to start each new test\'s name with the ticket\'s id and criterion number', () => {
  const skill = fs.readFileSync(path.join(ROOT, 'skills', 'speck-build', 'SKILL.md'), 'utf8');
  const step = skill.split('\n').find(l => l.startsWith('1. For each acceptance criterion'));
  assert.match(step, /start each test's name with the ticket's id and its criterion number/i);
  assert.match(step, /`<id> AC2: …`/);
});
