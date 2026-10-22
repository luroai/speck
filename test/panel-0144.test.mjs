import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { switchPage, deferred, panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0144: call the speck run switch Auto-build ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const state = run => ({ tickets: [], ideas: [], resume_command: '', ...(run ? { run } : {}) });
// 0150: the indicator is itself the button, so there's no separate Pause or Start, and "ready tickets wait" moved into its tooltip.
// 0285: the switch is in the Settings view's Foreman group now, and the header button shows the Foreman. 0364: with no builder.
const pillOf = p => p.runSwitch();
const dotOf = p => p.all(p.byId('run')).find(n => /\bmini\b/.test(n.className || '') || n.tagName === 'canvas'); // 0163: the builder in place of the square
const switchOf = pillOf;

test('0144 AC1: while speck run is on, the indicator reads "Auto-build on" with a green square (0150: and is the button)', async () => {
  const p = switchPage([state({ on: true, pid: 7 })]);
  await p.settle();
  assert.equal(pillOf(p).textContent, 'Auto-build on');
  assert.equal(dotOf(p), undefined); // 0364: no builder, and no square (0163)
  assert.equal(switchOf(p).title, 'Pause Auto-build: ready tickets wait');
});

test('0144 AC2: while speck run is off, the indicator reads "Auto-build off" with a red square (0150: "ready tickets wait" is in the tooltip)', async () => {
  const p = switchPage([state(null)]);
  await p.settle();
  const pill = pillOf(p);
  assert.equal(pill.textContent, 'Auto-build off');
  assert.equal(dotOf(p), undefined); // 0364: no builder, and no square (0163)
  assert.ok(!p.all(pill).some(n => /\brun-wait\b/.test(n.className || '')), 'no small print beside it');
});

test('0144 AC3: the indicator\'s tooltip says what a click does, on or off (0150)', async () => {
  for (const [run, title] of [[null, 'Start Auto-build: build ready tickets'], [{ on: true, pid: 7 }, 'Pause Auto-build: ready tickets wait']]) {
    const p = switchPage([state(run)]);
    await p.settle();
    assert.equal(pillOf(p).title, title);
  }
});

test('0144 AC3: while the request is being answered, the button reads "Starting…" or "Pausing…" and can\'t be clicked again', async () => {
  for (const [run, label, url] of [[null, 'Starting…', '/api/run/on'], [{ on: true, pid: 7 }, 'Pausing…', '/api/run/off']]) {
    const answer = deferred();
    const p = switchPage([state(run), answer]);
    await p.settle();
    p.press(switchOf(p));
    await p.settle();
    assert.equal(switchOf(p).textContent, label);
    assert.equal(switchOf(p).disabled, true);
    p.press(switchOf(p));
    await p.settle();
    assert.equal(p.calls.filter(c => c.url === url).length, 1, 'a second click sends nothing');
  }
});

test('0144 AC4: clicking it posts to turn speck run on, then off, as Start and Pause did (0150: the connection indicator has gone)', async () => {
  const p = switchPage([state(null), { ok: true, run: { on: true, pid: 9 } }, { ok: true, run: { on: false, pid: null } }]);
  await p.settle();
  p.press(switchOf(p));
  await p.settle();
  assert.equal(p.calls.at(-1).url, '/api/run/on');
  assert.equal(p.calls.at(-1).opts.method, 'POST');
  assert.equal(pillOf(p).textContent, 'Auto-build on');
  p.press(switchOf(p));
  await p.settle();
  assert.equal(p.calls.at(-1).url, '/api/run/off');
  assert.equal(pillOf(p).textContent, 'Auto-build off');
  assert.equal(p.byId('pills').children.length, 0);
});

// ---------- in a browser: the colours, and the phone layout ----------

const stub = run => `(() => {
  const STATE = ${JSON.stringify(state(run))};
  const real = window.fetch.bind(window);
  window.fetch = async (url, opts = {}) => String(url) === '/api/state'
    ? new Response(JSON.stringify(STATE), { status: 200, headers: { 'content-type': 'application/json' } }) : real(url, opts);
})();`;

async function withPage(run, fn, width = 1280) {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height: 800, deviceScaleFactor: 1, mobile: width < 700 });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub(run) });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && !document.getElementById('run').hidden && !!document.querySelector('#run .label')`, 'the panel');
    await fn(b);
  } finally { await b.close(); await stop(panel); }
}
const LINES = sel => `(() => {
  const n = document.querySelector(${JSON.stringify(sel)}), range = document.createRange();
  range.selectNodeContents(n);
  const rects = [...range.getClientRects()].filter(r => r.width && r.height).sort((a, b) => a.top - b.top);
  let lines = 0, bottom = -Infinity;
  for (const r of rects) if (r.top >= bottom - 1) { lines++; bottom = r.bottom; } else bottom = Math.max(bottom, r.bottom);
  return lines;
})()`;

// 0163: the builder took the square's place, so neither is green or red: the label says whether it's on. 0364: and the
// builder has gone too, so the button shows its word alone.
test('0144 AC1: on, the button shows its word, with no green square or builder', skip, async () => {
  await withPage({ on: true, pid: 7 }, async b => {
    assert.equal(await b.js(`!document.querySelector('#run .live') && !document.querySelector('#run canvas') && document.querySelector('#run .label').getBoundingClientRect().width > 0`), true);
  });
});

test('0144 AC2: off, the button shows its word, with no red square or builder', skip, async () => {
  await withPage(null, async b => {
    assert.equal(await b.js(`!document.querySelector('#run .live') && !document.querySelector('#run canvas') && document.querySelector('#run .label').getBoundingClientRect().width > 0`), true);
  });
});

for (const run of [null, { on: true, pid: 7 }]) {
  test(`0144 AC2: at 375 px, the ${run ? 'on' : 'off'} indicator, which is its button (0150), is on one line`, skip, async () => {
    await withPage(run, async b => {
      for (const sel of ['#run']) {
        assert.equal(await b.js(LINES(sel)), 1, `${sel} is on one line`);
        const r = await b.js(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return r.right <= document.documentElement.clientWidth + 0.5; })()`);
        assert.ok(r, `${sel} is on screen`);
      }
    }, 375);
  });
}
