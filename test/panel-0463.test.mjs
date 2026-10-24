import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, full, fakePage, boardPage, items, queueRows, click, stoppedClock, panelRepo, freePort, startPanel, stop, findChrome, browserPage, openLane } from './support/panel.mjs';
import { rules, selectors } from './support/css.mjs';

// ---------- 0463: an open ticket that hasn't started shows the same step track and facts table as one in flight ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const NOW = Date.parse('2026-10-24T12:00:00.000Z');
const ago = s => new Date(NOW - s * 1000).toISOString();
const LONG = 'a-risk-with-a-very-long-name-that-cannot-fit';
const many = n => Array.from({ length: n }, (_, i) => String(1000 + i));

const TICKETS = [
  full('0801', { priority: 3, size: 'M', risk: 'low' }),
  full('0802', { priority: 1, size: 'S', risk: 'high', type: 'bug', after: ['0801'], waiting_on: ['0801'], lint: { errors: 2, warnings: 1 } }),
  full('0803', { priority: 4, size: 'S', risk: LONG, task: 'document', after: many(27), waiting_on: many(11), lint: { errors: 0, warnings: 3 } }),
  full('0804', { after: ['0700'], waiting_on: [] }),
  T('0811', 'building', { started: ago(65), build_running: true, builder: 'claude' }),
  T('0812', 'ready', { priority: 2, size: 'M', risk: 'high', type: 'fix', after: ['0811'], waiting_on: ['0811'] }),
  T('0813', 'ready', { priority: 5, risk: LONG, after: many(3), waiting_on: many(2), lint: { errors: 1, warnings: 0 } }),
  T('0814', 'ready', {}),
];
const board = () => ({ run: { on: true }, ideas: [], tickets: TICKETS });
const page = () => fakePage([board()], { Date: stoppedClock(NOW) });
const idOf = (p, n) => p.all(n).find(x => x.className === 'id')._text;
const card = (p, id) => [...items(p), ...queueRows(p)].find(n => idOf(p, n) === id);
const topOf = n => n.children[0]; // a Plan item's head, or a queue card's top row
const factsIn = n => topOf(n).children.find(c => c.className === 'facts') || null;
const trackIn = n => topOf(n).children.find(c => /^track\b/.test(c.className)) || null;
const cells = f => f.children.map(c => [c.children[0].textContent, c.children[1].textContent]);
const PLAN = ['0801', '0802', '0803', '0804'], QUEUED = ['0812', '0813', '0814'];
async function openAll(p) {
  for (const id of PLAN) { click(topOf(card(p, id))); await p.settle(); }
  for (const id of QUEUED) { click(topOf(card(p, id))); await p.settle(); }
}

test('0463 AC1: an open Plan ticket and an open queued Build ticket show the grey track, then the table, under the title', async () => {
  const p = page();
  await p.settle();
  await openAll(p);
  for (const id of [...PLAN, ...QUEUED]) {
    const c = card(p, id), kids = topOf(c).children, track = trackIn(c), f = factsIn(c);
    assert.ok(/\bopen\b/.test(c.className), `${id}: open`);
    assert.deepEqual(kids.map(k => k.className.split(' ')[0]), ['line', 'track', 'facts'], `${id}: title, track, table`);
    assert.equal(track.className, 'track', `${id}: not stopped`);
    assert.deepEqual(track.children.map(s => s.className), ['step build', 'step check', 'step review', 'step approve', 'step ship'], `${id}: five grey steps`);
    assert.deepEqual(track.children.map(s => s.textContent), ['Build', 'Self-check', 'Review', 'Approve', 'Ship'], `${id}: the steps' names`);
    assert.equal(f.tagName, 'dl', `${id}: a list of labels and values`);
    assert.equal(f.children.length, 6, `${id}: six cells`);
    for (const cell of f.children) {
      const v = cell.children[1];
      assert.match(v.className, /^value\b/, `${id}: a value`);
      assert.equal(v.title, v.textContent, `${id}: ${cell.children[0].textContent}'s tooltip is its whole text`);
    }
  }
});

