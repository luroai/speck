import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, headOf, gitEnv } from './support/panel.mjs';
import { settingsPage, openSettings, rowOf, controlOf, saveButton, changeTo, posted } from './support/settings.mjs';
import { panelSettings, panelSaveSettings, panelSaveRequest } from '../scripts/settings.mjs';
import { DEFAULT_BUILD_COMMAND } from '../scripts/build-model.mjs';
import { parseYaml, parseTicket, loadConfig } from '../scripts/core.mjs';
import { ticketBuilder } from '../scripts/ticket-builder.mjs';
import { ROOT } from './support/speck.mjs';
import { machineConfig, machineConfigFile } from '../scripts/machine.mjs';

// ---------- 0293: switch the builder from the panel and in setup ----------

Object.assign(process.env, gitEnv); // panelSaveSettings commits in this process

const cfgOf = r => path.join(r.dir, 'speck', 'config.yml');
const readCfg = r => parseYaml(fs.readFileSync(cfgOf(r), 'utf8'));
const setCfg = (r, re, line) => {
  fs.writeFileSync(cfgOf(r), fs.readFileSync(cfgOf(r), 'utf8').replace(re, line));
  r.g('commit', '-qam', 'config');
};
const snapshot = r => ({ text: fs.readFileSync(cfgOf(r), 'utf8'), head: headOf(r), status: r.g('status', '--porcelain') });
const builderRow = s => s.groups.flatMap(g => g.settings).find(x => x.key === 'builder');
const FOUND = (ready = {}) => ({ agents: ['claude', 'codex', 'cursor'].map(id => ({ id, name: id, installed: true, signed_in: ready[id] ?? true,
  ...(ready[id] === false ? { why: `${id} isn't signed in: run ${id} login.` } : {}) })) });

