// 0183: the build instructions ask for quick tests, and this repo's AGENTS.md names its quick and slow options.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// Step 1 of section 2, "Tests first", in the build skill: from its "1." up to its "2.".
function testsFirstStep1() {
  const skill = read('skills/speck-build/SKILL.md');
  const section = skill.slice(skill.indexOf('## 2. Tests first'), skill.indexOf('## 3. Implement'));
  assert.ok(section.length > 0, 'section 2 is there');
  return section.slice(section.indexOf('\n1. '), section.indexOf('\n2. '));
}

// The quick-tests part of AGENTS.md: from its heading to the next heading.
function agentsQuickTests() {
  const text = read('AGENTS.md');
  const start = text.indexOf('## Quick tests');
  assert.ok(start >= 0, 'AGENTS.md has a ## Quick tests section');
  const end = text.indexOf('\n## ', start + 1);
  return text.slice(start, end < 0 ? undefined : end);
}

test('0183 AC1: step 1 of Tests first asks for the quickest check that really checks each criterion', () => {
  const step = testsFirstStep1();
  assert.match(step, /quickest way that really checks it/);
  assert.match(step, /calling the code directly/);
  assert.match(step, /lightweight stand-in/);
  assert.match(step, /rather than starting a real browser, server or long-running process/);
  assert.match(step, /unless the criterion is about that real behaviour/);
});

test('0183 AC2: step 1 asks to wait for something with a time limit, not for a fixed time, and to keep "doesn\'t happen" pauses short', () => {
  const step = testsFirstStep1();
  assert.match(step, /wait for something to happen, wait for it with a time limit rather than pausing for a fixed time/);
  assert.match(step, /pause that shows something doesn't happen as short as the check allows/);
});

test('0183 AC3: the new words in the build skill name nothing from speck\'s own repo', () => {
  const step = testsFirstStep1();
  const from = step.indexOf('quickest way');
  assert.ok(from >= 0);
  const added = step.slice(from);
  for (const word of ['fakePage', 'browserPage', 'startPanel', 'speck run', 'scripts/', 'Chromium', 'panel', 'AGENTS.md']) {
    assert.ok(!added.includes(word), `the new words mention ${word}`);
  }
});

test('0183 AC4: AGENTS.md names the quick options, the slow ones and when a slow one is worth it', () => {
  const part = agentsQuickTests();
  for (const quick of ['fakePage()', 'scripts/']) assert.ok(part.includes(quick), `names ${quick}`);
  for (const slow of ['browserPage()', 'startPanel()', 'speck run']) assert.ok(part.includes(slow), `names ${slow}`);
  assert.match(part, /worth it only when/);
});

test('0183 AC4: the quick and slow helpers AGENTS.md names exist in the test support code', () => {
  const panel = read('test/support/panel.mjs');
  assert.match(panel, /export function fakePage\(/);
  assert.match(panel, /export async function browserPage\(/);
  assert.match(panel, /export async function startPanel\(/);
});

test('0183 AC4: the quick-tests section sits outside the ## speck section that speck init replaces', () => {
  const text = read('AGENTS.md');
  const speck = text.indexOf('## speck');
  const quick = text.indexOf('## Quick tests');
  assert.ok(speck >= 0 && quick >= 0 && quick < speck, 'it comes before ## speck');
});
