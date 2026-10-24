import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, findChrome, browserPage } from './support/panel.mjs';
import { sharedPanel } from './support/shared-panel.mjs';
import { foreman } from './support/screen.mjs';
import { MIN, building, board, speckPage } from './support/screen-speck.mjs';

// ---------- 0438: speck's screen and its frame are rounded and line up with the panel ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const WIDTHS = [320, 375, 500, 719, 720, 721, 1000, 1600];
const STATE = { tickets: [T('5000', 'ready'), T('5001', 'building'), T('5002', 'blocked')], ideas: [], run: { on: true, pid: 1 },
  foreman: foreman({ word: 'Needs you 1', tone: 'bad' }) };

// The panel in a real browser, with the board above, at `width` px wide.
async function withPanel(fn) {
  const panel = await sharedPanel();
  const b = await browserPage('about:blank');
  try {
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
      const STATE = ${JSON.stringify(STATE)}, real = window.fetch.bind(window);
      window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? new Response(JSON.stringify(STATE), { status: 200, headers: { 'content-type': 'application/json' } }) : real(url, opts);
    })();` });
    b.at = async width => {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 800, deviceScaleFactor: 1, mobile: false });
      await b.until(`innerWidth === ${width}`, `the window at ${width} px`);
    };
    await b.at(WIDTHS[0]);
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && document.querySelectorAll('#queue .q').length === 3`, 'the panel');
    await b.js('document.fonts.ready.then(() => true)');
    await fn(b);
  } finally { await b.close(); }
}
const measure = `(() => {
  const r = el => { const b = el.getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, width: b.width, height: b.height }; };
  const frame = document.querySelector('.bezel'), glass = document.querySelector('.bezel .glass'), strip = document.getElementById('tabs'), ss = getComputedStyle(strip);
  const fs = getComputedStyle(frame), gs = getComputedStyle(glass), after = getComputedStyle(glass, '::after');
  return { frame: r(frame), glass: r(glass), canvas: r(document.querySelector('#screen')), tabs: { left: r(strip).left + parseFloat(ss.paddingLeft), right: r(strip).right - parseFloat(ss.paddingRight) }, // 0477: the lanes' strip's row
    cards: [...document.querySelectorAll('#queue .q')].map(r), frameRadius: parseFloat(fs.borderTopLeftRadius), glassRadii: [gs.borderTopLeftRadius, gs.borderTopRightRadius, gs.borderBottomLeftRadius, gs.borderBottomRightRadius].map(parseFloat),
    afterRadius: parseFloat(after.borderTopLeftRadius), clips: gs.overflow, glassBorder: parseFloat(gs.borderTopWidth), width: innerWidth, page: document.documentElement.scrollWidth };
})()`;

test('0438 AC1: the frame has 12 px corners, as the ticket cards, and the screen\'s follow them: the frame\'s less the gap, at least 4 px', skip, () => withPanel(async b => {
  for (const w of WIDTHS) {
    await b.at(w);
    const m = await b.js(measure), at = `${w} px: ${JSON.stringify(m)}`;
    const card = await b.js(`parseFloat(getComputedStyle(document.querySelector('#queue .q')).borderTopLeftRadius)`);
    assert.equal(m.frameRadius, 12, `the frame: ${at}`);
    assert.equal(card, 12, 'as the ticket cards');
    const gap = m.glass.left - m.frame.left;
    for (const r of m.glassRadii) assert.ok(Math.abs(r - Math.max(4, m.frameRadius - gap)) < 0.01, `the screen's corners (${r}) are the frame's less the gap (${gap}), at least 4: ${at}`);
    assert.equal(m.afterRadius, m.glassRadii[0], 'the screen\'s shade is rounded with it');
    assert.equal(m.clips, 'hidden', 'what the screen draws is cut to its rounded corners');
  }
}));

test('0438 AC2: at every width, the frame\'s edges line up with the tab row\'s and the cards\', and the screen is at most 520 px, centred', skip, () => withPanel(async b => {
  for (const w of WIDTHS) {
    await b.at(w);
    const m = await b.js(measure), at = `${w} px: ${JSON.stringify(m)}`;
    assert.ok(m.page <= m.width, `no sideways scrolling: ${at}`);
    assert.ok(Math.abs(m.frame.left - m.tabs.left) <= 1 && Math.abs(m.frame.right - m.tabs.right) <= 1, `the frame lines up with the tab row: ${at}`);
    for (const c of m.cards) assert.ok(Math.abs(m.frame.left - c.left) <= 1 && Math.abs(m.frame.right - c.right) <= 1, `the frame lines up with the cards: ${at}`);
    assert.ok(m.glass.width <= 520, `the screen is at most 520 px: ${at}`);
    assert.ok(Math.abs((m.glass.left - m.frame.left) - (m.frame.right - m.glass.right)) <= 1, `the screen is centred in the frame: ${at}`);
  }
  await b.at(1600);
  assert.equal((await b.js(measure)).glass.width, 520, 'a wide window shows the screen at its widest');
}));

