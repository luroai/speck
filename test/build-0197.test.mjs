// 0197: a build runs the full suite once before each review round, and the ticket's own tests the rest of the time.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installTooling, SKILL_DIRS } from '../scripts/install.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const FULL = '`speck test 2>&1 | tee /tmp/speck-<id>-tests.txt`';

// The text of a skill from one heading up to the next, or to the end.
function section(file, heading, next) {
  const s = read(file);
  const start = s.indexOf(heading);
  assert.ok(start >= 0, `${file} has ${heading}`);
  const end = next ? s.indexOf(next, start) : -1;
  return s.slice(start, end < 0 ? undefined : end);
}
// Numbered step n of a section, up to the next numbered step.
function step(text, n) {
  const start = text.indexOf(`\n${n}. `);
  assert.ok(start >= 0, `step ${n} is there`);
  const end = text.indexOf(`\n${n + 1}. `, start);
  return text.slice(start, end < 0 ? undefined : end);
}
const implement = () => section('skills/speck-build/SKILL.md', '## 3. Implement', '## 4. Review loop');
const reviewLoop = () => section('skills/speck-build/SKILL.md', '## 4. Review loop', '## 5. Approved');
const yourTurn = () => section('skills/speck-review/SKILL.md', '## Your turn', '## Round 2 onwards');
const count = (s, sub) => s.split(sub).length - 1;

test('0197 AC1: while implementing, the build runs only the ticket\'s own test files', () => {
  const s = step(implement(), 2);
  assert.match(s, /speck test --files <file>…/);
  assert.ok(!s.includes(FULL), 'no full run when the ticket\'s tests first pass');
  assert.doesNotMatch(s, /Once they pass, run the whole suite/);
});

test('0197 AC1: self-check fixes are checked with the ticket\'s own test files, not the full suite', () => {
  const s = step(implement(), 4);
  assert.match(s, /speck test --files/);
  assert.ok(!s.includes(FULL), 'no full run after each self-check fix');
  assert.doesNotMatch(s, /then the whole suite/);
});

test('0197 AC1: the full suite runs once, after the self-check and before the first review round', () => {
  const text = implement();
  assert.equal(count(text, FULL), 1, 'one full run in Implement');
  const at = text.indexOf(FULL);
  assert.ok(at > text.indexOf('**Self-check.**'), 'after the self-check');
  assert.match(text, /whole suite once/);
  assert.match(text, /before the first review round/);
});

test('0197 AC2: the build skill runs the full suite once before each later round, merge rounds included, and not otherwise between rounds', () => {
  const s = reviewLoop();
  assert.match(s, /speck test --files/, 'fixes are checked with the ticket\'s own files');
  assert.match(s, /whole suite once \(`speck test`, not `--files`\)/);
  assert.match(s, /before the next review round, merge rounds included/);
  assert.match(s, /Don't run the whole suite at any other point between rounds/);
});

test('0197 AC2: the review skill runs the full suite once before each later round, merge rounds included, and not otherwise between rounds', () => {
  const s = yourTurn();
  assert.equal(count(s, FULL), 1, 'one full run per turn');
  assert.match(s, /speck test --files/, 'fixes are checked with the ticket\'s own files');
  assert.match(s, /whole suite once/);
  assert.match(s, /merge rounds included/);
  assert.match(s, /Don't run the whole suite at any other point between rounds/);
  assert.doesNotMatch(s, /Then re-run the whole suite/);
});

test('0197 AC3: a full run that fails because of the change is fixed with the failing tests\' own files and run again before the round', () => {
  for (const [name, text] of [['Implement', implement()], ['Review loop', reviewLoop()], ['Your turn', yourTurn()]]) {
    assert.match(text, /fails because of your change/, name);
    assert.match(text, /failing tests' own files/, name);
    assert.match(text, /run the whole suite again/, name);
    assert.match(text, /[Nn]ever start a (review )?round on a whole-suite run that failed because of your change/, name);
  }
});

test('0197 AC4: the starting check and the handed-back steps are unchanged', () => {
  const pre = step(section('skills/speck-build/SKILL.md', '## 1. Pre-flight', '## 2. Tests first'), 6);
  assert.match(pre, /before you change anything, run the test command/);
  assert.ok(pre.includes(FULL));
  const back = section('skills/speck-build/SKILL.md', '### Conflict', '### Asking the user');
  assert.match(back, /3\. Run the tests \(`speck test 2>&1 \| tee \/tmp\/speck-<id>-tests\.txt`\) and fix anything the merge broke/);
  assert.match(back, /2\. Run the tests \(`speck test 2>&1 \| tee \/tmp\/speck-<id>-tests\.txt`\), and fix the failing tests/);
});

test('0197 AC4: the skills speck init installs say the same as skills/', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0197-'));
  installTooling(dir);
  for (const d of SKILL_DIRS) for (const s of ['speck-build', 'speck-review']) {
    assert.equal(fs.readFileSync(path.join(dir, d, s, 'SKILL.md'), 'utf8'), read(`skills/${s}/SKILL.md`), `${d}/${s}`);
  }
  for (const s of ['speck-build', 'speck-review']) {
    assert.equal(read(`.claude/skills/${s}/SKILL.md`), read(`skills/${s}/SKILL.md`), `this repo's .claude/skills/${s}`);
  }
});
