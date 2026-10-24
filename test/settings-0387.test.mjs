import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, headOf, gitEnv } from './support/panel.mjs';
import { settingsPage, openSettings, rowOf, saveButton, changeTo, posted } from './support/settings.mjs';
import { panelSettings, panelSaveSettings, panelSaveRequest, SETTING_GROUPS } from '../scripts/settings.mjs';
import { MACHINE_SETTINGS, machineConfig } from '../scripts/machine.mjs';
import { DEFAULT_BUILD_COMMAND } from '../scripts/build-model.mjs';

// ---------- 0387: save your own settings in the panel without a commit ----------

Object.assign(process.env, gitEnv); // panelSaveSettings commits in this process

const byKey = v => Object.fromEntries(v.groups.flatMap(g => g.settings).map(s => [s.key, s]));
const cfgOf = r => path.join(r.dir, 'speck', 'config.yml');
const readCfg = r => fs.readFileSync(cfgOf(r), 'utf8');
// What saving only your own settings must leave as it was: the file, HEAD and what git says has changed.
const snapshot = r => ({ text: readCfg(r), head: headOf(r), status: r.g('status', '--porcelain') });
const asked = url => [...new URLSearchParams(url.split('?')[1] || '')];

// A Settings view as the server sends it: reviewer_effort and reviewer_model your own, limits.max_review_rounds not.
const S = (key, value, more = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, ...more });
const view = (o = {}) => ({ groups: [
  { title: 'Building and reviewing', settings: [
    S('reviewer_model', o.reviewer_model ?? 'gpt-x', { for_machine: true, from: o.from ?? 'repo', repo_value: 'gpt-x' }),
    S('reviewer_effort', o.reviewer_effort ?? '', { choices: ['', 'low', 'high'], for_machine: true, from: o.from ?? 'repo', repo_value: '' })] },
  { title: 'Ticket size limits', settings: [S('limits.max_review_rounds', 3), S('ship_mode', 'local', { choices: ['local', 'pr'] })] },
] });
const asksWhere = p => p.all(p.byId('settings')).some(n => n.tagName === 'button' && /This machine only|The repo, for everyone/.test(n.textContent));

test('0387 AC1: saving your own settings saves them for this machine, changing nothing in speck/config.yml and making no commit', () => {
  const r = panelRepo();
  const was = snapshot(r);
  const out = panelSaveSettings(r.dir, [{ key: 'reviewer_effort', value: 'high' }, { key: 'watch_agent', value: 'codex' },
    { key: 'reviewer_model', value: 'gpt-y', machine: true }, { key: 'max_parallel_builds', value: '3' }]);
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.deepEqual(machineConfig(r.dir), { reviewer_model: 'gpt-y', reviewer_effort: 'high', watch_agent: 'codex', max_parallel_builds: 3 });
  assert.deepEqual(snapshot(r), was);
  const s = byKey(panelSettings(r.dir));
  assert.equal(s.reviewer_effort.value, 'high');
  assert.equal(s.reviewer_effort.from, 'machine');

  // Every one of your own settings in the view is one this machine holds; the rest aren't.
  for (const g of SETTING_GROUPS) for (const x of g.settings)
    assert.equal(s[x.key].for_machine === true, MACHINE_SETTINGS.includes(x.key), x.key);

  // Switching the builder saves its build_command for this machine with it.
  const before = snapshot(r);
  assert.equal(panelSaveSettings(r.dir, [{ key: 'builder', value: 'codex' }, { key: 'reviewer', value: 'claude' }]).status, 200);
  assert.equal(machineConfig(r.dir).builder, 'codex');
  assert.equal(machineConfig(r.dir).build_command, '');
  assert.deepEqual(snapshot(r), before);
});

