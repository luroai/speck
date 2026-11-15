// 0669: a ticket's facts say what its next build would use, and its Builder menu changes the builder and model.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { T, round, fakePage, items, queueRows, shippedRows, top, panelRepo, startPanel, freePort, request, stop, gitEnv } from './support/panel.mjs';
import { openSettings, rowOf } from './support/settings.mjs';
import { YOURS_VIEW } from './support/your-agents.mjs';
import { panelSetBuilder } from '../scripts/panel-builder.mjs';
import { ticketBuild } from '../scripts/level-builds.mjs';
import { DEFAULT_BUILD_COMMAND } from '../scripts/build-model.mjs';
import { PROVIDERS } from '../scripts/providers.mjs';
import { panelSettings, CLAUDE_MODELS } from '../scripts/settings.mjs';
import { statusData, findTicket, loadConfig } from '../scripts/speck.mjs';
import { lintTicket } from '../scripts/lint.mjs';

Object.assign(process.env, gitEnv); // panelSetBuilder commits in this process

// ---------- what a ticket's next build would use, worked out on the server ----------

const CFG = { builder: 'claude', builder_model: 'fable', builder_effort: 'high', build_command: DEFAULT_BUILD_COMMAND,
  levels: { quick: { builder_effort: 'low' }, deep: { builder: 'codex', builder_effort: 'xhigh' } } };
const built = fm => { const { builder, agent, model, model_slug, effort, from } = ticketBuild(fm, CFG, PROVIDERS); return { builder, agent, model, model_slug, effort, from }; };

test('0669 AC1: a ticket that sets nothing builds with the Builder\'s in Settings, from Default', () => {
  assert.deepEqual(built({ level: '' }), { builder: 'claude', agent: 'Claude Code', model: 'Fable', model_slug: 'fable', effort: 'high', from: 'default' });
});

test('0669 AC1: a ticket with a level builds with the level\'s, where it gives them, from that level', () => {
  assert.deepEqual(built({ level: 'quick' }), { builder: 'claude', agent: 'Claude Code', model: 'Fable', model_slug: 'fable', effort: 'low', from: 'quick' });
  assert.deepEqual(built({ level: 'deep' }), { builder: 'codex', agent: 'Codex', model: '', model_slug: '', effort: 'xhigh', from: 'deep' }, 'the Builder\'s model is only given to its own agent');
});

test('0669 AC1: a ticket\'s own builder and model come first, from This ticket, and a level it doesn\'t have isn\'t named', () => {
  assert.deepEqual(built({ level: 'quick', builder: 'claude', builder_model: 'opus' }), { builder: 'claude', agent: 'Claude Code', model: 'Opus', model_slug: 'opus', effort: 'low', from: 'ticket' });
  assert.equal(built({ level: 'huge' }).from, 'default');
  assert.equal(built({ level: 'constructor' }).from, 'default');
  assert.deepEqual(ticketBuild({ builder: 'codex', builder_model: 'gpt-6.1-sol' }, CFG, PROVIDERS).own, { builder: 'codex', builder_model: 'gpt-6.1-sol' });
});

test('0669 AC1: a model or effort nobody sets is left blank for the page to call default', () => {
  const cfg = { builder: 'claude', build_command: DEFAULT_BUILD_COMMAND, levels: {} };
  const b = ticketBuild({}, cfg, PROVIDERS);
  assert.equal(b.model, '');
  assert.equal(b.effort, '');
  assert.equal(ticketBuild({ builder: 'cursor' }, cfg, PROVIDERS).effort, null, 'Cursor is given no effort at all');
});

test('0669 AC1: the board gives each ticket its build_with', () => {
  const r = panelRepo({ prefix: 'speck-0669-' });
  const t = statusData(r.dir).tickets.find(x => x.id === '0001');
  assert.equal(t.build_with.agent, 'Claude Code');
  assert.equal(t.build_with.from, 'default', 'panelRepo\'s ticket names no builder, model or level');
  assert.deepEqual(t.build_with.own, { builder: '', builder_model: '' });
});

