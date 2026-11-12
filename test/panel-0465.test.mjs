import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, full, round, boardPage, items, queueRows, shippedRows, top, click, panelRepo, freePort, startPanel, stop, findChrome, browserPage, openLane } from './support/panel.mjs';
import { rules, selectors, get } from './support/css.mjs';

// ---------- 0465: the full ticket shows the step track and facts table its open card shows ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const NOW = new Date(2026, 9, 24, 12, 0).getTime();
const ago = s => new Date(NOW - s * 1000).toISOString();
const LONG = 'a-reviewer-model-with-a-very-long-name-6.1-sol';

const TICKETS = () => [...[
  full('0801', { title: 'A draft', type: 'bug', priority: 3, size: 'M', risk: 'high', lint: { errors: 1, warnings: 2 } }),
  T('0812', 'ready', { title: 'Queued', after: ['0811'], waiting_on: ['0811'], type: 'fix' }),
  T('0811', 'building', { title: 'Building', started: ago(65), build_running: true, builder: 'claude', priority: 1 }),
  T('0813', 'blocked', { title: 'Blocked', started: ago(300), self_check: 'no changes', rounds: [{ ...round(1, 10), verdict: 'request_changes' }], blocked_question: 'Which one?', builder: 'claude' }),
  T('0814', 'reviewing', { title: 'Reviewing', started: ago(65), build_running: true, self_check: 'no changes', review_running: 1, reviewer: 'codex', review_model: LONG }),
  T('0901', 'done', { title: 'Shipped', started: ago(1500), finished: ago(600), builder_tokens: 2412345, builder_cost_usd: 2.906, rounds: [round(1, 60000), round(2, 48234)] }),
  T('0903', 'done', { title: 'Shipped bare' }),
].map(t => ({ problem: `Problem of ${t.id}.`, ...t }))];
const board = (tickets = TICKETS()) => ({ run: { on: true }, ideas: [], tickets });
let clock = NOW;
const Clock = class extends Date { constructor(...a) { super(...(a.length ? a : [clock])); } static now() { return clock; } };
const page = (boards = [board()]) => { clock = NOW; return boardPage(boards, { Date: Clock }); };

const idOf = (p, n) => p.all(n).find(x => x.className === 'id')?._text;
const pane = p => p.byId('full-ticket');
const button = (p, n, text) => p.all(n).find(x => x.tagName === 'button' && x.textContent === text);
// Opens the ticket's card, as the user does, and returns it: [the card, its track, its table]. 0585: a Build row isn't opened.
async function openCard(p, id) {
  let card = items(p).find(n => idOf(p, n) === id);
  if (card) {
    if (!/\bopen\b/.test(card.className)) { click(top(card)); await p.settle(); }
    card = items(p).find(n => idOf(p, n) === id);
    return [card, top(card).children.find(n => n.className.startsWith('track')), top(card).children.find(n => n.className === 'facts')];
  }
  card = queueRows(p).find(n => idOf(p, n) === id);
  if (card) {
    return [card, null, null]; // 0585: a Build row has no track or table of its own
  }
  card = shippedRows(p).find(n => idOf(p, n) === id);
  return [card, null, null]; // 0587: nor has a Shipped row
}
// Opens its full view from its card, as the user does.
async function openFull(p, id) {
  const [card] = await openCard(p, id);
  if (/\bq\b/.test(card.className)) click(card.children[0]); // 0585: a Build row opens its full view, and has no button
  else if (card.tagName === 'tr') p.press(card); // 0587: so does a Shipped row
  else p.press(button(p, card, 'Full ticket'));
  await p.settle();
  assert.equal(pane(p).hidden, false, `${id}: the full view is open`);
  assert.equal(pane(p).children[0].children[0].textContent, id, `${id} is in it`);
}
const paneSteps = p => pane(p).children[1];
const backLink = p => p.all(pane(p)).find(n => n.className === 'close'); // 0583: the back link, in Close's place
// A node as everything it shows: its tag, classes, tooltip, attributes and text, and the same for what's in it.
const shape = n => [n.tagName, n.className ?? null, n.title ?? null, n.attrs ?? null, n.tagName === '#text' ? n.textContent : n._text, (n.children || []).map(shape)];
const cells = f => f.children.map(c => [c.children[0].textContent, c.children[1].textContent]);

