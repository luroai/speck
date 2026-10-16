import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/panel.mjs';
import { setupPromptProblems } from './support/release.mjs';

// ---------- 0089: lead the README with a prompt to give your agent ----------

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const readme = () => read('README.md');
const headings = () => [...readme().matchAll(/^## (.+)$/gm)].map(m => m[1]);
const section = name => {
  const m = readme().match(new RegExp(`^## ${name}\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm'));
  return m ? m[1] : '';
};
const prompt = () => (section('Get started').match(/```[^\n]*\n([\s\S]*?)```/) || [])[1] || '';

test('AC1: "Get started" is the first section after the introduction', () => {
  assert.equal(headings()[0], 'Get started');
});

test('AC1: Get started gives a prompt in a code block to paste into Claude Code', () => {
  assert.match(section('Get started'), /Claude Code/);
  assert.ok(prompt().trim(), 'Get started has a code block');
});

// 0253: the prompt runs init at the latest release rather than a fixed one.
test('AC1: the prompt runs init at the latest release, follows speck-setup, offers Node.js 20+ and asks before changes', () => {
  const p = prompt();
  assert.ok(p.includes("npx 'github:luroai/speck#semver:*' init"), p);
  assert.match(p, /speck-setup/);
  assert.match(p, /Node\.js 20 or newer/);
  assert.match(p, /ask (me )?before/i);
  assert.match(p, /machine/);
  assert.match(p, /git/);
});

// 0253: the prompt installs the latest release, so it names no version to match package.json.
test('AC2: the prompt installs the latest release, not a fixed version', () => {
  assert.deepEqual(setupPromptProblems(readme()), []);
});

test('AC3: the terminal command without an agent is in a later "Without an agent" section', () => {
  const h = headings();
  assert.ok(h.indexOf('Without an agent') > h.indexOf('Get started'), 'Without an agent comes after Get started');
  assert.match(section('Without an agent'), /```bash\nnpx 'github:luroai\/speck#semver:\*' init\n```/);
  assert.doesNotMatch(section('Get started'), /```bash/);
});

test('AC4: Requirements name macOS or Linux, Claude Code, git and Node.js 20 or newer, with Codex optional', () => {
  const req = section('Requirements');
  assert.match(req, /macOS or Linux/);
  assert.match(req, /Claude Code/);
  assert.match(req, /\bgit\b/);
  assert.match(req, /Node\.js 20 or newer[^\n]*agent can install/);
  assert.match(req, /optional[^\n]*Codex/i);
});
