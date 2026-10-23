import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { panelRepo, gitEnv } from './support/panel.mjs';
import { openSettings } from './support/settings.mjs';
import { agentsPage, agentsBox, agentRows, rowNamed, buttonIn, AGENTS_FOUND, YOURS_VIEW, settingsWithAgents } from './support/your-agents.mjs';
import { panelAgentRequest } from '../scripts/settings.mjs';
import { readYourAgents } from '../scripts/your-agents.mjs';

Object.assign(process.env, gitEnv);

// ---------- 0404: drop the role lines under Your agents ----------

const ROLE_LINE = /\buses? it\b/;

test('0404 AC1: no row under Your agents says which roles use its agent', async () => {
  const view = YOURS_VIEW();
  view.agents.find(a => a.id === 'deepseek').roles = ['reviewer'];
  const p = agentsPage(settingsWithAgents(view));
  await openSettings(p);
  const rows = agentRows(p);
  assert.ok(rows.length >= 3, 'the rows are there');
  for (const r of rows) assert.doesNotMatch(r.textContent, ROLE_LINE, r.textContent);
  assert.doesNotMatch(agentsBox(p).textContent, /The builder and Foreman use it|The reviewer uses it/);
});

test('0404 AC2: each agent still shows its name, its state and Remove', async () => {
  const p = agentsPage(settingsWithAgents(YOURS_VIEW()));
  await openSettings(p);
  assert.match(rowNamed(p, 'Claude Code').textContent, /Installed, signed in/);
  assert.match(rowNamed(p, 'Codex').textContent, /Installed, not signed in/);
  assert.match(rowNamed(p, 'Codex').textContent, /codex login/, 'its reason is still shown');
  assert.match(rowNamed(p, 'DeepSeek').textContent, /Key set/);
  for (const name of ['Claude Code', 'Codex', 'DeepSeek']) assert.ok(buttonIn(p, rowNamed(p, name), 'Remove'), name);
});

test('0404 AC2: removing an agent a role uses is still refused, naming the role', async () => {
  const r = panelRepo();
  const find = async () => structuredClone(AGENTS_FOUND);
  const refused = await panelAgentRequest(r.dir, 'codex', 'remove', { find });
  assert.equal(refused.status, 422);
  assert.match(refused.body.error, /Codex is the reviewer/);
  assert.equal(readYourAgents(r.dir), null, 'nothing changed');
  const p = agentsPage(settingsWithAgents(YOURS_VIEW()), { '/api/agents/codex/remove': { status: 422, body: { error: 'Codex is the reviewer, so it wasn\'t removed.', your_agents: YOURS_VIEW() } } });
  await openSettings(p);
  p.press(buttonIn(p, rowNamed(p, 'Codex'), 'Remove'));
  await p.settle();
  assert.match(agentsBox(p).textContent, /Codex is the reviewer/);
  assert.ok(rowNamed(p, 'Codex'));
});