const all = rules();
const plain = all.filter(r => !r.at.length);
test('0463 AC1: the track and the table look the same on a Plan ticket as on a Build card', () => {
  const qs = plain.filter(r => selectors(r).some(s => /^\.q \.(track|facts)\b/.test(s)));
  assert.ok(qs.length >= 20, 'the track\'s and table\'s rules');
  for (const r of qs) {
    for (const s of selectors(r).filter(s => s.startsWith('.q '))) {
      assert.ok(selectors(r).includes(s.replace('.q ', '.item.ticket ')), `${s} also styles a Plan ticket's`);
    }
  }
});

test('0463 AC2: the six cells are Status, After or Waiting on, Lint, Priority, Size · risk and Type', async () => {
  const p = page();
  await p.settle();
  await openAll(p);
  const want = {
    '0801': [['Status', 'Draft'], ['After', '—'], ['Lint', 'passes'], ['Priority', 'P3'], ['Size · risk', 'M · low'], ['Type', 'code']],
    '0802': [['Status', 'Draft'], ['After', '1 left'], ['Lint', '2 errors · 1 warning'], ['Priority', 'P1'], ['Size · risk', 'S · high'], ['Type', 'bug']],
    '0803': [['Status', 'Draft'], ['After', '11 left of 27'], ['Lint', '3 warnings'], ['Priority', 'P4'], ['Size · risk', `S · ${LONG}`], ['Type', 'document']],
    '0804': [['Status', 'Draft'], ['After', '—'], ['Lint', 'passes'], ['Priority', 'P2'], ['Size · risk', 'S · low'], ['Type', 'code']],
    '0812': [['Status', 'Queued'], ['Waiting on', '1 left'], ['Lint', 'passes'], ['Priority', 'P2'], ['Size · risk', 'M · high'], ['Type', 'fix']],
    '0813': [['Status', 'Queued'], ['Waiting on', '2 left of 3'], ['Lint', '1 error'], ['Priority', 'P5'], ['Size · risk', `S · ${LONG}`], ['Type', 'code']],
    '0814': [['Status', 'Queued'], ['Waiting on', '—'], ['Lint', 'passes'], ['Priority', 'P2'], ['Size · risk', 'S · low'], ['Type', 'code']],
  };
  for (const [id, rows] of Object.entries(want)) assert.deepEqual(cells(factsIn(card(p, id))), rows, id);
  // errors and warnings in their colours, and the kinds in their tags' colours
  const lint = id => factsIn(card(p, id)).children[2].children[1].children.filter(n => n.tagName !== '#text').map(n => [n.className, n.textContent]);
  assert.deepEqual(lint('0802'), [['bad', '2 errors'], ['warn', '1 warning']]);
  assert.deepEqual(lint('0803'), [['warn', '3 warnings']]);
  assert.deepEqual(lint('0813'), [['bad', '1 error']]);
  const kind = id => factsIn(card(p, id)).children[5].children[1].className;
  assert.equal(kind('0802'), 'value bug');
  assert.equal(kind('0803'), 'value document');
  assert.equal(kind('0812'), 'value fix');
  assert.equal(kind('0801'), 'value');
});

test('0463 AC3: the dotted line is gone from an open one, closed ones keep theirs, and what\'s under it stays', async () => {
  const p = page();
  await p.settle();
  for (const id of PLAN) assert.deepEqual(topOf(card(p, id)).children.map(c => c.className), ['line', 'checks'], `${id}: closed, its line`);
  for (const id of QUEUED) assert.deepEqual(topOf(card(p, id)).children.map(c => c.className), ['line', 'act'], `${id}: closed, its line`);
  assert.equal(topOf(card(p, '0812')).children[1].textContent, 'Queued · fix'); // 0468: its ids in its chip
  await openAll(p);
  for (const id of [...PLAN, ...QUEUED]) {
    assert.ok(!p.all(topOf(card(p, id))).some(n => /^(checks|act)\b/.test(n.className || '')), `${id}: no dotted line`);
  }
  // a Plan ticket's detail is still under it: its problem, outcome, readiness list with its criteria, Set ready and Full ticket
  const plan = card(p, '0802');
  assert.equal(plan.children[1].className, 'detail');
  const text = plan.children[1].textContent;
  for (const s of ['Problem of 0802.', 'Outcome of 0802.', '2 criteria', 'Set ready', 'Full ticket']) assert.ok(text.includes(s), `0802: ${s}`);
  // its priority control is in its Priority cell, and opens the menu that sets it
  const prio = p.all(factsIn(plan).children[3]).find(n => /\bpick\b/.test(n.className || '') && n.attrs?.role === 'button');
  assert.ok(prio, 'the priority control');
  assert.equal(prio.attrs['aria-label'], 'Priority 1: built after P0 tickets. Opens the priority menu');
  click(prio);
  await p.settle();
  const menu = p.all(card(p, '0802')).find(n => n.className === 'prio-menu');
  assert.ok(menu, 'the menu opened');
  assert.deepEqual(menu.children.map(n => n.textContent), ['P1', 'P2', 'P3', 'P4', 'P5']);
  // a queued ticket keeps its buttons and log under the table
  const q = card(p, '0812');
  const names = q.children.slice(1).map(n => (n.tagName === 'button' ? n.textContent : n.className));
  assert.deepEqual(names.filter(n => /Full ticket|Back to Plan|^log$/.test(n)), ['Full ticket', 'Back to Plan', 'log']);
});

