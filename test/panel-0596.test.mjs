import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0596: the bridge, every project at once.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, page, fakePage } from './support/panel.mjs';
import { projectSummary, speckMood } from '../scripts/panel-summary.mjs';

const NOW = Date.parse('2026-11-09T12:00:00Z'), DAY = 864e5;
const ago = days => new Date(NOW - days * DAY).toISOString();
const foreman = (o = {}) => ({ word: 'Idle', tone: 'idle', mood: 'watching', building: [], ready: [], held: [], ship: { running: null, waiting: [] }, blocked: [], took: [], ...o });
const list = (self = 4777, names = ['speck', 'alpha']) => ({ self, list: names.map((name, i) => ({ port: 4777 + i, name })) });
const board = (projects, o = {}) => ({ tickets: [T('0001', 'building')], ideas: [], run: { on: true, pid: 1 }, foreman: foreman(), ...(projects ? { projects } : {}), ...o });
const summary = (port, name, o = {}) => ({ port, name, running: true, status: 'Idle', tone: 'idle', mood: 'watching', busy: false, building: 0, queued: 0, needs_you: 0, needs: [], shipped_week: 0, spent_week_usd: null, spent_week_unknown: false, build_minutes: [], ...o });
const two = { self: 4777, projects: [
  summary(4777, 'speck', { status: 'Building 2', mood: 'focused', busy: true, building: 2, queued: 1, shipped_week: 3, spent_week_usd: 1.5, build_minutes: [10, 30] }),
  summary(4778, 'alpha', { status: 'Needs you 2', mood: 'asking', busy: true, building: 1, needs_you: 2, shipped_week: 4, spent_week_usd: 2.25, build_minutes: [20],
    needs: [{ id: '0007', title: 'Pick a colour', why: 'question', detail: 'Blue or green?\nMore words.' }, { id: '0009', title: 'Risky move', why: 'high_risk', detail: '' }] }),
] };
const nodes = (n, out = []) => { out.push(n); for (const c of n.children || []) nodes(c, out); return out; };
const within = (p, cls) => nodes(p.byId('bridge')).filter(n => String(n.className || '').split(' ').includes(cls));
// The page with the bridge open; `then` are the answers to its next requests.
const opened = async (body = two, globals, st = board(list()), then = []) => {
  const p = fakePage([st, body, ...then], globals);
  await p.settle();
  p.byId('bridge-open').listeners.click({ stopPropagation() {} });
  await p.settle();
  return p;
};
const press = n => n.listeners.click({ stopPropagation() {} });
const storage = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m }; };

// ---------- the summary each panel gives of itself ----------

test('0596 AC2: a summary gives speck\'s mood there, whether it is busy, and its latest build times', () => {
  const tickets = [
    T('0001', 'done', { started: ago(2), approved: new Date(NOW - 2 * DAY + 600000).toISOString(), finished: ago(1) }),
    T('0002', 'done', { started: ago(3), finished: new Date(NOW - 3 * DAY + 1200000).toISOString(), waited_seconds: 600 }),
    T('0003', 'done', { started: null, finished: ago(1) }),
    T('0004', 'building'),
  ];
  const f = foreman(), run = { on: true }, s = projectSummary({ board: { tickets }, foreman: f, run, now: NOW });
  assert.equal(s.mood, 'focused');
  assert.equal(s.mood, speckMood({ board: { tickets }, foreman: f, run, now: NOW }), 'the mood the panel\'s own bar has');
  assert.equal(s.busy, true);
  assert.deepEqual(s.build_minutes, [10, 10], 'to approval, less the wait; a ticket with no start left out');
  const idle = projectSummary({ board: { tickets: [] }, foreman: f, run: { on: false }, now: NOW });
  assert.equal(idle.mood, 'asleep');
  assert.equal(idle.busy, false);
  assert.deepEqual(idle.build_minutes, []);
});

test('0596 AC2: a project with work but nothing building or reviewing, such as a ticket shipping, counts as busy', () => {
  const s = projectSummary({ board: { tickets: [T('0001', 'done', { ship: { running: true } })] }, foreman: foreman(), run: { on: true }, now: NOW });
  assert.equal(s.building, 0);
  assert.equal(s.busy, true);
});

