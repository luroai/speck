// 0707: the Settings view shows machine_parallel_tests, your own limit for every project on this machine, and saves it
// in your home folder as `speck config set machine_parallel_tests` does, without touching the repo.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { panelRepo, gitEnv } from './support/panel.mjs';
import { speck } from './support/cli.mjs';
import { settingsPage, openSettings, rowOf, controlOf, changeTo, saveButton, posted } from './support/settings.mjs';
import { panelSettings, panelSaveSettings, panelSaveRequest } from '../scripts/settings.mjs';
import { homeSettings, setHomeSetting } from '../scripts/home-settings.mjs';

Object.assign(process.env, gitEnv);

// A fresh home settings folder for each test, so none sees another's value.
function freshHome(n) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0707-home-'));
  process.env.SPECK_HOME_SETTINGS_DIR = dir;
  if (n !== undefined) fs.writeFileSync(path.join(dir, 'config.yml'), `machine_parallel_tests: ${n}\n`);
  return dir;
}
const building = view => view.groups.find(g => g.title === 'Building and reviewing').settings;
const keys = view => building(view).map(s => s.key);
const repoState = r => ({ config: fs.readFileSync(path.join(r.dir, 'speck', 'config.yml'), 'utf8'), head: r.g('rev-parse', 'HEAD'), status: r.g('status', '--porcelain') });
// The reason `speck config set` refuses `raw` with.
function cliRefusal(raw) {
  try { setHomeSetting('machine_parallel_tests', raw, false); } catch (e) { return e.message; }
  assert.fail(`speck config set took ${JSON.stringify(raw)}`);
}

// ---------- AC1 ----------

test('0707 AC1: Settings has machine_parallel_tests right after max_parallel_tests, blank when it isn\'t set', () => {
  const r = panelRepo();
  freshHome();
  const view = panelSettings(r.dir), at = keys(view).indexOf('max_parallel_tests');
  assert.ok(at >= 0);
  assert.equal(keys(view)[at + 1], 'machine_parallel_tests');
  const row = building(view)[at + 1];
  assert.equal(row.value, '');
  assert.equal(row.editable, true);
  assert.notEqual(row.for_machine, true, 'it isn\'t one of this project\'s machine values');
  assert.match(`${row.summary} ${row.explain}`, /every project/i);
  assert.match(row.explain, /not only this one/i);
  assert.doesNotMatch(row.explain, /saved for your machine only/i);
  assert.equal(keys(view).filter(k => k === 'machine_parallel_tests').length, 1);
});

test('0707 AC1: Settings shows the value saved in the home folder', () => {
  const r = panelRepo();
  freshHome(3);
  const row = building(panelSettings(r.dir)).find(s => s.key === 'machine_parallel_tests');
  assert.equal(row.value, 3);
  assert.equal(row.default, false);
});

test('0707 AC1: speck config show lists machine_parallel_tests once', () => {
  const r = panelRepo();
  const home = freshHome(2);
  const out = speck(r.dir, { ...process.env, SPECK_HOME_SETTINGS_DIR: home }, 'config', 'show', '--json');
  assert.equal(out.status, 0, out.stderr);
  const rows = JSON.parse(out.stdout).groups.flatMap(g => g.settings).filter(s => s.key === 'machine_parallel_tests');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].value, 2);
});

const row = (key, value, o = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, ...o });
const view = n => ({ groups: [{ title: 'Building and reviewing', settings: [
  row('max_parallel_tests', 1, { for_machine: true, from: 'repo', repo_value: 1 }),
  row('machine_parallel_tests', n, { label: 'Test runs at once on this machine', summary: 'Across every project on this machine, not only this one.', every_project: true, default: n === '' })] }] });

test('0707 AC1: the page draws it as a number box with its value', async () => {
  const p = settingsPage([view(4)]);
  await openSettings(p);
  assert.ok(rowOf(p, 'machine_parallel_tests'));
  const box = controlOf(p, 'machine_parallel_tests');
  assert.equal(box.tagName, 'input');
  assert.equal(box.type, 'number');
  assert.equal(String(box.value), '4');
  assert.match(rowOf(p, 'machine_parallel_tests').textContent, /every project on this machine/);
});

test('0707 AC1: blank, the page still gives it a number box', async () => {
  const p = settingsPage([view('')]);
  await openSettings(p);
  const box = controlOf(p, 'machine_parallel_tests');
  assert.equal(box.type, 'number');
  assert.equal(String(box.value), '');
});

// ---------- AC2 ----------

test('0707 AC2: saving a whole number writes it to the home folder, and the repo is unchanged with no commit', () => {
  const r = panelRepo();
  freshHome();
  const before = repoState(r);
  const out = panelSaveSettings(r.dir, [{ key: 'machine_parallel_tests', value: '3', machine: false }]);
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.deepEqual(out.body.changed, ['machine_parallel_tests']);
  assert.equal(homeSettings().machine_parallel_tests, 3);
  assert.deepEqual(repoState(r), before);
});

