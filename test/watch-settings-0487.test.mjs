import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { speck } from './support/cli.mjs';
import { loadConfig, parseYaml } from '../scripts/core.mjs';
import { MACHINE_SETTINGS, machineConfig, machineConfigFile, saveMachineValues } from '../scripts/machine.mjs';
import { setConfigText, checkConfigValue } from '../scripts/config.mjs';
import { fixingOf } from '../scripts/foreman.mjs';
import { foremanAgentOf, foremanArgv } from '../scripts/foreman-agent.mjs';
import { SETTING_GROUPS, EDITABLE, panelSettings, panelSaveSettings } from '../scripts/settings.mjs';
import { settingsPage, openSettings, rowOf, controlOf } from './support/settings.mjs';

// ---------- 0487: the Foreman's settings are called watch, watch_agent, watch_model and watch_effort ----------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NEW = ['watch', 'watch_agent', 'watch_model', 'watch_effort'];
const OLD = ['foreman_fixing', 'foreman', 'foreman_model', 'foreman_effort'];
const git = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8' });

// A git repo with `config` committed as speck/config.yml.
function repo(config) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-watch-')));
  git(dir, 'init', '-q', '-b', 'main');
  fs.mkdirSync(path.join(dir, 'speck'));
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), `base_branch: main\n${config}`);
  fs.writeFileSync(path.join(dir, '.gitignore'), 'speck/.cache/\n');
  git(dir, 'add', '.');
  git(dir, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'init');
  return dir;
}
const file = dir => fs.readFileSync(path.join(dir, 'speck', 'config.yml'), 'utf8');
const machineFile = dir => machineConfigFile(dir);
const writeMachine = (dir, text) => { fs.mkdirSync(path.dirname(machineFile(dir)), { recursive: true }); fs.writeFileSync(machineFile(dir), text); };

test('0487 AC1: speck reads watch, watch_agent, watch_model and watch_effort from speck/config.yml', () => {
  const dir = repo('builder: claude\nwatch: fix\nwatch_agent: codex\nwatch_model: gpt-6\nwatch_effort: high\n');
  const cfg = loadConfig(dir);
  assert.equal(fixingOf(cfg), 'fix');
  assert.equal(foremanAgentOf(cfg, []), 'codex');
  const argv = foremanArgv(cfg, 'brief', null, []);
  assert.deepEqual(argv.slice(0, 2), ['codex', 'exec']);
  assert.ok(argv.includes('gpt-6'), 'watch_model is given to the agent');
  assert.ok(argv.includes('model_reasoning_effort="high"'), 'watch_effort is given to the agent');
});

test('0487 AC1: the defaults and meanings are as before', () => {
  const cfg = loadConfig(repo('builder: cursor\n'));
  assert.equal(fixingOf(cfg), 'tell', 'watch is tell by default');
  assert.equal(foremanAgentOf(cfg, []), 'cursor', 'a blank watch_agent uses a Cursor builder');
  assert.equal(foremanAgentOf(loadConfig(repo('builder: claude\n')), []), 'claude');
  assert.equal(fixingOf(loadConfig(repo('watch: nonsense\n'))), 'tell', 'a value speck doesn\'t know is tell');
  const d = Object.fromEntries(SETTING_GROUPS.flatMap(g => g.settings).map(s => [s.key, s.default]));
  assert.deepEqual(NEW.map(k => d[k]), ['tell', '', '', '']);
  assert.equal(checkConfigValue('watch', 'off'), 'off');
  assert.throws(() => checkConfigValue('watch', 'maybe'), /watch must be off, tell, fix/);
  assert.throws(() => checkConfigValue('watch_agent', 'nobody', []), /watch_agent must be blank or one of/);
  assert.throws(() => checkConfigValue('watch_effort', 'loads'), /watch_effort must be blank/);
});

test('0487 AC1: this machine\'s own settings hold the new names', () => {
  for (const k of NEW) assert.ok(MACHINE_SETTINGS.includes(k), `${k} is one of your own settings`);
  for (const k of OLD) assert.ok(!MACHINE_SETTINGS.includes(k), `${k} isn't`);
  const dir = repo('watch: tell\nwatch_agent: claude\n');
  writeMachine(dir, 'watch: fix\nwatch_agent: cursor\nwatch_model: auto\nwatch_effort: low\n');
  const cfg = loadConfig(dir);
  assert.deepEqual(NEW.map(k => cfg[k]), ['fix', 'cursor', 'auto', 'low']);
});