test('0596 AC2: build times are capped at each project\'s latest 20', () => {
  const tickets = Array.from({ length: 25 }, (_, i) => T(String(i + 1).padStart(4, '0'), 'done', { started: ago(i + 2), finished: ago(i + 1) }));
  assert.equal(projectSummary({ board: { tickets }, foreman: foreman(), run: { on: true }, now: NOW }).build_minutes.length, 20);
});

// ---------- the menu offers it ----------

test('0596 AC1: with two or more panels running the bar offers All projects, and with one it does not', async () => {
  const p = fakePage([board(list())]);
  await p.settle();
  assert.equal(p.byId('bridge-open').hidden, false);
  const one = fakePage([board(null)]);
  await one.settle();
  assert.equal(one.byId('bridge-open').hidden, true);
  assert.match(page(), /id="bridge-open"[^>]*>All projects</, 'it says All projects');
  assert.match(page(), /id="bridge"[^>]*hidden/, 'the bridge starts closed');
});

test('0596 AC1: while the project shown has stopped, it is offered only with two or more panels still running', async () => {
  const gone = names => ({ port: 4777, list: names.map((name, i) => ({ port: 4778 + i, name })) });
  const sources = [];
  class Source { constructor() { this.on = {}; sources.push(this); } addEventListener(t, f) { this.on[t] = f; } close() {} }
  const p = fakePage([board(list())], { EventSource: Source });
  await p.settle();
  sources[0].on.gone({ data: JSON.stringify(gone(['alpha'])) });
  assert.equal(p.byId('bridge-open').hidden, true, 'one left');
  sources[0].on.gone({ data: JSON.stringify(gone(['alpha', 'site'])) });
  assert.equal(p.byId('bridge-open').hidden, false, 'two left');
});

test('0596 AC1: All projects opens the bridge from this address\'s summary, and Back and Escape close it', async () => {
  const p = await opened();
  assert.equal(p.byId('bridge').hidden, false);
  const call = p.calls.find(c => c.url === '/api/projects/summary');
  assert.ok(call, 'it asks for the summary');
  assert.equal(call.opts.method, 'POST');
  press(within(p, 'back')[0]);
  assert.equal(p.byId('bridge').hidden, true, 'the back link closes it');
  p.byId('bridge-open').listeners.click({ stopPropagation() {} });
  p.key('Escape');
  assert.equal(p.byId('bridge').hidden, true, 'and so does Escape');
});

test('0596 AC1: the bridge keeps up while open, and stops asking once closed', async () => {
  const p = await opened();
  const asks = () => p.calls.filter(c => c.url === '/api/projects/summary').length;
  assert.equal(asks(), 1);
  assert.equal(p.intervals.size >= 1, true);
  const poll = [...p.intervals.values()].find(i => i.ms === 5000);
  assert.ok(poll, 'it asks again every 5 seconds');
  press(within(p, 'back')[0]);
  assert.equal([...p.intervals.values()].some(i => i.ms === 5000), false, 'closing it stops the asking');
});

// ---------- its bar ----------

test('0596 AC2: the bar has speck in the busiest mood, the counts and the three tiles', async () => {
  const p = await opened();
  const bar = within(p, 'bridge-bar')[0], face = nodes(bar).find(n => n.tagName === 'svg');
  assert.equal(face.attrs['data-mood'], 'asking', 'needing you is the busiest');
  assert.equal(within(p, 'bridge-counts')[0].textContent, '3 building · 2 projects busy · 2 need you');
  const tiles = within(p, 'bridge-tile').map(t => t.textContent);
  assert.deepEqual(tiles, ['7shipped this week', '20 minmedian build time', '$3.75spend this week']);
});

test('0596 AC2: the moods rank asking, focused, watching, asleep, and a panel not answering counts for nothing', async () => {
  const of = moods => ({ self: 4777, projects: moods.map((mood, i) => summary(4777 + i, `p${i}`, { mood })) });
  const shown = async body => nodes(within(await opened(body), 'bridge-bar')[0]).find(n => n.tagName === 'svg').attrs['data-mood'];
  assert.equal(await shown(of(['asleep', 'focused', 'watching'])), 'focused');
  assert.equal(await shown(of(['asleep', 'watching'])), 'watching');
  assert.equal(await shown(of(['asleep', 'asleep'])), 'asleep');
  assert.equal(await shown({ self: 4777, projects: [summary(4777, 'a', { mood: 'watching' }), { port: 4778, name: 'b', running: false }] }), 'watching');
});

