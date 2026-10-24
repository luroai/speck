import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, gitEnv } from './support/panel.mjs';
import { panelSettings, panelSetSetting, SETTING_GROUPS, EDITABLE } from '../scripts/settings.mjs';
import { settingsPage, openSettings } from './support/settings.mjs';

// ---------- 0406: put the building Settings groups in one box ----------

Object.assign(process.env, gitEnv); // panelSetSetting commits in this process

const BUILDING = ['builder', 'builder_model', 'builder_effort', 'reviewer', 'reviewer_model', 'reviewer_effort', 'allow_same_model_review',
  'max_parallel_builds', 'max_parallel_tests', 'limits.max_acceptance_criteria', 'limits.max_changed_lines', 'limits.max_review_rounds'];
const titles = () => SETTING_GROUPS.map(g => g.title);

test('0406 AC1: Settings has one Building and reviewing group, and no How much runs at once or Ticket size limits group', async () => {
  assert.equal(titles().filter(t => t === 'Building and reviewing').length, 1);
  for (const gone of ['How much runs at once', 'Ticket size limits']) assert.ok(!titles().includes(gone), gone);
  // As the panel draws the server's own groups: one box with that heading, and none with the others.
  const r = panelRepo();
  const p = settingsPage([panelSettings(r.dir)]);
  await p.settle();
  await openSettings(p);
  const heads = p.all(p.byId('settings')).filter(n => n.tagName === 'h4').map(n => n.textContent);
  assert.equal(heads.filter(t => t === 'Building and reviewing').length, 1, heads.join(', '));
  for (const gone of ['How much runs at once', 'Ticket size limits']) assert.ok(!heads.includes(gone), gone);
});

test('0406 AC2: the group holds the builder and reviewer settings, then the parallel settings, then the size limits, in order', () => {
  assert.deepEqual(SETTING_GROUPS.find(g => g.title === 'Building and reviewing').settings.map(s => s.key), BUILDING);
  const r = panelRepo();
  assert.deepEqual(panelSettings(r.dir).groups.find(g => g.title === 'Building and reviewing').settings.map(s => s.key), BUILDING);
});

test('0406 AC2: each moved setting still reads, explains and saves as it did', () => {
  const r = panelRepo();
  const cfg = path.join(r.dir, 'speck', 'config.yml');
  const values = { max_parallel_builds: '3', max_parallel_tests: '2', 'limits.max_acceptance_criteria': '6', 'limits.max_changed_lines': '400', 'limits.max_review_rounds': '4' };
  for (const [key, value] of Object.entries(values)) {
    assert.ok(EDITABLE.includes(key), `${key} is still editable`);
    assert.equal(panelSetSetting(r.dir, key, value).status, 200, key);
  }
  const s = Object.fromEntries(panelSettings(r.dir).groups.flatMap(g => g.settings).map(x => [x.key, x]));
  for (const [key, value] of Object.entries(values)) {
    assert.equal(String(s[key].value), value, key);
    assert.equal(s[key].editable, true, key);
    assert.ok(typeof s[key].explain === 'string' && s[key].explain.length > 0, key);
  }
  assert.match(fs.readFileSync(cfg, 'utf8'), /max_changed_lines: 400/);
});

test('0406 AC3: Shipping and Foreman stay their own groups, with the settings they had', () => {
  const keys = title => SETTING_GROUPS.find(g => g.title === title)?.settings.map(s => s.key);
  assert.deepEqual(keys('Shipping'), ['auto_ship', 'auto_ship_risk', 'ship_mode']);
  assert.deepEqual(keys('Watching'), ['foreman_fixing', 'foreman', 'foreman_model', 'foreman_effort']);
  assert.deepEqual(titles(), ['Watching', 'Shipping', 'Building and reviewing']);
});
