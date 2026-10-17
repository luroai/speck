import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setupPrompt } from './support/release.mjs';

// ---------- 0250: bring the README's wording in line with the landing page ----------
// 0267 removed the checks on the README's wording and on the order of its sections and paragraphs, which review
// checks now. What's left checks the commands, settings and links the README names.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const readme = () => read('README.md');
// The setting's value in templates/config.yml, the defaults a new project gets.
const setting = key => read('templates/config.yml').match(new RegExp(`^\\s*${key}: (\\S+)`, 'm'))?.[1];
const names = (text, list) => { for (const s of list) assert.ok(text.includes(s), `the README names ${s}`); };

// 0253: the setup prompt installs the latest release rather than a fixed version.
test('0250 AC1: the setup prompt keeps installing the latest release', () => {
  const prompt = setupPrompt(readme()) || '';
  assert.ok(prompt.includes("npx 'github:luroai/speck#semver:*' init"), prompt);
});

test('0250 AC2: the README names the commands and settings for each step from idea to ship', () => {
  names(readme(), ['/speck-capture', '/speck-ticket', 'set <id> status ready', 'after:', 'speck panel',
    '/speck-build', '/speck-review', 'speck run', 'max_parallel_builds',
    'speck pack <id>', '/speck-ship', 'auto_ship', 'auto_ship_risk']);
});

test('0250 AC3: the README names what makes each clever bit happen', () => {
  names(readme(), ['--type=fix', 'speck set <fix-id> status ready', 'speck/ideas/', 'Status: inbox', '## Blocked question',
    '/speck-build <id>', 'speck merge-check <id>', 'max_merge_rounds', 'panel --url', '## Review rounds', '## Delivery log']);
});

test('0250 AC4: the README names the review loop\'s settings and statuses, where state lives and which tests run when', () => {
  const r = readme();
  names(r, ['max_review_rounds', 'escalate_after_repeat_disputes', 'blocking', 'minor', 'fixed', 'disputed', 'needs_pm',
    '## Review log', 'speck/.cache/', 'speck/tickets/done/',
    'speck test --recorded', 'Failing before this build', 'speck test --files', 'speck ship']);
  // The default it gives is the one a new project gets, as the brief says.
  assert.match(r, new RegExp(`\`max_review_rounds\`, default ${setting('max_review_rounds')}\\b`));
});

test('0250 AC5: the README still links to OpenSpec', () => {
  assert.ok(readme().includes('(https://github.com/Fission-AI/OpenSpec)'));
});
