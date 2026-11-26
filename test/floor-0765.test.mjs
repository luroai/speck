import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0765: the factory floor at speck serve's address: its page at /floor, the answer at /api/floor it reads its stations
// and the chosen project's board from, gathered from each project's own panel, and the page drawing them, checked on
// fakePage's DOM. How it lays out at a window's width is checked in a real browser (floor-browser-0765.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, T, round, fakePage, stoppedClock, deferred } from './support/panel.mjs';
import { panelsHere, standInPanel, ask, cookieOf } from './support/serve-front.mjs';
import { floorPage, floorPanel, floorFront, storage, summary, board } from './support/floor.mjs';
import { shippedDays, stationKey, floorBoards, floorAnswer } from '../scripts/serve-floor.mjs';
import { SpeckError } from '../scripts/core.mjs';

// ---------- the page's nodes on fakePage's DOM ----------

const nodes = (n, out = []) => { out.push(n); for (const c of n.children || []) nodes(c, out); return out; };
const classes = n => String(n.className || '').split(' ');
const byClass = (root, cls) => nodes(root).filter(n => classes(n).includes(cls));
const textOf = (root, cls) => { const n = byClass(root, cls)[0]; return n ? n.textContent : null; };
const stationsOf = p => byClass(p.byId('stations'), 'station');
const lanesOf = p => byClass(p.byId('lanes'), 'lane');
const figuresOf = s => byClass(s, 'figure').map(f => [textOf(f, 'figure-label'), textOf(f, 'figure-n')]);
const toneOf = n => ['moving', 'needs', 'still', 'shipped', 'gone'].find(t => classes(n).includes(t)) || null;
const cardsOf = lane => byClass(lane, 'card').map(c => [textOf(c, 'card-id'), textOf(c, 'card-title'), toneOf(c), textOf(c, 'card-detail')]);
const press = n => n.listeners.click({ stopPropagation() {}, preventDefault() {} });
const pollOf = p => [...p.intervals.values()].find(i => i.ms <= 5000);

// ---------- what /api/floor answers, for the page ----------

const KEYS = { alpha: 'a1a1a1a1a1a1', bravo: 'b2b2b2b2b2b2', charlie: 'c3c3c3c3c3c3' };
const station = (n, name, o = {}) => ({ ...summary(), key: KEYS[name], n, name, port: 4800 + n, running: true, shipped_days: new Array(14).fill(0), ...o });
const answer = (o = {}) => ({
  stations: [
    station(1, 'alpha', { status: 'Building 2', tone: 'ok', busy: true, building: 2, queued: 3, shipped_week: 4, shipped_days: [0, 1, 0, 0, 2, 0, 0, 0, 1, 0, 0, 3, 0, 1] }),
    station(2, 'bravo', { status: 'Needs you 1', tone: 'bad', mood: 'asking', needs_you: 1, shipped_week: 1 }),
    { key: KEYS.charlie, n: 3, name: 'charlie', port: null, running: false, shipped_days: null },
  ],
  chosen: KEYS.alpha, board_name: 'alpha-1', board: board(), ...o });

// A stopped clock: 26 Nov 2026, 15:30 on this machine's clock, as the page's.
const NOW = new Date(2026, 10, 26, 15, 30).getTime();
const at = (daysAgo, h, m = 0) => new Date(2026, 10, 26 - daysAgo, h, m).toISOString();
// bravo's board: a card in every lane, and some that belong in none.
const bravoBoard = () => board({
  tickets: [
    T('0010', 'draft'),
    T('0011', 'draft', { type: 'bug', priority: 1, size: 'M', risk: 'high', after: ['0010'], waiting_on: ['0010'] }),
    T('0020', 'building', { started: at(0, 15, 0) }),
    T('0021', 'blocked', { started: at(0, 14, 0), blocked_question: 'Blue or green?' }),
    T('0022', 'ready'),
    T('0023', 'ready', { after: ['0020'], waiting_on: ['0020'] }),
    T('0030', 'done', { started: at(0, 9, 0), approved: at(0, 9, 25), finished: at(0, 9, 30), rounds: [round(1, 100), round(2, 50)] }),
    T('0031', 'done', { started: at(1, 13, 0), approved: at(1, 13, 12), finished: at(1, 14, 0), rounds: [round(1, 10)] }),
    T('0040', 'cancelled'),
  ],
  ideas: [
    { path: 'speck/ideas/2026-11-20-paint-the-shed.md', title: 'Paint the shed', status: 'idea', body: '# Paint the shed\n\nCaptured: 2026-11-20 10:00 · Status: idea\n' },
    { path: 'speck/ideas/2026-11-21-steady-a-test.md', title: 'Steady a test', status: 'inbox', body: '# Steady a test\n\nCaptured: 2026-11-21 09:00 · Status: inbox\nFrom ticket: 0712\nRaised by: agent\n' },
    { path: 'speck/ideas/2026-11-22-made-a-ticket.md', title: 'Made a ticket', status: 'ticketed: 0010', body: 'Captured: 2026-11-22 · Status: ticketed: 0010\n' },
    { path: 'speck/ideas/2026-11-23-dropped.md', title: 'Dropped one', status: 'dropped', body: 'Captured: 2026-11-23 · Status: dropped\n' },
  ],
});