test('0707 AC2: the page\'s Save sends it, and the server saves it from that query', async () => {
  const p = settingsPage([view(''), view(5)], [{ ok: true, changed: ['machine_parallel_tests'] }]);
  await openSettings(p);
  changeTo(p, 'machine_parallel_tests', '5');
  p.press(saveButton(p));
  await p.settle();
  const url = posted(p).find(u => u.startsWith('/api/settings/save'));
  const query = url.split('?')[1];
  assert.equal(new URLSearchParams(query).get('repo:machine_parallel_tests'), '5');
  const r = panelRepo();
  freshHome();
  const before = repoState(r);
  assert.equal(panelSaveRequest(r.dir, query).status, 200);
  assert.equal(homeSettings().machine_parallel_tests, 5);
  assert.deepEqual(repoState(r), before);
});

test('0707 AC2: saved with a project setting, each goes to its own place', () => {
  const r = panelRepo();
  freshHome();
  const out = panelSaveSettings(r.dir, [{ key: 'machine_parallel_tests', value: '2', machine: false }, { key: 'limits.max_review_rounds', value: '4', machine: false }]);
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.equal(homeSettings().machine_parallel_tests, 2);
  assert.match(fs.readFileSync(path.join(r.dir, 'speck', 'config.yml'), 'utf8'), /max_review_rounds: 4/);
  assert.doesNotMatch(fs.readFileSync(path.join(r.dir, 'speck', 'config.yml'), 'utf8'), /machine_parallel_tests/);
});

// ---------- AC3 ----------

test('0707 AC3: saving it blank removes it from the home folder', () => {
  const r = panelRepo();
  freshHome(3);
  const before = repoState(r);
  const out = panelSaveSettings(r.dir, [{ key: 'machine_parallel_tests', value: '', machine: false }]);
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.equal(Object.hasOwn(homeSettings(), 'machine_parallel_tests'), false);
  assert.deepEqual(repoState(r), before);
});

test('0707 AC3: blank when it isn\'t set changes nothing', () => {
  const r = panelRepo();
  const home = freshHome();
  const out = panelSaveSettings(r.dir, [{ key: 'machine_parallel_tests', value: '', machine: false }]);
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.deepEqual(out.body.changed, []);
  assert.equal(fs.existsSync(path.join(home, 'config.yml')), false);
});

// ---------- AC4 ----------

for (const bad of ['0', '-1', '1.5', 'two']) {
  test(`0707 AC4: ${JSON.stringify(bad)} is refused with speck config set's reason, and nothing is saved`, () => {
    const r = panelRepo();
    freshHome(3);
    const reason = cliRefusal(bad);
    assert.equal(homeSettings().machine_parallel_tests, 3);
    const before = repoState(r);
    const out = panelSaveSettings(r.dir, [{ key: 'machine_parallel_tests', value: bad, machine: false }, { key: 'limits.max_review_rounds', value: '4', machine: false }]);
    assert.equal(out.status, 422);
    assert.equal(out.body.refused.machine_parallel_tests, reason);
    assert.equal(homeSettings().machine_parallel_tests, 3);
    assert.deepEqual(repoState(r), before);
  });
}

test('0707 AC4: a refused project setting leaves the home folder\'s value as it was', () => {
  const r = panelRepo();
  freshHome(3);
  const out = panelSaveSettings(r.dir, [{ key: 'machine_parallel_tests', value: '5', machine: false }, { key: 'limits.max_review_rounds', value: 'lots', machine: false }]);
  assert.notEqual(out.status, 200);
  assert.equal(homeSettings().machine_parallel_tests, 3);
});

test('0707 AC4: the page shows the refusal beside the setting', async () => {
  const why = 'machine_parallel_tests must be a whole number of 1 or more, or "" to remove it (got "0"). Nothing was changed.';
  const p = settingsPage([view(3)], [{ status: 422, body: { error: why, refused: { machine_parallel_tests: why } } }]);
  await openSettings(p);
  changeTo(p, 'machine_parallel_tests', '0');
  p.press(saveButton(p));
  await p.settle();
  assert.match(rowOf(p, 'machine_parallel_tests').textContent, /must be a whole number of 1 or more/);
});

// ---------- self-check ----------

test('0707 self-check: a home settings file that can\'t be read leaves the row blank, saying why, and Save refuses it', () => {
  const r = panelRepo();
  const home = freshHome();
  fs.mkdirSync(path.join(home, 'config.yml')); // a folder where the file should be
  const row = building(panelSettings(r.dir)).find(s => s.key === 'machine_parallel_tests');
  assert.equal(row.value, '');
  assert.match(row.explain, /Can't read/);
  const before = repoState(r);
  const out = panelSaveSettings(r.dir, [{ key: 'machine_parallel_tests', value: '2', machine: false }]);
  assert.equal(out.status, 422);
  assert.match(out.body.refused.machine_parallel_tests, /Can't read/);
  assert.deepEqual(repoState(r), before);
});

test('0707 self-check: the same setting given twice is refused, and nothing is saved', () => {
  const r = panelRepo();
  freshHome(3);
  const out = panelSaveSettings(r.dir, [{ key: 'machine_parallel_tests', value: '2' }, { key: 'machine_parallel_tests', value: '4' }]);
  assert.equal(out.status, 400);
  assert.equal(homeSettings().machine_parallel_tests, 3);
});
