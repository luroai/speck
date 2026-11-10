import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { T, full, round, boardPage, items, queueRows, shippedRows, top, cssRules, cssValue, styles, panelRepo, freePort, startPanel, stop, browserPage, findChrome } from './support/panel.mjs';

// ---------- 0624: a ticket's facts in its full view, as tiles like Shipped's figures ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const NOW = new Date(2026, 10, 10, 12, 0).getTime();
const ago = s => new Date(NOW - s * 1000).toISOString();
const Clock = class extends Date { constructor(...a) { super(...(a.length ? a : [NOW])); } static now() { return NOW; } };
const LONG = 'a-reviewer-model-with-a-very-long-name-that-has-no-spaces-in-it-at-all-6.1-sol';
const LONG_TITLE = 'A ticket with a very long title that cannot fit on one line of its tile however wide the window happens to be today';
const IN_FLIGHT = { started: ago(600), builder: 'claude', builder_model: 'opus', reviewer: 'codex', review_model: LONG };
const tickets = () => [
  full('0801', { title: 'A draft', priority: 3, size: 'M', risk: 'high' }),
  T('0811', 'building', { ...IN_FLIGHT, title: 'Building', build_running: true, priority: 1 }),
  T('0812', 'ready', { title: 'Queued', after: ['0811'], waiting_on: ['0811'], type: 'fix' }),
  T('0813', 'ready', { title: 'Queued on two', after: ['0811', '0814'], waiting_on: ['0811', '0814'] }),
  T('0814', 'ready', { title: LONG_TITLE }),
  T('0901', 'done', { ...IN_FLIGHT, title: 'Shipped', finished: ago(60), builder_tokens: 2412345, builder_cost_usd: 2.906, rounds: [round(1, 60000), round(2, 48234)] }),
];
const page = async () => { const p = boardPage([{ run: { on: true }, ideas: [], tickets: tickets() }], { Date: Clock }); await p.settle(); return p; };
const idOf = (p, n) => p.all(n).find(x => x.className === 'id')?._text;
// Opens the ticket's card and presses its Full ticket button, as the user does.
async function open(p, id) {
  const lists = [[() => items(p), n => top(n)], [() => queueRows(p), n => n.children[0]], [() => shippedRows(p), n => p.all(n).find(x => x.className === 'title')]];
  const [find, head] = lists.find(([f]) => f().some(n => idOf(p, n) === id));
  const card = () => find().find(n => idOf(p, n) === id);
  if (!/\bopen\b/.test(card().className)) { p.press(head(card())); await p.settle(); }
  p.press(p.all(card()).find(x => x.tagName === 'button' && x.textContent === 'Full ticket'));
  await p.settle();
}
const facts = p => p.all(p.byId('full-ticket')).find(n => n.className === 'facts').children.map(c => [c.children[0].textContent, c.children[1].textContent]);
const FACT = '#full-ticket .facts .fact';
const plain = () => styles().replace(/\/\*[\s\S]*?\*\//g, '');

test('0624 AC1: each fact is a tile of Shipped\'s style: the surface colour, no border, every corner rounded alike, the same padding and gap', () => {
  const tile = cssRules(FACT), stat = cssRules('.stat');
  for (const prop of ['background', 'color', 'border', 'border-radius', 'padding']) assert.equal(cssValue(tile, prop), cssValue(stat, prop), prop);
  assert.equal(cssValue(tile, 'background'), 'var(--surface)');
  assert.equal(cssValue(tile, 'border'), '0');
  assert.match(cssValue(tile, 'border-radius'), /^\d+px$/, 'one radius for all four corners');
  assert.ok(!/#full-ticket[^{}]*\.fact[^{}]*\{[^}]*border-(top|bottom)-(left|right)-radius/.test(plain()), 'no corner of its own');
  assert.equal(cssValue(cssRules('#full-ticket .facts'), 'gap'), cssValue(cssRules('.stats'), 'gap'), 'the same gap, each way');
  assert.equal(cssValue(cssRules('#full-ticket .facts'), 'background'), undefined, 'no colour showing between tiles');
});

test('0624 AC1: its label is small and muted, with its value under it', async () => {
  const label = cssRules('#full-ticket .facts .label');
  assert.equal(cssValue(label, 'color'), 'var(--muted)');
  assert.equal(cssValue(label, 'font-size'), '12px');
  assert.equal(cssValue(cssRules('#full-ticket .facts .value'), 'display') ?? cssValue(cssRules('#full-ticket .facts .label, #full-ticket .facts .value'), 'display'), 'block');
  const p = await page();
  await open(p, '0801');
  const tile = p.all(p.byId('full-ticket')).find(n => n.className === 'fact');
  assert.deepEqual(tile.children.map(n => [n.tagName, n.className]), [['dt', 'label'], ['dd', 'value']]);
});

// The window's width picks, as a media query would, with no media query of its own (0140).
test('0624 AC2: two columns below 480 px wide and three from it, chosen by the window\'s width, with no media query of its own (0140)', () => {
  const basis = 'clamp((100% - 16px) / 3 - .05px, (480px - 100vw) * 100000, (100% - 8px) / 2 - .05px)';
  assert.equal(cssValue(cssRules(FACT), 'flex'), `0 0 ${basis}`);
  assert.equal(cssValue(cssRules('#full-ticket .facts'), 'display'), 'flex');
  assert.equal(cssValue(cssRules('#full-ticket .facts'), 'flex-wrap'), 'wrap');
  // how many tiles a row holds, for a column of `w` in a window `vw` wide
  const columns = (w, vw) => { const tile = Math.min(Math.max((w - 16) / 3 - .05, (480 - vw) * 100000), (w - 8) / 2 - .05); return Math.floor((w + 8) / (tile + 8)); };
  for (const [vw, want] of [[320, 2], [375, 2], [479, 2], [479.5, 2], [480, 3], [600, 3], [720, 3]]) for (const bar of [0, 15]) assert.equal(columns(Math.min(vw, 720) - 32 - bar, vw), want, `${vw} px, a ${bar} px scrollbar`);
});

test('0624 AC2: the last tile takes what\'s left of its row, and no other tile grows', () => {
  assert.equal(cssValue(cssRules(`${FACT}:last-child`), 'flex-grow'), '1');
  assert.match(cssValue(cssRules(FACT), 'flex'), /^0 0 /);
});

test('0624 AC3: every fact is still shown with the same value, for a draft, a build and a shipped ticket', async () => {
  const p = await page();
  await open(p, '0801');
  assert.deepEqual(facts(p), [['Priority', 'P3'], ['Size', 'M'], ['Risk', 'high'], ['Ships by itself', '–'], ['Builder', '–'], ['Reviewer', '–']]);
  const b = await page();
  await open(b, '0811');
  assert.deepEqual(facts(b), [['Priority', 'P1'], ['Size', 'S'], ['Risk', 'low'], ['Ships by itself', '–'], ['Builder', 'Claude · opus'], ['Reviewer', `Codex · ${LONG}`], ['Type', 'code']]);
  const s = await page();
  await open(s, '0901');
  assert.deepEqual(facts(s), [['Priority', 'P2'], ['Size', 'S'], ['Risk', 'low'], ['Ships by itself', '–'], ['Builder', 'Claude · opus'], ['Reviewer', `Codex · ${LONG}`],
    ['Builder cost', '$2.91'], ['Reviewer cost', '—'], ['Total cost', '—'], ['Builder tokens', '2.4M'], ['Reviewer tokens', '108k']]);
});

test('0624 AC3: a long value wraps within its tile, and a long Waits on line isn\'t cut off', () => {
  const value = cssRules('#full-ticket .facts .value');
  assert.equal(cssValue(value, 'overflow-wrap'), 'anywhere');
  assert.notEqual(cssValue(value, 'white-space'), 'nowrap');
  const link = cssRules('#full-ticket .waits-facts .waits-link');
  assert.equal(cssValue(link, 'white-space'), 'normal');
  assert.equal(cssValue(link, 'overflow'), 'visible');
  assert.equal(cssValue(link, 'text-overflow'), 'clip');
});

// That the Delivery log lists them is for the reviewer to read: no test reads this repo's tickets (0122).
test('0624 AC5: the tests of the old layout now check the tiles', () => {
  assert.doesNotMatch(fs.readFileSync('test/panel-0583.test.mjs', 'utf8'), /full-ticket \.facts'\)\), 'grid-template-columns'/);
  assert.doesNotMatch(fs.readFileSync('test/panel-0465.test.mjs', 'utf8'), /two to a row \(0583\)/);
});

const stub = theme => `(() => {
  try { localStorage.setItem('speck-theme', ${JSON.stringify(theme)}); } catch {}
  const STATE = ${JSON.stringify({ run: { on: true }, ideas: [], tickets: tickets() })};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(STATE) : /\\/log$/.test(String(url)) ? json({ text: '', truncated: false }) : opts.method === 'POST' ? json({}) : real(url, opts);
})();`;
// Opens the ticket's full view from its lane and measures each group of tiles.
const OPEN = id => `(async () => {
  const wait = async test => { for (let i = 0; i < 200 && !test(); i++) await new Promise(r => setTimeout(r, 20)); if (!test()) throw new Error('timed out: ' + test); };
  const has = sel => [...document.querySelectorAll(sel)].find(n => [...n.querySelectorAll('.id')].some(i => i.textContent === ${JSON.stringify(id)}));
  if (has('#shaping .item.ticket')) { document.getElementById('tab-plan').click(); has('#shaping .item.ticket .head').click(); await wait(() => has('#shaping .item.ticket.open')); has('#shaping .item.ticket.open').querySelector('.full-open').click(); }
  else if (has('#queue .q')) { document.getElementById('tab-build').click(); has('#queue .q').querySelector('.top').click(); }
  else { document.getElementById('tab-shipped').click(); has('#shipped tr').click(); }
  const pane = document.getElementById('full-ticket');
  await wait(() => !pane.hidden && pane.querySelector('.top .id') && pane.querySelector('.top .id').textContent === ${JSON.stringify(id)} && pane.querySelector('.steps .facts'));
  const groups = [...pane.querySelectorAll('.steps .facts')].map(f => { const r = f.getBoundingClientRect(); return { cls: f.className, left: r.left, right: r.right, scroll: [f.scrollWidth, f.clientWidth], tiles: [...f.children].map(n => {
    const b = n.getBoundingClientRect(), c = getComputedStyle(n), [l, v] = n.children, vb = v.getBoundingClientRect();
    return { label: l.textContent, text: v.textContent, left: b.left, right: b.right, top: b.top, bottom: b.bottom, bg: c.backgroundColor, border: c.borderTopWidth, radius: [c.borderTopLeftRadius, c.borderTopRightRadius, c.borderBottomLeftRadius, c.borderBottomRightRadius],
      labelTop: l.getBoundingClientRect().top, valueTop: vb.top, valueLeft: vb.left, valueRight: vb.right, valueBottom: vb.bottom, valueHeight: vb.height, line: parseFloat(getComputedStyle(v).lineHeight), clipped: v.scrollWidth > v.clientWidth + 0.5, cut: [...v.querySelectorAll('*')].some(x => x.scrollWidth > x.clientWidth + 0.5 && getComputedStyle(x).overflow === 'hidden') }; }) }; });
  const out = { groups, page: [document.documentElement.scrollWidth, innerWidth], pane: [pane.scrollWidth, pane.clientWidth] };
  pane.querySelector('.close').click();
  await wait(() => pane.hidden);
  return out;
})()`;

const SURFACE = { light: 'rgb(244, 245, 247)', dark: 'rgb(27, 29, 32)' };
test('0624 AC2, AC3 and AC4: in a real browser, in both looks, at 320, 479 and 480 px, the tiles fill their rows and long values wrap within them', skip, async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Page.enable');
    for (const look of ['light', 'dark']) {
      const { identifier } = await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub(look) });
      await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 800, deviceScaleFactor: 1, mobile: false });
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
      await b.until(`location.port === '${panel.port}' && document.querySelectorAll('#queue .q').length === 4`, 'the panel');
      for (const width of [320, 479, 480]) {
        await b.send('Emulation.setDeviceMetricsOverride', { width, height: 800, deviceScaleFactor: 1, mobile: false });
        const cols = width < 480 ? 2 : 3;
        for (const id of ['0801', '0811', '0812', '0813', '0814', '0901']) {
          const m = await b.js(OPEN(id)), at = `${look}, ${width} px, ${id}`;
          assert.ok(m.page[0] <= m.page[1] && m.pane[0] <= m.pane[1], `${at}: nothing past the right edge`);
          if (id === '0812') assert.ok(m.groups.some(g => /chain-facts/.test(g.cls)), `${at}: its chain is tiles`);
          if (id === '0813') assert.ok(m.groups.some(g => /waits-facts/.test(g.cls)), `${at}: what it waits on is tiles`);
          for (const g of m.groups) {
            const col = (g.right - g.left - 8 * (cols - 1)) / cols;
            const rows = [...new Set(g.tiles.map(t => Math.round(t.top)))].map(top => g.tiles.filter(t => Math.round(t.top) === top));
            assert.ok(g.scroll[0] <= g.scroll[1] + 0.5, `${at}: nothing past its grid`);
            rows.forEach((row, r) => {
              const last = r === rows.length - 1;
              if (!last) assert.equal(row.length, cols, `${at}: ${cols} to a row`);
              assert.ok(row.length <= cols, `${at}: no more than ${cols} to a row`);
              assert.ok(Math.abs(row[0].left - g.left) < 1, `${at}: the row starts at the left`);
              assert.ok(Math.abs(row.at(-1).right - g.right) < 1, `${at}: row ${r} ends at the right edge (${row.at(-1).right} vs ${g.right})`);
              row.forEach((t, i) => {
                assert.ok(Math.abs(t.left - (g.left + i * (col + 8))) < 1, `${at}: ${t.label} starts on its column`);
                if (i < row.length - 1 || !last) assert.ok(Math.abs(t.right - t.left - col) < 1, `${at}: ${t.label} is a column wide`);
                if (i) assert.ok(Math.abs(t.left - row[i - 1].right - 8) < 1, `${at}: 8 px beside ${t.label}`);
              });
              if (r) assert.ok(Math.abs(row[0].top - rows[r - 1][0].bottom - 8) < 1, `${at}: 8 px above row ${r}`);
            });
            for (const t of g.tiles) {
              assert.equal(t.bg, SURFACE[look], `${at}: ${t.label} on the surface colour`);
              assert.equal(t.border, '0px', `${at}: ${t.label} has no border`);
              assert.deepEqual(t.radius, ['12px', '12px', '12px', '12px'], `${at}: ${t.label} rounded alike`);
              assert.ok(t.valueTop >= t.labelTop, `${at}: ${t.label}'s value under its label`);
              assert.ok(t.valueLeft >= t.left && t.valueRight <= t.right && t.valueBottom <= t.bottom, `${at}: ${t.label}'s value within its tile`);
              assert.ok(!t.clipped && !t.cut, `${at}: ${t.label}'s value isn't cut off`);
              if (t.text.includes(LONG) && width === 320) assert.ok(t.valueHeight > t.line * 1.5, `${at}: the long model name wraps`);
            }
          }
        }
      }
      await b.send('Page.removeScriptToEvaluateOnNewDocument', { identifier });
    }
  } finally { await b.close(); await stop(panel); }
});