// ---------- AC1: the page at /floor, and All projects' link to it ----------

test('0765 AC1: /floor at speck serve\'s address opens the factory floor, its files and typefaces from the address itself', async t => {
  const f = await floorFront(t, panelsHere(), () => []);
  const page = await ask(f.port, { pathName: '/floor' });
  assert.equal(page.status, 200, page.body);
  assert.match(page.headers['content-type'], /^text\/html; charset=utf-8/);
  assert.match(page.body, /<title>speck · Factory floor<\/title>/);
  const links = [...page.body.matchAll(/<(?:link|script)\b[^>]*?\s(?:href|src)="([^"]*)"/g)].map(m => m[1]);
  for (const file of ['floor.css', 'panel-model.js', 'floor.js']) assert.ok(links.includes(file), `the page loads ${file}`);
  assert.deepEqual(links.filter(l => /^(?:[a-z]+:|\/)/i.test(l)), [], 'each from beside the page, none from another host');
  for (const [file, type] of [['floor.css', /^text\/css/], ['floor.js', /^text\/javascript/], ['panel-model.js', /^text\/javascript/]]) {
    const r = await ask(f.port, { pathName: `/${file}` });
    assert.equal(r.status, 200, file);
    assert.match(r.headers['content-type'], type, file);
    assert.equal(r.body, fs.readFileSync(path.join(ROOT, 'templates', file), 'utf8'), `${file}: the file itself`);
  }
  // Its stylesheet names only the panel's own typefaces, which the address serves, and nothing from the network.
  const css = fs.readFileSync(path.join(ROOT, 'templates', 'floor.css'), 'utf8');
  const urls = [...css.matchAll(/url\(\s*["']?([^"')]*)["']?\s*\)/gi)].map(m => m[1]);
  assert.ok(urls.length > 0, 'it names typefaces');
  for (const u of urls) {
    assert.match(u, /^fonts\/(?:Inter|JetBrainsMono)-\d00\.woff2$/, u);
    const r = await ask(f.port, { pathName: `/${u}` });
    assert.equal(r.status, 200, u);
    assert.equal(r.headers['content-type'], 'font/woff2', u);
  }
  assert.doesNotMatch(css, /@import/i);
  assert.equal((await ask(f.port, { pathName: '/floor', host: `example.com:${f.port}` })).status, 403, 'another Host is refused, as everywhere at the address');
  assert.equal((await ask(f.port, { method: 'POST', pathName: '/floor', origin: f.origin })).status, 405);
});

test('0765 AC1: with a project chosen at the address, /floor and its answer are still the address\'s own, passed on to no project', async t => {
  const dir = panelsHere(), a = await standInPanel(dir, 'alpha');
  t.after(() => a.stop());
  const f = await floorFront(t, dir, () => [{ folder: '/x/alpha', name: 'alpha', port: a.port }]);
  const cookie = cookieOf(await ask(f.port, { method: 'POST', pathName: `/api/projects/${a.port}`, origin: f.origin }));
  assert.match(cookie, /^speck-serve-\d+=\d+$/, 'alpha is chosen');
  a.seen.length = 0;
  const page = await ask(f.port, { pathName: '/floor', cookie });
  assert.equal(page.status, 200);
  assert.match(page.body, /<title>speck · Factory floor<\/title>/);
  assert.equal((await ask(f.port, { pathName: '/floor.js', cookie })).status, 200);
  const floor = await ask(f.port, { method: 'POST', pathName: '/api/floor', origin: f.origin, cookie });
  assert.equal(floor.status, 200, floor.body);
  assert.deepEqual(JSON.parse(floor.body).stations.map(s => s.name), ['alpha']);
  assert.deepEqual(a.seen.filter(s => !s.headers['x-speck-via']), [], 'nothing of the page\'s reached alpha\'s panel');
});

