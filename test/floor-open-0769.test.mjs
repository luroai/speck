import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0769: pressing a ticket on the factory floor, a card on its board or a lit station on its line, opens it in its
// project's panel at speck serve's address, and that panel's back link returns to the floor. Checked on fakePage's DOM:
// the floor's page, and the project's page it hands the ticket to, as 0596's bridge does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, stoppedClock, idea } from './support/panel.mjs';
import { storage, board } from './support/floor.mjs';
import { nodes, classes, byClass, textOf, lineAnswer, NOW } from './support/floor-line.mjs';

const KEPT = 'speck-open-ticket', STATION = 'speck-floor-station';
const lit = p => byClass(p.byId('line'), 'slot').filter(s => classes(s).includes('lit'));
const cardsIn = (p, lane) => byClass(byClass(p.byId('lanes'), `lane-${lane}`)[0], 'card');
const opener = card => nodes(card).find(n => n.tagName === 'button');
const press = n => n.listeners.click({ stopPropagation() {}, preventDefault() {} });

// The floor with alpha's board: a ready ticket, an idea in Capture and a shipped ticket. `then` answers the requests after.
const floorBoard = () => board({ tickets: [T('0001', 'ready'), T('0002', 'done', { finished: new Date(NOW - 3600e3).toISOString() })],
  ideas: [idea('2026-11-20-paint-it', 'idea')] });
function floor(then = [], { session = storage(), local = storage(), went = [], made, answer } = {}) {
  const ans = answer || { ...lineAnswer(), board_name: 'alpha-1', board: floorBoard() };
  const p = fakePage([ans, ...then], { localStorage: local, sessionStorage: session, Date: stoppedClock(NOW), location: { assign: u => went.push(u) } }, { page: 'floor.html', made });
  return Object.assign(p, { session, local, went });
}
const opened = async (...a) => { const p = floor(...a); await p.settle(); return p; };

// ---------- AC1: pressing a card or a lit station opens it in its project's panel at the address ----------

test('0769 AC1: pressing a lit station on the line chooses its project at the address, keeps its ticket and goes to the project\'s panel', async () => {
  const p = await opened([{ ok: true }]);
  const before = p.calls.length;
  press(lit(p)[1]); // alpha's 0102, at the builder
  await p.settle();
  assert.equal(p.calls[before].url, 'api/projects/4801', 'alpha\'s panel is chosen at the address');
  assert.equal(p.calls[before].opts.method, 'POST');
  assert.deepEqual(JSON.parse(p.session.m.get(KEPT)), { port: 4801, id: '0102', from: 'floor' });
  assert.deepEqual(p.went, ['project/'], 'and the page goes to where the address shows it');
});

test('0769 AC1: pressing a ticket\'s card on the board opens it in the chosen station\'s project, from Build and from Shipped', async () => {
  for (const [lane, id] of [['build', '0001'], ['shipped', '0002']]) {
    const p = await opened([{ ok: true }]);
    const before = p.calls.length;
    press(opener(cardsIn(p, lane)[0]));
    await p.settle();
    assert.equal(p.calls[before].url, 'api/projects/4801');
    assert.deepEqual(JSON.parse(p.session.m.get(KEPT)), { port: 4801, id, from: 'floor' });
    assert.deepEqual(p.went, ['project/']);
  }
});

test('0769 AC1: pressing a note\'s card in Capture opens its project\'s panel with that note open', async () => {
  const p = await opened([{ ok: true }]);
  press(opener(cardsIn(p, 'capture')[0]));
  await p.settle();
  assert.deepEqual(JSON.parse(p.session.m.get(KEPT)), { port: 4801, note: 'speck/ideas/2026-11-20-paint-it.md', from: 'floor' });
  assert.deepEqual(p.went, ['project/']);
});

