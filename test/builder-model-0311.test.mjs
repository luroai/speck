import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, headOf, gitEnv } from './support/panel.mjs';
import { settingsPage, openSettings, saveButton, changeTo, posted } from './support/settings.mjs';
import { fakeAgents, READY } from './support/agents.mjs';
import { speck } from './support/cli.mjs';
import { panelSaveSettings, panelSaveRequestAsync } from '../scripts/settings.mjs';
import { offeredModels, offeredModelsAsync } from '../scripts/agents.mjs';
import { DEFAULT_BUILD_COMMAND } from '../scripts/build-model.mjs';
import { clearsBuilderModel } from '../scripts/builder-switch.mjs';
import { parseYaml } from '../scripts/core.mjs';
import { ROOT } from './support/speck.mjs';
import { machineConfig, machineConfigFile } from '../scripts/machine.mjs';

// ---------- 0311: clear builder_model when the builder is switched ----------

Object.assign(process.env, gitEnv); // panelSaveSettings commits in this process

const cfgOf = r => path.join(r.dir, 'speck', 'config.yml');
const readCfg = r => parseYaml(fs.readFileSync(cfgOf(r), 'utf8'));
// 0387: the panel saves the builder and its model for this machine, so these are the values speck uses.
const used = r => ({ ...readCfg(r), ...machineConfig(r.dir) });
// Sets speck/config.yml's value, and removes this machine's, so speck uses the file's.
const setCfg = (r, re, line) => {
  fs.writeFileSync(cfgOf(r), fs.readFileSync(cfgOf(r), 'utf8').replace(re, line));
  r.g('commit', '-qam', 'config');
  fs.rmSync(machineConfigFile(r.dir), { force: true });
};
// A Claude Code builder on opus, with a Claude reviewer so that switching to Codex or Cursor isn't refused.
function opusRepo() {
  const r = panelRepo();
  setCfg(r, /^reviewer: .*$/m, 'reviewer: claude');
  setCfg(r, /^builder_model: .*$/m, 'builder_model: opus');
  return r;
}
const CODEX = { builder: 'codex', models: ['gpt-6.1-sol', 'gpt-small'] };
// A stand-in for findAgentsAsync, as speck agents would find `spec`'s agents, counting what it's asked.
const finder = (models, asked = []) => async ({ only } = {}) => { asked.push(only); return { agents: models === undefined ? [] : [{ id: only, models: models.map(name => ({ name })) }] }; };

