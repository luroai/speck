import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { T, round, boardPage, fakePage, items, queueRows, shippedRows, top, panelRepo, startPanel, freePort, request, stop, gitEnv } from './support/panel.mjs';
import { panelSetLevel } from '../scripts/panel-level.mjs';
import { statusData } from '../scripts/speck.mjs';

// ---------- 0662: pick a ticket's build level in the panel ----------

Object.assign(process.env, gitEnv); // panelSetLevel commits in this process
const LEVELS = ['quick', 'balanced', 'deep'];
const IN_FLIGHT = { started: new Date(Date.now() - 600e3).toISOString(), builder: 'claude', reviewer: 'codex' };
const board = (tickets, o = {}) => ({ run: { on: true }, ideas: [], levels: LEVELS, tickets, ...o });
const idOf = (p, n) => p.all(n).find(x => x.className === 'id')?._text;
const pane = p => p.byId('full-ticket');
// Opens the ticket's card and presses its Full ticket button, as the user does (as in 0583's tests).
async function open(p, id) {
  const lists = [[() => items(p), n => top(n)], [() => queueRows(p), n => n.children[0]], [() => shippedRows(p), n => p.all(n).find(x => x.className === 'title')]];
  const [find, head] = lists.find(([f]) => f().some(n => idOf(p, n) === id));
  const card = () => find().find(n => idOf(p, n) === id);
  if (!/\bopen\b/.test(card().className)) { p.press(head(card())); await p.settle(); }
  const fullButton = p.all(card()).find(x => x.tagName === 'button' && x.textContent === 'Full ticket');
  if (fullButton) { p.press(fullButton); await p.settle(); }
}
const cells = (p, root) => p.all(root).filter(n => (n.className || '').split(' ').includes('fact'));
const labels = (p, root) => cells(p, root).map(c => c.children[0].textContent);
const levelCell = (p, root) => cells(p, root).find(c => c.children[0].textContent === 'Level');
const levelPick = (p, root) => p.all(levelCell(p, root)).find(n => /\bset-level\b/.test(n.className || ''));
const levelMenu = (p, root) => p.all(root).find(n => /\blevel-menu\b/.test(n.className || ''));
// A page whose board is `b`, each level request answered with `answer`, and a log request with an empty log, so opening
// a ticket in flight, which asks for its log, can't take the answer meant for the level.
function levelPage(b, answer) {
  const calls = [];
  const fetch = async (url, opts) => {
    calls.push({ url, opts });
    const u = String(url), body = /\/level\//.test(u) ? answer.body : /\/log$/.test(u) ? { text: '', truncated: false } : JSON.parse(JSON.stringify(b));
    const status = /\/level\//.test(u) ? answer.status : 200;
    return { ok: status === 200, status, json: async () => body };
  };
  const p = fakePage([], { fetch });
  p.calls = calls;
  return p;
}
const posts = p => p.calls.filter(c => c.opts && c.opts.method === 'POST').map(c => String(c.url));
const planCard = (p, id) => items(p).find(n => idOf(p, n) === id);
async function openCard(p, id) { p.press(top(planCard(p, id))); await p.settle(); return planCard(p, id); }

test('0662 AC1: an open Plan card shows Level beside Priority, "Settings" when the ticket has none', async () => {
  const p = boardPage([board([T('0701', 'draft'), T('0702', 'draft', { level: 'deep' })])]);
  await p.settle();
  for (const [id, shown] of [['0701', 'Settings'], ['0702', 'Deep']]) {
    const card = await openCard(p, id);
    const l = labels(p, card);
    assert.equal(l[l.indexOf('Priority') + 1], 'Level', l.join(', '));
    assert.equal(levelCell(p, card).children[1].textContent, shown);
  }
});

