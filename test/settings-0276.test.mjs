import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { panelRepo, gitEnv, fm, good } from './support/panel.mjs';
import { settingsPage, openSettings, rowOf, controlOf, saveButton, changeTo, posted } from './support/settings.mjs';
import { parseCodexModels, codexModels, codexModelsAsync, knownEffort, CODEX_MODELS_TIMEOUT_MS } from '../scripts/codex-models.mjs';
import { panelSettings, panelSaveSettings, reviewerModels } from '../scripts/settings.mjs';
import { machineConfig } from '../scripts/machine.mjs';
import { checkConfigValue } from '../scripts/config.mjs';
import { parseTicket, lintTicket } from '../scripts/speck.mjs';

// ---------- 0276: pick the reviewer's model and effort from what it offers ----------

Object.assign(process.env, gitEnv); // panelSaveSettings commits in this process

const level = effort => ({ effort, description: `${effort} reasoning` });
const CATALOGUE = { models: [
  { slug: 'gpt-new', visibility: 'list', supported_reasoning_levels: ['low', 'medium', 'high', 'xhigh', 'max', 'ultra'].map(level) },
  { slug: 'gpt-small', visibility: 'list', supported_reasoning_levels: ['low', 'medium', 'high'].map(level) },
  { slug: 'gpt-secret', visibility: 'hide', supported_reasoning_levels: ['low', 'mega'].map(level) },
] };

// A codex on PATH that prints `out` and exits with `code`, or sleeps first, for the length of `fn`.
async function withCodex({ out = JSON.stringify(CATALOGUE), code = 0, err = '', sleep = 0, none = false } = {}, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-codex-'));
  if (!none) {
    fs.writeFileSync(path.join(dir, 'out.json'), out);
    fs.writeFileSync(path.join(dir, 'codex'), `#!/bin/sh\n${sleep ? `exec sleep ${sleep}\n` : ''}[ "$1 $2" = "debug models" ] || exit 9\ncat "${dir}/out.json"\n${err ? `echo '${err}' >&2\n` : ''}exit ${code}\n`, { mode: 0o755 });
  }
  const was = process.env.PATH;
  process.env.PATH = none ? dir : `${dir}${path.delimiter}${was}`;
  try { return await fn(); } finally { process.env.PATH = was; }
}

const KEYS = ['reviewer', 'reviewer_model', 'reviewer_effort'];
const view = (values = {}, reviewer_models) => ({ groups: [{ title: 'Building and reviewing', settings: KEYS.map(key => ({
  key, value: values[key] ?? (key === 'reviewer' ? 'codex' : ''), default: false, explain: `What ${key} does.`, editable: true,
  ...(key === 'reviewer' ? { choices: ['codex', 'claude-subagent'] } : key === 'reviewer_effort' ? { choices: ['', 'low', 'medium', 'high', 'xhigh', 'max'] } : {}) })) }],
  ...(reviewer_models !== undefined ? { reviewer_models } : {}) });
const LISTED = { reviewer: 'codex', models: [{ slug: 'gpt-new', efforts: ['low', 'medium', 'high', 'xhigh', 'max', 'ultra'] }, { slug: 'gpt-small', efforts: ['low', 'medium', 'high'] }] };
const options = (p, key) => p.all(controlOf(p, key)).filter(n => n.tagName === 'option')
  .map(o => ({ value: o.value, text: o.textContent, disabled: !!o.disabled }));
const offered = (p, key) => options(p, key).filter(o => !o.disabled).map(o => o.value);
const shown = p => p.all(p.byId('settings')).filter(n => n.tagName === 'p').map(n => n.textContent);
const cfgOf = r => path.join(r.dir, 'speck', 'config.yml');

test('0276 AC1: the models Codex lists, read now, without those it hides', async () => {
  assert.deepEqual(parseCodexModels(JSON.stringify(CATALOGUE)).models.map(m => m.slug), ['gpt-new', 'gpt-small']);
  await withCodex({}, async () => {
    assert.deepEqual(codexModels(), { models: LISTED.models });
    assert.deepEqual(await codexModelsAsync(), { models: LISTED.models });
    const r = panelRepo();
    const models = await reviewerModels(r.dir);
    assert.deepEqual(models, LISTED);
    assert.deepEqual(panelSettings(r.dir, { models }).reviewer_models, LISTED, 'sent to the view with the settings');
  });
  // Read each time: a new model shows up as soon as Codex lists it.
  const more = { models: [...CATALOGUE.models, { slug: 'gpt-newer', visibility: 'list', supported_reasoning_levels: [level('low')] }] };
  await withCodex({ out: JSON.stringify(more) }, async () => assert.ok(codexModels().models.some(m => m.slug === 'gpt-newer')));
});

