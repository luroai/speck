import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { T, full, round, boardPage, items, queueRows, shippedRows, top, panelRepo } from './support/panel.mjs';
import { rules, selectors, get } from './support/css.mjs';

// ---------- 0583: a ticket's full view, redesigned ----------

const NOW = new Date(2026, 10, 9, 12, 0).getTime();
const ago = s => new Date(NOW - s * 1000).toISOString();
const Clock = class extends Date { constructor(...a) { super(...(a.length ? a : [NOW])); } static now() { return NOW; } };
const IN_FLIGHT = { started: ago(600), builder: 'claude', builder_model: 'opus', reviewer: 'codex', review_model: 'gpt-6.1-sol' };
const tickets = () => [
  full('0801', { title: 'A draft' }),
  T('0802', 'ready', { title: 'Queued', outcome: 'It is queued.' }),
  T('0803', 'building', { ...IN_FLIGHT, title: 'Building', build_running: true }),
  T('0804', 'reviewing', { ...IN_FLIGHT, title: 'Reviewing', build_running: true, self_check: 'no changes', rounds: [round(1, 10)], review_running: 1 }),
  T('0805', 'blocked', { ...IN_FLIGHT, title: 'Blocked', self_check: 'no changes', rounds: [{ ...round(1, 10), verdict: 'request_changes' }], blocked_question: 'Which one?' }),
  T('0806', 'approved', { ...IN_FLIGHT, title: 'Approved', auto_ship: false, auto_ship_why: 'auto_ship is off in speck/config.yml', approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], outcome: 'It is approved.', acceptance_criteria: ['First one.', 'Second one.'], criteria_passed: [1], priority: 1, size: 'M', risk: 'high' }),
  T('0807', 'approved', { ...IN_FLIGHT, title: 'Ships itself', auto_ship: true, auto_ship_why: '', approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)] }),
  T('0901', 'done', { ...IN_FLIGHT, title: 'Shipped', finished: ago(60), auto_ship: true, rounds: [round(1, 10)] }),
];
const page = async (extra = {}) => { const p = boardPage([{ run: { on: true }, ideas: [], tickets: tickets() }], { Date: Clock, confirm: () => true, ...extra }); await p.settle(); return p; };
const pane = p => p.byId('full-ticket');
const idOf = (p, n) => p.all(n).find(x => x.className === 'id')?._text;
// Opens the ticket's card and presses its Full ticket button, as the user does.
async function open(p, id) {
  const lists = [[() => items(p), n => top(n)], [() => queueRows(p), n => n.children[0]], [() => shippedRows(p), n => p.all(n).find(x => x.className === 'title')]];
  const [find, head] = lists.find(([f]) => f().some(n => idOf(p, n) === id));
  const card = () => find().find(n => idOf(p, n) === id);
  if (!/\bopen\b/.test(card().className)) { p.press(head(card())); await p.settle(); }
  p.press(p.all(card()).find(x => x.tagName === 'button' && x.textContent === 'Full ticket'));
  await p.settle();
}
const of = (p, cls, root = pane(p)) => p.all(root).find(n => (n.className || '').split(' ').includes(cls));
const allOf = (p, cls, root = pane(p)) => p.all(root).filter(n => (n.className || '').split(' ').includes(cls));
const button = (p, text) => p.all(pane(p)).find(n => n.tagName === 'button' && n.textContent === text);
const facts = p => Object.fromEntries(allOf(p, 'fact').map(c => [c.children[0].textContent, c.children[1].textContent]));
const track = p => allOf(p, 'step').map(s => [s.textContent, s.className.replace(/^step ?/, '')]);
const headings = p => p.all(pane(p)).filter(n => n.tagName === 'h4').map(n => n.textContent);

test('0583 AC1: the full view starts with a back link to its lane, its id at the right, a status pill and its title', async () => {
  const p = await page();
  await open(p, '0806');
  const top = pane(p).children[0];
  const back = of(p, 'close', top);
  assert.equal(back.attrs.role, 'link');
  assert.equal(back.textContent, 'Build', 'named for the lane it came from');
  assert.equal(back.attrs['aria-label'], 'Back to Build');
  assert.equal(of(p, 'id', top).textContent, '0806');
  assert.equal(of(p, 'state', top).textContent, 'approved');
  assert.equal(of(p, 'title', top).textContent, 'Approved');
  p.press(back);
  await p.settle();
  assert.equal(pane(p).hidden, true, 'and it goes back');
});

