import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fakeAgents, READY } from './support/agents.mjs';
import { panelRepo } from './support/panel.mjs';
import { settingsPage, openSettings, rowOf, controlOf, changeTo } from './support/settings.mjs';
import { panelSettings, foremanModels, CLAUDE_MODELS } from '../scripts/settings.mjs';

// ---------- 0348: pick the Foreman's model from its agent's list in the Settings view ----------

async function onlyOnPathAsync(dir, fn) {
  const was = process.env.PATH;
  process.env.PATH = dir;
  try { return await fn(); } finally { process.env.PATH = was; }
}
// Sets a top-level key in the repo's speck/config.yml, adding it when it isn't there.
const withKey = (r, key, value) => {
  const cfg = path.join(r.dir, 'speck', 'config.yml'), text = fs.readFileSync(cfg, 'utf8'), line = `${key}: ${JSON.stringify(value)}`;
  const re = new RegExp(`^${key}:.*$`, 'm');
  fs.writeFileSync(cfg, re.test(text) ? text.replace(re, line) : `${text}\n${line}\n`);
};
const CODEX = [{ slug: 'gpt-new', display_name: 'GPT New', description: 'The newest.', efforts: ['low'] }];
const codexRead = async () => ({ models: CODEX });
const notAsked = async () => { throw new Error('not asked'); };

const builderRow = builder => ({ key: 'builder', value: builder, default: false, explain: 'Who builds.', editable: true, choices: ['claude', 'codex', 'cursor'] });
const view = ({ builder = 'claude', foreman = '', foreman_models }) => ({ groups: [
  { title: 'Building and reviewing', settings: [builderRow(builder)] },
  { title: 'Watching', settings: [
    { key: 'watch_agent', value: foreman, default: false, explain: 'The Foreman agent.', editable: true, choices: ['', 'claude', 'codex', 'cursor'] },
    { key: 'watch_model', value: '', default: false, explain: 'The Foreman model.', editable: true },
  ] }],
  claude_models: CLAUDE_MODELS, ...(foreman_models ? { foreman_models } : {}) });
const optionText = (p, key) => Object.fromEntries(p.all(controlOf(p, key)).filter(n => n.tagName === 'option').map(o => [o.value, o.textContent]));
const said = (p, key) => p.all(rowOf(p, key)).filter(n => n.tagName === 'p').map(n => n.textContent);

test('0348 AC1: foremanModels reads the models of the agent the Foreman runs on', async () => {
  const r = panelRepo();
  withKey(r, 'watch_agent', 'claude');
  assert.deepEqual(await foremanModels(r.dir, notAsked, notAsked), { foreman: 'claude', models: CLAUDE_MODELS });
  withKey(r, 'watch_agent', 'codex');
  assert.deepEqual(await foremanModels(r.dir, codexRead, notAsked), { foreman: 'codex', models: CODEX });
  withKey(r, 'watch_agent', 'cursor');
  const cursor = await onlyOnPathAsync(fakeAgents(READY), () => foremanModels(r.dir, notAsked));
  assert.equal(cursor.foreman, 'cursor');
  assert.deepEqual(cursor.models.map(m => m.slug), ['auto', 'opus-4.6-thinking', 'sonnet-4.6']);
  // The panel's settings carry them as foreman_models.
  assert.deepEqual(panelSettings(r.dir, { foremanModels: cursor }).foreman_models, cursor);
});

test('0348 AC1: watch_model is a list of the Foreman agent\'s models, each by its display name', async () => {
  const p = settingsPage([view({ foreman: 'codex', foreman_models: { foreman: 'codex', models: CODEX } })]);
  await openSettings(p);
  assert.equal(controlOf(p, 'watch_model').tagName, 'select');
  const text = optionText(p, 'watch_model');
  assert.deepEqual(Object.keys(text), ['', 'gpt-new']);
  assert.match(text['gpt-new'], /GPT New/);
  // Claude's names for claude.
  const c = settingsPage([view({ foreman: 'claude', foreman_models: { foreman: 'claude', models: CLAUDE_MODELS } })]);
  await openSettings(c);
  assert.deepEqual(Object.keys(optionText(c, 'watch_model')), ['', 'fable', 'opus', 'sonnet', 'haiku']);
  assert.match(optionText(c, 'watch_model').opus, /Always the newest Opus model/);
});

