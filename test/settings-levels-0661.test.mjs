// 0661: the team page's build levels, listed on the builder's card and changed, added and removed there.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, gitEnv } from './support/panel.mjs';
import { openSettings, rowOf } from './support/settings.mjs';
import { agentsPage, YOURS_VIEW } from './support/your-agents.mjs';
import { panelSettings, CLAUDE_MODELS } from '../scripts/settings.mjs';
import { panelLevelRequest, setLevelsText } from '../scripts/levels-panel.mjs';
import { loadConfig, parseConfig, ticketAgents } from '../scripts/core.mjs';
import { levelsOf, levelsShown, DEFAULT_LEVELS } from '../scripts/levels.mjs';
import { buildPlan, launchTicket } from '../scripts/ticket-builder.mjs';
import { PROVIDERS } from '../scripts/providers.mjs';

Object.assign(process.env, gitEnv); // panelLevelRequest commits in this process

const AGENT_MODELS = [
  { id: 'claude', name: 'Claude Code', efforts: true, models: CLAUDE_MODELS.map(m => ({ ...m })), default_model: 'sonnet' },
  { id: 'codex', name: 'Codex', efforts: true, models: [{ slug: 'gpt-6.1-sol', display_name: 'GPT-6.1 Sol', description: null, efforts: ['low', 'high'] }], default_model: 'gpt-6.1-sol' }];
const cfgText = dir => fs.readFileSync(path.join(dir, 'speck', 'config.yml'), 'utf8');
const levelsIn = dir => levelsOf(parseConfig(cfgText(dir)));
const commits = r => Number(r.g('rev-list', '--count', 'HEAD'));
const ask = (r, name, action, q = {}) => panelLevelRequest(r.dir, encodeURIComponent(name), action, new URLSearchParams(q).toString());
// A project whose speck/config.yml gives `levels`, a block of YAML under levels:, committed.
function repoWith(levels) {
  const r = panelRepo(), file = path.join(r.dir, 'speck', 'config.yml');
  const text = setLevelsText(cfgText(r.dir), {}).replace(/\nlevels: \{\}\n/, levels === null ? '\n' : `\nlevels:\n${levels}\n`);
  fs.writeFileSync(file, text);
  r.g('commit', '-qam', 'levels');
  return r;
}
// The page as the server draws it for project `dir`, with your agents and their models, Settings open.
async function opened(dir, answers = {}) {
  const view = { ...panelSettings(dir), your_agents: YOURS_VIEW(), agent_models: structuredClone(AGENT_MODELS) };
  const p = agentsPage(view, { 'GET /api/usage': { agents: [] }, ...answers });
  await openSettings(p);
  return p;
}
const has = (n, c) => new RegExp(`\\b${c}\\b`).test(n.className || '');
const builderCard = p => p.all(p.byId('settings')).find(n => has(n, 'member') && n.attrs['data-member'] === 'builder');
const levelRows = p => p.all(builderCard(p)).filter(n => has(n, 'level') && !has(n, 'adding'));
const rowNamed = (p, name) => levelRows(p).find(r => r.attrs['data-level'] === name);
const controlIn = (p, label) => p.all(builderCard(p)).find(n => (n.tagName === 'select' || n.tagName === 'input') && n.attrs['aria-label'] === label);
const buttonIn = (p, text) => p.all(builderCard(p)).find(n => n.tagName === 'button' && n.textContent === text);
const said = p => p.all(builderCard(p)).find(n => has(n, 'said') || (n.tagName === 'p' && has(n, 'bad')))?.textContent;
function pick(p, label, value) {
  const c = controlIn(p, label);
  c.value = value;
  for (const type of ['input', 'change']) if (c.listeners[type]) c.listeners[type]({ target: c });
}
// The words a build of `fm` at speck/config.yml's settings starts with.
const buildWords = (dir, fm) => { const cfg = loadConfig(dir); return buildPlan(cfg, launchTicket({ id: '0001', builder: ticketAgents(fm, cfg).builder }, false, () => fm, cfg), () => true, { providers: PROVIDERS }).words; };
const after = (words, flag) => words[words.lastIndexOf(flag) + 1];

