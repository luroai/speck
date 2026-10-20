import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/panel.mjs';

// ---------- 0345: offer a first ticket that sets up tests for an existing folder's code ----------

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
// The step's bullet that offers a ticket to set up tests for the code already there.
const offerBullet = () => {
  const bullet = testStep().split('\n').find(line => /^ {3}- /.test(line) && /sets up tests for that code/.test(line));
  assert.ok(bullet, 'section 3, step 4 has a bullet offering a ticket that sets up tests for that code');
  return bullet;
};

test('0345 AC1: with no tests and code in the folder, the step offers a draft ticket that sets up tests, after setting commands.test', () => {
  const bullet = offerBullet();
  assert.match(bullet, /holds code/);
  assert.match(bullet, /scripts, an app or a dashboard/);
  assert.match(bullet, /offer a draft ticket that sets up tests for that code/);
  assert.match(bullet, /`commands\.test` is set/);
  const step = testStep();
  assert.ok(step.indexOf(bullet) > step.indexOf('speck config set commands.test "node --test"'),
    'the offer comes after the step sets commands.test');
});

test('0345 AC2: the offered ticket\'s criteria include a passing test of the existing code and commands.test running the tests it adds', () => {
  const bullet = offerBullet();
  assert.match(bullet, /at least one test of the existing code runs and passes/);
  assert.match(bullet, /`commands\.test` runs the tests it adds/);
});

test('0345 AC3: the step says in plain words why the ticket helps', () => {
  const bullet = offerBullet();
  assert.match(bullet, /plain words/);
  assert.match(bullet, /first feature ticket has to build the test setup itself/);
  assert.match(bullet, /slow/);
});

test('0345 AC4: the ticket is made as section 4, step 5 makes one, and a folder of documents gets no offer', () => {
  const bullet = offerBullet();
  assert.match(bullet, /section 4, step 5/);
  assert.match(bullet, /after sections 5 and 6/);
  assert.match(bullet, /`draft`/);
  assert.match(bullet, /commit[^.]*only if they agree|only if they agree[^.]*commit/);
  assert.match(bullet, /only documents[^.]*no such offer/);
});

test('0345 AC5: the installed copy matches the source skill', () => {
  assert.equal(read(INSTALLED), read(SKILL));
});

test('0345 AC4: the finish step points an existing project to the offered ticket when setup made one', () => {
  const text = read(SKILL);
  const finish = text.slice(text.indexOf('## 8. Finish'));
  const line = (finish.match(/^ {3}- \*\*Existing project:\*\*.*$/m) || [''])[0];
  assert.match(line, /first ticket that sets up tests/);
});
