import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------- 0547: setup keeps the shipping, parallel and limit defaults without asking ----------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = fs.readFileSync(path.join(ROOT, 'skills', 'speck-setup', 'SKILL.md'), 'utf8');
const KEPT = ['ship_mode', 'auto_ship', 'auto_ship_risk', 'max_parallel_builds', 'max_parallel_tests',
  'limits.max_acceptance_criteria', 'limits.max_changed_lines', 'limits.max_review_rounds'];

// The skill's section that starts with a `## <n>. ` heading.
const section = n => {
  const start = SKILL.indexOf(`\n## ${n}. `);
  const end = SKILL.indexOf('\n## ', start + 1);
  return start < 0 ? '' : SKILL.slice(start, end < 0 ? undefined : end);
};

test('0547 AC1: section 7 names each setting it leaves at its default and runs no speck config set for any of them', () => {
  const s7 = section(7);
  assert.ok(s7, 'no section 7');
  for (const k of KEPT) {
    assert.ok(s7.includes(`\`${k}\``), k);
    assert.ok(!s7.includes(`speck config set ${k}`), k);
  }
});

test('0547 AC1: nowhere does setup run speck config set for these settings, apart from pull request mode', () => {
  for (const k of KEPT.filter(k => k !== 'ship_mode')) assert.ok(!SKILL.includes(`speck config set ${k}`), k);
  const sets = SKILL.match(/speck config set ship_mode \w+/g) || [];
  assert.deepEqual(sets, ['speck config set ship_mode pr']);
});

test('0547 AC1, AC4: no step goes through these settings one at a time, nor lists them for changing when speck was already set up', () => {
  assert.doesNotMatch(SKILL, /one at a time/i);
  assert.doesNotMatch(SKILL, /\*\*Shipping without the user\.\*\*/);
  assert.doesNotMatch(SKILL, /Show all eight/i);
});

test('0547 AC2: section 7 points to the panel\'s Settings view and speck config set for changing them later', () => {
  const s7 = section(7);
  assert.match(s7, /Settings view/);
  assert.match(s7, /`speck config set`/);
});

test('0547 AC3: pull request mode is still offered in section 3, step 3, and nowhere else sets ship_mode', () => {
  const s3 = section(3);
  assert.match(s3, /\*\*Pull request mode\.\*\*/);
  assert.ok(s3.includes('speck config set ship_mode pr'));
  assert.ok(section(7).includes('`local`'));
});

test('0547 AC4: section 5 still sets the builder, the reviewer and speck\'s watch agent and their models', () => {
  const s5 = section(5);
  for (const c of ['speck config set builder', 'speck config set reviewer', 'speck config set watch_agent',
    'speck config set reviewer_model', 'speck config set builder_model', 'speck config set watch_model'])
    assert.ok(s5.includes(c), c);
});
