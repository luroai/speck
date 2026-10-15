import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/panel.mjs';

// ---------- 0095: leave failures that were there before a build alone ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const build = () => read('skills/speck-build/SKILL.md');
const prompt = () => read('templates/reviewer-prompt.md');
const flat = s => s.replace(/\s+/g, ' ');

test('AC1: pre-flight runs the tests in the new worktree before changing anything and records what already fails', () => {
  const preflight = flat(build().split('## 1. Pre-flight')[1].split('## 2.')[0]);
  assert.match(preflight, /before (you change|changing) anything, find which tests already fail/i); // 0238: from the recorded result
  assert.match(preflight, /in that folder/i);
  assert.match(preflight, /`Failing before this build: <tests>`/);
  assert.match(preflight, /`Failing before this build: none`/);
  assert.match(preflight, /ticket's Notes/);
  // It comes after speck start has made the worktree, and before the tests are written.
  const text = build();
  assert.ok(text.indexOf('Failing before this build') > text.indexOf('Create the branch with `speck start <id>`'));
  assert.ok(text.indexOf('Failing before this build') < text.indexOf('## 2. Tests first'));
});

test('AC2: the build skill says a test failing before the build is never changed or fixed, whatever the criteria say, and goes to the Delivery log', () => {
  const text = flat(build());
  assert.match(text, /listed as failing before this build is never changed or fixed in this build, whatever the acceptance criteria say/i);
  assert.match(text, /List it as a follow-up in the ticket's `## Delivery log` instead/);
});

test('AC3: the reviewer prompt makes a fix to a failure from before the build an out-of-scope, blocking finding, even when it makes a criterion pass', () => {
  const text = flat(prompt());
  assert.match(text, /`Failing before this build:`/);
  assert.match(text, /fixes a test listed (there|as failing before this build) is an out-of-scope change and a blocking finding, even when it makes a criterion pass/i);
});

test('AC4: the reviewer prompt judges a suite-passing criterion against tests that passed before the build', () => {
  const text = flat(prompt());
  assert.match(text, /criterion that asks for the (test )?suite to pass is judged against the tests that passed before the build/i);
  assert.match(text, /failures listed as there before (the build )?don't fail it/i);
});