// All projects' figures, as speck serve's /api/projects/summary gives them.
const bridgeSummary = (port, name) => ({ ...summary(), port, name, running: true });
const three = { self: null, usage: [], projects: [bridgeSummary(4801, 'alpha'), bridgeSummary(4802, 'bravo'), { port: null, name: 'charlie', running: false }] };
const withinBridge = (p, cls) => byClass(p.byId('bridge'), cls);
const openAll = p => { p.byId('project').value = 'all'; p.byId('project').listeners.change(); };
// The page's fetch at speck serve's address, where every answer says so (X-Speck-Serve), answering with `answers` in turn.
const serveFetch = answers => async () => {
  const next = answers.shift(), headers = { get: k => (/^x-speck-serve$/i.test(k) ? '1' : null) };
  return { ok: true, status: 200, headers, json: async () => next };
};
const twoPanels = { tickets: [T('0001', 'ready')], ideas: [], projects: { self: 4801, list: [{ port: 4801, name: 'alpha' }, { port: 4802, name: 'bravo' }] } };

test('0765 AC1: All projects at speck serve\'s address links to the factory floor, from its own page and from a project\'s shown there', async () => {
  const p = fakePage([three], {}, { ids: { 'speck-serve': { content: '1' } } }); // speck serve's own page, at /
  await p.settle();
  const [link, ...more] = withinBridge(p, 'bridge-floor');
  assert.equal(more.length, 0);
  assert.equal(link.tagName, 'a');
  assert.equal(link.textContent, 'Factory floor');
  assert.equal(link.href, 'floor', 'from the address\'s own page: /floor');
  assert.equal(p.byId('bridge').children[0].textContent, 'All projects', 'under the heading, which is first as before');
  assert.deepEqual(withinBridge(p, 'bridge-name').map(n => n.textContent), ['alpha', 'bravo', 'charlie'], 'and the projects as before');

  const q = fakePage([], { fetch: serveFetch([twoPanels, three]) }); // a project's page shown at the address, under project/
  await q.settle();
  openAll(q);
  await q.settle();
  assert.equal(q.byId('bridge').hidden, false);
  assert.deepEqual(withinBridge(q, 'bridge-floor').map(n => n.href), ['../floor'], 'from under project/: /floor');
});

test('0765 AC1: All projects on a panel\'s own port, where there\'s no factory floor, has no link to one', async () => {
  const p = fakePage([twoPanels, three]);
  await p.settle();
  openAll(p);
  await p.settle();
  assert.equal(p.byId('bridge').hidden, false);
  assert.equal(withinBridge(p, 'bridge-heading')[0].textContent, 'All projects');
  assert.deepEqual(withinBridge(p, 'bridge-floor'), []);
});

// ---------- AC2: a station for each project ----------