// Every dot the screen lights in any of these: the top row's word, speck, and a caption under it.
async function allLit() {
  const lit = new Map();
  for (const [word, r] of [['Building 2', 0], ['Building 2', 0.6], ['Idle', 0.3], ['Needs you 12', 0], ['Waiting: the base branch is failing its tests', 0]]) {
    const p = speckPage([board(word.startsWith('Building') ? building() : [], { word })], { random: r });
    await p.settle();
    for (const t of [0, 2 * MIN + 1000, 3 * MIN]) { if (t) p.go(t); for (const [c, row] of p.draw()) lit.set(`${c},${row}`, [c, row]); }
  }
  return [...lit.values()];
}
test('0438 AC3: the screen\'s top row, speck and its caption are never cut off by the rounded corners, at 320 px and at the widest', skip, async () => {
  const dots = await allLit();
  const rows = Math.max(...dots.map(([, r]) => r));
  assert.ok(dots.some(([, r]) => r <= 3) && rows > 60, 'the word, speck and a caption are all lit');
  await withPanel(async b => {
    for (const w of [320, 1600]) {
      await b.at(w);
      const m = await b.js(measure);
      const ri = m.glassRadii[0] - m.glassBorder, dx = m.canvas.width / 160, dy = m.canvas.height / 72; // the corners inside the screen's edge
      const cut = (x, y) => x < ri && y < ri && Math.hypot(ri - x, ri - y) > ri;
      for (const [c, r] of dots) {
        const xs = [c * dx, (c + 1) * dx], ys = [r * dy, (r + 1) * dy];
        for (const x of xs) for (const y of ys) {
          const fx = Math.min(x, m.canvas.width - x), fy = Math.min(y, m.canvas.height - y); // from the nearest corner
          assert.ok(!cut(fx, fy), `${w} px: the dot at ${c},${r} isn't cut off by a ${ri} px corner`);
        }
      }
    }
  });
});

test('0438 AC4: while speck needs you, the frame\'s crimson edge goes all the way round, following its rounded corners', skip, () => withPanel(async b => {
  for (const w of [320, 1600]) {
    await b.at(w);
    const s = await b.js(`(() => { const f = document.querySelector('.bezel'), s = getComputedStyle(f), bad = getComputedStyle(document.documentElement).getPropertyValue('--bad').trim();
      const probe = document.createElement('i'); probe.style.color = bad; document.body.appendChild(probe); const want = getComputedStyle(probe).color; probe.remove();
      return { cls: f.className, want, sides: ['Top', 'Right', 'Bottom', 'Left'].map(d => [s['border' + d + 'Color'], s['border' + d + 'Width'], s['border' + d + 'Style']]),
        radii: ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'].map(c => s['border' + c + 'Radius']), clipped: getComputedStyle(document.querySelector('header')).overflow }; })()`);
    assert.equal(s.cls, 'bezel needs');
    for (const [colour, width, style] of s.sides) assert.deepEqual([colour, width, style], [s.want, '2px', 'solid'], `${w} px: each side in the needs-you colour: ${JSON.stringify(s)}`);
    assert.deepEqual(s.radii, ['12px', '12px', '12px', '12px'], 'round each corner');
    assert.equal(s.clipped, 'visible', 'nothing round the frame cuts its edge');
  }
}));

test('0438 AC5: a round vermilion dot sits just before the speck title, centred on its height, and a screen reader doesn\'t announce it', skip, () => withPanel(async b => {
  for (const look of ['light', 'dark']) {
    await b.js(`setLook('${look}'), true`);
    const d = await b.js(`(() => { const n = document.querySelector('.bezel .name'), s = getComputedStyle(n), dot = getComputedStyle(n, '::before');
      const probe = document.createElement('i'); probe.style.color = 'var(--lcd-red)'; document.querySelector('.bezel').appendChild(probe); const red = getComputedStyle(probe).color; probe.remove();
      return { content: dot.content, display: dot.display, width: dot.width, height: dot.height, radius: dot.borderTopLeftRadius, bg: dot.backgroundColor, red,
        nameDisplay: s.display, align: s.alignItems, order: dot.order, text: n.textContent, label: n.getAttribute('aria-label') }; })()`);
    const at = `${look}: ${JSON.stringify(d)}`;
    assert.equal(d.bg, d.red, `in speck's vermilion, its eye's colour on the screen: ${at}`);
    assert.equal(d.width, d.height, `round: ${at}`);
    assert.ok(parseFloat(d.width) >= 6 && parseFloat(d.width) <= 12, `a dot: ${at}`);
    assert.equal(d.radius, '50%', `round: ${at}`);
    assert.match(d.nameDisplay, /flex/, `laid out beside the title: ${at}`);
    assert.equal(d.align, 'center', `centred on the title's height: ${at}`);
    assert.equal(d.content, '""', `no text for a screen reader to announce: ${at}`);
    assert.equal(d.text, 'speck', 'the title itself is unchanged');
  }
  // Before the title, centred on its height, as laid out.
  const box = await b.js(`(() => { const n = document.querySelector('.bezel .name'), r = document.createRange(); r.selectNodeContents(n); const t = r.getBoundingClientRect(), b = n.getBoundingClientRect();
    return { textLeft: t.left, boxLeft: b.left, textTop: t.top, textBottom: t.bottom, boxTop: b.top, boxBottom: b.bottom }; })()`);
  assert.ok(box.textLeft - box.boxLeft >= 6, `the dot takes room before the title: ${JSON.stringify(box)}`);
}));