test('0293 AC1: builder offers the builders that are installed and signed in, and the one set now', () => {
  const r = panelRepo();
  const row = builderRow(panelSettings(r.dir, { agents: FOUND({ cursor: false }) }));
  assert.equal(row.editable, true);
  assert.deepEqual(row.choices, ['claude', 'codex', 'deepseek']); // 0393: and each model provider
  assert.match(row.missing, /cursor \(cursor isn't signed in/);
  // The one set now stays, ready or not.
  assert.deepEqual(builderRow(panelSettings(r.dir, { agents: FOUND({ claude: false }) })).choices, ['claude', 'codex', 'cursor', 'deepseek']);
  // Without the agents found, every builder speck starts by itself.
  assert.deepEqual(builderRow(panelSettings(r.dir)).choices, ['claude', 'codex', 'cursor', 'deepseek']);
});

test('0293 AC1: saving a builder sets build_command to its own, blank for Codex and Cursor, in the same save', () => {
  // 0387: both are your own settings, so they're saved together for this machine, without a commit.
  const r = panelRepo();
  setCfg(r, /^reviewer: .*$/m, 'reviewer: claude');
  const was = snapshot(r);
  let out = panelSaveSettings(r.dir, [{ key: 'builder', value: 'codex' }]);
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.deepEqual(out.body.changed, ['builder', 'build_command']);
  assert.deepEqual(machineConfig(r.dir), { builder: 'codex', build_command: '' });
  assert.deepEqual(snapshot(r), was);

  out = panelSaveSettings(r.dir, [{ key: 'builder', value: 'cursor' }]);
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.deepEqual(out.body.changed, ['builder'], 'already blank');
  assert.equal(machineConfig(r.dir).build_command, '');

  setCfg(r, /^reviewer: .*$/m, 'reviewer: codex');
  out = panelSaveRequest(r.dir, 'repo%3Abuilder=claude');
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.deepEqual(machineConfig(r.dir), { builder: 'claude', build_command: DEFAULT_BUILD_COMMAND });
  assert.equal(r.g('status', '--porcelain'), '');
});

test('0293 AC1: the view offers the builders, says what switching sets, and Save sends the builder', async () => {
  const S = (key, value, more = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, ...more });
  const own = { claude: DEFAULT_BUILD_COMMAND, codex: '', cursor: '' };
  const view = { groups: [{ title: 'Building and reviewing', settings: [
    S('builder', 'claude', { choices: ['claude', 'codex'], missing: 'Not offered: cursor (Cursor isn\'t installed).',
      build_command: { value: DEFAULT_BUILD_COMMAND, hand_set: false, own } }),
    S('reviewer', 'claude', { choices: ['codex', 'claude'] })] }] };
  const asks = [];
  const p = settingsPage([view, view], [{ ok: true, changed: ['builder', 'build_command'] }], { confirm: m => { asks.push(m); return true; } });
  await p.settle();
  await openSettings(p);
  const options = p.all(controlOf(p, 'builder')).filter(n => n.tagName === 'option').map(o => o.value);
  assert.deepEqual(options, ['claude', 'codex']);
  assert.ok(p.all(rowOf(p, 'builder')).some(n => n.textContent === 'Not offered: cursor (Cursor isn\'t installed).'));
  changeTo(p, 'builder', 'codex');
  assert.ok(p.all(rowOf(p, 'builder')).some(n => n.tagName === 'p' && /build_command/.test(n.textContent) && /blank/.test(n.textContent) && /Codex/.test(n.textContent)));
  p.press(saveButton(p));
  await p.settle();
  assert.deepEqual(asks, [], 'nothing set by hand: nothing to ask');
  assert.equal(posted(p).length, 1);
  assert.match(posted(p)[0], /repo%3Abuilder=codex/);
  assert.doesNotMatch(posted(p)[0], /replace=/);
});

test('0293 AC2: a builder of the reviewer\'s family is refused, suggesting a reviewer from another family', () => {
  const r = panelRepo(); // reviewer: codex
  const was = snapshot(r);
  let out = panelSaveSettings(r.dir, [{ key: 'builder', value: 'codex' }]);
  assert.equal(out.status, 422);
  assert.match(out.body.refused.builder, /same model family|both "codex"/);
  assert.match(out.body.refused.builder, /another family is claude/);
  assert.deepEqual(snapshot(r), was);

  // A Claude builder with a claude-subagent reviewer: codex is the suggestion.
  setCfg(r, /^reviewer: .*$/m, 'reviewer: claude-subagent');
  setCfg(r, /^builder: .*$/m, 'builder: codex');
  setCfg(r, /^build_command: .*$/m, 'build_command: ""');
  out = panelSaveSettings(r.dir, [{ key: 'builder', value: 'claude' }]);
  assert.equal(out.status, 422);
  assert.match(out.body.refused.builder, /another family is codex/);

  // Picking a reviewer from another family in the same Save is fine.
  out = panelSaveSettings(r.dir, [{ key: 'builder', value: 'claude' }, { key: 'reviewer', value: 'codex' }]);
  assert.equal(out.status, 200, JSON.stringify(out.body));

  // So is the same family with allow_same_model_review.
  setCfg(r, /^allow_same_model_review: .*$/m, 'allow_same_model_review: true');
  out = panelSaveSettings(r.dir, [{ key: 'builder', value: 'codex' }]);
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.equal(readCfg(r).builder, 'codex');
});

test('0293 AC3: a build_command set by hand is replaced only once confirmed, as it is now', () => {
  const r = panelRepo();
  setCfg(r, /^reviewer: .*$/m, 'reviewer: claude');
  setCfg(r, /^build_command: .*$/m, 'build_command: "my-build {id}"');
  assert.equal(builderRow(panelSettings(r.dir)).build_command.hand_set, true);
  assert.equal(builderRow(panelSettings(r.dir)).build_command.value, 'my-build {id}');
  const was = snapshot(r);
  let out = panelSaveSettings(r.dir, [{ key: 'builder', value: 'codex' }]);
  assert.equal(out.status, 409);
  assert.equal(out.body.replace, true);
  assert.match(out.body.refused.builder, /set by hand to 'my-build \{id\}'/);
  assert.deepEqual(snapshot(r), was);
  out = panelSaveSettings(r.dir, [{ key: 'builder', value: 'codex' }], { replace: 'something else' });
  assert.equal(out.status, 409, 'confirmed for another command');
  assert.deepEqual(snapshot(r), was);
  out = panelSaveRequest(r.dir, `repo%3Abuilder=codex&replace=${encodeURIComponent('my-build {id}')}`);
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.equal(machineConfig(r.dir).build_command, '', '0387: for this machine');
  fs.rmSync(machineConfigFile(r.dir), { force: true }); // speck/config.yml's from here on
  setCfg(r, /^builder: .*$/m, 'builder: codex');

  // The builder's own command, or blank for Claude Code (build by hand), as speck reads it.
  setCfg(r, /^build_command: .*$/m, 'build_command: ""');
  assert.equal(builderRow(panelSettings(r.dir)).build_command.hand_set, false, 'blank is Codex\'s own');
  setCfg(r, /^builder: .*$/m, 'builder: claude');
  assert.equal(builderRow(panelSettings(r.dir)).build_command.hand_set, true, 'blank isn\'t Claude Code\'s own');

  // Self-check: one that YAML reads as a number is confirmed as the view shows it.
  setCfg(r, /^build_command: .*$/m, 'build_command: 5');
  assert.equal(builderRow(panelSettings(r.dir)).build_command.value, '5');
  assert.equal(panelSaveSettings(r.dir, [{ key: 'builder', value: 'codex' }], { replace: '5' }).status, 200);
  assert.equal(machineConfig(r.dir).build_command, '');
});

test('0293 AC3: the view asks before replacing a build_command set by hand, and cancelling sends nothing', async () => {
  const S = (key, value, more = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, ...more });
  const view = { groups: [{ title: 'Building and reviewing', settings: [
    S('builder', 'claude', { choices: ['claude', 'codex'], build_command: { value: 'my-build {id}', hand_set: true, own: { claude: DEFAULT_BUILD_COMMAND, codex: '', cursor: '' } } })] }] };
  for (const answer of [false, true]) {
    const asks = [];
    const p = settingsPage([view, view], [{ ok: true, changed: ['builder', 'build_command'] }], { confirm: m => { asks.push(String(m)); return answer; } });
    await p.settle();
    await openSettings(p);
    changeTo(p, 'builder', 'codex');
    p.press(saveButton(p));
    await p.settle();
    assert.equal(asks.length, 1);
    assert.match(asks[0], /set by hand to 'my-build \{id\}'/);
    assert.match(asks[0], /replace/i);
    if (!answer) {
      assert.deepEqual(posted(p), []);
      assert.equal(controlOf(p, 'builder').value, 'claude', 'the builder goes back');
    } else {
      assert.equal(posted(p).length, 1);
      assert.ok(posted(p)[0].includes(`replace=${encodeURIComponent('my-build {id}')}`), posted(p)[0]);
    }
  }
});