test('0765 AC2: /api/floor gives a station for each project on the list, numbered in its order, with its panel\'s summary and its ships each day for 14 days', async t => {
  const dir = panelsHere(), today = new Date();
  today.setHours(0, 0, 1, 0); // today, whatever the time now
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);
  // Its summary names the station's own fields too, which the floor's own win over.
  const a = await floorPanel(dir, 'alpha', { summary: summary({ status: 'Building 2', tone: 'ok', busy: true, building: 2, queued: 3, needs_you: 1, shipped_week: 4, key: 'x', n: 99, name: 'not alpha', port: 1, running: false, shipped_days: [9] }),
    board: board({ tickets: [T('0001', 'done', { finished: today.toISOString() }), T('0002', 'done', { finished: twoDaysAgo.toISOString() }), T('0003', 'ready')] }) });
  const b = await floorPanel(dir, 'bravo', { summary: null, board: null }); // running, but giving neither
  t.after(() => Promise.all([a.stop(), b.stop()]));
  const list = [{ folder: '/x/charlie', name: 'charlie', port: null }, { folder: '/x/alpha', name: 'alpha', port: a.port }, { folder: '/x/bravo', name: 'bravo', port: b.port }];
  const f = await floorFront(t, dir, () => list);
  const r = await ask(f.port, { method: 'POST', pathName: '/api/floor', origin: f.origin });
  assert.equal(r.status, 200, r.body);
  const body = JSON.parse(r.body);
  assert.deepEqual(body.stations.map(s => [s.n, s.name, s.key, s.port, s.running]), [
    [1, 'charlie', stationKey('/x/charlie'), null, false], [2, 'alpha', stationKey('/x/alpha'), a.port, true], [3, 'bravo', stationKey('/x/bravo'), b.port, false]],
  'in the list\'s order, not by name, each numbered');
  const alpha = body.stations[1];
  for (const [k, v] of Object.entries({ status: 'Building 2', tone: 'ok', building: 2, queued: 3, needs_you: 1, shipped_week: 4 })) assert.equal(alpha[k], v, k);
  assert.deepEqual(alpha.shipped_days, [...new Array(11).fill(0), 1, 0, 1], 'from its board: two days ago and today');
  assert.equal(body.stations[0].shipped_days, null, 'none for a project with no panel');
  assert.equal(body.stations[2].shipped_days, null, 'nor for one whose panel gives no board');
  assert.match(alpha.key, /^[0-9a-f]{12}$/);
  assert.ok(!r.body.includes('/x/'), 'no project\'s folder goes to the page');
  assert.equal(body.chosen, stationKey('/x/charlie'), 'with none asked for, the first is chosen');
  assert.equal(body.board_name, null, 'whose panel isn\'t running, so it has no board');
  assert.equal(body.board, undefined);

  assert.equal((await ask(f.port, { method: 'POST', pathName: '/api/floor' })).status, 403, 'only from a page at the address');
  assert.equal((await ask(f.port, { method: 'POST', pathName: '/api/floor', origin: 'http://example.com' })).status, 403);
  assert.equal((await ask(f.port, { pathName: '/api/floor', origin: f.origin })).status, 405);
});

test('0765 AC2: a list that can\'t be read is said, and an empty one gives no stations', async t => {
  let list = () => { throw new SpeckError('Your list of projects can\'t be read: it isn\'t JSON. Fix it, or run speck projects to see it.'); };
  const f = await floorFront(t, panelsHere(), () => list());
  const r = await ask(f.port, { method: 'POST', pathName: '/api/floor', origin: f.origin });
  assert.equal(r.status, 500);
  assert.equal(JSON.parse(r.body).error, 'Your list of projects can\'t be read: it isn\'t JSON. Fix it, or run speck projects to see it.');
  list = () => [];
  assert.deepEqual(JSON.parse((await ask(f.port, { method: 'POST', pathName: '/api/floor', origin: f.origin })).body), { stations: [], chosen: null, board_name: null });
});

test('0765 AC2: the line counts the tickets shipped on each of the last 14 days, by this machine\'s day, oldest first', () => {
  const now = new Date(2026, 10, 26, 15, 30).getTime();
  const tickets = [
    T('0001', 'done', { finished: at(0, 9) }), T('0002', 'done', { finished: at(0, 0, 0) }), // today, from midnight
    T('0003', 'done', { finished: at(1, 23, 59) }), // yesterday, a minute before midnight
    T('0004', 'done', { finished: at(13, 0, 30) }), // the first of the 14 days
    T('0005', 'done', { finished: at(14, 23, 0) }), // the day before them
    T('0006', 'done', { finished: at(-1, 9) }), // tomorrow
    T('0007', 'approved', { finished: at(0, 8) }), // not shipped
    T('0008', 'done', { finished: at(0, 10), ship: { running: true } }), // still shipping
    T('0009', 'done'), T('0010', 'done', { finished: 'not a time' }), T('0011', 'done', { finished: 12345 }),
    null, 'x', { status: 'done', finished: at(2, 12) }, // one with no id still shipped
  ];
  assert.deepEqual(shippedDays(tickets, now), [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2]);
  assert.deepEqual(shippedDays(undefined, now), new Array(14).fill(0));
  assert.deepEqual(shippedDays({ not: 'a list' }, now), new Array(14).fill(0));
});

