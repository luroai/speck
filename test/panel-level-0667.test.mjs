// 0667: a ticket's Level menu says what each level builds with, calls no level Default, and leads to Build levels.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, round, boardPage, fakePage, items, queueRows, shippedRows, top, panelRepo } from './support/panel.mjs';
import { levelBuilds } from '../scripts/level-builds.mjs';
import { PROVIDERS } from '../scripts/providers.mjs';
import { statusData } from '../scripts/speck.mjs';
import { panelSettings as settingsView } from '../scripts/settings.mjs';

const LEVELS = ['quick', 'balanced', 'deep'];
const BUILDS = [
  { name: 'quick', builder: 'claude', agent: 'Claude Code', model: 'Fable', effort: 'low' },
  { name: 'balanced', builder: 'claude', agent: 'Claude Code', model: 'Fable', effort: 'high' },
  { name: 'deep', builder: 'codex', agent: 'Codex', model: '', effort: 'low' },
  { name: '', builder: 'claude', agent: 'Claude Code', model: 'Fable', effort: 'high' }];
const board = (tickets, o = {}) => ({ run: { on: true }, ideas: [], levels: LEVELS, level_builds: BUILDS, tickets, ...o });
const idOf = (p, n) => p.all(n).find(x => x.className === 'id')?._text;
const has = (n, c) => new RegExp(`\\b${c}\\b`).test(n.className || '');
const cells = (p, root) => p.all(root).filter(n => (n.className || '').split(' ').includes('fact'));
const levelCell = (p, root) => cells(p, root).find(c => c.children[0].textContent === 'Level');
const levelPick = (p, root) => p.all(levelCell(p, root)).find(n => has(n, 'set-level'));
const levelMenu = (p, root) => p.all(root).find(n => has(n, 'level-menu'));
const planCard = (p, id) => items(p).find(n => idOf(p, n) === id);
const nameOf = (p, b) => p.all(b).find(n => has(n, 'lname'))?.textContent ?? b.textContent;
const buildOf = (p, b) => p.all(b).find(n => has(n, 'lbuild'))?.textContent ?? null;
// Opens the ticket's Plan card, unless it's open already.
async function openCard(p, id) { if (!has(planCard(p, id), 'open')) { p.press(top(planCard(p, id))); await p.settle(); } return planCard(p, id); }
async function openMenu(p, id) {
  const card = await openCard(p, id);
  p.press(levelPick(p, card));
  await p.settle();
  return levelMenu(p, planCard(p, id));
}
// A page whose board is `b`, each level request answered ok, Settings answered with this project's settings, and every
// element able to scroll into view, which it records.
function menuPage(b, view = null) {
  const calls = [], scrolled = [];
  const fetch = async (url, opts = {}) => {
    const u = String(url);
    calls.push({ url: u, method: (opts.method || 'GET').toUpperCase() });
    const body = /\/level\//.test(u) ? { ok: true } : u.startsWith('/api/settings') ? view : /\/log$/.test(u) ? { text: '', truncated: false } : b;
    return { ok: true, status: 200, json: async () => structuredClone(body) };
  };
  const p = fakePage([], { fetch }, { made: n => { n.scrollIntoView = how => scrolled.push({ n, how }); n.focus = () => {}; } });
  Object.assign(p, { calls, scrolled, posts: () => calls.filter(c => c.method === 'POST').map(c => c.url) });
  return p;
}

// ---------- AC1 ----------

test('0667 AC1: a ticket with no level shows Default in its Level fact and its menu, never Settings', async () => {
  const p = menuPage(board([T('0701', 'draft', { level: '' })]));
  await p.settle();
  assert.equal(levelCell(p, await openCard(p, '0701')).children[1].textContent, 'Default');
  const menu = await openMenu(p, '0701');
  const names = menu.children.map(b => nameOf(p, b));
  assert.deepEqual(names, ['Quick', 'Balanced', 'Deep', 'Default', 'Change levels']);
  assert.ok(!names.includes('Settings'));
  assert.match(menu.children[3].className, /\bon\b/, 'Default is marked, as the ticket has no level');
});