for (const [id, lane] of [['0801', 'Plan'], ['0802', 'Build'], ['0901', 'Shipped']]) {
  test(`0583 AC1: ${id}'s back link says ${lane}, the lane it came from`, async () => {
    const p = await page();
    await open(p, id);
    assert.equal(of(p, 'close', pane(p).children[0]).textContent, lane);
  });
}

for (const [id, tone, why] of [['0801', 'waits', 'a draft waits for you'], ['0805', 'waits', 'a blocked ticket'], ['0806', 'waits', 'approved, waiting for you to ship it'],
  ['0803', 'working', 'being built'], ['0804', 'working', 'being reviewed'], ['0802', '', 'queued'], ['0901', '', 'shipped'], ['0807', '', 'auto-ship will take it']]) {
  test(`0583 AC1: ${id}'s pill is ${tone || 'grey'}: ${why}`, async () => {
    const p = await page();
    await open(p, id);
    assert.equal(of(p, 'state', pane(p).children[0]).attrs?.['data-tone'] ?? '', tone);
  });
}

test('0583 AC1: the pill\'s colours are orange for waiting, blue for working and grey otherwise', () => {
  const rs = rules(), rule = s => rs.find(r => selectors(r).includes(s));
  assert.match(get(rule('#full-ticket .top .state'), 'color'), /--muted/);
  assert.match(get(rule('#full-ticket .top .state[data-tone="waits"]'), 'color'), /--needs-you-text/);
  assert.match(get(rule('#full-ticket .top .state[data-tone="working"]'), 'color'), /--run/); // 0577: the accent, as links have it
});

for (const [id, want] of [
  ['0801', [['Ready', 'waits'], ['Built', ''], ['Reviewed', ''], ['Ship', '']]],
  ['0802', [['Ready', 'done'], ['Built', ''], ['Reviewed', ''], ['Ship', '']]],
  ['0803', [['Ready', 'done'], ['Built', 'now'], ['Reviewed', ''], ['Ship', '']]],
  ['0804', [['Ready', 'done'], ['Built', 'done'], ['Reviewed', 'now'], ['Ship', '']]],
  ['0805', [['Ready', 'done'], ['Built', 'done'], ['Reviewed', 'waits'], ['Ship', '']]],
  ['0806', [['Ready', 'done'], ['Built', 'done'], ['Reviewed', 'done'], ['Ship', 'waits']]],
  ['0807', [['Ready', 'done'], ['Built', 'done'], ['Reviewed', 'done'], ['Ship', 'now']]],
  ['0901', [['Ready', 'done'], ['Built', 'done'], ['Reviewed', 'done'], ['Ship', 'done']]],
]) {
  test(`0583 AC2: ${id}'s four bars are filled up to where it is`, async () => {
    const p = await page();
    await open(p, id);
    assert.deepEqual(track(p), want);
  });
}

