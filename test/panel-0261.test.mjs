import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, freePort, startPanel, stop, request, post, tokenOf, headOf, gitEnv } from './support/panel.mjs';
import { settingsPage, openSettings, rowOf, controlOf, saveButton, changeTo } from './support/settings.mjs';
import { panelSettings, panelSetSetting, panelSettingRequest } from '../scripts/settings.mjs';
import { machineConfig, machineConfigFile } from '../scripts/machine.mjs';

// ---------- 0261: show and change this machine's settings in the panel ----------

Object.assign(process.env, gitEnv); // panelSetSetting commits in this process

const byKey = v => Object.fromEntries(v.groups.flatMap(g => g.settings).map(s => [s.key, s]));
const cfgOf = r => path.join(r.dir, 'speck', 'config.yml');
const snapshot = r => ({ text: fs.readFileSync(cfgOf(r), 'utf8'), head: headOf(r), status: r.g('status', '--porcelain') });
const posts = p => p.settingsCalls.filter(c => c.method === 'POST');
const tagsOf = (p, key) => p.all(rowOf(p, key)).filter(n => /\bdefault\b/.test(n.className || '')).map(n => n.textContent);
const buttonOf = (p, key, label) => p.all(rowOf(p, key)).find(n => n.tagName === 'button' && n.textContent === label);

// A Settings view as the server sends it, with max_parallel_builds from this machine (`machine` set) or the repo.
const view = (machine, repo = 2) => ({ groups: [{ title: 'How much runs at once', settings: [
  { key: 'reviewer_model', value: '', default: true, explain: 'What reviewer_model does.', editable: true },
  { key: 'max_parallel_builds', value: machine ?? repo, default: false, explain: 'What max_parallel_builds does.', editable: true,
    for_machine: true, from: machine === undefined ? 'repo' : 'machine', repo_value: repo },
] }] });

test('0261 AC1: each machine setting gives the value speck uses, whose it is, and the repo\'s value too', () => {
  const r = panelRepo();
  let s = byKey(panelSettings(r.dir));
  for (const key of ['max_parallel_builds', 'max_parallel_tests']) {
    assert.equal(s[key].for_machine, true, key);
    assert.equal(s[key].from, 'repo', key);
    assert.equal(s[key].repo_value, s[key].value, key);
  }
  assert.equal(s.reviewer_model.for_machine, undefined, 'only the machine settings');
  const repo = s.max_parallel_builds.value;
  assert.equal(panelSetSetting(r.dir, 'max_parallel_builds', String(repo + 2), { machine: true }).status, 200);
  s = byKey(panelSettings(r.dir));
  assert.equal(s.max_parallel_builds.value, repo + 2);
  assert.equal(s.max_parallel_builds.from, 'machine');
  assert.equal(s.max_parallel_builds.repo_value, repo);
  assert.equal(s.max_parallel_tests.from, 'repo');
});

