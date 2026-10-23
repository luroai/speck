import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { panelRepo, gitEnv } from './support/panel.mjs';
import { openSettings } from './support/settings.mjs';
import { agentsPage, agentsBox, agentRows, rowNamed, buttonIn, keyInputOf, AGENTS_FOUND, YOURS_VIEW, settingsWithAgents } from './support/your-agents.mjs';
import { settingsAnswer } from '../scripts/settings.mjs';

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

test('0408 AC2: the README\'s Add an agent names the form and speck keys set as the ways to add a provider', () => {
  const readme = fs.readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  const para = readme.split('\n').find(l => l.includes('**Add an agent** offers'));
  assert.ok(para);
  assert.match(para, /\*\*Add an API provider\*\*/);
  assert.match(para, /`speck keys set`/);
  assert.doesNotMatch(para, /each model provider with a field for its key/, 'no longer offered that way');
});
