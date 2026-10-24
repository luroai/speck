import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, gitEnv } from './support/panel.mjs';
import { settingsPage, openSettings, controlOf, changeTo, saveButton, posted } from './support/settings.mjs';
import { AGENTS_FOUND } from './support/your-agents.mjs';
import { fakeAgents, READY, CURSOR_MODELS } from './support/agents.mjs';
import { settingsAnswer, CLAUDE_MODELS } from '../scripts/settings.mjs';
import { parseCursorModels, agentModelsAsync } from '../scripts/agents.mjs';
import { yourAgentsFile } from '../scripts/your-agents.mjs';

Object.assign(process.env, gitEnv);

// ---------- 0403: name each agent's default model in the role lists ----------

const CODEX = [{ slug: 'gpt-6.1-sol', display_name: 'GPT-6.1 Sol', efforts: ['low', 'high'] }, { slug: 'gpt-small', efforts: ['xhigh'] }];
const CURSOR = [{ slug: 'auto', display_name: 'Auto' }, { slug: 'grok-4.7-high', display_name: 'Grok 4.7 High' }];
const DEEPSEEK = [{ slug: 'deepseek-v4-pro', display_name: 'V4 Pro' }, { slug: 'deepseek-v4-flash', display_name: 'V4 Flash' }];
// Your agents' models, as the server gives them, each with its default model.
const YOUR_MODELS = ({ cursor = { models: CURSOR, default_model: 'grok-4.7-high' } } = {}) => [
  { id: 'claude', name: 'Claude Code', efforts: true, models: CLAUDE_MODELS.map(m => ({ ...m })), default_model: 'sonnet' },
  { id: 'codex', name: 'Codex', efforts: true, models: CODEX, default_model: 'gpt-6.1-sol' },
  { id: 'cursor', name: 'Cursor', efforts: false, ...cursor },
  { id: 'deepseek', name: 'DeepSeek', efforts: false, models: DEEPSEEK, default_model: 'deepseek-v4-pro' }];
const YOURS = { list: true, agents: ['claude', 'codex', 'cursor', 'deepseek'].map(id => ({ id, name: id, kind: id === 'deepseek' ? 'provider' : 'agent', yours: true, ready: true, roles: [] })) };
const S = (key, value, o = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, for_machine: true, from: 'repo', repo_value: value, ...o });
const EFFORTS = { choices: ['', 'low', 'medium', 'high', 'xhigh', 'max'] };
const view = ({ builder = 'claude', reviewer = 'codex', foreman = '', builder_model = '', reviewer_model = '', watch_model = '', cursor } = {}) => ({ groups: [
  { title: 'Watching', settings: [S('watch_agent', foreman, { choices: ['', 'claude', 'codex', 'cursor', 'deepseek'] }), S('watch_model', watch_model), S('watch_effort', '', EFFORTS)] },
  { title: 'Building and reviewing', settings: [
    S('builder', builder, { choices: ['claude', 'codex', 'cursor', 'deepseek'], build_command: { value: '', own: { claude: '', codex: '', cursor: '' }, each_ticket: true } }),
    S('builder_model', builder_model), S('builder_effort', '', EFFORTS), S('reviewer', reviewer, { choices: ['codex', 'claude', 'claude-subagent', 'cursor', 'deepseek'] }),
    S('reviewer_model', reviewer_model), S('reviewer_effort', '', EFFORTS)] }],
  builder_models: { builder, models: [] }, reviewer_models: { reviewer, models: [] }, foreman_models: { foreman: foreman || builder, models: [] },
  claude_models: CLAUDE_MODELS, providers: [{ name: 'deepseek', label: 'DeepSeek', models: [], default_model: 'deepseek-v4-pro', key_set: true }],
  your_agents: YOURS, agent_models: YOUR_MODELS(cursor ? { cursor } : undefined) });

