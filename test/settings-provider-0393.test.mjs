import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fakePage, panelRepo, gitEnv } from './support/panel.mjs';
import { openSettings, rowOf, controlOf, changeTo } from './support/settings.mjs';
import { agentsBox, buttonIn } from './support/your-agents.mjs';
import { panelSettings, settingsAnswer, agentModels, builderModels, reviewerModels, foremanModels, panelKeyRequest, panelSaveSettings, CLAUDE_MODELS } from '../scripts/settings.mjs';
import { PROVIDERS } from '../scripts/providers.mjs';
import { providerKey, saveProviderKey } from '../scripts/keys.mjs';
import { machineConfig, machineConfigFile } from '../scripts/machine.mjs';

Object.assign(process.env, gitEnv);

// ---------- 0393: offer DeepSeek in Settings ----------

const KEY = 'sk-0393-secret-Qz71p';
const TESTCO = Object.freeze({ name: 'testco', label: 'TestCo', address: 'http://127.0.0.1:9/testco', models: Object.freeze(['tc-big', 'tc-small']), defaultModel: 'tc-big' });
const WITH_TESTCO = Object.freeze([...PROVIDERS, TESTCO]);
const AGENTS = { agents: [{ id: 'claude', name: 'Claude Code', installed: true, signed_in: true }, { id: 'codex', name: 'Codex', installed: true, signed_in: true },
  { id: 'cursor', name: 'Cursor', installed: true, signed_in: true }] };
const NO_CLAUDE = { agents: AGENTS.agents.map(a => a.id === 'claude' ? { ...a, installed: false, signed_in: false, why: 'Claude Code isn\'t installed.' } : a) };

const settingOf = (answer, key) => answer.groups.flatMap(g => g.settings).find(s => s.key === key);
const git = (r, ...a) => r.g(...a);

// The answer panelSettings gives for `repo`, as the page reads it, for `providers`.
const providerView = (answer, name) => answer.providers.find(p => p.name === name);

// A page whose fetch answers GET /api/settings with `view`, POST /api/keys/<name> with each of `keys` in turn, and the
// rest with an empty board. Every call is kept, with its body.
function keysPage(view, keys = []) {
  const calls = [];
  const fetch = async (url, opts = {}) => {
    const u = String(url), method = (opts.method || 'GET').toUpperCase();
    calls.push({ url: u, method, headers: opts.headers || {}, body: opts.body });
    let body = method === 'POST' && u.startsWith('/api/keys/') ? keys.shift()
      : u.startsWith('/api/settings') && method === 'GET' ? view : u.startsWith('/api/agent-models') ? { agent: '', why: 'no' } : { tickets: [], ideas: [], resume_command: '' };
    if (body && body.then) body = await body;
    if (body && body.status) return { ok: false, status: body.status, json: async () => body.body };
    return { ok: true, status: 200, json: async () => body };
  };
  const p = fakePage([], { fetch });
  p.calls93 = calls;
  return p;
}
const row = (key, value, o = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, ...o });
const EFFORTS = ['', 'low', 'medium', 'high', 'xhigh', 'max'];
const providerRow = (p, o = {}) => ({ name: p.name, label: p.label, models: p.models.map(slug => ({ slug, display_name: null, description: slug === p.defaultModel ? `${p.label}'s default` : null })),
  default_model: p.defaultModel, key_set: false, ...o });
// 0399: Your agents for `providers`: each provider, yours when its key is set.
const yoursFor = providers => ({ list: false, agents: [...providers.map(p => ({ id: p.name, name: p.label, kind: 'provider', yours: p.key_set, ready: p.key_set, key_set: p.key_set, roles: [],
    ...(p.key_set ? {} : { why: `${p.label} has no API key on this machine: set one with speck keys set ${p.name}.` }) }))] });
