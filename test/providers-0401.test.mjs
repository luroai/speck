import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { panelRepo, gitEnv } from './support/panel.mjs';
import { openSettings } from './support/settings.mjs';
import { agentsPage, agentsBox, buttonIn, AGENTS_FOUND, YOURS_VIEW, settingsWithAgents } from './support/your-agents.mjs';
import { fakeClaude, after } from './support/provider-builder.mjs';
import { settingsAnswer, panelSaveSettings } from '../scripts/settings.mjs';
import { panelProviderAddRequest } from '../scripts/provider-form.mjs';
import { knownProviders, customProvidersFile, checkedProvider } from '../scripts/custom-providers.mjs';
import { readYourAgents, removeAgent } from '../scripts/your-agents.mjs';
import { providerKey, saveProviderKey } from '../scripts/keys.mjs';
import { buildPlan } from '../scripts/ticket-builder.mjs';
import { reviewerOptions } from '../scripts/reviewers.mjs';
import { providerReady, providerEnv } from '../scripts/provider-review.mjs';
import { foremanArgv, foremanCantStart } from '../scripts/foreman-agent.mjs';
import { PROVIDER_SCRIPT, FOREMAN_MODE } from '../scripts/provider-build.mjs';
import { machineConfig } from '../scripts/machine.mjs';

Object.assign(process.env, gitEnv);

// ---------- 0401: add any API provider from Settings ----------

const KEY = 'sk-0401-secret-Vb61q';
const find = () => async () => structuredClone(AGENTS_FOUND);
const head = r => r.g('rev-parse', 'HEAD');
const yes = () => true;
const ACME = { name: 'Acme AI', address: 'http://127.0.0.1:9/anthropic/', type: 'anthropic', key: KEY, models: 'acme-large, acme-small' };
const add = (r, given = ACME) => panelProviderAddRequest(r.dir, JSON.stringify(given), { find: find() });
const answerOf = r => settingsAnswer(r.dir, async () => ({ models: [] }), async () => ({ models: [] }), find(), knownProviders(r.dir));
const field = (p, prop) => p.all(agentsBox(p)).find(n => n.attrs?.['data-provider-field'] === prop);
function fill(p, prop, value) {
  const n = field(p, prop);
  n.value = value;
  (n.listeners.input ?? n.listeners.change)?.({ target: n });
}
const wrap = (words, cwd, env = {}) => spawnSync(words[0], words.slice(1), { cwd, encoding: 'utf8', env: { ...process.env, ...env } });

test('0401 AC1: Add an agent has a form for any API provider: name, base URL, API type (OpenAI or Anthropic), key and models', async () => {
  const p = agentsPage(settingsWithAgents(YOURS_VIEW()), { '/api/providers': { ok: true, provider: 'acme-ai', key_set: true, said: 'Added Acme AI to your agents on this machine.', your_agents: YOURS_VIEW() } });
  await openSettings(p);
  assert.equal(field(p, 'name'), undefined, 'shown once Add an agent is pressed');
  p.press(buttonIn(p, agentsBox(p), 'Add an agent'));
  assert.match(agentsBox(p).textContent, /Add an API provider/);
  for (const prop of ['name', 'address', 'type', 'key', 'models']) assert.ok(field(p, prop), prop);
  assert.equal(field(p, 'key').type, 'password');
  assert.equal(field(p, 'key').value, '');
  assert.deepEqual(p.all(field(p, 'type')).filter(n => n.tagName === 'option').map(n => n.textContent), ['OpenAI', 'Anthropic']);
  fill(p, 'name', 'Acme AI');
  fill(p, 'address', 'https://api.acme.test/anthropic');
  fill(p, 'type', 'openai');
  fill(p, 'key', KEY);
  fill(p, 'models', 'acme-large, acme-small');
  p.press(buttonIn(p, agentsBox(p), 'Save provider and add'));
  await p.settle();
  const posts = p.posts();
  assert.deepEqual(posts.map(c => c.url), ['/api/providers']);
  assert.deepEqual(JSON.parse(posts[0].body), { name: 'Acme AI', address: 'https://api.acme.test/anthropic', type: 'openai', key: KEY, models: 'acme-large, acme-small' });
  assert.ok(posts[0].headers['X-Speck-Token']);
  assert.match(agentsBox(p).textContent, /Added Acme AI/);
  if (field(p, 'key')) assert.equal(field(p, 'key').value, '', 'the key is gone from the form once saved');
  assert.doesNotMatch(agentsBox(p).textContent, new RegExp(KEY));
});