test('0293 AC4: speck config set builder sets build_command with it, asking for --replace when it was set by hand', () => {
  const r = panelRepo();
  let out = r.run('config', 'set', '--repo', 'builder', 'codex');
  assert.equal(out.status, 0, out.stderr);
  assert.equal(readCfg(r).builder, 'codex');
  assert.equal(readCfg(r).build_command, '');
  assert.match(out.stdout, /build_command: .* → ""/);
  assert.match(out.stdout, /another family is claude/, 'reviewer codex is the same family');
  out = r.run('config', 'set', '--repo', 'builder', 'claude');
  assert.equal(out.status, 0, out.stderr);
  assert.equal(readCfg(r).build_command, DEFAULT_BUILD_COMMAND);
  assert.doesNotMatch(out.stdout, /Note:/);

  fs.writeFileSync(cfgOf(r), fs.readFileSync(cfgOf(r), 'utf8').replace(/^build_command: .*$/m, 'build_command: "my-build {id}"'));
  const was = fs.readFileSync(cfgOf(r), 'utf8');
  out = r.run('config', 'set', '--repo', 'builder', 'cursor');
  assert.notEqual(out.status, 0);
  assert.match(out.stderr, /set by hand/);
  assert.match(out.stderr, /--replace/);
  assert.equal(fs.readFileSync(cfgOf(r), 'utf8'), was);
  out = r.run('config', 'set', '--repo', 'builder', 'cursor', '--replace');
  assert.equal(out.status, 0, out.stderr);
  assert.equal(readCfg(r).builder, 'cursor');
  assert.equal(readCfg(r).build_command, '');

  // A builder speck can't start by itself leaves build_command as it is.
  out = r.run('config', 'set', '--repo', 'builder', 'gemini');
  assert.equal(out.status, 0, out.stderr);
  assert.equal(readCfg(r).build_command, '');
});

// 0388: tickets no longer copy the builder. One that leaves it blank takes the new one; one that names its own keeps it.
test('0293 AC5: a ticket that names its builder keeps it, and the rest take the new one', () => {
  const r = panelRepo();
  setCfg(r, /^reviewer: .*$/m, 'reviewer: claude');
  const made = r.run('new', 'Import bookings');
  assert.equal(made.status, 0, made.stderr);
  const blankOne = parseTicket(fs.readFileSync(path.join(r.dir, made.stdout.trim()), 'utf8')).fm;
  assert.equal(blankOne.builder, '');
  const named = { ...blankOne, builder: 'claude' };
  assert.equal(ticketBuilder(blankOne, loadConfig(r.dir)), 'claude');
  assert.equal(panelSaveSettings(r.dir, [{ key: 'builder', value: 'codex' }]).status, 200);
  assert.equal(ticketBuilder(blankOne, loadConfig(r.dir)), 'codex');
  assert.equal(ticketBuilder(named, loadConfig(r.dir)), 'claude');
});

test('0293 AC5: the view says which tickets keep their builder while a new one is picked', async () => {
  const S = (key, value, more = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, ...more });
  const view = { groups: [{ title: 'Building and reviewing', settings: [
    S('builder', 'claude', { choices: ['claude', 'codex'], build_command: { value: DEFAULT_BUILD_COMMAND, hand_set: false, own: { claude: DEFAULT_BUILD_COMMAND, codex: '', cursor: '' } } })] }] };
  const p = settingsPage([view], []);
  await p.settle();
  await openSettings(p);
  const line = () => p.all(rowOf(p, 'builder')).find(n => n.tagName === 'p' && /names one keeps it/.test(n.textContent));
  assert.equal(line(), undefined, 'not while it\'s unchanged');
  changeTo(p, 'builder', 'codex');
  assert.match(line().textContent, /A ticket that names one keeps it/);
  assert.match(line().textContent, /every ticket that doesn't name its own builder/);
});

// 0491: the README's names are checked in the brief instead (docs-0491).
test('0293 AC4: the setup skill names the command that switches the builder', () => {
  for (const f of ['skills/speck-setup/SKILL.md']) {
    const text = fs.readFileSync(path.join(ROOT, f), 'utf8');
    assert.match(text, /config set builder <name>/, f);
    assert.match(text, /--replace/, f);
  }
});