// A view as the server gives it, with DeepSeek offered, and `providers` as given.
const view = ({ builder = 'claude', reviewer = 'codex', foreman = '', providers = [providerRow(PROVIDERS[0])] } = {}) => {
  const names = providers.map(p => p.name);
  return { groups: [
    { title: 'Building and reviewing', settings: [
      row('builder', builder, { choices: ['claude', 'codex', 'cursor', ...names] }), row('builder_model', ''),
      row('reviewer', reviewer, { choices: ['codex', 'claude', 'claude-subagent', 'cursor', ...names] }), row('reviewer_model', ''),
      row('reviewer_effort', '', { choices: EFFORTS })] },
    { title: 'Foreman', settings: [row('foreman', foreman, { choices: ['', 'claude', 'codex', 'cursor', ...names] }), row('foreman_model', '')] }],
  builder_models: { builder, models: CLAUDE_MODELS }, reviewer_models: { reviewer, models: [{ slug: 'gpt-new', efforts: ['low'] }] },
  foreman_models: { foreman: 'claude', models: CLAUDE_MODELS }, claude_models: CLAUDE_MODELS, providers, your_agents: yoursFor(providers) };
};
const options = (p, key) => p.all(controlOf(p, key)).filter(n => n.tagName === 'option').map(o => ({ value: o.value, text: o.textContent }));
// 0399: the key fields are in Your agents, a provider that isn't yours under Add an agent, opened with openAdd.
const keyBox = agentsBox;
const openAdd = p => { const b = buttonIn(p, agentsBox(p), 'Add an agent'); if (b) p.press(b); };
const keyInput = (p, name) => p.all(keyBox(p)).find(n => n.tagName === 'input' && n.attrs?.['data-provider'] === name);
const keyButton = (p, name) => p.all(keyBox(p)).find(n => n.tagName === 'button' && n.attrs?.['data-provider'] === name);
const keyWords = p => (keyBox(p) && !keyBox(p).hidden ? keyBox(p).textContent : '');
const keyPosts = p => p.calls93.filter(c => c.method === 'POST' && c.url.startsWith('/api/keys/'));

test('0393 AC1: Settings offers DeepSeek as builder, reviewer and Foreman, and its models once chosen', async () => {
  const r = panelRepo();
  const answer = panelSettings(r.dir, { agents: AGENTS });
  for (const key of ['builder', 'reviewer', 'foreman']) assert.ok(settingOf(answer, key).choices.includes('deepseek'), key);
  assert.deepEqual(providerView(answer, 'deepseek').models.map(m => m.slug), ['deepseek-v4-pro', 'deepseek-v4-flash']);
  assert.equal(providerView(answer, 'deepseek').label, 'DeepSeek');
  assert.doesNotMatch(JSON.stringify(answer.providers), /Claude Code/);
  // The server's own model lists, for one saved as each, and for one chosen but not saved yet.
  const machine = machineConfigFile(r.dir);
  fs.mkdirSync(path.dirname(machine), { recursive: true });
  fs.writeFileSync(machine, 'builder: deepseek\nbuild_command: ""\nreviewer: deepseek\nforeman: deepseek\n');
  for (const read of [await builderModels(r.dir), await reviewerModels(r.dir), await foremanModels(r.dir)])
    assert.deepEqual(read.models.map(m => m.slug), ['deepseek-v4-pro', 'deepseek-v4-flash'], JSON.stringify(read));
  assert.deepEqual((await agentModels('deepseek')).models.map(m => m.slug), ['deepseek-v4-pro', 'deepseek-v4-flash']);
});

test('0393 AC1: the lists label DeepSeek as DeepSeek, never Claude Code, and choosing it lists its models without asking the server', async () => {
  const p = keysPage(view());
  await openSettings(p);
  for (const key of ['builder', 'reviewer', 'foreman']) {
    const o = options(p, key).find(x => x.value === 'deepseek');
    assert.equal(o?.text, 'DeepSeek', key);
  }
  const before = p.calls93.length;
  changeTo(p, 'builder', 'deepseek');
  await p.settle();
  assert.deepEqual(options(p, 'builder_model').map(o => o.value), ['', 'deepseek-v4-pro', 'deepseek-v4-flash']);
  // The Foreman, left blank, runs on the builder's agent: DeepSeek's models too.
  assert.deepEqual(options(p, 'foreman_model').map(o => o.value), ['', 'deepseek-v4-pro', 'deepseek-v4-flash']);
  changeTo(p, 'reviewer', 'deepseek');
  await p.settle();
  assert.deepEqual(options(p, 'reviewer_model').map(o => o.value), ['', 'deepseek-v4-pro', 'deepseek-v4-flash']);
  assert.ok(!p.calls93.slice(before).some(c => c.url.startsWith('/api/agent-models')), 'speck\'s list, not the server');
  assert.doesNotMatch(p.byId('settings').textContent.replace(/What \w+ does\./g, ''), /Claude Code/);
  // Chosen as the Foreman itself.
  const f = keysPage(view());
  await openSettings(f);
  changeTo(f, 'foreman', 'deepseek');
  await f.settle();
  assert.deepEqual(options(f, 'foreman_model').map(o => o.value), ['', 'deepseek-v4-pro', 'deepseek-v4-flash']);
});