test('0387 AC1: the view sends a change to your own setting for this machine, without asking where it goes', async () => {
  const p = settingsPage([view(), view({ reviewer_effort: 'high', from: 'machine' })], [{ ok: true, changed: ['reviewer_effort'] }]);
  await p.settle();
  await openSettings(p);
  changeTo(p, 'reviewer_effort', 'high');
  assert.equal(asksWhere(p), false);
  assert.equal(saveButton(p).disabled, false);
  p.press(saveButton(p));
  await p.settle();
  assert.deepEqual(posted(p).map(asked), [[['machine:reviewer_effort', 'high']]]);
  assert.equal(asksWhere(p), false);
});

test('0387 AC1: a blank value is saved for this machine as blank, not taken as clearing it', async () => {
  const p = settingsPage([view()], [{ ok: true, changed: ['reviewer_model'] }]);
  await p.settle();
  await openSettings(p);
  changeTo(p, 'reviewer_model', '');
  p.press(saveButton(p));
  await p.settle();
  assert.deepEqual(posted(p).map(asked), [[['blank:reviewer_model', '']]]);

  const r = panelRepo();
  assert.equal(panelSaveRequest(r.dir, 'repo%3Areviewer_model=gpt-x').status, 200);
  assert.deepEqual(machineConfig(r.dir), { reviewer_model: 'gpt-x' });
  assert.equal(panelSaveRequest(r.dir, 'blank%3Areviewer_model=').status, 200);
  assert.deepEqual(machineConfig(r.dir), { reviewer_model: '' }, 'blank, for this machine');
  assert.equal(panelSaveRequest(r.dir, 'machine%3Areviewer_model=').status, 200);
  assert.deepEqual(machineConfig(r.dir), {}, 'cleared');
});