test('0765 AC2: the floor draws a station for each, numbered, with its name, its state, its four counts and its line', async () => {
  const p = floorPage([answer()], { Date: stoppedClock(NOW) });
  await p.settle();
  assert.deepEqual(p.calls.map(c => [c.url, c.opts.method]), [['api/floor', 'POST']], 'from speck serve, beside the page');
  const st = stationsOf(p);
  assert.deepEqual(st.map(s => textOf(s, 'station-n')), ['01', '02', '03']);
  assert.deepEqual(st.map(s => textOf(s, 'station-name')), ['alpha', 'bravo', 'charlie']);
  assert.deepEqual(st.map(s => textOf(s, 'station-state')), ['Building 2', 'Needs you 1', 'Not answering']);
  assert.deepEqual(st.map(toneOf), ['moving', 'needs', 'gone'], 'orange while moving or needing you, dim while not answering');
  assert.deepEqual(figuresOf(st[0]), [['Building', '2'], ['Queued', '3'], ['Need you', '0'], ['Shipped 7d', '4']]);
  assert.deepEqual(figuresOf(st[1]), [['Building', '0'], ['Queued', '0'], ['Need you', '1'], ['Shipped 7d', '1']]);
  assert.deepEqual(figuresOf(st[2]), [['Building', '–'], ['Queued', '–'], ['Need you', '–'], ['Shipped 7d', '–']], 'a project not answering has no counts');
  assert.equal(st.every(s => s.tagName === 'button' && s.type === 'button'), true, 'each a button');

  const line = byClass(st[0], 'station-line')[0];
  assert.equal(line.attrs.role, 'img');
  assert.equal(line.attrs['aria-label'], 'Shipped each day for the last 14 days, oldest first: 0, 1, 0, 0, 2, 0, 0, 0, 1, 0, 0, 3, 0, 1');
  const points = nodes(line).find(n => n.tagName === 'polyline').attrs.points.split(' ');
  assert.equal(points.length, 14, 'a point for each day');
  assert.equal(points[0], '0,28', 'the first day on the left, at the bottom with none shipped');
  assert.equal(points[11], '110,2', 'the busiest day at the top');
  assert.equal(points[13], '130,19.3', 'today on the right');
  assert.equal(nodes(byClass(st[2], 'station-line')[0]).some(n => n.tagName === 'polyline'), false, 'no line while a project\'s board can\'t be read');
  assert.equal(byClass(st[2], 'station-line')[0].attrs['aria-label'], 'Its ships each day can\'t be read');
});

test('0765 AC2: before its first answer the floor says it\'s reading, and with no projects says how to add one', async () => {
  const later = deferred();
  const p = floorPage([later]);
  await p.settle();
  assert.equal(textOf(p.byId('stations'), 'floor-none'), 'Reading your projects…');
  later.resolve({ ok: true, status: 200, json: async () => ({ stations: [], chosen: null, board_name: null }) });
  await p.settle();
  assert.equal(textOf(p.byId('stations'), 'floor-none'), 'No projects on your list yet. Add one with speck projects add.');
  assert.deepEqual(lanesOf(p), []);
});

// ---------- AC3: the chosen station's lanes ----------

