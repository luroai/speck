import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT } from './support/panel.mjs';
import { installTooling, SKILL_DIRS } from '../scripts/install.mjs';

// ---------- 0475: chain tickets only when they change the same part of a file ----------
// AC1 and AC2 are about how the skill reads, so the reviewer checks them. AC4 is the whole suite, which ship runs.

const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const skill = () => read('skills/speck-ticket/SKILL.md');
const chainStep = md => {
  const lines = md.split('\n');
  const start = lines.findIndex(l => /^\d+\. \*\*Chain tickets/.test(l));
  assert.ok(start >= 0, 'the ticket skill has a chaining step');
  return { text: lines[start], num: Number(lines[start].match(/^(\d+)\./)[1]) };
};

test('0475 AC3: the chaining step still never makes a loop and changes only the new ticket', () => {
  const { text } = chainStep(skill());
  assert.match(text, /[Nn]ever make a loop/);
  assert.match(text, /lead back to the new ticket/);
  assert.match(text, /Change only the new ticket/);
  assert.match(text, /never edit the other/);
});

test('0475 AC3: triage that makes tickets follows the chaining step', () => {
  const { num } = chainStep(skill());
  const triage = skill().split('## Triage the inbox')[1].split('\n## ')[0];
  const ticketIt = triage.split('\n').find(l => /"Ticket it"/.test(l)) || '';
  assert.match(ticketIt, new RegExp(`step ${num}\\b`));
  assert.match(ticketIt, /[Cc]hain/);
});

test('0475 AC3: the copies speck init installs say the same as skills/speck-ticket/SKILL.md', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0475-'));
  installTooling(repo);
  for (const dir of SKILL_DIRS) {
    const installed = path.join(repo, dir, 'speck-ticket', 'SKILL.md');
    assert.ok(!fs.lstatSync(path.dirname(installed)).isSymbolicLink(), `${dir} gets a copy outside speck's own repo`);
    assert.equal(fs.readFileSync(installed, 'utf8'), skill(), `${dir}/speck-ticket matches skills/`);
  }
});