// ---------- AC1 ----------

test('0661 AC1: the builder\'s card lists the project\'s levels in speck/config.yml\'s order, each with its builder, model and effort, or settings', async () => {
  const r = repoWith('  graphics:\n    builder: codex\n    builder_model: gpt-6.1-sol\n  quick:\n    builder_effort: low\n  plain: {}');
  assert.deepEqual(panelSettings(r.dir).levels, { defaults: false, levels: [
    { name: 'graphics', builder: 'codex', builder_model: 'gpt-6.1-sol', builder_effort: '' },
    { name: 'quick', builder: '', builder_model: '', builder_effort: 'low' },
    { name: 'plain', builder: '', builder_model: '', builder_effort: '' }] });
  const p = await opened(r.dir);
  assert.deepEqual(levelRows(p).map(n => n.attrs['data-level']), ['graphics', 'quick', 'plain']);
  // 0666: each with its builder and model in one list, Default for blank, and its effort.
  assert.equal(p.all(rowNamed(p, 'quick')).find(n => has(n, 'name')).textContent, 'Quick', 'named with a capital first letter');
  assert.equal(controlIn(p, 'Graphics level builder').value, 'codex|', 'Codex on its default model, GPT-6.1 Sol');
  assert.equal(controlIn(p, 'Quick level builder').value, '');
  assert.equal(controlIn(p, 'Quick level effort').value, 'low');
  assert.equal(controlIn(p, 'Plain level effort').value, '');
});

// ---------- AC2 ----------