test('0487 AC2: a config with only the old names behaves as if it set the new ones', () => {
  const was = loadConfig(repo('builder: claude\nforeman_fixing: fix\nforeman: codex\nforeman_model: gpt-6\nforeman_effort: high\n'));
  const now = loadConfig(repo('builder: claude\nwatch: fix\nwatch_agent: codex\nwatch_model: gpt-6\nwatch_effort: high\n'));
  assert.deepEqual(NEW.map(k => was[k]), NEW.map(k => now[k]));
  assert.deepEqual(foremanArgv(was, 'b', null, []), foremanArgv(now, 'b', null, []));
  assert.equal(fixingOf(was), 'fix');
  // and on this machine
  const dir = repo('builder: claude\n');
  writeMachine(dir, 'foreman_fixing: off\nforeman: cursor\n');
  assert.deepEqual(machineConfig(dir), { watch: 'off', watch_agent: 'cursor' });
  assert.equal(fixingOf(loadConfig(dir)), 'off');
});

test('0487 AC2: where both are set, the new name wins', () => {
  const cfg = loadConfig(repo('foreman_fixing: fix\nwatch: off\nwatch_agent: cursor\nforeman: codex\n'));
  assert.equal(fixingOf(cfg), 'off');
  assert.equal(foremanAgentOf(cfg, []), 'cursor');
  const dir = repo('watch: tell\n');
  writeMachine(dir, 'watch: off\nforeman_fixing: fix\n');
  assert.equal(fixingOf(loadConfig(dir)), 'off');
  // A machine's old name still goes over the project's new one, as that machine's own value.
  const mine = repo('watch: tell\n');
  writeMachine(mine, 'foreman_fixing: fix\n');
  assert.equal(fixingOf(loadConfig(mine)), 'fix');
});

test('0487 AC2: speck config set with an old name saves the new name and leaves no old line', () => {
  const dir = repo('builder: claude\nforeman_fixing: tell   # what it does\nforeman: codex\nship_mode: local\n');
  let r = speck(dir, process.env, 'config', 'set', '--repo', 'foreman_fixing', 'fix');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^watch: tell → fix/);
  assert.match(file(dir), /^base_branch: main\nbuilder: claude\nwatch: fix +# what it does\nforeman: codex\nship_mode: local\n$/, 'in the old line\'s place, with its comment');
  r = speck(dir, process.env, 'config', 'set', '--repo', 'watch_agent', 'cursor');
  assert.equal(r.status, 0, r.stderr);
  assert.doesNotMatch(file(dir), /^foreman:/m, 'setting the new name clears the old line too');
  assert.match(file(dir), /^watch_agent: cursor$/m);
  // Both in the file: the old line goes, the new one is set.
  assert.equal(setConfigText('foreman_model: a\nwatch_model: b\nforeman_model: c\n', ['watch_model'], 'd'), 'watch_model: d\n');
  // On this machine: the old name's value is saved under the new name only.
  writeMachine(dir, 'foreman_effort: high\nforeman: claude\n');
  r = speck(dir, process.env, 'config', 'set', 'foreman_effort', 'low');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^watch_effort \(this machine\): high → low/);
  const left = fs.readFileSync(machineFile(dir), 'utf8');
  assert.doesNotMatch(left, /^foreman/m);
  assert.deepEqual(parseYaml(left), { watch_agent: 'claude', watch_effort: 'low' });
});

test('0487 AC3: Settings shows and saves only the new names, explained with speck', () => {
  assert.deepEqual(SETTING_GROUPS.find(g => g.title === 'Watching').settings.map(s => s.key), NEW);
  for (const k of NEW) assert.ok(EDITABLE.includes(k));
  for (const k of OLD) assert.ok(!EDITABLE.includes(k));
  for (const s of SETTING_GROUPS.flatMap(g => g.settings)) assert.doesNotMatch(s.explain, /Foreman/, s.key);
  const dir = repo('builder: claude\nforeman_fixing: fix\nforeman: codex\n');
  const keys = panelSettings(dir, { providers: [] }).groups.flatMap(g => g.settings.map(s => s.key));
  for (const k of OLD) assert.ok(!keys.includes(k), `${k} isn't shown`);
  const watching = panelSettings(dir, { providers: [] }).groups.find(g => g.title === 'Watching').settings;
  assert.deepEqual(watching.map(s => [s.key, s.repo_value]), [['watch', 'fix'], ['watch_agent', 'codex'], ['watch_model', ''], ['watch_effort', '']]);
  assert.equal(watching[0].default, false, 'an old name in the file counts as set');
  const out = panelSaveSettings(dir, [{ key: 'watch', value: 'off' }, { key: 'watch_agent', value: 'cursor' }]);
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.deepEqual(machineConfig(dir), { watch: 'off', watch_agent: 'cursor' });
  assert.equal(panelSaveSettings(dir, [{ key: 'foreman_fixing', value: 'tell' }]).status, 403, 'an old name isn\'t saved');
});

