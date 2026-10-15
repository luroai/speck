// 0227: a build waits for each test run and review round it starts, so it never ends while one is still running.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installTooling, SKILL_DIRS } from '../scripts/install.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// The bullet of a skill's section that starts with `start`, up to the next bullet or heading.
function bullet(file, start) {
  const s = read(file);
  const at = s.indexOf(`\n- ${start}`);
  assert.ok(at >= 0, `${file} has a bullet starting "${start}"`);
  const end = s.slice(at + 1).search(/\n(- |#)/);
  return s.slice(at + 1, end < 0 ? undefined : at + 1 + end);
}
const buildRule = () => bullet('skills/speck-build/SKILL.md', 'Wait for every command you start');
const reviewRule = () => bullet('skills/speck-review/SKILL.md', 'Wait for every command you start');

test('0227 AC1: /speck-build tells the builder to run every test run in the foreground and wait for it, however long it takes', () => {
  const s = buildRule();
  assert.match(s, /`speck test`/);
  assert.match(s, /`--files`/);
  assert.match(s, /in the foreground/);
  assert.match(s, /however long it takes/);
  assert.match(read('skills/speck-build/SKILL.md'), /## Rules[\s\S]*- Wait for every command you start/, 'it is one of the Rules');
});

test('0227 AC1: /speck-build says never to end the turn while a command it started is still running in the background, and why', () => {
  const s = buildRule();
  assert.match(s, /[Nn]ever end your turn while a command you started is still running in the background/);
  assert.match(s, /`speck run`/);
  assert.match(s, /ends when your turn ends/);
  assert.match(s, /stopped with it/);
});

test('0227 AC1: each place /speck-build runs the whole suite points to the rule', () => {
  const s = read('skills/speck-build/SKILL.md');
  const preflight = s.slice(s.indexOf('## 1. Pre-flight'), s.indexOf('## 2. Tests first'));
  const implement = s.slice(s.indexOf('## 3. Implement'), s.indexOf('## 4. Review loop'));
  for (const [name, text] of [['Pre-flight', preflight], ['Implement', implement]]) {
    assert.match(text, /in the foreground/, `${name} says to run it in the foreground`);
  }
});

test('0227 AC2: /speck-review tells the builder to wait for each review round and each test run between rounds, and why', () => {
  const s = reviewRule();
  assert.match(s, /`speck review`/);
  assert.match(s, /reviewer subagent/);
  assert.match(s, /`speck test`/);
  assert.match(s, /between rounds/);
  assert.match(s, /in the foreground/);
  assert.match(s, /however long it takes/);
  assert.match(s, /[Nn]ever end your turn while a command you started is still running in the background/);
  assert.match(s, /`speck run`/);
  assert.match(s, /ends when your turn ends/);
  assert.match(s, /stopped with it/);
  assert.match(read('skills/speck-review/SKILL.md'), /## Before every round[\s\S]*- Wait for every command you start[\s\S]*## Reviewer model/, 'it is under Before every round');
});

test('0227 AC1, AC2: installed and this repo\'s own copies of both skills carry the change', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0227-'));
  installTooling(dir);
  for (const d of SKILL_DIRS) for (const s of ['speck-build', 'speck-review']) {
    assert.equal(fs.readFileSync(path.join(dir, d, s, 'SKILL.md'), 'utf8'), read(`skills/${s}/SKILL.md`), `${d}/${s}`);
  }
  for (const s of ['speck-build', 'speck-review']) {
    assert.equal(read(`.claude/skills/${s}/SKILL.md`), read(`skills/${s}/SKILL.md`), `this repo's .claude/skills/${s}`);
  }
});
