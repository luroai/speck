import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setupPrompt } from './support/release.mjs';

// ---------- 0250: bring the README's wording in line with the landing page ----------
// 0267 removed the checks on the README's wording and on the order of its sections and paragraphs, which review
// checks now. 0491 removed the checks on the commands, settings and links it names, which the brief's tests check
// (docs-0491), leaving the setup prompt.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const readme = () => read('README.md');

// 0253: the setup prompt installs the latest release rather than a fixed version.
test('0250 AC1: the setup prompt keeps installing the latest release', () => {
  const prompt = setupPrompt(readme()) || '';
  assert.ok(prompt.includes("npx 'github:luroai/speck#semver:*' init"), prompt);
});
