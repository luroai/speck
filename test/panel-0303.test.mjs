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

test('0303 AC1: the header\'s mark is a canvas before "speck", hidden from screen readers, in place of the old drawing', () => {
  const logo = (page().match(/<div class="logo">([\s\S]*?)<\/div>/) || [])[1] || '';
  assert.match(logo, /^<canvas class="mark" id="mark" aria-hidden="true"><\/canvas>speck <span>control panel<\/span>$/);
  assert.doesNotMatch(logo, /<svg\b/, 'the old drawing is gone');
});

test('0303 AC1: the mark is drawn once with tile(canvas, PANEL, \'still\', the design\'s options)', async () => {
  const { p, tiles, PANEL } = fake(() => [READY]);
  await p.settle();
  assert.equal(tiles.length, 1);
  const [t] = tiles;
  assert.equal(t.canvas, p.byId('mark'), 'on the header\'s mark');
  assert.equal(t.poses, PANEL, 'the renderer\'s PANEL poses');
  assert.equal(t.state, 'still');
  assert.deepEqual({ ...t.o }, { cols: 16, rows: 16, k: .3, ox: 8, oy: 15, still: true });
  await refresh(p);
  assert.equal(tiles.length, 1, 'a refresh doesn\'t draw it again');
});

test('0303 AC1: at 19 px, with the screen and unlit dots transparent, the ink the text colour and the speck --dot', () => {
  const css = rule('.logo .mark');
  for (const d of ['width: 19px', 'height: 19px', '--lcd-bg: transparent', '--lcd-off: transparent', '--lcd-ink: var(--text)', '--lcd-red: var(--dot)', '--lcd-shadow: transparent']) {
    assert.ok(css.includes(d), `${d} in .logo .mark { ${css} }`);
  }
  const root = (page().match(/:root \{([\s\S]*?)\}/) || [])[1] || '', dark = (page().match(/:root\[data-theme="dark"\] \{([\s\S]*?)\}/) || [])[1] || '';
  assert.match(root, /--dot: #b0412e;/, 'the design\'s --dot, light');
  assert.match(dark, /--dot: #d4664e;/, 'the design\'s --dot, dark');
  assert.doesNotMatch(page(), /\.mark \.dot\b/, 'the old drawing\'s dot rules are gone');
});

test('0303 AC1: without the renderer (it didn\'t load), the header still shows, with the mark blank', async () => {
  const p = fakePage([], { fetch: async () => ({ ok: true, status: 200, json: async () => JSON.parse(JSON.stringify({ tickets: [BUILDING], ideas: [], run: { on: true } })) }) });
  await p.settle();
  assert.equal(p.byId('run').hidden, false);
  assert.equal(builderIn(p).className, 'mini hop');
});

test('0303 AC2: the Foreman\'s button shows the renderer\'s mini builder before its status, made once and kept', async () => {
  let tickets = [BUILDING];
  const { p, minis } = fake(() => tickets);
  await p.settle();
  assert.equal(minis.length, 1);
  const c = builderIn(p);
  assert.equal(minis[0].canvas, c, 'on the button\'s canvas');
  assert.equal(minis[0].moving, true, 'made hopping, as a build is running');
  assert.equal(minis[0].parent, p.byId('run'), 'made once its canvas is in the button, so it reads the look\'s colours');
  assert.equal(p.byId('run').children[0], c, 'before its status');
  assert.match(p.byId('run').children[1].className, /\blabel\b/);
  assert.equal(c.attrs['aria-hidden'], 'true');
  assert.match(rule('.run-state .mini'), /width: 28px; height: 28px/, '28 px');
  tickets = [BUILDING, READY];
  await refresh(p);
  assert.equal(builderIn(p), c, 'a refresh keeps the same builder');
  assert.equal(minis.length, 1);
  assert.deepEqual(minis[0].sets, [], 'still hopping: not set again');
  assert.doesNotMatch(page(), /const BADGE = |function paintBadge\(/, 'the old drawing is gone');
});

test('0303 AC2: it hops while builds are running and is still otherwise, through the mini builder\'s set(true) and set(false)', async () => {
  let tickets = [READY];
  const { p, minis } = fake(() => tickets);
  await p.settle();
  assert.equal(minis[0].moving, false, 'made still, as nothing is running');
  assert.equal(builderIn(p).className, 'mini still');
  tickets = [BUILDING];
  await refresh(p);
  assert.deepEqual(minis[0].sets, [true]);
  assert.equal(builderIn(p).className, 'mini hop');
  tickets = [READY];
  await refresh(p);
  assert.deepEqual(minis[0].sets, [true, false]);
  assert.equal(builderIn(p).className, 'mini still');
  assert.equal(minis.length, 1, 'the same builder throughout');
});

test('0303 AC2: a change to reduced motion holds the builder still or lets it move again', async () => {
  const { p, minis, changes } = fake(() => [BUILDING]);
  await p.settle();
  for (const fn of changes) fn({ matches: true });
  assert.equal(minis[0].scr.still, true);
  assert.equal(minis[0].cast.still, true);
  for (const fn of changes) fn({ matches: false });
  assert.equal(minis[0].scr.still, false);
  assert.equal(minis[0].cast.still, false);
});

// ---------- in a real browser ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
// The colours each canvas shows, as hex, most common first, ignoring transparent pixels.
const COLOURS = `(() => {
  const hex = (r, g, b) => '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('');
  const of = c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, n = new Map();
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] === 255) { const k = hex(d[i], d[i + 1], d[i + 2]); n.set(k, (n.get(k) || 0) + 1); }
    return { colours: [...n.keys()], clear: d.filter((v, i) => i % 4 === 3 && v === 0).length, width: c.getBoundingClientRect().width }; };
  const cs = getComputedStyle(document.documentElement), v = k => cs.getPropertyValue(k).trim();
  return { mark: of(document.getElementById('mark')), mini: of(document.querySelector('#run canvas.mini')),
    text: v('--text'), dot: v('--dot'), bg: v('--lcd-bg'), off: v('--lcd-off'), ink: v('--lcd-ink') };
})()`;

test('0303 AC3: in a real browser, the mark and the builder follow the light and dark looks, from the start and when switched', skip, async () => {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    // Opened in each look, then switched to the other.
    for (const [first, then] of [['light', 'dark'], ['dark', 'light']]) {
      const b = await browserPage('about:blank');
      try {
        await b.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
        await b.send('Page.enable');
        await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('speck-theme', '${first}');` });
        await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
        await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && !!document.querySelector('#run canvas.mini')`, 'the panel');
        for (const look of [first, then]) {
          if (look === then) await b.js(`document.getElementById('theme').click()`);
          await b.until(`document.documentElement.dataset.theme === '${look}'`, `the ${look} look`);
          let x;
          for (let i = 0; i < 50; i++) { // the renderer redraws on its next frame
            x = await b.js(COLOURS);
            if (x.mark.colours.includes(x.text) && x.mini.colours.includes(x.ink) && x.mini.colours.includes(x.off)) break;
            await new Promise(res => setTimeout(res, 50));
          }
          const where = `${look}, opened ${first}`;
          assert.equal(x.mark.width, 19, `${where}: the mark is 19 px`);
          assert.equal(x.mini.width, 28, `${where}: the builder is 28 px`);
          assert.ok(x.mark.colours.includes(x.text), `${where}: the mark's ink is the text colour ${x.text}: ${JSON.stringify(x)}`);
          assert.ok(x.mark.colours.includes(x.dot), `${where}: the speck is ${x.dot}: ${JSON.stringify(x)}`);
          assert.ok(x.mark.clear > 0 && !x.mark.colours.includes(x.bg) && !x.mark.colours.includes(x.off), `${where}: no screen or unlit dots behind the mark`);
          assert.ok(x.mini.colours.includes(x.ink) && x.mini.colours.includes(x.off) && x.mini.clear === 0, `${where}: the builder is on the look's LCD screen: ${JSON.stringify(x)}`);
        }
      } finally { await b.close(); }
    }
  } finally { await stop(panel); }
});
