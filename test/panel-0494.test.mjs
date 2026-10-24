import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, round, panelRepo, freePort, startPanel, stop, findChrome, browserPage, openLane } from './support/panel.mjs';

// ---------- 0494: a closed shipped ticket's title starts where a Build or Plan ticket's does, touch screen or mouse ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const BEFORE = 76; // a closed shipped card's height before 0494, with its 44 px title line

const stub = state => `(() => {
  const STATE = ${JSON.stringify(state)};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(STATE) : opts.method === 'POST' ? json({}) : real(url, opts);
})();`;
const board = () => {
  const now = Date.now(), at = s => new Date(now - s * 1000).toISOString();
  return { run: { on: false }, ideas: [], tickets: [
    T('0401', 'done', { title: 'Shipped one', started: at(1500), finished: at(600), rounds: [round(1, 500)] }),
    T('0402', 'done', { title: 'A shipped bug fix', type: 'bug', started: at(1500), finished: at(700), rounds: [round(1, 500)] }),
    T('0501', 'draft', { title: 'Plan one' }),
    T('0601', 'building', { title: 'Build one', started: at(60) }),
  ] };
};
const CARD = { plan: '.item.ticket', build: '.q', shipped: '#shipped tr' };
// The top of a lane's first closed card's title text, from the top of its card, and the card's height.
const measure = lane => `(async () => {
  await document.fonts.ready;
  const c = document.querySelector(${JSON.stringify(CARD[lane])}), t = c.querySelector('.line .title'), r = document.createRange();
  r.selectNodeContents(t);
  const text = Math.min(...[...r.getClientRects()].filter(x => x.width > 0).map(x => x.top));
  return { open: c.classList.contains('open'), text: text - c.getBoundingClientRect().top, height: c.getBoundingClientRect().height };
})()`;
// The rows of the page, a pixel apart, down through the shipped title, where a tap reaches it, as one run from top to bottom.
const TAP = `(() => {
  const c = document.querySelector('#shipped tr'), t = c.querySelector('.line .title'), b = t.getBoundingClientRect(), x = b.left + 8;
  const ys = [];
  for (let y = Math.floor(b.top) - 30; y <= b.bottom + 30; y++) if (document.elementFromPoint(x, y) === t) ys.push(y);
  const r = document.createRange();
  r.selectNodeContents(t);
  const text = Math.min(...[...r.getClientRects()].filter(q => q.width > 0).map(q => q.top));
  return { x, ys, text, card: c.getBoundingClientRect().top, cardBottom: c.getBoundingClientRect().bottom };
})()`;

async function inPanel(fn) {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub(board()) });
    const go = async (width, touch) => {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: touch });
      await b.send('Emulation.setTouchEmulationEnabled', touch ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
      await b.until(`location.port === '${panel.port}' && document.querySelectorAll('#shipped tr').length === 2`, 'the panel');
      assert.equal(await b.js(`matchMedia('(pointer: coarse)').matches`), touch, touch ? 'a touch screen' : 'a mouse');
    };
    await fn(b, go);
  } finally { await b.close(); await stop(panel); }
}

test('0494 AC1 and AC3: a closed shipped ticket\'s title text starts as far down its card as a Build or Plan ticket\'s, on a touch screen at 390 px and with a mouse at 390 and 1280 px, and the card is no taller', skip, () => inPanel(async (b, go) => {
  for (const [width, touch] of [[390, true], [390, false], [1280, false]]) {
    const how = `${width} px, ${touch ? 'touch' : 'mouse'}`;
    await go(width, touch);
    const at = {};
    for (const lane of ['plan', 'build', 'shipped']) {
      await b.js(openLane(lane));
      at[lane] = await b.js(measure(lane));
      assert.equal(at[lane].open, false, `${how}: the ${lane} card is closed`);
    }
    for (const lane of ['plan', 'build']) assert.ok(Math.abs(at.shipped.text - at[lane].text) <= 2, `${how}: the shipped title's text starts ${at.shipped.text} px down its card, a ${lane} title's ${at[lane].text} px`);
    assert.ok(at.shipped.height <= BEFORE, `${how}: the shipped card is ${at.shipped.height} px tall, no taller than ${BEFORE} px`);
  }
}));

test('0494 AC2: on a touch screen, the closed shipped title is a tap area at least 44 px tall that opens it, with no space added above its text', skip, () => inPanel(async (b, go) => {
  await go(390, true);
  await b.js(openLane('shipped'));
  const { x, ys, text, card } = await b.js(TAP);
  assert.ok(ys.length >= 44, `a tap reaches the title in ${ys.length} rows`);
  assert.equal(ys[ys.length - 1] - ys[0] + 1, ys.length, 'in one run, with no gaps');
  assert.ok(text - card <= 9, `its text starts ${text - card} px down the card, right under the card's padding`);
  // a tap at the bottom of the tap area, below the title's text, opens the card, as tapping the title does today
  const y = ys[ys.length - 2];
  for (const type of ['touchStart', 'touchEnd']) await b.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await b.until(`document.querySelector('#shipped tr').classList.contains('open')`, 'the tap to open the shipped card');
}));