const options = (p, key) => p.all(controlOf(p, key)).filter(n => n.tagName === 'option');
const labels = (p, key) => options(p, key).map(o => o.textContent);
const labelOf = (p, key, value) => options(p, key).find(o => o.value === value)?.textContent;
const values = (p, key) => options(p, key).map(o => o.value);
const saveQuery = p => new URLSearchParams(posted(p).find(u => u.startsWith('/api/settings/save')).split('?')[1]);

test('0403 AC1: each role\'s list names every model, with no entry labelled only "default"', async () => {
  const p = settingsPage([view()]);
  await openSettings(p);
  for (const role of ['builder', 'reviewer', 'watch_agent']) {
    for (const l of labels(p, role)) assert.doesNotMatch(l, /·\s*default\b/i, `${role}: ${l}`);
    for (const name of ['Fable', 'Opus', 'Sonnet', 'Haiku']) assert.ok(labels(p, role).some(l => l.startsWith(`Claude Code · ${name}`)), `${role}: Claude Code · ${name}`);
    assert.equal(labelOf(p, role, 'claude|opus'), 'Claude Code · Opus');
    assert.equal(labelOf(p, role, 'codex|gpt-small'), 'Codex · gpt-small');
    assert.equal(labelOf(p, role, 'cursor|auto'), 'Cursor · Auto');
    assert.equal(labelOf(p, role, 'deepseek|deepseek-v4-flash'), 'DeepSeek · V4 Flash');
  }
});

test('0403 AC2: the default model is labelled "(default)", once, and selected while the model is blank', async () => {
  const p = settingsPage([view()]);
  await openSettings(p);
  for (const role of ['builder', 'reviewer', 'watch_agent']) {
    assert.equal(labelOf(p, role, 'claude|'), 'Claude Code · Sonnet (default)');
    assert.equal(labelOf(p, role, 'codex|'), 'Codex · GPT-6.1 Sol (default)');
    assert.equal(labelOf(p, role, 'cursor|'), 'Cursor · Grok 4.7 High (default)');
    assert.equal(labelOf(p, role, 'deepseek|'), 'DeepSeek · V4 Pro (default)');
    for (const v of ['claude|sonnet', 'codex|gpt-6.1-sol', 'cursor|grok-4.7-high', 'deepseek|deepseek-v4-pro']) assert.ok(!values(p, role).includes(v), `${role}: ${v} only as the default`);
    assert.equal(labels(p, role).filter(l => / \(default\)$/.test(l)).length, 4, `${role}: one default an agent`);
  }
  assert.equal(controlOf(p, 'builder').value, 'claude|', 'blank builder_model: Claude Code\'s default is selected');
  assert.equal(controlOf(p, 'reviewer').value, 'codex|', 'blank reviewer_model: Codex\'s default is selected');
  // Its default kept, nothing changes on save.
  changeTo(p, 'builder', 'claude|');
  assert.equal(saveButton(p).disabled, true, 'leaving the default selected changes nothing');
  // Another model, then the default again: the model stays blank.
  changeTo(p, 'builder', 'claude|opus');
  assert.equal(saveButton(p).disabled, false);
  changeTo(p, 'builder', 'claude|');
  assert.equal(saveButton(p).disabled, true, 'back to the default: blank, as saved');
});

test('0403 AC2: choosing the default entry after another model saves a blank model', async () => {
  const p = settingsPage([view({ builder_model: 'opus' }), view()], [{ ok: true, changed: ['builder_model'] }]);
  await openSettings(p);
  assert.equal(controlOf(p, 'builder').value, 'claude|opus');
  changeTo(p, 'builder', 'claude|');
  p.press(saveButton(p));
  await p.settle();
  assert.equal(saveQuery(p).get('blank:builder_model'), '');
  assert.equal(saveQuery(p).has('machine:builder'), false, 'the agent is unchanged');
});

