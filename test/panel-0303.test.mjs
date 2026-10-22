import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, page, panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0303: the header's mark and the Foreman's builder on the LCD screen ----------

const ago = s => new Date(Date.now() - s * 1000).toISOString();
const BUILDING = T('0501', 'building', { title: 'Writing its code', started: ago(65), build_running: true, reviewer: 'codex' });
const READY = T('0502', 'ready', { title: 'Ready' });

// The page with a stand-in for the design's renderer, which records each mark (tile) and mini builder it makes, and
// each set() on them. `board()` gives the board each time the page asks for it, so a test can change it between
// refreshes. `motion` is the reduced-motion setting the page sees; `changes` gets each listener for a change to it.
function fake(board, motion = { reduce: false }) {
  const tiles = [], minis = [], changes = [];
  const PANEL = { still() {} };
  const SpeckLCD = {
    PANEL,
    badge() { return { set() {}, scr: { still: false, size() {} }, cast: { still: false } }; },
    tile(canvas, poses, state, o) { const t = { canvas, poses, state, o, sets: [] }; tiles.push(t); return { set(p) { t.sets.push(p); } }; },
    mini(canvas, moving) {
      const m = { canvas, moving, parent: canvas.parentNode, sets: [], scr: { still: false, dirty: false, size() {} }, cast: { still: false } };
      minis.push(m);
      return { scr: m.scr, cast: m.cast, set(on) { m.sets.push(on); } };
    },
  };
  const p = fakePage([], {
    SpeckLCD,
    matchMedia: q => ({ matches: q === '(prefers-reduced-motion: reduce)' && motion.reduce, addEventListener(type, fn) { if (q === '(prefers-reduced-motion: reduce)') changes.push(fn); } }),
    devicePixelRatio: 1,
    fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify({ tickets: board(), ideas: [], run: { on: true } }))) }),
  });
  return { p, tiles, minis, changes, PANEL };
}
const refresh = async p => { p.timers.shift()(); await p.settle(); };
const builderIn = p => p.byId('run').children.find(n => n.tagName === 'canvas');
// The page's CSS rule for a selector, as written.
const rule = sel => (page().match(new RegExp(`\\n\\s*${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`)) || [])[1] || '';

// 0320: the mark is the design's logo now, an svg written into the page (checked in logo-0320.test.mjs), in place of
// 0303's canvas drawn with the renderer's tile().
test('0303 AC1: the header\'s mark comes before "speck", hidden from screen readers', () => {
  const logo = (page().match(/<div class="logo">([\s\S]*?)<\/div>/) || [])[1] || '';
  assert.match(logo, /^<svg [^>]*class="mark" id="mark" aria-hidden="true">[\s\S]*?<\/svg><b class="name">speck<\/b> <span>control panel<\/span>$/, 'with speck in its own element since 0304');
});

test('0303 AC1: since 0320 the page draws no tile for the mark', async () => {
  const { p, tiles } = fake(() => [READY]);
  await p.settle();
  await refresh(p);
  assert.equal(tiles.length, 0);
});

test('0303 AC1: at 32 px since 0309, the ink the text colour and the speck --dot (since 0320, as the logo\'s --speck)', () => {
  const css = rule('.logo .mark');
  for (const d of ['width: 32px', 'height: 32px', '--speck: var(--dot)']) {
    assert.ok(css.includes(d), `${d} in .logo .mark { ${css} }`);
  }
  const root = (page().match(/:root \{([\s\S]*?)\}/) || [])[1] || '', dark = (page().match(/:root\[data-theme="dark"\] \{([\s\S]*?)\}/) || [])[1] || '';
  assert.match(root, /--dot: #b0412e;/, 'the design\'s --dot, light');
  assert.match(dark, /--dot: #d4664e;/, 'the design\'s --dot, dark');
  assert.doesNotMatch(page(), /\.mark \.dot\b/, 'the old drawing\'s dot rules are gone');
});

test('0303 AC1: without the renderer (it didn\'t load), the header still shows (0364: with no builder in the Foreman\'s button)', async () => {
  const p = fakePage([], { fetch: async () => ({ ok: true, status: 200, json: async () => JSON.parse(JSON.stringify({ tickets: [BUILDING], ideas: [], run: { on: true } })) }) });
  await p.settle();
  assert.equal(p.byId('run').hidden, false);
  assert.equal(builderIn(p), undefined);
});

// 0364: the Foreman's button has no builder now, so speck's mark shows once: it makes no mini builder, at work or not.
test('0303 AC2: the Foreman\'s button makes no mini builder, as builds start and stop, and shows its status alone', async () => {
  let tickets = [BUILDING];
  const { p, minis } = fake(() => tickets);
  await p.settle();
  for (const next of [[BUILDING, READY], [READY], [BUILDING]]) {
    assert.equal(minis.length, 0);
    assert.equal(builderIn(p), undefined);
    assert.match(p.byId('run').children[0].className, /\blabel\b/);
    tickets = next;
    await refresh(p);
  }
  assert.equal(rule('.run-state .mini'), '', 'no style for it');
  assert.doesNotMatch(page(), /const BADGE = |function paintBadge\(|LCD\.mini\(/, 'the old drawings are gone');
});

test('0303 AC2: a change to reduced motion makes no builder in the button', async () => {
  const { p, minis, changes } = fake(() => [BUILDING]);
  await p.settle();
  for (const fn of changes) fn({ matches: true });
  for (const fn of changes) fn({ matches: false });
  assert.equal(minis.length, 0);
  assert.equal(builderIn(p), undefined);
});

// ---------- in a real browser ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
// The colours each canvas shows, as hex, most common first, ignoring transparent pixels.
// 0320: the mark is an svg in the page's own colours now, checked in a real browser in logo-0320.test.mjs. 0364: the
// Foreman's button has no builder, so there is none to follow the look.
test('0303 AC3: in a real browser, the Foreman\'s button draws no builder, in either look', skip, async () => {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    for (const look of ['light', 'dark']) {
      const b = await browserPage('about:blank');
      try {
        await b.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
        await b.send('Page.enable');
        await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('speck-theme', '${look}');` });
        await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
        await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && !!document.querySelector('#run .label')`, 'the panel');
        assert.equal(await b.js(`document.documentElement.dataset.theme`), look);
        assert.equal(await b.js(`document.querySelectorAll('#run canvas').length`), 0, look);
      } finally { await b.close(); }
    }
  } finally { await stop(panel); }
});