test('0662 AC1: the full view shows Level beside Priority, for a ticket in the queue and one that has shipped', async () => {
  const p = boardPage([board([T('0802', 'ready', { level: 'quick' }), T('0901', 'done', { ...IN_FLIGHT, finished: new Date().toISOString(), rounds: [round(1, 10)], level: '' })])]);
  await p.settle();
  for (const [id, shown] of [['0802', 'Quick'], ['0901', 'Settings']]) {
    await open(p, id);
    const l = labels(p, pane(p));
    assert.equal(l[l.indexOf('Priority') + 1], 'Level', `${id}: ${l.join(', ')}`);
    assert.equal(levelCell(p, pane(p)).children[1].textContent, shown, id);
    pane(p).hidden = true;
  }
});

test('0662 AC2: choosing Level offers each of the project\'s levels and Settings, and picking one sets it without a reload', async () => {
  const p = levelPage(board([T('0701', 'draft', { level: '' })], { levels: ['quick', 'balanced', 'deep', 'max-2'] }), { status: 200, body: { ok: true, id: '0701' } });
  await p.settle();
  let card = await openCard(p, '0701');
  p.press(levelPick(p, card));
  await p.settle();
  card = planCard(p, '0701');
  const menu = levelMenu(p, card);
  assert.deepEqual(menu.children.map(b => b.textContent), ['Quick', 'Balanced', 'Deep', 'Max-2', 'Settings']);
  assert.match(menu.children[4].className, /\bon\b/, 'Settings is marked, as the ticket has no level');
  p.press(menu.children[2]);
  await p.settle();
  assert.ok(posts(p).some(u => /\/api\/tickets\/0701\/level\/deep$/.test(u)), posts(p).join(', '));
  assert.equal(levelCell(p, planCard(p, '0701')).children[1].textContent, 'Deep', 'shown at once, before the next board');
  assert.equal(levelMenu(p, planCard(p, '0701')), undefined, 'and the menu has closed');
});

test('0662 AC2: picking Settings blanks the level', async () => {
  const p = levelPage(board([T('0802', 'ready', { level: 'deep' })]), { status: 200, body: { ok: true, id: '0802' } });
  await p.settle();
  await open(p, '0802');
  p.press(levelPick(p, pane(p)));
  await p.settle();
  const menu = levelMenu(p, pane(p));
  assert.match(menu.children[2].className, /\bon\b/, 'Deep is marked');
  p.press(menu.children.find(b => b.textContent === 'Settings'));
  await p.settle();
  assert.ok(posts(p).some(u => /\/api\/tickets\/0802\/level\/$/.test(u)), posts(p).join(', '));
  assert.equal(levelCell(p, pane(p)).children[1].textContent, 'Settings');
});

test('0662 AC3: a refusal shows its message and the ticket keeps its level', async () => {
  const why = 'Ticket 0803 is being built (building) in\n/tmp/x\nso changing it here would make its ship conflict. Wait until it ships, or change it there.';
  const p = levelPage(board([T('0803', 'building', { ...IN_FLIGHT, level: 'quick', build_running: true })]), { status: 409, body: { error: why } });
  await p.settle();
  await open(p, '0803');
  p.press(levelPick(p, pane(p)));
  await p.settle();
  p.press(levelMenu(p, pane(p)).children[2]);
  await p.settle();
  assert.ok(posts(p).some(u => /\/api\/tickets\/0803\/level\/deep$/.test(u)));
  const cell = levelCell(p, pane(p));
  assert.match(cell.textContent, /^Level/);
  assert.ok(p.all(cell).some(n => /\blevel-refused\b/.test(n.className || '') && n.textContent === why), cell.textContent);
  assert.equal(levelPick(p, pane(p)).textContent, 'Quick', 'its level is unchanged');
});

test('0662 AC3: a done ticket shows its level without offering to change it', async () => {
  const p = boardPage([board([T('0901', 'done', { ...IN_FLIGHT, finished: new Date().toISOString(), rounds: [round(1, 10)], level: 'deep' })])]);
  await p.settle();
  await open(p, '0901');
  assert.equal(levelCell(p, pane(p)).children[1].textContent, 'Deep');
  assert.equal(levelPick(p, pane(p)), undefined, 'no picker');
});

