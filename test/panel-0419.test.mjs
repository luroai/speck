import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, full, fakePage, items, queueRows, click, exitOf, stoppedClock, panelRepo, freePort, startPanel, stop, findChrome, browserPage, openLane, openQueueRows } from './support/panel.mjs';

// ---------- 0419: a closed Plan or Build ticket is a title line and one line of details ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const NOW = Date.parse('2026-10-23T12:00:00.000Z');
const ago = s => new Date(NOW - s * 1000).toISOString();
const idOf = (p, n) => p.all(n).find(x => x.className === 'id')._text;
const card = (p, id) => [...items(p), ...queueRows(p)].find(n => idOf(p, n) === id);
const topOf = n => n.children[0]; // a Plan item's head, or a queue card's top row
// 0461: an open Build card's track of steps sits between its two lines, so they're found past it
const linesOf = n => topOf(n).children.filter(c => !/^track\b/.test(c.className)).map(c => c.className); // the two lines in it
const detailsOf = n => topOf(n).children.filter(c => !/^track\b/.test(c.className))[1];

const board = () => ({
  run: { on: true },
  tickets: [
    full('0418', { title: 'Lay the panel out in one column', priority: 2, size: 'S', risk: 'low' }),
    full('0419', { title: 'Fit a closed ticket on two lines', priority: 3, size: 'M', risk: 'low', acceptance_criteria: ['One.', 'Two.', 'Three.'], after: ['0418'], waiting_on: ['0418'] }),
    full('0430', { title: 'One that fails lint', priority: 4, size: 'S', risk: 'high', type: 'bug', lint: { errors: 2, warnings: 1 } }),
    T('0501', 'building', { title: 'Writing its code', priority: 3, size: 'M', risk: 'low', started: ago(19 * 60 + 18), build_running: true }),
    T('0502', 'ready', { title: 'Waiting its turn', priority: 3, size: 'M', risk: 'low', after: ['0501', '0503'], waiting_on: ['0501', '0503'] }),
    T('0503', 'ready', { title: 'Next up', priority: 1, size: 'S', risk: 'high' }),
  ],
  ideas: [],
});
const page = (s = board()) => fakePage([s], { Date: stoppedClock(NOW) });

test('0419 AC1: a closed Plan ticket is its id and title, then its priority, size, risk, criteria, lint result and what it waits on, separated by " · "', async () => {
  const p = page();
  await p.settle();
  const t = card(p, '0419');
  assert.deepEqual(linesOf(t), ['line', 'checks'], 'a title line and a details line');
  assert.equal(topOf(t).children[0].textContent, '0419Fit a closed ticket on two lines', 'the id and the title');
  assert.equal(detailsOf(t).textContent, 'P3 · M · low · 3 criteria · lint passes · after 0418');
  assert.equal(detailsOf(card(p, '0418')).textContent, 'P2 · S · low · 2 criteria · lint passes · unlocks 0419', 'one that waits on nothing has no "after"');
  assert.equal(detailsOf(card(p, '0430')).textContent, 'P4 · S · high · bug · 2 criteria · lint: 2 errors · 1 warning');
  assert.ok(!t.textContent.includes('waiting on'), 'Plan says "after", not "waiting on"');
});

// 0434: a closed Build ticket's stage sentence is a grid of lights while an agent is at work on it, and its priority,
// size and risk show only while it's open.
test('0419 AC2: a closed Build ticket is its id and title, then its stage sentence, stage and timer; a queued one starts "Queued · waiting on <ids>"', async () => {
  const p = page();
  await p.settle();
  const b = card(p, '0501');
  assert.deepEqual(linesOf(b), ['line', 'progress']);
  assert.equal(topOf(b).children[0].textContent, '0501Writing its code');
  assert.equal(detailsOf(b).textContent, ' Build · 19:18');
  assert.equal(detailsOf(b).children[0].attrs['aria-label'], 'Writing tests and code');
  const q = card(p, '0502');
  assert.deepEqual(linesOf(q), ['line', 'act']);
  assert.equal(detailsOf(q).textContent, 'Queued · waiting on 0501, 0503');
  assert.equal(detailsOf(card(p, '0503')).textContent, 'Queued · unlocks 0502');
  for (const id of ['0501', '0502', '0503']) assert.deepEqual(card(p, id).children.map(c => c.className), ['top'], `${id}: nothing under the two lines`);
});