test('0261 AC1: the view says whose value each is, with the repo\'s value beside a machine one', async () => {
  const p = settingsPage([view(3, 2)]);
  await p.settle();
  await openSettings(p);
  const row = rowOf(p, 'max_parallel_builds').textContent;
  assert.match(row, /this machine/i);
  assert.match(row, /repo's value: 2/i);
  assert.equal(controlOf(p, 'max_parallel_builds').value, '3', 'the value speck uses');

  const q = settingsPage([view(undefined, 2)]);
  await q.settle();
  await openSettings(q);
  const row2 = rowOf(q, 'max_parallel_builds').textContent;
  assert.match(row2, /repo/i);
  assert.doesNotMatch(row2, /this machine/i);
  assert.equal(controlOf(q, 'max_parallel_builds').value, '2');
  assert.doesNotMatch(rowOf(q, 'reviewer_model').textContent, /this machine|repo's value/i);
});

test('0261 AC2: a change asks whether it\'s for this machine or the repo, and Save sends it to the one picked', async () => {
  // 0274: asked beside the setting once it's changed, and sent with the view's one Save.
  const p = settingsPage([view(undefined, 2), view(4, 2)], [{ ok: true, changed: ['max_parallel_builds'] }]);
  await p.settle();
  await openSettings(p);
  assert.equal(buttonOf(p, 'max_parallel_builds', 'This machine only'), undefined, 'not asked before a change');
  changeTo(p, 'max_parallel_builds', '4');
  assert.ok(buttonOf(p, 'max_parallel_builds', 'This machine only'));
  assert.ok(buttonOf(p, 'max_parallel_builds', 'The repo, for everyone'));
  p.press(saveButton(p));
  await p.settle();
  assert.deepEqual(posts(p), [], 'nothing is sent before you choose');
  p.press(buttonOf(p, 'max_parallel_builds', 'This machine only'));
  p.press(saveButton(p));
  await p.settle();
  assert.deepEqual(posts(p).map(c => c.url), ['/api/settings/save?machine%3Amax_parallel_builds=4']);
  assert.ok(posts(p)[0].headers['X-Speck-Token']);
  assert.equal(controlOf(p, 'max_parallel_builds').value, '4');
  assert.deepEqual(tagsOf(p, 'max_parallel_builds'), ['this machine']);

  const q = settingsPage([view(undefined, 2), view(undefined, 5)], [{ ok: true, changed: ['max_parallel_builds'] }]);
  await q.settle();
  await openSettings(q);
  changeTo(q, 'max_parallel_builds', '5');
  q.press(buttonOf(q, 'max_parallel_builds', 'The repo, for everyone'));
  q.press(saveButton(q));
  await q.settle();
  assert.deepEqual(posts(q).map(c => c.url), ['/api/settings/save?repo%3Amax_parallel_builds=5']);

  // Putting the value back stops asking; a setting no machine can hold is sent without asking.
  const c = settingsPage([view(undefined, 2), view(undefined, 2)], [{ ok: true, changed: ['reviewer_model'] }]);
  await c.settle();
  await openSettings(c);
  changeTo(c, 'max_parallel_builds', '7');
  changeTo(c, 'max_parallel_builds', '2');
  assert.equal(buttonOf(c, 'max_parallel_builds', 'This machine only'), undefined);
  assert.equal(saveButton(c).disabled, true);
  changeTo(c, 'reviewer_model', 'm1');
  c.press(saveButton(c));
  await c.settle();
  assert.deepEqual(posts(c).map(x => x.url), ['/api/settings/save?repo%3Areviewer_model=m1']);
});

test('0261 AC2: this machine only writes the machine file and leaves config.yml and git alone; the repo commits as 0258 does', () => {
  const r = panelRepo();
  const was = snapshot(r);
  let out = panelSettingRequest(r.dir, 'max_parallel_tests', '3', null, 'machine');
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.equal(out.body.changed, true);
  assert.deepEqual(snapshot(r), was, 'config.yml, HEAD and git status as they were');
  assert.deepEqual(machineConfig(r.dir), { max_parallel_tests: 3 });
  assert.ok(fs.existsSync(machineConfigFile(r.dir)));
  assert.equal(panelSetSetting(r.dir, 'max_parallel_tests', '3', { machine: true }).body.changed, false, 'the same value: unchanged');

  out = panelSettingRequest(r.dir, 'max_parallel_tests', '2');
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.equal(r.g('log', '-1', '--format=%s'), 'speck: config max_parallel_tests 2');
  assert.match(fs.readFileSync(cfgOf(r), 'utf8'), /^max_parallel_tests: 2/m);
  assert.deepEqual(machineConfig(r.dir), { max_parallel_tests: 3 }, 'this machine keeps its own');
});

test('0261 AC3: clearing this machine\'s value goes back to the repo\'s, and the view has a button for it', async () => {
  const r = panelRepo();
  const repo = byKey(panelSettings(r.dir)).max_parallel_builds.value;
  panelSetSetting(r.dir, 'max_parallel_builds', String(repo + 1), { machine: true });
  const was = snapshot(r);
  const out = panelSettingRequest(r.dir, 'max_parallel_builds', '', null, 'machine');
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.deepEqual(machineConfig(r.dir), {});
  assert.deepEqual(snapshot(r), was);
  const s = byKey(panelSettings(r.dir)).max_parallel_builds;
  assert.equal(s.from, 'repo');
  assert.equal(s.value, repo);
  assert.equal(panelSetSetting(r.dir, 'max_parallel_builds', '', { machine: true }).body.changed, false, 'nothing to clear');

  const p = settingsPage([view(3, 2), view(undefined, 2)], [{ ok: true, changed: true }]);
  await p.settle();
  await openSettings(p);
  const clear = buttonOf(p, 'max_parallel_builds', 'Clear this machine\'s value');
  assert.ok(clear);
  p.press(clear);
  assert.deepEqual(posts(p), [], '0274: cleared on Save');
  p.press(saveButton(p));
  await p.settle();
  assert.deepEqual(posts(p).map(c => c.url), ['/api/settings/save?machine%3Amax_parallel_builds=']);
  assert.equal(controlOf(p, 'max_parallel_builds').value, '2');
  assert.equal(buttonOf(p, 'max_parallel_builds', 'Clear this machine\'s value'), undefined);
  assert.deepEqual(tagsOf(p, 'max_parallel_builds'), ['repo']);
});

test('0261 AC4: a machine change is saved off the base branch and with config.yml changed; a bad one is refused and changes nothing', () => {
  const r = panelRepo();
  r.g('checkout', '-q', '-b', 'elsewhere');
  fs.appendFileSync(cfgOf(r), '# a note of mine\n');
  const was = snapshot(r);
  let out = panelSetSetting(r.dir, 'max_parallel_builds', '2', { machine: true });
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.deepEqual(machineConfig(r.dir), { max_parallel_builds: 2 });
  assert.deepEqual(snapshot(r), was);

  out = panelSetSetting(r.dir, 'max_parallel_builds', '0', { machine: true });
  assert.equal(out.status, 422);
  assert.match(out.body.error, /whole number of 1 or more/);
  out = panelSetSetting(r.dir, 'reviewer_model', 'm1', { machine: true });
  assert.equal(out.status, 422);
  assert.match(out.body.error, /max_parallel_builds, max_parallel_tests/);
  out = panelSettingRequest(r.dir, 'max_parallel_builds', '3', null, 'elsewhere');
  assert.equal(out.status, 400);
  assert.deepEqual(machineConfig(r.dir), { max_parallel_builds: 2 });
  assert.deepEqual(snapshot(r), was);
});

test('0261 AC4: a machine change without the token or from another origin gets 403 and changes nothing', async () => {
  const r = panelRepo();
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    const token = tokenOf((await request(p.port)).body);
    const was = snapshot(r), where = '/api/settings/max_parallel_builds/3?scope=machine';
    assert.equal((await post(p.port, where)).status, 403);
    assert.equal((await post(p.port, where, { token: 'nope' })).status, 403);
    assert.equal((await post(p.port, where, { token, origin: 'http://evil.example' })).status, 403);
    assert.deepEqual(machineConfig(r.dir), {});
    assert.deepEqual(snapshot(r), was);
    assert.equal((await post(p.port, where, { token })).status, 200, 'with both, it is saved');
    assert.deepEqual(machineConfig(r.dir), { max_parallel_builds: 3 });
  } finally { await stop(p); }
});

test('0261 self-check: the brief\'s panel entry names the command a machine change matches', () => {
  const line = fs.readFileSync(path.join(import.meta.dirname, '..', 'docs', 'brief.md'), 'utf8').split('\n').find(l => l.startsWith('| `speck panel'));
  assert.match(line, /`speck config set --machine`/);
});