test('0596 AC2: counts read properly in the singular and at nothing, and tiles with no figures show a dash', async () => {
  const p = await opened({ self: 4777, projects: [summary(4777, 'a', { building: 1, busy: true, needs_you: 1, needs: [{ id: '1', title: 't', why: 'ship', detail: '' }] }), { port: 4778, name: 'b', running: false }] });
  assert.equal(within(p, 'bridge-counts')[0].textContent, '1 building · 1 project busy · 1 needs you');
  const q = await opened({ self: 4777, projects: [summary(4777, 'a'), summary(4778, 'b')] });
  assert.equal(within(q, 'bridge-counts')[0].textContent, '0 building · 0 projects busy · Nothing needs you');
  assert.deepEqual(within(q, 'bridge-tile').map(t => t.textContent), ['0shipped this week', '–median build time', '$0.00spend this week']);
});

test('0596 AC2: spend with an unknown cost says so rather than pass for the whole figure', async () => {
  const p = await opened({ self: 4777, projects: [summary(4777, 'a', { spent_week_usd: 2, spent_week_unknown: true }), summary(4778, 'b', { spent_week_usd: null, spent_week_unknown: true })] });
  assert.equal(within(p, 'bridge-tile')[2].textContent, '$2.00+spend this week');
  assert.deepEqual(within(p, 'bridge-spend').map(n => n.textContent), ['$2.00+', '–']);
});

test('0596 AC2: the median is taken over every project\'s build times together', async () => {
  const p = await opened({ self: 4777, projects: [summary(4777, 'a', { build_minutes: [1, 2, 3] }), summary(4778, 'b', { build_minutes: [100] })] });
  assert.equal(within(p, 'bridge-tile')[1].textContent, '3 minmedian build time', 'the mean of 2 and 3, rounded; not a median of medians');
});

// ---------- needs you ----------

test('0596 AC3: each item is a card with its project, id and why, its title and a one-line reason', async () => {
  const p = await opened();
  const cards = within(p, 'bridge-card');
  assert.equal(cards.length, 2);
  assert.deepEqual(within(p, 'bridge-where').map(n => n.textContent), ['alpha · 0007 · Question', 'alpha · 0009 · High risk']);
  assert.deepEqual(within(p, 'bridge-title').map(n => n.textContent), ['Pick a colour', 'Risky move']);
  assert.deepEqual(within(p, 'bridge-reason').map(n => n.textContent), ['Blue or green? More words.', 'High risk, so it\'s waiting for you at Ship.']);
  assert.equal(cards[0].tagName, 'button');
});

test('0596 AC3: every reason has words, and a project\'s name is told apart by port when two share it', async () => {
  const need = (id, why, detail = '') => ({ id, title: 't', why, detail });
  const p = await opened({ self: 4777, projects: [summary(4777, 'a', { needs: [need('1', 'question'), need('2', 'ship'), need('3', 'manager', 'Which?')] }), summary(4778, 'a')] });
  assert.deepEqual(within(p, 'bridge-reason').map(n => n.textContent), ['Blocked, waiting for your answer.', 'Approved, and waiting for you at Ship.', 'Which?']);
  assert.deepEqual(within(p, 'bridge-where').map(n => n.textContent), ['a · 4777 · 1 · Question', 'a · 4777 · 2 · At Ship', 'a · 4777 · 3 · Engineering manager']);
  assert.deepEqual(within(p, 'bridge-name').map(n => n.textContent), ['a · 4777', 'a · 4778']);
});

test('0596 AC3: with nothing needing you, the section says so', async () => {
  const p = await opened({ self: 4777, projects: [summary(4777, 'a'), summary(4778, 'b')] });
  assert.equal(within(p, 'bridge-card').length, 0);
  assert.equal(within(p, 'bridge-none')[0].textContent, 'Nothing needs you.');
});