test('0393 AC1: switching the builder to DeepSeek from the panel builds with DeepSeek\'s own command and keeps a DeepSeek model', () => {
  const r = panelRepo();
  const out = panelSaveSettings(r.dir, [{ key: 'builder', value: 'deepseek' }, { key: 'builder_model', value: 'deepseek-v4-flash' }, { key: 'reviewer', value: 'codex' }]);
  assert.equal(out.status, 200, JSON.stringify(out.body));
  const mine = machineConfig(r.dir);
  assert.equal(mine.builder, 'deepseek');
  assert.equal(mine.build_command, '');
  assert.equal(mine.builder_model, 'deepseek-v4-flash');
});

test('0393 AC2 (0399 AC3): Settings says whether this machine has DeepSeek\'s key, with an empty field to enter or replace it', async () => {
  const p = keysPage(view());
  await openSettings(p);
  openAdd(p);
  assert.match(keyWords(p), /DeepSeekNo key/);
  assert.match(keyWords(p), /Paste your DeepSeek API key to add it/);
  assert.equal(keyInput(p, 'deepseek').type, 'password');
  assert.equal(keyInput(p, 'deepseek').value, '');
  const set = keysPage(view({ reviewer: 'deepseek', providers: [providerRow(PROVIDERS[0], { key_set: true })] }));
  await openSettings(set);
  assert.match(keyWords(set), /DeepSeekKey set/);
  assert.equal(keyInput(set, 'deepseek').value, '', 'a saved key is never shown');
});

test('0393 AC2 (0399 AC3): saving a key in Settings sends it once, in the body, and the page clears it and says it\'s saved', async () => {
  const p = keysPage(view({ builder: 'deepseek' }), [{ ok: true, provider: 'deepseek', key_set: true }]);
  await openSettings(p);
  openAdd(p);
  const input = keyInput(p, 'deepseek');
  input.value = KEY;
  input.listeners.input?.({ target: input });
  keyButton(p, 'deepseek').listeners.click({ stopPropagation() {} });
  await p.settle();
  const posts = keyPosts(p);
  assert.equal(posts.length, 1);
  assert.equal(posts[0].url, '/api/keys/deepseek');
  assert.ok(!posts[0].url.includes(KEY), 'never in the address');
  assert.equal(JSON.parse(posts[0].body).key, KEY);
  assert.ok(posts[0].headers['X-Speck-Token']);
  assert.match(keyWords(p), /Saved the DeepSeek API key/);
  assert.equal(keyInput(p, 'deepseek').value, '');
  assert.ok(!p.calls93.some(c => c.method === 'POST' && c.url.startsWith('/api/settings')), 'the settings aren\'t saved with it');
});

test('0393 AC2: the server saves a key for this machine only, with no commit, and never sends it back', () => {
  const r = panelRepo();
  const head = git(r, 'rev-parse', 'HEAD');
  const out = panelKeyRequest(r.dir, 'deepseek', JSON.stringify({ key: `${KEY}\n` }));
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.equal(out.body.key_set, true);
  assert.equal(providerKey(r.dir, 'deepseek'), KEY);
  assert.equal(git(r, 'rev-parse', 'HEAD'), head, 'no commit');
  assert.equal(git(r, 'status', '--porcelain'), '', 'nothing git sees');
  assert.doesNotMatch(JSON.stringify(out.body), new RegExp(KEY));
  // Read back: set, and the key nowhere in what the page is sent.
  const answer = panelSettings(r.dir, { agents: AGENTS });
  assert.equal(providerView(answer, 'deepseek').key_set, true);
  assert.doesNotMatch(JSON.stringify(answer), new RegExp(KEY));
  // Refusals say why without the key, and change nothing.
  const spaced = panelKeyRequest(r.dir, 'deepseek', JSON.stringify({ key: 'sk-a b-secret' }));
  assert.equal(spaced.status, 422);
  assert.doesNotMatch(JSON.stringify(spaced.body), /sk-a b-secret/);
  assert.equal(providerKey(r.dir, 'deepseek'), KEY);
  for (const [name, body] of [['nobody', JSON.stringify({ key: KEY })], ['__proto__', JSON.stringify({ key: KEY })], ['deepseek', 'not json'], ['deepseek', JSON.stringify({ key: 5 })], ['deepseek', null]]) {
    const bad = panelKeyRequest(r.dir, name, body);
    assert.ok(bad.status >= 400 && bad.status < 500, `${name} ${body}: ${bad.status}`);
    assert.equal(typeof bad.body.error, 'string');
    assert.doesNotMatch(JSON.stringify(bad.body), new RegExp(KEY));
  }
  assert.equal(providerKey(r.dir, 'deepseek'), KEY);
});

