import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, boardPage, full, items, top, queueRows, page, panelRepo, freePort, startPanel, stop, findChrome, browserPage, openLane, styles } from './support/panel.mjs';

// ---------- 0154: go to a linked ticket by tapping its id ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const css = () => styles();

// 0001 (a draft) unlocks 0002 (ready) and 0003 (a draft); 0004 (ready) waits on 0001 and on 0009, which has shipped;
// 0005 is building and unlocks 0006, a ready ticket waiting on it.
const board = () => ({
  tickets: [
    full('0001'),
    T('0002', 'ready', { after: ['0001'], waiting_on: ['0001'] }),
    full('0003', { after: ['0001'], waiting_on: ['0001'] }),
    T('0004', 'ready', { after: ['0001', '0009'], waiting_on: ['0001', '0009'] }),
    T('0005', 'building', { started: new Date().toISOString() }),
    T('0006', 'ready', { after: ['0005'], waiting_on: ['0005'] }),
    T('0009', 'done'),
    full('0010'),
  ],
  ideas: [],
});
const idOf = (p, n) => p.all(n).find(x => x.className === 'id')._text;
const shaping = (p, id) => items(p).find(n => idOf(p, n) === id);
const queued = (p, id) => queueRows(p).find(n => idOf(p, n) === id);
const gotos = (p, n) => p.all(n).filter(x => x.tagName === 'button' && /^Go to ticket /.test((x.attrs || {})['aria-label'] || ''));
const goto = (p, n, id) => gotos(p, n).find(b => b.textContent === id);
const lit = n => /\bhl\b/.test(n.className);
const dim = n => /\bdim\b/.test(n.className);
const flashing = n => /\bflash\b/.test(n.className);
const rows = p => [...items(p), ...queueRows(p)];
// The delay asked for with each timer.
function withTimers(globals = {}) {
  const delays = [], timers = [];
  const p = fakePage([board(), board(), board(), board()], { ...globals, setTimeout: (fn, ms) => { delays.push(ms); timers.push(fn); } });
  p.timers.push(...timers);
  return { p: { ...p, timers }, delays };
}
// A click on a node, with every listener from it up to the page getting it until one stops it.
const tap = (p, n) => p.press(n);

test('0154 AC1: a touch on a ticket, as on a phone, never highlights or dims others, and nor does a pen', async () => {
  for (const kind of ['touch', 'pen']) {
    const p = fakePage([board()]);
    await p.settle();
    p.pointer(kind); // what a tap sends before its mouseenter
    queued(p, '0002').listeners.mouseenter();
    assert.ok(rows(p).every(n => !lit(n) && !dim(n)), `a ${kind} on a queued ticket lights nothing`);
    shaping(p, '0001').listeners.mouseenter();
    assert.ok(rows(p).every(n => !lit(n) && !dim(n)), `nor does one on a Plan ticket`);
  }
});

test('0154 AC1: with a mouse, hovering still highlights linked tickets and leaves the rest as they are, also after a touch', async () => {
  const p = fakePage([board()]);
  await p.settle();
  p.pointer('touch');
  queued(p, '0002').listeners.mouseenter();
  p.pointer('mouse'); // a touch laptop's mouse, used after its screen
  queued(p, '0002').listeners.mouseenter();
  assert.ok(lit(queued(p, '0002')) && lit(shaping(p, '0001')) && lit(shaping(p, '0003')) && lit(queued(p, '0004')), 'the chain lights up');
  assert.ok(!lit(shaping(p, '0010')) && !dim(shaping(p, '0010')) && !lit(queued(p, '0006')) && !dim(queued(p, '0006')), 'the rest are left as they are (0185)');
  queued(p, '0002').listeners.mouseleave();
  assert.ok(rows(p).every(n => !lit(n) && !dim(n)), 'and it ends when the pointer leaves');
});

// 0468: a closed card's ids are in its chip now, so the ids that go to their tickets are those in an open card's
// dependency box (0467).
const openUp = async (p, ...ids) => {
  for (const id of ids) { const n = rows(p).find(r => idOf(p, r) === id); if (!/\bopen\b/.test(n.className)) tap(p, items(p).includes(n) ? top(n) : n.children[0]); await p.settle(); }
};

