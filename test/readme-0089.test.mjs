import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/panel.mjs';
import { setupPrompt, setupPromptProblems } from './support/release.mjs';

// ---------- 0089: lead the README with a prompt to give your agent ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const readme = () => read('README.md');
const prompt = () => setupPrompt(readme()) || '';

test('AC1: the README gives a prompt in a code block to paste into Claude Code', () => {
  assert.match(readme(), /Claude Code/);
  assert.ok(prompt().trim(), 'the README has a setup prompt');
});

// 0253: the prompt runs init at the latest release rather than a fixed one.
test('AC1: the prompt runs init at the latest release, follows speck-setup and names Node.js 20', () => {
  const p = prompt();
  assert.ok(p.includes("npx 'github:luroai/speck#semver:*' init"), p);
  assert.match(p, /speck-setup/);
  assert.match(p, /Node\.js 20\b/);
});

// 0253: the prompt installs the latest release, so it names no version to match package.json.
test('AC2: the prompt installs the latest release, not a fixed version', () => {
  assert.deepEqual(setupPromptProblems(readme()), []);
});

test('AC4: the README names macOS, Linux, Claude Code, git, Node.js 20 and Codex', () => {
  const r = readme();
  for (const name of [/macOS/, /Linux/, /Claude Code/, /\bgit\b/, /Node\.js 20\b/, /Codex/]) assert.match(r, name);
});
