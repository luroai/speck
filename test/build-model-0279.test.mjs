import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, runRepo, startRun, until, stopRun, env } from './support/run.mjs';
import { panelRepo } from './support/panel.mjs';
import { speck } from './support/cli.mjs';
import { settingsPage, openSettings, controlOf, saveButton, changeTo, posted } from './support/settings.mjs';
import { parseYaml, loadConfig } from '../scripts/core.mjs';
import { withBuilderModel, builderModelNote } from '../scripts/build-model.mjs';
import { resumeArgv } from '../scripts/hand-back.mjs';
import { panelSettings, builderModels, CLAUDE_MODELS, EDITABLE } from '../scripts/settings.mjs';

// ---------- 0279: choose the model that builds tickets ----------

const COMMAND = ['claude', '-p', '/speck-build {id}', '--session-id', '{session}', '--output-format', 'stream-json'];

test('0279 AC1: builder_model is in the config template, blank, with a comment, and speck config set accepts it', () => {
  const text = fs.readFileSync(path.join(ROOT, 'templates', 'config.yml'), 'utf8');
  const line = text.split('\n').find(l => l.startsWith('builder_model:'));
  assert.ok(line, 'in the template');
  assert.match(line, /#\s*\S/, 'with a comment');
  assert.equal(parseYaml(text).builder_model, '');
  const r = panelRepo(), cfg = path.join(r.dir, 'speck', 'config.yml');
  const out = speck(r.dir, env, 'config', 'set', 'builder_model', 'opus');
  assert.equal(out.status, 0, out.stderr);
  assert.equal(loadConfig(r.dir).builder_model, 'opus');
  assert.equal(speck(r.dir, env, 'config', 'set', 'builder_model', '').status, 0);
  assert.equal(parseYaml(fs.readFileSync(cfg, 'utf8')).builder_model, '');
});

test('0279 AC1, AC2: blank, missing or spaces leaves the command exactly as it is', () => {
  for (const cfg of [{ builder: 'claude' }, { builder: 'claude', builder_model: '' }, { builder: 'claude', builder_model: '  ' }, { builder: 'claude', builder_model: null }])
    assert.equal(withBuilderModel(COMMAND, cfg), COMMAND, JSON.stringify(cfg));
});

test('0279 AC2: with builder claude, the command passes builder_model as --model, replacing one it has', () => {
  assert.deepEqual(withBuilderModel(COMMAND, { builder: 'claude', builder_model: 'opus' }), [...COMMAND, '--model', 'opus']);
  assert.deepEqual(withBuilderModel([...COMMAND, '--model', 'haiku'], { builder: 'claude', builder_model: 'claude-opus-5-5' }), [...COMMAND, '--model', 'claude-opus-5-5']);
  assert.deepEqual(withBuilderModel(COMMAND, { builder: 'claude', builder_model: 5 }), [...COMMAND, '--model', '5'], 'a number YAML reads as one');
  assert.deepEqual(withBuilderModel(['claude', '--model=haiku', ...COMMAND.slice(1)], { builder: 'claude', builder_model: 'sonnet' }), [...COMMAND, '--model', 'sonnet']);
});

test('0279 AC2: a resumed or handed-back build runs on builder_model too', () => {
  const words = withBuilderModel(COMMAND, { builder: 'claude', builder_model: 'fable' });
  for (const message of [undefined, 'handed back']) {
    const argv = resumeArgv(words, '0007', 's-1', message);
    assert.ok(argv.includes('--resume'), JSON.stringify(argv));
    assert.deepEqual(argv.slice(-2), ['--model', 'fable']);
  }
});

// speck run in a repo whose builder and builder_model are as given, stopped once its fake builder has started:
// what the fake was given, and what speck run said.
async function runWith(builder, model) {
  const r = runRepo();
  const text = fs.readFileSync(r.cfgFile, 'utf8').replace(/^builder:.*$/m, `builder: ${builder}`).replace(/^builder_model:.*$/m, `builder_model: "${model}"`);
  fs.writeFileSync(r.cfgFile, text);
  const run = startRun(r.dir);
  try { await until(() => r.calls().length >= 1 || run.child.exitCode !== null, 10000); } finally { await stopRun(run); }
  assert.equal(r.calls().length, 1, run.out());
  return { args: r.calls()[0].args, said: run.out() };
}

test('0279 AC2: a build speck run starts with builder claude and builder_model set runs with --model', async () => {
  const { args } = await runWith('claude', 'sonnet');
  assert.deepEqual(args.slice(-2), ['--model', 'sonnet']);
  const blank = await runWith('claude', '');
  assert.ok(!blank.args.includes('--model'), JSON.stringify(blank.args));
});

test('0279 AC5: with another builder, speck run says in one line that builder_model is only for Claude Code, and builds as today', async () => {
  assert.equal(builderModelNote({ builder: 'claude', builder_model: 'opus' }), null);
  assert.equal(builderModelNote({ builder: 'codex', builder_model: '' }), null);
  assert.match(builderModelNote({ builder: 'codex', builder_model: 'gpt-6.1-sol' }), /^builder_model .*only passed to Claude Code builds/);
  assert.equal(withBuilderModel(COMMAND, { builder: 'codex', builder_model: 'gpt-6.1-sol' }), COMMAND);
  const { args, said } = await runWith('codex', 'gpt-6.1-sol');
  assert.ok(!args.includes('--model') && !args.includes('gpt-6.1-sol'), JSON.stringify(args));
  const lines = said.split('\n').filter(l => /builder_model/.test(l));
  assert.equal(lines.length, 1, said);
  assert.match(lines[0], /only passed to Claude Code builds/);
});

// ---------- the Settings view ----------

test('0279 AC3: the server lists builder_model under builder, editable, and the builder\'s models', async () => {
  const r = panelRepo(), cfg = path.join(r.dir, 'speck', 'config.yml');
  assert.ok(EDITABLE.includes('builder_model'));
  const group = panelSettings(r.dir).groups.find(g => g.title === 'Building and reviewing');
  const keys = group.settings.map(s => s.key);
  assert.equal(keys.indexOf('builder_model'), keys.indexOf('builder') + 1);
  const s = group.settings.find(x => x.key === 'builder_model');
  assert.equal(s.editable, true);
  assert.ok(s.explain.length > 20);

  let asked = 0;
  const read = async () => { asked++; return { models: [{ slug: 'gpt-big', efforts: ['low'] }] }; };
  const claude = await builderModels(r.dir, read);
  assert.deepEqual(claude.models.map(m => m.slug), ['fable', 'opus', 'sonnet', 'haiku']);
  assert.equal(asked, 0);
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^builder: .*$/m, 'builder: codex'));
  const codex = await builderModels(r.dir, read);
  assert.deepEqual(codex.models.map(m => m.slug), ['gpt-big']);
  assert.equal(asked, 1);
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^builder: .*$/m, 'builder: gemini'));
  const other = await builderModels(r.dir, read);
  assert.equal(other.models, undefined);
  assert.match(other.why, /^gemini can't list its models/);
  assert.equal(panelSettings(r.dir, { builderModels: codex }).builder_models.builder, 'codex');
});

