import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { panelRepo, gitEnv } from './support/panel.mjs';
import { openSettings } from './support/settings.mjs';
import { agentsPage, agentsBox, agentRows, rowNamed, buttonIn, keyInputOf, AGENTS_FOUND, YOURS_VIEW, settingsWithAgents } from './support/your-agents.mjs';
import { settingsAnswer } from '../scripts/settings.mjs';
import { panelProviderAddRequest } from '../scripts/provider-form.mjs';
import { customProviders, knownProviders } from '../scripts/custom-providers.mjs';
import { readYourAgents } from '../scripts/your-agents.mjs';
import { providerKey } from '../scripts/keys.mjs';

Object.assign(process.env, gitEnv);

// ---------- 0408: don't offer DeepSeek until you add it ----------

const nameOf = (p, r) => p.all(r).find(n => /\bname\b/.test(n.className || '')).textContent;
const offered = p => agentRows(p, true).map(r => nameOf(p, r));
const field = (p, prop) => p.all(agentsBox(p)).find(n => n.attrs?.['data-provider-field'] === prop);
async function openAdd(view) {
  const p = agentsPage(settingsWithAgents(view));
  await openSettings(p);
  p.press(buttonIn(p, agentsBox(p), 'Add an agent'));
  return p;
}
// YOURS_VIEW with DeepSeek not yours and its key not set, as on a machine that has never set one.
function noDeepSeek(o) {
  const view = YOURS_VIEW(o);
  Object.assign(view.agents.find(a => a.id === 'deepseek'), { yours: false, ready: false, key_set: false, why: 'DeepSeek has no API key on this machine.' });
  return view;
}

test('0408 AC1: with no DeepSeek key and DeepSeek not yours, Add an agent offers no DeepSeek row, nor any other known provider', async () => {
  const p = await openAdd(noDeepSeek());
  assert.deepEqual(offered(p), ['Cursor']);
  assert.equal(keyInputOf(p, 'deepseek'), undefined, 'no DeepSeek key field');
  assert.equal(keyInputOf(p, 'testco'), undefined, 'no key field for another known provider either');
  assert.doesNotMatch(agentsBox(p).textContent, /Paste your (DeepSeek|TestCo) API key/);
});

test('0408 AC1: as the server answers for a machine with no DeepSeek key, the page offers no DeepSeek', async () => {
  const r = panelRepo();
  const answer = await settingsAnswer(r.dir, async () => ({ models: [] }), async () => ({ models: [] }), async () => structuredClone(AGENTS_FOUND));
  const ds = answer.your_agents.agents.find(a => a.id === 'deepseek');
  assert.equal(ds.yours, false);
  assert.equal(ds.key_set, false);
  const p = await openAdd(answer.your_agents);
  assert.ok(!offered(p).includes('DeepSeek'), offered(p).join(', '));
  assert.ok(offered(p).includes('Cursor'));
});

test('0408 AC2: Claude Code, Codex and Cursor are still offered when not yours, beside the Add an API provider form', async () => {
  const view = noDeepSeek();
  for (const a of view.agents) if (a.kind === 'agent') a.yours = false;
  const p = await openAdd(view);
  assert.deepEqual(offered(p), ['Claude Code', 'Codex', 'Cursor']);
  assert.ok(buttonIn(p, rowNamed(p, 'Claude Code', true), 'Add'), 'an installed one can be added');
  assert.match(rowNamed(p, 'Cursor', true).textContent, /Install the Cursor CLI/);
  assert.match(agentsBox(p).textContent, /Add an API provider/);
  for (const prop of ['name', 'address', 'type', 'key', 'models']) assert.ok(field(p, prop), prop);
});

test('0408 AC2: when every agent is yours and no provider key is set, only the form is offered', async () => {
  const p = await openAdd(noDeepSeek({ cursor: true }));
  assert.deepEqual(offered(p), []);
  assert.match(agentsBox(p).textContent, /Every agent speck knows is one of yours/);
  assert.ok(field(p, 'name'), 'the form is still there');
});

test('0408 AC3: a provider that is yours stays under Your agents with its key field and Remove, set or not', async () => {
  let p = await openAdd(YOURS_VIEW());
  assert.ok(buttonIn(p, rowNamed(p, 'DeepSeek'), 'Remove'));
  assert.ok(keyInputOf(p, 'deepseek'));
  assert.ok(!offered(p).includes('DeepSeek'));
  const missing = YOURS_VIEW();
  Object.assign(missing.agents.find(a => a.id === 'deepseek'), { ready: false, key_set: false, why: 'DeepSeek has no API key on this machine.' });
  p = await openAdd(missing);
  assert.ok(buttonIn(p, rowNamed(p, 'DeepSeek'), 'Remove'), 'yours with no key: still listed');
  assert.ok(buttonIn(p, rowNamed(p, 'DeepSeek'), 'Save key'));
});