test('0463 AC3: an open queued card puts its table right when the tickets it waits on change, without redrawing the card', async () => {
  // a draft that waits on it changes its chain, which only puts the kept card's parts right
  const next = { ...board(), tickets: [...TICKETS, T('0815', 'draft', { after: ['0814'], waiting_on: ['0814'] })] };
  const p = boardPage([board(), next], { Date: stoppedClock(NOW) });
  await p.settle();
  click(topOf(card(p, '0814')));
  await p.settle();
  const kept = card(p, '0814');
  assert.equal(cells(factsIn(kept))[0][1], 'Queued');
  p.timers.shift()();
  await p.settle();
  assert.equal(card(p, '0814'), kept, 'the same card');
  assert.ok(factsIn(kept), 'still its table, not the dotted line');
  assert.ok(!topOf(kept).children.some(c => /^act\b/.test(c.className)), 'and no line beside it');
  assert.equal(p.all(topOf(kept)).find(n => n.className === 'chain')?.title, 'Starts a chain: unlocks 0815', 'its chain icon put right');
});

test('0463 AC4: a screen reader reads each cell as its label, then its value', async () => {
  const p = page();
  await p.settle();
  await openAll(p);
  for (const id of ['0802', '0812']) {
    for (const c of factsIn(card(p, id)).children) {
      assert.equal(c.tagName, 'div', `${id}: a cell is a group in the list`);
      assert.deepEqual(c.children.map(n => n.tagName), ['dt', 'dd'], `${id}: its label is a term, its value its description`);
      assert.ok(c.children[0].textContent && c.children[1].textContent, `${id}: both have words`);
    }
  }
});

const stub = `(() => {
  const STATE = ${JSON.stringify(board())};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(STATE) : /\\/log$/.test(String(url)) ? json({ text: '' }) : opts.method === 'POST' ? json({}) : real(url, opts);
})();`;
const MEASURE = sel => `(async () => {
  await document.fonts.ready;
  return [...document.querySelectorAll(${JSON.stringify(sel)})].map(c => {
    const f = c.querySelector('.facts'), t = c.querySelector('.track');
    if (!f || !t) return { id: c.querySelector('.id').textContent, none: true };
    const box = f.getBoundingClientRect(), card = c.getBoundingClientRect();
    return { id: c.querySelector('.id').textContent, box: [box.left, box.right], card: [card.left, card.right], scroll: [f.scrollWidth, f.clientWidth],
      dotted: !!c.querySelector('.checks, .top > .act'),
      steps: [...t.children].map(s => [getComputedStyle(s).borderTopColor, getComputedStyle(s).color]),
      cells: [...f.children].map(n => { const b = n.getBoundingClientRect(), l = n.children[0], v = n.children[1], lb = l.getBoundingClientRect(), vb = v.getBoundingClientRect();
        return { label: l.textContent, value: v.textContent, tip: v.title, top: b.top, left: b.left, width: b.width, height: b.height,
          labelAt: [lb.top - b.top, lb.left - b.left], valueAt: [vb.top - b.top, vb.left - b.left], labelHeight: lb.height, valueHeight: vb.height,
          lineHeight: parseFloat(getComputedStyle(v).lineHeight), cut: v.scrollWidth > v.clientWidth + 0.5, ellipsis: getComputedStyle(v).textOverflow === 'ellipsis' }; }) };
  });
})()`;

