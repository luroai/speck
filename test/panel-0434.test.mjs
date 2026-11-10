import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, full, round, fakePage, items, queueRows, tipSentence, shippedRows, click, stoppedClock, panelRepo, freePort, startPanel, stop, findChrome, browserPage, openLane, page as html, styles, factsOf, fullViewOf } from './support/panel.mjs';

// ---------- 0434: each closed ticket is two single lines, with a grid of moving lights while an agent works ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const NOW = Date.parse('2026-10-23T12:00:00.000Z');
const ago = s => new Date(NOW - s * 1000).toISOString();
const LONG = 'A ticket whose title is far too long to fit on a single line of a phone-sized pane, so it is cut off';

const board = () => ({
  run: { on: true },
  tickets: [
    full('0801', { title: LONG, priority: 3, size: 'M', risk: 'low' }),
    T('0901', 'building', { title: 'Writing its code', priority: 3, size: 'M', risk: 'low', started: ago(67), build_running: true }),
    T('0902', 'building', { title: 'Checking itself', started: ago(67), build_running: true, self_check: 'no changes' }),
    T('0903', 'reviewing', { title: 'Under review', started: ago(472), build_running: true, self_check: 'no changes', review_running: 1, reviewer: 'codex', review_model: 'gpt-6.1-sol' }),
    T('0904', 'reviewing', { title: 'Fixing findings', started: ago(472), build_running: true, self_check: 'no changes', rounds: [{ round: 1, verdict: 'request_changes' }], review_running: null, builder: 'claude' }),
    T('0905', 'approved', { title: 'Shipping now', started: ago(1212), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], auto_ship: true,
      build_exit: { at: ago(30), code: 0 }, ship: { running: true, auto: true, started: ago(68) } }),
    T('0906', 'blocked', { title: 'Has a question', started: ago(300), blocked_question: 'A or B?' }),
    T('0907', 'approved', { title: 'Waiting for you', started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], auto_ship: false, build_exit: { at: ago(30), code: 0 } }),
    T('0908', 'building', { title: 'Paused build', started: ago(300), build_running: true, paused: true }),
    T('0909', 'building', { title: 'Stopped build', started: ago(300), build_exit: { at: ago(30), code: 1 } }),
    T('0426', 'ready', { title: LONG, priority: 2, size: 'S', risk: 'high' }),
    T('0910', 'ready', { title: 'Queued behind', after: ['0426'], waiting_on: ['0426'] }),
  ],
  ideas: [],
});
const page = (s = board()) => fakePage([s], { Date: stoppedClock(NOW) });
const idOf = (p, n) => p.all(n).find(x => x.className === 'id')?._text;
const card = (p, id) => [...items(p), ...queueRows(p)].find(n => idOf(p, n) === id);
const topOf = n => n.children[0];
// 0585: a Build row is its line, then one line saying where the ticket is, with the same sentence as its tooltip.
const statusOf = n => (function find(x) { if (/^where\b/.test(x.className || '')) return x; for (const c of x.children || []) { const f = find(c); if (f) return f; } return null; })(n);

test('0434 AC1: while its builder or reviewer is at work, the row\'s line names the sentence it stands for in its tooltip', async () => {
  const p = page();
  await p.settle();
  const working = { '0901': 'Writing tests and code', '0902': 'Checking its own work', '0903': 'gpt-6.1-sol is reviewing · round 1', '0904': "Claude is fixing round 1's findings" };
  for (const [id, sentence] of Object.entries(working)) {
    const line = statusOf(card(p, id));
    assert.equal(tipSentence(line), sentence, `${id}: its tooltip`);
    assert.ok(!line.textContent.includes(sentence), `${id}: the sentence itself is not in the line`);
    assert.match(line.className, /\brun\b/, `${id}: its dot`);
  }
});

