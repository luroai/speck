// 0700: picking a Claude model saves that model, and nothing claims to know Claude Code's own default.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, gitEnv, T, fakePage, items, top } from './support/panel.mjs';
import { settingsPage, openSettings, controlOf, changeTo, saveButton, posted } from './support/settings.mjs';
import { AGENTS_FOUND, YOURS_VIEW, agentsPage } from './support/your-agents.mjs';
import { settingsAnswer, panelSettings, CLAUDE_MODELS } from '../scripts/settings.mjs';
import { levelBuilds } from '../scripts/level-builds.mjs';
import { yourAgentsFile } from '../scripts/your-agents.mjs';
import { setLevelsText } from '../scripts/levels-panel.mjs';

Object.assign(process.env, gitEnv);

const CLAUDE_OWN = 'Claude Code · its own default';
const CODEX = [{ slug: 'gpt-6.1-sol', display_name: 'GPT-6.1 Sol', efforts: ['low', 'high'] }, { slug: 'gpt-small', efforts: ['xhigh'] }];
const CURSOR = [{ slug: 'auto', display_name: 'Auto' }, { slug: 'grok-4.7-high', display_name: 'Grok 4.7 High' }];
const DEEPSEEK = [{ slug: 'deepseek-v4-pro', display_name: 'V4 Pro' }, { slug: 'deepseek-v4-flash', display_name: 'V4 Flash' }];
// Your agents' models, as the server gives them; `claudeDefault` as an older server named Claude Code's.
const YOUR_MODELS = (claudeDefault) => [
  { id: 'claude', name: 'Claude Code', efforts: true, models: CLAUDE_MODELS.map(m => ({ ...m })), ...(claudeDefault ? { default_model: claudeDefault } : {}) },
  { id: 'codex', name: 'Codex', efforts: true, models: CODEX, default_model: 'gpt-6.1-sol' },
  { id: 'cursor', name: 'Cursor', efforts: false, models: CURSOR, default_model: 'grok-4.7-high' },
  { id: 'deepseek', name: 'DeepSeek', efforts: false, models: DEEPSEEK, default_model: 'deepseek-v4-pro' }];
const YOURS = { list: true, agents: ['claude', 'codex', 'cursor', 'deepseek'].map(id => ({ id, name: id, kind: id === 'deepseek' ? 'provider' : 'agent', yours: true, ready: true, roles: [] })) };
const S = (key, value, o = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, for_machine: true, from: 'repo', repo_value: value, ...o });
const EFFORTS = { choices: ['', 'low', 'medium', 'high', 'xhigh', 'max'] };
const view = ({ builder = 'claude', reviewer = 'claude', builder_model = '', reviewer_model = '', claudeDefault } = {}) => ({ groups: [
  { title: 'Your engineering manager', settings: [S('watch_agent', '', { choices: ['', 'claude', 'codex', 'cursor', 'deepseek'] }), S('watch_model', ''), S('watch_effort', '', EFFORTS)] },
  { title: 'Building and reviewing', settings: [
    S('builder', builder, { choices: ['claude', 'codex', 'cursor', 'deepseek'], build_command: { value: '', own: { claude: '', codex: '', cursor: '' }, each_ticket: true } }),
    S('builder_model', builder_model), S('builder_effort', '', EFFORTS), S('reviewer', reviewer, { choices: ['codex', 'claude', 'claude-subagent', 'cursor', 'deepseek'] }),
    S('reviewer_model', reviewer_model), S('reviewer_effort', '', EFFORTS)] }],
  builder_models: { builder, models: [] }, reviewer_models: { reviewer, models: [] }, foreman_models: { foreman: builder, models: [] },
  claude_models: CLAUDE_MODELS, providers: [{ name: 'deepseek', label: 'DeepSeek', models: [], default_model: 'deepseek-v4-pro', key_set: true }],
  your_agents: YOURS, agent_models: YOUR_MODELS(claudeDefault) });

const options = (p, key) => p.all(controlOf(p, key)).filter(n => n.tagName === 'option');
const labels = (p, key) => options(p, key).map(o => o.textContent);
const labelOf = (p, key, value) => options(p, key).find(o => o.value === value)?.textContent;
const saveQuery = p => new URLSearchParams(posted(p).find(u => u.startsWith('/api/settings/save')).split('?')[1]);
const ROLES = ['builder', 'reviewer', 'watch_agent'];
const MODEL_NAMES = [['fable', 'Fable'], ['opus', 'Opus'], ['sonnet', 'Sonnet'], ['haiku', 'Haiku']];