function checkCards(cards, width, ids) {
  assert.deepEqual(cards.map(c => c.id).filter(id => ids.includes(id)).sort(), [...ids].sort(), `${width}: every card`);
  for (const c of cards.filter(c => ids.includes(c.id))) {
    const at = `${width} ${c.id}`;
    assert.ok(!c.none, `${at}: a track and a table`);
    assert.ok(!c.dotted, `${at}: no dotted line`);
    assert.ok(c.box[0] >= c.card[0] && c.box[1] <= c.card[1], `${at}: inside its card`);
    assert.ok(c.scroll[0] <= c.scroll[1] + 0.5, `${at}: nothing past the table`);
    assert.equal(new Set(c.steps.map(s => s.join())).size, 1, `${at}: every step the same grey`);
    const [first] = c.cells;
    for (const [i, cell] of c.cells.entries()) {
      const rowFirst = c.cells[i < 3 ? 0 : 3];
      assert.ok(Math.abs(cell.top - rowFirst.top) < 0.5, `${at}: ${cell.label} is in its row`);
      assert.ok(Math.abs(cell.height - rowFirst.height) < 0.5, `${at}: ${cell.label} is as tall as its row`);
      assert.ok(Math.abs(cell.height - c.cells[0].height) < 0.5, `${at}: ${cell.label}'s row is as tall as the first`);
      assert.ok(Math.abs(cell.width - first.width) < 1, `${at}: ${cell.label} is as wide as the others`);
      assert.ok(Math.abs(cell.labelAt[0] - first.labelAt[0]) < 0.5 && Math.abs(cell.labelAt[1] - first.labelAt[1]) < 0.5, `${at}: ${cell.label}'s label in the same place`);
      assert.ok(Math.abs(cell.valueAt[0] - first.valueAt[0]) < 0.5 && Math.abs(cell.valueAt[1] - first.valueAt[1]) < 0.5, `${at}: ${cell.label}'s value in the same place`);
      assert.ok(cell.valueHeight <= cell.lineHeight + 0.5, `${at}: ${cell.label}'s value is one line (${cell.valueHeight} px)`);
      assert.ok(cell.ellipsis, `${at}: ${cell.label} ends in … when it's too long`);
      assert.equal(cell.tip, cell.value, `${at}: ${cell.label}'s tooltip`);
    }
    if (c.id === '0803' || c.id === '0813') assert.ok(c.cells[4].cut && c.cells[4].tip === `S · ${LONG}`, `${at}: the long risk is cut short, with all of it its tooltip`);
  }
}

test('0463 AC3: in a real browser at 320 and 390 px, open Plan and queued tickets show the track and an even table, a long value cut short with …', skip, async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    // with a mouse, and on a touch screen, where a draft's priority has a 44 px tap area
    for (const [width, touch] of [[320, false], [390, false], [320, true], [390, true]]) {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: true });
      await b.send('Emulation.setTouchEmulationEnabled', { enabled: touch, ...(touch ? { maxTouchPoints: 1 } : {}) });
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
      await b.until(`document.querySelectorAll('#queue .q').length === 4`, 'the panel');
      await b.js(`[...document.querySelectorAll('#queue .q.queued .top')].forEach(t => t.click()), true`);
      await b.until(`document.querySelectorAll('#queue .q.open').length === ${QUEUED.length}`, 'every queued card open');
      checkCards(await b.js(MEASURE('#queue .q.open')), width, QUEUED);
      await b.js(openLane('plan'));
      await b.until(`document.querySelectorAll('#shaping .item.ticket').length === ${PLAN.length}`, 'the Plan list');
      await b.js(`[...document.querySelectorAll('#shaping .item.ticket .head')].forEach(h => h.click()), true`);
      await b.until(`document.querySelectorAll('#shaping .item.ticket.open').length === ${PLAN.length}`, 'every Plan ticket open');
      checkCards(await b.js(MEASURE('#shaping .item.ticket.open')), width, PLAN);
      assert.equal(await b.js(`matchMedia('(pointer: coarse)').matches`), touch, `${width}: a touch screen or not`);
      if (touch) {
        const area = await b.js(`(() => { const r = document.querySelector('#shaping .item.ticket.open .set-prio').closest('.prio').getBoundingClientRect(); return [r.width, r.height]; })()`);
        assert.ok(area[0] >= 43.5 && area[1] >= 43.5, `${width}: the priority's tap area is ${area.join(' by ')}`);
      }
    }
  } finally { await b.close(); await stop(panel); }
});