test('0765 AC3: choosing a station shows its project\'s Capture, Plan, Build and Shipped side by side, each with its count and its cards', async () => {
  const p = floorPage([answer(), answer({ chosen: KEYS.bravo, board_name: 'bravo-1', board: bravoBoard() })], { Date: stoppedClock(NOW) });
  await p.settle();
  assert.equal(stationsOf(p)[0].attrs['aria-pressed'], 'true', 'the first is shown before any is chosen');
  assert.equal(p.byId('board-title').textContent, 'Board · 01 alpha');
  press(stationsOf(p)[1]);
  assert.equal(p.byId('board-title').textContent, 'Board · 02 bravo', 'at once, before its board comes');
  assert.equal(textOf(p.byId('lanes'), 'floor-none'), 'Reading bravo\'s board…');
  await p.settle();
  assert.equal(p.calls[1].url, `api/floor?station=${KEYS.bravo}`, 'asked for by its key');
  assert.deepEqual(stationsOf(p).map(s => s.attrs['aria-pressed']), ['false', 'true', 'false']);
  assert.ok(classes(stationsOf(p)[1]).includes('chosen'));

  const lanes = lanesOf(p);
  assert.deepEqual(lanes.map(l => [textOf(l, 'lane-label'), textOf(l, 'lane-n')]), [['Capture', '2'], ['Plan', '2'], ['Build', '4'], ['Shipped', '2']], 'side by side, in the panel\'s order');
  assert.deepEqual(cardsOf(lanes[0]), [
    ['Inbox', 'Steady a test', 'still', 'From 0712 · 21 Nov'],
    ['Idea', 'Paint the shed', 'still', 'Captured 20 Nov']], 'ideas and inbox notes, newest captured first');
  assert.deepEqual(cardsOf(lanes[1]), [
    ['0010', 'Ticket 0010', 'still', 'P2 · S · low risk'],
    ['0011', 'Ticket 0011', 'still', 'P1 · M · high risk · bug · after 0010']], 'the drafts');
  assert.deepEqual(cardsOf(lanes[2]), [
    ['0021', 'Ticket 0021', 'needs', 'Has a question'],
    ['0020', 'Ticket 0020', 'moving', 'Writing'],
    ['0022', 'Ticket 0022', 'still', 'Ready'],
    ['0023', 'Ticket 0023', 'still', 'Ready · after 0020']], 'what needs you, then what\'s moving, then the queue, as the panel\'s Build groups them');
  assert.deepEqual(cardsOf(lanes[3]), [
    ['0030', 'Ticket 0030', 'shipped', '09:30 · 2 rounds · 25 min'],
    ['0031', 'Ticket 0031', 'shipped', '25 Nov, 14:00 · 1 round · 12 min']], 'newest first');
});

test('0765 AC3: the station chosen is kept in the browser, so a reload shows the same one', async () => {
  const s = storage();
  const p = floorPage([answer(), answer({ chosen: KEYS.bravo, board_name: 'bravo-1', board: bravoBoard() })], { localStorage: s, Date: stoppedClock(NOW) });
  await p.settle();
  press(stationsOf(p)[1]);
  await p.settle();
  assert.equal(s.m.get('speck-floor-station'), KEYS.bravo);

  const again = floorPage([answer({ chosen: KEYS.bravo, board_name: 'bravo-1', board: bravoBoard() })], { localStorage: s, Date: stoppedClock(NOW) });
  await again.settle();
  assert.equal(again.calls[0].url, `api/floor?station=${KEYS.bravo}`, 'its first question names the station kept');
  assert.deepEqual(stationsOf(again).map(n => n.attrs['aria-pressed']), ['false', 'true', 'false']);
  assert.equal(again.byId('board-title').textContent, 'Board · 02 bravo');
  assert.equal(lanesOf(again).length, 4);

  // What's kept that isn't a station's key isn't sent, and a browser that won't keep anything still shows the floor.
  const odd = storage();
  odd.setItem('speck-floor-station', '../../x');
  const q = floorPage([answer()], { localStorage: odd });
  await q.settle();
  assert.equal(q.calls[0].url, 'api/floor');
  const refuses = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() {} };
  const r = floorPage([answer(), answer({ chosen: KEYS.bravo, board_name: 'bravo-1', board: bravoBoard() })], { localStorage: refuses, Date: stoppedClock(NOW) });
  await r.settle();
  press(stationsOf(r)[1]);
  await r.settle();
  assert.equal(r.byId('board-title').textContent, 'Board · 02 bravo');
});

