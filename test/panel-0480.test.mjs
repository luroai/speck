import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { panelRepo, fm, good, freePort, startPanel, stop, findChrome, browserPage, cssRules, cssValue, styles, REST_LANES } from './support/panel.mjs';

// ---------- 0480: each lane in a light card instead of a dark frame ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const LANES = { plan: 'shaping-section', build: 'build-section', shipped: 'shipped-section' };

// 0600: the lanes are flat lists now, with no card, edge or title of their own (see panel-0600.test.mjs). What is left of
// 0480: each lane on its own light background, never the screen's frame colours.
test('0480 AC1 AC2 AC4, since 0600: the lane is drawn by itself, light, with no card or edge, and nothing in it is in the frame colour', () => {
  const lane = cssRules('main > section');
  assert.equal(cssValue(lane, 'background-color'), 'var(--panel)', 'the lane\'s own background');
  assert.deepEqual(cssRules('main > section::before'), [], 'no edge drawn over it');
  assert.equal(cssValue(lane, 'border-radius'), undefined, 'no corners');
  // AC4: the lane's own box, so it slides as a whole (0476)
  assert.equal(cssValue(lane, 'position'), 'relative');
  assert.equal(cssValue(lane, 'padding'), '0');
  // No lane rule uses the screen's frame colours, and the token made for Plan's dot on the frame has gone
  const css = styles().replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [, sel, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (/main > section|\.lane-|\.sh\b/.test(sel)) assert.doesNotMatch(body, /--bezel/, `${sel.trim()}: nothing in the screen's frame colours`);
  }
  assert.doesNotMatch(css, /--bezel-step/);
});

// A real panel with tickets in every lane, in a real browser at a phone's size.
async function panel() {
  const r = panelRepo();
  for (let n = 10; n < 20; n++) {
    r.write(`00${n}-ready.md`, fm({ id: `"00${n}"`, title: `Ready ticket ${n}`, status: 'ready' }), good);
    r.write(`01${n}-draft.md`, fm({ id: `"01${n}"`, title: `Draft ticket ${n}`, status: 'draft' }), good);
    r.write(`02${n}-done.md`, fm({ id: `"02${n}"`, title: `Shipped ticket ${n}`, status: 'done' }), good, 'speck/tickets/done');
  }
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage(`http://127.0.0.1:${p.port}/`);
  b.end = async () => { await b.close(); await stop(p); };
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await b.until(`document.querySelectorAll('#queue .q').length >= 10 && document.querySelectorAll('#shipped tr').length >= 3 && document.querySelectorAll('#shaping .item').length >= 10 && document.fonts.status === 'loaded'`, 'the board');
  } catch (e) { await b.end(); throw e; }
  return b;
}

// Each lane at rest: the card's colours and box, the title row's, every colour in it, and its list's height.
const MEASURE = `(async () => {
  await document.fonts.ready;
  const colour = v => { const p = document.createElement('i'); p.style.color = v; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; };
  const root = getComputedStyle(document.documentElement), val = v => colour(root.getPropertyValue(v).trim());
  const want = { panel: val('--panel'), line: val('--line'), soft: val('--line-soft'), text: val('--text'), muted: val('--muted'), blue: val('--blue'),
    frame: [getComputedStyle(document.querySelector('.bezel')).backgroundColor], // 0603: the frame's own colours (--bezel) are gone, so the bar's is the one left
    oldInk: root.getPropertyValue('--bezel-ink').trim() ? val('--bezel-ink') : null }; // only BEFORE's rules, below, set the frame's ink now
  const main = document.querySelector('main').getBoundingClientRect(), out = { want, main: { left: main.left, right: main.right }, lanes: [] };
  for (const lane of ['plan', 'build', 'shipped']) {
    document.getElementById('tab-' + lane).click(); ${REST_LANES};
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const s = document.querySelector('main > section:not([hidden])'), sb = s.getBoundingClientRect(), c = getComputedStyle(s, '::before'), ss = getComputedStyle(s);
    const n = s.querySelector('.lane-n'), list = s.querySelector('.lane-list');
    const used = [];
    for (const el of [s, ...s.querySelectorAll('*')]) for (const pseudo of [null, '::before']) {
      const st = getComputedStyle(el, pseudo);
      if (pseudo && st.content === 'none') continue;
      used.push(st.backgroundColor, st.borderTopColor, st.borderBottomColor, st.borderLeftColor, st.borderRightColor, st.color);
    }
    out.lanes.push({ lane, card: { bg: ss.backgroundColor, colour: ss.color, edge: c.content, radius: ss.borderTopLeftRadius, left: sb.left, right: sb.right },
      line: n ? getComputedStyle(n).color : null, used, listHeight: list.getBoundingClientRect().height });
  }
  document.getElementById('tab-build').click(); ${REST_LANES};
  return out;
})()`;

