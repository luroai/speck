import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT } from './support/panel.mjs';
import { installTooling, SKILL_DIRS } from '../scripts/install.mjs';

// ---------- 0672: chain tickets only when one needs the other's work ----------
// AC1, AC2 and AC4's rules for the step are about how the skill reads, so the reviewer checks them. AC5 is the whole suite, which ship runs.

const skill = () => fs.readFileSync(path.join(ROOT, 'skills/speck-ticket/SKILL.md'), 'utf8');
const chainStep = md => {
  const lines = md.split('\n');
  const start = lines.findIndex(l => /^\d+\. \*\*Chain tickets/.test(l));
  assert.ok(start >= 0, 'the ticket skill has a chaining step');
  return { text: lines[start], num: Number(lines[start].match(/^(\d+)\./)[1]) };
};

test('0672 AC3: the ticket skill never says "count it as an overlap"', () => {
  assert.doesNotMatch(skill(), /count it as an overlap/i);
});

test('0672 AC4: triage that makes tickets still points to the chaining step', () => {
  const { num } = chainStep(skill());
  const triage = skill().split('## Triage the inbox')[1].split('\n## ')[0];
  const ticketIt = triage.split('\n').find(l => /"Ticket it"/.test(l)) || '';
  assert.match(ticketIt, new RegExp(`step ${num}\\b`));
  assert.match(ticketIt, /[Cc]hain/);
});

test('0672 AC4: the copies speck init installs match skills/speck-ticket/SKILL.md', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0672-'));
  installTooling(repo);
  for (const dir of SKILL_DIRS) {
    const installed = path.join(repo, dir, 'speck-ticket', 'SKILL.md');
    assert.equal(fs.readFileSync(installed, 'utf8'), skill(), `${dir}/speck-ticket matches skills/`);
  }
});
