import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, headOf, gitEnv } from './support/panel.mjs';
import { settingsPage, openSettings, controlOf, changeTo, posted, refusedLine } from './support/settings.mjs';
import { panelSaveSettings, CLAUDE_MODELS } from '../scripts/settings.mjs';
import { machineConfig } from '../scripts/machine.mjs';

// ---------- 0748: swap the builder's agent with the reviewer's in Settings ----------

Object.assign(process.env, gitEnv); // panelSaveSettings commits in this process

const cfgOf = r => path.join(r.dir, 'speck', 'config.yml');
const setCfg = (r, re, line) => {
  fs.writeFileSync(cfgOf(r), fs.readFileSync(cfgOf(r), 'utf8').replace(re, line));
  r.g('commit', '-qam', 'config');
};
const snapshot = r => ({ text: fs.readFileSync(cfgOf(r), 'utf8'), head: headOf(r), status: r.g('status', '--porcelain'), mine: machineConfig(r.dir) });
const M = (key, value) => ({ key, value, machine: true });

test('0748 AC1: a builder of the reviewer\'s family is refused with the swap that fixes it, and the swap saves both at once', () => {
  const r = panelRepo(); // builder claude, reviewer codex
  setCfg(r, /^builder_model: .*$/m, 'builder_model: opus');
  setCfg(r, /^reviewer_model: .*$/m, 'reviewer_model: gpt-6.1-sol');
  const was = snapshot(r);
  let out = panelSaveSettings(r.dir, [M('builder', 'codex'), M('builder_model', 'gpt-6.1-sol')]);
  assert.equal(out.status, 422, JSON.stringify(out.body));
  assert.match(out.body.refused.builder, /same model family|both "codex"/, 'says why, as today');
  assert.deepEqual(out.body.swap, { reviewer: 'claude', reviewer_model: 'opus' }, 'the builder\'s old agent and model');
  assert.deepEqual(snapshot(r), was, 'nothing saved');

  out = panelSaveSettings(r.dir, [M('builder', 'codex'), M('builder_model', 'gpt-6.1-sol'), M('reviewer', 'claude'), M('reviewer_model', 'opus')]);
  assert.equal(out.status, 200, JSON.stringify(out.body));
  const mine = machineConfig(r.dir);
  assert.deepEqual([mine.builder, mine.builder_model, mine.reviewer, mine.reviewer_model], ['codex', 'gpt-6.1-sol', 'claude', 'opus']);
});

test('0748 AC2: a reviewer of the builder\'s family is refused with the swap the other way round, a subagent reviewer becoming a Claude Code builder', () => {
  const r = panelRepo();
  let out = panelSaveSettings(r.dir, [M('reviewer', 'claude'), M('reviewer_model', '')]);
  assert.equal(out.status, 422, JSON.stringify(out.body));
  assert.deepEqual(out.body.swap, { builder: 'codex', builder_model: '' });
  out = panelSaveSettings(r.dir, [M('reviewer', 'claude'), M('reviewer_model', ''), M('builder', 'codex'), M('builder_model', '')]);
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.equal(machineConfig(r.dir).builder, 'codex');
  assert.equal(machineConfig(r.dir).reviewer, 'claude');

  // Builder codex, reviewer claude-subagent: picking reviewer codex swaps in a claude builder.
  const s = panelRepo();
  setCfg(s, /^builder: .*$/m, 'builder: codex');
  setCfg(s, /^build_command: .*$/m, 'build_command: ""');
  setCfg(s, /^reviewer: .*$/m, 'reviewer: claude-subagent');
  out = panelSaveSettings(s.dir, [M('reviewer', 'codex'), M('reviewer_model', '')]);
  assert.equal(out.status, 422, JSON.stringify(out.body));
  assert.deepEqual(out.body.swap, { builder: 'claude', builder_model: '' });
});

test('0748 AC3: a clash a swap doesn\'t fix is refused as today, saying why, with no swap', () => {
  const r = panelRepo();
  setCfg(r, /^reviewer: .*$/m, 'reviewer: claude-subagent');
  setCfg(r, /^allow_same_model_review: .*$/m, 'allow_same_model_review: true');
  // Turning same-model review off with one agent in both roles: nothing to swap.
  let out = panelSaveSettings(r.dir, [M('allow_same_model_review', 'false')]);
  assert.equal(out.status, 422, JSON.stringify(out.body));
  assert.match(out.body.error, /same model family/);
  assert.equal(out.body.swap, undefined);

  // A reviewer picked within the family it already is: a swap would leave both in it.
  const s = panelRepo();
  setCfg(s, /^builder_model: .*$/m, 'builder_model: opus');
  setCfg(s, /^reviewer: .*$/m, 'reviewer: claude');
  setCfg(s, /^reviewer_model: .*$/m, 'reviewer_model: sonnet');
  out = panelSaveSettings(s.dir, [M('reviewer', 'claude-subagent'), M('reviewer_model', 'opus')]);
  assert.equal(out.status, 422, JSON.stringify(out.body));
  assert.match(out.body.error, /both would run "opus"/);
  assert.equal(out.body.swap, undefined);

  // Both roles changed at once: no swap offered.
  const t = panelRepo();
  out = panelSaveSettings(t.dir, [M('builder', 'codex'), M('reviewer', 'codex')]);
  assert.equal(out.status, 422, JSON.stringify(out.body));
  assert.equal(out.body.swap, undefined);
});

// ---------- the page ----------

