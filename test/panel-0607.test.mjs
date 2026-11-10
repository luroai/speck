import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, findChrome, browserPage } from './support/panel.mjs';
import { sharedPanel } from './support/shared-panel.mjs';

// ---------- 0607: Settings and speck's face sit in the black bar with the same space on every side ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const two = { self: 4777, list: [{ port: 4777, name: 'speck' }, { port: 4778, name: 'alpha' }] };
const STATE = { tickets: [T('0001', 'building')], ideas: [], run: { on: true, pid: 1 }, projects: two,
  foreman: { word: 'Waiting: other tickets', tone: 'ok', mood: 'watching', building: [], ready: [{ id: '0002', why: 'x' }], held: [], ship: { running: null, waiting: [] }, blocked: [], took: [] } };
const BAR_BEFORE = 68; // the bar's height before this change: speck's 56 px, with 4 px of padding and a 2 px border above and below

test('0607 AC1, AC2 and AC3: at 320 and 1280 px, Settings and speck have as much room beside them as above and below, and the bar keeps its size and three lines', skip, async () => {
  const panel = await sharedPanel();
  const b = await browserPage('about:blank');
  try {
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
      const real = window.fetch.bind(window);
      window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? new Response(JSON.stringify(window.__state), { status: 200, headers: { 'content-type': 'application/json' } }) : real(url, opts);
      window.__state = ${JSON.stringify(STATE)};
    })();` });
    for (const width of [320, 1280]) {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 800, deviceScaleFactor: 1, mobile: width < 600 });
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/?w=${width}` });
      await b.until(`location.search === '?w=${width}' && document.readyState === 'complete' && document.querySelector('#bar-word').textContent === 'Waiting: other tickets' && !!document.querySelector('#bar-face svg')`, 'the bar');
      await b.js('document.fonts.ready.then(() => true)');
      const m = await b.js(`(() => {
        const r = s => { const b = document.querySelector(s).getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, width: b.width, height: b.height }; };
        return { bar: r('.bezel'), face: r('#bar-face'), settings: r('#settings-open'), word: r('#bar-word'), where: r('.bar-where'), more: r('.bar-more') };
      })()`), at = `${width} px: ${JSON.stringify(m)}`;
      const s = m.settings, f = m.face, bar = m.bar;
      const near = (a, c, what) => assert.ok(Math.abs(a - c) <= 1, `${what}: ${a.toFixed(2)} and ${c.toFixed(2)} at ${at}`);
      near(bar.right - s.right, s.top - bar.top, 'Settings: as much room to its right as above it');
      near(bar.right - s.right, bar.bottom - s.bottom, 'Settings: as much room to its right as below it');
      near(f.left - bar.left, f.top - bar.top, 'speck: as much room to its left as above it');
      near(f.left - bar.left, bar.bottom - f.bottom, 'speck: as much room to its left as below it');
      assert.ok(s.width >= 44 && s.height >= 44, `Settings at least 44 px square at ${at}`);
      assert.ok(f.width === 56 && f.height === 56, `speck at 56 px at ${at}`);
      assert.ok(bar.height <= BAR_BEFORE + 0.5, `the bar no taller than before at ${at}`);
      assert.ok(m.word.height <= 20.5 && m.where.height <= 19 && m.more.height <= 16.5, `each of the three lines one line tall (20, 18 and 16 px) at ${at}`);
      assert.ok(m.word.bottom <= m.where.top + 0.5 && m.where.bottom <= m.more.top + 0.5, `three lines, one under the other at ${at}`);
      assert.ok(m.word.right <= s.left + 0.5 && m.where.right <= s.left + 0.5 && m.more.right <= s.left + 0.5, `the lines stop before Settings at ${at}`);
    }
  } finally { await b.close(); }
});