test('0661 AC2: a level\'s builder, model and effort offer the builder\'s own choices, with settings for blank', async () => {
  const r = repoWith('  quick:\n    builder_effort: low');
  const p = await opened(r.dir);
  const options = label => p.all(controlIn(p, label)).filter(n => n.tagName === 'option').map(o => o.value);
  // 0666: the builder's agents and models in one list, as the builder's own row offers them, after Default.
  assert.deepEqual(options('Quick level builder'), ['', ...CLAUDE_MODELS.map(m => (m.slug === 'sonnet' ? 'claude|' : `claude|${m.slug}`)), 'codex|']);
  const own = p.all(rowOf(p, 'builder_effort')).find(n => n.tagName === 'select'); // the builder's own effort, as its list offers it
  assert.deepEqual(options('Quick level effort'), ['', ...p.all(own).filter(n => n.tagName === 'option' && n.value !== '').map(o => o.value)]);
  assert.match(p.all(controlIn(p, 'Quick level builder')).find(n => n.tagName === 'option').textContent, /^Default \(/);
});

test('0661 AC2: a level\'s efforts are those its builder\'s model lists, as the builder\'s own effort offers them', async () => {
  const r = repoWith('  graphics:\n    builder: codex\n    builder_model: gpt-x\n  wide:\n    builder: codex\n  quick:\n    builder_effort: low');
  const models = structuredClone(AGENT_MODELS);
  models[1].models.push({ slug: 'gpt-x', display_name: 'GPT-X', description: null, efforts: ['low', 'ultra'] });
  const view = { ...panelSettings(r.dir), your_agents: YOURS_VIEW(), agent_models: models };
  const p = agentsPage(view, { 'GET /api/usage': { agents: [] } });
  await openSettings(p);
  const options = label => p.all(controlIn(p, label)).filter(n => n.tagName === 'option').map(o => o.value);
  assert.deepEqual(options('Graphics level effort'), ['', 'low', 'ultra'], 'its model\'s, ultra included');
  assert.deepEqual(options('Wide level effort'), ['', 'low', 'high', 'ultra'], 'a blank model: every one its builder\'s models list');
  // The add form follows the builder and model picked there.
  pick(p, 'New level builder', 'codex|gpt-x');
  assert.deepEqual(options('New level effort'), ['', 'low', 'ultra']);
});

test('0661 AC2: changing a level saves it to that level in speck/config.yml, and the next build at that level uses it', async () => {
  const r = repoWith('  quick:\n    builder_effort: low\n  deep:\n    builder_effort: max');
  const was = commits(r), before = cfgText(r.dir);
  const out = ask(r, 'quick', 'set', { builder_model: 'haiku' });
  assert.equal(out.status, 200, JSON.stringify(out.body));
  const rest = text => { const c = parseConfig(text); delete c.levels; return c; };
  assert.deepEqual(rest(cfgText(r.dir)), rest(before), 'every other setting as it was');
  assert.equal(cfgText(r.dir).split('\n').filter(l => l.startsWith('#')).join('\n'), before.split('\n').filter(l => l.startsWith('#')).join('\n'), 'and its comments');
  assert.deepEqual(levelsIn(r.dir), { quick: { builder_effort: 'low', builder_model: 'haiku' }, deep: { builder_effort: 'max' } });
  assert.equal(commits(r), was + 1, 'committed');
  assert.equal(r.g('status', '--porcelain', '--', 'speck/config.yml'), '');
  assert.deepEqual(out.body.levels.map(l => l.name), ['quick', 'deep']);
  const words = buildWords(r.dir, { level: 'quick' });
  assert.equal(after(words, '--model'), 'haiku');
  assert.equal(after(words, '--effort'), 'low');
  // Blank is the settings': the level leaves it out.
  assert.equal(ask(r, 'quick', 'set', { builder_effort: '' }).status, 200);
  assert.deepEqual(levelsIn(r.dir).quick, { builder_model: 'haiku' });
});

test('0661 AC2: a builder or effort the builder\'s settings wouldn\'t offer is refused, and nothing is saved', () => {
  const r = repoWith('  quick:\n    builder_effort: low');
  const before = cfgText(r.dir), was = commits(r);
  for (const q of [{ builder: 'nobody' }, { builder_effort: 'enormous' }, { builder_model: 'a\tb' }]) {
    const out = ask(r, 'quick', 'set', q);
    assert.equal(out.status, 422, JSON.stringify(q));
    assert.ok(out.body.error.length > 10);
  }
  assert.equal(ask(r, 'missing', 'set', { builder_effort: 'low' }).status, 404);
  assert.equal(cfgText(r.dir), before);
  assert.equal(commits(r), was);
});

test('0661 AC2: changing a level on the page sends it and shows the levels the server answers with', async () => {
  const r = repoWith('  quick:\n    builder_effort: low');
  const answer = { ok: true, said: 'Saved the quick level.', defaults: false, levels: [{ name: 'quick', builder: '', builder_model: '', builder_effort: 'high' }] };
  const p = await opened(r.dir, { '/api/levels/quick/set?builder_effort=high': answer });
  pick(p, 'Quick level effort', 'high');
  await p.settle();
  assert.deepEqual(p.posts().map(c => c.url), ['/api/levels/quick/set?builder_effort=high']);
  assert.ok(p.posts()[0].headers['X-Speck-Token'] !== undefined, 'with the page\'s token');
  assert.equal(said(p), 'Saved the quick level.');
  assert.equal(controlIn(p, 'Quick level effort').value, 'high');
});

test('0661 AC2: a level the reviewer would share a model with is refused, as a ticket at it couldn\'t be built', () => {
  const r = repoWith('  quick:\n    builder_effort: low');
  const before = cfgText(r.dir);
  const out = ask(r, 'quick', 'set', { builder: 'codex' }); // the reviewer is codex, on its default model
  assert.equal(out.status, 422);
  assert.match(out.body.error, /^A ticket at the quick level couldn't be built: /);
  assert.equal(cfgText(r.dir), before);
});

test('0661 AC2: saving the values a level already has changes and commits nothing', () => {
  const r = repoWith('  quick:\n    builder_effort: low');
  const before = cfgText(r.dir), was = commits(r);
  const out = ask(r, 'quick', 'set', { builder_effort: 'low' });
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.equal(cfgText(r.dir), before);
  assert.equal(commits(r), was);
});

// ---------- AC3 ----------

test('0661 AC3: adding a level with a name and any of the three saves it to levels:', () => {
  const r = repoWith('  quick:\n    builder_effort: low');
  const out = ask(r, 'graphics', 'add', { builder: 'claude', builder_model: 'opus' });
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.deepEqual(levelsIn(r.dir), { quick: { builder_effort: 'low' }, graphics: { builder: 'claude', builder_model: 'opus' } });
  assert.equal(ask(r, 'plain-2', 'add').status, 200, 'a level with none of the three');
  assert.deepEqual(levelsIn(r.dir)['plain-2'], {});
  assert.equal(r.g('status', '--porcelain', '--', 'speck/config.yml'), '');
});

test('0661 AC3: a name that isn\'t lowercase letters, digits and hyphens, or that\'s already a level, is refused saying why', () => {
  const r = repoWith('  quick:\n    builder_effort: low');
  const before = cfgText(r.dir), was = commits(r);
  for (const name of ['Graphics', 'two words', 'snake_case', '__proto__', 'é', '']) {
    const out = ask(r, name, 'add', { builder_effort: 'low' });
    assert.equal(out.status, 422, name);
    assert.match(out.body.error, /lowercase letters, digits and hyphens/, name);
  }
  const twice = ask(r, 'quick', 'add', { builder_effort: 'high' });
  assert.equal(twice.status, 422);
  assert.match(twice.body.error, /already a level called quick/);
  assert.equal(cfgText(r.dir), before);
  assert.equal(commits(r), was);
});

test('0661 AC3: the page adds a level from its name and values, and shows a refusal\'s reason', async () => {
  const r = repoWith('  quick:\n    builder_effort: low');
  const p = await opened(r.dir, {
    '/api/levels/graphics/add?builder=codex': { ok: true, said: 'Added the graphics level.', defaults: false, levels: [{ name: 'quick', builder: '', builder_model: '', builder_effort: 'low' }, { name: 'graphics', builder: 'codex', builder_model: '', builder_effort: '' }] },
    '/api/levels/Bad/add': { status: 422, body: { error: 'A level\'s name must be lowercase letters, digits and hyphens.' } } });
  const name = controlIn(p, 'New level name');
  name.value = 'graphics';
  name.listeners.input({ target: name });
  pick(p, 'New level builder', 'codex|');
  buttonIn(p, 'Add level').listeners.click({});
  await p.settle();
  assert.deepEqual(levelRows(p).map(n => n.attrs['data-level']), ['quick', 'graphics']);
  assert.equal(said(p), 'Added the graphics level.');
  assert.equal(controlIn(p, 'New level name').value, '', 'the form is empty again');
  const again = controlIn(p, 'New level name');
  again.value = 'Bad';
  again.listeners.input({ target: again });
  buttonIn(p, 'Add level').listeners.click({});
  await p.settle();
  assert.match(said(p), /lowercase letters, digits and hyphens/);
});

// ---------- AC4 ----------

test('0661 AC4: removing a level deletes it from speck/config.yml', () => {
  const r = repoWith('  quick:\n    builder_effort: low\n  deep:\n    builder_effort: max');
  const out = ask(r, 'quick', 'remove');
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.deepEqual(levelsIn(r.dir), { deep: { builder_effort: 'max' } });
  assert.equal(ask(r, 'deep', 'remove').status, 200);
  assert.deepEqual(levelsIn(r.dir), {}, 'with none left, levels: is empty, not the defaults');
  assert.equal(panelSettings(r.dir).levels.defaults, false);
});

test('0661 AC4: removing a level a ticket that isn\'t done or cancelled names is refused, naming those tickets', () => {
  const r = repoWith('  quick:\n    builder_effort: low\n  deep:\n    builder_effort: max');
  const fmOf = (id, status, level) => `id: "${id}"\ntitle: T${id}\nstatus: ${status}\nsize: S\nrisk: low\nlevel: ${level}`;
  r.write('0002-a.md', fmOf('0002', 'building', 'deep'));
  r.write('0003-b.md', fmOf('0003', 'draft', 'deep'));
  r.write('0004-c.md', fmOf('0004', 'done', 'deep'), undefined, 'speck/tickets/done');
  r.write('0005-d.md', fmOf('0005', 'cancelled', 'deep'), undefined, 'speck/tickets/done');
  r.write('0006-e.md', fmOf('0006', 'ready', 'quick'));
  r.g('add', '-A'); r.g('commit', '-qm', 'tickets');
  const before = cfgText(r.dir), was = commits(r);
  const out = ask(r, 'deep', 'remove');
  assert.equal(out.status, 422);
  assert.match(out.body.error, /Tickets 0002, 0003 are built at the deep level/);
  assert.doesNotMatch(out.body.error, /0004|0005|0006/);
  assert.equal(cfgText(r.dir), before);
  assert.equal(commits(r), was);
  // Once they're done, it can go.
  for (const f of ['0002-a.md', '0003-b.md']) fs.rmSync(path.join(r.dir, 'speck', 'tickets', f));
  r.g('commit', '-qam', 'gone');
  assert.equal(ask(r, 'deep', 'remove').status, 200);
});

test('0661 AC4: the page removes a level with its Remove button, and shows a refusal\'s reason', async () => {
  const r = repoWith('  quick:\n    builder_effort: low\n  deep:\n    builder_effort: max');
  const p = await opened(r.dir, {
    '/api/levels/quick/remove': { ok: true, said: 'Removed the quick level.', defaults: false, levels: [{ name: 'deep', builder: '', builder_model: '', builder_effort: 'max' }] },
    '/api/levels/deep/remove': { status: 422, body: { error: 'Ticket 0002 is built at the deep level and isn\'t done, so it wasn\'t removed.' } } });
  p.all(rowNamed(p, 'quick')).find(n => n.tagName === 'button').listeners.click({});
  await p.settle();
  assert.deepEqual(levelRows(p).map(n => n.attrs['data-level']), ['deep']);
  p.all(rowNamed(p, 'deep')).find(n => n.tagName === 'button').listeners.click({});
  await p.settle();
  assert.match(said(p), /Ticket 0002/);
  assert.deepEqual(levelRows(p).map(n => n.attrs['data-level']), ['deep']);
});

// ---------- AC5 ----------

test('0661 AC5: with no levels: the page shows the three defaults, and the first change saves all three with it', async () => {
  const r = repoWith(null);
  assert.equal(Object.hasOwn(parseConfig(cfgText(r.dir)), 'levels'), false);
  assert.deepEqual(panelSettings(r.dir).levels, levelsShown({}));
  assert.equal(panelSettings(r.dir).levels.defaults, true);
  const p = await opened(r.dir);
  assert.deepEqual(levelRows(p).map(n => n.attrs['data-level']), ['quick', 'balanced', 'deep']);
  const out = ask(r, 'deep', 'set', { builder_model: 'opus' });
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.deepEqual(levelsIn(r.dir), { ...DEFAULT_LEVELS, deep: { builder_effort: 'max', builder_model: 'opus' } });
  assert.equal(out.body.defaults, false);
});

test('0661 AC5: with no levels:, adding or removing one also saves the defaults with the change', () => {
  const r = repoWith(null);
  assert.equal(ask(r, 'graphics', 'add', { builder_model: 'opus' }).status, 200);
  assert.deepEqual(Object.keys(levelsIn(r.dir)), ['quick', 'balanced', 'deep', 'graphics']);
  const s = repoWith(null);
  assert.equal(ask(s, 'balanced', 'remove').status, 200);
  assert.deepEqual(levelsIn(s.dir), { quick: { builder_effort: 'low' }, deep: { builder_effort: 'max' } });
});