test('0401 AC1: the form is offered even when every agent speck knows is already yours, and shows a refusal', async () => {
  const all = YOURS_VIEW({ cursor: true, testco: true });
  const p = agentsPage(settingsWithAgents(all), { '/api/providers': { status: 422, body: { error: 'Give at least one model name.' } } });
  await openSettings(p);
  p.press(buttonIn(p, agentsBox(p), 'Add an agent'));
  assert.ok(field(p, 'name'));
  fill(p, 'name', 'Acme');
  p.press(buttonIn(p, agentsBox(p), 'Save provider and add'));
  await p.settle();
  assert.match(agentsBox(p).textContent, /Give at least one model name/);
  assert.equal(field(p, 'name').value, 'Acme', 'what was typed is kept to fix');
});

test('0401 AC2: saving keeps the provider and its key for this machine only, adds it to your agents, and makes no commit', async () => {
  const r = panelRepo();
  const head0 = head(r);
  const out = await add(r);
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.doesNotMatch(JSON.stringify(out.body), new RegExp(KEY));
  assert.equal(head(r), head0, 'no commit');
  assert.equal(r.g('status', '--porcelain'), '', 'nothing git sees');
  assert.equal(r.g('check-ignore', customProvidersFile(r.dir)), customProvidersFile(r.dir));
  assert.doesNotMatch(fs.readFileSync(customProvidersFile(r.dir), 'utf8'), new RegExp(KEY), 'the key is kept only with the other keys');
  assert.equal(providerKey(r.dir, 'acme-ai'), KEY);
  assert.ok(readYourAgents(r.dir).includes('acme-ai'));
  const p = knownProviders(r.dir).find(x => x.name === 'acme-ai');
  assert.deepEqual({ ...p, models: [...p.models] }, { name: 'acme-ai', label: 'Acme AI', address: 'http://127.0.0.1:9/anthropic', type: 'anthropic', models: ['acme-large', 'acme-small'], defaultModel: 'acme-large' });
});

test('0401 AC2: the provider then appears in Your agents and in each role\'s list, by the name you gave it, with its models', async () => {
  const r = panelRepo();
  await add(r);
  const answer = await answerOf(r);
  const row = answer.your_agents.agents.find(a => a.id === 'acme-ai');
  assert.equal(row.name, 'Acme AI');
  assert.equal(row.kind, 'provider');
  assert.equal(row.yours, true);
  assert.equal(row.key_set, true);
  const listed = answer.agent_models.find(a => a.id === 'acme-ai');
  assert.equal(listed.name, 'Acme AI');
  assert.deepEqual(listed.models.map(m => m.slug), ['acme-large', 'acme-small']);
  for (const key of ['builder', 'reviewer', 'foreman']) {
    const s = answer.groups.flatMap(g => g.settings).find(x => x.key === key);
    assert.ok(s.choices.includes('acme-ai'), key);
  }
  assert.doesNotMatch(JSON.stringify(answer), new RegExp(KEY));
  // Picking it for a role saves for this machine, as a provider speck knows does.
  const saved = panelSaveSettings(r.dir, [{ key: 'builder', value: 'acme-ai', machine: true }, { key: 'foreman', value: 'acme-ai', machine: true }]);
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  assert.equal(machineConfig(r.dir).builder, 'acme-ai');
  assert.equal(machineConfig(r.dir).build_command, '');
});