test('0393 AC3 (0399 AC3): DeepSeek with no key is offered with its key field, saying it has none', async () => {
  const p = keysPage(view());
  await openSettings(p);
  openAdd(p);
  assert.match(keyWords(p), /DeepSeekNo keyPaste your DeepSeek API key to add it/);
  assert.ok(keyButton(p, 'deepseek'), 'a button to save it');
});

test('0393 AC3: the panel\'s checks say when Claude Code isn\'t installed, as speck doctor\'s do', async () => {
  const r = panelRepo();
  const answer = panelSettings(r.dir, { agents: NO_CLAUDE });
  for (const key of ['builder', 'reviewer', 'foreman']) {
    const s = settingOf(answer, key);
    assert.ok(!s.choices.includes('deepseek'), key);
    assert.match(s.missing, /DeepSeek/, key);
    assert.match(s.missing, /Claude Code isn't installed/, key);
  }
  // The page shows the Foreman's line too.
  const v = view();
  v.groups[1].settings[0].missing = settingOf(answer, 'foreman').missing;
  const p = keysPage(v);
  await openSettings(p);
  assert.match(rowOf(p, 'foreman').textContent, /Claude Code isn't installed/);
  // Installed: offered.
  assert.ok(settingOf(panelSettings(r.dir, { agents: AGENTS }), 'builder').choices.includes('deepseek'));
  // Chosen already: still offered, saying it can't run.
  fs.mkdirSync(path.dirname(machineConfigFile(r.dir)), { recursive: true });
  fs.writeFileSync(machineConfigFile(r.dir), 'reviewer: deepseek\n');
  const chosen = settingOf(panelSettings(r.dir, { agents: NO_CLAUDE }), 'reviewer');
  assert.ok(chosen.choices.includes('deepseek'));
  assert.match(chosen.missing, /DeepSeek can't run here: .*Claude Code isn't installed/);
});

test('0393 AC4: any provider in speck\'s list appears in Settings the same way', async () => {
  const r = panelRepo();
  saveProviderKey(r.dir, 'testco', KEY, { providers: WITH_TESTCO });
  const answer = panelSettings(r.dir, { agents: AGENTS, providers: WITH_TESTCO });
  for (const key of ['builder', 'reviewer', 'foreman']) assert.ok(settingOf(answer, key).choices.includes('testco'), key);
  const tc = providerView(answer, 'testco');
  assert.equal(tc.label, 'TestCo');
  assert.deepEqual(tc.models.map(m => m.slug), ['tc-big', 'tc-small']);
  assert.equal(tc.key_set, true);
  assert.deepEqual((await agentModels('testco', undefined, undefined, WITH_TESTCO)).models.map(m => m.slug), ['tc-big', 'tc-small']);
  const all = await settingsAnswer(r.dir, async () => ({ models: [] }), async () => ({ models: [] }), async () => AGENTS, WITH_TESTCO);
  assert.equal(providerView(all, 'testco').label, 'TestCo');
  assert.doesNotMatch(JSON.stringify(all), new RegExp(KEY));
  // On the page: its label, its models and its key field.
  const p = keysPage(view({ providers: [providerRow(PROVIDERS[0]), providerRow(TESTCO)] }), [{ ok: true, provider: 'testco', key_set: true }]);
  await openSettings(p);
  for (const key of ['builder', 'reviewer', 'foreman']) assert.equal(options(p, key).find(x => x.value === 'testco')?.text, 'TestCo', key);
  changeTo(p, 'reviewer', 'testco');
  await p.settle();
  assert.deepEqual(options(p, 'reviewer_model').map(o => o.value), ['', 'tc-big', 'tc-small']);
  openAdd(p);
  assert.match(keyWords(p), /TestCoNo keyPaste your TestCo API key to add it/);
  assert.equal(keyInput(p, 'testco').value, '');
});

test('0393 AC2 (0399 AC3): the key field is in the provider\'s row in Your agents, one of the view\'s groups', async () => {
  const p = keysPage(view({ providers: [providerRow(PROVIDERS[0], { key_set: true })] }));
  await openSettings(p);
  assert.match(keyBox(p).className, /\bsgroup\b/);
  let row = keyInput(p, 'deepseek');
  while (row && !/\bagent\b/.test(row.className || '')) row = row.parentNode;
  assert.ok(row, 'in an agent\'s row');
  assert.match(row.textContent, /^DeepSeek/);
});
