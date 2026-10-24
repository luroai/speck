import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, panelRepo, startPanel, stop, request, freePort } from './support/panel.mjs';
import { expected } from './support/screen.mjs';
import { MIN, building, board, speckPage, capDots, capOf, shows } from './support/screen-speck.mjs';
import { foremanView } from '../scripts/foreman.mjs';

// ---------- 0495: speck's caption adds to the top row, not repeats it ----------

const ON = { on: true, pid: 4242 };
const rec = (o = {}) => ({ lock: 4242, max: 2, building: [], switching: null, ready: [], ship: { running: null, hold: null, refused: [] }, ...o });
const ask = (...ids) => ({ running: null, waiting: [], did: [], asks: ids.map(id => ({ id, question: 'Which?', at: '2026-10-23T11:00:00Z' })) });
const blocked = (...ids) => ids.map(id => ({ id, title: 'T', question: 'Q', foreman: false }));
// The caption speck shows between events for the Foreman `f`, from the page's first board.
async function restsWith(f, tickets = building()) {
  const p = speckPage([board(tickets, f)]);
  await p.settle();
  return p;
}

const NEEDS = [
  ['one blocked ticket', { word: 'Needs you 1', blocked: blocked('0410') }, '0410 HAS A QUESTION'],
  ['one question from the Foreman', { word: 'Needs you 1', agent: ask('0411') }, '0411 HAS A QUESTION'],
  ['a blocked ticket and a question, lowest id first', { word: 'Needs you 2', blocked: blocked('0412'), agent: ask('0409') }, '0409 AND 0412 ASK YOU'],
  ['four, lowest id first', { word: 'Needs you 4', blocked: blocked('0420', '0401'), agent: ask('0415', '0430') }, '0401 AND 3 MORE ASK YOU'],
  ['a blocked ticket the Foreman will answer itself isn\'t named', { word: 'Needs you 1', blocked: [...blocked('0410'), { id: '0400', title: 'T', question: 'Q', foreman: true }] }, '0410 HAS A QUESTION'],
  ['a ticket blocked and asked about at once, named once', { word: 'Needs you 2', blocked: blocked('0410', '0402'), agent: ask('0410') }, '0402 AND 0410 ASK YOU'],
  ['with watch off, only the Foreman\'s questions', { word: 'Needs you 1', fixing: 'off', blocked: blocked('0401'), agent: ask('0410') }, '0410 HAS A QUESTION'],
];
for (const [what, f, cap] of NEEDS) {
  test(`0495 AC1: Needs you names the tickets that need you: ${what}`, async () => {
    const p = await restsWith(f);
    shows(p, 'ask', cap);
    p.go(60 * MIN);
    shows(p, 'ask', cap);
  });
}

const BUILDS = [[['0362'], 'WATCHING 0362'], [['0363', '0362'], 'WATCHING 0362 AND 0363'], [['0370', '0362', '0365'], 'WATCHING 0362 AND 2 MORE']];
for (const [ids, cap] of BUILDS) {
  test(`0495 AC2: Building ${ids.length} watches with ${cap}`, async () => {
    const p = await restsWith({ word: `Building ${ids.length}`, building: ids }, ids.map(id => T(id, 'building')));
    shows(p, 'watch', cap);
    p.go(2 * MIN - 1000);
    shows(p, 'watch', cap);
  });
}

test('0495 AC2: Shipping <id> says it\'s on its way to the base branch, by name', async () => {
  const p = await restsWith({ word: 'Shipping 0362', base: 'main', ship: { running: '0362', waiting: [] } });
  shows(p, 'watch', 'ON ITS WAY TO MAIN');
  const q = await restsWith({ word: 'Shipping 0362', base: 'trunk', ship: { running: '0362', waiting: [] } });
  shows(q, 'watch', 'ON ITS WAY TO TRUNK');
});

test('0495 AC2: the Foreman gives the base branch\'s name, and the panel sends it with its state', async () => {
  assert.equal(foremanView({ run: ON, record: rec(), tickets: [], base: 'trunk' }).base, 'trunk');
  assert.equal(foremanView({ run: ON, record: rec(), tickets: [] }).base, '', 'blank when not given');
  const { dir } = panelRepo();
  const p = await startPanel(dir, ['--port', String(await freePort())]);
  try {
    assert.equal(JSON.parse((await request(p.port, { pathName: '/api/state' })).body).foreman.base, 'main');
  } finally { await stop(p); }
});

const WAITS = [
  ['other tickets', rec({ ready: [{ id: '0002', kind: 'after', why: 'waiting for 0009' }] }), [T('0002', 'ready')], 'waiting for 0009', 'FOR 0009'],
  ['build slots', rec({ ready: [{ id: '0002', kind: 'slots', why: 'all 1 build slot in use' }] }), [T('0002', 'ready')], 'all 1 build slot in use', 'ALL 1 BUILD SLOT IN USE'],
  ['on hold', rec({ ship: { running: null, hold: { message: 'paused' }, refused: [] } }), [], 'Shipping is paused', 'SHIPPING IS PAUSED'],
  ['new commit', rec({ ship: { running: null, hold: null, refused: [{ id: '0003', message: 'new commits' }] } }), [], 'new commits', 'NEW COMMITS'],
  ['new code', rec({ switching: { why: 'speck run is switching' } }), [], 'speck run is switching', 'SPECK RUN IS SWITCHING'],
];
for (const [short, record, tickets, why, cap] of WAITS) {
  test(`0495 AC3: Waiting: ${short} gives its reason, which the caption shows in capitals`, async () => {
    const v = foremanView({ run: ON, record, tickets });
    assert.equal(v.word, `Waiting: ${short}`);
    assert.equal(v.why, why);
    const p = await restsWith(v);
    shows(p, 'grumpy', cap);
  });
}