test('0583 AC2: the bars are four across, filled in the accent, and orange for a step that waits for you', () => {
  const rs = rules(), rule = s => rs.find(r => selectors(r).includes(s));
  assert.match(get(rule('#full-ticket .track'), 'grid-template-columns'), /repeat\(4,/);
  assert.match(get(rule('#full-ticket .track .step.done'), 'border-top-color'), /--blue/); // 0577: the accent
  assert.match(get(rule('#full-ticket .track .step.waits'), 'border-top-color'), /--needs-you/);
});

test('0583 AC3: its facts are a two-column grid of priority, size, risk, shipping, builder and reviewer', async () => {
  const p = await page();
  await open(p, '0806');
  const { Type, ...six } = facts(p); // 0585: a Build ticket's has its type too
  assert.equal(Type, 'code');
  assert.deepEqual(six, { Priority: 'P1', Size: 'M', Risk: 'high', 'Ships by itself': 'No · auto_ship is off in speck/config.yml', Builder: 'Claude · opus', Reviewer: 'Codex · gpt-6.1-sol' });
  assert.match(get(rules().find(r => selectors(r).includes('#full-ticket .facts')), 'grid-template-columns'), /repeat\(2,/);
});

test('0583 AC3: one that ships by itself says yes; with speck run off, it says why it won\'t', async () => {
  const p = await page();
  await open(p, '0807');
  assert.equal(facts(p)['Ships by itself'], 'Yes');
  const off = boardPage([{ run: { on: false }, ideas: [], tickets: tickets() }], { Date: Clock });
  await off.settle();
  await open(off, '0807');
  assert.equal(facts(off)['Ships by itself'], 'No · Auto-build is off');
});

test('0583 AC3: a board without the fields shows dashes rather than failing', async () => {
  const p = boardPage([{ run: { on: true }, ideas: [], tickets: [T('0810', 'ready', { auto_ship: undefined, builder: '', reviewer: '' })] }], { Date: Clock });
  await p.settle();
  await open(p, '0810');
  assert.deepEqual([facts(p)['Ships by itself'], facts(p).Builder, facts(p).Reviewer], ['–', '–', '–']);
});

test('0583 AC3: speck status --json gives why it won\'t ship by itself and which criteria the reviewer passed', () => {
  const r = panelRepo();
  const cfg = `${r.dir}/speck/config.yml`;
  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^auto_ship:.*$/m, 'auto_ship: false'));
  const body = fs.readFileSync(r.file, 'utf8');
  const verdict = { verdict: 'request_changes', criteria: [{ id: 1, status: 'pass', evidence: 'x' }, { id: 2, status: 'fail', evidence: 'y' }, { id: 'constructor', status: 'pass', evidence: 'z' }] };
  const first = { meta: { round: 1, reviewer: 'codex' }, verdict: { ...verdict, criteria: [{ id: 2, status: 'pass', evidence: 'earlier' }] } };
  const block = o => `<details><summary>round</summary>\n\n\`\`\`json\n${JSON.stringify(o)}\n\`\`\`\n\n</details>\n`;
  fs.writeFileSync(r.file, `${body}\n## Review rounds\n\n${block(first)}${block({ meta: { round: 2, reviewer: 'codex' }, verdict })}`);
  const row = JSON.parse(r.run('status', '--json').stdout).tickets.find(t => t.id === '0001');
  assert.equal(row.auto_ship, false);
  assert.equal(row.auto_ship_why, 'auto_ship is off in speck/config.yml');
  assert.deepEqual(row.criteria_passed, [1], 'from the latest round only, and only whole numbers');
});

test('0583 AC4: its outcome, then its criteria with a tick on each one passed, then rows for its review pack and build log', async () => {
  const p = await page();
  await open(p, '0806');
  assert.deepEqual(headings(p).slice(0, 2), ['Outcome', 'Acceptance criteria']);
  const body = pane(p).children[2], kids = body.children, at = n => kids.indexOf(n);
  const list = of(p, 'criteria', body), rows = of(p, 'pane-rows', body);
  assert.ok(at(list) < at(rows), 'the rows come after the criteria');
  const [a, b] = list.children;
  assert.equal(of(p, 'tick', a).attrs['aria-label'], 'Passed by the reviewer');
  assert.equal(of(p, 'tick', b), undefined, 'none on one it did not pass');
  assert.deepEqual(rows.children.map(n => n.textContent), ['Review pack', 'Build log']);
});

test('0583 AC4: the ticket\'s other sections stay, after the rows', async () => {
  const p = await page();
  await open(p, '0801');
  assert.deepEqual(headings(p), ['Ready check', 'Outcome', 'Acceptance criteria', 'Problem', 'Out of scope', 'Notes']); // a draft's readiness list first
});

test('0583 AC4: a ticket with nothing to open yet has no rows', async () => {
  const p = await page();
  await open(p, '0802');
  assert.equal(of(p, 'pane-rows'), undefined);
});

test('0583 AC4: the Review pack row opens the pack, and closing the pack comes back to the full view', async () => {
  const p = await page();
  await open(p, '0806');
  p.press(button(p, 'Review pack'));
  await p.settle();
  assert.equal(of(p, 'title', pane(p).children[0]).textContent, 'Review pack');
  p.press(button(p, 'Close'));
  await p.settle();
  assert.equal(pane(p).hidden, false, 'the pane stays open');
  assert.equal(of(p, 'title', pane(p).children[0]).textContent, 'Approved', 'on the full view');
});