const CODEX = [{ slug: 'gpt-6.1-sol', display_name: 'GPT-6.1 Sol', efforts: ['low', 'high'] }];
const YOUR_MODELS = [
  { id: 'claude', name: 'Claude Code', efforts: true, models: CLAUDE_MODELS.map(m => ({ ...m })) },
  { id: 'codex', name: 'Codex', efforts: true, models: CODEX }];
const YOURS = { list: true, agents: [
  { id: 'claude', name: 'Claude Code', kind: 'agent', yours: true, ready: true, roles: [] },
  { id: 'codex', name: 'Codex', kind: 'agent', yours: true, ready: true, roles: [] }] };
const S = (key, value, o = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, for_machine: true, from: 'repo', repo_value: value, ...o });
const view = ({ builder = 'claude', reviewer = 'codex', builder_model = '', reviewer_model = '' } = {}) => ({ groups: [
  { title: 'Building and reviewing', settings: [
    S('builder', builder, { choices: ['claude', 'codex'], build_command: { value: '', own: { claude: '', codex: '' }, each_ticket: true } }),
    S('builder_model', builder_model), S('reviewer', reviewer, { choices: ['codex', 'claude', 'claude-subagent'] }), S('reviewer_model', reviewer_model)] }],
  builder_models: { builder, models: [] }, reviewer_models: { reviewer, models: [] }, foreman_models: { foreman: builder, models: [] },
  claude_models: CLAUDE_MODELS, providers: [], your_agents: YOURS, agent_models: YOUR_MODELS });
const asked = url => Object.fromEntries(new URLSearchParams(url.split('?')[1] || ''));
const saves = p => posted(p).filter(u => u.startsWith('/api/settings/save')).map(asked);
const CLASH = swap => ({ status: 422, body: { error: 'builder "codex" and reviewer "codex" are the same model family.', refused: { builder: 'builder "codex" and reviewer "codex" are the same model family.' }, swap } });
function page(views, answers, yes) {
  const asks = [];
  const p = settingsPage(views, answers, { confirm: m => { asks.push(String(m)); return yes; } });
  p.asks = asks;
  return p;
}
const opened = async p => { await p.settle(); await openSettings(p); return p; };

test('0748 AC1: picking a builder of the reviewer\'s family asks to swap the reviewer, and on yes saves both at once', async () => {
  const p = await opened(page([view({ builder_model: 'opus', reviewer_model: 'gpt-6.1-sol' }), view({ builder: 'codex', builder_model: 'gpt-6.1-sol', reviewer: 'claude', reviewer_model: 'opus' })],
    [CLASH({ reviewer: 'claude', reviewer_model: 'opus' }), { ok: true, changed: ['builder'] }], true));
  changeTo(p, 'builder', 'codex|gpt-6.1-sol');
  await p.settle();
  assert.equal(p.asks.length, 1, JSON.stringify(p.asks));
  assert.match(p.asks[0], /reviewer/);
  assert.match(p.asks[0], /Claude Code · Opus/, 'names the reviewer it would become');
  assert.deepEqual(saves(p), [
    { 'machine:builder': 'codex', 'machine:builder_model': 'gpt-6.1-sol' },
    { 'machine:builder': 'codex', 'machine:builder_model': 'gpt-6.1-sol', 'machine:reviewer': 'claude', 'machine:reviewer_model': 'opus' }]);
  assert.equal(refusedLine(p, 'builder'), undefined, 'no refusal left showing');
});

test('0748 AC1: saying no to the swap saves nothing and puts the builder back', async () => {
  const p = await opened(page([view()], [CLASH({ reviewer: 'claude', reviewer_model: '' })], false));
  changeTo(p, 'builder', 'codex|');
  await p.settle();
  assert.equal(p.asks.length, 1);
  assert.equal(saves(p).length, 1, 'only the refused one: nothing more is sent');
  assert.equal(controlOf(p, 'builder').value, 'claude|', 'back as saved');
  assert.equal(refusedLine(p, 'builder'), undefined);
});

test('0748 AC2: picking a reviewer of the builder\'s family asks to swap the builder, and on yes saves both', async () => {
  const p = await opened(page([view(), view({ builder: 'codex', reviewer: 'claude' })],
    [CLASH({ builder: 'codex', builder_model: '' }), { ok: true, changed: ['reviewer'] }], true));
  changeTo(p, 'reviewer', 'claude|');
  await p.settle();
  assert.equal(p.asks.length, 1);
  assert.match(p.asks[0], /builder/);
  const sent = saves(p);
  assert.equal(sent.length, 2);
  assert.equal(sent[1]['machine:reviewer'], 'claude');
  assert.equal(sent[1]['machine:builder'], 'codex');
});

test('0748 AC3: a refusal with no swap is shown as today, without asking', async () => {
  const p = await opened(page([view()], [CLASH(undefined)], true));
  changeTo(p, 'builder', 'codex|');
  await p.settle();
  assert.deepEqual(p.asks, []);
  assert.equal(saves(p).length, 1);
  assert.equal(controlOf(p, 'builder').value, 'claude|');
  assert.match(refusedLine(p, 'builder').textContent, /same model family/);
});

test('0748 AC3: a swap the page can\'t offer, such as one naming no agent, leaves the refusal shown as it came', async () => {
  const p = await opened(page([view()], [CLASH({ reviewer: 42 })], true));
  changeTo(p, 'builder', 'codex|');
  await p.settle();
  assert.deepEqual(p.asks, []);
  assert.match(refusedLine(p, 'builder').textContent, /same model family/);
});