test('0769 AC1: when the address can\'t show the project, the floor says why, stays, and keeps no ticket to open', async () => {
  const p = await opened([{ status: 404, body: { error: 'That project\'s panel isn\'t running any more, so it can\'t be shown. Pick another project.' } }]);
  press(lit(p)[0]);
  await p.settle();
  assert.deepEqual(p.went, []);
  assert.equal(p.session.m.has(KEPT), false);
  assert.equal(p.byId('floor-said').hidden, false);
  assert.match(p.byId('floor-said').textContent, /isn't running any more/);
  const q = await opened([new Error('offline')]);
  press(lit(q)[0]);
  await q.settle();
  assert.deepEqual(q.went, []);
  assert.match(q.byId('floor-said').textContent, /can't reach speck serve/);
});

test('0769 AC1: the project\'s page the floor hands a ticket to opens its full view, and a note opens in Capture', async () => {
  const st = (extra = {}) => ({ tickets: [T('0001', 'ready'), T('0007', 'blocked', { title: 'Pick a colour' })], ideas: [idea('2026-11-20-paint-it', 'idea')],
    projects: { self: 4801, list: [{ port: 4801, name: 'alpha' }] }, ...extra });
  const s = storage();
  s.setItem(KEPT, JSON.stringify({ port: 4801, id: '0007', from: 'floor' }));
  const p = fakePage([st()], { sessionStorage: s });
  await p.settle();
  assert.equal(p.byId('full-ticket').hidden, false, 'the ticket\'s full view is open');
  assert.ok(nodes(p.byId('full-ticket')).some(n => n._text === 'Pick a colour'));
  assert.equal(s.m.has(KEPT), false, 'and it won\'t open again');

  const n = storage();
  n.setItem(KEPT, JSON.stringify({ port: 4801, note: 'speck/ideas/2026-11-20-paint-it.md', from: 'floor' }));
  const q = fakePage([st()], { sessionStorage: n });
  await q.settle();
  assert.equal(q.byId('capture-section').hidden, false, 'Capture is the tab open');
  assert.equal(q.byId('full-ticket').hidden, true);
  const note = q.byId('capture').children.find(c => /\bitem\b/.test(c.className));
  assert.ok(note && /\bopen\b/.test(note.className), 'with the note open');
  assert.equal(n.m.has(KEPT), false);

  for (const bad of [{ port: 4801, note: 'speck/ideas/gone.md', from: 'floor' }, { port: 4801, note: 7, from: 'floor' }]) {
    const b = storage();
    b.setItem(KEPT, JSON.stringify(bad));
    const r = fakePage([st()], { sessionStorage: b });
    await r.settle();
    assert.equal(r.byId('capture-section').hidden, true, 'a note no longer there opens nothing');
    assert.equal(b.m.has(KEPT), false);
  }
});

// ---------- AC2: back returns to the floor with the same station chosen ----------

test('0769 AC2: a ticket opened from the floor has a back link to the factory floor, which goes there', async () => {
  const s = storage(), went = [];
  s.setItem(KEPT, JSON.stringify({ port: 4801, id: '0007', from: 'floor' }));
  const st = { tickets: [T('0007', 'blocked')], ideas: [], projects: { self: 4801, list: [{ port: 4801, name: 'alpha' }] } };
  const p = fakePage([st], { sessionStorage: s, location: { assign: u => went.push(u), reload() {} } });
  await p.settle();
  const back = byClass(p.byId('full-ticket'), 'close')[0];
  assert.equal(back._text, 'Factory floor');
  assert.equal(back.attrs['aria-label'], 'Back to the factory floor');
  press(back);
  assert.deepEqual(went, ['../floor']);
});

test('0769 AC2: a ticket opened in the panel itself keeps its back link to its lane', async () => {
  const s = storage(), went = [];
  s.setItem(KEPT, JSON.stringify({ port: 4801, id: '0007' })); // from All projects, as 0596's bridge keeps it
  const st = { tickets: [T('0007', 'blocked')], ideas: [], projects: { self: 4801, list: [{ port: 4801, name: 'alpha' }] } };
  const p = fakePage([st], { sessionStorage: s, location: { assign: u => went.push(u), reload() {} } });
  await p.settle();
  const back = byClass(p.byId('full-ticket'), 'close')[0];
  assert.notEqual(back._text, 'Factory floor');
  press(back);
  await p.settle();
  assert.deepEqual(went, []);
  assert.equal(p.byId('full-ticket').hidden, true, 'it closes the full view');
});

test('0769 AC2: opening a ticket from another project\'s row leaves the station chosen as it was, so the floor comes back the same', async () => {
  const local = storage();
  local.setItem(STATION, 'a1a1a1a1a1a1'); // alpha chosen
  const ans = { ...lineAnswer(), board_name: 'alpha-1', board: floorBoard() };
  ans.stations[1].line.work = [{ id: '0201', title: 'Bravo work', station: 'builder', agent: 'claude', agent_name: 'Claude Code', model: 'm', effort: 'e', why: 'settings' }];
  const p = await opened([{ ok: true }], { local, answer: ans });
  const bravo = lit(p).find(s => textOf(s, 'slot-id') === '0201');
  press(bravo);
  await p.settle();
  assert.deepEqual(JSON.parse(p.session.m.get(KEPT)), { port: 4802, id: '0201', from: 'floor' }, 'bravo\'s ticket, in bravo\'s panel');
  assert.equal(local.m.get(STATION), 'a1a1a1a1a1a1', 'the station chosen is kept as it was');
  const back = await opened([], { local }); // the floor again, as Back or the back link loads it
  assert.match(back.calls[0].url, /station=a1a1a1a1a1a1/, 'it asks for the same station');
  const chosen = byClass(back.byId('stations'), 'station').find(s => classes(s).includes('chosen'));
  assert.equal(textOf(chosen, 'station-name'), 'alpha', 'and shows it chosen');
});

// ---------- AC3: reachable and opened with the keyboard ----------

test('0769 AC3: every card and every lit station is a button, named for its ticket and project, and an idle station is not', async () => {
  const p = await opened();
  for (const s of lit(p)) {
    assert.equal(s.tagName, 'button');
    assert.equal(s.type, 'button');
    assert.match(s.attrs['aria-label'], new RegExp(`^Open ${textOf(s, 'slot-id')} .+ in alpha$`));
  }
  assert.ok(lit(p).length >= 4);
  for (const s of byClass(p.byId('line'), 'slot').filter(x => !classes(x).includes('lit'))) assert.notEqual(s.tagName, 'button', 'an idle or empty station opens nothing');
  const cards = byClass(p.byId('lanes'), 'card');
  assert.ok(cards.length >= 3);
  for (const c of cards) {
    const b = opener(c);
    assert.ok(b, `${textOf(c, 'card-title')} has a button`);
    assert.equal(b.type, 'button');
    assert.match(b.attrs['aria-label'], / in alpha$/);
  }
});

test('0769 AC3: a card or lit station that has the focus keeps it when the floor is drawn again', async () => {
  let p = null;
  const made = n => { n.focus = () => { p.document.activeElement = n; }; };
  const later = { ...lineAnswer(), board_name: 'alpha-2', board: board({ tickets: [T('0003', 'ready'), T('0001', 'ready')], ideas: [] }) };
  later.stations[0].status = 'Building 3';
  const again = { ...lineAnswer(), board_name: 'alpha-3', board: board({ tickets: [T('0004', 'ready'), T('0001', 'ready')], ideas: [] }) };
  p = floor([later, again], { made });
  await p.settle();
  const poll = () => [...p.intervals.values()].find(i => i.ms <= 5000).fn();
  const slot = lit(p)[1];
  slot.focus();
  poll();
  await p.settle();
  assert.notEqual(lit(p)[1], slot, 'the line was drawn again');
  assert.equal(p.document.activeElement, lit(p)[1], 'and the focus is on the same ticket\'s station');
  const card = () => opener(cardsIn(p, 'build').find(c => textOf(c, 'card-id') === '0001'));
  const was = card();
  was.focus();
  poll();
  await p.settle();
  assert.notEqual(card(), was, 'the board was drawn again');
  assert.equal(p.document.activeElement, card(), 'and the focus is on the same ticket\'s card');
});

test('0769 AC1 self-check: a card of a project whose panel has stopped says so, asks nothing and keeps nothing; a second press while one is opening does nothing', async () => {
  const ans = { ...lineAnswer(), board_name: 'alpha-1', board: floorBoard() };
  ans.stations[0].port = null;
  const p = await opened([], { answer: ans });
  const before = p.calls.length;
  press(opener(cardsIn(p, 'build')[0]));
  await p.settle();
  assert.equal(p.calls.length, before);
  assert.equal(p.session.m.has(KEPT), false);
  assert.match(p.byId('floor-said').textContent, /^Couldn't open that: alpha's panel isn't running/);
  let answer;
  const q = await opened([new Promise(r => { answer = r; })]);
  const n = q.calls.length;
  press(lit(q)[0]);
  press(lit(q)[1]);
  answer({ ok: true, status: 200, json: async () => ({ ok: true }) });
  await q.settle();
  assert.equal(q.calls.length, n + 1, 'one request');
  assert.equal(JSON.parse(q.session.m.get(KEPT)).id, '0101', 'for the first press');
});