test('0154 AC2: each linked id in an open card\'s dependency box, in Plan and the Build queue, is a button', async () => {
  const p = fakePage([board()]);
  await p.settle();
  await openUp(p, '0001', '0003', '0002', '0006');
  assert.deepEqual(gotos(p, shaping(p, '0001')).map(b => [b.tagName, b.type, b.textContent]), [['button', 'button', '0002']], 'Plan: what it unlocks');
  assert.deepEqual(gotos(p, shaping(p, '0003')).map(b => b.textContent), ['0001'], 'Plan: what it waits on');
  assert.deepEqual(gotos(p, queued(p, '0002')).map(b => [b.tagName, b.textContent]), [['button', '0001']], 'queue: what it waits on');
  assert.deepEqual(gotos(p, queued(p, '0006')).map(b => b.textContent), ['0005'], 'a ticket in flight is on the page too');
});

test('0154 AC2: tapping or clicking an id scrolls its ticket into view and highlights it for about 1.5 seconds, opening and closing nothing', async () => {
  const { p, delays } = withTimers();
  await p.settle();
  await openUp(p, '0002');
  const target = shaping(p, '0001');
  let scrolled = 0;
  target.scrollIntoView = () => { scrolled++; };
  const openBefore = rows(p).map(n => /\bopen\b/.test(n.className));
  const before = p.calls.length;
  tap(p, goto(p, queued(p, '0002'), '0001'));
  assert.equal(scrolled, 1, 'the ticket is scrolled into view');
  assert.ok(flashing(shaping(p, '0001')), 'and highlighted');
  assert.ok(!flashing(queued(p, '0002')), 'only that ticket');
  assert.deepEqual(rows(p).map(n => /\bopen\b/.test(n.className)), openBefore, 'nothing opened or closed');
  assert.equal(p.calls.length, before, 'nothing was asked of the server');
  assert.equal(delays.at(-1), 1500, 'the highlight is timed to end after 1.5 seconds');
  p.timers.at(-1)();
  assert.ok(!flashing(shaping(p, '0001')), 'then it ends by itself');
  assert.match(css(), /\.flash\b[^{]*\{[^}]*animation:[^;}]*1\.5s/, 'and fades out over that time');
  assert.match(css(), /@media \(prefers-reduced-motion: reduce\) \{ \.item\.flash, \.q\.flash \{ box-shadow: inset 0 0 0 2px var\(--text\)/, 'or, asked for less motion, stays lit without fading (by a ring in the text colour since 0167)');
});

test('0154 AC2: a tap on an id in an open Plan ticket doesn\'t close that ticket, and a newer tap\'s highlight isn\'t cut short', async () => {
  const { p } = withTimers();
  await p.settle();
  await openUp(p, '0001');
  for (const n of rows(p)) n.scrollIntoView = () => {};
  tap(p, goto(p, shaping(p, '0001'), '0002'));
  assert.match(shaping(p, '0001').className, /\bopen\b/, 'the ticket with the box stays open');
  assert.ok(flashing(queued(p, '0002')));
  const first = p.timers.at(-1);
  queued(p, '0002').scrollIntoView = () => {};
  tap(p, goto(p, shaping(p, '0001'), '0002'));
  first();
  assert.ok(flashing(queued(p, '0002')), 'the first tap\'s timer leaves the second tap\'s highlight alone');
  p.timers.at(-1)();
  assert.ok(!flashing(queued(p, '0002')));
});

test('0154 AC2: the highlight lasts through a refresh that rebuilds the ticket', async () => {
  const { p } = withTimers();
  await p.settle();
  await openUp(p, '0002');
  for (const n of rows(p)) n.scrollIntoView = () => {};
  tap(p, goto(p, queued(p, '0002'), '0001'));
  tap(p, top(shaping(p, '0001'))); // opening it rebuilds its item
  assert.ok(flashing(shaping(p, '0001')), 'the rebuilt item is still highlighted');
});

test('0154 AC2: activating an id with Enter or Space works as a click does, since it is a real button', async () => {
  const p = fakePage([board()]);
  await p.settle();
  await openUp(p, '0001', '0002');
  const all = [...gotos(p, shaping(p, '0001')), ...gotos(p, queued(p, '0002'))];
  assert.equal(all.length, 2);
  for (const b of all) {
    assert.equal(b.tagName, 'button', 'a button, which a browser presses on Enter or Space');
    assert.equal(b.type, 'button');
  }
  const opened = rows(p).map(n => /\bopen\b/.test(n.className));
  p.key('Enter'); p.key(' ');
  assert.deepEqual(rows(p).map(n => /\bopen\b/.test(n.className)), opened, 'the page\'s own key handling doesn\'t act on Enter or Space');
});

test('0154 AC3: an id whose ticket isn\'t on the page is plain text, not a button', async () => {
  const p = fakePage([board(), board()]);
  await p.settle();
  await openUp(p, '0004', '0002', '0006');
  const q = queued(p, '0004');
  p.press(p.all(q).find(n => n.className === 'chip more')); // its shipped one too
  await p.settle();
  assert.deepEqual(gotos(p, queued(p, '0004')).map(b => b.textContent), ['0001'], 'a shipped ticket\'s id is not a button');
  assert.ok(p.all(queued(p, '0004')).some(n => n.tagName === 'span' && n.textContent === '0009'), 'but it is still shown');
  // 0520: Plan's Tickets, Ideas and Inbox buttons are gone, so Plan always lists its drafts and a link to one stays a button.
  assert.deepEqual(gotos(p, queued(p, '0002')).map(b => b.textContent), ['0001'], 'a draft in Plan is a button');
  assert.deepEqual(gotos(p, queued(p, '0006')).map(b => b.textContent), ['0005'], 'and so is a queued ticket\'s link');
});

test('0154 AC3: a link to a ticket that has left the page since its box was built is plain text after the refresh', async () => {
  const later = board();
  later.tickets = later.tickets.map(t => (t.id === '0005' ? { ...t, status: 'cancelled' } : t));
  const p = boardPage([board(), later]); // 0434: opening a Build card asks for its log apart from the boards
  await p.settle();
  await openUp(p, '0006');
  assert.deepEqual(gotos(p, queued(p, '0006')).map(b => b.textContent), ['0005']);
  const kept = queued(p, '0002');
  p.timers.shift()(); // the next poll
  await p.settle();
  assert.ok(!queued(p, '0005'), '0005 has left the queue');
  assert.deepEqual(gotos(p, queued(p, '0006')), [], 'it is no button now');
  assert.equal(queued(p, '0002'), kept, 'a row with nothing new keeps its node');
});

test('0154 AC4: each id button says where it goes to a screen reader and is at least 44 px high on a touch screen', async () => {
  const p = fakePage([board()]);
  await p.settle();
  await openUp(p, '0001', '0006');
  const all = [...gotos(p, shaping(p, '0001')), ...gotos(p, queued(p, '0006'))];
  assert.equal(all.length, 2);
  for (const b of all) assert.match(b.attrs['aria-label'], new RegExp(`^Go to ticket ${b.textContent}, `));
  const touch = (css().match(/@media \(pointer: coarse\) \{([\s\S]*)$/) || [])[1] || '';
  assert.match(touch, /\.deps \.chip, \.deps \.slot \{ min-height: 44px; \}/, 'a tap area 44 px high on a touch screen');
});

async function withBoard(fn, { width = 1280 } = {}) {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  const STATE = board();
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height: 500, deviceScaleFactor: 1, mobile: width < 700 });
    await b.send('Emulation.setTouchEmulationEnabled', width < 700 ? { enabled: true, maxTouchPoints: 1 } : { enabled: false }); // 0417: a phone's touch screen, where controls are finger-sized
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
      const STATE = ${JSON.stringify(STATE)}, real = window.fetch.bind(window);
      window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? new Response(JSON.stringify(STATE), { status: 200, headers: { 'content-type': 'application/json' } }) : real(url, opts);
    })();` });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    for (let i = 0; ; i++) {
      try { if (await b.js(`location.port === '${panel.port}' && !!document.querySelector('#queue .q .dep-chip')`)) break; } catch (e) { if (i >= 100) throw e; }
      if (i >= 100) throw new Error('timed out waiting for the panel');
      await new Promise(res => setTimeout(res, 100));
    }
    await fn(b);
  } finally { await b.close(); await stop(panel); }
}

// 0468: opens these cards, as only an open card's dependency box has ids that go to their tickets.
const OPEN = ids => `(() => { for (const id of ${JSON.stringify(ids)}) { const n = [...document.querySelectorAll('#shaping .item, #queue .q')].find(c => c.querySelector('.id').textContent === id);
  if (!n.classList.contains('open')) n.firstElementChild.click(); } return true; })()`;
const GOTOS = list => `[...document.querySelectorAll('#${list} button[aria-label^="Go to ticket "]')]`;

test('0154 AC4: on a 375 px screen every id button is at least 44 px high and named for its ticket', skip, () => withBoard(async b => {
  // 0410: each lane's in turn, as only the open one shows
  const sizes = [];
  for (const [lane, list, ids] of [['plan', 'shaping', ['0001', '0003']], ['build', 'queue', ['0002', '0006']]]) {
    await b.js(openLane(lane));
    await b.js(OPEN(ids));
    await b.until(`${GOTOS(list)}.length >= 2`, 'the open cards\' id buttons');
    sizes.push(...await b.js(`${GOTOS(list)}.map(n => [n.getAttribute('aria-label'), n.textContent, Math.round(n.getBoundingClientRect().height)])`));
  }
  assert.ok(sizes.length >= 4, `found the id buttons: ${JSON.stringify(sizes)}`);
  for (const [label, text, h] of sizes) {
    assert.match(label, new RegExp(`^Go to ticket ${text}, `));
    assert.ok(h >= 44, `${text} is ${h} px high`);
  }
}, { width: 375 }));

test('0154 AC2: in a browser, pressing Enter on an id brings its ticket into view and highlights it without opening anything', skip, () => withBoard(async b => {
  await b.js(openLane('build'));
  await b.js(OPEN(['0002']));
  await b.until(`${GOTOS('queue')}.some(n => n.textContent === '0001')`, 'its dependency box');
  await b.js(`document.querySelector('#queue').scrollIntoView()`);
  await b.js(`(() => { const btn = ${GOTOS('queue')}.find(n => n.textContent === '0001'); btn.focus(); })()`);
  await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
  await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await b.until(`[...document.querySelectorAll('#shaping .item')].some(n => n.classList.contains('flash'))`, 'the highlight');
  const r = await b.js(`(() => { const n = [...document.querySelectorAll('#shaping .item')].find(n => n.classList.contains('flash')); const box = n.getBoundingClientRect();
    return { id: n.querySelector('.id').textContent, inView: box.bottom > 0 && box.top < innerHeight, open: document.querySelectorAll('.item.open, .q.open').length }; })()`);
  assert.deepEqual(r, { id: '0001', inView: true, open: 1 }, 'only the card it was pressed in is open');
  await b.until(`![...document.querySelectorAll('.flash')].length`, 'the highlight to end by itself');
}));

test('0154 AC1: in a browser, a tap on a ticket lights nothing up, even for a moment, and a mouse over it still does', skip, () => withBoard(async b => {
  // The middle of its Queued line: it has no bar since 0156.
  // 0413: below speck's screen, the card may start under the fold of this 500 px window, so it's scrolled to first.
  const at = await b.js(`(() => { const q = [...document.querySelectorAll('#queue .q')].find(n => n.querySelector('.id').textContent === '0002'); q.scrollIntoView({ block: 'center' }); const r = q.querySelector('.act').getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
  assert.ok(at[1] < await b.js('innerHeight'), 'it is on screen');
  // Every time a ticket is lit or dimmed, as headless Chrome sends a mouseleave straight after a tap's mouseenter, which a phone doesn't.
  await b.js(`window.marks = 0; window.tapped = false;
    new MutationObserver(ms => { for (const m of ms) if (/\\b(hl|dim)\\b/.test(m.target.className)) marks++; }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
    document.addEventListener('mouseover', () => { tapped = true; }, true)`);
  await b.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: at[0], y: at[1] }] });
  await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await b.until(`window.tapped`, 'the tap\'s mouse events to reach the page');
  await new Promise(r => setTimeout(r, 100));
  assert.equal(await b.js(`marks`), 0, 'nothing lit or dimmed by a tap');
  await b.send('Emulation.setTouchEmulationEnabled', { enabled: false });
  // The mouse comes onto it from off the card, rather than counting on headless Chrome's mouseleave after the tap (0156).
  await b.move([2, 2]);
  await b.move([at[0], at[1] + 1]);
  await b.until(`document.querySelectorAll('.hl, .dim').length > 0`, 'the mouse to light the chain up');
}));