test('0403 AC2: a model saved by the default\'s own name shows as the default entry, not as one not offered', async () => {
  const p = settingsPage([view({ builder_model: 'sonnet' })]);
  await openSettings(p);
  assert.equal(controlOf(p, 'builder').value, 'claude|');
  assert.ok(!labels(p, 'builder').some(l => /not offered/.test(l)), labels(p, 'builder').join(' / '));
  assert.equal(saveButton(p).disabled, true, 'nothing changed');
});

test('0403 AC3: an agent that lists no models offers only its default, still labelled "(default)"', async () => {
  const p = settingsPage([view({ cursor: { models: [], default_model: 'auto', why: 'Cursor took too long.' } })]);
  await openSettings(p);
  assert.deepEqual(values(p, 'builder').filter(v => v.startsWith('cursor|')), ['cursor|']);
  assert.equal(labelOf(p, 'builder', 'cursor|'), 'Cursor · auto (default)');
  const q = settingsPage([view({ cursor: { models: [], why: 'Cursor took too long.' } })]);
  await openSettings(q);
  assert.deepEqual(values(q, 'builder').filter(v => v.startsWith('cursor|')), ['cursor|']);
  assert.equal(labelOf(q, 'builder', 'cursor|'), 'Cursor (default)', 'its default\'s name isn\'t known');
});

test('0403 AC3: the Settings answer names each agent\'s default: Cursor\'s marked one, a provider\'s, Sonnet for Claude Code, Codex\'s first', async () => {
  const r = panelRepo();
  fs.mkdirSync(path.dirname(yourAgentsFile(r.dir)), { recursive: true });
  fs.writeFileSync(yourAgentsFile(r.dir), JSON.stringify({ agents: ['claude', 'codex', 'cursor', 'deepseek'] }));
  const answer = await settingsAnswer(r.dir, async () => ({ models: CODEX }), async () => ({ models: CURSOR, default_model: 'grok-4.7-high' }), async () => structuredClone(AGENTS_FOUND));
  const byId = Object.fromEntries(answer.agent_models.map(a => [a.id, a]));
  assert.equal(byId.claude.default_model, 'sonnet');
  assert.equal(byId.codex.default_model, 'gpt-6.1-sol');
  assert.equal(byId.cursor.default_model, 'grok-4.7-high');
  assert.equal(byId.deepseek.default_model, 'deepseek-v4-pro');
  const none = await settingsAnswer(r.dir, async () => ({ why: 'Codex couldn\'t list its models.' }), async () => ({ models: CURSOR }), async () => structuredClone(AGENTS_FOUND));
  const noneById = Object.fromEntries(none.agent_models.map(a => [a.id, a]));
  assert.equal(noneById.codex.default_model, undefined, 'Codex listed nothing');
  assert.equal(noneById.cursor.default_model, undefined, 'Cursor marked none');
});

test('0403 AC3: Cursor\'s "(default)" is kept as its default model when its list is read', async () => {
  assert.equal(parseCursorModels(CURSOR_MODELS).default_model, 'opus-4.6-thinking');
  assert.equal(parseCursorModels('auto - Auto  (current, default)\ngpt-5 - GPT-5\n').default_model, 'auto');
  assert.equal(parseCursorModels('auto - Auto  (current)\n').default_model, undefined);
  const dir = fakeAgents(READY), was = process.env.PATH;
  process.env.PATH = `${dir}${path.delimiter}${was}`;
  try {
    const read = await agentModelsAsync('cursor', { defaults: true });
    assert.equal(read.default_model, 'opus-4.6-thinking');
    assert.equal((await agentModelsAsync('cursor')).default_model, undefined, 'only when asked');
    // The Settings answer asks for it.
    const r = panelRepo();
    fs.mkdirSync(path.dirname(yourAgentsFile(r.dir)), { recursive: true });
    fs.writeFileSync(yourAgentsFile(r.dir), JSON.stringify({ agents: ['cursor'] }));
    const answer = await settingsAnswer(r.dir);
    assert.equal(answer.agent_models.find(a => a.id === 'cursor').default_model, 'opus-4.6-thinking');
  } finally { process.env.PATH = was; }
});