test('0387 AC2: saving only your own settings works while speck/config.yml has uncommitted changes, or off the base branch, leaving them as they are', () => {
  const r = panelRepo();
  fs.appendFileSync(cfgOf(r), '# a note of mine\n');
  let was = snapshot(r);
  let out = panelSaveSettings(r.dir, [{ key: 'reviewer_effort', value: 'low' }, { key: 'auto_ship_risk', value: 'low,high' }]);
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.deepEqual(snapshot(r), was);
  assert.match(readCfg(r), /# a note of mine\n$/);

  r.g('stash', '-q');
  r.g('checkout', '-q', '-b', 'elsewhere');
  was = snapshot(r);
  out = panelSaveSettings(r.dir, [{ key: 'reviewer_effort', value: 'high' }]);
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.deepEqual(snapshot(r), was);
  assert.deepEqual(machineConfig(r.dir), { reviewer_effort: 'high', auto_ship_risk: ['low', 'high'] });
});

test('0387 AC3: any other setting is committed as before, refused while speck/config.yml is changed, and a mixed Save saves each where it belongs or nothing', () => {
  const r = panelRepo();
  const head = headOf(r);
  let out = panelSaveSettings(r.dir, [{ key: 'ship_mode', value: 'pr' }, { key: 'reviewer_effort', value: 'high' }]);
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.equal(r.g('rev-parse', 'HEAD~1'), head, 'one commit');
  assert.equal(r.g('log', '-1', '--format=%s'), 'speck: config ship_mode pr');
  assert.equal(r.g('diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'), 'speck/config.yml');
  assert.match(readCfg(r), /^ship_mode: pr /m);
  assert.match(readCfg(r), /^reviewer_effort: ""/m, 'your own setting is not in the commit');
  assert.deepEqual(machineConfig(r.dir), { reviewer_effort: 'high' });

  fs.appendFileSync(cfgOf(r), '# a note of mine\n');
  const was = { ...snapshot(r), machine: machineConfig(r.dir) };
  out = panelSaveSettings(r.dir, [{ key: 'limits.max_review_rounds', value: '4' }, { key: 'reviewer_effort', value: 'low' }]);
  assert.equal(out.status, 409);
  assert.deepEqual(Object.keys(out.body.refused), ['limits.max_review_rounds']);
  assert.match(out.body.error, /uncommitted changes/);
  assert.deepEqual({ ...snapshot(r), machine: machineConfig(r.dir) }, was, 'nothing saved, your own setting included');

  // Refused for your own setting: the other isn't committed either.
  r.g('checkout', '-q', '--', 'speck/config.yml');
  const clean = { ...snapshot(r), machine: machineConfig(r.dir) };
  out = panelSaveSettings(r.dir, [{ key: 'limits.max_review_rounds', value: '4' }, { key: 'reviewer_effort', value: 'huge' }]);
  assert.equal(out.status, 422);
  assert.deepEqual(Object.keys(out.body.refused), ['reviewer_effort']);
  assert.deepEqual({ ...snapshot(r), machine: machineConfig(r.dir) }, clean);
});

test('0387 AC3: a change that lets more tickets ship by themselves is still asked about first, though it makes no commit', () => {
  const r = panelRepo();
  const was = snapshot(r);
  let out = panelSaveSettings(r.dir, [{ key: 'auto_ship', value: 'true' }]);
  assert.equal(out.status, 409);
  assert.equal(out.body.confirm, true);
  assert.deepEqual(machineConfig(r.dir), {});
  out = panelSaveSettings(r.dir, [{ key: 'auto_ship', value: 'true' }], { confirmed: 'low' });
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.deepEqual(machineConfig(r.dir), { auto_ship: true });
  assert.deepEqual(snapshot(r), was);
  // Clearing this machine's auto_ship goes back to speck/config.yml's, off, which lets nothing more ship.
  assert.equal(panelSaveRequest(r.dir, 'machine%3Aauto_ship=').status, 200);
  assert.deepEqual(machineConfig(r.dir), {});
});

test('0387 AC4: each of your own settings says whose value it is, and this machine\'s can be cleared back to speck/config.yml\'s', () => {
  const r = panelRepo();
  assert.equal(panelSaveSettings(r.dir, [{ key: 'reviewer_model', value: 'gpt-y' }]).status, 200);
  let s = byKey(panelSettings(r.dir));
  assert.equal(s.reviewer_model.from, 'machine');
  assert.equal(s.reviewer_model.value, 'gpt-y');
  assert.equal(s.reviewer_model.repo_value, '');
  assert.equal(s.reviewer_effort.from, 'repo');
  const was = snapshot(r);
  assert.equal(panelSaveSettings(r.dir, [{ key: 'reviewer_model', value: '', machine: true }]).status, 200);
  s = byKey(panelSettings(r.dir));
  assert.equal(s.reviewer_model.from, 'repo');
  assert.equal(s.reviewer_model.value, '');
  assert.deepEqual(machineConfig(r.dir), {});
  assert.deepEqual(snapshot(r), was);

  // Clearing this machine's builder clears the build_command switching to it saved, so speck/config.yml's pair applies.
  assert.equal(panelSaveSettings(r.dir, [{ key: 'builder', value: 'codex' }, { key: 'reviewer', value: 'claude' }]).status, 200);
  assert.equal(panelSaveSettings(r.dir, [{ key: 'builder', value: '', machine: true }, { key: 'reviewer', value: '', machine: true }]).status, 200);
  assert.deepEqual(machineConfig(r.dir), {});
  assert.equal(byKey(panelSettings(r.dir)).builder.build_command.value, DEFAULT_BUILD_COMMAND);
});

test('0387 AC4: the view says whose each value is and offers to clear this machine\'s (0397: in the explanation, with no top line)', async () => {
  const p = settingsPage([view({ reviewer_model: 'gpt-y', from: 'machine' }), view()], [{ ok: true, changed: ['reviewer_model'] }]);
  await p.settle();
  await openSettings(p);
  assert.match(rowOf(p, 'reviewer_model').textContent, /your machine's own value, used over the project's: gpt-x/);
  assert.ok(!p.all(p.byId('settings')).some(n => n.tagName === 'p' && /commits speck\/config\.yml/.test(n.textContent)), 'no top line');
  const clear = p.all(rowOf(p, 'reviewer_model')).find(n => n.tagName === 'button' && n.textContent === 'Clear this machine\'s value');
  p.press(clear);
  p.press(saveButton(p));
  await p.settle();
  assert.deepEqual(posted(p).map(asked), [[['machine:reviewer_model', '']]]);
  assert.doesNotMatch(rowOf(p, 'reviewer_model').textContent, /this machine/);
});

// Review round 1, F1 and F2: clearing this machine's auto_ship or auto_ship_risk goes back to speck/config.yml's.
const shipView = (mine, repo) => ({ groups: [{ title: 'Shipping', settings: [
  S('auto_ship', mine.auto_ship ?? repo.auto_ship, { choices: [true, false], for_machine: true, from: 'auto_ship' in mine ? 'machine' : 'repo', repo_value: repo.auto_ship }),
  S('auto_ship_risk', mine.auto_ship_risk ?? repo.auto_ship_risk, { choices: ['low', 'high'], for_machine: true, from: 'auto_ship_risk' in mine ? 'machine' : 'repo', repo_value: repo.auto_ship_risk }),
] }] });
const clearOf = (p, key) => p.all(rowOf(p, key)).find(n => n.tagName === 'button' && n.textContent === 'Clear this machine\'s value');

test('0387 AC4: clearing this machine\'s auto_ship_risk saves, without asking to tick a risk', async () => {
  const repo = { auto_ship: false, auto_ship_risk: ['low'] };
  const p = settingsPage([shipView({ auto_ship_risk: ['low', 'high'] }, repo), shipView({}, repo)], [{ ok: true, changed: ['auto_ship_risk'] }]);
  await p.settle();
  await openSettings(p);
  p.press(clearOf(p, 'auto_ship_risk'));
  p.press(saveButton(p));
  await p.settle();
  assert.deepEqual(posted(p).map(asked), [[['machine:auto_ship_risk', '']]]);
  assert.doesNotMatch(rowOf(p, 'auto_ship_risk').textContent, /Tick at least one risk/);
});

test('0387 AC4: clearing this machine\'s value asks first when speck/config.yml\'s lets more ship, and cancelling sends nothing', async () => {
  for (const answer of [true, false]) {
    const said = [];
    const p = settingsPage([shipView({ auto_ship: false }, { auto_ship: true, auto_ship_risk: ['low', 'high'] })], [{ ok: true, changed: ['auto_ship'] }],
      { confirm: msg => { said.push(String(msg)); return answer; } });
    await p.settle();
    await openSettings(p);
    p.press(clearOf(p, 'auto_ship'));
    p.press(saveButton(p));
    await p.settle();
    assert.equal(said.length, 1, 'asked');
    assert.match(said[0], /low-risk and high-risk/);
    assert.deepEqual(posted(p).map(asked), answer ? [[['machine:auto_ship', ''], ['confirm', 'low,high']]] : []);
    if (!answer) assert.equal(saveButton(p).disabled, true, 'the clear is undone');
  }
  // Server side too: the confirmation is the one speck/config.yml's values call for.
  const r = panelRepo();
  fs.writeFileSync(cfgOf(r), readCfg(r).replace(/^auto_ship: .*$/m, 'auto_ship: true').replace(/^auto_ship_risk: .*$/m, 'auto_ship_risk: [low, high]'));
  r.g('commit', '-qam', 'ship');
  assert.equal(panelSaveSettings(r.dir, [{ key: 'auto_ship', value: 'false' }]).status, 200);
  let out = panelSaveRequest(r.dir, 'machine%3Aauto_ship=');
  assert.equal(out.status, 409);
  assert.equal(out.body.confirm, true);
  out = panelSaveRequest(r.dir, 'machine%3Aauto_ship=&confirm=low%2Chigh');
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.deepEqual(machineConfig(r.dir), {});
});