// The contrast of a computed colour laid over an opaque one.
const parse = c => { const v = c.match(/[\d.]+/g).map(Number); return [v[0] / 255, v[1] / 255, v[2] / 255, v.length > 3 ? v[3] : 1]; };
const lum = c => { const [r, g, b] = c.map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (fg, bg) => {
  const [b, f] = [parse(bg), parse(fg)], front = [0, 1, 2].map(i => f[i] * f[3] + b[i] * (1 - f[3]));
  const [x, y] = [lum(front), lum(b.slice(0, 3))].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

test('0480 AC1 AC2, since 0600: in both looks, each lane is flat on its own light background, its line muted, and nothing in the frame colour', skip, async () => {
  const b = await panel();
  try {
    for (const theme of ['light', 'dark']) {
      await b.js(`document.documentElement.dataset.theme = ${JSON.stringify(theme)}, 1`);
      const m = await b.js(MEASURE);
      for (const l of m.lanes) {
        const w = `${theme}, ${l.lane}`;
        // AC1
        assert.equal(l.card.bg, m.want.panel, `${w}: the lane's own background`);
        assert.ok(l.card.edge === 'none' || l.card.edge === 'normal', `${w}: no edge drawn over it (0600)`);
        assert.equal(l.card.radius, '0px', `${w}: no corners (0600)`);
        assert.deepEqual([l.card.left, l.card.right], [m.main.left, m.main.right], `${w}: the column's width (0600)`);
        for (const c of l.used) assert.ok(!m.want.frame.includes(c), `${w}: nothing in or round the lane is in the frame's colours (${c})`);
        // AC2
        if (l.line) assert.equal(l.line, m.want.muted, `${w}: the lane's line in the muted colour`);
        assert.ok(contrast(l.card.colour, l.card.bg) >= 7, `${w}: its text reaches 0161's 7:1 (${contrast(l.card.colour, l.card.bg)})`);
        if (l.line) assert.ok(contrast(l.line, l.card.bg) >= 4.5, `${w}: the lane's line reaches 4.5:1 (${contrast(l.line, l.card.bg)})`); // 0577
      }
    }
  } finally { await b.end(); }
});

// The lane rules as they were before 0480 (0478's dark frame), laid over the page to measure it as it was.
const BEFORE = `
  :root { --bezel-step: #e4e4e462; --bezel: #262722; --bezel-ink: #e6e7df; --bezel-muted: #b8b9b1; } /* 0603: the frame's colours as they were, gone from the panel */
  main > section { display: grid; grid-template-columns: auto minmax(0, 1fr); grid-template-rows: auto auto minmax(0, 1fr); column-gap: 10px; padding: 8px 16px; color: var(--bezel-ink); background-color: var(--bezel); background-clip: content-box; border-radius: 28px / 20px; }
  main > section::before { content: none; }
  .lane-title { grid-row: 1; grid-column: 1; display: inline-flex; align-items: center; gap: .25em; min-width: 0; margin: 0; padding: 7px 0 6px 6px; font-family: "Doto", ui-monospace, monospace; font-weight: 900; font-size: 22px; line-height: 1; white-space: nowrap; color: var(--bezel-ink); }
  .lane-n { grid-row: 1; grid-column: 2; align-self: center; min-width: 0; padding: 7px 6px 6px 0; font-size: 12px; line-height: 1.5; text-align: right; color: var(--bezel-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  main > section > .sh { grid-row: 2; grid-column: 1 / -1; margin: 0 4px; color: var(--text); background: var(--panel); border-top: 0; border-radius: 8px 8px 0 0; }
  .lane-list { grid-row: 3; grid-column: 1 / -1; min-height: 0; margin: 0 4px 4px; overflow-y: auto; overscroll-behavior: contain; color: var(--text); background: var(--panel); border-radius: 0 0 8px 8px; }
  .lane-n + .lane-list { border-top: 0; border-radius: 8px; }`;

test('0480 AC3: at 390 × 844, with the same tickets, each lane\'s ticket list is taller than with 0478\'s dark frame', skip, async () => {
  const b = await panel();
  try {
    const after = await b.js(MEASURE);
    await b.js(`(() => { const s = document.createElement('style'); s.id = 'before-0480'; s.textContent = ${JSON.stringify(BEFORE)}; document.head.appendChild(s); return 1; })()`);
    const before = await b.js(MEASURE);
    assert.ok(before.lanes.every(l => l.card.colour === before.want.oldInk), 'the old rules are in place for the measure'); // 0600: the lane's ink, its title being gone
    for (const lane of Object.keys(LANES)) {
      const a = after.lanes.find(l => l.lane === lane).listHeight, was = before.lanes.find(l => l.lane === lane).listHeight;
      assert.ok(a > was, `${lane}: its list is taller (${a} px, was ${was} px)`);
    }
  } finally { await b.end(); }
});
