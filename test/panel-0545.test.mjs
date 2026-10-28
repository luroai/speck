import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { T, round, boardPage, queueRows, openQueueRows, panelRepo } from './support/panel.mjs';
import { ticketBuilderModel, DEFAULT_BUILD_COMMAND } from '../scripts/build-model.mjs';
import { PROVIDERS } from '../scripts/providers.mjs';
import { checkedProvider, saveCustomProvider } from '../scripts/custom-providers.mjs';
import { statusData } from '../scripts/speck.mjs';

// ---------- 0545: an open Build ticket's Builder cell names the model its builds run on ----------

const NOW = Date.now();
const ago = s => new Date(NOW - s * 1000).toISOString();
const ACME = checkedProvider({ label: 'Acme', address: 'https://api.acme.test/anthropic', type: 'anthropic', models: 'acme-big acme-small' });
const providers = [...PROVIDERS, ACME];
const model = (fm, cfg) => ticketBuilderModel(fm, cfg, providers);

const page = tickets => boardPage([{ run: { on: true }, ideas: [], tickets }]);
const idOf = (p, n) => p.all(n).find(x => x.className === 'id')?._text;
const card = (p, id) => queueRows(p).find(n => idOf(p, n) === id);
const cellOf = (p, id) => {
  const f = card(p, id).children[0].children.find(n => n.className === 'facts');
  const c = f.children[1];
  return [c.children[0].textContent, c.children[1].textContent, c.children[1].title];
};

test('0545 AC1: a known model is builder_model, or the one speck uses from a model provider', () => {
  assert.equal(model({}, { builder: 'claude', builder_model: 'opus', build_command: DEFAULT_BUILD_COMMAND }), 'opus');
  assert.equal(model({}, { builder: 'claude', builder_model: 'opus', build_command: 'my-own claude' }), 'opus', 'Claude Code is given it with any build_command');
  assert.equal(model({}, { builder: 'codex', builder_model: 'gpt-6.1-sol', build_command: '' }), 'gpt-6.1-sol');
  assert.equal(model({}, { builder: 'cursor', builder_model: 'sonnet-5', build_command: '' }), 'sonnet-5');
  assert.equal(model({}, { builder: 'deepseek', builder_model: '', build_command: '' }), 'deepseek-v4-pro', 'speck\'s own provider: its default');
  assert.equal(model({}, { builder: 'deepseek', builder_model: 'deepseek-v4-flash', build_command: '' }), 'deepseek-v4-flash');
  assert.equal(model({}, { builder: 'acme', builder_model: '', build_command: '' }), 'acme-big', 'a provider you added: its first model');
  assert.equal(model({ builder: 'acme' }, { builder: 'claude', builder_model: 'opus', build_command: '' }), 'acme-big', 'a ticket\'s own provider, without the settings\' builder_model');
  assert.equal(model({ builder: 'claude' }, { builder: 'claude', builder_model: 5 }), '5', 'a number as YAML reads it');
});

test('0545 AC1: the Builder cell shows the agent\'s name and its model', async () => {
  const p = page([
    T('0951', 'building', { started: ago(65), build_running: true, builder: 'claude', builder_model: 'opus' }),
    T('0952', 'reviewing', { started: ago(65), build_running: true, self_check: 'no changes', rounds: [{ ...round(1, 10), verdict: 'request_changes' }], review_running: null, builder: 'codex', builder_model: 'gpt-6.1-sol' }),
    T('0953', 'building', { started: ago(65), build_running: true, builder: 'acme', builder_label: 'Acme', builder_model: 'acme-big' }),
  ]);
  await p.settle();
  await openQueueRows(p);
  assert.deepEqual(cellOf(p, '0951'), ['Builder', 'Claude · opus', 'Claude · opus']);
  assert.deepEqual(cellOf(p, '0952'), ['Builder', 'Codex · gpt-6.1-sol', 'Codex · gpt-6.1-sol']);
  assert.deepEqual(cellOf(p, '0953'), ['Builder', 'Acme · acme-big', 'Acme · acme-big']);
});