// ---------- AC1 ----------

test('0700 AC1: the server names no default model for Claude Code', async () => {
  const r = panelRepo();
  fs.mkdirSync(path.dirname(yourAgentsFile(r.dir)), { recursive: true });
  fs.writeFileSync(yourAgentsFile(r.dir), JSON.stringify({ agents: ['claude', 'codex'] }));
  const answer = await settingsAnswer(r.dir, async () => ({ models: CODEX }), async () => ({ models: CURSOR }), async () => structuredClone(AGENTS_FOUND));
  const claude = answer.agent_models.find(a => a.id === 'claude');
  assert.ok(claude, 'Claude Code is one of your agents');
  assert.equal(Object.hasOwn(claude, 'default_model'), false);
});

test('0700 AC1: every list offering Claude Code\'s models offers Fable, Opus, Sonnet and Haiku each by its own name, none "(default)"', async () => {
  for (const claudeDefault of [undefined, 'sonnet']) { // even when told Sonnet is its default
    const p = settingsPage([view({ claudeDefault })]);
    await openSettings(p);
    for (const role of ROLES) {
      for (const [slug, name] of MODEL_NAMES) assert.equal(labelOf(p, role, `claude|${slug}`), `Claude Code · ${name}`, `${role}: ${slug}`);
      for (const l of labels(p, role).filter(l => l.startsWith('Claude Code'))) assert.doesNotMatch(l, /\(default\)/, `${role}: ${l}`);
    }
  }
});

test('0700 AC1: picking Sonnet saves sonnet as the model', async () => {
  for (const claudeDefault of [undefined, 'sonnet']) {
    const p = settingsPage([view({ claudeDefault }), view({ builder_model: 'sonnet', claudeDefault })], [{ ok: true, changed: ['builder_model'] }]);
    await openSettings(p);
    changeTo(p, 'builder', 'claude|sonnet');
    assert.equal(saveButton(p).disabled, false, 'Sonnet is a change from a blank model');
    p.press(saveButton(p));
    await p.settle();
    assert.equal(saveQuery(p).get('machine:builder_model'), 'sonnet');
  }
});

// ---------- AC2 ----------

test('0700 AC2: each list offers Claude Code · its own default, whose words name no model, and picking it saves a blank model', async () => {
  const p = settingsPage([view({ builder_model: 'opus' }), view()], [{ ok: true, changed: ['builder_model'] }]);
  await openSettings(p);
  for (const role of ROLES) {
    assert.equal(labelOf(p, role, 'claude|'), CLAUDE_OWN, role);
    for (const [, name] of MODEL_NAMES) assert.ok(!CLAUDE_OWN.includes(name));
  }
  changeTo(p, 'builder', 'claude|');
  p.press(saveButton(p));
  await p.settle();
  assert.equal(saveQuery(p).get('blank:builder_model'), '');
});

// ---------- AC3 ----------

const cfgText = dir => fs.readFileSync(path.join(dir, 'speck', 'config.yml'), 'utf8');
function repoWith(levels) {
  const r = panelRepo(), file = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(file, setLevelsText(cfgText(r.dir), {}).replace(/\nlevels: \{\}\n/, `\nlevels:\n${levels}\n`));
  r.g('commit', '-qam', 'levels');
  return r;
}
const has = (n, c) => new RegExp(`\\b${c}\\b`).test(n.className || '');

test('0700 AC3: Build levels\' Default and its lists say Claude Code · its own default for a blank Claude model', async () => {
  const r = repoWith('  quick:\n    builder_effort: low');
  for (const agent_models of [YOUR_MODELS(), null]) { // with your agents' models read, and without
    const v = { ...panelSettings(r.dir), your_agents: YOURS_VIEW(), ...(agent_models ? { agent_models } : {}) };
    for (const g of v.groups) for (const s of g.settings) { if (s.key === 'builder') s.value = 'claude'; if (s.key === 'builder_model') s.value = ''; }
    const p = agentsPage(v, { 'GET /api/usage': { agents: [] } });
    await openSettings(p);
    const box = p.all(p.byId('settings')).find(n => has(n, 'levels'));
    const sel = p.all(box).find(n => n.tagName === 'select' && n.attrs['aria-label'] === 'Quick level builder');
    const opts = p.all(sel).filter(n => n.tagName === 'option').map(o => ({ value: o.value, label: o.textContent }));
    assert.deepEqual(opts[0], { value: '', label: `Default (${CLAUDE_OWN})` }, JSON.stringify(opts));
    assert.ok(opts.some(o => o.value === 'claude|' && o.label === CLAUDE_OWN), JSON.stringify(opts));
    for (const o of opts.filter(o => o.value === 'claude|' || o.value === '')) assert.doesNotMatch(o.label, /Sonnet|Opus|Fable|Haiku/);
  }
});

