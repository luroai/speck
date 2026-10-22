import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, T, full, fakePage, page, findChrome, browserPage } from './support/panel.mjs';
import { sharedPanel } from './support/shared-panel.mjs';

// ---------- 0364: the panel's header on one row, with the project always shown ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const css = () => (page().match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';

// A board long enough to scroll, with the Foreman reading `word`. 0002 waits on 0001, so its row jumps to 0001 (0154).
const board = (word = 'Building 1', tone = 'ok', fixing = null) => ({
  tickets: [
    full('0001', { problem: Array.from({ length: 60 }, (_, i) => `Line ${i + 1} of a long problem.`).join('\n\n') }),
    T('0002', 'ready', { after: ['0001'], waiting_on: ['0001'] }),
    ...Array.from({ length: 24 }, (_, i) => full(String(i + 10).padStart(4, '0'))),
  ],
  ideas: [],
  run: { on: true, pid: 1 },
  foreman: { word, tone, ...(fixing ? { fixing } : {}) },
});

// ---------- the Foreman's button, on the fake page ----------

const SpeckLCD = { badge() { return { set() {}, scr: { still: false, size() {} }, cast: { still: false } }; }, mini() { throw new Error('no mini builder in the header'); } };
const foremanPage = (word, tone) => fakePage([board(word, tone), board(word, tone)], { SpeckLCD });

test('0364 AC4: the Foreman\'s button shows its word with no builder, in its tone\'s colours, with its tooltip', async () => {
  for (const [word, tone] of [['Building 1', 'ok'], ['Off', 'off'], ['Needs you 2', 'bad'], ['Waiting: the base branch is failing its tests', 'warn']]) {
    const p = foremanPage(word, tone);
    await p.settle();
    const run = p.byId('run');
    assert.equal(run.hidden, false);
    assert.ok(!p.all(run).some(n => n.tagName === 'canvas' || /\bmini\b/.test(n.className || '')), `${word}: no builder`);
    assert.equal(run.textContent, word);
    assert.equal(run.className, `run-state fm-${tone}`);
    assert.equal(run.title, 'What speck run is doing, and what is waiting');
  }
});

test('0364 AC4: pressing the Foreman\'s button still opens and closes its detail', async () => {
  const p = foremanPage('Building 1', 'ok');
  await p.settle();
  assert.equal(p.byId('foreman').hidden, true);
  p.press(p.byId('run'));
  assert.equal(p.byId('run').attrs['aria-expanded'], 'true');
  assert.equal(p.byId('foreman').hidden, false);
  p.press(p.byId('run'));
  assert.equal(p.byId('run').attrs['aria-expanded'], 'false');
  assert.equal(p.byId('foreman').hidden, true);
});

