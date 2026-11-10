import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cssRules, cssValue, findChrome, browserPage, T, full, idea, REST_LANES } from './support/panel.mjs';
import { sharedPanel } from './support/shared-panel.mjs';

// ---------- 0614: an open Plan or Capture row has room inside its fill ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

test('0614 AC1 AC2: an open row\'s fill reaches 12 px past each side, with a linked id\'s ring round it, and opening it changes no side padding or margin', () => {
  const open = cssRules('.item.row.open');
  assert.equal(cssValue(open, 'box-shadow'), '-12px 0 0 var(--raise), 12px 0 0 var(--raise)');
  for (const prop of ['padding', 'padding-left', 'padding-right', 'margin', 'margin-left', 'margin-right']) assert.equal(cssValue(open, prop), undefined, `no ${prop} of its own`);
  assert.equal(cssValue(cssRules('.item.row.open::after'), 'inset'), '0 -12px', 'the ring\'s box is the whole fill');
  assert.equal(cssValue(cssRules('.item.row.open::after'), 'pointer-events'), 'none', 'and takes no taps');
  // a linked id's ring, lit while hovered or gone to, goes round the fill rather than the row's box inside it
  assert.equal(cssValue(cssRules('.item.row.open.hl::after'), 'box-shadow'), 'inset 0 0 0 1px var(--text)');
  assert.equal(cssValue(cssRules('.item.row.open.flash'), 'animation'), 'none', 'the row\'s own ring would hide the fill\'s sides');
  assert.equal(cssValue(cssRules('.item.row.open.flash::after'), 'animation'), 'flash 1.5s ease-out');
  assert.equal(cssValue(cssRules('.item.row.open.flash::after'), 'box-shadow'), 'inset 0 0 0 2px var(--text)', 'asked for less motion, it stays lit');
});

// 0701 starts a chain that 0703 waits on, so open they show their chain mark and padlock; 0702 has no links.
const STATE = {
  run: { on: true },
  tickets: [full('0701', { status: 'draft', title: 'A draft ticket with a title long enough to wrap onto a second line on a phone', priority: 2 }), full('0702', { status: 'draft', title: 'A draft with no links' }),
    full('0703', { status: 'draft', title: 'A draft waiting on another', after: ['0701'], waiting_on: ['0701'] })],
  ideas: [idea('2026-11-10-a-note-with-a-long-title-that-wraps-on-a-phone', 'inbox')],
};
const stub = theme => `(() => {
  try { localStorage.setItem('speck-theme', ${JSON.stringify(theme)}); } catch {}
  const STATE = ${JSON.stringify(STATE)};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(STATE) : opts.method === 'POST' ? json({}) : real(url, opts);
})();`;