test('0495 AC3: the Foreman gives no reason when it isn\'t waiting', () => {
  assert.equal(foremanView({ run: ON, record: rec({ building: ['0001'] }), tickets: [T('0001', 'building')] }).why, '');
  assert.equal(foremanView({ run: ON, record: rec(), tickets: [] }).why, '');
});

test('0495 AC3: a reason too long for the row is cut with …', async () => {
  const p = await restsWith({ word: 'Waiting: not committed', why: 'not committed as ready on a-very-long-branch-name' });
  const dots = capDots(p.draw());
  const kept = 'NOT COMMITTED AS READY O', W = 25 * 6 - 1, x = Math.round(80 - W / 2);
  for (const d of expected(kept, x, 65)) assert.ok(dots.has(d), `the cut caption starts ${kept}`);
  for (const k of [0, 2, 4]) assert.ok(dots.has(`${x + 24 * 6 + k},71`), 'and ends with …');
  for (const d of dots) { const c = Number(d.split(',')[0]); assert.ok(c >= 4 && c <= 155, `inside the margins: ${d}`); }
});

test('0495 AC3: a reason over several lines shows on one, with single spaces', async () => {
  const p = await restsWith({ word: 'Waiting: new commit', why: '  new commits\n  on main ' });
  shows(p, 'grumpy', 'NEW COMMITS ON MAIN');
});

test('0495 AC3: Off says to turn on Auto-build', async () => {
  const p = await restsWith({ word: 'Off', tone: 'off' }, []);
  shows(p, 'sleeping', 'TURN ON AUTO-BUILD');
});

// The top row's words, and the caption under it, for each word between events.
const ALL = [
  { word: 'Needs you 1', blocked: blocked('0410') }, { word: 'Needs you 3', blocked: blocked('0410', '0411'), agent: ask('0499') },
  { word: 'Building 1', building: ['0362'] }, { word: 'Building 2', building: ['0362', '0363'] }, { word: 'Building 12', building: Array.from({ length: 12 }, (_, i) => String(9988 + i)) },
  { word: 'Shipping 0362', base: 'main' }, { word: 'Shipping 0362', base: 'release/very-long-branch-name-2026' },
  { word: 'Waiting: other tickets', why: 'waiting for 0009, 0010' }, { word: 'Waiting: new code', why: 'waiting for speck run to switch to new code' },
  { word: 'Off' },
];
test('0495 AC4: no caption between events repeats the top row\'s words, and each fits without scrolling', async () => {
  for (const f of ALL) {
    const p = await restsWith(f);
    const a = capDots(p.draw(1000, false));
    assert.ok(a.size > 0, `${f.word} has a caption`);
    assert.deepEqual(capDots(p.draw(20000, false)), a, `${f.word}: the caption doesn't move`);
    for (const d of a) { const c = Number(d.split(',')[0]); assert.ok(c >= 4 && c <= 155, `${f.word}: inside the margins: ${d}`); }
    const status = f.word.replace(/[:\d].*$/, '').trim().toUpperCase(); // NEEDS YOU, BUILDING, SHIPPING, WAITING, OFF
    assert.notDeepEqual(a, capOf(f.word.toUpperCase()), `${f.word}: not the top row again`);
    for (let x = 4; x <= 155; x++) assert.ok(![...expected(status, x, 65)].every(d => a.has(d)), `${f.word}: the caption doesn't say ${status}`);
  }
});

test('0495 AC4: events, pastimes and the nap keep their captions', async () => {
  const p = speckPage([board(building(), { word: 'Building 2', building: ['0362', '0363'] }),
    board([T('0362', 'blocked'), T('0363', 'building')], { word: 'Needs you 1', building: ['0363'], blocked: blocked('0362') })]);
  await p.settle();
  shows(p, 'watch', 'WATCHING 0362 AND 0363');
  await p.next();
  shows(p, 'ask', '0362 HAS A QUESTION');
  const q = await restsWith({ word: 'Building 2', building: ['0362', '0363'] });
  q.go(2 * MIN + 1000);
  const dots = capDots(q.draw());
  assert.ok(['eating', 'playing', 'messy', 'cleaning'].includes(q.cast().cur), 'a pastime');
  const caps = ['A CUP OF TEA', 'A QUICK GAME OF CHESS', 'CRUMBS ON THE CLIPBOARD', 'A QUICK SWEEP'].map(c => [...capOf(c)].sort().join(' '));
  assert.ok(caps.includes([...dots].sort().join(' ')), 'with its caption');
  const n = await restsWith({ word: 'Idle' }, []);
  n.go(15 * MIN + 1000);
  shows(n, 'sleeping', 'NAPPING');
});