test('0596 AC3: pressing a card switches to its project and keeps the ticket to open there', async () => {
  const s = storage(), reloads = [];
  const p = await opened(two, { sessionStorage: s, location: { reload: () => reloads.push(1) } }, board(list()), [{ ok: true }]);
  const card = within(p, 'bridge-card')[0];
  const before = p.calls.length;
  await press(card);
  await p.settle();
  assert.equal(p.calls[before].url, '/api/projects/4778');
  assert.equal(p.calls[before].opts.method, 'POST');
  assert.deepEqual(JSON.parse(s.m.get('speck-open-ticket')), { port: 4778, id: '0007' });
  assert.equal(reloads.length, 1, 'and the page reloads, as the chosen project\'s');
});

test('0596 AC3: the page reached that way opens the ticket, once', async () => {
  const s = storage();
  s.setItem('speck-open-ticket', JSON.stringify({ port: 4778, id: '0007' }));
  const p = fakePage([board(list(4778), { tickets: [T('0007', 'blocked', { title: 'Pick a colour' })] })], { sessionStorage: s });
  await p.settle();
  assert.equal(p.byId('full-ticket').hidden, false, 'the ticket is open');
  assert.equal(s.m.has('speck-open-ticket'), false, 'and it won\'t open again');
});

test('0596 AC3: a ticket asked for by another project or no longer on the board opens nothing, and is forgotten', async () => {
  for (const asked of [{ port: 9999, id: '0007' }, { port: 4778, id: '0404' }]) {
    const s = storage();
    s.setItem('speck-open-ticket', JSON.stringify(asked));
    const p = fakePage([board(list(4778), { tickets: [T('0007', 'blocked')] })], { sessionStorage: s });
    await p.settle();
    assert.equal(p.byId('full-ticket').hidden, true);
    assert.equal(s.m.has('speck-open-ticket'), false);
  }
  const s = storage();
  s.setItem('speck-open-ticket', 'not json{');
  const p = fakePage([board(list(4778))], { sessionStorage: s });
  await p.settle();
  assert.equal(s.m.has('speck-open-ticket'), false, 'a garbled one goes too');
});

test('0596 AC3: a card for the project already shown opens its ticket without switching', async () => {
  const st = board(list(4778), { tickets: [T('0007', 'blocked', { title: 'Pick a colour' })] });
  const p = await opened(two, {}, st);
  const before = p.calls.length;
  press(within(p, 'bridge-card')[0]);
  await p.settle();
  assert.equal(p.calls.slice(before).some(c => /^\/api\/projects\/\d+$/.test(c.url)), false, 'no switch');
  assert.equal(p.byId('bridge').hidden, true);
  assert.equal(p.byId('full-ticket').hidden, false);
});

test('0596 AC3: a switch that fails closes the bridge so its message shows, and forgets the ticket', async () => {
  const s = storage(), answers = [board(list()), two, { status: 404, body: { error: 'Gone.' } }];
  const p = fakePage(answers, { sessionStorage: s });
  await p.settle();
  p.byId('bridge-open').listeners.click({ stopPropagation() {} });
  await p.settle();
  press(within(p, 'bridge-card')[0]);
  await p.settle();
  assert.equal(p.byId('bridge').hidden, true);
  assert.equal(p.byId('offline').hidden, false);
  assert.match(p.byId('offline').textContent, /Gone\./);
  assert.equal(s.m.has('speck-open-ticket'), false);
});

// ---------- projects ----------

test('0596 AC4: each project is a row with a dot for its state, its name, what it is doing and needs, and its spend', async () => {
  const p = await opened();
  const rows = within(p, 'bridge-row');
  assert.equal(rows.length, 2);
  assert.deepEqual(within(p, 'bridge-name').map(n => n.textContent), ['speck', 'alpha']);
  assert.deepEqual(within(p, 'bridge-line').map(n => n.textContent), ['Building 2 · 1 queued', 'Building 1 · 2 need you']);
  assert.deepEqual(within(p, 'bridge-spend').map(n => n.textContent), ['$1.50', '$2.25']);
  assert.deepEqual(within(p, 'bridge-dot').map(n => n.className), ['bridge-dot busy', 'bridge-dot needs']);
  assert.equal(rows[0].tagName, 'button');
});