test('0667 AC1: a done ticket with no level shows Default, in its card and its full view', async () => {
  const p = boardPage([board([T('0901', 'done', { started: new Date(Date.now() - 600e3).toISOString(), finished: new Date().toISOString(), builder: 'claude', reviewer: 'codex', rounds: [round(1, 10)], level: '' })])]);
  await p.settle();
  const row = () => shippedRows(p).find(n => idOf(p, n) === '0901');
  p.press(p.all(row()).find(x => x.className === 'title'));
  await p.settle();
  p.press(p.all(row()).find(x => x.tagName === 'button' && x.textContent === 'Full ticket'));
  await p.settle();
  assert.equal(levelCell(p, p.byId('full-ticket')).children[1].textContent, 'Default');
  assert.equal(levelPick(p, p.byId('full-ticket')), undefined, 'and offers no menu');
});

// ---------- AC2 ----------

test('0667 AC2: each choice shows under its name the builder, model and effort it builds with, Default the Builder\'s own', async () => {
  const p = menuPage(board([T('0701', 'draft', { level: 'quick' })]));
  await p.settle();
  const menu = await openMenu(p, '0701');
  assert.deepEqual(menu.children.slice(0, 4).map(b => [nameOf(p, b), buildOf(p, b)]), [
    ['Quick', 'Claude Code · Fable · low'], ['Balanced', 'Claude Code · Fable · high'], ['Deep', 'Codex · default model · low'], ['Default', 'Claude Code · Fable · high']]);
  assert.equal(buildOf(p, menu.children[4]), null, 'Change levels builds with nothing');
});

test('0667 AC2: a board that doesn\'t say what a level builds with shows only its name', async () => {
  const p = menuPage(board([T('0701', 'draft')], { level_builds: [{ name: 'quick' }, null, 'deep'] }));
  await p.settle();
  const menu = await openMenu(p, '0701');
  assert.deepEqual(menu.children.map(b => [nameOf(p, b), buildOf(p, b)]), [['Quick', null], ['Balanced', null], ['Deep', null], ['Default', null], ['Change levels', null]]);
});

const cfg = o => ({ builder: 'claude', builder_model: 'fable', builder_effort: 'high', build_command: '', ...o });

test('0667 AC2: each level builds with its own builder, model and effort, else the Builder\'s, as a build works them out', () => {
  const out = levelBuilds(cfg({ levels: { quick: { builder_effort: 'low' }, balanced: {}, deep: { builder: 'codex', builder_effort: 'low' }, big: { builder_model: 'opus' } } }), null, PROVIDERS);
  assert.deepEqual(out.map(b => [b.name, `${b.agent} · ${b.model || 'default model'} · ${b.effort || 'default effort'}`]), [
    ['quick', 'Claude Code · Fable · low'], ['balanced', 'Claude Code · Fable · high'],
    ['deep', 'Codex · default model · low'], // the Builder's model and effort reach only the Builder's own agent
    ['big', 'Claude Code · Opus · high'], ['', 'Claude Code · Fable · high']]);
});

test('0667 AC2: a project without levels gets speck\'s three, and a Builder with no model or effort names neither', () => {
  const out = levelBuilds(cfg({ builder_model: '', builder_effort: '' }), null, PROVIDERS);
  assert.deepEqual(out.map(b => [b.name, b.agent, b.model, b.effort]), [
    ['quick', 'Claude Code', '', 'low'], ['balanced', 'Claude Code', '', ''], ['deep', 'Claude Code', '', 'max'], ['', 'Claude Code', '', '']]);
});

test('0667 AC2: a model provider and its model go by the names the Builder\'s list gives them, and odd level names are their own', () => {
  const out = levelBuilds(cfg({ levels: { constructor: { builder: 'deepseek', builder_model: 'deepseek-v4-flash' }, __proto__x: {} } }), null, PROVIDERS);
  assert.deepEqual(out.map(b => [b.name, b.agent, b.model]), [['constructor', 'DeepSeek', 'V4 Flash'], ['__proto__x', 'Claude Code', 'Fable'], ['', 'Claude Code', 'Fable']]);
});

test('0667 AC2: the board gives what each level builds with, beside its names', () => {
  const r = panelRepo({ prefix: 'speck-0667-' });
  const s = statusData(r.dir);
  assert.deepEqual(s.level_builds.map(b => b.name), [...s.levels, '']);
  for (const b of s.level_builds) assert.equal(typeof b.agent, 'string');
});

// ---------- AC3 ----------

