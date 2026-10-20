import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/panel.mjs';

// ---------- 0331: set a test command that passes until there are tests ----------

const SKILL = path.join(ROOT, 'skills', 'speck-setup', 'SKILL.md');
const INSTALLED = path.join(ROOT, '.claude', 'skills', 'speck-setup', 'SKILL.md');
const read = file => fs.readFileSync(file, 'utf8');

// Section 3, step 4: from "4. **Test command.**" up to step 5.
const testStep = () => {
  const text = read(SKILL);
  const section = text.slice(text.indexOf('## 3. An existing project'), text.indexOf('## 4. A new project'));
  const start = section.indexOf('4. **Test command.**');
  assert.ok(start >= 0, 'section 3 has a Test command step');
  return section.slice(start, section.indexOf('\n5. ', start));
};
const noTestsBullet = () => (testStep().match(/^ {3}- If they have no tests.*$/m) || [''])[0];

test('0331 AC1: with no tests, the step recommends node --test, runs it once and sets it if it passes', () => {
  const bullet = noTestsBullet();
  assert.ok(bullet, 'the step has a bullet for no tests');
  assert.match(bullet, /recommend `node --test`/);
  assert.match(bullet, /run it once/i);
  assert.match(bullet, /if it passes/i);
  assert.ok(bullet.includes('speck config set commands.test "node --test"'), bullet);
  assert.doesNotMatch(bullet, /^ {3}- If they have no tests, leave it blank/);
});

test('0331 AC2: the step says nothing can ship with it blank, and the reviewer checks document changes', () => {
  const step = testStep();
  assert.match(step, /blank[^.]*nothing can ship|nothing can ship[^.]*blank/i);
  assert.match(step, /document[^.]*reviewer|reviewer[^.]*document/i);
});

test('0331 AC3: if the user still wants it blank, the step keeps the offer of a draft ticket to add a test runner', () => {
  const step = testStep();
  assert.match(step, /still want[^.]*blank/i);
  assert.match(step, /offer a draft ticket to add a test runner/);
  assert.match(step, /after sections 5 and 6, as in section 4, step 5/);
});

test('0331 AC4: the installed copy matches the source skill', () => {
  assert.equal(read(INSTALLED), read(SKILL));
});