test('0596 AC4: a quiet project says its status, and one that doesn\'t answer says so', async () => {
  const p = await opened({ self: 4777, projects: [summary(4777, 'a', { status: 'Off', mood: 'asleep' }), summary(4778, 'b', { status: 'Needs you 1', needs_you: 1 }), { port: 4779, name: 'c', running: false }] });
  assert.deepEqual(within(p, 'bridge-line').map(n => n.textContent), ['Off', '1 needs you', 'Not answering']);
  assert.deepEqual(within(p, 'bridge-dot').map(n => n.className), ['bridge-dot quiet', 'bridge-dot needs', 'bridge-dot gone']);
  assert.deepEqual(within(p, 'bridge-spend').map(n => n.textContent), ['$0.00', '$0.00', '']);
});

test('0596 AC4: pressing a row switches to that project; the one already shown just closes', async () => {
  const p = await opened();
  const rows = within(p, 'bridge-row');
  const before = p.calls.length;
  press(rows[0]);
  await p.settle();
  assert.equal(p.calls.slice(before).some(c => /^\/api\/projects\/\d+$/.test(c.url)), false);
  assert.equal(p.byId('bridge').hidden, true, 'this project: back to it');
  const q = await opened(two, { location: { reload() {} } }, board(list()), [{ ok: true }]);
  const at = q.calls.length;
  press(within(q, 'bridge-row')[1]);
  await q.settle();
  assert.equal(q.calls[at].url, '/api/projects/4778');
});

test('0596 AC4: a project whose port isn\'t a port gets no row to press', async () => {
  const p = await opened({ self: 4777, projects: [summary('../evil', 'x'), summary(4778, 'b')] });
  assert.deepEqual(within(p, 'bridge-name').map(n => n.textContent), ['b']);
});

// ---------- when it goes wrong ----------

test('0596: a failed read says so, and the last figures stay', async () => {
  const answers = [board(list()), { status: 403, body: { error: 'Forbidden.' } }];
  const p = fakePage(answers);
  await p.settle();
  p.byId('bridge-open').listeners.click({ stopPropagation() {} });
  await p.settle();
  assert.match(within(p, 'bridge-error')[0].textContent, /Forbidden\./);
});

test('0596: odd answers draw nothing rather than break', async () => {
  for (const body of [{}, { projects: 'x' }, { projects: [null, 7, { port: 1 }] }]) {
    const p = await opened(body);
    assert.equal(p.byId('bridge').hidden, false);
    assert.equal(within(p, 'bridge-card').length, 0);
  }
});

test('0596: a why it doesn\'t know, even a built-in name, still reads as needing you', async () => {
  const p = await opened({ self: 4777, projects: [summary(4777, 'a', { needs: [{ id: '1', title: 't', why: 'constructor', detail: '' }] })] });
  assert.equal(within(p, 'bridge-where')[0].textContent, 'a · 1 · Needs you');
  assert.equal(within(p, 'bridge-reason')[0].textContent, '');
});

test('0596: the page behind is held while the bridge is open, and let go before the focus returns to it', async () => {
  const behind = [{ inert: false }, { inert: false }], classes = new Set();
  const p = fakePage([board(list()), two, board(list())], { scrollX: 0, scrollY: 0, scrollTo() {} });
  p.document.documentElement = { classList: { toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)) } };
  p.document.querySelectorAll = () => behind;
  await p.settle();
  let inertAtFocus = null;
  p.byId('bridge-open').focus = () => { inertAtFocus = behind[0].inert; };
  p.byId('bridge-open').listeners.click({ stopPropagation() {} });
  await p.settle();
  assert.equal(classes.has('held'), true, 'held as it opens');
  assert.deepEqual(behind.map(n => n.inert), [true, true]);
  for (const t of p.timers.splice(0)) t();
  await p.settle();
  assert.equal(classes.has('held'), true, 'and through a new board');
  press(within(p, 'back')[0]);
  assert.equal(classes.has('held'), false, 'let go as it closes');
  assert.deepEqual(behind.map(n => n.inert), [false, false]);
  assert.equal(inertAtFocus, false, 'before the focus returns to the header');
});

test('0596: while the bridge is open the lanes hold still', async () => {
  const p = await opened();
  p.key('ArrowRight');
  assert.equal(p.byId('tab-build').attrs['aria-selected'], 'true');
});
