import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, gitEnv } from './support/panel.mjs';
import { settingsPage, openSettings, rowOf, controlOf, changeTo, saveButton, posted } from './support/settings.mjs';
import { AGENTS_FOUND } from './support/your-agents.mjs';
import { settingsAnswer, panelSaveRequest, CLAUDE_MODELS } from '../scripts/settings.mjs';
import { yourAgentsFile } from '../scripts/your-agents.mjs';
import { machineConfig } from '../scripts/machine.mjs';

Object.assign(process.env, gitEnv);

// ---------- 0400: choose each role's model from your agents ----------

const CODEX = [{ slug: 'gpt-6.1-sol', display_name: 'GPT-6.1 Sol', efforts: ['low', 'high'] }, { slug: 'gpt-small', efforts: ['xhigh'] }];
const CURSOR = [{ slug: 'auto', display_name: 'Auto' }, { slug: 'grok-4.7-high', display_name: 'Grok 4.7 High' }];
const DEEPSEEK = [{ slug: 'deepseek-v4-pro', display_name: 'V4 Pro' }, { slug: 'deepseek-v4-flash', display_name: 'V4 Flash' }];
// Your agents' models, as the server gives them: Claude Code, Codex and DeepSeek, and Cursor with `cursor`.
const YOUR_MODELS = ({ cursor = false } = {}) => [
  { id: 'claude', name: 'Claude Code', efforts: true, models: CLAUDE_MODELS.map(m => ({ ...m })) },
  { id: 'codex', name: 'Codex', efforts: true, models: CODEX },
  ...(cursor ? [{ id: 'cursor', name: 'Cursor', efforts: false, models: CURSOR }] : []),
  { id: 'deepseek', name: 'DeepSeek', efforts: false, models: DEEPSEEK }];
const YOURS = ({ cursor = false } = {}) => ({ list: true, agents: [
  { id: 'claude', name: 'Claude Code', kind: 'agent', yours: true, ready: true, roles: [] },
  { id: 'codex', name: 'Codex', kind: 'agent', yours: true, ready: true, roles: [] },
  { id: 'cursor', name: 'Cursor', kind: 'agent', yours: cursor, ready: true, roles: [] },
  { id: 'deepseek', name: 'DeepSeek', kind: 'provider', yours: true, ready: true, key_set: true, roles: [] }] });

const S = (key, value, o = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, for_machine: true, from: 'repo', repo_value: value, ...o });
const view = ({ builder = 'claude', reviewer = 'codex', foreman = '', builder_model = '', reviewer_model = '', foreman_model = '', cursor = false } = {}) => ({ groups: [
  { title: 'Foreman', settings: [S('foreman', foreman, { choices: ['', 'claude', 'codex', 'cursor', 'deepseek'] }), S('foreman_model', foreman_model),
    S('foreman_effort', '', { choices: ['', 'low', 'medium', 'high', 'xhigh', 'max'] })] },
  { title: 'Building and reviewing', settings: [
    S('builder', builder, { choices: ['claude', 'codex', 'cursor', 'deepseek'], build_command: { value: '', own: { claude: '', codex: '', cursor: '' }, each_ticket: true } }),
    S('builder_model', builder_model), S('reviewer', reviewer, { choices: ['codex', 'claude', 'claude-subagent', 'cursor', 'deepseek'] }),
    S('reviewer_model', reviewer_model), S('reviewer_effort', '', { choices: ['', 'low', 'medium', 'high', 'xhigh', 'max'] })] }],
  builder_models: { builder, models: [] }, reviewer_models: { reviewer, models: [] }, foreman_models: { foreman: foreman || builder, models: [] },
  claude_models: CLAUDE_MODELS, providers: [{ name: 'deepseek', label: 'DeepSeek', models: [], default_model: 'deepseek-v4-pro', key_set: true }],
  your_agents: YOURS({ cursor }), agent_models: YOUR_MODELS({ cursor }) });

const options = (p, key) => p.all(controlOf(p, key)).filter(n => n.tagName === 'option');
const offered = (p, key) => options(p, key).filter(o => !o.disabled).map(o => o.value);
const labelOf = (p, key, value) => options(p, key).find(o => o.value === value)?.textContent;
const groupsOf = (p, key) => controlOf(p, key).children.filter(n => n.tagName === 'optgroup').map(g => [g.label, g.children.map(o => o.value)]);
const said = (p, key) => p.all(rowOf(p, key)).filter(n => n.tagName === 'p' && !/\bexplain\b/.test(n.className || '')).map(n => n.textContent).join(' ');
const shown = (p, n) => { for (let m = n; m && m !== p.byId('settings'); m = m.parentNode) if (m.hidden) return false; return true; };
const effortRow = (p, key) => rowOf(p, key);
const saveQuery = p => new URLSearchParams(posted(p).find(u => u.startsWith('/api/settings/save')).split('?')[1]);