test('0667 AC3: Change levels closes the menu and opens Settings scrolled to the Builder\'s Build levels, leaving the level', async () => {
  const r = panelRepo({ prefix: 'speck-0667-' });
  const p = menuPage(board([T('0701', 'draft', { level: 'deep' })]), settingsView(r.dir));
  await p.settle();
  const menu = await openMenu(p, '0701');
  const change = menu.children.at(-1);
  assert.equal(change.textContent, 'Change levels');
  p.press(change);
  await p.settle();
  assert.equal(levelMenu(p, planCard(p, '0701')), undefined, 'the menu has closed');
  assert.equal(p.byId('settings').hidden, false, 'Settings is open');
  const levels = p.all(p.byId('settings')).find(n => has(n, 'levels'));
  assert.ok(levels, 'Build levels are drawn');
  const builder = p.all(p.byId('settings')).find(n => n.attrs?.['data-member'] === 'builder');
  assert.ok(p.all(builder).includes(levels), 'on the Builder\'s card');
  assert.deepEqual(p.scrolled.map(s => s.n), [levels], 'scrolled to Build levels, and nothing else');
  assert.deepEqual(p.posts(), [], 'the ticket\'s level is unchanged');
  assert.equal(levelCell(p, planCard(p, '0701')).children[1].textContent, 'Deep');
});

test('0667 AC3: the Settings button still opens Settings at the top', async () => {
  const r = panelRepo({ prefix: 'speck-0667-' });
  const p = menuPage(board([T('0701', 'draft')]), settingsView(r.dir));
  await p.settle();
  p.press(p.byId('settings-open'));
  await p.settle();
  assert.equal(p.byId('settings').hidden, false);
  assert.deepEqual(p.scrolled, []);
});

// ---------- AC4 ----------

test('0667 AC4: picking a level, Default included, still sets it at once and closes the menu', async () => {
  const p = menuPage(board([T('0701', 'draft', { level: 'quick' })]));
  await p.settle();
  for (const [pick, url, shown] of [['Deep', /\/api\/tickets\/0701\/level\/deep$/, 'Deep'], ['Default', /\/api\/tickets\/0701\/level\/$/, 'Default']]) {
    const menu = await openMenu(p, '0701');
    p.press(menu.children.find(b => nameOf(p, b) === pick));
    await p.settle();
    assert.ok(p.posts().some(u => url.test(u)), p.posts().join(', '));
    assert.equal(levelCell(p, planCard(p, '0701')).children[1].textContent, shown);
    assert.equal(levelMenu(p, planCard(p, '0701')), undefined);
  }
});

// ---------- review round 2: F1, an effort the builder isn't given; F2, a model by its agent's own name ----------

test('0667 AC2 F1: a builder that isn\'t given an effort shows none, whatever the level sets', () => {
  const levels = { quick: { builder: 'cursor', builder_model: 'composer-2', builder_effort: 'max' }, deep: { builder: 'deepseek', builder_effort: 'high' }, big: { builder: 'codex', builder_effort: 'low' } };
  const own = levelBuilds(cfg({ levels }), null, PROVIDERS);
  assert.deepEqual(own.map(b => [b.name, b.effort]), [['quick', null], ['deep', null], ['big', 'low'], ['', 'high']]);
  // With a build_command of its own, Codex builds through it, and aren't given the level's effort either.
  const hand = levelBuilds(cfg({ levels, build_command: 'my-builder {id}' }), null, PROVIDERS);
  assert.deepEqual(hand.map(b => [b.name, b.effort]), [['quick', null], ['deep', null], ['big', null], ['', 'high']]);
});

test('0667 AC2 F1: the menu leaves out an effort the builder isn\'t given', async () => {
  const builds = [{ name: 'quick', builder: 'cursor', agent: 'Cursor', model: 'composer-2', model_slug: 'composer-2', effort: null }, ...BUILDS.slice(1)];
  const p = menuPage(board([T('0701', 'draft')], { level_builds: builds }));
  await p.settle();
  const menu = await openMenu(p, '0701');
  assert.equal(buildOf(p, menu.children[0]), 'Cursor · composer-2');
  assert.equal(buildOf(p, menu.children[3]), 'Claude Code · Fable · high');
});

