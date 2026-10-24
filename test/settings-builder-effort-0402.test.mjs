import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { panelRepo, gitEnv } from './support/panel.mjs';
import { settingsPage, openSettings, rowOf, controlOf, changeTo, saveButton, posted } from './support/settings.mjs';
import { panelSettings, panelSaveRequest, CLAUDE_MODELS, EDITABLE } from '../scripts/settings.mjs';
import { machineConfig, MACHINE_SETTINGS } from '../scripts/machine.mjs';
import { checkConfigValue } from '../scripts/config.mjs';
import { buildPlan } from '../scripts/ticket-builder.mjs';
import { codexStartWords, codexResumeArgv } from '../scripts/codex-build.mjs';
import { cursorStartWords } from '../scripts/cursor-build.mjs';
import { providerStartWords } from '../scripts/provider-build.mjs';
import { withBuilderModel } from '../scripts/build-model.mjs';
import { resumeFor } from '../scripts/hand-back.mjs';

Object.assign(process.env, gitEnv);

// ---------- 0402: give the builder an effort setting ----------

const CODEX = [{ slug: 'gpt-6.1-sol', display_name: 'GPT-6.1 Sol', efforts: ['low', 'high', 'ultra'] }, { slug: 'gpt-small', efforts: ['xhigh'] }];
const CURSOR = [{ slug: 'auto', display_name: 'Auto' }];
const DEEPSEEK = [{ slug: 'deepseek-v4-pro', display_name: 'V4 Pro' }];
const AGENT_MODELS = [
  { id: 'claude', name: 'Claude Code', efforts: true, models: CLAUDE_MODELS.map(m => ({ ...m })) },
  { id: 'codex', name: 'Codex', efforts: true, models: CODEX },
  { id: 'cursor', name: 'Cursor', efforts: false, models: CURSOR },
  { id: 'deepseek', name: 'DeepSeek', efforts: false, models: DEEPSEEK }];
const YOURS = { list: true, agents: AGENT_MODELS.map(a => ({ id: a.id, name: a.name, kind: a.id === 'deepseek' ? 'provider' : 'agent', yours: true, ready: true, roles: [] })) };
const EFFORTS = ['', 'low', 'medium', 'high', 'xhigh', 'max'];
const S = (key, value, o = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, for_machine: true, from: 'repo', repo_value: value, ...o });
const view = ({ builder = 'claude', builder_model = '', builder_effort = '' } = {}) => ({ groups: [
  { title: 'Watching', settings: [S('watch_agent', '', { choices: ['', 'claude', 'codex', 'cursor', 'deepseek'] }), S('watch_model', ''), S('watch_effort', '', { choices: EFFORTS })] },
  { title: 'Building and reviewing', settings: [
    S('builder', builder, { choices: ['claude', 'codex', 'cursor', 'deepseek'], build_command: { value: '', own: { claude: '', codex: '', cursor: '' }, each_ticket: true } }),
    S('builder_model', builder_model), S('builder_effort', builder_effort, { choices: EFFORTS }),
    S('reviewer', 'codex', { choices: ['codex', 'claude', 'claude-subagent', 'cursor', 'deepseek'] }),
    S('reviewer_model', ''), S('reviewer_effort', '', { choices: EFFORTS })] }],
  builder_models: { builder, models: [] }, reviewer_models: { reviewer: 'codex', models: [] }, foreman_models: { foreman: builder, models: [] },
  claude_models: CLAUDE_MODELS, providers: [{ name: 'deepseek', label: 'DeepSeek', models: [], default_model: 'deepseek-v4-pro', key_set: true }],
  your_agents: YOURS, agent_models: AGENT_MODELS });

const offered = (p, key) => p.all(controlOf(p, key)).filter(n => n.tagName === 'option' && !n.disabled).map(o => o.value);
const shown = (p, n) => { for (let m = n; m && m !== p.byId('settings'); m = m.parentNode) if (m.hidden) return false; return true; };
// Whether a command's words give an effort, as Claude Code or Codex takes it.
const givesEffort = words => words.some(w => w === '--effort' || w.startsWith('--effort=') || /model_reasoning_effort/.test(w));
const saveQuery = p => new URLSearchParams(posted(p).find(u => u.startsWith('/api/settings/save')).split('?')[1]);