test('0419 AC3: the priority opens its menu, size and risk explain themselves, and each id after "after" or "waiting on" is a Go to ticket link', async () => {
  const p = page();
  await p.settle();
  const tags = n => p.all(detailsOf(n)).filter(x => /\btag\b/.test(x.className));
  // Plan: the priority opens the menu that sets it
  const [prio, size, risk] = tags(card(p, '0419'));
  assert.equal(prio.attrs['aria-label'], 'Priority 3: built after P0 to P2 tickets. Opens the priority menu');
  click(prio);
  await p.settle();
  const menu = p.all(card(p, '0419')).find(x => x.className === 'prio-menu');
  assert.ok(menu, 'the priority menu opened');
  assert.deepEqual(menu.children.map(x => x.textContent), ['P1', 'P2', 'P3', 'P4', 'P5']);
  // size and risk, in Plan and in Build, show their explanations
  for (const [n, tip] of [[size, 'M: several files or one new component'], [risk, 'Low risk: waits for you to ship it']]) {
    assert.equal(n.tip, tip);
    assert.equal(n.attrs.role, 'button');
  }
  click(topOf(card(p, '0501'))); // 0434: a Build ticket's tags show while it's open
  await p.settle();
  const [bPrio, bSize, bRisk] = tags(card(p, '0501'));
  assert.deepEqual([bPrio.tip, bSize.tip, bRisk.tip], ['Priority 3: built after P0 to P2 tickets', 'M: several files or one new component', 'Low risk: waits for you to ship it']);
  // the ids are Go to ticket links, in Plan and in Build
  const gotos = n => p.all(detailsOf(n)).filter(x => x.className === 'goto').map(x => x.attrs['aria-label']);
  assert.deepEqual(gotos(card(p, '0419')), ['Go to ticket 0418']);
  assert.deepEqual(gotos(card(p, '0502')), ['Go to ticket 0501', 'Go to ticket 0503']);
});

test('0419 AC4: a question, a recommendation, a Ship hint and a message still show under the two lines, while the card is open (0434)', async () => {
  const s = { run: { on: true }, tickets: [
    T('0601', 'blocked', { started: ago(300), blocked_question: 'A or B?', blocked_recommendation: 'A', blocked_resumable: true }),
    T('0602', 'blocked', { started: ago(300), blocked_question: 'C or D?', blocked_recommendation: 'C', foreman_will: true }),
    T('0603', 'approved', { started: ago(900), approved: ago(60), rounds: [{ round: 1, verdict: 'approve' }], ...exitOf('Approved, not shipped.') }),
    T('0604', 'building', { started: ago(200), ...exitOf('It ended.') }),
  ], ideas: [] };
  const p = page(s);
  await p.settle();
  await openQueueRows(p); // 0434: what's under a Build card's two lines shows while it's open
  const under = id => card(p, id).children.slice(1).map(c => c.className).filter(c => !/^(full-open|log)$/.test(c)); // then its buttons and log, as it's open
  for (const id of ['0601', '0602', '0603', '0604']) assert.deepEqual(linesOf(card(p, id)), ['line', 'progress'], `${id}: the two lines first`);
  assert.deepEqual(under('0601'), ['question', 'act']);
  assert.ok(p.all(card(p, '0601')).some(n => n.className === 'go-with' && n.textContent === 'Go with the recommendation'), 'the recommendation button');
  assert.deepEqual(under('0602'), ['question', 'act foreman-will']);
  assert.equal(card(p, '0602').children[2].textContent, 'The Foreman will take its recommendation: C');
  assert.deepEqual(under('0603'), ['act to-ship', 'question exit to-ship']);
  assert.equal(card(p, '0603').children[2].textContent, 'Approved, not shipped.');
  assert.deepEqual(under('0604'), ['act bad', 'question exit']);
});

// ---------- in a real browser: a 420 px side pane with a mouse ----------

// Enough tickets to wait on that the details need three lines or more at 420 px, while the card is open (0434).
const LONG_WAIT = Array.from({ length: 20 }, (_, i) => String(901 + i).padStart(4, '0')); // 0441: enough for three lines of details in a proportional font
const PANE = {
  run: { on: true },
  tickets: [
    full('0701', { title: 'A short draft', priority: 3, size: 'M', risk: 'low', after: ['0705'], waiting_on: ['0705'] }),
    full('0702', { title: 'A draft whose title is long enough that it has to wrap onto a second line here', priority: 2, size: 'S', risk: 'high', type: 'bug' }),
    T('0703', 'building', { title: 'Building now', priority: 3, size: 'M', risk: 'low', started: ago(65), build_running: true }),
    T('0704', 'reviewing', { title: 'Under review', priority: 2, size: 'S', risk: 'low', started: ago(65), build_running: true, rounds: [{ round: 1, verdict: 'request_changes' }], review_running: 2, reviewer: 'codex' }),
    T('0705', 'ready', { title: 'Queued behind', priority: 3, size: 'M', risk: 'low', after: ['0703'], waiting_on: ['0703'] }),
    T('0706', 'ready', { title: 'Queued and free', priority: 1, size: 'S', risk: 'high' }),
    T('0707', 'ready', { title: 'Waiting on many', priority: 3, size: 'M', risk: 'low', after: LONG_WAIT, waiting_on: LONG_WAIT }),
  ],
  ideas: [],
};
const stub = `(() => {
  const STATE = ${JSON.stringify(PANE)};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(STATE) : /\\/log$/.test(String(url)) ? json({ text: '' }) : opts.method === 'POST' ? json({}) : real(url, opts);
})();`;
// Each card in the lane: its height, how many lines its title and its details take, the details' text size and the
// title's, and any part of the details line broken over two lines.
const CARDS = sel => `(async () => {
  await document.fonts.ready;
  // the lines its text is on: its text's boxes, with a baseline more than 4 px from the last line's on a line of its own
  const lines = n => { const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT), out = [];
    for (let t; (t = w.nextNode());) { const r = document.createRange(); r.selectNodeContents(t); for (const x of r.getClientRects()) if (x.width > 0 && !out.some(b => Math.abs(b - x.bottom) <= 4)) out.push(x.bottom); }
    return out.length; };
  return [...document.querySelectorAll(${JSON.stringify(sel)})].map(c => {
    const top = c.firstElementChild, title = top.querySelector('.title'), details = top.children[1];
    return { id: c.querySelector('.id').textContent, height: c.getBoundingClientRect().height, titleLines: lines(title), detailLines: lines(details),
      titleSize: parseFloat(getComputedStyle(title).fontSize), detailSize: parseFloat(getComputedStyle(details).fontSize),
      broken: [...details.children].filter(n => !n.matches('.sep, .ids') && n.getClientRects().length > 1).map(n => n.textContent),
      // 0434: a closed Build card's status line is one line that ends in an ellipsis when it doesn't fit, inside the card
      cut: title.scrollWidth > title.clientWidth + 0.5 && getComputedStyle(title).textOverflow === 'ellipsis',
      overflows: (getComputedStyle(details).textOverflow !== 'ellipsis' && details.scrollWidth > details.clientWidth + 0.5) || details.getBoundingClientRect().right > c.getBoundingClientRect().right };
  });
})()`;