const IDS = ['0801', '0812', '0811', '0813', '0814', '0901', '0903'];

test('0465 AC1: the full view shows its track and table under the title and above Problem', async () => {
  for (const id of IDS) {
    const p = page();
    await p.settle();
    await openFull(p, id);
    const kids = pane(p).children;
    assert.equal(kids.length, id === '0801' ? 4 : 3, `${id}: its top, the track and table, then its body, then a draft's bar (0617)`);
    assert.equal(kids[1].className, 'steps', `${id}: the track and table under the top`);
    const [t, f] = kids[1].children;
    assert.equal(t.children.length, 4, `${id}: four bars (0583)`);
    assert.ok(f.children.length >= 6, `${id}: six cells (0583), then Type and any Ready check (0585)`);
    assert.equal(f.className, 'facts');
    const body = kids[2];
    assert.ok(body.children.some(n => n.tagName === 'h4' && n.textContent === 'Problem'), `${id}: Problem after them`);
  }
});

test('0465 AC1: the bars and facts follow where each ticket is (0583)', async () => {
  const p = page();
  await p.settle();
  const seen = {};
  for (const id of IDS) {
    await openFull(p, id);
    const [t, f] = paneSteps(p).children;
    seen[id] = [t.className, t.children.map(s => s.className), cells(f)];
    click(backLink(p));
    await p.settle();
  }
  // 0583: its own four bars and six facts, for every ticket
  const none = ['step', 'step', 'step', 'step'];
  const facts = (p1, size, risk) => [['Priority', p1], ['Level', 'Default'], ['Size', size], ['Risk', risk]]; // 0662: and its level
  assert.deepEqual(seen['0801'], ['track', ['step waits', ...none.slice(1)], [...facts('P3', 'M', 'high'), ['Ships by itself', '–'], ['Builder', '–'], ['Reviewer', '–']]]);
  assert.deepEqual(seen['0812'][1], ['step done', ...none.slice(1)]);
  assert.deepEqual(seen['0811'][1], ['step done', 'step now', 'step', 'step']);
  assert.deepEqual(seen['0811'][2].slice(0, 4), facts('P1', 'S', 'low'));
  assert.deepEqual(seen['0813'][1], ['step done', 'step done', 'step waits', 'step'], 'a blocked one waits for you where it stopped');
  assert.deepEqual(seen['0814'][2][6], ['Reviewer', `Codex · ${LONG}`]);
  assert.deepEqual(seen['0901'][1], Array(4).fill('step done'));
  assert.deepEqual(seen['0903'][1], Array(4).fill('step done'));
});