test('0364 AC1: the header has no slimming as you scroll, in its styles or its script', () => {
  assert.doesNotMatch(css(), /header\.slim|header\.wide|head-slim|head-wide/);
  assert.doesNotMatch(page(), /classList\.(add|remove|contains)\('slim'/);
});

// ---------- in a real browser ----------

// The panel at `width` px, with the board above and the screen's safe-area insets, the shared panel's project and base
// shown as `speck` and `main`, as AC2 measures them.
async function withPanel(fn, { width = 375, height = 640, insets = null, word = 'Building 1', theme = null, fixing = null } = {}) {
  const panel = await sharedPanel();
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 });
    if (insets) await b.send('Emulation.setSafeAreaInsetsOverride', { insets });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
      ${theme ? `localStorage.setItem('speck-theme', ${JSON.stringify(theme)});` : ''}
      const STATE = ${JSON.stringify(board(word, 'ok', fixing))}, real = window.fetch.bind(window);
      window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? new Response(JSON.stringify(STATE), { status: 200, headers: { 'content-type': 'application/json' } }) : real(url, opts);
      // As the parser reaches the header, before the page script runs
      const seen = new MutationObserver(() => { const c = document.querySelectorAll('.repo code'); if (c.length < 2) return; c[0].textContent = 'speck'; c[1].textContent = 'main'; seen.disconnect(); });
      seen.observe(document, { childList: true, subtree: true });
    })();` });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && !!document.querySelector('#queue .q .goto') && !document.querySelector('#run').hidden`, 'the panel');
    await b.js('document.fonts.ready.then(() => true)');
    await fn(b);
  } finally { await b.close(); }
}
const settle = () => new Promise(r => setTimeout(r, 300));
const scrollTo = async (b, y) => { await b.js(`scrollTo(0, ${y})`); await settle(); };
// The header and each of its parts: on screen or not, their boxes, and whether their text is cut short.
const header = b => b.js(`(() => {
  const box = s => { const n = document.querySelector(s), r = n.getBoundingClientRect(); return { shown: getComputedStyle(n).display !== 'none' && getComputedStyle(n).visibility !== 'hidden' && r.width > 0 && r.height > 0, left: r.left, right: r.right, top: r.top, bottom: r.bottom, height: r.height, mid: r.top + r.height / 2, cut: n.scrollWidth > n.clientWidth + 0.5 }; };
  const label = document.querySelector('#run .label');
  return { header: box('header'), mark: box('.logo .mark'), name: box('.logo .name'), repo: box('.repo'), run: box('#run'), settings: box('#settings-open'), theme: box('#theme'),
    runCut: label ? label.scrollWidth > label.clientWidth + 0.5 : false, repoText: document.querySelector('.repo').textContent.trim(), repoTitle: document.querySelector('.repo').title,
    page: document.documentElement.scrollWidth, width: innerWidth };
})()`);
const ORDER = ['mark', 'repo', 'run', 'settings', 'theme'];
const oneRow = (h, at) => {
  for (const k of ORDER) assert.ok(h[k].shown, `${k} shows: ${at}`);
  for (let i = 1; i < ORDER.length; i++) assert.ok(h[ORDER[i]].left >= h[ORDER[i - 1]].right - 0.5, `${ORDER[i]} comes after ${ORDER[i - 1]}, not over it: ${at}`);
  const mids = ORDER.map(k => h[k].mid);
  assert.ok(Math.max(...mids) - Math.min(...mids) < 4, `one row: ${mids} ${at}`);
};

for (const width of [320, 375, 500, 699]) {
  test(`0364 AC1 and AC3: at ${width} px, the header is one row, the same at the top and scrolled, at most 60 px, with the mark and no "speck" word`, skip, () => withPanel(async b => {
    const top = await header(b);
    oneRow(top, `${width} px at the top`);
    assert.ok(top.header.height <= 60, `${top.header.height} px`);
    assert.equal(top.name.shown, false, '"speck" is hidden');
    assert.ok(top.mark.shown, 'the mark stays');
    await scrollTo(b, 600);
    const down = await header(b);
    oneRow(down, `${width} px scrolled`);
    assert.equal(down.header.height, top.header.height, 'scrolling never changes its height');
    assert.equal(down.header.top, 0, 'still at the top of the screen');
    await scrollTo(b, 0);
    assert.equal((await header(b)).header.height, top.header.height);
  }, { width }));
}

test('0364 AC1: with a 47 px status bar, the header is at most 60 px plus that, scrolled or not', skip, () => withPanel(async b => {
  for (const y of [0, 600]) {
    await scrollTo(b, y);
    const h = await header(b);
    assert.ok(h.header.height <= 60 + 47, `${h.header.height} px`);
    assert.ok(h.mark.top >= 47, 'its content starts below the status bar');
  }
}, { insets: { top: 47, bottom: 34 } }));

test('0364 AC2: at 500 px, with speck, main and "Building 1", nothing in the header is cut short', skip, () => withPanel(async b => {
  const h = await header(b);
  assert.equal(h.repoText, 'speck · base main');
  assert.equal(h.repo.cut, false, 'the project and base in full');
  assert.equal(h.runCut, false, 'the Foreman in full');
}, { width: 500 }));

test('0364 AC2: too narrow, the project and base are cut short with an ellipsis, never hidden, and the tooltip has them in full', skip, () => withPanel(async b => {
  await b.js(`(() => { const c = document.querySelectorAll('.repo code'); c[0].textContent = 'a-very-long-project-name-that-cannot-fit'; c[1].textContent = 'release/2026-autumn'; })()`);
  const h = await header(b);
  assert.ok(h.repo.shown, 'shown');
  assert.equal(h.repo.cut, true, 'cut short');
  assert.equal(await b.js(`getComputedStyle(document.querySelector('.repo')).textOverflow`), 'ellipsis');
  assert.equal(h.repoTitle, 'speck · base main', 'the tooltip, set as the page loads, has the text in full');
  oneRow(h, '320 px, a long project');
}, { width: 320 }));

