import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { speck } from './support/cli.mjs';
import { SETTING_GROUPS } from '../scripts/settings.mjs';

// ---------- 0269: setup goes through the main settings ----------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = fs.readFileSync(path.join(ROOT, 'templates', 'config.yml'), 'utf8');
const SKILL = fs.readFileSync(path.join(ROOT, 'skills', 'speck-setup', 'SKILL.md'), 'utf8');
const ASKED = ['auto_ship', 'auto_ship_risk', 'max_parallel_builds', 'max_parallel_tests',
  'limits.max_acceptance_criteria', 'limits.max_changed_lines', 'limits.max_review_rounds'];

// A fresh git repo with speck/config.yml holding `text`.
function repo(text = TEMPLATE) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-show-')));
  spawnSync('git', ['init', '-q'], { cwd: dir });
  fs.mkdirSync(path.join(dir, 'speck'));
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), text);
  return { dir, read: () => fs.readFileSync(path.join(dir, 'speck', 'config.yml'), 'utf8'), run: (...a) => speck(dir, process.env, ...a) };
}

test('0269 AC2: speck config show --json gives each setting of the Settings view with its group, value, whether it is the default and the same explanation', () => {
  const r = repo(TEMPLATE.replace(/^auto_ship: false/m, 'auto_ship: true').replace(/^(\s*max_changed_lines:) \d+/m, '$1 800'));
  const out = r.run('config', 'show', '--json');
  assert.equal(out.status, 0, out.stderr);
  const shown = JSON.parse(out.stdout);
  assert.deepEqual(shown.groups.map(g => g.title), SETTING_GROUPS.map(g => g.title));
  const all = Object.fromEntries(shown.groups.flatMap(g => g.settings.map(s => [s.key, { ...s, group: g.title }])));
  for (const g of SETTING_GROUPS) for (const s of g.settings) {
    assert.equal(all[s.key].explain, s.explain, s.key);
    assert.equal(all[s.key].group, g.title, s.key);
    assert.deepEqual(all[s.key].speck_default, s.default, s.key);
  }
  for (const k of ASKED) assert.ok(all[k], k);
  assert.equal(all.auto_ship.value, true);
  assert.equal(all.auto_ship.is_default, false);
  assert.equal(all['limits.max_changed_lines'].value, 800);
  assert.equal(all['limits.max_changed_lines'].is_default, false);
  assert.deepEqual(all.auto_ship_risk.value, ['low']);
  assert.equal(all.auto_ship_risk.is_default, true);
  assert.equal(all.max_parallel_builds.is_default, true);
});

test('0269 AC2: speck config show prints each group, then each setting with its value, whether it is the default and its explanation', () => {
  const r = repo(TEMPLATE.replace(/^auto_ship: false/m, 'auto_ship: true'));
  const out = r.run('config', 'show');
  assert.equal(out.status, 0, out.stderr);
  for (const g of SETTING_GROUPS) {
    assert.ok(out.stdout.includes(`${g.title}\n`), g.title);
    for (const s of g.settings) assert.ok(out.stdout.includes(s.explain), s.key);
  }
  assert.match(out.stdout, /^ {2}auto_ship: true \(speck's default is false\)$/m);
  assert.match(out.stdout, /^ {2}auto_ship_risk: \[low\] \(the default\)$/m);
  assert.match(out.stdout, /^ {2}reviewer_model: "" \(the default\)$/m);
  assert.ok(out.stdout.indexOf('Shipping') < out.stdout.indexOf('auto_ship:'), 'a setting comes under its group');
});

test('0269 AC2: speck config show changes nothing, and refuses what it does not take with a plain message', () => {
  const r = repo();
  const before = r.read();
  assert.equal(r.run('config', 'show').status, 0);
  assert.equal(r.read(), before);
  const bad = r.run('config', 'show', '--yaml');
  assert.notEqual(bad.status, 0);
  assert.match(bad.stderr, /speck config show \[--json\]/);
  const none = r.run('config');
  assert.notEqual(none.status, 0);
  assert.match(none.stderr, /speck config set <key> <value>/);
  assert.match(none.stderr, /speck config show/);
});

test('0269 AC3: speck config set records a picked value, and setting the value a setting already has leaves the file exactly as it was', () => {
  const r = repo();
  const before = r.read();
  for (const [k, v] of [['auto_ship', 'false'], ['auto_ship_risk', 'low'], ['max_parallel_builds', '1'], ['limits.max_changed_lines', '300']]) {
    const out = r.run('config', 'set', k, v);
    assert.equal(out.status, 0, out.stderr);
  }
  assert.equal(r.read(), before);
  assert.equal(r.run('config', 'set', 'max_parallel_tests', '2').status, 0);
  const after = JSON.parse(r.run('config', 'show', '--json').stdout).groups.flatMap(g => g.settings);
  assert.equal(after.find(s => s.key === 'max_parallel_tests').value, 2);
});

// 0547: setup no longer goes through these settings; it leaves them at speck's defaults (test/setup-0547.test.mjs).
test('0269 AC1, AC3: the setup skill names each setting it leaves at its default and how they are changed later', () => {
  for (const k of ASKED) assert.ok(SKILL.includes(`\`${k}\``), k);
  assert.ok(SKILL.includes('speck config set'));
});