// ---------- the Builder fact and menu on the page ----------

const BUILD = (o = {}) => ({ builder: 'claude', agent: 'Claude Code', model: 'Fable', model_slug: 'fable', effort: 'high', from: 'default', own: { builder: '', builder_model: '' }, ...o });
const board = tickets => ({ run: { on: true }, ideas: [], levels: ['quick', 'deep'], level_builds: [], tickets });
const AGENT_MODELS = [
  { id: 'claude', name: 'Claude Code', efforts: true, models: CLAUDE_MODELS.map(m => ({ ...m })), default_model: 'sonnet' },
  { id: 'codex', name: 'Codex', efforts: true, models: [{ slug: 'gpt-6.1-sol', display_name: 'GPT-6.1 Sol', description: null }], default_model: 'gpt-6.1-sol' }];
// GET /api/settings, as the panel's server gives it, for a project like panelRepo's.
let viewOnce = null;
const settingsView = () => (viewOnce ??= { ...panelSettings(panelRepo({ prefix: 'speck-0669-' }).dir), your_agents: YOURS_VIEW(), agent_models: AGENT_MODELS });
const idOf = (p, n) => p.all(n).find(x => x.className === 'id')?._text;
const has = (n, c) => new RegExp(`\\b${c}\\b`).test(n.className || '');
const pane = p => p.byId('full-ticket');
const cells = (p, root) => p.all(root).filter(n => (n.className || '').split(' ').includes('fact'));
const builderCell = (p, root) => cells(p, root).find(c => c.children[0].textContent === 'Builder');
const builderPick = (p, root) => p.all(builderCell(p, root)).find(n => has(n, 'set-builder'));
const fromLine = (p, root) => p.all(builderCell(p, root)).find(n => has(n, 'bfrom'))?.textContent;
const builderMenu = (p, root) => p.all(root).find(n => has(n, 'builder-menu'));
const menuLabels = (p, menu) => menu.children.filter(n => n.tagName === 'button').map(b => b.textContent);
const planCard = (p, id) => items(p).find(n => idOf(p, n) === id);
// A page whose board is `b`, each builder request answered with `answer(url)`, Settings with settingsView().
function builderPage(b, answer = () => ({ status: 200, body: { ok: true } })) {
  const calls = [];
  const fetch = async (url, opts = {}) => {
    const u = String(url), method = (opts.method || 'GET').toUpperCase();
    calls.push({ url: u, method });
    const a = /\/builder\?/.test(u) ? answer(u) : { status: 200, body: u.startsWith('/api/settings') ? settingsView() : /\/log$/.test(u) ? { text: '', truncated: false } : u.startsWith('/api/agent-models') ? { agent: '', why: 'no' } : b };
    return { ok: a.status === 200, status: a.status, json: async () => structuredClone(a.body) };
  };
  const p = fakePage([], { fetch });
  p.calls = calls;
  p.posts = () => calls.filter(c => c.method === 'POST').map(c => c.url);
  return p;
}
async function openCard(p, id) { if (!has(planCard(p, id), 'open')) { p.press(top(planCard(p, id))); await p.settle(); } return planCard(p, id); }
// Opens the ticket's card and presses its Full ticket button, as the user does (as in 0662's tests).
async function openFull(p, id) {
  const lists = [[() => items(p), n => top(n)], [() => queueRows(p), n => n.children[0]], [() => shippedRows(p), n => p.all(n).find(x => x.className === 'title')]];
  const [find, head] = lists.find(([f]) => f().some(n => idOf(p, n) === id));
  const card = () => find().find(n => idOf(p, n) === id);
  if (!has(card(), 'open')) { p.press(head(card())); await p.settle(); }
  const full = p.all(card()).find(x => x.tagName === 'button' && x.textContent === 'Full ticket');
  if (full) { p.press(full); await p.settle(); }
}