test('0545 AC2: with no model known, the Builder cell shows only the agent\'s name', async () => {
  assert.equal(model({}, { builder: 'claude', builder_model: '' }), null);
  assert.equal(model({}, { builder: 'claude' }), null, 'missing');
  assert.equal(model({}, { builder: 'claude', builder_model: '   ' }), null, 'only spaces');
  assert.equal(model({ builder: 'codex' }, { builder: 'claude', builder_model: 'opus', build_command: '' }), null, 'another builder\'s builder_model isn\'t given to it');
  assert.equal(model({ builder: 'claude' }, { builder: 'codex', builder_model: 'gpt-6.1-sol', build_command: '' }), null);
  assert.equal(model({}, { builder: 'codex', builder_model: 'gpt-6.1-sol', build_command: 'my-own codex' }), null, 'a build_command of your own isn\'t given it');
  assert.equal(model({}, { builder: 'cursor', builder_model: '', build_command: '' }), null, 'Cursor picks its own');
  assert.equal(model({}, { builder: 'deepseek', build_command: 'my-own' }), null, 'a provider isn\'t built with a build_command of your own');
  assert.equal(model({}, { builder: 'constructor', builder_model: 'x', build_command: '' }), null, 'a name that\'s no agent');
  const p = page([
    T('0961', 'building', { started: ago(65), build_running: true, builder: 'claude', builder_model: null }),
    T('0962', 'building', { started: ago(65), build_running: true, builder: 'cursor' }),
    T('0963', 'building', { started: ago(65), build_running: true, builder: 'claude', builder_model: '  ' }),
  ]);
  await p.settle();
  await openQueueRows(p);
  assert.deepEqual(cellOf(p, '0961').slice(0, 2), ['Builder', 'Claude']);
  assert.deepEqual(cellOf(p, '0962').slice(0, 2), ['Builder', 'Cursor']);
  assert.deepEqual(cellOf(p, '0963').slice(0, 2), ['Builder', 'Claude']);
});

test('0545 AC3: speck status --json gives each ticket\'s builder_model, or null', () => {
  const r = panelRepo();
  const cfgFile = path.join(r.dir, 'speck', 'config.yml');
  const base = fs.readFileSync(cfgFile, 'utf8').replace(/^builder:.*$/m, 'builder: claude').replace(/^builder_model:.*$/m, '');
  const board = text => { fs.writeFileSync(cfgFile, text); return statusData(r.dir).tickets.find(t => t.id === '0001'); };
  assert.equal(board(`${base}builder_model: opus\n`).builder_model, 'opus');
  assert.equal(board(`${base}builder_model: ""\n`).builder_model, null);
  saveCustomProvider(r.dir, ACME);
  const text = base.replace(/^builder: claude$/m, 'builder: acme').replace(/^build_command:.*$/m, 'build_command: ""');
  const t = board(`${text}builder_model: ""\n`);
  assert.equal(t.builder, 'acme');
  assert.equal(t.builder_model, 'acme-big');
  const out = r.run('status', '--json');
  assert.equal(out.status, 0, out.stderr);
  assert.equal(JSON.parse(out.stdout).tickets.find(x => x.id === '0001').builder_model, 'acme-big');
});

test('0545 AC4: the Reviewer cell, and the cell while a round runs, are unchanged', async () => {
  const p = page([
    T('0971', 'reviewing', { started: ago(65), build_running: true, self_check: 'no changes', review_running: 1, reviewer: 'codex', review_model: 'gpt-6.1-sol', builder: 'claude', builder_model: 'opus' }),
    T('0972', 'reviewing', { started: ago(65), build_running: true, self_check: 'no changes', review_running: 1, reviewer: 'codex', builder: 'claude', builder_model: 'opus' }),
  ]);
  await p.settle();
  await openQueueRows(p);
  assert.deepEqual(cellOf(p, '0971').slice(0, 2), ['Reviewer', 'gpt-6.1-sol']);
  assert.deepEqual(cellOf(p, '0972').slice(0, 2), ['Reviewer', 'Codex']);
});