test('0311 AC1: switching the builder clears a builder_model it doesn\'t offer, in the same save, saying why', () => {
  const r = opusRepo();
  const head = headOf(r);
  const out = panelSaveSettings(r.dir, [{ key: 'builder', value: 'codex' }], { offered: CODEX });
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.equal(used(r).builder, 'codex');
  assert.equal(used(r).builder_model, '');
  assert.ok(out.body.changed.includes('builder_model'), JSON.stringify(out.body));
  assert.match(out.body.cleared.builder_model, /Codex doesn't offer opus/);
  assert.equal(headOf(r), head, '0387: saved for this machine, without a commit');
  assert.equal(r.g('status', '--porcelain'), '');
});

test('0311 AC1: the panel\'s Save reads the new builder\'s models first, only when there is a builder_model to check', async () => {
  const r = opusRepo();
  const asked = [];
  let out = await panelSaveRequestAsync(r.dir, 'repo%3Abuilder=codex', finder(['gpt-6.1-sol'], asked));
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.deepEqual(asked, ['codex']);
  assert.equal(used(r).builder_model, '');
  assert.match(out.body.cleared.builder_model, /Codex doesn't offer opus/);
  // Blank now: nothing to check, so nothing is read and nothing is said.
  out = await panelSaveRequestAsync(r.dir, 'repo%3Abuilder=cursor', finder(['auto'], asked));
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.deepEqual(asked, ['codex']);
  assert.equal(out.body.cleared, undefined);
  // A Save that doesn't switch the builder reads nothing either.
  setCfg(r, /^builder_model: .*$/m, 'builder_model: auto');
  out = await panelSaveRequestAsync(r.dir, 'repo%3Alimits.max_review_rounds=4', finder([], asked));
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.deepEqual(asked, ['codex']);
  assert.equal(used(r).builder_model, 'auto');
});

test('0311 AC1: the view says builder_model was cleared, and why', async () => {
  const S = (key, value, more = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, ...more });
  const view = builder => ({ groups: [{ title: 'Building and reviewing', settings: [
    S('builder', builder, { choices: ['claude', 'codex'], build_command: { value: DEFAULT_BUILD_COMMAND, hand_set: false, own: { claude: DEFAULT_BUILD_COMMAND, codex: '', cursor: '' } } }),
    S('builder_model', builder === 'claude' ? 'opus' : '')] }] });
  const why = 'Codex doesn\'t offer opus, as speck agents lists its models';
  const p = settingsPage([view('claude'), view('codex')], [{ ok: true, changed: ['builder', 'build_command', 'builder_model'], cleared: { builder_model: why } }]);
  await p.settle();
  await openSettings(p);
  changeTo(p, 'builder', 'codex');
  p.press(saveButton(p));
  await p.settle();
  assert.equal(posted(p).length, 1);
  const said = p.all(p.byId('settings')).find(n => n.tagName === 'p' && /builder_model/.test(n.textContent) && /cleared/i.test(n.textContent));
  assert.ok(said, 'says builder_model was cleared');
  assert.ok(said.textContent.includes(why), said.textContent);
});

test('0311 AC2: speck config set builder clears it too, saying in one line that it was cleared and why', () => {
  const r = opusRepo();
  const out = speck(r.dir, { ...process.env, PATH: fakeAgents(READY) }, 'config', 'set', '--repo', 'builder', 'codex');
  assert.equal(out.status, 0, out.stderr);
  assert.equal(readCfg(r).builder, 'codex');
  assert.equal(readCfg(r).builder_model, '');
  const lines = out.stdout.split('\n').filter(l => /builder_model/.test(l));
  assert.equal(lines.length, 1, out.stdout);
  assert.match(lines[0], /opus/);
  assert.match(lines[0], /cleared/);
  assert.match(lines[0], /Codex doesn't offer opus/);
});

test('0311 AC3: a builder_model the new builder offers is kept', async () => {
  const r = opusRepo();
  setCfg(r, /^builder_model: .*$/m, 'builder_model: gpt-small');
  setCfg(r, /^builder: .*$/m, 'builder: cursor');
  setCfg(r, /^build_command: .*$/m, 'build_command: ""');
  let out = panelSaveSettings(r.dir, [{ key: 'builder', value: 'codex' }], { offered: CODEX });
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.equal(used(r).builder, 'codex');
  assert.equal(used(r).builder_model, 'gpt-small');
  assert.equal(out.body.changed.includes('builder_model'), false);
  assert.equal(out.body.cleared, undefined);

  out = await panelSaveRequestAsync(r.dir, 'repo%3Abuilder=cursor', finder(['gpt-small', 'auto']));
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.equal(used(r).builder_model, 'gpt-small');

  // From the command line, with Claude Code's models as speck agents lists them.
  setCfg(r, /^builder_model: .*$/m, 'builder_model: sonnet');
  const cli = speck(r.dir, { ...process.env, PATH: fakeAgents(READY) }, 'config', 'set', '--repo', 'builder', 'claude');
  assert.equal(cli.status, 0, cli.stderr);
  assert.equal(readCfg(r).builder, 'claude');
  assert.equal(readCfg(r).builder_model, 'sonnet');
  assert.doesNotMatch(cli.stdout, /^builder_model:|cleared/m);
});

test('0311 AC4: when the new builder\'s models can\'t be read, builder_model is cleared, since it can\'t be checked', async () => {
  const r = opusRepo();
  let out = panelSaveSettings(r.dir, [{ key: 'builder', value: 'codex' }], { offered: { builder: 'codex', models: null } });
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.equal(used(r).builder_model, '');
  assert.match(out.body.cleared.builder_model, /Codex's models couldn't be read/);
  assert.match(out.body.cleared.builder_model, /can't be checked/);

  // Read by the panel's Save: nothing listed.
  setCfg(r, /^builder_model: .*$/m, 'builder_model: gpt-small');
  out = await panelSaveRequestAsync(r.dir, 'repo%3Abuilder=cursor', finder([]));
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.equal(used(r).builder_model, '');
  assert.match(out.body.cleared.builder_model, /couldn't be read/);

  // From the command line, with Codex not installed.
  setCfg(r, /^builder_model: .*$/m, 'builder_model: auto');
  const cli = speck(r.dir, { ...process.env, PATH: fakeAgents({}) }, 'config', 'set', '--repo', 'builder', 'codex');
  assert.equal(cli.status, 0, cli.stderr);
  assert.equal(readCfg(r).builder_model, '');
  const lines = cli.stdout.split('\n').filter(l => /builder_model/.test(l));
  assert.equal(lines.length, 1, cli.stdout);
  assert.match(lines[0], /couldn't be read/);

  // A builder speck has no agent for can't list its models either.
  setCfg(r, /^builder_model: .*$/m, 'builder_model: big');
  const other = speck(r.dir, { ...process.env, PATH: fakeAgents(READY) }, 'config', 'set', '--repo', 'builder', 'gemini');
  assert.equal(other.status, 0, other.stderr);
  assert.equal(readCfg(r).builder_model, '');
});

test('0311 AC4: offeredModels gives the names speck agents lists, or null when there are none', async () => {
  const was = process.env.PATH;
  try {
    process.env.PATH = fakeAgents(READY);
    assert.deepEqual(offeredModels('codex'), ['gpt-6.1-sol', 'gpt-small']);
    assert.deepEqual(await offeredModelsAsync('codex'), ['gpt-6.1-sol', 'gpt-small']);
    assert.equal(offeredModels('gemini'), null);
    assert.equal(offeredModels('__proto__'), null);
    process.env.PATH = fakeAgents({});
    assert.equal(offeredModels('codex'), null);
    assert.equal(await offeredModelsAsync('cursor'), null);
  } finally { process.env.PATH = was; }
});

test('0311 AC2: the README\'s row for config set builder names builder_model', () => {
  const row = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8').split('\n').find(l => l.includes('`config set builder <name>`') && l.startsWith('|'));
  assert.ok(row, 'the command table has the row');
  assert.match(row, /`builder_model`/);
  assert.match(row, /`speck agents`/);
});

test('0311 AC4: a builder named like a built-in is named as given, and a blank builder_model is never read for', () => {
  assert.equal(clearsBuilderModel('opus', '__proto__', () => null), "__proto__'s models couldn't be read, so builder_model can't be checked");
  assert.equal(clearsBuilderModel('opus', 'constructor', () => ['x']), "constructor doesn't offer opus, as speck agents lists its models");
  for (const blank of ['', '  ', null, undefined]) assert.equal(clearsBuilderModel(blank, 'codex', () => { throw new Error('read'); }), null);
});

test('0311 AC1, AC3, AC4: a builder_model given in the same Save as the builder is checked as it would be saved', async () => {
  const r = opusRepo();
  // Not offered: cleared, and opus as it was isn't kept either.
  let out = panelSaveSettings(r.dir, [{ key: 'builder', value: 'codex' }, { key: 'builder_model', value: 'sonnet' }], { offered: CODEX });
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.equal(used(r).builder, 'codex');
  assert.equal(used(r).builder_model, '');
  assert.match(out.body.cleared.builder_model, /Codex doesn't offer sonnet/);
  // Offered: kept.
  out = await panelSaveRequestAsync(r.dir, 'repo%3Abuilder=cursor&repo%3Abuilder_model=auto', finder(['auto']));
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.equal(used(r).builder, 'cursor');
  assert.equal(used(r).builder_model, 'auto');
  assert.equal(out.body.cleared, undefined);
  // Can't be read: cleared.
  out = await panelSaveRequestAsync(r.dir, 'repo%3Abuilder=codex&repo%3Abuilder_model=gpt-small', finder([]));
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.equal(used(r).builder, 'codex');
  assert.equal(used(r).builder_model, '');
  assert.match(out.body.cleared.builder_model, /couldn't be read/);
  assert.equal(r.g('status', '--porcelain'), '');
});
