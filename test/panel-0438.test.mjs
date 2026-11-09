import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, findChrome, browserPage } from './support/panel.mjs';
import { sharedPanel } from './support/shared-panel.mjs';
import { foreman } from './support/bar.mjs';

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
  const frame = document.querySelector('.bezel'), strip = document.getElementById('tabs'), ss = getComputedStyle(strip);
  const fs = getComputedStyle(frame);
  return { frame: r(frame), tabs: { left: r(strip).left + parseFloat(ss.paddingLeft), right: r(strip).right - parseFloat(ss.paddingRight) }, // 0477: the lanes' strip's row
    cards: [...document.querySelectorAll('#queue .q')].map(r), frameRadius: parseFloat(fs.borderTopLeftRadius),
    lane: (() => { const s = document.getElementById('build-section'), b = r(s), st = getComputedStyle(s); return { left: b.left + parseFloat(st.paddingLeft), right: b.right - parseFloat(st.paddingRight) }; })(), // 0478: Build's frame
    width: innerWidth, page: document.documentElement.scrollWidth };
})()`;

test('0438 AC1: the frame has 12 px corners; 0585: Build\'s rows are square, flush in the lane\'s frame', skip, () => withPanel(async b => {
  for (const w of WIDTHS) {
    await b.at(w);
    const m = await b.js(measure), at = `${w} px: ${JSON.stringify(m)}`;
    const card = await b.js(`parseFloat(getComputedStyle(document.querySelector('#queue .q')).borderTopLeftRadius)`);
    assert.equal(m.frameRadius, 12, `the frame: ${at}`);
    assert.equal(card, 0, 'its rows are flush');
  }
}));

test('0438 AC2: at every width, the frame\'s edges line up with the tab row\'s and the cards\'', skip, () => withPanel(async b => {
  for (const w of WIDTHS) {
    await b.at(w);
    const m = await b.js(measure), at = `${w} px: ${JSON.stringify(m)}`;
    assert.ok(m.page <= m.width, `no sideways scrolling: ${at}`);
    assert.ok(Math.abs(m.frame.left - m.tabs.left) <= 1 && Math.abs(m.frame.right - m.tabs.right) <= 1, `the frame lines up with the tab row: ${at}`);
    // 0478: the cards sit inside their lane's frame, which lines up with speck's
    assert.ok(Math.abs(m.frame.left - m.lane.left) <= 1 && Math.abs(m.frame.right - m.lane.right) <= 1, `the frame lines up with the lane's frame: ${at}`);
    for (const c of m.cards) assert.ok(c.left > m.lane.left && c.right < m.lane.right, `the cards are inside the lane's frame: ${at}`);
  }
}));

test('0438 AC4: while speck needs you, the bar\'s edge goes all the way round, following its rounded corners', skip, () => withPanel(async b => {
  for (const w of [320, 1600]) {
    await b.at(w);
    const s = await b.js(`(() => { const f = document.querySelector('.bezel'), s = getComputedStyle(f), bad = getComputedStyle(document.documentElement).getPropertyValue('--bar-needs').trim();
      const probe = document.createElement('i'); probe.style.color = bad; document.body.appendChild(probe); const want = getComputedStyle(probe).color; probe.remove();
      return { cls: f.className, want, sides: ['Top', 'Right', 'Bottom', 'Left'].map(d => [s['border' + d + 'Color'], s['border' + d + 'Width'], s['border' + d + 'Style']]),
        radii: ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'].map(c => s['border' + c + 'Radius']), clipped: getComputedStyle(document.querySelector('header')).overflow }; })()`);
    assert.equal(s.cls, 'bezel needs');
    for (const [colour, width, style] of s.sides) assert.deepEqual([colour, width, style], [s.want, '2px', 'solid'], `${w} px: each side in the needs-you colour: ${JSON.stringify(s)}`);
    assert.deepEqual(s.radii, ['12px', '12px', '12px', '12px'], 'round each corner');
    assert.equal(s.clipped, 'visible', 'nothing round the frame cuts its edge');
  }
}));

