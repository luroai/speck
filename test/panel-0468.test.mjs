import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, full, boardPage, items, queueRows, click, panelRepo, freePort, startPanel, stop, findChrome, browserPage, openLane } from './support/panel.mjs';

// ---------- 0468: a closed ticket's dependencies are one small chip at the end of its title row ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const LONG = 'A ticket whose title is far too long to fit on a single line of a phone-sized pane, so it is cut off';
const ELEVEN = Array.from({ length: 11 }, (_, i) => `08${String(i).padStart(2, '0')}`);

// 0100 and 0500 wait on eleven queued tickets; 0200 and 0600 are waited on by others and wait on none; 0300 and 0700
// have neither; 0400 waits on one that has shipped.
const TICKETS = () => [
  full('0100', { title: LONG, after: ELEVEN, waiting_on: ELEVEN }),
  full('0200', { title: 'Starts a chain' }), full('0201', { after: ['0200'], waiting_on: ['0200'] }),
  full('0300', { title: 'Alone' }),
  T('0390', 'done'), full('0400', { after: ['0390'], waiting_on: [] }),
  ...ELEVEN.map(id => T(id, 'ready')),
  T('0500', 'ready', { title: LONG, after: ELEVEN, waiting_on: ELEVEN }),
  T('0600', 'ready', { title: 'Unlocks four' }),
  ...['0601', '0602', '0603', '0604'].map(id => T(id, 'ready', { after: ['0600'], waiting_on: ['0600'] })),
  T('0605', 'ready', { after: ['0601'], waiting_on: ['0601'] }), // waits on 0600 only through 0601
  T('0700', 'ready', { title: 'Alone in the queue' }),
];
const board = (tickets = TICKETS()) => ({ run: { on: false }, ideas: [], tickets });
const idOf = (p, n) => p.all(n).find(x => x.className === 'id')?._text;
const card = (p, id) => [...items(p), ...queueRows(p)].find(n => idOf(p, n) === id);
const topOf = n => n.children[0];
const lineOf = n => topOf(n).children[0];
const chipOf = (p, n) => p.all(lineOf(n)).find(x => x.className === 'dep-chip') || null;
const chipSaid = (p, n) => chipOf(p, n)?.title ?? null;
const secondLine = n => topOf(n).children[1];

test('0468 AC1: a closed ticket waiting on unshipped ones ends its title row with a link chip and how many', async () => {
  const p = boardPage([board()]);
  await p.settle();
  for (const id of ['0100', '0500']) {
    const line = lineOf(card(p, id)), chip = line.children[line.children.length - 1];
    assert.equal(chip.className, 'dep-chip', `${id}: the chip is last in its title row`);
    assert.equal(chip.tagName, 'button');
    assert.deepEqual(chip.children[0].children.map(c => [c.className, c.textContent]), [['dep-icon link', ''], ['dep-count', '11']], `${id}: a link icon and 11`);
  }
});

test('0468 AC1: one waiting on none, that others wait on, shows an arrow chip and how many wait on it directly', async () => {
  const p = boardPage([board()]);
  await p.settle();
  for (const [id, n] of [['0200', '1'], ['0600', '4']]) {
    const chip = chipOf(p, card(p, id));
    assert.ok(chip, `${id}: a chip`);
    assert.deepEqual(chip.children[0].children.map(c => [c.className, c.textContent]), [['dep-icon arrow', ''], ['dep-count', n]], `${id}: an arrow and ${n}`);
  }
  // 0601 waits on 0600 and is waited on by 0605: it waits, so its chip is the link one
  assert.deepEqual(chipOf(p, card(p, '0601')).children[0].children.map(c => c.className), ['dep-icon link', 'dep-count']);
});

test('0468 AC1: a ticket with neither, or waiting only on shipped ones, shows no chip; nor does an open one', async () => {
  const p = boardPage([board()]);
  await p.settle();
  for (const id of ['0300', '0400', '0700']) assert.equal(chipOf(p, card(p, id)), null, `${id}: no chip`);
  click(topOf(card(p, '0100')));
  click(topOf(card(p, '0500')));
  await p.settle();
  assert.equal(chipOf(p, card(p, '0100')), null, 'an open Plan ticket has no chip');
  assert.equal(chipOf(p, card(p, '0500')), null, 'an open Build ticket has no chip');
});

test('0468 AC2: the chip\'s accessible name and tooltip say what it counts', async () => {
  const p = boardPage([board()]);
  await p.settle();
  const said = { '0100': 'Waits on 11 tickets', '0500': 'Waits on 11 tickets', '0200': '1 ticket waits on this', '0600': '4 tickets wait on this', '0601': 'Waits on 1 ticket' };
  for (const [id, label] of Object.entries(said)) {
    const chip = chipOf(p, card(p, id));
    assert.equal(chip.attrs['aria-label'], label, `${id}: its name`);
    assert.equal(chip.title, label, `${id}: its tooltip`);
  }
});

test('0468 AC2: pressing the chip opens the card, as pressing its top row does, in Plan and in Build', async () => {
  const p = boardPage([board()]);
  await p.settle();
  for (const id of ['0100', '0600']) {
    assert.doesNotMatch(card(p, id).className, /\bopen\b/);
    p.press(chipOf(p, card(p, id)));
    await p.settle();
    assert.match(card(p, id).className, /\bopen\b/, `${id}: open`);
  }
});

