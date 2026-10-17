import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo } from './support/panel.mjs';
import { settingsPage, openSettings, controlOf, saveButton, changeTo, posted } from './support/settings.mjs';
import { panelSettings, reviewerModels, CLAUDE_MODELS } from '../scripts/settings.mjs';

// ---------- 0278: offer Claude's models when Claude reviews ----------

const KEYS = ['reviewer', 'reviewer_model', 'reviewer_effort'];
const EFFORTS = ['', 'low', 'medium', 'high', 'xhigh', 'max'];
const view = (values = {}, reviewer_models) => ({ groups: [{ title: 'Building and reviewing', settings: KEYS.map(key => ({
  key, value: values[key] ?? (key === 'reviewer' ? 'claude-subagent' : ''), default: false, explain: `What ${key} does.`, editable: true,
  ...(key === 'reviewer' ? { choices: ['codex', 'claude-subagent'] } : key === 'reviewer_effort' ? { choices: EFFORTS } : {}) })) }],
  ...(reviewer_models !== undefined ? { reviewer_models } : {}), claude_models: CLAUDE_MODELS });
const options = (p, key) => p.all(controlOf(p, key)).filter(n => n.tagName === 'option')
  .map(o => ({ value: o.value, text: o.textContent, disabled: !!o.disabled }));
const offered = (p, key) => options(p, key).filter(o => !o.disabled).map(o => o.value);
const shown = p => p.all(p.byId('settings')).filter(n => n.tagName === 'p').map(n => n.textContent);
const CLAUDE = { reviewer: 'claude-subagent', models: CLAUDE_MODELS };

test('0278 AC1: the server gives Claude\'s model names for a claude-subagent reviewer, without asking Codex', async () => {
  const r = panelRepo(), cfg = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^reviewer: .*$/m, 'reviewer: claude-subagent'));
  let asked = false;
  const models = await reviewerModels(r.dir, async () => { asked = true; return { models: [] }; });
  assert.equal(asked, false);
  assert.equal(models.reviewer, 'claude-subagent');
  assert.deepEqual(models.models.map(m => m.slug), ['fable', 'opus', 'sonnet', 'haiku']);
  const sent = panelSettings(r.dir, { models });
  assert.deepEqual(sent.reviewer_models.models.map(m => m.slug), ['fable', 'opus', 'sonnet', 'haiku']);
  assert.deepEqual(sent.claude_models.map(m => m.slug), ['fable', 'opus', 'sonnet', 'haiku'], 'also for a reviewer picked in the view');
});

test('0278 AC1: with reviewer claude-subagent, reviewer_model is a list: (default), fable, opus, sonnet, haiku', async () => {
  const p = settingsPage([view({}, CLAUDE)]);
  await openSettings(p);
  assert.equal(controlOf(p, 'reviewer_model').tagName, 'select');
  assert.deepEqual(offered(p, 'reviewer_model'), ['', 'fable', 'opus', 'sonnet', 'haiku']);
  assert.equal(options(p, 'reviewer_model')[0].text, '(default)');
  assert.ok(!shown(p).some(t => /can't list its models/.test(t)), 'no line saying there is no list');
  changeTo(p, 'reviewer_model', 'opus');
  saveButton(p).listeners.click();
  await p.settle();
  assert.deepEqual(posted(p), ['/api/settings/save?repo%3Areviewer_model=opus']);

  // Picked in the view while the saved reviewer is codex, and Codex couldn't list its models.
  const q = settingsPage([view({ reviewer: 'codex' }, { reviewer: 'codex', why: 'Codex isn\'t installed here, so it can\'t list its models: type the model\'s name.' })]);
  await openSettings(q);
  assert.equal(controlOf(q, 'reviewer_model').tagName, 'input');
  changeTo(q, 'reviewer', 'claude-subagent');
  assert.equal(controlOf(q, 'reviewer_model').tagName, 'select');
  assert.deepEqual(offered(q, 'reviewer_model'), ['', 'fable', 'opus', 'sonnet', 'haiku']);
  assert.ok(!shown(q).some(t => /can't list its models/.test(t)));
});

test('0278 AC2: each name says it means the newest model of that kind', async () => {
  const p = settingsPage([view({}, CLAUDE)]);
  await openSettings(p);
  const text = Object.fromEntries(options(p, 'reviewer_model').map(o => [o.value, o.text]));
  assert.match(text.fable, /^fable\b.*the newest Fable/);
  assert.match(text.opus, /^opus\b.*the newest Opus/);
  assert.match(text.sonnet, /^sonnet\b.*the newest Sonnet/);
  assert.match(text.haiku, /^haiku\b.*the newest Haiku/);
});

test('0278 AC3: a saved model not in the list still shows, marked, and is left alone', async () => {
  const p = settingsPage([view({ reviewer_model: 'claude-opus-5-5' }, CLAUDE)]);
  await openSettings(p);
  assert.equal(controlOf(p, 'reviewer_model').value, 'claude-opus-5-5');
  assert.deepEqual(options(p, 'reviewer_model')[0], { value: 'claude-opus-5-5', text: 'claude-opus-5-5 (not offered)', disabled: true });
  assert.equal(saveButton(p).disabled, true, 'nothing changes unless you change it');
  changeTo(p, 'reviewer_effort', 'high');
  assert.equal(controlOf(p, 'reviewer_model').value, 'claude-opus-5-5');
  saveButton(p).listeners.click();
  await p.settle();
  assert.deepEqual(posted(p), ['/api/settings/save?repo%3Areviewer_effort=high']);
});

test('0278 AC4: reviewer_effort for claude-subagent offers low to max, whichever model is picked', async () => {
  const p = settingsPage([view({}, CLAUDE)]);
  await openSettings(p);
  assert.deepEqual(offered(p, 'reviewer_effort'), EFFORTS);
  changeTo(p, 'reviewer_model', 'haiku');
  assert.deepEqual(offered(p, 'reviewer_effort'), EFFORTS);
  // Picked in the view after Codex's list.
  const q = settingsPage([view({ reviewer: 'codex' }, { reviewer: 'codex', models: [{ slug: 'gpt-small', efforts: ['low', 'ultra'] }] })]);
  await openSettings(q);
  changeTo(q, 'reviewer', 'claude-subagent');
  assert.deepEqual(offered(q, 'reviewer_effort'), EFFORTS);
});

test('0278: the brief names Claude\'s model names for a claude-subagent reviewer', () => {
  const brief = fs.readFileSync(path.join(import.meta.dirname, '..', 'docs', 'brief.md'), 'utf8');
  for (const name of ['fable', 'opus', 'sonnet', 'haiku']) assert.ok(brief.includes(`\`${name}\``), name);
});
