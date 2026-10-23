import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, full, round, fakePage, items, queueRows, shippedRows, click, stoppedClock, panelRepo, freePort, startPanel, stop, findChrome, browserPage, openLane, page as html } from './support/panel.mjs';

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
const statusOf = n => topOf(n).children[1];
const gridOf = (p, n) => p.all(n).find(x => x.className === 'lights') || null;

test('0434 AC1: while its builder or reviewer is at work, the status line starts with a 4 × 4 grid named for the sentence it replaces', async () => {
  const p = page();
  await p.settle();
  const working = { '0901': 'Writing tests and code', '0902': 'Checking its own work', '0903': 'gpt-6.1-sol is reviewing · round 1', '0904': "Claude is fixing round 1's findings" };
  for (const [id, sentence] of Object.entries(working)) {
    const line = statusOf(card(p, id)), grid = line.children[0];
    assert.equal(grid.className, 'lights', `${id}: the grid comes first`);
    assert.equal(grid.children.length, 16, `${id}: 16 dots`);
    assert.equal(grid.attrs.role, 'img');
    assert.equal(grid.attrs['aria-label'], sentence, `${id}: its accessible name`);
    assert.equal(grid.title, sentence, `${id}: its tooltip`);
    assert.ok(!line.textContent.includes(sentence), `${id}: the sentence itself is gone from the line`);
  }
});

test('0434 AC1: a ticket no agent is working on shows no grid', async () => {
  const p = page();
  await p.settle();
  for (const id of ['0905', '0906', '0907', '0908', '0909', '0426', '0910']) assert.equal(gridOf(p, card(p, id)), null, `${id}: no grid`);
  assert.ok(statusOf(card(p, '0906')).textContent.startsWith('Blocked · it has a question for you'), 'words instead');
});