test('0667 AC2 F2: the board gives the model as the build is given it, beside its name', () => {
  const out = levelBuilds(cfg({ levels: { quick: { builder: 'codex', builder_model: 'gpt-6.1-sol', builder_effort: 'low' } } }), null, PROVIDERS);
  assert.deepEqual(out.map(b => [b.name, b.model, b.model_slug]), [['quick', 'gpt-6.1-sol', 'gpt-6.1-sol'], ['', 'Fable', 'fable']]);
});

// A page as menuPage's, with each agent's models answered from `models` (agent → answer), and its requests counted.
function namesPage(builds, models, tickets = [T('0701', 'draft')]) {
  const calls = [];
  const b = board(tickets, { level_builds: builds });
  const fetch = async (url, opts = {}) => {
    const u = String(url);
    calls.push(u);
    const m = u.match(/^\/api\/agent-models\?agent=(\w+)$/);
    if (m) { const a = models[m[1]]; if (a && a.fail) throw new Error('offline'); return { ok: !!a, status: a ? 200 : 500, json: async () => structuredClone(a ?? {}) }; }
    return { ok: true, status: 200, json: async () => structuredClone(/\/log$/.test(u) ? { text: '', truncated: false } : b) };
  };
  const p = fakePage([], { fetch });
  p.calls = calls;
  return p;
}
const CODEX_LEVEL = { name: 'quick', builder: 'codex', agent: 'Codex', model: 'gpt-6.1-sol', model_slug: 'gpt-6.1-sol', effort: 'low' };

test('0667 AC2 F2: a Codex or Cursor model goes by the name its agent\'s list gives it, asked once', async () => {
  const cursor = { name: 'deep', builder: 'cursor', agent: 'Cursor', model: 'composer-2', model_slug: 'composer-2', effort: null };
  const p = namesPage([CODEX_LEVEL, BUILDS[1], cursor, BUILDS[3]], {
    codex: { agent: 'codex', models: [{ slug: 'gpt-6.1-sol', display_name: 'GPT-6.1 Sol' }] },
    cursor: { agent: 'cursor', models: [{ slug: 'composer-2', display_name: 'Composer 2' }] } });
  await p.settle();
  let menu = await openMenu(p, '0701');
  await p.settle();
  menu = levelMenu(p, planCard(p, '0701'));
  assert.equal(buildOf(p, menu.children[0]), 'Codex · GPT-6.1 Sol · low');
  assert.equal(buildOf(p, menu.children[2]), 'Cursor · Composer 2');
  p.press(levelPick(p, planCard(p, '0701'))); // closes it
  await p.settle();
  await openMenu(p, '0701');
  await p.settle();
  assert.equal(p.calls.filter(u => u.startsWith('/api/agent-models')).length, 2, p.calls.join(', '));
});

test('0667 AC2 F2: a model whose name can\'t be read keeps the name the build is given', async () => {
  for (const answer of [undefined, { fail: true }, { agent: 'codex', why: 'Codex isn\'t signed in.' }, { agent: 'codex', models: [{ slug: 'other', display_name: 'Other' }] }]) {
    const p = namesPage([CODEX_LEVEL, ...BUILDS.slice(1)], { codex: answer });
    await p.settle();
    await openMenu(p, '0701');
    await p.settle();
    assert.equal(buildOf(p, levelMenu(p, planCard(p, '0701')).children[0]), 'Codex · gpt-6.1-sol · low', JSON.stringify(answer));
  }
});

test('0667 AC2 F2: a queued ticket\'s full view names the model too, once read', async () => {
  const p = namesPage([CODEX_LEVEL, ...BUILDS.slice(1)], { codex: { agent: 'codex', models: [{ slug: 'gpt-6.1-sol', display_name: 'GPT-6.1 Sol' }] } }, [T('0802', 'ready')]);
  await p.settle();
  const row = () => queueRows(p).find(n => idOf(p, n) === '0802');
  p.press(row().children[0]);
  await p.settle();
  p.press(p.all(row()).find(x => x.tagName === 'button' && x.textContent === 'Full ticket'));
  await p.settle();
  const pane = p.byId('full-ticket');
  p.press(levelPick(p, pane));
  await p.settle();
  await p.settle();
  assert.equal(buildOf(p, levelMenu(p, p.byId('full-ticket')).children[0]), 'Codex · GPT-6.1 Sol · low');
});
