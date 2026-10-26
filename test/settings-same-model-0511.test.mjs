import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { panelRepo, freePort, startPanel, stop, request, post, tokenOf, headOf, gitEnv } from './support/panel.mjs';
import { settingsPage, openSettings, rowOf, controlOf, saveButton, changeTo, posted } from './support/settings.mjs';
import { panelSettings, panelSaveSettings, panelSaveRequest, EDITABLE } from '../scripts/settings.mjs';
import { machineConfig } from '../scripts/machine.mjs';

// ---------- 0511: turn allow_same_model_review on or off in Settings, asking before turning it on ----------

Object.assign(process.env, gitEnv); // panelSaveSettings commits in this process

const byKey = v => Object.fromEntries(v.groups.flatMap(g => g.settings).map(s => [s.key, s]));
const cfgOf = r => path.join(r.dir, 'speck', 'config.yml');
const snapshot = r => ({ text: fs.readFileSync(cfgOf(r), 'utf8'), head: headOf(r), status: r.g('status', '--porcelain') });

// A panel repo whose speck/config.yml has these values, committed.
function repoWith(config = {}) {
  const r = panelRepo();
  let text = fs.readFileSync(cfgOf(r), 'utf8');
  for (const [k, v] of Object.entries(config))
    text = new RegExp(`^${k}:`, 'm').test(text) ? text.replace(new RegExp(`^${k}:.*$`, 'm'), `${k}: ${v}`) : `${text}\n${k}: ${v}\n`;
  fs.writeFileSync(cfgOf(r), text);
  r.g('commit', '-qam', 'setup');
  return r;
}

// A Settings view as the server sends it, with allow_same_model_review set to `on`.
const view = (on, more = {}) => ({ groups: [{ title: 'Building and reviewing', settings: [
  { key: 'reviewer', value: 'codex', default: false, explain: 'Who reviews.', editable: true, choices: ['codex', 'claude-subagent'] },
  { key: 'allow_same_model_review', value: on, default: false, explain: 'Whether the two may be the same model.', editable: true, choices: [true, false],
    for_machine: true, from: 'repo', repo_value: on, ...more },
] }] });
function askingPage(views, saves, answer) {
  const asked = [];
  const p = settingsPage(views, saves, { confirm: msg => { asked.push(String(msg)); return answer; } });
  p.asked = asked;
  return p;
}

test('0511 AC1: allow_same_model_review is an on/off setting with the reviewer\'s, saved for this machine without a commit', () => {
  const r = panelRepo();
  assert.ok(EDITABLE.includes('allow_same_model_review'));
  const v = panelSettings(r.dir);
  const group = v.groups.find(g => g.settings.some(s => s.key === 'allow_same_model_review'));
  assert.ok(group.settings.some(s => s.key === 'reviewer'), 'in the reviewer\'s group');
  const s = byKey(v).allow_same_model_review;
  assert.equal(s.editable, true);
  assert.deepEqual(s.choices, [true, false]);
  assert.equal(s.for_machine, true);
  assert.match(s.explain, /saved for your machine only, without a commit\.$/);

  const was = snapshot(r);
  const out = panelSaveRequest(r.dir, 'machine%3Aallow_same_model_review=true');
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.deepEqual(out.body.changed, ['allow_same_model_review']);
  assert.equal(machineConfig(r.dir).allow_same_model_review, true, 'as speck config set --machine saves it');
  assert.deepEqual(snapshot(r), was, 'no commit, speck/config.yml as it was');
  assert.equal(byKey(panelSettings(r.dir)).allow_same_model_review.value, true);

  assert.equal(panelSaveRequest(r.dir, 'machine%3Aallow_same_model_review=false').status, 200);
  assert.equal(machineConfig(r.dir).allow_same_model_review, false);
  assert.equal(panelSaveRequest(r.dir, 'machine%3Aallow_same_model_review=maybe').status, 422);
  assert.equal(machineConfig(r.dir).allow_same_model_review, false);
});

test('0511 AC1: the view shows it as a switch of true or false, and Save sends it for this machine', async () => {
  const p = askingPage([view(false), view(true)], [{ ok: true, changed: ['allow_same_model_review'] }], true);
  await p.settle();
  await openSettings(p);
  const c = controlOf(p, 'allow_same_model_review');
  assert.equal(c.tagName, 'select');
  assert.deepEqual(c.children.map(o => o.value), ['true', 'false']);
  assert.equal(c.value, 'false');
  changeTo(p, 'allow_same_model_review', 'true');
  p.press(saveButton(p));
  await p.settle();
  assert.deepEqual(posted(p), ['/api/settings/save?machine%3Aallow_same_model_review=true']);
});

test('0511 AC2: turning it on asks first, saying a review is then no longer by a different model, and cancelling saves nothing', async () => {
  const p = askingPage([view(false)], [], false);
  await p.settle();
  await openSettings(p);
  changeTo(p, 'allow_same_model_review', 'true');
  p.press(saveButton(p));
  await p.settle();
  assert.equal(p.asked.length, 1);
  assert.match(p.asked[0], /same model as the builder/);
  assert.match(p.asked[0], /no longer by a different model/);
  assert.deepEqual(posted(p), [], 'nothing is sent');
  assert.equal(controlOf(p, 'allow_same_model_review').value, 'false', 'back as it was');
  assert.equal(saveButton(p).disabled, true, 'nothing left to save');
});

