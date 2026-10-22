import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { page, findChrome, browserPage } from './support/panel.mjs';
import { sharedPanel } from './support/shared-panel.mjs';
import { rules, rule, get, selectors } from './support/css.mjs';

// ---------- 0373: speck's dot-matrix name at every width, with the base branch beside it ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const headerHtml = () => (page().match(/<header>([\s\S]*?)<\/header>/) || [])[1] || '';

test('0373 AC1: no rule hides the "speck" word at any width, and it is Doto at 26 px', () => {
  for (const r of rules().filter(r => selectors(r).includes('.logo .name'))) {
    assert.notEqual(get(r, 'display'), 'none', `not hidden: ${r.at.join(' ')}`);
    assert.ok([undefined, '26px'].includes(get(r, 'font-size')), `no other size: ${r.at.join(' ')}`);
  }
  assert.match(get(rule('.logo .name'), 'font-family'), /^"Doto",/);
  assert.equal(get(rule('.logo .name'), 'font-size'), '26px');
});

test('0373 AC2: in the page, "base <branch>" comes straight after the "speck" word, and the "<project> · base" line is gone', () => {
  const h = headerHtml();
  assert.match(h, /<b class="name">speck<\/b><div class="repo">base <code>\{\{base\}\}<\/code><\/div>/);
  assert.doesNotMatch(h, /\{\{repo\}\}/, 'no project');
  assert.doesNotMatch(h, /· base/, 'no "<project> · base" line');
});

// The panel at `width` px with the Foreman reading "Building 1" and the base branch shown as `base`.
async function withPanel(fn, { width, base = 'main', theme = 'light' }) {
  const panel = await sharedPanel();
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height: 640, deviceScaleFactor: 1, mobile: width < 700 });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
      localStorage.setItem('speck-theme', ${JSON.stringify(theme)});
      const STATE = { tickets: [], ideas: [], run: { on: true, pid: 1 }, foreman: { word: 'Building 1', tone: 'ok' } }, real = window.fetch.bind(window);
      window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? new Response(JSON.stringify(STATE), { status: 200, headers: { 'content-type': 'application/json' } }) : real(url, opts);
      // As the parser reaches the header, before the page script sets its tooltip
      const seen = new MutationObserver(() => { const c = document.querySelector('.repo code'); if (!c) return; c.textContent = ${JSON.stringify(base)}; seen.disconnect(); });
      seen.observe(document, { childList: true, subtree: true });
    })();` });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && !!document.querySelector('#run .board') && !document.querySelector('#run').hidden`, 'the panel');
    await b.js('document.fonts.ready.then(() => true)');
    await fn(b, panel);
  } finally { await b.close(); }
}
// Each part of the header: shown or not, its box, and whether its text is cut short.
const measure = b => b.js(`(() => {
  const box = s => { const n = document.querySelector(s), r = n.getBoundingClientRect(), cs = getComputedStyle(n);
    return { shown: cs.display !== 'none' && r.width > 0, left: r.left, right: r.right, width: r.width, height: r.height, mid: r.top + r.height / 2,
      cut: n.scrollWidth > n.clientWidth + 0.5, font: cs.fontFamily, size: cs.fontSize, ellipsis: cs.textOverflow === 'ellipsis' }; };
  const board = document.querySelector('#run .board'), repo = document.querySelector('.repo');
  return { header: box('header'), mark: box('.logo .mark'), name: box('.logo .name'), repo: box('.repo'), label: box('.logo span'), run: box('#run'), settings: box('#settings-open'),
    boardCut: board.getBoundingClientRect().width < Number(board.getAttribute('width')) - 0.5, repoText: repo.textContent.trim(), repoTitle: repo.title,
    headerText: document.querySelector('header').textContent, page: document.documentElement.scrollWidth, width: innerWidth };
})()`);
const ROW = ['mark', 'name', 'repo', 'run', 'settings'];

for (const width of [320, 375, 500, 699, 700, 1280]) {
  test(`0373 AC1 to AC4: at ${width} px, the mark, "speck" in Doto at 26 px, then "base main", on one row${width < 700 ? ', with no "control panel"' : ', with "control panel"'}`, skip, () => withPanel(async (b, panel) => {
    const h = await measure(b);
    const at = `${width} px: ${JSON.stringify(h)}`;
    // AC1
    assert.ok(h.name.shown, `"speck" shows: ${at}`);
    assert.match(h.name.font, /^Doto,/, at);
    assert.equal(h.name.size, '26px', at);
    assert.equal(h.name.cut, false, `"speck" isn't cut short: ${at}`);
    assert.ok(h.name.width >= 70, `"speck" is drawn at its full width: ${at}`);
    assert.ok(h.name.left >= h.mark.right && h.name.left - h.mark.right <= 8, `"speck" just after the mark: ${at}`);
    // AC2
    assert.equal(h.repoText, 'base main', at);
    assert.ok(h.repo.left >= h.name.right - 0.5 && h.repo.left - h.name.right <= 1, `"base main" straight after "speck": ${at}`);
    assert.ok(!h.headerText.includes('·'), `no "<project> · base" line: ${at}`);
    assert.ok(!h.headerText.includes(path.basename(panel.dir)), `no project name: ${at}`);
    // AC3: one row, in order, nothing past the right edge
    const mids = ROW.map(k => h[k].mid);
    assert.ok(Math.max(...mids) - Math.min(...mids) < 4, `one row: ${mids} ${at}`);
    for (let i = 1; i < ROW.length; i++) assert.ok(h[ROW[i]].left >= h[ROW[i - 1]].right - 0.5, `${ROW[i]} after ${ROW[i - 1]}: ${at}`);
    assert.ok(h.page <= h.width, `no sideways scroll: ${at}`);
    if (width >= 500) assert.equal(h.repo.cut, false, `"base main" in full: ${at}`);
    if (width === 500) assert.equal(h.boardCut, false, `the Foreman's word in full: ${at}`);
    // AC4
    assert.equal(h.label.shown, width >= 700, `"control panel" only at 700 px and wider: ${at}`);
    if (width >= 700) assert.ok(h.label.left >= h.repo.right, `"control panel" after the base branch: ${at}`);
  }, { width }));
}

for (const theme of ['light', 'dark']) {
  test(`0373 AC3: at 320 px, ${theme}, a long base branch is cut short with an ellipsis and in full in its tooltip, and "speck" isn't`, skip, () => withPanel(async b => {
    const base = 'release/2026-autumn-with-a-long-name';
    const h = await measure(b);
    const at = JSON.stringify(h);
    assert.equal(h.repoText, `base ${base}`);
    assert.ok(h.repo.shown && h.repo.cut && h.repo.ellipsis, `cut short with "…": ${at}`);
    assert.equal(h.repoTitle, `base ${base}`, 'the tooltip has it in full');
    assert.equal(h.name.cut, false, `"speck" isn't cut short: ${at}`);
    assert.ok(h.name.width >= 70, `"speck" at its full width: ${at}`);
    const mids = ROW.map(k => h[k].mid);
    assert.ok(Math.max(...mids) - Math.min(...mids) < 4, `one row: ${mids}`);
    for (let i = 1; i < ROW.length; i++) assert.ok(h[ROW[i]].left >= h[ROW[i - 1]].right - 0.5, `${ROW[i]} after ${ROW[i - 1]}: ${at}`);
    assert.ok(h.page <= h.width, `no sideways scroll: ${at}`);
  }, { width: 320, base: 'release/2026-autumn-with-a-long-name', theme }));
}