const css = () => /<style>([\s\S]*?)<\/style>/.exec(html())[1].replace(/\/\*[\s\S]*?\*\//g, '');
test('0434 AC1: the grid is no more than 14 px square, its lights move only with motion allowed, and held still some dots stay lit', () => {
  const style = css();
  const grid = /\.q \.top \.lights \{([^}]*)\}/.exec(style)[1];
  for (const side of ['width', 'height']) assert.ok(parseFloat(new RegExp(`\\b${side}: ([\\d.]+)px`).exec(grid)[1]) <= 14, side);
  assert.match(grid, /grid-template-columns: repeat\(4, /);
  const at = style.indexOf('@media (prefers-reduced-motion: no-preference)');
  const before = style.slice(0, at);
  assert.doesNotMatch(before, /\.lights[^{]*\{[^}]*animation/, 'no animation outside the no-preference block');
  assert.match(style.slice(at), /\.q \.top \.lights i \{ animation: lights /, 'the lights move when motion is allowed');
  assert.match(style.slice(at), /@keyframes lights/);
  assert.match(before, /\.q \.top \.lights \.d3 \{ background: var\(--run\); \}/, 'held still, one diagonal is lit');
  assert.match(before, /\.q \.top \.lights i \{[^}]*background: var\(--line\);/, 'and the rest are dim');
});

test('0434 AC2: a closed Build ticket\'s status line is its grid or words, its stage and one time', async () => {
  const p = page();
  await p.settle();
  const text = id => statusOf(card(p, id)).textContent.trimStart(); // the grid has no text, and a space after it
  assert.equal(text('0901'), 'Build · 01:07', 'the grid, then Build and its time');
  assert.equal(text('0903'), 'Review 1 · gpt-6.1-sol · 07:52', 'the round and the reviewer\'s model');
  assert.equal(text('0904'), 'Review 1 · 07:52', 'the builder fixing the findings');
  assert.equal(text('0905'), 'Shipping · 19:12', 'one time on a shipping ticket: its build\'s, held at its approval as before');
  assert.equal(text('0910'), 'Queued · waiting on 0426');
  assert.equal(text('0426'), 'Queued · unlocks 0910');
  assert.ok(!p.all(card(p, '0905')).some(n => /ship-at|ship-time/.test(n.className || '')), 'no time for the ship itself');
});

test('0434 AC2: the one time keeps counting on its own timer, and nothing counts the ship', async () => {
  let at = NOW;
  const Clock = class extends Date { constructor(...a) { super(...(a.length ? a : [at])); } static now() { return at; } };
  const p = fakePage([board()], { Date: Clock });
  await p.settle();
  at += 3000;
  for (const w of p.intervals.values()) if (w.ms === 1000) w.fn();
  assert.equal(statusOf(card(p, '0901')).textContent, ' Build · 01:10');
  assert.equal(statusOf(card(p, '0905')).textContent, 'Shipping · 19:12');
});

test('0434 AC3: a closed Build ticket shows no priority, size or risk; an open one does, and its priority still opens its tip', async () => {
  const p = page();
  await p.settle();
  const tags = n => p.all(statusOf(n)).filter(x => /\btag\b/.test(x.className));
  for (const id of ['0901', '0903', '0905', '0906', '0426', '0910']) assert.deepEqual(tags(card(p, id)), [], `${id}: no tags while closed`);
  for (const id of ['0901', '0426']) {
    click(topOf(card(p, id)));
    await p.settle();
    const [prio, size, risk] = tags(card(p, id));
    assert.ok(prio && size && risk, `${id}: open, it shows its priority, size and risk`);
    assert.equal(prio.attrs.role, 'button');
    click(prio);
    assert.ok(!p.byId('tag-tip').hidden, `${id}: its priority opens its tip`);
    assert.equal(p.byId('tag-tip').textContent, prio.tip);
  }
  assert.equal(statusOf(card(p, '0901')).textContent, ' Build · 01:07 · P3 · M · low');
});

test('0434 AC4: a closed ticket\'s title is one line, cut off with an ellipsis, with the whole title as its tooltip; an open one wraps', async () => {
  const s = board();
  s.tickets.push(T('0911', 'done', { title: LONG, end: ago(60) }));
  const p = page(s);
  await p.settle();
  const plan = topOf(card(p, '0801')).children[0].children.find(n => n.className === 'title');
  const build = topOf(card(p, '0426')).children[0].children.find(n => n.className === 'title');
  const shipped = p.all(shippedRows(p).find(r => idOf(p, r) === '0911')).find(n => n.className === 'title-link');
  for (const [n, where] of [[plan, 'Plan'], [build, 'Build'], [shipped, 'Shipped']]) {
    assert.equal(n.textContent, LONG, `${where}: the whole title is its text, and so its accessible name`);
    assert.equal(n.title, LONG, `${where}: its tooltip`);
  }
  const style = css();
  const rule = /\.item\.ticket:not\(\.open\) \.line \.title, \.q:not\(\.open\) \.top \.line \.title, #shipped tr:not\(\.open\) \.line \.title-link \{([^}]*)\}/.exec(style);
  assert.ok(rule, 'one rule for a closed ticket\'s title in each lane');
  assert.match(rule[1], /white-space: nowrap;/);
  assert.match(rule[1], /overflow: hidden;/);
  assert.match(rule[1], /text-overflow: ellipsis;/);
  // an open one is marked open, so the rule leaves it to wrap
  click(topOf(card(p, '0801')));
  click(topOf(card(p, '0426')));
  await p.settle();
  click(p.all(shippedRows(p).find(r => idOf(p, r) === '0911')).find(n => n.className === 'full-open details'));
  await p.settle();
  assert.match(card(p, '0801').className, /\bopen\b/);
  assert.match(card(p, '0426').className, /\bopen\b/);
  assert.match(shippedRows(p).find(r => idOf(p, r) === '0911').className, /\bopen\b/);
});

test('0434 AC5: a closed Build card shows nothing under its two lines but the Foreman\'s question; open, it shows the rest', async () => {
  const s = board();
  s.tickets.find(t => t.id === '0906').blocked_recommendation = 'A';
  s.tickets.find(t => t.id === '0907').build_exit.message = 'Approved, not shipped.';
  s.tickets.find(t => t.id === '0909').build_exit.message = 'It ended.';
  s.foreman = { agent: { asks: [{ id: '0910', question: 'Start it again?' }] } };
  const p = page(s);
  await p.settle();
  for (const t of s.tickets.filter(x => x.status !== 'draft' && x.id !== '0910')) assert.deepEqual(card(p, t.id).children.map(n => n.className), ['top'], `${t.id}: its two lines only`);
  const asked = card(p, '0910');
  assert.equal(asked.children.length, 2, 'the Foreman\'s question stays under a closed card');
  assert.ok(asked.children[1].textContent.includes('Start it again?'));
  // open, each shows what it has under its two lines, as before
  const under = { '0906': /A or B\?/, '0907': /Approved, not shipped\./, '0908': /carry it on with speck play 0908/, '0909': /It ended\./ };
  for (const [id, re] of Object.entries(under)) {
    click(topOf(card(p, id)));
    await p.settle();
    assert.match(card(p, id).children.slice(1).map(n => n.textContent).join(' | '), re, `${id}: open, it shows it`);
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
// Each closed Build card: how many lines its title and status line take, whether its title is cut off, and the lines
// of anything else in it.
const CARDS = `(async () => {
  await document.fonts.ready;
  const lines = n => { const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT), out = [];
    for (let t; (t = w.nextNode());) { const r = document.createRange(); r.selectNodeContents(t); for (const x of r.getClientRects()) if (x.width > 0 && !out.some(b => Math.abs(b - x.top) <= 4)) out.push(x.top); }
    return out.length; };
  return [...document.querySelectorAll('#queue .q:not(.open)')].map(c => {
    const top = c.firstElementChild, title = top.querySelector('.title'), status = top.children[1], grid = status.querySelector('.lights');
    const rows = [...top.children].map(n => Math.round(n.getBoundingClientRect().top));
    return { id: c.querySelector('.id').textContent, children: c.children.length, rows: new Set(rows).size, titleLines: lines(title), statusLines: lines(status),
      statusHeight: status.getBoundingClientRect().height, lineHeight: parseFloat(getComputedStyle(status).lineHeight),
      cut: title.scrollWidth > title.clientWidth, inside: status.getBoundingClientRect().right <= c.getBoundingClientRect().right + 0.5,
      grid: grid && [grid.getBoundingClientRect().width, grid.getBoundingClientRect().height] };
  });
})()`;

for (const touch of [true, false]) {
  test(`0434 AC5: at 390 px ${touch ? 'on a touch screen' : 'with a mouse'}, every closed Build ticket is two rows, its title line and its status line`, skip, async () => {
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
        assert.equal(c.titleLines, 1, `${c.id}: its title on one line`);
        assert.equal(c.statusLines, 1, `${c.id}: its status on one line`);
        assert.ok(c.statusHeight <= c.lineHeight + 0.5, `${c.id}: its status line is one line high (${c.statusHeight} px)`);
        assert.ok(c.inside, `${c.id}: its status line stays inside the card`);
        if (c.grid) assert.ok(c.grid[0] <= 14 && c.grid[1] <= 14, `${c.id}: its grid is ${c.grid.join(' × ')} px`);
      }
      assert.ok(cards.find(c => c.id === '0426').cut, 'a long title is cut off');
      assert.ok(cards.find(c => c.id === '0901').grid, 'a working ticket has its grid');
    } finally { await b.close(); await stop(panel); }
  });
}

test('0434 AC1: in a real browser, the grid\'s lights move, and with reduced motion they hold still with some lit', skip, async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    for (const motion of ['no-preference', 'reduce']) {
      await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: motion }] });
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/?${motion}` });
      await b.until(`location.port === '${panel.port}' && !!document.querySelector('#queue .q .lights')`, 'the grid');
      const seen = await b.js(`(() => { const dots = [...document.querySelector('#queue .q .lights').children];
        return { anims: document.querySelector('#queue .q .lights').getAnimations({ subtree: true }).length, lit: dots.filter(d => getComputedStyle(d).backgroundColor === getComputedStyle(d.parentNode).color).length }; })()`);
      if (motion === 'reduce') {
        assert.equal(seen.anims, 0, 'nothing moves');
        assert.ok(seen.lit > 0 && seen.lit < 16, `${seen.lit} dots lit`);
      } else assert.equal(seen.anims, 16, 'each dot is lit in turn');
    }
  } finally { await b.close(); await stop(panel); }
});