test('0402 AC1: the builder\'s effort list sits beside its list for Claude Code and Codex, offering that agent\'s efforts', async () => {
  const p = settingsPage([view({ builder: 'codex' })]);
  await openSettings(p);
  const effort = rowOf(p, 'builder_effort');
  assert.ok(effort, 'the builder has an effort list');
  assert.ok(p.all(rowOf(p, 'builder')).includes(effort), 'it sits in the builder\'s row');
  assert.ok(shown(p, effort), 'Codex takes an effort');
  assert.deepEqual(offered(p, 'builder_effort'), ['', 'low', 'high', 'ultra', 'xhigh'], 'the efforts Codex lists for its models, ultra included');
  changeTo(p, 'builder', 'claude|opus');
  assert.ok(shown(p, rowOf(p, 'builder_effort')), 'Claude Code takes an effort');
  assert.deepEqual(offered(p, 'builder_effort'), EFFORTS, 'Claude Code\'s: speck\'s own efforts');
  changeTo(p, 'builder', 'cursor|auto');
  assert.equal(shown(p, rowOf(p, 'builder_effort')), false, 'Cursor\'s model names carry the effort');
  changeTo(p, 'builder', 'deepseek|deepseek-v4-pro');
  assert.equal(shown(p, rowOf(p, 'builder_effort')), false, 'a model provider takes no effort');
});

test('0402 AC1: the server offers builder_effort in Building and reviewing, editable, for this machine', () => {
  const r = panelRepo();
  const group = panelSettings(r.dir).groups.find(g => g.settings.some(s => s.key === 'builder_effort'));
  assert.equal(group.title, 'Building and reviewing');
  const keys = group.settings.map(s => s.key);
  assert.equal(keys.indexOf('builder_effort'), keys.indexOf('builder_model') + 1, 'beside the builder\'s model');
  const s = group.settings.find(s => s.key === 'builder_effort');
  assert.equal(s.editable, true);
  assert.equal(s.for_machine, true);
  assert.equal(s.value, '', 'blank by default: the builder\'s own default');
  assert.deepEqual(s.choices, EFFORTS);
  assert.ok(EDITABLE.includes('builder_effort'));
});

test('0402 AC2: saving stores builder_effort for this machine, an effort Codex lists included, and blank clears it', () => {
  assert.ok(MACHINE_SETTINGS.includes('builder_effort'));
  const r = panelRepo();
  const head = r.g('rev-parse', 'HEAD');
  const out = panelSaveRequest(r.dir, 'machine:builder_effort=high');
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.equal(machineConfig(r.dir).builder_effort, 'high');
  assert.equal(r.g('rev-parse', 'HEAD'), head, 'no commit');
  assert.equal(checkConfigValue('builder_effort', ''), '', 'blank: the builder\'s own default');
  assert.throws(() => checkConfigValue('builder_effort', 'hardest'), /builder_effort must be blank or one of/);
  const bad = panelSaveRequest(r.dir, 'machine:builder_effort=hardest');
  assert.equal(bad.status, 422);
  assert.equal(machineConfig(r.dir).builder_effort, 'high', 'nothing saved');
  const cleared = panelSaveRequest(r.dir, 'blank:builder_effort=');
  assert.equal(cleared.status, 200, JSON.stringify(cleared.body));
  assert.equal(machineConfig(r.dir).builder_effort, '');
});

test('0402 AC2: the Settings view saves the builder\'s effort for this machine', async () => {
  const p = settingsPage([view({ builder: 'codex' }), view({ builder: 'codex', builder_effort: 'ultra' })], [{ ok: true, changed: ['builder_effort'] }]);
  await openSettings(p);
  changeTo(p, 'builder_effort', 'ultra');
  p.press(saveButton(p));
  await p.settle();
  const q = saveQuery(p);
  assert.equal(q.get('machine:builder_effort'), 'ultra');
  assert.equal([...q.keys()].filter(k => k.startsWith('repo:')).length, 0, 'nothing for the repo');
});