test('0765 AC3: /api/floor gives the chosen station\'s board from its own panel, or the first\'s, and leaves out the one the page has', async t => {
  const dir = panelsHere();
  const a = await floorPanel(dir, 'alpha', { board: board({ tickets: [T('0001', 'ready')] }) });
  const b = await floorPanel(dir, 'bravo', { board: { ...bravoBoard(), projects: { self: 1, list: [{ port: 1, name: 'off-one' }] } } });
  t.after(() => Promise.all([a.stop(), b.stop()]));
  const f = await floorFront(t, dir, () => [{ folder: '/x/alpha', name: 'alpha', port: a.port }, { folder: '/x/bravo', name: 'bravo', port: b.port }]);
  const floor = async query => { const r = await ask(f.port, { method: 'POST', pathName: `/api/floor${query}`, origin: f.origin }); assert.equal(r.status, 200, r.body); return JSON.parse(r.body); };

  const got = await floor(`?station=${stationKey('/x/bravo')}`);
  assert.equal(got.chosen, stationKey('/x/bravo'));
  const { projects, ...rest } = { ...bravoBoard(), projects: null };
  assert.deepEqual(got.board, rest, 'bravo\'s board, without its project menu\'s list');
  assert.match(got.board_name, /^[0-9a-f]{16}$/);
  const asked = b.seen.at(-1);
  assert.equal(asked['x-speck-via'], String(f.port), 'asked as another speck, so bravo\'s panel answers itself');
  assert.equal(asked['x-speck-board'], '0', 'with the reading it has, unless the board has changed since');
  assert.equal(asked.host, `127.0.0.1:${b.port}`);

  const same = await floor(`?station=${stationKey('/x/bravo')}&have=${got.board_name}`);
  assert.equal(same.board_name, got.board_name);
  assert.equal(same.board, undefined, 'the page has it already');
  assert.equal(same.stations.length, 2, 'the stations come every time');

  const first = await floor('?station=ffffffffffff');
  assert.equal(first.chosen, stationKey('/x/alpha'), 'a station not on the list: the first');
  assert.deepEqual(first.board.tickets.map(x => x.id), ['0001']);
  const built = await floor('?station=__proto__&have=constructor');
  assert.equal(built.chosen, stationKey('/x/alpha'), 'nor is a name that\'s built in');
  assert.deepEqual(built.board.tickets.map(x => x.id), ['0001']);
});

// ---------- AC4: it updates by itself ----------

test('0765 AC4: the floor asks again every 2 seconds, with the board it has, and shows a change in any project', async () => {
  const s = answer().stations;
  const changed = [{ ...s[0], building: 5, status: 'Building 5' }, { ...s[1], needs_you: 2, status: 'Needs you 2' }, { ...s[2], running: true, port: 4803, status: 'Idle', ...summary() }];
  const p = floorPage([answer(), answer({ stations: changed, board: undefined }), answer({ stations: changed, board_name: 'alpha-2', board: board({ tickets: [T('0001', 'ready'), T('0002', 'building', { started: at(0, 15) })] }) })],
    { Date: stoppedClock(NOW) });
  await p.settle();
  const poll = pollOf(p);
  assert.ok(poll, 'it asks again by itself');
  assert.equal(poll.ms, 2000);
  assert.deepEqual(cardsOf(lanesOf(p)[2]).map(c => c[0]), ['0001']);

  poll.fn();
  await p.settle();
  assert.equal(p.calls[1].url, 'api/floor?have=alpha-1', 'saying which board it has');
  const st = stationsOf(p);
  assert.deepEqual(st.map(n => textOf(n, 'station-state')), ['Building 5', 'Needs you 2', 'Idle']);
  assert.deepEqual(figuresOf(st[0])[0], ['Building', '5']);
  assert.deepEqual(cardsOf(lanesOf(p)[2]).map(c => c[0]), ['0001'], 'the board it has stays while it\'s unchanged');

  poll.fn();
  await p.settle();
  assert.deepEqual(cardsOf(lanesOf(p)[2]).map(c => c[0]), ['0002', '0001'], 'and a changed board shows');
  assert.equal(textOf(lanesOf(p)[2], 'lane-n'), '2');
});

test('0765 AC4: when speck serve can\'t be read the floor says why and keeps what it last showed', async () => {
  const p = floorPage([answer(), { status: 500, body: { error: 'Your list of projects can\'t be read.' } }, new Error('offline'), answer()], { Date: stoppedClock(NOW) });
  await p.settle();
  assert.equal(p.byId('floor-said').hidden, true);
  pollOf(p).fn();
  await p.settle();
  assert.equal(p.byId('floor-said').hidden, false);
  assert.equal(p.byId('floor-said').textContent, 'Couldn\'t read your projects: Your list of projects can\'t be read.');
  assert.equal(stationsOf(p).length, 3, 'the stations stay');
  assert.equal(lanesOf(p).length, 4, 'and the lanes');
  pollOf(p).fn();
  await p.settle();
  assert.equal(p.byId('floor-said').textContent, 'Couldn\'t read your projects: can\'t reach speck serve.');
  pollOf(p).fn();
  await p.settle();
  assert.equal(p.byId('floor-said').hidden, true, 'gone once it answers again');
});

