import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/panel.mjs';

// ---------- 0510: setup opens the panel and turns speck run on when it finishes ----------
// Only the facts the skill gives are tested: its commands, its link and the log's path. How it reads is checked by review.

const SKILL = path.join(ROOT, 'skills', 'speck-setup', 'SKILL.md');
const INSTALLED = path.join(ROOT, '.claude', 'skills', 'speck-setup', 'SKILL.md');
const read = file => fs.readFileSync(file, 'utf8');

test('0510 AC1: setup starts the panel with speck panel --background', () => {
  assert.match(read(SKILL), /`speck panel --background`/);
  assert.equal(read(INSTALLED), read(SKILL), 'the installed skill is the same');
});

test('0510 AC2: setup opens the panel\'s address, and links to the README\'s panel section', () => {
  const text = read(SKILL);
  assert.match(text, /`open <address>`/);
  assert.match(text, /`xdg-open <address>`/);
  const link = text.match(/https:\/\/github\.com\/([^/\s]+\/[^/#\s]+)#the-panel\b/);
  assert.ok(link, 'it links to the anchor GitHub gives the README\'s "The panel" heading');
  assert.equal(`github:${link[1]}`, JSON.parse(read(path.join(ROOT, 'package.json'))).repository, 'the link names speck\'s own repo');
});

test('0510 AC3: setup turns speck run on in the background, writing to the log the switch uses', () => {
  assert.match(read(SKILL), /`mkdir -p speck\/\.cache\/runs && nohup node \.speck\/scripts\/speck\.mjs run >> speck\/\.cache\/runs\/run\.log 2>&1 < \/dev\/null &`/);
  assert.match(read(path.join(ROOT, 'scripts', 'panel-run.mjs')), /path\.join\(runsDir\(repo\), 'run\.log'\)/, 'the panel\'s switch writes the same log');
});

test('0510 AC4: setup gives speck panel to start the panel later', () => {
  assert.match(read(SKILL), /`speck panel`/);
});

test('0510 AC5: setup still gives speck set <id> status ready', () => {
  assert.match(read(SKILL), /`speck set <id> status ready`/);
});