test('0402 AC3: a Claude Code build is started and resumed with --effort when builder_effort is set', () => {
  const cfg = { builder: 'claude', builder_effort: 'max', build_command: '' };
  const start = buildPlan(cfg, { id: '0001' }, () => true);
  assert.equal(start.agent, 'claude');
  assert.deepEqual(start.words.slice(-2), ['--effort', 'max']);
  const resumed = resumeFor([], cfg, '0001', { agent: 'claude', session: 'abc' }, 'carry on');
  assert.ok(resumed.argv.join(' ').includes('--effort max'), resumed.argv.join(' '));
  // build_command's own words, as speck run gives them, with any --effort it has replaced.
  assert.deepEqual(withBuilderModel(['claude', '-p', 'x', '--effort', 'low'], { ...cfg, builder_model: 'opus' }), ['claude', '-p', 'x', '--model', 'opus', '--effort', 'max']);
  assert.deepEqual(withBuilderModel(['claude', '-p', 'x'], { builder: 'claude', builder_effort: '' }), ['claude', '-p', 'x'], 'blank: none given');
});

test('0402 AC3: a Codex build is given it as Codex takes effort, and Cursor, provider and other-builder builds aren\'t', () => {
  const cfg = { builder: 'codex', builder_effort: 'ultra', build_command: '' };
  const effort = ['-c', 'model_reasoning_effort="ultra"'];
  const has = words => words.some((w, i) => w === effort[0] && words[i + 1] === effort[1]);
  assert.ok(has(codexStartWords(cfg)), codexStartWords(cfg).join(' '));
  assert.ok(has(buildPlan(cfg, { id: '0001' }, () => true).words));
  assert.ok(has(codexResumeArgv(cfg, 'abc', 'carry on')));
  assert.ok(has(resumeFor([], cfg, '0001', { agent: 'codex', session: 'abc' }, 'carry on').argv));
  assert.ok(!has(codexStartWords({ ...cfg, builder_effort: '' })), 'blank: none given');
  const cursor = { builder: 'cursor', builder_effort: 'high', build_command: '' };
  assert.ok(!givesEffort(cursorStartWords(cursor, 'agent')), 'Cursor isn\'t given it');
  const deepseek = { name: 'deepseek', address: 'https://api.deepseek.com/anthropic', defaultModel: 'deepseek-v4-pro' };
  assert.ok(!givesEffort(providerStartWords({ builder: 'deepseek', builder_effort: 'high' }, deepseek)), 'nor is a provider');
  assert.ok(!givesEffort(withBuilderModel(providerStartWords({ builder: 'deepseek', builder_effort: 'high' }, deepseek), { builder: 'deepseek', builder_effort: 'high' })), 'nor as speck run gives it');
  // A ticket built with another builder than the settings' isn't given the settings' builder's effort.
  assert.ok(!givesEffort(buildPlan({ builder: 'claude', builder_effort: 'max', build_command: '' }, { id: '0001', builder: 'codex' }, () => true).words));
  assert.ok(!givesEffort(buildPlan(cfg, { id: '0001', builder: 'claude' }, () => true).words));
});

test('0402 AC4: changing the builder\'s model redraws the effort list for that model', async () => {
  const p = settingsPage([view({ builder: 'codex' })]);
  await openSettings(p);
  changeTo(p, 'builder', 'codex|gpt-6.1-sol');
  assert.deepEqual(offered(p, 'builder_effort'), ['', 'low', 'high', 'ultra']);
  changeTo(p, 'builder', 'codex|gpt-small');
  assert.deepEqual(offered(p, 'builder_effort'), ['', 'xhigh']);
  changeTo(p, 'builder', 'codex|');
  assert.deepEqual(offered(p, 'builder_effort'), ['', 'low', 'high', 'ultra', 'xhigh'], 'the default: any model\'s');
});

test('0402 AC2 AC3: the README lists builder_effort as your own, and the brief names how each builder is given it', () => {
  const readme = fs.readFileSync(new URL('../README.md', import.meta.url), 'utf8'), brief = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8');
  assert.ok(readme.includes('`builder_effort`'), 'the README names builder_effort');
  for (const fact of ['`builder_effort`', '`--effort <value>`', '`-c model_reasoning_effort="<value>"`', '`ultra`']) assert.ok(brief.includes(fact), fact);
});