async function at320(theme, fn) {
  const panel = await sharedPanel();
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 700, deviceScaleFactor: 2, mobile: true });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub(theme) });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && !!document.querySelector('#shaping .item.row') && document.fonts.status === 'loaded'`, 'the panel');
    assert.equal(await b.js('document.documentElement.dataset.theme'), theme);
    await fn(b);
  } finally { await b.close(); }
}

// For Capture's first note, and for Plan's ticket with no links, its chain starter and its waiting ticket (0614: whose
// mark sits at the end of the line): its title's left edge closed, then open, the row's and its list's boxes, the fill
// (the row's box and the shadows either side, in the shadows' colour), the box of each piece of text and each mark in
// it, and the ring a linked id draws while it's lit.
const MEASURE = `(async () => {
  const frames = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const out = {};
  for (const [name, lane, id] of [['capture', 'capture', null], ['plan', 'plan', '0702'], ['chain starter', 'plan', '0701'], ['waiting', 'plan', '0703']]) {
    document.getElementById('tab-' + lane).click(); ${REST_LANES};
    await frames();
    const find = () => [...document.querySelectorAll(lane === 'capture' ? '#capture .item.row' : '#shaping .item.row')].find(n => !id || n.querySelector('.id')?.textContent === id);
    const closed = find().querySelector('.line .title').getBoundingClientRect().left;
    find().querySelector('.head').click();
    await frames();
    const row = find(), rb = row.getBoundingClientRect(), list = row.parentElement, cs = getComputedStyle(list);
    if (!row.classList.contains('open')) throw new Error(name + ' did not open');
    const shadows = [...getComputedStyle(row).boxShadow.matchAll(/(rgba?\\([^)]*\\))\\s+(-?[\\d.]+)px\\s+(-?[\\d.]+)px/g)].map(m => ({ colour: m[1], x: +m[2], y: +m[3] }));
    const left = Math.min(rb.left, ...shadows.map(s => rb.left + s.x)), right = Math.max(rb.right, ...shadows.map(s => rb.right + s.x));
    const texts = [];
    const walk = document.createTreeWalker(row, NodeFilter.SHOW_TEXT);
    for (let n; (n = walk.nextNode());) {
      if (!n.textContent.trim()) continue;
      // word by word, as a wrapped line's box takes in the space it wraps at, which hangs past the line unseen
      for (const w of n.textContent.matchAll(/\\S+/g)) {
        const r = document.createRange(); r.setStart(n, w.index); r.setEnd(n, w.index + w[0].length);
        for (const b of r.getClientRects()) if (b.width > 0) texts.push({ text: w[0], left: b.left, right: b.right });
      }
    }
    const marks = [...row.querySelectorAll('.line .chain, .line .lock')].map(n => ({ text: n.className, left: n.getBoundingClientRect().left, right: n.getBoundingClientRect().right }));
    texts.push(...marks);
    row.classList.add('hl');
    const ring = getComputedStyle(row, '::after'), ringBox = { left: rb.left + parseFloat(ring.left), right: rb.right - parseFloat(ring.right), shadow: ring.boxShadow, events: ring.pointerEvents };
    row.classList.remove('hl');
    out[name] = { marks: marks.map(x => x.text), closed, open: row.querySelector('.line .title').getBoundingClientRect().left, row: { left: rb.left, right: rb.right },
      list: { left: list.getBoundingClientRect().left + parseFloat(cs.paddingLeft), right: list.getBoundingClientRect().right - parseFloat(cs.paddingRight) },
      fill: { left, right, colours: shadows.map(s => s.colour), y: shadows.map(s => s.y), background: getComputedStyle(row).backgroundColor, under: cs.backgroundColor },
      texts, ring: ringBox };
  }
  return out;
})()`;

for (const theme of ['light', 'dark']) {
  test(`0614 AC1 AC2 AC3: in the ${theme} look at 320 px, an open Capture and Plan row's text sits 12 px inside its fill, its title stays put, linked or not, and the row spans its list`, skip, async () => {
    await at320(theme, async b => {
      const m = await b.js(MEASURE);
      for (const [lane, r] of Object.entries(m)) {
        // AC1: the fill is the row's raised colour, a colour of its own on the lane, 12 px past every piece of text
        assert.equal(r.fill.colours.length, 2, `${lane}: a shadow each side: ${JSON.stringify(r.fill)}`);
        for (const c of r.fill.colours) assert.equal(c, r.fill.background, `${lane}: the fill's sides in the row's own colour`);
        assert.notEqual(r.fill.background, r.fill.under, `${lane}: the fill stands out from the lane`);
        assert.deepEqual(r.fill.y, [0, 0], `${lane}: the fill's sides run the row's height`);
        assert.ok(r.texts.length > 3, `${lane}: the open row's text was measured`);
        for (const t of r.texts) {
          assert.ok(t.left >= r.fill.left + 12 - 0.5, `${lane}: "${t.text}" is 12 px inside the fill's left edge: ${t.left} vs ${r.fill.left}`);
          assert.ok(t.right <= r.fill.right - 12 + 0.5, `${lane}: "${t.text}" is 12 px inside the fill's right edge: ${t.right} vs ${r.fill.right}`);
        }
        // a linked id's ring goes round the whole fill, and takes no taps
        assert.deepEqual([r.ring.left, r.ring.right], [r.fill.left, r.fill.right], `${lane}: the ring round the fill`);
        assert.match(r.ring.shadow, /inset/, `${lane}: the ring is drawn`);
        assert.equal(r.ring.events, 'none');
        // AC2: the title doesn't move sideways
        assert.equal(r.open, r.closed, `${lane}: the title stays put when the row opens`);
      }
      // 0614: a linked ticket's mark at the end of its open line, after its title
      assert.deepEqual(m.plan.marks, [], 'the ticket with no links has no mark');
      assert.deepEqual(m['chain starter'].marks, ['chain'], 'the chain starter shows its chain mark');
      assert.deepEqual(m.waiting.marks, ['lock'], 'the waiting ticket shows its padlock');
      for (const [lane, r] of Object.entries(m)) {
        // AC3: the row's own box still spans its list, inside the 16 px margins
        assert.deepEqual([r.row.left, r.row.right], [r.list.left, r.list.right], `${lane}: the row spans its list`);
        assert.deepEqual([r.row.left, r.row.right], [16, 304], `${lane}: inside the 16 px margins`);
      }
    });
  });
}
