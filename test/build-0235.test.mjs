// 0235: a build runs only the ticket's own test files, and the whole suite runs once per ticket, in speck ship.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handBackMessage } from '../scripts/hand-back.mjs';
import { reviewRepo } from './support/speck.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const flat = s => s.replace(/\s+/g, ' ');
const BUILD = 'skills/speck-build/SKILL.md', REVIEW = 'skills/speck-review/SKILL.md';
const FULL = '`speck test 2>&1 | tee /tmp/speck-<id>-tests.txt`';
const FILES = '`speck test --files <file>… 2>&1 | tee /tmp/speck-<id>-tests.txt`';

// The text of a file from one heading up to the next, or to the end.
function section(file, heading, next) {
  const s = read(file);
  const start = s.indexOf(heading);
  assert.ok(start >= 0, `${file} has ${heading}`);
  const end = next ? s.indexOf(next, start + heading.length) : -1;
  return s.slice(start, end < 0 ? undefined : end);
}
// The three kinds of test file a round runs.
function namesTheFiles(text, name) {
  const t = flat(text);
  assert.match(t, /the ticket's own test files, any existing test files it changed and the files of any test that failed in its last test run/, name);
}

test('0235 AC1: /speck-build runs only the ticket\'s test files before round 1, and never the whole suite', () => {
  const s = section(BUILD, '## 3. Implement', '## 4. Review loop');
  assert.ok(s.includes(FILES), 'the output for round 1 comes from speck test --files');
  assert.ok(!s.includes(FULL), 'no whole-suite run before round 1');
  namesTheFiles(s, 'Implement');
  assert.match(flat(s), /[Nn]ever run the whole suite \(`speck test` without `--files`\)/);
});

test('0235 AC1: /speck-build runs only the ticket\'s test files before later rounds and merge rounds', () => {
  const s = section(BUILD, '## 4. Review loop', '## 5. Approved');
  assert.ok(s.includes(FILES));
  assert.match(s, /merge rounds included/);
  namesTheFiles(s, 'Review loop');
  assert.match(flat(s), /[Nn]ever run the whole suite \(`speck test` without `--files`\)/);
  assert.doesNotMatch(s, /run the whole suite once/);
  const merge = section(BUILD, '### Conflict', '### Tests fail together');
  assert.ok(merge.includes(FILES), 'after a merge');
  assert.ok(!merge.includes(FULL), 'no whole-suite run after a merge');
  namesTheFiles(merge, 'Conflict');
});

test('0235 AC1: /speck-review runs only the ticket\'s test files before every round, and says so in each round\'s response file', () => {
  const before = section(REVIEW, '## Before every round', '## Reviewer model');
  assert.ok(before.includes(FILES));
  assert.ok(!before.includes(FULL));
  namesTheFiles(before, 'Before every round');
  assert.match(flat(before), /[Nn]ever run the whole suite \(`speck test` without `--files`\)/);
  assert.match(flat(before), /round 1, later rounds and merge rounds alike/);
  assert.match(flat(before), /response file, `\/tmp\/speck-<id>-response\.md`, written fresh for the round, round 1 included, that says which test files you ran/);
  const turn = section(REVIEW, '## Your turn', '## Round 2 onwards');
  assert.ok(!turn.includes(FULL));
  assert.doesNotMatch(turn, /run the whole suite once/);
  assert.match(turn, /Tests run:/, 'the response file has a line for the test files');
  // Round 1 has a response file too.
  const one = section(REVIEW, '## Round 1', '## Your turn');
  assert.equal(one.split('--response=/tmp/speck-<id>-response.md').length - 1, 3, 'codex, command and subagent reviewers all get it');
});

test('0235 AC1: round 1 passes the builder\'s response file to the reviewer', () => {
  const r = reviewRepo();
  const response = path.join(r.dir, 'response.md');
  fs.writeFileSync(response, '- Tests run: test/x-0001.test.mjs\n');
  const printed = r.run('prompt', '1', `--response=${response}`);
  assert.equal(printed.status, 0, printed.stderr);
  assert.match(printed.stdout, /## Builder response\n+- Tests run: test\/x-0001\.test\.mjs/);
  const res = r.run('review', '1', `--response=${response}`);
  assert.equal(res.status, 10, res.stderr + res.stdout);
  assert.match(r.prompts()[0], /## Builder response\n+- Tests run: test\/x-0001\.test\.mjs/);
  const none = r.run('prompt', '1');
  assert.doesNotMatch(none.stdout, /## Builder response/, 'no section when there is no response file');
});

test('0235 AC2: the reviewer prompt says the test output covers only the files run, and the whole-suite check is speck ship\'s', () => {
  const p = flat(read('templates/reviewer-prompt.md'));
  assert.match(p, /test output covers only the test files the builder ran with `speck test --files`/);
  assert.match(p, /no test that passed before fails is checked by `speck ship`'s whole-suite run/);
  assert.match(p, /judge it from the tests that were run and the change, and don't fail it for want of a whole-suite run/);
});

test('0235 AC3: "Tests fail together" runs the failing tests\' files and the ticket\'s own, not the whole suite', () => {
  const s = section(BUILD, '### Tests fail together', '### Handed back again');
  assert.ok(s.includes(FILES));
  assert.ok(!s.includes(FULL));
  assert.match(flat(s), /the files of the failing tests `speck ship` named, plus the ticket's own test files/);
  assert.match(flat(s), /failed on the ticket as it would land/);
  assert.match(flat(s), /its own change/);
  assert.match(flat(s), /base branch's newer changes/);
  assert.doesNotMatch(s, /don't work together/);
  const back = section(BUILD, '### When speck run hands it back', '### Conflict');
  assert.match(flat(back), /failed on the ticket as it would land/);
});

test('0235 AC3: the hand-back message says the tests failed on the ticket as it would land, for either reason', () => {
  const m = handBackMessage({ id: '0001', kind: 'tests', why: 'Tests failed.', base: 'main', count: 1 });
  assert.match(m, /failed on it as it would land/);
  assert.match(m, /its own change/);
  assert.match(m, /main's newer changes/);
  assert.match(m, /main's own tests pass/);
  assert.match(m, /"Tests fail together"/);
});

// 0267 left the brief's wording to review.
test('0235 AC4: /speck-build says the whole suite runs in speck ship, not during a build', () => {
  for (const f of [BUILD]) {
    const s = flat(read(f));
    assert.match(s, /the whole suite runs in `speck ship`, not during a build/i, f);
    assert.doesNotMatch(s, /whole suite[^.|]*before (each|every|the first|the next) review round/i, f);
    assert.doesNotMatch(s, /runs the whole suite at least once per review round/i, f);
  }
});

test('0235 AC1: a round-1 response is sent as written, and a saved round-1 prompt still gives its test output back', () => {
  const r = reviewRepo();
  const response = path.join(r.dir, 'response.md');
  fs.writeFileSync(response, '- Tests run: a $& b {{DIFF}} ```\n');
  const tests = path.join(r.dir, 'tests.txt');
  fs.writeFileSync(tests, 'tests-marker\n');
  const printed = r.run('prompt', '1', `--tests=${tests}`, `--response=${response}`).stdout;
  assert.ok(printed.includes('- Tests run: a $& b {{DIFF}} ```'), 'the response as written');
  assert.ok(printed.indexOf('## Builder response') < printed.indexOf('tests-marker'), 'before the test output');
  const missing = r.run('prompt', '1', `--response=${path.join(r.dir, 'nope.md')}`);
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /Can't read the builder's response in .*nope\.md/);
  assert.doesNotMatch(missing.stderr, /at .*\.mjs:\d+/, 'no stack trace');
});

test('0235 AC4: the brief names speck ship', () => {
  assert.ok(read('docs/brief.md').includes('`speck ship`'));
});
