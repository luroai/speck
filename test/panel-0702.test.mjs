import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, round, panelRepo, freePort, startPanel, stop, browserPage, findChrome, openLane } from './support/panel.mjs';

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

test('0702 AC1, AC2: every figure label shows whole from 375 to 800 px, and four figures sit in a row from 800 px', skip, async () => {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  const stamp = new Date().toISOString();
  const state = { run: { on: false }, ideas: [], tickets: Array.from({ length: 40 }, (_, i) => T(String(900 + i).padStart(4, '0'), 'done', { started: stamp, finished: stamp, rounds: [round(1, 500)], builder_tokens: 2000, builder_cost_usd: 1.5, total_cost_usd: 2.5 })) };
  const stub = `(() => { const real = window.fetch.bind(window); window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? new Response(${JSON.stringify(JSON.stringify(state))}, { status: 200, headers: { 'content-type': 'application/json' } }) : real(url, opts); })();`;
  const look = () => b.js(`(() => { const tiles = [...document.querySelectorAll('#shipped-stats .stat')]; const tops = tiles.map(n => Math.round(n.getBoundingClientRect().top));
    return { n: tiles.length, rows: new Set(tops).size, cut: tiles.map(n => n.querySelector('.label')).filter(l => l.scrollWidth > l.clientWidth).map(l => l.textContent) }; })()`);
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 800, height: 600, deviceScaleFactor: 1, mobile: false });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.querySelectorAll('#shipped tr').length >= 10`, 'the rows');
    await b.js(openLane('shipped'));
    await b.js(`(document.getElementById('more-stats').click(), true)`);
    for (const width of [375, 400, 480, 600, 720, 799, 800, 1000]) {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 600, deviceScaleFactor: 1, mobile: false });
      await b.js(`new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(1))))`);
      const g = await look();
      assert.equal(g.n, 8, `${width} px`);
      assert.deepEqual(g.cut, [], `${width} px: no label is cut`);
      assert.equal(g.n / g.rows, width >= 800 ? 4 : 2, `${width} px: columns`);
    }
  } finally { await b.close(); await stop(panel); }
});