test('0765 AC4: a chosen project whose panel stops giving its board keeps its last board on the floor, saying so', async () => {
  const p = floorPage([answer(), answer({ board_name: null, board: undefined })], { Date: stoppedClock(NOW) });
  await p.settle();
  pollOf(p).fn();
  await p.settle();
  assert.equal(lanesOf(p).length, 4, 'the last board stays');
  assert.equal(textOf(p.byId('lanes'), 'board-gone'), 'alpha\'s panel isn\'t giving its board, so this is the last one it gave.');
});

test('0765 AC4: every answer at /api/floor reads each panel again, so a change in any project is in the next one', async t => {
  const dir = panelsHere(), today = new Date();
  today.setHours(0, 0, 1, 0);
  const a = await floorPanel(dir, 'alpha', { summary: summary({ building: 1 }) });
  t.after(() => a.stop());
  const f = await floorFront(t, dir, () => [{ folder: '/x/alpha', name: 'alpha', port: a.port }]);
  const floor = async query => JSON.parse((await ask(f.port, { method: 'POST', pathName: `/api/floor${query}`, origin: f.origin })).body);
  const one = await floor('');
  assert.equal(one.stations[0].building, 1);
  a.summary = summary({ building: 2, status: 'Building 2' });
  a.board = board({ tickets: [T('0001', 'ready'), T('0009', 'done', { finished: today.toISOString() })] });
  const two = await floor(`?have=${one.board_name}`);
  assert.equal(two.stations[0].building, 2);
  assert.equal(two.stations[0].status, 'Building 2');
  assert.equal(two.stations[0].shipped_days[13], 1);
  assert.notEqual(two.board_name, one.board_name);
  assert.deepEqual(two.board.tickets.map(x => x.id), ['0001', '0009']);
});

test('0765 AC4: a panel slow to give its board doesn\'t hold up the floor: its last board is used until the new one comes', async t => {
  const dir = panelsHere(), a = await floorPanel(dir, 'alpha');
  t.after(() => a.stop());
  const listed = [{ folder: '/x/alpha', name: 'alpha', port: a.port }], live = new Set([a.port]), boards = floorBoards({ wait: 20 });
  const floor = () => floorAnswer({ listed, live, via: 1, boards });
  const until = async (check, what) => { for (let i = 0; i < 100; i++) { const got = await floor(); if (check(got)) return got; await new Promise(r => setTimeout(r, 30)); } throw new Error(`timed out waiting for ${what}`); };

  a.hold = deferred();
  const first = await floor();
  assert.equal(first.stations[0].running, true, 'its summary came');
  assert.equal(first.board_name, null, 'its board is still being read');
  assert.equal(first.stations[0].shipped_days, null);
  assert.equal((await floor()).board_name, null);
  assert.equal(a.seen.length, 1, 'one reading at a time: the next answer waits on the same one');
  a.hold.resolve();
  const read = await until(got => got.board_name !== null, 'the board');
  assert.deepEqual(read.board.tickets.map(x => x.id), ['0001']);

  a.hold = deferred();
  a.board = board({ tickets: [T('0002', 'ready')] });
  const stale = await floor();
  assert.equal(stale.board_name, read.board_name, 'the last board while the new one is read');
  assert.deepEqual(stale.board.tickets.map(x => x.id), ['0001']);
  a.hold.resolve();
  const fresh = await until(got => got.board_name !== read.board_name, 'the new board');
  assert.deepEqual(fresh.board.tickets.map(x => x.id), ['0002']);

  a.hold = null;
  a.board = null;
  const gone = await until(got => got.board_name === null, 'the board to be forgotten');
  assert.equal(gone.stations[0].shipped_days, null, 'a panel that fails to give its board has none');
});

// ---------- AC5: the brief ----------

test('0765 AC5: the brief\'s speck serve row gives the factory floor\'s address', () => {
  const row = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8').split('\n').find(l => l.startsWith('| `speck serve'));
  assert.ok(row, 'the row');
  assert.match(row, /`\/floor`/);
});
