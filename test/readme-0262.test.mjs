import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/speck.mjs';

// ---------- 0262: make the README tests pass again after the README revision ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const FILES = ['test/readme-0249.test.mjs', 'test/readme-0250.test.mjs', 'test/readme-0251.test.mjs', 'test/tagline-0255.test.mjs'];
// The opening as the revision on GitHub (commit 1041577) left it: the plain line and the two-decisions paragraph.
const PLAIN = 'speck turns ideas from a conversation into tickets, then builds, tests, reviews and ships them the same way every time.';
const DECISIONS = 'You make two decisions: what gets built and what gets shipped.';
// The old wording the four test files checked for, which the revision dropped on purpose.
const OLD_PLAIN = 'every time, so you can set them going, walk away and trust what you come back to.';
const OLD_DECISIONS = 'You own two decisions';

test('0262 AC1: the four README test files check the README as the revision left it', () => {
  const readme = read('README.md');
  const lines = readme.split('\n').filter(l => l.trim());
  assert.equal(lines[2], PLAIN);
  for (const f of FILES) {
    const src = read(f);
    assert.ok(!src.includes(OLD_PLAIN), `${f} no longer expects the old plain line`);
    assert.ok(!src.includes(OLD_DECISIONS), `${f} no longer expects the old two-decisions paragraph`);
  }
});

test('0262 AC2: the README keeps the revision\'s opening, and each changed test says why it changed', () => {
  const readme = read('README.md');
  const at = readme.indexOf('<picture>');
  const decisions = readme.indexOf(DECISIONS);
  assert.ok(readme.indexOf(PLAIN) > 0 && decisions > readme.indexOf(PLAIN) && at > decisions, 'the plain line, then the two-decisions paragraph, then the image');
  for (const f of FILES) assert.match(read(f), /0262: the README revision \(commit 1041577\)/, `${f} says the revision changed what it checks`);
});

// Every test the four files had before 0262 is still there, and none is skipped.
const NAMES = {
  'test/readme-0249.test.mjs': ['0249 AC1', '0249 AC2', '0249 AC3', '0249 AC4'],
  'test/readme-0250.test.mjs': ['0250 AC1: the README opens', '0250 AC1: the setup prompt', '0250 AC2', '0250 AC3', '0250 AC4: Under the hood covers', '0250 AC4: Under the hood agrees', '0250 AC5: the README keeps', '0250 AC5: the facts', '0250 AC6'],
  'test/readme-0251.test.mjs': ['0251 AC1', '0251 AC2', '0251 AC3', '0251 AC4', '0251 AC5'],
  'test/tagline-0255.test.mjs': ['0255 AC1', '0255 AC2'],
};

test('0262 AC3: no test in the four files is deleted or skipped', () => {
  for (const [f, names] of Object.entries(NAMES)) {
    const src = read(f);
    const tests = [...src.matchAll(/^test\((['"`])(.*?)\1/gm)].map(m => m[2]);
    assert.equal(tests.length, names.length, `${f} has ${names.length} tests`);
    for (const n of names) assert.ok(tests.some(t => t.startsWith(n)), `${f} still has "${n}"`);
    assert.doesNotMatch(src, /\btest\.(skip|todo|only)\b|\{\s*(skip|todo)\s*:/, `${f} skips no test`);
  }
});