const plain = rules().filter(r => !r.at.length);
test('0465 AC1: 0583: the full view has its own four-step track (0585: a Build card has none)', () => {
  const columns = sel => get(plain.find(r => selectors(r).includes(sel)), 'grid-template-columns');
  assert.match(columns('#full-ticket .track'), /repeat\(4,/);
  assert.equal(plain.find(r => selectors(r).includes('.q .track')), undefined, 'no five-step track rule is left for a Build row');
});

test('0465 AC2: the tags under the title are gone, and the id, status and Close stay where they are', async () => {
  const p = page();
  await p.settle();
  for (const id of IDS) {
    await openFull(p, id);
    const head = pane(p).children[0];
    assert.deepEqual(head.children.map(n => n.className), ['id', 'state', 'close', 'title'], `${id}: id, status, Close, then the title, and no tags`);
    assert.ok(!p.all(pane(p)).some(n => /\btag\b/.test(n.className || '')), `${id}: no tag anywhere in it`);
    click(backLink(p));
    await p.settle();
  }
  assert.ok(!plain.some(r => selectors(r).some(s => /#full-ticket \.top \.tags/.test(s))), 'no rule for its tags');
});

test('0465 AC3: while it\'s open, the track and table move on with the ticket, and stay put when nothing changes', async () => {
  const moved = TICKETS().map(t => (t.id === '0811' ? { ...t, status: 'reviewing', self_check: 'no changes', review_running: 1, reviewer: 'codex', review_model: 'gpt-x' } : t));
  const shipped = TICKETS().map(t => (t.id === '0811' ? { ...t, status: 'done', finished: ago(0), rounds: [round(1, 900)] } : t));
  const p = page([board(), board(), board(moved), board(moved), board(shipped)]);
  await p.settle();
  await openFull(p, '0811');
  const first = paneSteps(p);
  assert.deepEqual(first.children[0].children.map(s => s.className), ['step done', 'step now', 'step', 'step']);
  // a refresh with nothing new keeps the nodes, so text selected in them stays
  p.timers.shift()();
  await p.settle();
  assert.equal(paneSteps(p), first, 'the same track and table, kept');
  assert.ok(!first.detached, 'not taken out');
  // the ticket moves on to review: the track and table follow, and its status
  p.timers.shift()();
  await p.settle();
  const now = paneSteps(p);
  assert.notEqual(now, first, 'drawn again');
  assert.deepEqual(now.children[0].children.map(s => s.className), ['step done', 'step done', 'step now', 'step']);
  assert.deepEqual(cells(now.children[1])[6], ['Reviewer', 'Codex · gpt-x']);
  assert.equal(pane(p).children[0].children[1].textContent, 'reviewing');
  assert.ok(pane(p).children[2].children.some(n => n.tagName === 'h4' && n.textContent === 'Problem'), 'its body still under it');
  p.timers.shift()();
  await p.settle();
  assert.equal(paneSteps(p), now, 'kept again');
  // it ships: the Shipped list's track and table
  p.timers.shift()();
  await p.settle();
  assert.equal(pane(p).hidden, false, 'still open');
  assert.deepEqual(paneSteps(p).children[0].children.map(s => s.className), Array(4).fill('step done'));
});

test('0465 AC3: a draft\'s readiness list still updates in place under the track and table', async () => {
  const fixed = TICKETS().map(t => (t.id === '0801' ? { ...t, lint: { errors: 0, warnings: 0 } } : t));
  const p = page([board(), board(), board(fixed)]);
  await p.settle();
  await openFull(p, '0801');
  const body = pane(p).children[2];
  for (const _ of [1, 2]) { p.timers.shift()(); await p.settle(); }
  assert.equal(pane(p).children[2], body, 'the body is kept');
  assert.doesNotMatch(body.children[0].textContent, /error/, '0583: its readiness list followed');
});

// ---------- in a real browser ----------

const stub = `(() => {
  const STATE = ${JSON.stringify(board())};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(STATE) : /\\/log$/.test(String(url)) ? json({ text: '', truncated: false }) : opts.method === 'POST' ? json({}) : real(url, opts);
})();`;
// Opens the ticket's full view from its card, in the lane it's in, and measures its track and table.
const OPEN = id => `(async () => {
  const wait = async test => { for (let i = 0; i < 200 && !test(); i++) await new Promise(r => setTimeout(r, 20)); if (!test()) throw new Error('timed out: ' + test); };
  const has = sel => [...document.querySelectorAll(sel)].find(n => [...n.querySelectorAll('.id')].some(i => i.textContent === ${JSON.stringify(id)}));
  if (has('#shaping .item.ticket')) { document.getElementById('tab-plan').click(); has('#shaping .item.ticket .head').click(); await wait(() => has('#shaping .item.ticket.open')); has('#shaping .item.ticket.open').querySelector('.full-open').click(); }
  else if (has('#queue .q')) { document.getElementById('tab-build').click(); has('#queue .q').querySelector('.top').click(); } // 0585: pressing its row
  else { document.getElementById('tab-shipped').click(); has('#shipped tr').click(); } // 0587: pressing its row
  const pane = document.getElementById('full-ticket');
  await wait(() => !pane.hidden && pane.querySelector('.top .id') && pane.querySelector('.top .id').textContent === ${JSON.stringify(id)} && pane.querySelector('.steps'));
  const steps = pane.querySelector(':scope > .steps'), t = steps.querySelector('.track'), f = steps.querySelector('.facts'), r = steps.getBoundingClientRect();
  const title = pane.querySelector('.top .title').getBoundingClientRect(), problem = pane.querySelector('h4').getBoundingClientRect();
  const out = { box: [r.left, r.right], pane: [pane.clientWidth], title: [title.left, title.right, title.bottom], problem: problem.top, top: r.top, scroll: [f.scrollWidth, f.clientWidth, t.scrollWidth, t.clientWidth],
    steps: [...t.children].map(s => { const b = s.getBoundingClientRect(); const c = getComputedStyle(s); return { name: s.textContent, top: b.top, height: b.height, line: parseFloat(c.lineHeight), look: [c.backgroundColor, c.borderLeftStyle, c.borderRightStyle, c.borderBottomStyle, c.marginBottom, c.paddingLeft] }; }),
    cells: [...f.children].map(n => { const b = n.getBoundingClientRect(), v = n.children[1], vb = v.getBoundingClientRect();
      return { label: n.children[0].textContent, top: b.top, width: b.width, height: b.height, valueHeight: vb.height, line: parseFloat(getComputedStyle(v).lineHeight), nowrap: getComputedStyle(v).whiteSpace === 'nowrap' }; }) };
  pane.querySelector('.close').click();
  await wait(() => pane.hidden);
  return out;
})()`;

test('0465 AC4: in a real browser at 320 and 390 px and on a wide window, the full view\'s track and table keep to their rows, each value within its cell (0583: it wraps)', skip, async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    for (const width of [320, 390, 1280]) {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
      await b.until(`document.querySelectorAll('#queue .q').length === 4`, 'the panel');
      for (const id of IDS) {
        const m = await b.js(OPEN(id)), at = `${width} ${id}`;
        assert.ok(m.top >= m.title[2] - 0.5 && m.problem >= m.top, `${at}: under the title, above Problem`);
        assert.ok(Math.abs(m.box[0] - m.title[0]) < 0.5 && Math.abs(m.box[1] - m.title[1]) < 0.5, `${at}: as wide as the title's column (${m.box} vs ${m.title})`);
        if (width === 1280) assert.ok(m.box[1] - m.box[0] <= 720.5, `${at}: in the centred column (${m.box[1] - m.box[0]} px)`);
        assert.ok(m.scroll[0] <= m.scroll[1] + 0.5 && m.scroll[2] <= m.scroll[3] + 0.5, `${at}: nothing past the track or table`);
        for (const s of m.steps) {
          assert.ok(Math.abs(s.top - m.steps[0].top) < 0.5, `${at}: the steps in one row`);
          assert.ok(s.height <= s.line + 6 + 4 + 0.5, `${at}: each step's name on one line (${JSON.stringify(s)})`);
          assert.deepEqual(s.look, ['rgba(0, 0, 0, 0)', 'none', 'none', 'none', '0px', '0px'], `${at}: ${s.name} is a bar with its name, not a button`);
        }
        const [first] = m.cells, cols = width < 480 ? 2 : 3; // 0624: tiles, two or three to a row, the last taking what's left
        for (const [i, c] of m.cells.entries()) {
          assert.ok(Math.abs(c.top - m.cells[i - i % cols].top) < 0.5, `${at}: ${c.label} is in its row, ${cols} to a row (0624)`);
          if (i < m.cells.length - 1) assert.ok(Math.abs(c.width - first.width) < 1, `${at}: ${c.label} as wide as the others`);
          assert.ok(!c.nowrap && c.valueHeight <= c.height + 0.5, `${at}: ${c.label}'s value wraps within its cell`);
        }
      }
    }
  } finally { await b.close(); await stop(panel); }
});
