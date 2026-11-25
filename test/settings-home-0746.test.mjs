// 0746: the Settings view shows machine_parallel_builds, your own limit on builds across every project on this machine,
// and saves it in your home folder as `speck config set machine_parallel_builds` does, without touching the repo.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { panelRepo, gitEnv } from './support/panel.mjs';
import { settingsPage, openSettings, rowOf, controlOf, changeTo, posted } from './support/settings.mjs';
import { panelSettings, panelSaveSettings, panelSaveRequest } from '../scripts/settings.mjs';
import { homeSettings, setHomeSetting } from '../scripts/home-settings.mjs';

Object.assign(process.env, gitEnv);

const KEY = 'machine_parallel_builds';
// A fresh home settings folder for each test, so none sees another's value.
function freshHome(text) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0746-home-'));
  process.env.SPECK_HOME_SETTINGS_DIR = dir;
  if (text !== undefined) fs.writeFileSync(path.join(dir, 'config.yml'), text);
  return dir;
}
const building = view => view.groups.find(g => g.title === 'Building and reviewing').settings;
const rowIn = r => building(panelSettings(r.dir)).find(s => s.key === KEY);
const repoState = r => ({ config: fs.readFileSync(path.join(r.dir, 'speck', 'config.yml'), 'utf8'), head: r.g('rev-parse', 'HEAD'), status: r.g('status', '--porcelain') });
const save = (r, value) => panelSaveSettings(r.dir, [{ key: KEY, value, machine: false }]);

test('0746 AC1: Settings has the machine-wide build limit right after Builds at once, blank when unset', () => {
  const r = panelRepo();
  freshHome();
  const rows = building(panelSettings(r.dir)), at = rows.findIndex(s => s.key === 'max_parallel_builds');
  assert.equal(rows[at].label, 'Builds at once');
  assert.equal(rows[at + 1].key, KEY);
  assert.equal(rows.filter(s => s.key === KEY).length, 1);
  const row = rows[at + 1];
  assert.equal(row.value, '');
  assert.equal(row.editable, true);
  assert.notEqual(row.for_machine, true);
  assert.match(row.summary, /every project on this machine/);
  assert.match(row.explain, /every project/);
});

test('0746 AC1: it shows the value saved in the home folder', () => {
  const r = panelRepo();
  freshHome(`${KEY}: 3\n`);
  assert.equal(rowIn(r).value, 3);
});

test('0746 AC1: the page draws it as a number box saying it applies to every project', async () => {
  const r = panelRepo();
  freshHome(`${KEY}: 4\n`);
  const p = settingsPage([panelSettings(r.dir)]);
  await openSettings(p);
  const box = controlOf(p, KEY);
  assert.equal(box.type, 'number');
  assert.equal(String(box.value), '4');
  assert.match(rowOf(p, KEY).textContent, /every project on this machine/);
});

test('0746 AC2: a change on the page is sent and saved to the home folder, changing nothing in the repo', async () => {
  const r = panelRepo();
  freshHome();
  const view = panelSettings(r.dir);
  const p = settingsPage([view, view], [{ ok: true, changed: [KEY] }]);
  await openSettings(p);
  changeTo(p, KEY, '5');
  await p.settle();
  const query = posted(p).find(u => u.startsWith('/api/settings/save')).split('?')[1];
  const before = repoState(r);
  assert.equal(panelSaveRequest(r.dir, query).status, 200);
  assert.equal(homeSettings()[KEY], 5);
  assert.deepEqual(repoState(r), before);
});

test('0746 AC2: blank removes it, leaving the other home setting', () => {
  const r = panelRepo();
  freshHome(`${KEY}: 3\nmachine_parallel_tests: 2\n`);
  const before = repoState(r);
  const out = save(r, '');
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.deepEqual(out.body.changed, [KEY]);
  assert.deepEqual(homeSettings(), { machine_parallel_tests: 2 });
  assert.deepEqual(repoState(r), before);
});

for (const bad of ['0', '-1', '1.5', 'two']) {
  test(`0746 AC3: ${JSON.stringify(bad)} is refused with speck config set's reason, and nothing is saved`, () => {
    const r = panelRepo();
    freshHome(`${KEY}: 3\n`);
    let reason;
    try { setHomeSetting(KEY, bad, false); } catch (e) { reason = e.message; }
    assert.ok(reason);
    const before = repoState(r);
    const out = save(r, bad);
    assert.equal(out.status, 422);
    assert.equal(out.body.refused[KEY], reason);
    assert.equal(homeSettings()[KEY], 3);
    assert.deepEqual(repoState(r), before);
  });
}

test('0746 AC3: the page says why beside the row, which goes back to the saved value', async () => {
  const r = panelRepo();
  freshHome(`${KEY}: 3\n`);
  const view = panelSettings(r.dir);
  const why = `${KEY} must be a whole number of 1 or more, or "" to remove it (got "0"). Nothing was changed.`;
  const p = settingsPage([view, view], [{ status: 422, body: { error: why, refused: { [KEY]: why } } }]);
  await openSettings(p);
  changeTo(p, KEY, '0');
  await p.settle();
  assert.match(rowOf(p, KEY).textContent, /must be a whole number of 1 or more/);
  assert.equal(String(controlOf(p, KEY).value), '3');
});