test('0348 AC2: with foreman blank, the list is of the builder when that\'s Codex or Cursor, and Claude Code otherwise', async () => {
  const r = panelRepo();
  withKey(r, 'watch_agent', '');
  withKey(r, 'builder', 'codex');
  assert.deepEqual(await foremanModels(r.dir, codexRead, notAsked), { foreman: 'codex', models: CODEX });
  withKey(r, 'builder', 'cursor');
  assert.deepEqual(await foremanModels(r.dir, notAsked, async () => ({ models: [{ slug: 'auto' }] })), { foreman: 'cursor', models: [{ slug: 'auto' }] });
  withKey(r, 'builder', 'claude');
  assert.deepEqual(await foremanModels(r.dir, notAsked, notAsked), { foreman: 'claude', models: CLAUDE_MODELS });
  // In the view, too.
  const p = settingsPage([view({ builder: 'codex', foreman_models: { foreman: 'codex', models: CODEX } })]);
  await openSettings(p);
  assert.deepEqual(Object.keys(optionText(p, 'watch_model')), ['', 'gpt-new']);
  const c = settingsPage([view({ builder: 'claude', foreman_models: { foreman: 'claude', models: CLAUDE_MODELS } })]);
  await openSettings(c);
  assert.deepEqual(Object.keys(optionText(c, 'watch_model')), ['', 'fable', 'opus', 'sonnet', 'haiku']);
});

test('0348 AC3: when the Foreman agent\'s models can\'t be read, watch_model is a box to type in, with why in one line', async () => {
  const r = panelRepo();
  withKey(r, 'watch_agent', 'cursor');
  const none = await onlyOnPathAsync(fakeAgents({}), () => foremanModels(r.dir, notAsked));
  assert.equal(none.foreman, 'cursor');
  assert.equal(none.models, undefined);
  assert.match(none.why, /Cursor isn't installed/);
  assert.doesNotMatch(none.why, /\n/);
  const p = settingsPage([view({ foreman: 'cursor', foreman_models: none })]);
  await openSettings(p);
  assert.equal(controlOf(p, 'watch_model').tagName, 'input');
  assert.equal(said(p, 'watch_model').filter(t => /Cursor isn't installed/.test(t)).length, 1);
});

// 0369 AC3: changed from saying to save codex and open Settings again: its models are read when it's chosen.
test('0348 AC4: choosing another Foreman agent reads its models, without saying to save it first', async () => {
  const p = settingsPage([view({ foreman: 'claude', foreman_models: { foreman: 'claude', models: CLAUDE_MODELS } })]);
  await openSettings(p);
  changeTo(p, 'watch_agent', 'codex');
  assert.equal(controlOf(p, 'watch_model').tagName, 'input');
  assert.ok(p.settingsCalls.some(c => c.url === '/api/agent-models?agent=codex'));
  assert.ok(!said(p, 'watch_model').some(t => /open Settings again/.test(t)), said(p, 'watch_model').join(' | '));
  // Back to the saved one: its list again.
  changeTo(p, 'watch_agent', 'claude');
  assert.equal(controlOf(p, 'watch_model').tagName, 'select');
  // Claude's names need no save.
  const q = settingsPage([view({ foreman: 'codex', foreman_models: { foreman: 'codex', models: CODEX } })]);
  await openSettings(q);
  changeTo(q, 'watch_agent', 'claude');
  assert.deepEqual(Object.keys(optionText(q, 'watch_model')), ['', 'fable', 'opus', 'sonnet', 'haiku']);
});

test('0348: the brief names foreman_model and the commands that list its models', () => {
  const brief = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'docs', 'brief.md'), 'utf8');
  for (const name of ['`foreman_model`', '`codex debug models`', '`agent models`']) assert.ok(brief.includes(name), name);
});