for (const width of [700, 1200]) {
  test(`0364 AC2 and AC3: at ${width} px, the header shows "speck", "control panel" and the project, with the project's tooltip`, skip, () => withPanel(async b => {
    const h = await header(b);
    assert.ok(h.name.shown && await b.js(`getComputedStyle(document.querySelector('.logo span')).display !== 'none'`));
    assert.ok(h.repo.shown && !h.repo.cut);
    assert.equal(h.repoTitle, 'speck · base main');
    oneRow(h, `${width} px`);
  }, { width }));
}

for (const theme of ['light', 'dark']) {
  test(`0364 AC5: at 320 px, ${theme}, nothing scrolls sideways or overlaps, and each header button is at least 44 px tall, with a long Foreman word`, skip, () => withPanel(async b => {
    for (const y of [0, 600]) {
      await scrollTo(b, y);
      const h = await header(b);
      assert.ok(h.page <= h.width, `no sideways scroll: ${h.page} > ${h.width}`);
      oneRow(h, `320 px at ${y}`);
      for (const k of ['run', 'settings', 'theme']) assert.ok(h[k].height >= 44, `${k}: ${h[k].height} px`);
      assert.ok(h.theme.right <= h.width, 'light/dark is on screen');
    }
  }, { width: 320, theme, word: 'Waiting: the base branch is failing its tests' }));
}

test('0364 AC5: at 320 px, "Fixing on" beside a long Foreman word stays inside its button, overlapping nothing', skip, () => withPanel(async b => {
  const h = await header(b);
  oneRow(h, '320 px, Fixing on');
  const inside = await b.js(`(() => { const r = document.querySelector('#run').getBoundingClientRect(); return [...document.querySelectorAll('#run > *')].every(n => { const c = n.getBoundingClientRect(); return c.width === 0 || (c.left >= r.left - 0.5 && c.right <= r.right + 0.5); }); })()`);
  assert.ok(await b.js(`!!document.querySelector('#run .fixing')`), '"Fixing on" is there');
  assert.ok(inside, 'everything in the button is inside it');
  assert.ok(h.page <= h.width, 'no sideways scroll');
}, { width: 320, fixing: 'fix', word: 'Waiting: the base branch is failing its tests' }));

test('0364 AC1: the brief no longer says the header slims on a phone', () => {
  const brief = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8');
  assert.doesNotMatch(brief, /slimmed to one row/);
});

for (const insets of [null, { top: 47, bottom: 34 }]) {
  const where = insets ? 'in the home-screen app' : 'in a browser tab';
  test(`0364 AC5: ${where}, jumping to a ticket and opening the full ticket show them below the header`, skip, () => withPanel(async b => {
    await b.js(`document.querySelector('#queue').scrollIntoView()`);
    await b.js(`[...document.querySelectorAll('#queue .goto')].find(n => n.textContent === '0001').click()`);
    await b.until(`!!document.querySelector('#shaping .item.flash')`, 'the highlight');
    await new Promise(r => setTimeout(r, 600)); // any smooth scroll
    const h = await header(b);
    const t = await b.js(`document.querySelector('#shaping .item.flash').getBoundingClientRect().top`);
    assert.ok(t >= h.header.bottom - 0.5, `the ticket's top (${t}) is below the header's bottom (${h.header.bottom})`);
    await b.js(`document.querySelector('#shaping .item.flash .head').click()`);
    await b.until(`!!document.querySelector('#shaping .item.open .full-open')`, 'the ticket to open');
    await b.js(`document.querySelector('#shaping .item.open .full-open').click()`);
    await b.until(`!document.querySelector('#full-ticket').hidden`, 'the full ticket');
    const close = await b.js(`(() => { const r = document.querySelector('#full-ticket .close').getBoundingClientRect(); const n = document.elementFromPoint(r.left + 4, r.top + 4); return !!n && !!n.closest('#full-ticket'); })()`);
    assert.ok(close, 'the full ticket\'s close button is on top, not behind the header');
  }, { insets }));
}