// The server's side, called directly.
const read = f => fs.readFileSync(f, 'utf8');
const levelLine = f => (read(f).match(/^level:.*$/m) || [''])[0];
const lastCommit = r => r.g('log', '-1', '--format=%s');

test('0662 AC2: the board lists the project\'s levels, in the order speck/config.yml gives them', () => {
  const r = panelRepo({ prefix: 'speck-0662-' });
  assert.deepEqual(statusData(r.dir).levels, LEVELS);
});

test('0662 AC2: the server sets the ticket\'s level, and Settings blanks it, each committed', () => {
  const r = panelRepo({ prefix: 'speck-0662-' });
  const out = panelSetLevel(r.dir, '1', 'deep');
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.match(levelLine(r.file), /^level: deep\b/);
  assert.equal(lastCommit(r), 'speck(0001): level deep');
  assert.equal(r.g('status', '--porcelain'), '');
  assert.equal(panelSetLevel(r.dir, '1', '').status, 200);
  assert.match(levelLine(r.file), /^level: ""/);
  assert.equal(lastCommit(r), 'speck(0001): level blank');
  const same = r.g('rev-parse', 'HEAD');
  assert.equal(panelSetLevel(r.dir, '1', '').status, 200);
  assert.equal(r.g('rev-parse', 'HEAD'), same, 'nothing to commit when it already has that level');
});

test('0662 AC2: a level the project doesn\'t have, or a missing ticket, is refused and changes nothing', () => {
  const r = panelRepo({ prefix: 'speck-0662-' });
  const before = read(r.file);
  for (const v of ['huge', 'constructor', '__proto__']) {
    const out = panelSetLevel(r.dir, '1', v);
    assert.equal(out.status, 422, v);
    assert.match(out.body.error, /isn't one of this project's levels/);
  }
  assert.equal(panelSetLevel(r.dir, '99', 'deep').status, 404);
  assert.equal(read(r.file), before);
});

test('0662 AC3: a ticket being built in its worktree is refused with the message speck set gives, and keeps its level', () => {
  const r = panelRepo({ worktrees: 'true', prefix: 'speck-0662-' });
  assert.equal(r.run('start', '1').status, 0);
  const said = r.run('set', '1', 'level', 'deep');
  assert.notEqual(said.status, 0);
  const before = read(r.file);
  const out = panelSetLevel(r.dir, '1', 'deep');
  assert.equal(out.status, 409);
  assert.equal(out.body.error, said.stderr.trim().replace(/^Error: /, ''));
  assert.equal(read(r.file), before);
});

for (const status of ['building', 'reviewing', 'blocked', 'approved', 'done', 'cancelled']) {
  test(`0662 AC3: a ${status} ticket's level can't be changed, and it keeps its level`, () => {
    const r = panelRepo({ prefix: 'speck-0662-' });
    fs.writeFileSync(r.file, read(r.file).replace(/^status: .*$/m, `status: ${status}`).replace(/^level: .*$/m, 'level: quick'));
    const before = read(r.file);
    const out = panelSetLevel(r.dir, '1', 'deep');
    assert.equal(out.status, 409);
    assert.match(out.body.error, new RegExp(`Ticket 0001 is .*${status}`));
    assert.equal(read(r.file), before);
  });
}

test('0662 AC2: the panel server answers the level route, guarded as the priority route is', async () => {
  const r = panelRepo({ prefix: 'speck-0662-' });
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    const level = await request(p.port, { method: 'POST', pathName: '/api/tickets/0001/level/deep' });
    assert.equal(level.status, 403, level.body); // no token: refused, so the route is there
    assert.match(level.body, /Forbidden/);
    assert.match(levelLine(r.file), /^level: ""/, 'unchanged');
  } finally { await stop(p); }
});