test('0400 AC1: the Settings answer lists only your agents\' models, by agent, with each agent\'s own default and whether it takes an effort', async () => {
  const r = panelRepo();
  fs.mkdirSync(path.dirname(yourAgentsFile(r.dir)), { recursive: true });
  fs.writeFileSync(yourAgentsFile(r.dir), JSON.stringify({ agents: ['claude', 'codex', 'deepseek'] }));
  let cursorRead = 0;
  const answer = await settingsAnswer(r.dir, async () => ({ models: CODEX }), async () => { cursorRead++; return { models: CURSOR }; }, async () => structuredClone(AGENTS_FOUND));
  assert.deepEqual(answer.agent_models.map(a => a.id), ['claude', 'codex', 'deepseek'], 'Cursor isn\'t one of yours');
  const byId = Object.fromEntries(answer.agent_models.map(a => [a.id, a]));
  assert.equal(byId.claude.name, 'Claude Code');
  assert.deepEqual(byId.claude.models.map(m => m.slug), CLAUDE_MODELS.map(m => m.slug));
  assert.deepEqual(byId.codex.models.map(m => [m.slug, m.display_name ?? null]), [['gpt-6.1-sol', 'GPT-6.1 Sol'], ['gpt-small', null]]);
  assert.deepEqual(byId.codex.models[0].efforts, ['low', 'high']);
  assert.deepEqual(byId.deepseek.models.map(m => [m.slug, m.display_name]), [['deepseek-v4-pro', 'V4 Pro'], ['deepseek-v4-flash', 'V4 Flash']]);
  assert.deepEqual(answer.agent_models.map(a => a.efforts), [true, true, false], 'Claude Code and Codex take an effort, DeepSeek doesn\'t');
  assert.equal(cursorRead, 0, 'Cursor\'s models aren\'t read when it isn\'t yours and no role uses it');
  // An agent whose models can't be read is still listed, with its default, and why.
  const failing = await settingsAnswer(r.dir, async () => ({ why: 'Codex couldn\'t list its models: check it\'s signed in (codex login), or type the model\'s name.' }), async () => ({ models: [] }), async () => structuredClone(AGENTS_FOUND));
  const codex = failing.agent_models.find(a => a.id === 'codex');
  assert.deepEqual(codex.models, []);
  assert.match(codex.why, /check it's signed in/);
  assert.doesNotMatch(codex.why, /type the model/, 'there\'s no box to type a model in');
});

test('0400 AC1: Builder, Reviewer and Foreman each have one list of your agents\' models, grouped by agent, and no model list of their own', async () => {
  const p = settingsPage([view()]);
  await openSettings(p);
  for (const key of ['builder_model', 'reviewer_model', 'foreman_model']) assert.equal(rowOf(p, key), undefined, `no ${key} list`);
  for (const role of ['builder', 'reviewer', 'foreman']) {
    const groups = groupsOf(p, role);
    assert.deepEqual(groups.map(([label]) => label), ['Claude Code', 'Codex', 'DeepSeek'], `${role}: grouped by your agents, Cursor left out`);
    const codex = groups.find(([label]) => label === 'Codex')[1];
    assert.deepEqual(codex, ['codex|', 'codex|gpt-6.1-sol', 'codex|gpt-small'], `${role}: Codex's own default first`);
    assert.equal(labelOf(p, role, 'codex|gpt-6.1-sol'), 'Codex · GPT-6.1 Sol');
    assert.equal(labelOf(p, role, 'deepseek|deepseek-v4-pro'), 'DeepSeek · V4 Pro');
    assert.equal(labelOf(p, role, 'codex|gpt-small'), 'Codex · gpt-small', 'a model without a display name by its own');
    assert.match(labelOf(p, role, 'codex|'), /^Codex · default/);
    assert.ok(!offered(p, role).some(v => v.startsWith('cursor|')), `${role}: no Cursor`);
  }
  assert.equal(controlOf(p, 'reviewer').value, 'codex|', 'the reviewer as saved: Codex on its default');
});

test('0400 AC2: choosing an entry sets the role\'s agent and model together, saved for this machine', async () => {
  const p = settingsPage([view({ reviewer: 'claude', reviewer_model: 'sonnet' }), view({ reviewer: 'codex', reviewer_model: 'gpt-6.1-sol' })], [{ ok: true, changed: ['reviewer', 'reviewer_model'] }]);
  await openSettings(p);
  changeTo(p, 'reviewer', 'codex|gpt-6.1-sol');
  assert.equal(saveButton(p).disabled, false);
  p.press(saveButton(p));
  await p.settle();
  const q = saveQuery(p);
  assert.equal(q.get('machine:reviewer'), 'codex');
  assert.equal(q.get('machine:reviewer_model'), 'gpt-6.1-sol');
  assert.equal([...q.keys()].filter(k => k.startsWith('repo:')).length, 0, 'nothing for the repo');
  // An agent's own default saves a blank model for this machine, as 0387 does.
  const d = settingsPage([view({ reviewer: 'codex', reviewer_model: 'gpt-6.1-sol' })], [{ ok: true, changed: ['reviewer_model'] }]);
  await openSettings(d);
  changeTo(d, 'reviewer', 'codex|');
  d.press(saveButton(d));
  await d.settle();
  assert.equal(saveQuery(d).get('blank:reviewer_model'), '');
  assert.equal(saveQuery(d).has('machine:reviewer'), false, 'the agent is unchanged');
});

test('0400 AC2: the server saves an agent and its model for this machine, with no commit', () => {
  const r = panelRepo();
  const head = r.g('rev-parse', 'HEAD');
  const out = panelSaveRequest(r.dir, 'machine:reviewer=deepseek&machine:reviewer_model=deepseek-v4-flash');
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.equal(machineConfig(r.dir).reviewer, 'deepseek');
  assert.equal(machineConfig(r.dir).reviewer_model, 'deepseek-v4-flash');
  assert.equal(r.g('rev-parse', 'HEAD'), head, 'no commit');
});

test('0400 AC2: effort is offered beside the list only for an agent that takes one', async () => {
  const p = settingsPage([view({ cursor: true })]);
  await openSettings(p);
  assert.equal(rowOf(p, 'builder_effort'), undefined, 'the builder has no effort');
  const reviewer = rowOf(p, 'reviewer'), effort = effortRow(p, 'reviewer_effort');
  assert.ok(p.all(reviewer).includes(effort), 'reviewer_effort sits in the reviewer\'s row');
  assert.ok(shown(p, effort), 'Codex takes an effort');
  assert.deepEqual(offered(p, 'reviewer_effort'), ['', 'low', 'high', 'xhigh'], 'the efforts Codex lists for its models');
  changeTo(p, 'reviewer', 'codex|gpt-6.1-sol');
  assert.deepEqual(offered(p, 'reviewer_effort'), ['', 'low', 'high'], 'the efforts of the model chosen');
  changeTo(p, 'reviewer', 'cursor|grok-4.7-high');
  assert.equal(shown(p, effortRow(p, 'reviewer_effort')), false, 'Cursor\'s model names carry the effort');
  changeTo(p, 'reviewer', 'deepseek|deepseek-v4-pro');
  assert.equal(shown(p, effortRow(p, 'reviewer_effort')), false, 'a provider takes no effort');
  changeTo(p, 'reviewer', 'claude|opus');
  assert.ok(shown(p, effortRow(p, 'reviewer_effort')), 'Claude Code takes an effort');
  assert.ok(shown(p, effortRow(p, 'foreman_effort')), 'the Foreman on the builder\'s agent, Claude Code, takes one');
  changeTo(p, 'foreman', 'cursor|auto');
  assert.equal(shown(p, effortRow(p, 'foreman_effort')), false);
  assert.equal(controlOf(p, 'foreman').value, 'cursor|auto', 'the list keeps what was chosen');
});

test('0400 AC3: the reviewer list has the Claude subagent under Claude Code, and the Foreman list the builder\'s agent', async () => {
  const p = settingsPage([view({ builder: 'codex', foreman: 'claude', foreman_model: 'opus' })], [{ ok: true, changed: ['foreman', 'foreman_model'] }]);
  await openSettings(p);
  const claude = groupsOf(p, 'reviewer').find(([label]) => label === 'Claude Code')[1];
  assert.equal(claude.filter(v => v === 'claude-subagent|').length, 1, 'one subagent entry, under Claude Code');
  assert.match(labelOf(p, 'reviewer', 'claude-subagent|'), /^Claude Code · .*subagent.*builder's session/i);
  for (const role of ['builder', 'foreman']) assert.ok(!offered(p, role).some(v => v.startsWith('claude-subagent')), `${role}: no subagent`);
  const first = controlOf(p, 'foreman').children[0];
  assert.equal(first.value, '|', 'the builder\'s agent first, outside the agents\' groups');
  assert.match(first.textContent, /builder's agent/i);
  assert.match(first.textContent, /Codex/, 'naming the agent that is now');
  assert.ok(!offered(p, 'builder').includes('|') && !offered(p, 'reviewer').includes('|'));
  changeTo(p, 'foreman', '|');
  p.press(saveButton(p));
  await p.settle();
  const q = saveQuery(p);
  assert.equal(q.get('blank:foreman'), '', 'today\'s blank Foreman');
  assert.equal(q.get('blank:foreman_model'), '');
});

test('0400 AC4: a choice the same-model check refuses is refused when saved, saying why, beside the role', async () => {
  const r = panelRepo();
  const refused = panelSaveRequest(r.dir, 'machine:builder_model=opus&machine:reviewer=claude&machine:reviewer_model=opus');
  assert.equal(refused.status, 422);
  assert.match(refused.body.error, /both would run "opus"/);
  assert.equal(machineConfig(r.dir).reviewer, undefined, 'nothing saved');
  const why = 'builder and reviewer are both "claude", and both would run "opus".';
  // Refused for the model alone, it's still said in the reviewer's row, which holds its list.
  for (const refusedKeys of [['reviewer', 'reviewer_model'], ['reviewer_model']]) {
    const p = settingsPage([view({ reviewer: 'claude', builder_model: 'opus' })], [{ status: 422, body: { error: why, refused: Object.fromEntries(refusedKeys.map(k => [k, why])) } }]);
    await openSettings(p);
    changeTo(p, 'reviewer', 'claude|opus');
    p.press(saveButton(p));
    await p.settle();
    assert.equal(said(p, 'reviewer').split(why).length - 1, 1, `${refusedKeys}: said once in the reviewer's row: ${said(p, 'reviewer')}`);
    assert.equal(controlOf(p, 'reviewer').value, 'claude|opus', 'what you chose stays');
  }
});

test('0400 AC4: a role whose saved agent is no longer one of yours says so and asks you to choose again', async () => {
  const p = settingsPage([view({ reviewer: 'cursor', reviewer_model: 'grok-4.7-high', foreman: 'cursor' })]);
  await openSettings(p);
  const off = options(p, 'reviewer').find(o => o.value === 'cursor|grok-4.7-high');
  assert.ok(off && off.disabled, 'shown as saved, but not offered');
  assert.equal(controlOf(p, 'reviewer').value, 'cursor|grok-4.7-high');
  assert.match(said(p, 'reviewer'), /Cursor isn't one of your agents/);
  assert.match(said(p, 'reviewer'), /choose/i);
  assert.match(said(p, 'foreman'), /Cursor isn't one of your agents/);
  assert.doesNotMatch(said(p, 'builder'), /isn't one of your agents/, 'the builder\'s Claude Code is yours');
  changeTo(p, 'reviewer', 'codex|gpt-6.1-sol');
  assert.doesNotMatch(said(p, 'reviewer'), /isn't one of your agents/, 'chosen again');
});

test('0400 AC1 self-check: while Claude Code isn\'t installed, a model provider isn\'t offered, saying why', async () => {
  const v = view();
  Object.assign(v.your_agents.agents.find(a => a.id === 'claude'), { installed: false, signed_in: false, ready: false });
  const p = settingsPage([v]);
  await openSettings(p);
  for (const role of ['builder', 'reviewer', 'foreman']) {
    assert.ok(!offered(p, role).some(x => x.startsWith('deepseek|')), `${role}: no DeepSeek`);
    assert.match(said(p, role), /Not offered: DeepSeek, as speck runs its models through Claude Code, and Claude Code isn't installed/);
  }
});

test('0400 AC1: the README names the entries as the list does', () => {
  const readme = fs.readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  for (const entry of ['Codex · GPT-6.1 Sol', 'DeepSeek · V4 Pro']) assert.ok(readme.includes(entry), entry);
});

test('0400 AC2 self-check: clearing this machine\'s value for a role clears its model\'s too, as one list holds both', async () => {
  const mine = o => ({ for_machine: true, from: 'machine', ...o });
  const v = view({ reviewer: 'deepseek', reviewer_model: 'deepseek-v4-flash' });
  for (const s of v.groups[1].settings) if (s.key === 'reviewer') Object.assign(s, mine({ repo_value: 'codex' }));
  for (const s of v.groups[1].settings) if (s.key === 'reviewer_model') Object.assign(s, mine({ repo_value: '' }));
  const p = settingsPage([v], [{ ok: true, changed: ['reviewer', 'reviewer_model'] }]);
  await openSettings(p);
  const clear = p.all(rowOf(p, 'reviewer')).find(n => n.tagName === 'button' && n.textContent === 'Clear this machine\'s value');
  p.press(clear);
  p.press(saveButton(p));
  await p.settle();
  const q = saveQuery(p);
  assert.equal(q.get('machine:reviewer'), '');
  assert.equal(q.get('machine:reviewer_model'), '');
});