const KEYS = ['builder', 'builder_model', 'reviewer'];
const view = (values = {}, builder_models) => ({ groups: [{ title: 'Building and reviewing', settings: KEYS.map(key => ({
  key, value: values[key] ?? (key === 'builder' ? 'claude' : key === 'reviewer' ? 'codex' : ''), default: false,
  explain: `What ${key} does.`, editable: key !== 'builder', ...(key === 'reviewer' ? { choices: ['codex', 'claude-subagent'] } : {}) })) }],
  ...(builder_models !== undefined ? { builder_models } : {}), claude_models: CLAUDE_MODELS });
const options = (p, key) => p.all(controlOf(p, key)).filter(n => n.tagName === 'option')
  .map(o => ({ value: o.value, text: o.textContent, disabled: !!o.disabled }));
const offered = (p, key) => options(p, key).filter(o => !o.disabled).map(o => o.value);
const CLAUDE = { builder: 'claude', models: CLAUDE_MODELS };

test('0279 AC3: with builder claude, builder_model offers (default) and Claude\'s models, each the newest of its kind', async () => {
  const p = settingsPage([view({}, CLAUDE)]);
  await openSettings(p);
  assert.equal(controlOf(p, 'builder_model').tagName, 'select');
  assert.deepEqual(offered(p, 'builder_model'), ['', 'fable', 'opus', 'sonnet', 'haiku']);
  const text = Object.fromEntries(options(p, 'builder_model').map(o => [o.value, o.text]));
  assert.equal(text[''], '(default)');
  for (const [slug, name] of [['fable', 'Fable'], ['opus', 'Opus'], ['sonnet', 'Sonnet'], ['haiku', 'Haiku']])
    assert.match(text[slug], new RegExp(`^${slug}\\b.*the newest ${name}`));
  changeTo(p, 'builder_model', 'opus');
  saveButton(p).listeners.click();
  await p.settle();
  assert.deepEqual(posted(p), ['/api/settings/save?repo%3Abuilder_model=opus']);
});

test('0279 AC3: with builder codex it offers Codex\'s models, and with another builder a text box', async () => {
  const p = settingsPage([view({ builder: 'codex' }, { builder: 'codex', models: [{ slug: 'gpt-6.1-sol', efforts: ['low'] }, { slug: 'gpt-small', efforts: [] }] })]);
  await openSettings(p);
  assert.deepEqual(offered(p, 'builder_model'), ['', 'gpt-6.1-sol', 'gpt-small']);
  const q = settingsPage([view({ builder: 'gemini' }, { builder: 'gemini', why: 'gemini can\'t list its models, so type the model\'s name as it names it.' })]);
  await openSettings(q);
  assert.equal(controlOf(q, 'builder_model').tagName, 'input');
  assert.equal(controlOf(q, 'builder_model').type, 'text');
  // Codex couldn't list them: a box too.
  const c = settingsPage([view({ builder: 'codex' }, { builder: 'codex', why: 'Codex isn\'t installed here, so it can\'t list its models: type the model\'s name.' })]);
  await openSettings(c);
  assert.equal(controlOf(c, 'builder_model').tagName, 'input');
});

test('0279 AC4: a saved builder_model that isn\'t in the list still shows, marked, and is left alone', async () => {
  const p = settingsPage([view({ builder_model: 'claude-opus-5-5' }, CLAUDE)]);
  await openSettings(p);
  assert.equal(controlOf(p, 'builder_model').value, 'claude-opus-5-5');
  assert.deepEqual(options(p, 'builder_model')[0], { value: 'claude-opus-5-5', text: 'claude-opus-5-5 (not offered)', disabled: true });
  assert.equal(saveButton(p).disabled, true, 'nothing changes unless you change it');
  changeTo(p, 'reviewer', 'claude-subagent');
  assert.equal(controlOf(p, 'builder_model').value, 'claude-opus-5-5');
  saveButton(p).listeners.click();
  await p.settle();
  assert.deepEqual(posted(p), ['/api/settings/save?repo%3Areviewer=claude-subagent']);
});

test('0279: the brief names builder_model and how Claude Code is given it', () => {
  const brief = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8');
  assert.ok(brief.includes('`builder_model`'));
  assert.ok(brief.includes('`--model <value>`'));
});
