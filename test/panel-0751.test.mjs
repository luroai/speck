import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, panelRepo, freePort, startPanel, stop, findChrome, browserPage, openLane } from './support/panel.mjs';

// ---------- 0751: a tap on a closed Plan row's title opens the row, not a tag below it ----------
// A real browser: only it moves a finger's tap to a nearby tap target.

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const facts = { size: 'S', risk: 'low', priority: 3, lint: { errors: 0, warnings: 0 } };
const STATE = { run: { on: false }, ideas: [], tickets: [
  T('0501', 'draft', { title: 'Plan one, with a title long enough to reach over every tag below it', ...facts }),
  T('0502', 'draft', { title: 'Plan two, a bug, with a title just as long as the one above it', type: 'bug', ...facts }),
  T('0503', 'draft', { title: 'Plan three, with a title long enough to reach over every tag', ...facts }),
] };
const stub = `(() => {
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(${JSON.stringify(STATE)}) : opts.method === 'POST' ? json({}) : real(url, opts);
})();`;

async function inPanel(fn) {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    await b.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 800, deviceScaleFactor: 1, mobile: true });
    await b.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.querySelectorAll('.item.row').length === 3`, 'the panel');
    await b.js(openLane('plan'));
    await b.js(`document.fonts.ready.then(() => true)`);
    await fn(b);
  } finally { await b.close(); await stop(panel); }
}
const tap = async (b, x, y, radius = 11) => {
  await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, radiusX: radius, radiusY: radius }] });
  await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};
const box = (b, selector) => b.js(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; })()`);

test('0751 AC1: at 375 px with touch, a tap anywhere on a closed Plan row\'s title reaches the title, not a tag, and opens the row', skip, () => inPanel(async (b) => {
  // Each tap's target is noted and the click stopped there, so no tap changes the page for the next.
  await b.js(`window.__hits = []; window.__note = e => { const row = e.target.closest('.item.row'); __hits.push([[...document.querySelectorAll('.item.row')].indexOf(row), e.target.className]); e.stopPropagation(); e.preventDefault(); }; addEventListener('click', __note, true); true`);
  const titles = await b.js(`[...document.querySelectorAll('.item.row .line .title')].map(e => { const r = e.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; })`);
  const misses = [];
  for (const [row, t] of titles.entries()) {
    for (const y of [t.top + 1, t.top + 10, t.top + 14, t.bottom - 2, t.bottom - 0.5]) for (const x of [t.left + 1, t.left + 4, t.left + 20, t.left + 80, t.right - 4]) for (const radius of [1, 11]) {
      await b.js(`__hits.length = 0`);
      await tap(b, x, y, radius);
      await b.until(`__hits.length > 0`, 'the tap');
      const [[hitRow, hit]] = await b.js(`__hits`);
      if (hitRow !== row || hit !== 'title') misses.push(`row ${row}, ${x - t.left} px in, ${y - t.top} px down, radius ${radius}: ${hit} of row ${hitRow}`);
    }
  }
  assert.deepEqual(misses, []);
  await b.js(`removeEventListener('click', __note, true); true`);
  const t = titles[0];
  await tap(b, t.left + 4, t.bottom - 2);
  await b.until(`document.querySelector('.item.row').classList.contains('open')`, 'the row to open');
  assert.equal(await b.js(`!!document.querySelector('.prio-menu')`), false, 'no menu');
  assert.equal(await b.js(`[...document.querySelectorAll('[role="tooltip"], .tip')].filter(e => e.getClientRects().length && !e.hidden).length`), 0, 'no note');
}));

test('0751 AC2: the priority tag keeps its 44 px target and still opens its menu, and the row keeps its height', skip, () => inPanel(async (b) => {
  const prio = await box(b, '.item.row .checks .prio');
  assert.ok(prio.width >= 44 && prio.height >= 44, `the priority's target is ${prio.width} × ${prio.height} px`);
  assert.equal((await box(b, '.item.row .head')).height, 51, 'a closed row is no taller');
  await tap(b, prio.left + prio.width / 2, prio.top + prio.height / 2);
  await b.until(`!!document.querySelector('.prio-menu')`, 'the menu');
  assert.equal(await b.js(`document.querySelector('.item.row').classList.contains('open')`), false, 'the row stays closed');
}));

// Size, risk and type have no menu: their target is their label's ::after area (0519), 28 px high and 2 px past each side.
test('0751 AC2: size, risk and type keep their whole tap areas, and a tap at each edge of one reaches it, on every row', skip, () => inPanel(async (b) => {
  const tags = await b.js(`[...document.querySelectorAll('.item.row')].flatMap((row, i) => [...row.querySelectorAll('.checks .tag:not(.pick)')].map(e => {
    const r = e.getBoundingClientRect(), a = getComputedStyle(e, '::after');
    return { row: i, text: e.textContent, left: r.left + parseFloat(a.left), right: r.right - parseFloat(a.right), top: r.top + parseFloat(a.top), width: parseFloat(a.width), height: parseFloat(a.height), own: r.width };
  }))`);
  assert.deepEqual(tags.map(t => `${t.row} ${t.text}`), ['0 S', '0 low', '1 S', '1 low', '1 bug', '2 S', '2 low']);
  await b.js(`window.__hits = []; addEventListener('click', e => { const row = e.target.closest('.item.row'); __hits.push([[...document.querySelectorAll('.item.row')].indexOf(row), e.target.textContent]); e.stopPropagation(); e.preventDefault(); }, true); true`);
  for (const t of tags) {
    const how = `row ${t.row}'s ${t.text}`;
    assert.ok(t.height >= 27.9, `${how}: its area is ${t.height} px high`);
    assert.ok(t.width >= t.own + 3.9, `${how}: its area is ${t.width} px wide`);
    const x = (t.left + t.right) / 2, y = t.top + t.height / 2;
    for (const [px, py] of [[x, y], [t.left + 1, y], [t.right - 1, y], [x, t.top + 1], [x, t.top + t.height - 1]]) {
      assert.equal(await b.js(`document.elementFromPoint(${px}, ${py}).textContent`), t.text, `${how}: its area covers ${px}, ${py}`);
    }
    await b.js(`__hits.length = 0`);
    await tap(b, x, y, 1);
    await b.until(`__hits.length > 0`, 'the tap');
    assert.deepEqual(await b.js(`__hits[0]`), [t.row, t.text], `${how}: a tap on it`);
  }
}));
