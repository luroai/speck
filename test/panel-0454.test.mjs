import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, findChrome, browserPage } from './support/panel.mjs';
import { sharedPanel } from './support/shared-panel.mjs';

// ---------- 0454: the Settings button sits in the frame's title row, clear of speck's screen ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const WIDTHS = [320, 375, 500, 719, 720, 721, 1000, 1600];
const STATE = { tickets: [T('5000', 'ready')], ideas: [], run: { on: false } };

// The panel in a real browser, with a touch screen when `touch`, else a mouse. b.at(width) sets the window's width.
async function withPanel(touch, fn) {
  const panel = await sharedPanel();
  const b = await browserPage('about:blank');
  try {
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
      const STATE = ${JSON.stringify(STATE)}, real = window.fetch.bind(window);
      const json = v => new Response(JSON.stringify(v), { status: 200, headers: { 'content-type': 'application/json' } });
      window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(STATE) : /\\/log$/.test(String(url)) ? json({ text: '' }) : real(url, opts);
    })();` });
    if (touch) await b.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    b.at = async width => {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 800, deviceScaleFactor: 1, mobile: false });
      await b.until(`innerWidth === ${width}`, `the window at ${width} px`);
    };
    await b.at(WIDTHS[0]);
    b.open = async () => {
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
      await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && document.querySelectorAll('#queue .q').length === 1`, 'the panel');
      await b.js('document.fonts.ready.then(() => true)');
    };
    await b.open();
    assert.equal(await b.js(`matchMedia('(pointer: coarse)').matches`), touch, touch ? 'a touch screen' : 'a mouse');
    // A real press at (x, y): a tap on a touch screen, a click with a mouse.
    b.press = async (x, y) => {
      if (touch) {
        await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else {
        for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await b.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mousePressed' ? 1 : 0, clickCount: 1 });
      }
    };
    await fn(b);
  } finally { await b.close(); }
}
const measure = `(() => {
  const r = el => { const b = el.getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, width: b.width, height: b.height }; };
  return { button: r(document.getElementById('settings-open')), screen: r(document.getElementById('run')), row: r(document.querySelector('.bezel .print')) };
})()`;
const overlap = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

for (const touch of [true, false]) {
  const how = touch ? 'a touch screen' : 'a mouse';

  test(`0454 AC1: with ${how}, at every width, the Settings button is at least 4 px above speck's screen and doesn't overlap it`, skip, () => withPanel(touch, async b => {
    for (const w of WIDTHS) {
      await b.at(w);
      const m = await b.js(measure), at = `${w} px: ${JSON.stringify(m)}`;
      assert.ok(m.screen.top - m.button.bottom >= 4, `a gap of ${m.screen.top - m.button.bottom} px: ${at}`);
      assert.ok(!overlap(m.button, m.screen), `no overlap: ${at}`);
    }
  }));

  test(`0454 AC2: with ${how}, the Settings button is ${touch ? 'at least 44 × 44 px' : 'still 30 × 30 px'}, inside a title row tall enough to hold it`, skip, () => withPanel(touch, async b => {
    for (const w of WIDTHS) {
      await b.at(w);
      const m = await b.js(measure), at = `${w} px: ${JSON.stringify(m)}`;
      if (touch) assert.ok(m.button.width >= 44 && m.button.height >= 44, `44 × 44 px: ${at}`);
      else assert.deepEqual([m.button.width, m.button.height], [30, 30], `its current size: ${at}`);
      assert.ok(m.button.top >= m.row.top && m.button.bottom <= m.row.bottom, `inside the title row: ${at}`);
    }
  }));

  test(`0454 AC3: with ${how}, pressing anywhere on speck's screen opens the pipeline log, and pressing the button opens Settings`, skip, () => withPanel(touch, async b => {
    for (const w of [375, 1000]) {
      await b.at(w);
      const m = await b.js(measure), s = m.screen, at = `${w} px: ${JSON.stringify(m)}`;
      // The whole screen, up to its edges and into its rounded corners, answers as the screen; the whole button as the button.
      // under: the point on the screen nearest the button's middle, which is beside the screen when the screen is at its 520 px most
      const under = Math.min(Math.max(m.button.left + m.button.width / 2, s.left + 4), s.right - 4);
      const xs = [s.left + 4, (s.left + s.right) / 2, under, s.right - 4];
      const ys = [s.top + 1, (s.top + s.bottom) / 2, s.bottom - 4];
      const hits = await b.js(`${JSON.stringify(xs.flatMap(x => ys.map(y => [x, y])))}.map(([x, y]) => !!document.elementFromPoint(x, y)?.closest('#run'))`);
      assert.ok(hits.every(Boolean), `every point on the screen is the screen: ${JSON.stringify(hits)}, ${at}`);
      const bx = [m.button.left + 4, m.button.left + m.button.width / 2, m.button.right - 4], by = [m.button.top + 4, m.button.top + m.button.height / 2, m.button.bottom - 4];
      const own = await b.js(`${JSON.stringify(bx.flatMap(x => by.map(y => [x, y])))}.map(([x, y]) => !!document.elementFromPoint(x, y)?.closest('#settings-open'))`);
      assert.ok(own.every(Boolean), `every point on the button is the button: ${JSON.stringify(own)}, ${at}`);

      // A real press on the screen's top edge, as near the button as the screen goes, opens the pipeline log.
      await b.press(under, s.top + 1);
      await b.until(`!document.getElementById('foreman').hidden`, `the pipeline log at ${w} px`);
      assert.equal(await b.js(`document.getElementById('settings').hidden`), true, 'not Settings');
      await b.open();
      await b.press(m.button.left + m.button.width / 2, m.button.top + m.button.height / 2);
      await b.until(`!document.getElementById('settings').hidden`, `Settings at ${w} px`);
      assert.equal(await b.js(`document.getElementById('foreman').hidden`), true, 'not the pipeline log');
      await b.open();
    }
  }));
}