test('0276 AC1: with reviewer codex, reviewer_model is a list of its models and (default)', async () => {
  const p = settingsPage([view({}, LISTED)]);
  await openSettings(p);
  assert.equal(controlOf(p, 'reviewer_model').tagName, 'select');
  assert.deepEqual(options(p, 'reviewer_model').map(o => [o.value, o.text]), [['', '(default)'], ['gpt-new', 'gpt-new'], ['gpt-small', 'gpt-small']]);
  changeTo(p, 'reviewer_model', 'gpt-small');
  saveButton(p).listeners.click();
  await p.settle();
  assert.deepEqual(posted(p), ['/api/settings/save?repo%3Areviewer_model=gpt-small']);
});

test('0276 AC2: reviewer_effort offers the efforts the chosen model supports, and follows a new pick', async () => {
  const p = settingsPage([view({ reviewer_model: 'gpt-small' }, LISTED)]);
  await openSettings(p);
  assert.deepEqual(offered(p, 'reviewer_effort'), ['', 'low', 'medium', 'high']);
  changeTo(p, 'reviewer_model', 'gpt-new');
  assert.deepEqual(offered(p, 'reviewer_effort'), ['', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra']);
  assert.equal(controlOf(p, 'reviewer_model').value, 'gpt-new', 'the pick is kept when the view is drawn again');
  changeTo(p, 'reviewer_effort', 'ultra');
  saveButton(p).listeners.click();
  await p.settle();
  assert.deepEqual(posted(p), ['/api/settings/save?repo%3Areviewer_model=gpt-new&repo%3Areviewer_effort=ultra']);
  // The default model: what any of them supports.
  const d = settingsPage([view({}, LISTED)]);
  await openSettings(d);
  assert.deepEqual(offered(d, 'reviewer_effort'), ['', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra']);
});

test('0276 AC2: speck accepts an effort Codex lists beyond max, in config set, lint and the panel\'s Save', async () => {
  const cfg = { allow_same_model_review: false, limits: { max_acceptance_criteria: 5, max_ticket_body_lines: 40, max_review_rounds: 3, escalate_after_repeat_disputes: 2 } };
  const lint = (effort, c = cfg) => lintTicket(parseTicket(`---\n${fm({ reviewer_effort: effort })}\n---\n${good}`), c).errors.filter(e => /reviewer_effort/.test(e));
  await withCodex({}, async () => {
    assert.equal(checkConfigValue('reviewer_effort', 'ultra'), 'ultra');
    assert.throws(() => checkConfigValue('reviewer_effort', 'mega'), /blank or one of low, medium, high, xhigh, max, or an effort Codex lists/, 'only a hidden model has it');
    assert.throws(() => checkConfigValue('reviewer_effort', 'huge'), /reviewer_effort must be blank or one of/);
    assert.deepEqual(lint('ultra'), []);
    assert.deepEqual(lint('high', { ...cfg, reviewer_effort: 'ultra' }), []);
    assert.equal(lint('huge').length, 1);
    const r = panelRepo();
    const out = panelSaveSettings(r.dir, [{ key: 'reviewer_effort', value: 'ultra' }]);
    assert.equal(out.status, 200, JSON.stringify(out.body));
    assert.equal(machineConfig(r.dir).reviewer_effort, 'ultra', '0387: for this machine');
    assert.equal(panelSaveSettings(r.dir, [{ key: 'reviewer_effort', value: 'huge' }]).status, 422);
  });
  // Codex can't be asked: only speck's own efforts.
  await withCodex({ none: true }, async () => {
    assert.equal(knownEffort('max'), true);
    assert.equal(knownEffort('ultra'), false);
  });
  assert.equal(knownEffort('ul"tra'), false, 'never a word that would break out of its quotes');
});

test('0276 AC3: a saved model or effort the list doesn\'t include still shows, marked not offered, and is left alone', async () => {
  const p = settingsPage([view({ reviewer_model: 'gpt-gone', reviewer_effort: 'ultra' }, { reviewer: 'codex', models: [{ slug: 'gpt-small', efforts: ['low', 'high'] }] })]);
  await openSettings(p);
  const model = controlOf(p, 'reviewer_model'), effort = controlOf(p, 'reviewer_effort');
  assert.equal(model.value, 'gpt-gone');
  assert.deepEqual(options(p, 'reviewer_model')[0], { value: 'gpt-gone', text: 'gpt-gone (not offered)', disabled: true });
  assert.equal(effort.value, 'ultra');
  assert.deepEqual(options(p, 'reviewer_effort')[0], { value: 'ultra', text: 'ultra (not offered)', disabled: true });
  assert.equal(saveButton(p).disabled, true, 'nothing changes unless you change it');
  // Changing only the effort leaves the model as saved.
  changeTo(p, 'reviewer_effort', 'high');
  assert.equal(controlOf(p, 'reviewer_model').value, 'gpt-gone');
  saveButton(p).listeners.click();
  await p.settle();
  assert.deepEqual(posted(p), ['/api/settings/save?repo%3Areviewer_effort=high']);
});

test('0276 AC4: when Codex can\'t list its models, one line says why', async () => {
  const why = async opts => withCodex(opts, async () => {
    const sync = codexModels({ timeoutMs: 300 }), later = await codexModelsAsync({ timeoutMs: 300 });
    assert.equal(sync.models, undefined);
    assert.equal(sync.why, later.why);
    assert.doesNotMatch(sync.why, /\n/);
    return sync.why;
  });
  assert.equal(CODEX_MODELS_TIMEOUT_MS, 10_000);
  assert.match(await why({ none: true }), /isn't installed/);
  assert.match(await why({ code: 1, out: '', err: 'Error: not logged in' }), /couldn't list its models \(Error: not logged in\).*signed in/);
  assert.match(await why({ sleep: 2 }), /took more than 10 seconds/);
  assert.match(await why({ out: 'not json' }), /didn't list its models/);
  assert.match(await why({ out: JSON.stringify({ models: [CATALOGUE.models[2]] }) }), /lists no models/);
  // Any other reviewer isn't asked.
  await withCodex({ none: true }, async () => {
    const r = panelRepo();
    fs.writeFileSync(cfgOf(r), fs.readFileSync(cfgOf(r), 'utf8').replace(/^reviewer: .*$/m, 'reviewer: claude-subagent'));
    let asked = false;
    const out = await reviewerModels(r.dir, async () => { asked = true; return { models: [] }; });
    assert.equal(asked, false);
    assert.equal(out.reviewer, 'claude-subagent');
    assert.deepEqual(out.models.map(m => m.slug), ['fable', 'opus', 'sonnet', 'haiku'], '0278: Claude\'s model names instead');
  });
});

test('0276 AC4: without a list, the view offers a box for the model and the fixed efforts, with the line saying why', async () => {
  const p = settingsPage([view({ reviewer_model: 'gpt-x' }, { reviewer: 'codex', why: 'Codex isn\'t installed here, so it can\'t list its models: type the model\'s name.' })]);
  await openSettings(p);
  assert.equal(controlOf(p, 'reviewer_model').tagName, 'input');
  assert.equal(controlOf(p, 'reviewer_model').value, 'gpt-x');
  assert.deepEqual(offered(p, 'reviewer_effort'), ['', 'low', 'medium', 'high', 'xhigh', 'max']);
  assert.equal(shown(p).filter(t => /can't list its models/.test(t)).length, 1);
  assert.ok(p.all(rowOf(p, 'reviewer_model')).some(n => n.tagName === 'p' && /isn't installed/.test(n.textContent)));

  // Another reviewer chosen in the view: a box, saying why, and the list again once codex is chosen back.
  const q = settingsPage([view({}, LISTED)]);
  await openSettings(q);
  changeTo(q, 'reviewer', 'claude-subagent');
  assert.equal(controlOf(q, 'reviewer_model').tagName, 'input');
  assert.deepEqual(offered(q, 'reviewer_effort'), ['', 'low', 'medium', 'high', 'xhigh', 'max']);
  assert.ok(shown(q).some(t => /^claude-subagent can't list its models/.test(t)));
  changeTo(q, 'reviewer', 'codex');
  assert.equal(controlOf(q, 'reviewer_model').tagName, 'select');
  assert.ok(!shown(q).some(t => /can't list its models/.test(t)));
});

test('0276 AC2: linting many tickets with such an effort asks Codex once, not once a ticket', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-codex-')), count = path.join(dir, 'count');
  fs.writeFileSync(path.join(dir, 'out.json'), JSON.stringify(CATALOGUE));
  fs.writeFileSync(path.join(dir, 'codex'), `#!/bin/sh\necho x >> "${count}"\ncat "${dir}/out.json"\n`, { mode: 0o755 });
  const was = process.env.PATH;
  process.env.PATH = `${dir}${path.delimiter}${was}`;
  try {
    for (let i = 0; i < 20; i++) assert.equal(knownEffort('ultra'), true);
    assert.equal(fs.readFileSync(count, 'utf8').trim().split('\n').length, 1);
  } finally { process.env.PATH = was; }
});

test('0276: the brief and the review skill name the command speck reads and an effort beyond max', () => {
  const read = rel => fs.readFileSync(path.join(import.meta.dirname, '..', rel), 'utf8');
  assert.match(read('docs/brief.md'), /`codex debug models`/);
  assert.match(read('docs/brief.md'), /`ultra`/);
  assert.match(read('skills/speck-review/SKILL.md'), /`ultra`/);
});