test('0669 AC1: an open draft in Plan shows the Builder fact, with where it comes from under it', async () => {
  const p = builderPage(board([T('0701', 'draft', { build_with: BUILD() }), T('0702', 'draft', { build_with: BUILD({ from: 'deep', builder: 'codex', agent: 'Codex', model: '', model_slug: '', effort: '' }) }),
    T('0703', 'draft', { build_with: BUILD({ from: 'ticket', model: 'Opus', model_slug: 'opus' }) })]));
  await p.settle();
  for (const [id, words, from] of [['0701', 'Claude Code · Fable · high', 'Default'], ['0702', 'Codex · default model · default effort', 'Deep level'], ['0703', 'Claude Code · Opus · high', 'This ticket']]) {
    const card = await openCard(p, id);
    assert.equal(builderPick(p, card).textContent, words, id);
    assert.equal(fromLine(p, card), from, id);
  }
});

test('0669 AC1: the full view shows the same Builder fact, for a draft and a ticket in the queue', async () => {
  const p = builderPage(board([T('0701', 'draft', { build_with: BUILD() }), T('0801', 'ready', { build_with: BUILD({ from: 'quick', effort: 'low' }) })]));
  await p.settle();
  await openFull(p, '0701');
  assert.equal(builderPick(p, pane(p)).textContent, 'Claude Code · Fable · high');
  assert.equal(fromLine(p, pane(p)), 'Default');
  await openFull(p, '0801');
  assert.equal(builderPick(p, pane(p)).textContent, 'Claude Code · Fable · low');
  assert.equal(fromLine(p, pane(p)), 'Quick level');
});

test('0669 AC2: the menu offers Default, then the Builder\'s choices in Settings, in the same words', async () => {
  const p = builderPage(board([T('0701', 'draft', { build_with: BUILD() })]));
  await p.settle();
  const card = await openCard(p, '0701');
  p.press(builderPick(p, card));
  await p.settle();
  const shown = menuLabels(p, builderMenu(p, planCard(p, '0701')));
  p.press(p.byId('settings-open')); // closes the menu, as any click outside it does
  await p.settle();
  await openSettings(p);
  const own = p.all(rowOf(p, 'builder')).find(n => n.tagName === 'select');
  const settings = p.all(own).filter(n => n.tagName === 'option' && !n.disabled).map(o => o.textContent);
  assert.ok(settings.includes('Claude Code · Opus'), JSON.stringify(settings));
  assert.deepEqual(shown, ['Default', ...settings]);
});

test('0669 AC2: picking a choice sets builder and builder_model, Default blanks both, and the facts change without a reload', async () => {
  const answers = { 'builder=claude&model=opus': BUILD({ from: 'ticket', model: 'Opus', model_slug: 'opus', own: { builder: 'claude', builder_model: 'opus' } }), 'builder=&model=': BUILD() };
  const p = builderPage(board([T('0701', 'draft', { build_with: BUILD() })]), u => ({ status: 200, body: { ok: true, builder: 'claude', builder_label: null, builder_model: 'opus', build_with: answers[u.split('?')[1]] } }));
  await p.settle();
  let card = await openCard(p, '0701');
  p.press(builderPick(p, card));
  await p.settle();
  const choice = label => builderMenu(p, planCard(p, '0701')).children.find(b => b.textContent === label);
  p.press(choice('Claude Code · Opus'));
  await p.settle();
  const boards = p.calls.filter(c => c.url.startsWith('/api/state')).length;
  card = planCard(p, '0701');
  assert.ok(p.posts().includes('/api/tickets/0701/builder?builder=claude&model=opus'), p.posts().join('\n'));
  assert.equal(builderPick(p, card).textContent, 'Claude Code · Opus · high');
  assert.equal(fromLine(p, card), 'This ticket');
  p.press(builderPick(p, card));
  await p.settle();
  assert.ok(has(choice('Claude Code · Opus'), 'on'), 'the ticket\'s own choice is marked');
  p.press(choice('Default'));
  await p.settle();
  assert.ok(p.posts().includes('/api/tickets/0701/builder?builder=&model='));
  assert.equal(fromLine(p, planCard(p, '0701')), 'Default');
  assert.equal(p.calls.filter(c => c.url.startsWith('/api/state')).length, boards, 'no board read in between');
});