test('0408 AC3: a provider removed with its key kept is still offered with Add, as 0399 left it', async () => {
  const view = YOURS_VIEW();
  view.agents.find(a => a.id === 'deepseek').yours = false;
  const p = await openAdd(view);
  assert.deepEqual(offered(p), ['Cursor', 'DeepSeek']);
  assert.ok(buttonIn(p, rowNamed(p, 'DeepSeek', true), 'Add'));
});

const KEY = 'sk-0408-secret-Rm52t';
const fill = (p, prop, value) => { const n = field(p, prop); n.value = value; (n.listeners.input ?? n.listeners.change)?.({ target: n }); };
const addByForm = (r, given) => panelProviderAddRequest(r.dir, JSON.stringify(given), { find: async () => structuredClone(AGENTS_FOUND) });

test('0408 AC2: DeepSeek is added through the Add an API provider form: its key is saved and it joins your agents, on speck\'s own address', async () => {
  const r = panelRepo();
  const head0 = r.g('rev-parse', 'HEAD');
  const out = await addByForm(r, { name: 'DeepSeek', address: 'https://elsewhere.test/anthropic', type: 'openai', key: KEY, models: 'other-model' });
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.equal(providerKey(r.dir, 'deepseek'), KEY);
  assert.ok(readYourAgents(r.dir).includes('deepseek'));
  assert.equal(out.body.provider, 'deepseek');
  assert.equal(out.body.your_agents.agents.find(a => a.id === 'deepseek').yours, true);
  assert.match(out.body.said, /Added DeepSeek/);
  assert.match(out.body.said, /uses its own/);
  assert.deepEqual(customProviders(r.dir), [], 'not saved as a provider of your own');
  const ds = knownProviders(r.dir).find(p => p.name === 'deepseek');
  assert.equal(ds.address, 'https://api.deepseek.com/anthropic', 'what was typed for the address is not used');
  assert.equal(ds.type, 'anthropic');
  assert.doesNotMatch(JSON.stringify(out.body), new RegExp(KEY));
  assert.equal(r.g('rev-parse', 'HEAD'), head0, 'no commit');
  assert.equal(r.g('status', '--porcelain'), '', 'nothing git sees');
  // Only the name and key are needed, in any case.
  const r2 = panelRepo();
  const bare = await addByForm(r2, { name: ' deepseek ', key: KEY });
  assert.equal(bare.status, 200, JSON.stringify(bare.body));
  assert.equal(providerKey(r2.dir, 'deepseek'), KEY);
});

test('0408 AC2: the form refuses DeepSeek with a bad key, or when it is already yours, and changes nothing', async () => {
  const r = panelRepo();
  const bad = await addByForm(r, { name: 'DeepSeek', key: 'has a space' });
  assert.equal(bad.status, 422);
  assert.equal(providerKey(r.dir, 'deepseek'), null, 'no key saved');
  assert.ok(!(readYourAgents(r.dir) ?? []).includes('deepseek'));
  const empty = await addByForm(r, { name: 'DeepSeek', key: '' });
  assert.equal(empty.status, 422);
  assert.equal(providerKey(r.dir, 'deepseek'), null);
  assert.equal((await addByForm(r, { name: 'DeepSeek', key: KEY })).status, 200);
  const again = await addByForm(r, { name: 'DeepSeek', key: 'sk-other-0408' });
  assert.equal(again.status, 422);
  assert.match(again.body.error, /already one of your agents/);
  assert.equal(providerKey(r.dir, 'deepseek'), KEY, 'its key unchanged');
  // speck's own agents are still refused by name.
  const claude = await addByForm(r, { name: 'Claude', key: KEY, address: 'https://api.acme.test/anthropic', type: 'anthropic', models: 'm' });
  assert.equal(claude.status, 422);
  assert.match(claude.body.error, /already has an agent called claude/);
});

test('0408 AC2: on the page, the form sends DeepSeek with its key', async () => {
  const p = agentsPage(settingsWithAgents(noDeepSeek()), { '/api/providers': { ok: true, provider: 'deepseek', key_set: true, said: 'Added DeepSeek to your agents on this machine.', your_agents: YOURS_VIEW() } });
  await openSettings(p);
  p.press(buttonIn(p, agentsBox(p), 'Add an agent'));
  assert.ok(!offered(p).includes('DeepSeek'));
  fill(p, 'name', 'DeepSeek');
  fill(p, 'key', KEY);
  p.press(buttonIn(p, agentsBox(p), 'Save provider and add'));
  await p.settle();
  assert.deepEqual(p.posts().map(c => c.url), ['/api/providers']);
  assert.deepEqual(JSON.parse(p.posts()[0].body), { name: 'DeepSeek', address: '', type: 'anthropic', key: KEY, models: '' });
  assert.doesNotMatch(agentsBox(p).textContent, new RegExp(KEY));
});