test('0583 AC4: the Build log row loads and shows the log, even with the card closed, and the focus comes back to it', async () => {
  const asked = [];
  const body = url => (/\/log$/.test(url) ? { text: '10:00:00 built it', truncated: false, build: 1, at: 1 } : { run: { on: true }, ideas: [], tickets: tickets() });
  const p = boardPage([], { Date: Clock, fetch: async url => { asked.push(String(url)); const b = JSON.parse(JSON.stringify(body(String(url)))); return { ok: true, status: 200, json: async () => b }; } });
  await p.settle();
  await open(p, '0806');
  p.press(button(p, 'Build log'));
  await p.settle();
  const pop = p.byId('foreman');
  assert.equal(pop.hidden, false);
  assert.ok(asked.some(u => u.endsWith('/0806/log')), 'its log was asked for');
  assert.match(pop.textContent, /built it/);
  assert.equal(pane(p).inert, true, 'the full view behind it can\'t be reached');
  p.key('Escape');
  await p.settle();
  assert.equal(pop.hidden, true);
  assert.equal(pane(p).hidden, false, 'Escape closed only the log');
  assert.equal(pane(p).inert, false);
  });

test('0583 AC4: an approved ticket has a bar with Ask for changes and Ship; nothing else does', async () => {
  const p = await page();
  await open(p, '0806');
  const bar = of(p, 'ship-bar', pane(p));
  assert.equal(pane(p).children[pane(p).children.length - 1], bar, 'the last thing in the view');
  assert.deepEqual(p.all(bar).filter(n => n.tagName === 'button').map(n => n.textContent), ['Ask for changes', 'Ship']);
  for (const id of ['0802', '0803', '0805', '0901']) {
    const q = await page();
    await open(q, id);
    assert.equal(of(q, 'ship-bar'), undefined, `${id} has none`);
  }
});

test('0583 AC4: the bar is fixed to the bottom, and its Ship is in the accent colour', () => {
  const rs = rules(), rule = s => rs.filter(r => selectors(r).includes(s)).pop();
  const bar = rule('#full-ticket .ship-bar');
  assert.equal(get(bar, 'position'), 'sticky');
  assert.equal(get(bar, 'bottom'), '0');
  assert.match(get(rule('#full-ticket .ship-bar .ship'), 'background'), /--blue/); // 0577: the accent
});

test('0583 AC4: the folded note box really is hidden, though the box is a block', () => {
  const r = rules().find(x => selectors(x).includes('#full-ticket .ship-bar .changes-note[hidden]'));
  assert.equal(get(r, 'display'), 'none');
});

test('0583 AC4: Ship in the bar asks first, then ships it', async () => {
  const posted = [];
  const body = () => ({ run: { on: true }, ideas: [], tickets: tickets() });
  const p = boardPage([], { Date: Clock, confirm: () => true, fetch: async (url, o) => { if (o && o.method === 'POST') { posted.push(String(url)); return { ok: true, status: 200, json: async () => ({ message: 'Shipped it.' }) }; } const b = JSON.parse(JSON.stringify(body())); return { ok: true, status: 200, json: async () => b }; } });
  await p.settle();
  await open(p, '0806');
  p.press(p.all(of(p, 'ship-bar')).find(n => n.textContent === 'Ship' && n.tagName === 'button'));
  await p.settle();
  assert.deepEqual(posted, ['/api/tickets/0806/ship']);
  assert.match(of(p, 'ship-bar').textContent, /Shipped it\./, 'what speck ship said shows in the bar');
});

test('0583 AC4: Ask for changes unfolds a note box, and only sends once there is a note', async () => {
  const posted = [];
  const body = () => ({ run: { on: true }, ideas: [], tickets: tickets() });
  const p = boardPage([], { Date: Clock, fetch: async (url, o) => { if (o && o.method === 'POST') { posted.push([String(url), o.body]); return { ok: true, status: 200, json: async () => ({ message: 'Sent.' }) }; } const b = JSON.parse(JSON.stringify(body())); return { ok: true, status: 200, json: async () => b }; } });
  await p.settle();
  await open(p, '0806');
  const ask = () => p.all(of(p, 'ship-bar')).find(n => n.tagName === 'button' && n.textContent === 'Ask for changes');
  const box = () => of(p, 'changes-note');
  assert.equal(box().hidden, true, 'folded at first');
  p.press(ask());
  await p.settle();
  assert.equal(box().hidden, false, 'pressing it unfolds the box');
  assert.deepEqual(posted, [], 'and sends nothing');
  p.press(ask());
  await p.settle();
  assert.equal(box().hidden, true, 'pressed again with no note, it folds away');
  p.press(ask());
  box().value = 'Please rename it';
  box().listeners.input();
  p.press(ask());
  await p.settle();
  assert.equal(posted.length, 1);
  assert.equal(posted[0][0], '/api/tickets/0806/changes');
  assert.equal(JSON.parse(posted[0][1]).note, 'Please rename it');
});