test('0511 AC2: turning it off, or a change that leaves it as it is, asks nothing', async () => {
  const p = askingPage([view(true), view(false)], [{ ok: true }, { ok: true }], false);
  await p.settle();
  await openSettings(p);
  changeTo(p, 'allow_same_model_review', 'false');
  p.press(saveButton(p));
  await p.settle();
  changeTo(p, 'reviewer', 'claude-subagent');
  p.press(saveButton(p));
  await p.settle();
  assert.deepEqual(p.asked, []);
  assert.deepEqual(posted(p), ['/api/settings/save?machine%3Aallow_same_model_review=false', '/api/settings/save?repo%3Areviewer=claude-subagent']);
});

test('0511 AC2: clearing this machine\'s value asks first when speck/config.yml\'s turns it on', async () => {
  const p = askingPage([view(false, { from: 'machine', repo_value: true })], [], false);
  await p.settle();
  await openSettings(p);
  const clear = p.all(rowOf(p, 'allow_same_model_review')).find(n => n.tagName === 'button' && /Clear this machine's value/.test(n.textContent || ''));
  p.press(clear);
  await p.settle();
  p.press(saveButton(p));
  await p.settle();
  assert.equal(p.asked.length, 1);
  assert.deepEqual(posted(p), [], 'cancelled: nothing is sent');
});

test('0511 AC3: with it on, in the same Save or an earlier one, a same-model reviewer saves; with it off, Save refuses it', () => {
  const same = { builder: 'claude', builder_model: 'opus', reviewer_model: 'opus' };
  // Off: refused as today, changing nothing.
  const off = repoWith(same);
  const was = snapshot(off);
  const refused = panelSaveSettings(off.dir, [{ key: 'reviewer', value: 'claude-subagent' }]);
  assert.equal(refused.status, 422);
  assert.match(refused.body.error, /allow_same_model_review/);
  assert.deepEqual(snapshot(off), was);
  assert.equal(machineConfig(off.dir).reviewer, undefined);

  // On in the same Save.
  const now = repoWith(same);
  const out = panelSaveSettings(now.dir, [{ key: 'allow_same_model_review', value: 'true', machine: true }, { key: 'reviewer', value: 'claude-subagent' }]);
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.equal(machineConfig(now.dir).allow_same_model_review, true);
  assert.equal(machineConfig(now.dir).reviewer, 'claude-subagent');

  // On in an earlier Save.
  const earlier = repoWith(same);
  assert.equal(panelSaveSettings(earlier.dir, [{ key: 'allow_same_model_review', value: 'true', machine: true }]).status, 200);
  assert.equal(panelSaveSettings(earlier.dir, [{ key: 'reviewer', value: 'claude-subagent' }]).status, 200);

  // Turned off in the same Save: refused.
  const back = repoWith({ ...same, allow_same_model_review: 'true' });
  const both = panelSaveSettings(back.dir, [{ key: 'allow_same_model_review', value: 'false', machine: true }, { key: 'reviewer', value: 'claude-subagent' }]);
  assert.equal(both.status, 422);
  assert.equal(machineConfig(back.dir).allow_same_model_review, undefined, 'nothing saved');
});

test('0511 AC3: turning it off while the builder and reviewer would run the same model is refused, saying why', () => {
  const r = repoWith({ builder: 'claude', builder_model: 'opus', reviewer: 'claude-subagent', reviewer_model: 'opus', allow_same_model_review: 'true' });
  const out = panelSaveSettings(r.dir, [{ key: 'allow_same_model_review', value: 'false', machine: true }]);
  assert.equal(out.status, 422);
  assert.deepEqual(Object.keys(out.body.refused), ['allow_same_model_review']);
  assert.match(out.body.error, /opus/);
  assert.equal(machineConfig(r.dir).allow_same_model_review, undefined);
  // With a reviewer from another family in the same Save, it's turned off.
  assert.equal(panelSaveSettings(r.dir, [{ key: 'allow_same_model_review', value: 'false', machine: true }, { key: 'reviewer', value: 'codex' }]).status, 200);
});

test('0511 AC4: the panel accepts the change only from its own page with its token, and speck config set works as today', async () => {
  const r = panelRepo();
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    const token = tokenOf((await request(p.port)).body);
    const url = '/api/settings/save?machine%3Aallow_same_model_review=true';
    assert.equal((await post(p.port, url)).status, 403);
    assert.equal((await post(p.port, url, { token: 'nope' })).status, 403);
    assert.equal((await post(p.port, url, { token, origin: 'http://evil.example' })).status, 403);
    assert.equal(machineConfig(r.dir).allow_same_model_review, undefined);
    const ok = await post(p.port, url, { token });
    assert.equal(ok.status, 200, ok.body);
    assert.equal(machineConfig(r.dir).allow_same_model_review, true);
  } finally { await stop(p); }

  const speck = path.resolve('scripts/speck.mjs');
  const set = spawnSync(process.execPath, [speck, 'config', 'set', 'allow_same_model_review', 'false'], { cwd: r.dir, encoding: 'utf8' });
  assert.equal(set.status, 0, set.stderr);
  assert.equal(machineConfig(r.dir).allow_same_model_review, false, 'saved for this machine, as today');
});