test('0487 AC3: the role\'s list is drawn for watch_agent with its model', async () => {
  const S = (key, value, o = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, for_machine: true, from: 'repo', repo_value: value, ...o });
  const view = { groups: [
    { title: 'Watching', settings: [S('watch', 'tell', { choices: ['off', 'tell', 'fix'] }), S('watch_agent', 'codex', { choices: ['', 'claude', 'codex'] }), S('watch_model', 'gpt-6.1-sol'),
      S('watch_effort', '', { choices: ['', 'low', 'high'] })] },
    { title: 'Building and reviewing', settings: [S('builder', 'claude', { choices: ['claude', 'codex'], build_command: { value: '', own: { claude: '', codex: '' }, each_ticket: true } }),
      S('builder_model', ''), S('reviewer', 'codex', { choices: ['codex', 'claude'] }), S('reviewer_model', '')] }],
    builder_models: { builder: 'claude', models: [] }, reviewer_models: { reviewer: 'codex', models: [] }, foreman_models: { foreman: 'codex', models: [] },
    claude_models: [], providers: [],
    your_agents: { list: true, agents: [{ id: 'claude', name: 'Claude Code', kind: 'agent', yours: true, ready: true, roles: [] }, { id: 'codex', name: 'Codex', kind: 'agent', yours: true, ready: true, roles: [] }] },
    agent_models: [{ id: 'claude', name: 'Claude Code', efforts: true, models: [{ slug: 'opus', display_name: 'Opus' }] },
      { id: 'codex', name: 'Codex', efforts: true, models: [{ slug: 'gpt-6.1-sol', display_name: 'GPT-6.1 Sol' }] }] };
  const p = settingsPage([view]);
  await openSettings(p);
  assert.ok(rowOf(p, 'watch_agent'), 'watch_agent has its row');
  assert.equal(controlOf(p, 'watch_agent').value, 'codex|gpt-6.1-sol', 'its one list holds its agent and model');
  assert.equal(rowOf(p, 'watch_model'), undefined, 'its model has no row of its own');
});

test('0487 AC4: a new speck/config.yml has the new names with their comments', () => {
  const text = fs.readFileSync(path.join(ROOT, 'templates', 'config.yml'), 'utf8');
  for (const k of NEW) assert.match(text, new RegExp(`^${k}:[^#\\n]*#\\s*\\S`, 'm'), `${k} with a comment`);
  for (const k of OLD) assert.doesNotMatch(text, new RegExp(`^${k}:`, 'm'));
  assert.doesNotMatch(text, /foreman_fixing|foreman_model|foreman_effort/);
  const cfg = parseYaml(text);
  assert.deepEqual(NEW.map(k => cfg[k]), ['tell', '', '', '']);
});

test('0487 AC4: speck config show and the messages name the new settings', () => {
  const dir = repo('builder: claude\nforeman_fixing: fix\n');
  const r = speck(dir, process.env, 'config', 'show', '--json');
  assert.equal(r.status, 0, r.stderr);
  const keys = JSON.parse(r.stdout).groups.flatMap(g => g.settings.map(s => s.key));
  for (const k of NEW) assert.ok(keys.includes(k));
  for (const k of OLD) assert.ok(!keys.includes(k));
  const err = speck(dir, process.env, 'config', 'set', '--repo', 'nope', 'x');
  assert.match(err.stderr, /watch, watch_agent, watch_model, watch_effort/);
  assert.doesNotMatch(err.stderr, /foreman/);
  // No message in speck's code still names an old setting.
  for (const f of ['foreman-fix.mjs', 'foreman-agent.mjs', 'go-with.mjs', 'foreman.mjs', 'settings.mjs', 'config.mjs', 'machine.mjs']) {
    const code = fs.readFileSync(path.join(ROOT, 'scripts', f), 'utf8').split('\n').filter(l => !/^\s*\/\//.test(l) && !/RENAMED|0487/.test(l)).join('\n');
    assert.doesNotMatch(code, /foreman_fixing|foreman_model\b|foreman_effort/, f);
  }
});