test('0468 AC2: the chip follows the board: a new ticket waiting on one changes its count in place', async () => {
  const more = TICKETS();
  more.push(T('0606', 'ready', { after: ['0600'], waiting_on: ['0600'] }));
  const p = boardPage([board(), board(more)]);
  await p.settle();
  assert.equal(chipOf(p, card(p, '0600')).title, '4 tickets wait on this');
  const kept = card(p, '0600');
  p.timers.shift()(); // the next board
  await p.settle();
  assert.equal(card(p, '0600'), kept, 'the same card, changed in place');
  assert.equal(chipOf(p, card(p, '0600')).title, '5 tickets wait on this');
  assert.equal(p.all(lineOf(card(p, '0600'))).filter(x => x.className === 'dep-chip').length, 1, 'one chip');
});

test('0468 AC1: a closed Build ticket in flight shows its chip too, and a kept one follows the board', async () => {
  const at = new Date().toISOString();
  const tickets = extra => [T('0900', 'building', { title: 'Being built', started: at, build_running: true }),
    ...['0901', '0902', '0903', '0904', ...extra].map(id => T(id, 'ready', { after: ['0900'], waiting_on: ['0900'] })),
    T('0910', 'reviewing', { title: 'Under review', started: at, build_running: true }), T('0911', 'ready', { after: ['0910'], waiting_on: ['0910'] })];
  const p = boardPage([board(tickets([])), board(tickets(['0905']))]);
  await p.settle();
  const chip = chipOf(p, card(p, '0900'));
  assert.ok(chip, 'a building ticket four wait on has a chip');
  assert.deepEqual(chip.children[0].children.map(c => [c.className, c.textContent]), [['dep-icon arrow', ''], ['dep-count', '4']]);
  assert.equal(chip.title, '4 tickets wait on this');
  assert.equal(chipSaid(p, card(p, '0910')), '1 ticket waits on this');
  const kept = card(p, '0900');
  p.timers.shift()(); // the next board, with one more waiting on it
  await p.settle();
  assert.equal(card(p, '0900'), kept, 'the same card, changed in place');
  assert.equal(chipSaid(p, card(p, '0900')), '5 tickets wait on this');
  assert.equal(p.all(lineOf(card(p, '0900'))).filter(x => x.className === 'dep-chip').length, 1, 'one chip');
  click(topOf(card(p, '0900')));
  await p.settle();
  assert.equal(chipOf(p, card(p, '0900')), null, 'open, it has none');
});

test('0468 AC3: the after, unlocks and waiting on ids are gone from closed cards\' second lines', async () => {
  const p = boardPage([board()]);
  await p.settle();
  for (const id of ['0100', '0200', '0500', '0600', '0601']) {
    const text = secondLine(card(p, id)).textContent;
    assert.doesNotMatch(text, /\b(after|unlocks|waiting on)\b/, `${id}: ${text}`);
    assert.ok(!p.all(secondLine(card(p, id))).some(n => n.className === 'goto' || n.className === 'ids'), `${id}: no ids in it`);
  }
  assert.equal(secondLine(card(p, '0500')).textContent, 'Queued');
});

// ---------- in a real browser: the title stays on one line and the chip beside it, from 320 px up ----------

const stub = `(() => {
  const STATE = ${JSON.stringify(board())};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(STATE) : /\\/log$/.test(String(url)) ? json({ text: '' }) : opts.method === 'POST' ? json({}) : real(url, opts);
})();`;
// Each closed card with a chip in the lane shown: how many lines its title takes, whether it's cut off, and where the
// chip sits beside it.
const CHIPS = sel => `(async () => {
  await document.fonts.ready;
  const lines = n => { const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT), out = [];
    for (let t; (t = w.nextNode());) { const r = document.createRange(); r.selectNodeContents(t); for (const x of r.getClientRects()) if (x.width > 0 && !out.some(b => Math.abs(b - x.top) <= 4)) out.push(x.top); }
    return out.length; };
  return [...document.querySelectorAll('${sel}')].filter(c => c.getClientRects().length && c.querySelector('.dep-chip')).map(c => {
    const title = c.querySelector('.title'), chip = c.querySelector('.dep-chip'), t = title.getBoundingClientRect(), k = chip.getBoundingClientRect(), r = c.getBoundingClientRect();
    return { id: c.querySelector('.id').textContent, titleLines: lines(title), cut: title.scrollWidth > title.clientWidth,
      beside: k.left >= t.right - 0.5 && k.top < t.bottom && k.bottom > t.top, inside: k.right <= r.right + 0.5, chipLines: lines(chip) };
  });
})()`;

for (const width of [320, 390, 600, 1000]) {
  test(`0468 AC3: at ${width} px, a closed card's title is one line with its ellipsis and its chip stays beside it`, skip, async () => {
    const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
    const b = await browserPage('about:blank');
    try {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
      await b.send('Page.enable');
      await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
      await b.until(`location.port === '${panel.port}' && !!document.querySelector('#queue .q .dep-chip') && !!document.querySelector('#shaping .item .dep-chip')`, 'the chips');
      for (const [lane, sel, ids] of [['plan', '#shaping .item.ticket:not(.open)', ['0100', '0200']], ['build', '#queue .q:not(.open)', ['0500', '0600']]]) {
        await b.js(openLane(lane));
        const cards = await b.js(CHIPS(sel));
        for (const id of ids) assert.ok(cards.some(c => c.id === id), `${lane}: ${id} is shown`);
        for (const c of cards) {
          assert.equal(c.titleLines, 1, `${width} px, ${c.id}: its title on one line`);
          assert.equal(c.chipLines, 1, `${width} px, ${c.id}: its chip on one line`);
          assert.ok(c.beside, `${width} px, ${c.id}: its chip beside its title, not under it`);
          assert.ok(c.inside, `${width} px, ${c.id}: its chip inside the card`);
        }
        if (width < 1000) for (const id of [ids[0]]) assert.ok(cards.find(c => c.id === id).cut, `${width} px, ${id}: a long title ends in its ellipsis`);
      }
    } finally { await b.close(); await stop(panel); }
  });
}
