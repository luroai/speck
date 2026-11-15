import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT } from './support/panel.mjs';
import { installTooling, SKILL_DIRS } from '../scripts/install.mjs';
import { loadConfig } from '../scripts/core.mjs';
import { levelBuilds } from '../scripts/level-builds.mjs';

// ---------- 0685: the ticket skill suggests a level for each ticket ----------
// AC1 to AC4 are about how the skill reads, so the reviewer checks them. These check only the facts it names.

const skill = () => fs.readFileSync(path.join(ROOT, 'skills/speck-ticket/SKILL.md'), 'utf8');

test('0685 AC1: the ticket skill names the command that sets a level and where the levels are listed', () => {
  assert.match(skill(), /`speck set <id> level <name>`/);
  assert.match(skill(), /`speck status --json`[^\n]*`level_builds`/);
});

test('0685 AC1: the level_builds speck status --json gives have with the fields the skill names', () => {
  const builds = levelBuilds(loadConfig(ROOT, { machine: false }), ROOT);
  assert.ok(Array.isArray(builds) && builds.length, 'level_builds is a list');
  for (const b of builds) for (const k of ['name', 'builder', 'model', 'effort']) assert.ok(k in b, `each entry has ${k}`);
  assert.ok(builds.some(b => b.name === ''), 'one entry with a blank name gives the settings');
});

test('0685 AC1: the copies speck init installs match skills/speck-ticket/SKILL.md', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0685-'));
  installTooling(repo);
  for (const dir of SKILL_DIRS) assert.equal(fs.readFileSync(path.join(repo, dir, 'speck-ticket', 'SKILL.md'), 'utf8'), skill(), `${dir}/speck-ticket matches skills/`);
});