test('0700 AC3: a blank Claude model builds with no model, and a ticket\'s Level menu and Builder fact say its own default', async () => {
  const builds = levelBuilds({ builder: 'claude', builder_model: '', builder_effort: 'high', build_command: '', levels: { quick: { builder_effort: 'low' } } }, null, []);
  for (const b of builds) assert.deepEqual([b.builder, b.model, b.model_slug], ['claude', '', ''], b.name);
  const own = { builder: 'claude', agent: 'Claude Code', model: '', model_slug: '', effort: 'high' };
  const board = { run: { on: true }, ideas: [], levels: ['quick'], level_builds: [{ name: 'quick', ...own, effort: 'low' }, { name: '', ...own }],
    tickets: [T('0701', 'draft', { build_with: { ...own, from: 'default', own: { builder: '', builder_model: '' } } })] };
  const fetch = async u => ({ ok: true, status: 200, json: async () => structuredClone(String(u).startsWith('/api/settings') ? view() : /\/log$/.test(String(u)) ? { text: '', truncated: false } : board) });
  const p = fakePage([], { fetch });
  await p.settle();
  const card = () => items(p).find(n => p.all(n).find(x => x.className === 'id')?._text === '0701');
  p.press(top(card()));
  await p.settle();
  const builder = p.all(card()).find(n => has(n, 'set-builder'));
  assert.equal(builder.textContent, `${CLAUDE_OWN} · high`);
  p.press(p.all(card()).find(n => has(n, 'set-level')));
  await p.settle();
  const menu = p.all(card()).find(n => has(n, 'level-menu'));
  const words = p.all(menu).filter(n => has(n, 'lbuild')).map(n => n.textContent);
  assert.deepEqual(words, [`${CLAUDE_OWN} · low`, `${CLAUDE_OWN} · high`]);
});

// ---------- AC4 ----------

test('0700 AC4: a saved sonnet shows Claude Code · Sonnet as the choice, and a saved blank Claude Code · its own default', async () => {
  for (const claudeDefault of [undefined, 'sonnet']) {
    const p = settingsPage([view({ builder_model: 'sonnet', reviewer_model: '', claudeDefault })]);
    await openSettings(p);
    assert.equal(controlOf(p, 'builder').value, 'claude|sonnet');
    assert.equal(labelOf(p, 'builder', controlOf(p, 'builder').value), 'Claude Code · Sonnet');
    assert.equal(controlOf(p, 'reviewer').value, 'claude|');
    assert.equal(labelOf(p, 'reviewer', controlOf(p, 'reviewer').value), CLAUDE_OWN);
    assert.equal(saveButton(p).disabled, true, 'nothing changed');
  }
});

// ---------- AC5 ----------

test('0700 AC5: Codex\'s, Cursor\'s and a provider\'s defaults are named as before', async () => {
  const p = settingsPage([view()]);
  await openSettings(p);
  for (const role of ROLES) {
    assert.equal(labelOf(p, role, 'codex|'), 'Codex · GPT-6.1 Sol (default)');
    assert.equal(labelOf(p, role, 'cursor|'), 'Cursor · Grok 4.7 High (default)');
    assert.equal(labelOf(p, role, 'deepseek|'), 'DeepSeek · V4 Pro (default)');
  }
});

test('0700 AC3: a saved blank Claude model, with Claude Code not one of your agents, is still shown as its own default', async () => {
  const v = view();
  v.agent_models = v.agent_models.filter(a => a.id !== 'claude');
  v.your_agents = { ...YOURS, agents: YOURS.agents.map(a => (a.id === 'claude' ? { ...a, name: 'Claude Code', yours: false } : a)) };
  const p = settingsPage([v]);
  await openSettings(p);
  const shown = options(p, 'builder').find(o => o.value === 'claude|')?.textContent;
  assert.match(shown, /^Claude Code · its own default \(/, shown);
});
