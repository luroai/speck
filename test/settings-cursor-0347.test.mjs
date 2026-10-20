import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fakeAgents, READY } from './support/agents.mjs';
import { panelRepo } from './support/panel.mjs';
import { settingsPage, openSettings, rowOf, controlOf, changeTo } from './support/settings.mjs';
import { panelSettings, reviewerModels } from '../scripts/settings.mjs';

// ---------- 0347: offer Cursor as a reviewer in the Settings view ----------

async function onlyOnPathAsync(dir, fn) {
  const was = process.env.PATH;
  process.env.PATH = dir;
  try { return await fn(); } finally { process.env.PATH = was; }
}
const withReviewer = (r, reviewer) => {
  const cfg = path.join(r.dir, 'speck', 'config.yml');
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^reviewer: .*$/m, `reviewer: ${reviewer}`));
};
const reviewerRow = s => s.groups.flatMap(g => g.settings).find(x => x.key === 'reviewer');
const FOUND = cursor => ({ agents: [
  { id: 'claude', name: 'Claude Code', installed: true, signed_in: true },
  { id: 'codex', name: 'Codex', installed: true, signed_in: true },
  { id: 'cursor', name: 'Cursor', installed: cursor, signed_in: cursor, ...(cursor ? {} : { why: 'Cursor isn\'t installed.' }) },
] });

const KEYS = ['reviewer', 'reviewer_model', 'reviewer_effort'];
const EFFORTS = ['', 'low', 'medium', 'high', 'xhigh', 'max'];
const view = (reviewer, reviewer_models) => ({ groups: [{ title: 'Building and reviewing', settings: KEYS.map(key => ({
  key, value: key === 'reviewer' ? reviewer : '', default: false, explain: `What ${key} does.`, editable: true,
  ...(key === 'reviewer' ? { choices: ['codex', 'claude-subagent', 'cursor'] } : key === 'reviewer_effort' ? { choices: EFFORTS } : {}) })) }],
  reviewer_models });
const optionText = (p, key) => Object.fromEntries(p.all(controlOf(p, key)).filter(n => n.tagName === 'option').map(o => [o.value, o.textContent]));
const said = (p, key) => p.all(rowOf(p, key)).filter(n => n.tagName === 'p').map(n => n.textContent);

test('0347 AC1: reviewer offers cursor when Cursor is installed and signed in, and not otherwise', () => {
  const r = panelRepo();
  assert.ok(reviewerRow(panelSettings(r.dir, { agents: FOUND(true) })).choices.includes('cursor'));
  const row = reviewerRow(panelSettings(r.dir, { agents: FOUND(false) }));
  assert.ok(!row.choices.includes('cursor'));
  assert.match(row.missing, /cursor \(Cursor isn't installed\)/);
  // A saved cursor reviewer stays offered.
  withReviewer(r, 'cursor');
  assert.ok(reviewerRow(panelSettings(r.dir, { agents: FOUND(false) })).choices.includes('cursor'));
});

test('0347 AC2: with reviewer cursor saved, reviewer_model lists the models Cursor lists, by display name', async () => {
  const r = panelRepo();
  withReviewer(r, 'cursor');
  let codexAsked = false;
  const models = await onlyOnPathAsync(fakeAgents(READY), () => reviewerModels(r.dir, async () => { codexAsked = true; return { models: [] }; }));
  assert.equal(codexAsked, false);
  assert.deepEqual(models, { reviewer: 'cursor', models: [
    { slug: 'auto', display_name: 'Auto' },
    { slug: 'opus-4.6-thinking', display_name: 'Claude 4.6 Opus (Thinking)' },
    { slug: 'sonnet-4.6', display_name: 'Claude 4.6 Sonnet' },
  ] });
  const p = settingsPage([view('cursor', models)]);
  await openSettings(p);
  assert.equal(controlOf(p, 'reviewer_model').tagName, 'select');
  const text = optionText(p, 'reviewer_model');
  assert.deepEqual(Object.keys(text), ['', 'auto', 'opus-4.6-thinking', 'sonnet-4.6']);
  assert.match(text['opus-4.6-thinking'], /Claude 4\.6 Opus \(Thinking\)/);
  // reviewer_effort is left as it is for a reviewer without a list: speck's own efforts.
  assert.deepEqual(Object.keys(optionText(p, 'reviewer_effort')), EFFORTS);
  changeTo(p, 'reviewer_model', 'sonnet-4.6');
  assert.deepEqual(Object.keys(optionText(p, 'reviewer_effort')), EFFORTS);
});

test('0347 AC3: when Cursor\'s models can\'t be read, reviewer_model is a box to type in, with why in one line', async () => {
  const r = panelRepo();
  withReviewer(r, 'cursor');
  const none = await onlyOnPathAsync(fakeAgents({}), () => reviewerModels(r.dir));
  assert.equal(none.reviewer, 'cursor');
  assert.equal(none.models, undefined);
  assert.match(none.why, /Cursor isn't installed/);
  assert.doesNotMatch(none.why, /\n/);
  const p = settingsPage([view('cursor', none)]);
  await openSettings(p);
  assert.equal(controlOf(p, 'reviewer_model').tagName, 'input');
  assert.equal(said(p, 'reviewer_model').filter(t => /Cursor isn't installed/.test(t)).length, 1);
});

test('0347 AC4: choosing cursor while another reviewer is saved says to save it, then open Settings again', async () => {
  const p = settingsPage([view('codex', { reviewer: 'codex', models: [{ slug: 'gpt-new', efforts: ['low'] }] })]);
  await openSettings(p);
  changeTo(p, 'reviewer', 'cursor');
  assert.equal(controlOf(p, 'reviewer_model').tagName, 'input');
  assert.ok(said(p, 'reviewer_model').some(t => /^Save cursor as the reviewer, then open Settings again to pick from its models\.$/.test(t)), said(p, 'reviewer_model').join(' | '));
});

test('0347: the brief says reviewer cursor lists the models agent models lists', () => {
  const brief = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'docs', 'brief.md'), 'utf8');
  assert.match(brief, /`reviewer: cursor`[^.]*`agent models`/);
});