const css = () => styles().replace(/\/\*[\s\S]*?\*\//g, '');

test('0434 AC2: a Build row\'s line is its stage and one time', async () => {
  const p = page();
  await p.settle();
  const text = id => statusOf(card(p, id)).textContent;
  assert.equal(text('0901'), 'Writing · 1 min');
  assert.equal(text('0903'), 'Reviewing · round 1 · 7 min', 'the round');
  assert.equal(text('0904'), 'Fixing · 7 min', 'the builder fixing the findings');
  assert.equal(text('0905'), 'Shipping · 19 min', 'one time on a shipping ticket: its build\'s, held at its approval as before');
  assert.equal(text('0910'), 'Ready · after 0426');
  assert.equal(text('0426'), 'Ready');
  assert.ok(!p.all(card(p, '0905')).some(n => /ship-at|ship-time/.test(n.className || '')), 'no time for the ship itself');
});

test('0434 AC2: the one time keeps counting on its own timer, and nothing counts the ship', async () => {
  let at = NOW;
  const Clock = class extends Date { constructor(...a) { super(...(a.length ? a : [at])); } static now() { return at; } };
  const p = fakePage([board()], { Date: Clock });
  await p.settle();
  at += 2 * 60000;
  for (const w of p.intervals.values()) if (w.ms === 1000) w.fn();
  assert.equal(statusOf(card(p, '0901')).textContent, 'Writing · 3 min');
  assert.equal(statusOf(card(p, '0905')).textContent, 'Shipping · 19 min');
});

test('0434 AC3: a Build row shows no priority, size or risk; its full view does', async () => {
  const p = page();
  await p.settle();
  const tags = n => p.all(n).filter(x => /\btag\b/.test(x.className));
  for (const id of ['0901', '0903', '0905', '0906', '0426', '0910']) assert.deepEqual(tags(card(p, id)), [], `${id}: no tags on its row`);
  // 0462: an in-flight ticket's full view shows them in its facts' cells
  assert.deepEqual(factsOf(await fullViewOf(p, '0901')).slice(0, 3), [['Priority', 'P3'], ['Size', 'M'], ['Risk', 'low']], '0901: its full view shows its priority, size and risk');
  // 0463: and so does a queued one, as plain text
  assert.deepEqual(factsOf(await fullViewOf(p, '0426')).slice(0, 3), [['Priority', 'P2'], ['Size', 'S'], ['Risk', 'high']], '0426: its full view shows its priority, size and risk');
});

test('0434 AC4: a title keeps its whole text and tooltip; a closed Shipped, Build or Plan row\'s is cut off on one line (0599)', async () => {
  const s = board();
  s.tickets.push(T('0911', 'done', { title: LONG, end: ago(60) }));
  const p = page(s);
  await p.settle();
  const plan = topOf(card(p, '0801')).children[0].children.find(n => n.className === 'title');
  const shipped = p.all(shippedRows(p).find(r => idOf(p, r) === '0911')).find(n => n.className === 'title');
  for (const [n, where] of [[plan, 'Plan'], [shipped, 'Shipped']]) {
    assert.equal(n.textContent, LONG, `${where}: the whole title is its text, and so its accessible name`);
    assert.equal(n.title, LONG, `${where}: its tooltip`);
  }
  assert.equal(p.all(card(p, '0426')).find(n => n.className === 'title').textContent, LONG, 'Build: the whole title is its text');
  const style = css();
  const rule = /#shipped \.line \.title \{([^}]*)\}/.exec(style);
  assert.ok(rule, 'the rule for a Shipped row\'s title');
  const cutOff = /\.q\.row \.top \.line \.title, \.item\.row:not\(\.open\) \.line \.title, #shipped \.line \.title \{ white-space: nowrap; overflow: hidden; text-overflow: ellipsis; \}/;
  assert.match(style, cutOff, 'a Shipped, Build, Plan or Capture row\'s title is cut off on one line (0599)');
  // an open one is marked open, so that rule lets it wrap
  click(topOf(card(p, '0801')));
  await p.settle();
  assert.match(card(p, '0801').className, /\bopen\b/);
});

test('0434 AC5: a Build row shows nothing but its two lines, and its full view shows the rest', async () => {
  const s = board();
  s.tickets.find(t => t.id === '0906').blocked_recommendation = 'A';
  s.tickets.find(t => t.id === '0907').build_exit.message = 'Approved, not shipped.';
  s.tickets.find(t => t.id === '0909').build_exit.message = 'It ended.';
  s.foreman = { agent: { asks: [{ id: '0910', question: 'Start it again?' }] } };
  const p = page(s);
  await p.settle();
  for (const t of s.tickets.filter(x => x.status !== 'draft')) assert.deepEqual(card(p, t.id).children.map(n => n.className), ['top'], `${t.id}: its two lines only`);
  // its full view shows each one's own, as before
  const under = { '0906': /A or B\?/, '0907': /Approved, not shipped\./, '0908': /carry it on with speck play 0908/, '0909': /It ended\./, '0910': /Start it again\?/ };
  for (const [id, re] of Object.entries(under)) {
    const view = await fullViewOf(p, id);
    assert.match(view.textContent, re, `${id}: its full view shows it`);
  }
});

// ---------- in a real browser: a 390 px phone, with a touch screen and with a mouse ----------

const PHONE = board();
PHONE.tickets.push(T('0912', 'reviewing', { title: 'Under review by a model with a long name', started: ago(472), build_running: true, self_check: 'no changes', review_running: 2, rounds: [{ round: 1, verdict: 'request_changes' }], reviewer: 'codex', review_model: 'a-reviewer-model-with-a-long-name-6.1' }));
PHONE.tickets.push(T('0913', 'ready', { title: 'Waiting on many', after: ['0901', '0902', '0903', '0904', '0905', '0906', '0907', '0908'], waiting_on: ['0901', '0902', '0903', '0904', '0905', '0906', '0907', '0908'] }));
const stub = `(() => {
  const STATE = ${JSON.stringify(PHONE)};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(STATE) : /\\/log$/.test(String(url)) ? json({ text: '' }) : opts.method === 'POST' ? json({}) : real(url, opts);
})();`;
// Each Build row: how many lines its title and its line saying where it is take, whether its title is cut off, and
// whether that line stays inside the row.
const CARDS = `(async () => {
  await document.fonts.ready;
  const lines = n => { const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT), out = [];
    for (let t; (t = w.nextNode());) { const r = document.createRange(); r.selectNodeContents(t); for (const x of r.getClientRects()) if (x.width > 0 && !out.some(b => Math.abs(b - x.top) <= 4)) out.push(x.top); }
    return out.length; };
  return [...document.querySelectorAll('#queue .q')].map(c => {
    const top = c.firstElementChild, title = top.querySelector('.title'), where = top.children[1];
    const rows = [...top.children].map(n => Math.round(n.getBoundingClientRect().top));
    return { id: c.querySelector('.id').textContent, children: c.children.length, rows: new Set(rows).size, titleLines: lines(title), whereLines: lines(where),
      cut: title.scrollWidth > title.clientWidth + 0.5, inside: where.getBoundingClientRect().right <= c.getBoundingClientRect().right + 0.5 };
  });
})()`;

for (const touch of [true, false]) {
  test(`0434 AC5: at 390 px ${touch ? 'on a touch screen' : 'with a mouse'}, every Build row is two rows, its title line and its line saying where it is`, skip, async () => {
    const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
    const b = await browserPage('about:blank');
    try {
      await b.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
      await b.send('Emulation.setTouchEmulationEnabled', touch ? { enabled: true, maxTouchPoints: 1 } : { enabled: false });
      await b.send('Page.enable');
      await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
      await b.until(`location.port === '${panel.port}' && document.querySelectorAll('#queue .q').length === ${PHONE.tickets.filter(t => t.status !== 'draft').length}`, 'the panel');
      assert.equal(await b.js(`matchMedia('(pointer: coarse)').matches`), touch, touch ? 'a touch screen' : 'a mouse');
      await b.js(openLane('build'));
      const cards = await b.js(CARDS);
      assert.ok(cards.length >= 8, `${cards.length} cards`);
      for (const c of cards) {
        assert.equal(c.children, 1, `${c.id}: nothing under its top row`);
        assert.equal(c.rows, 2, `${c.id}: two rows`);
        assert.equal(c.titleLines, 1, `${c.id}: its title on one line (0599)`);
        assert.ok(c.inside, `${c.id}: its line stays inside the row`);
        if (c.id !== '0913') assert.equal(c.whereLines, 1, `${c.id}: it is on one line`);
      }
      assert.ok(cards.find(c => c.id === '0426').cut, 'a long title is cut off (0599)');
    } finally { await b.close(); await stop(panel); }
  });
}