test('0669 AC3: a refusal shows its message under the Builder, and it keeps its builder', async () => {
  const why = 'Ticket 0803 is being built (building), so its builder can\'t change until it ships.';
  const p = builderPage(board([T('0803', 'building', { started: new Date(Date.now() - 600e3).toISOString(), reviewer: 'codex', build_running: true, build_with: BUILD() })]), () => ({ status: 409, body: { error: why } }));
  await p.settle();
  await openFull(p, '0803');
  p.press(builderPick(p, pane(p)));
  await p.settle();
  p.press(builderMenu(p, pane(p)).children.find(b => b.textContent === 'Claude Code · Opus'));
  await p.settle();
  assert.ok(p.all(builderCell(p, pane(p))).some(n => has(n, 'level-refused') && n.textContent === why));
  assert.equal(builderPick(p, pane(p)).textContent, 'Claude Code · Fable · high', 'its builder is unchanged');
});

test('0669 AC3: a done ticket shows what it was built with, without the menu', async () => {
  const p = builderPage(board([T('0901', 'done', { started: new Date(Date.now() - 600e3).toISOString(), finished: new Date().toISOString(), reviewer: 'codex', rounds: [round(1, 10)],
    build_with: BUILD({ from: 'ticket', model: 'Opus', model_slug: 'opus', effort: 'max' }) })]));
  await p.settle();
  await openFull(p, '0901');
  assert.equal(builderPick(p, pane(p)), undefined, 'no menu');
  assert.equal(builderCell(p, pane(p)).children[1].children[0].textContent, 'Claude Code · Opus · max');
  assert.equal(fromLine(p, pane(p)), 'This ticket');
});

// ---------- the server's side, called directly ----------

const read = f => fs.readFileSync(f, 'utf8');
const line = (f, k) => (read(f).match(new RegExp(`^${k}:.*$`, 'm')) || [''])[0];
const lastCommit = r => r.g('log', '-1', '--format=%s');
// panelRepo's ticket, back to a draft, so the panel can change it.
function draftRepo(o = {}) {
  const r = panelRepo({ prefix: 'speck-0669-', ...o });
  fs.writeFileSync(r.file, read(r.file).replace(/^status: .*$/m, 'status: draft'));
  r.g('commit', '-qam', 'draft');
  return r;
}

test('0669 AC2: the server sets the ticket\'s builder and model, and Default blanks both, each committed', () => {
  const r = draftRepo();
  const out = panelSetBuilder(r.dir, '1', 'claude', 'opus');
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.match(line(r.file, 'builder'), /^builder: claude\b/);
  assert.match(line(r.file, 'builder_model'), /^builder_model: opus\b/);
  assert.equal(lastCommit(r), 'speck(0001): builder claude · opus');
  assert.equal(r.g('status', '--porcelain'), '');
  assert.equal(out.body.build_with.model, 'Opus');
  assert.equal(out.body.build_with.from, 'ticket');
  const back = panelSetBuilder(r.dir, '1', '', '');
  assert.equal(back.status, 200);
  assert.match(line(r.file, 'builder'), /^builder: ""/);
  assert.match(line(r.file, 'builder_model'), /^builder_model: ""/);
  assert.equal(lastCommit(r), 'speck(0001): builder default');
  assert.equal(back.body.build_with.from, 'default');
  const same = r.g('rev-parse', 'HEAD');
  assert.equal(panelSetBuilder(r.dir, '1', '', '').status, 200);
  assert.equal(r.g('rev-parse', 'HEAD'), same, 'nothing to commit when it already has that builder');
});