test('0401 AC2: a form that isn\'t complete or sound saves nothing, and says what to change', async () => {
  const r = panelRepo();
  for (const [given, why] of [
    [{ ...ACME, models: ' , ' }, /at least one model name/],
    [{ ...ACME, name: '  ' }, /Give the provider a name/],
    [{ ...ACME, name: 'Claude' }, /already has an agent called claude/],
    // 0408: DeepSeek, speck's own provider, is no longer refused here: the form adds it (settings-agents-0408).
    [{ ...ACME, address: 'ftp://x' }, /base URL/],
    [{ ...ACME, address: 'http://api.acme.test/anthropic' }, /must start with https:\/\//],
    [{ ...ACME, address: 'https://api.acme.test/v1?key=abc' }, /no user name, password, \? or #/],
    [{ ...ACME, address: 'https://me:pw@api.acme.test' }, /no user name, password/],
    [{ ...ACME, type: 'gemini' }, /OpenAI or Anthropic/],
    [{ ...ACME, key: 'has a space' }, /doesn't look like an API key/],
    [{ ...ACME, models: 'acme;large' }, /doesn't look like a model name/],
  ]) {
    const out = await add(r, given);
    assert.equal(out.status, 422, JSON.stringify(given));
    assert.match(out.body.error, why);
    assert.ok(!fs.existsSync(customProvidersFile(r.dir)), `nothing saved for ${JSON.stringify(given)}`);
    assert.doesNotMatch(JSON.stringify(out.body), new RegExp(KEY));
  }
  assert.equal((await panelProviderAddRequest(r.dir, 'not json', { find: find() })).status, 400);
  assert.equal(readYourAgents(r.dir), null, 'no list made');
});

test('0401 AC3: an Anthropic-type provider builds, reviews and runs the Foreman through Claude Code at its base URL, with this machine\'s key', async () => {
  const r = panelRepo();
  await add(r);
  const known = knownProviders(r.dir), acme = known.find(p => p.name === 'acme-ai');
  // Build
  const plan = buildPlan({ builder: 'acme-ai', build_command: '', builder_model: '' }, { id: '0001', builder: 'acme-ai' }, yes, { repo: r.dir });
  assert.equal(plan.agent, 'acme-ai', plan.why);
  assert.deepEqual(plan.words.slice(0, 4), [process.execPath, PROVIDER_SCRIPT, 'acme-ai', 'http://127.0.0.1:9/anthropic']);
  assert.equal(after(plan.words, '--model'), 'acme-large');
  assert.ok(!plan.words.join(' ').includes(KEY), 'no key on the command line');
  const fake = fakeClaude();
  const ran = wrap([...plan.words.slice(0, 4), 'claude', '-p', 'x', '--model', 'acme-small'], r.dir, { PATH: fake.PATH });
  assert.equal(ran.status, 0, ran.stderr);
  const call = fake.calls()[0];
  assert.equal(call.env.ANTHROPIC_BASE_URL, 'http://127.0.0.1:9/anthropic');
  assert.equal(call.env.ANTHROPIC_API_KEY, KEY);
  assert.equal(call.env.ANTHROPIC_MODEL, 'acme-small');
  assert.ok(!call.args.join(' ').includes(KEY));
  assert.doesNotMatch(ran.stdout + ran.stderr, new RegExp(KEY));
  // Review
  const options = reviewerOptions({ reviewer: 'acme-ai' }, 'acme-ai', known);
  assert.equal(options.provider.name, 'acme-ai');
  assert.ok(!options.command.includes(KEY));
  const env = providerEnv(r.dir, acme, providerReady(r.dir, acme), acme.defaultModel, {});
  assert.equal(env.ANTHROPIC_BASE_URL, 'http://127.0.0.1:9/anthropic');
  assert.equal(env.ANTHROPIC_API_KEY, KEY);
  // Foreman
  const cfg = { foreman: 'acme-ai' };
  assert.equal(foremanCantStart(r.dir, cfg, { installed: yes }), '');
  const argv = foremanArgv(cfg, 'brief', undefined, known);
  assert.deepEqual(argv.slice(1, 5), [PROVIDER_SCRIPT, FOREMAN_MODE, 'acme-ai', 'http://127.0.0.1:9/anthropic']);
  assert.ok(!argv.join(' ').includes(KEY));
});

test('0401 AC4: an OpenAI-type provider is saved and listed, but refused for build, review and Foreman with a plain message', async () => {
  const r = panelRepo();
  const out = await add(r, { ...ACME, name: 'Open Co', type: 'openai', models: 'oc-1' });
  assert.equal(out.status, 200, JSON.stringify(out.body));
  const answer = await answerOf(r);
  assert.equal(answer.your_agents.agents.find(a => a.id === 'open-co').yours, true);
  assert.deepEqual(answer.agent_models.find(a => a.id === 'open-co').models.map(m => m.slug), ['oc-1']);
  const only = /only runs Anthropic-type providers so far/;
  const known = knownProviders(r.dir), oc = known.find(p => p.name === 'open-co');
  const plan = buildPlan({ builder: 'open-co', build_command: '' }, { id: '0001', builder: 'open-co' }, yes, { repo: r.dir });
  assert.equal(plan.words, undefined);
  assert.match(plan.why, only);
  assert.throws(() => providerReady(r.dir, oc), only);
  assert.match(foremanCantStart(r.dir, { foreman: 'open-co' }, { installed: yes }), only);
  const fake = fakeClaude();
  const ran = wrap([process.execPath, PROVIDER_SCRIPT, 'open-co', oc.address, 'claude', '-p', 'x'], r.dir, { PATH: fake.PATH });
  assert.equal(ran.status, 2);
  assert.match(ran.stderr, only);
  assert.equal(fake.calls().length, 0, 'Claude Code never started');
});

test('0401 AC5: DeepSeek still works for anyone who added it, beside a provider you added', async () => {
  const r = panelRepo();
  saveProviderKey(r.dir, 'deepseek', KEY);
  await add(r, { ...ACME, key: 'sk-other-0401' });
  assert.equal(providerKey(r.dir, 'deepseek'), KEY, 'its key is kept');
  assert.equal(providerKey(r.dir, 'acme-ai'), 'sk-other-0401');
  assert.deepEqual(knownProviders(r.dir).map(p => p.name), ['deepseek', 'acme-ai']);
  const plan = buildPlan({ builder: 'deepseek', build_command: '' }, { id: '0001', builder: 'deepseek' }, yes, { repo: r.dir });
  assert.deepEqual(plan.words.slice(2, 4), ['deepseek', 'https://api.deepseek.com/anthropic']);
  // A file changed by hand can't turn a provider speck knows into another.
  fs.writeFileSync(customProvidersFile(r.dir), JSON.stringify({ providers: [{ name: 'deepseek', label: 'DeepSeek', address: 'https://evil.test', type: 'anthropic', models: ['x'] }] }));
  assert.equal(knownProviders(r.dir).find(p => p.name === 'deepseek').address, 'https://api.deepseek.com/anthropic');
  assert.deepEqual(knownProviders(path.join(r.dir, 'nowhere')).map(p => p.name), ['deepseek']);
  // Saving one provider's key keeps every other one's, even one this list doesn't know.
  saveProviderKey(r.dir, 'deepseek', 'sk-new-0401', { providers: knownProviders(path.join(r.dir, 'nowhere')) });
  assert.equal(providerKey(r.dir, 'acme-ai', { providers: [{ name: 'acme-ai', label: 'Acme AI' }] }), 'sk-other-0401');
  assert.equal(checkedProvider({ label: 'Acme AI', address: 'https://a.test/', type: 'Anthropic', models: ['m'] }).type, 'anthropic');
});

test('0401 AC1: the README names Add an API provider and the file the provider is kept in', () => {
  const readme = fs.readFileSync(path.join(import.meta.dirname, '..', 'README.md'), 'utf8');
  assert.match(readme, /\*\*Add an API provider\*\*/);
  assert.ok(readme.includes('`speck/.cache/machine/providers.json`'));
});

test('0401 AC2: a provider that is one of your agents isn\'t replaced by adding it again; once removed, adding it again changes it', async () => {
  const r = panelRepo();
  await add(r);
  const again = await add(r, { ...ACME, address: 'https://other.test/anthropic', key: 'sk-other-0401' });
  assert.equal(again.status, 422);
  assert.match(again.body.error, /already one of your agents.*remove it/);
  assert.equal(knownProviders(r.dir).find(p => p.name === 'acme-ai').address, 'http://127.0.0.1:9/anthropic', 'unchanged');
  assert.equal(providerKey(r.dir, 'acme-ai'), KEY, 'its key unchanged');
  removeAgent(r.dir, 'acme-ai', {}, { providers: knownProviders(r.dir), find: () => AGENTS_FOUND });
  const replaced = await add(r, { ...ACME, address: 'https://other.test/anthropic', key: 'sk-other-0401' });
  assert.equal(replaced.status, 200, JSON.stringify(replaced.body));
  assert.equal(knownProviders(r.dir).find(p => p.name === 'acme-ai').address, 'https://other.test/anthropic');
  assert.equal(providerKey(r.dir, 'acme-ai'), 'sk-other-0401');
  assert.ok(readYourAgents(r.dir).includes('acme-ai'));
});

test('0401 AC2: when the provider can\'t be saved, its key is put back as it was and nothing else changes', async () => {
  const r = panelRepo();
  await add(r);
  removeAgent(r.dir, 'acme-ai', {}, { providers: knownProviders(r.dir), find: () => AGENTS_FOUND });
  const fail = () => { throw Object.assign(new Error('disk full'), { code: 'ENOSPC' }); };
  const out = await panelProviderAddRequest(r.dir, JSON.stringify({ ...ACME, address: 'https://other.test/anthropic', key: 'sk-other-0401' }), { find: find(), saveProvider: fail });
  assert.equal(out.status, 500);
  assert.match(out.body.error, /nothing was saved/);
  assert.equal(knownProviders(r.dir).find(p => p.name === 'acme-ai').address, 'http://127.0.0.1:9/anthropic');
  assert.equal(providerKey(r.dir, 'acme-ai'), KEY, 'the old key is back');
  assert.ok(!readYourAgents(r.dir).includes('acme-ai'));
  const fresh = await panelProviderAddRequest(r.dir, JSON.stringify({ ...ACME, name: 'New Co' }), { find: find(), saveProvider: fail });
  assert.equal(fresh.status, 500);
  assert.equal(knownProviders(r.dir).some(p => p.name === 'new-co'), false);
  assert.equal(providerKey(r.dir, 'new-co', { providers: [{ name: 'new-co', label: 'New Co' }] }), null, 'no key left behind');
});