test('0419 AC1, AC2 and AC5: at 420 px with a mouse, a closed ticket whose title fits on one line and details on two is no more than 64 px tall, and its details are smaller type that wraps only when it does not fit', skip, async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 420, height: 900, deviceScaleFactor: 1, mobile: false });
    await b.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.querySelectorAll('#queue .q').length === 5 && document.querySelectorAll('#shaping .item.ticket').length === 2`, 'the panel');
    assert.equal(await b.js(`matchMedia('(pointer: coarse)').matches`), false, 'a mouse is the main pointer, not a touch screen');
    const seen = [];
    for (const [lane, sel] of [['plan', '#shaping .item.ticket'], ['build', '#queue .q']]) {
      await b.js(openLane(lane));
      for (const c of await b.js(CARDS(sel))) {
        seen.push(c.id);
        assert.ok(c.detailSize < c.titleSize, `${c.id}: the details (${c.detailSize} px) are smaller than the title (${c.titleSize} px)`);
        assert.deepEqual(c.broken, [], `${c.id}: the details line wraps only between its parts`);
        assert.ok(!c.overflows, `${c.id}: the details stay inside the card`);
        // 0434: a closed ticket's title is one line, cut off with an ellipsis when it doesn't fit
        assert.equal(c.titleLines, 1, `${c.id}: the title is on one line`);
        if (c.id === '0702') { assert.ok(c.cut, '0702: a long title is cut off'); continue; }
        // 0434: a closed Build card's status line is one line, even with a long list of tickets it waits on, cut off
        // where it doesn't fit; an open one wraps between its ids. A Plan card's details still wrap when they don't fit.
        assert.equal(c.detailLines, 1, `${c.id}: the details fit on one line`);
        assert.ok(c.height <= 64, `${c.id}: ${c.height} px tall`);
      }
    }
    assert.deepEqual(seen, ['0701', '0702', '0703', '0704', '0705', '0706', '0707']);
    // 0434: open, its details wrap between the ids it waits on
    await b.js(`[...document.querySelectorAll('#queue .q')].find(q => q.querySelector('.id').textContent === '0707').querySelector('.top').click()`);
    await b.until(`!!document.querySelector('#queue .q.open')`, '0707 to open');
    const [open] = await b.js(CARDS('#queue .q.open'));
    assert.ok(open.id === '0707' && open.detailLines >= 3 && !open.overflows, `0707 open: ${open.detailLines} lines of details`);
  } finally { await b.close(); await stop(panel); }
});

test('0419 AC1 and AC2: a ticket missing its priority, size or risk, or with no timer, leaves them out of its line, with no empty part', async () => {
  const bare = { priority: '', size: '', risk: '' };
  const p = page({ run: { on: true }, tickets: [full('0801', bare), T('0802', 'building', { ...bare, started: 'not a date' }), T('0803', 'ready', bare),
    T('0804', 'reviewing', { priority: 2, size: '', risk: 'low', started: ago(5) })], ideas: [] });
  await p.settle();
  assert.equal(detailsOf(card(p, '0801')).textContent, '2 criteria · lint passes');
  assert.equal(detailsOf(card(p, '0802')).textContent, ' Build');
  assert.equal(detailsOf(card(p, '0803')).textContent, 'Queued');
  assert.equal(detailsOf(card(p, '0804')).textContent, ' Review 1 · The reviewer · 00:05');
  for (const id of ['0802', '0803', '0804']) { click(topOf(card(p, id))); await p.settle(); } // 0434: the tags show while it's open
  assert.equal(detailsOf(card(p, '0802')).textContent, ' Build');
  assert.equal(detailsOf(card(p, '0803')).textContent, 'Queued');
  assert.equal(detailsOf(card(p, '0804')).textContent, ' Review 1 · The reviewer · 00:05 · P2 · low');
});