test('0669 AC2: an agent speck can\'t build with, a model without its agent, or a missing ticket is refused and changes nothing', () => {
  const r = draftRepo();
  const before = read(r.file);
  for (const [b, m] of [['huge', ''], ['constructor', ''], ['__proto__', ''], ['', 'opus'], ['claude', 'a\nb']]) assert.equal(panelSetBuilder(r.dir, '1', b, m).status, 422, `${b} ${m}`);
  assert.equal(panelSetBuilder(r.dir, '99', 'claude', '').status, 404);
  assert.equal(read(r.file), before);
});

test('0669 AC3: a ticket being built in its worktree is refused with the message speck set gives, and keeps its builder', () => {
  const r = panelRepo({ worktrees: 'true', prefix: 'speck-0669-' });
  assert.equal(r.run('start', '1').status, 0);
  const said = r.run('set', '1', 'builder', 'codex');
  assert.notEqual(said.status, 0);
  const before = read(r.file);
  const out = panelSetBuilder(r.dir, '1', 'codex', '');
  assert.equal(out.status, 409);
  assert.equal(out.body.error, said.stderr.trim().replace(/^Error: /, ''));
  assert.equal(read(r.file), before);
});

for (const status of ['building', 'reviewing', 'blocked', 'approved', 'done', 'cancelled']) {
  test(`0669 AC3: a ${status} ticket's builder can't be changed, and it keeps its builder`, () => {
    const r = panelRepo({ prefix: 'speck-0669-' });
    fs.writeFileSync(r.file, read(r.file).replace(/^status: .*$/m, `status: ${status}`));
    const before = read(r.file);
    const out = panelSetBuilder(r.dir, '1', 'codex', '');
    assert.equal(out.status, 409);
    assert.match(out.body.error, new RegExp(`Ticket 0001 is .*${status}`));
    assert.equal(read(r.file), before);
  });
}

test('0669 AC4: a pick the ready check would refuse is refused with its message, and the ticket keeps its builder', () => {
  const r = draftRepo();
  fs.writeFileSync(r.file, read(r.file).replace(/^reviewer_model: .*$/m, 'reviewer_model: opus'));
  r.g('commit', '-qam', 'reviewer model');
  const t = findTicket(r.dir, '1'), cfg = loadConfig(r.dir);
  assert.equal(cfg.allow_same_model_review, false);
  const was = new Set(lintTicket(t, cfg).errors);
  const want = lintTicket({ ...t, fm: { ...t.fm, builder: 'claude', reviewer: 'claude', builder_model: 'opus' } }, cfg).errors.filter(e => !was.has(e));
  fs.writeFileSync(r.file, read(r.file).replace(/^reviewer: .*$/m, 'reviewer: claude'));
  r.g('commit', '-qam', 'reviewer claude');
  const before = read(r.file);
  const out = panelSetBuilder(r.dir, '1', 'claude', 'opus');
  assert.equal(out.status, 422, JSON.stringify(out.body));
  assert.ok(want.length, 'the ready check refuses the same model');
  assert.equal(out.body.error, want.join('\n'));
  assert.match(out.body.error, /same model|both would run/);
  assert.equal(read(r.file), before);
});

test('0669 AC2: the panel server answers the builder route, guarded as the level route is', async () => {
  const r = draftRepo();
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    const res = await request(p.port, { method: 'POST', pathName: '/api/tickets/0001/builder?builder=codex&model=' });
    assert.equal(res.status, 403, res.body); // no token: refused, so the route is there
    assert.match(res.body, /Forbidden/);
    assert.match(line(r.file, 'builder'), /^builder: ""/, 'unchanged');
  } finally { await stop(p); }
});
