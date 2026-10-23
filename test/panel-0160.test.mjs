import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, full, fakePage, page, findChrome, browserPage, openLane } from './support/panel.mjs';
import { sharedPanel } from './support/shared-panel.mjs';

// ---------- 0160: keep the panel header on screen ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const head = () => page().match(/<head>([\s\S]*?)<\/head>/)[1];
const css = () => (page().match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
const phoneCss = () => (css().match(/@media \(max-width: 699\.98px\) \{([\s\S]*)$/) || [])[1] || '';

// Enough tickets for the page to scroll well past one screen, on a phone and on a desktop. 0001 unlocks 0002, so 0002's
// row in the Build queue has a button that jumps to 0001 (0154).
const board = () => ({
  tickets: [
    full('0001', { problem: Array.from({ length: 60 }, (_, i) => `Line ${i + 1} of a long problem.`).join('\n\n') }),
    T('0002', 'ready', { after: ['0001'], waiting_on: ['0001'] }),
    ...Array.from({ length: 24 }, (_, i) => full(String(i + 10).padStart(4, '0'))),
    ...Array.from({ length: 12 }, (_, i) => T(String(i + 50).padStart(4, '0'), 'done', { shipped: new Date().toISOString() })),
  ],
  ideas: [],
  run: { on: false, pid: null },
});

// The panel in a real headless browser, with a board of tickets, at a width and with the screen's safe-area insets
// (the status bar's height above, the home indicator's below), as on an iPhone in the home-screen app.
async function withPanel(fn, { width = 375, height = 640, insets = null, theme = null, reducedMotion = false } = {}) {
  const panel = await sharedPanel(); // one for the whole file: the page stub below answers every request (0234)
  const b = await browserPage('about:blank');
  const STATE = board();
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 });
    if (insets) await b.send('Emulation.setSafeAreaInsetsOverride', { insets });
    if (reducedMotion) await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
      ${theme ? `localStorage.setItem('speck-theme', ${JSON.stringify(theme)});` : ''}
      const STATE = ${JSON.stringify(STATE)}, real = window.fetch.bind(window);
      window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? new Response(JSON.stringify(STATE), { status: 200, headers: { 'content-type': 'application/json' } }) : real(url, opts);
    })();` });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    for (let i = 0; ; i++) {
      try { if (await b.js(`location.port === '${panel.port}' && !!document.querySelector('#queue .q .goto') && !document.querySelector('#run').hidden`)) break; } catch (e) { if (i >= 100) throw e; }
      if (i >= 100) throw new Error('timed out waiting for the panel');
      await new Promise(res => setTimeout(res, 100));
    }
    await fn(b);
  } finally { await b.close(); }
}
// Scrolls the page and waits for the header to settle (a scroll event, then any fade). 0410: the page itself never
// scrolls, so it's Plan's list, the lane with the most on this board, that scrolls.
const LIST = `document.getElementById('shaping')`;
const scrollTo = async (b, y) => { await b.js(`${openLane('plan')} && (${LIST}.scrollTop = ${y})`); await new Promise(r => setTimeout(r, 350)); };
const box = (b, sel) => b.js(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height }; })()`);
// What the page shows at a point: 'header' when it's the header or anything in it.
const at = (b, x, y) => b.js(`(() => { const n = document.elementFromPoint(${x}, ${y}); return !n ? null : n.closest('header') ? 'header' : n.closest('#full-ticket') ? 'pane' : n.tagName.toLowerCase(); })()`);
const shown = (b, sel) => b.js(`(() => { const n = document.querySelector(${JSON.stringify(sel)}); const r = n.getBoundingClientRect(); return getComputedStyle(n).display !== 'none' && r.width > 0 && r.height > 0; })()`);

test('0160 AC1: the header stays at the top of the screen with a solid background and a line along its bottom', () => {
  const rule = (css().match(/(?:^|\n)\s*header \{([^}]*)\}/) || [])[1] || '';
  assert.match(rule, /position:\s*sticky/);
  assert.match(rule, /top:\s*0/);
  assert.match(rule, /z-index:\s*8\b/, 'above the cards, below the full ticket\'s backdrop (9) and pane (10)');
  assert.match(rule, /background:\s*var\(--bg\)/);
  assert.match(rule, /border-bottom:\s*\.5px solid var\(--line\)/);
});

for (const width of [375, 1280]) {
  test(`0160 AC1: at ${width} px, scrolled down, the header is still at the top and content scrolls under it, never through it`, skip, () => withPanel(async b => {
    await scrollTo(b, 900);
    assert.ok(await b.js(`${LIST}.scrollTop`) > 500, 'Plan\'s list scrolled');
    const h = await box(b, 'header');
    assert.equal(h.top, 0, 'the header is at the top of the screen');
    const look = await b.js(`(() => { const s = getComputedStyle(document.querySelector('header')); return { bg: s.backgroundColor, body: getComputedStyle(document.body).backgroundColor, line: s.borderBottomWidth, lineStyle: s.borderBottomStyle }; })()`);
    assert.equal(look.bg, look.body, 'the panel\'s own background');
    assert.doesNotMatch(look.bg, /rgba\(.*,\s*0(\.\d+)?\)$/, 'and solid');
    assert.notEqual(look.line, '0px');
    assert.equal(look.lineStyle, 'solid');
    // Every point across the header shows the header, not a card scrolled under it.
    for (const x of [2, width / 2, width - 20]) for (const y of [1, h.height / 2, h.height - 1]) assert.equal(await at(b, x, y), 'header', `(${x}, ${y})`);
  }, { width }));
}

test('0160 AC2: the page reaches behind the status bar, with a status bar style meta tag, and the header pads it', () => {
  const viewport = (head().match(/<meta name="viewport" content="([^"]*)">/) || [])[1] || '';
  assert.match(viewport, /width=device-width/);
  assert.match(viewport, /initial-scale=1/);
  assert.match(viewport, /viewport-fit=cover/);
  assert.match(head(), /<meta name="apple-mobile-web-app-status-bar-style" content="default" id="status-bar">/);
  const rule = (css().match(/(?:^|\n)\s*header \{([^}]*)\}/) || [])[1] || '';
  assert.match(rule, /padding:\s*calc\(12px \+ env\(safe-area-inset-top\)\)/); // 0413: around speck's screen's frame
  const phone = (phoneCss().match(/(?:^|\n)\s*header \{([^}]*)\}/) || [])[1] || '';
  assert.match(phone, /padding:\s*calc\(8px \+ env\(safe-area-inset-top\)\)/); // 0413: 8 px round the frame on a phone
});

test('0160 AC2: the status bar style tag says black-translucent (light text) on the dark look and default (dark text) on the light one, set before the page is drawn and on each switch', skip, async () => {
  for (const theme of ['light', 'dark']) {
    await withPanel(async b => {
      assert.equal(await b.js(`document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]').content`), theme === 'dark' ? 'black-translucent' : 'default', `${theme} look`);
      await b.js(`setLook(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark')`);
      assert.equal(await b.js(`document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]').content`), theme === 'dark' ? 'default' : 'black-translucent', `after switching from the ${theme} look`);
    }, { theme });
  }
  const start = (page().match(/<script id="theme-start">([\s\S]*?)<\/script>/) || [])[1] || '';
  assert.match(start, /status-bar/, 'the <head> script sets it before the page is first drawn');
});

test('0160 AC2: with a 47 px status bar, the header fills it and nothing else ever shows behind it, at the top or scrolled', skip, () => withPanel(async b => {
  for (const y of [0, 900]) {
    await scrollTo(b, y);
    const h = await box(b, 'header');
    assert.equal(h.top, 0, 'the header starts at the very top, behind the status bar');
    for (const x of [2, 187, 373]) for (const sy of [1, 23, 46]) assert.equal(await at(b, x, sy), 'header', `behind the status bar at (${x}, ${sy}), scrolled to ${y}`);
    const frame = await box(b, '.bezel'); // 0413: speck's screen's frame
    assert.ok(frame.top >= 47, `the header's own content starts below the status bar (at ${frame.top})`);
  }
}, { insets: { top: 47, bottom: 34 } }));

// 0364: the header no longer slims as you scroll: it's one row at the top and scrolled down, with the project shown.
// 0413: the header is speck's screen in its frame, taller than the one row these checked on a phone (panel-0413.test.mjs).

test('0160 AC3: scrolling down and back up starts no fade in the header, and leaves it as it was', skip, () => withPanel(async b => {
  await b.js(`window.anims = []; document.querySelector('header').addEventListener('animationstart', e => anims.push(e.animationName), true)`);
  const before = await b.js(`document.querySelector('header').className`);
  await scrollTo(b, 600);
  await scrollTo(b, 0);
  assert.deepEqual(await b.js('anims'), []);
  assert.equal(await b.js(`document.querySelector('header').className`), before);
}));

test('0160 AC3: the fake page, which has no scrolling, still runs the page script without error', async () => {
  const p = fakePage([board()]);
  await p.settle();
  assert.equal(p.byId('run').hidden, false);
});

test('0160 AC4: the last card clears the home indicator', skip, () => withPanel(async b => {
  const pad = await b.js(`getComputedStyle(document.querySelector('main')).paddingBottom`);
  assert.equal(pad, `${16 + 34}px`, 'the page\'s bottom padding includes the inset');
  await scrollTo(b, 100000);
  const last = await b.js(`(() => { const s = [...document.querySelectorAll('main > section')].find(n => !n.hidden).getBoundingClientRect(); return innerHeight - s.bottom; })()`); // 0410: the open lane
  assert.ok(last >= 34, `scrolled to the end, the last card ends ${last} px above the bottom`);
}, { insets: { top: 47, bottom: 34 } }));

test('0160 AC4: the full ticket pane\'s close button and first line sit below the status bar', skip, () => withPanel(async b => {
  await b.js(`(() => { const n = [...document.querySelectorAll('#shaping .item')].find(n => n.querySelector('.id').textContent === '0001'); n.querySelector('.head').click(); })()`);
  await b.until(`!!document.querySelector('#shaping .item.open .full-open')`, 'the ticket to open');
  await b.js(`document.querySelector('#shaping .item.open .full-open').click()`);
  await b.until(`!document.querySelector('#full-ticket').hidden`, 'the full ticket');
  const close = await box(b, '#full-ticket .close');
  const top = await box(b, '#full-ticket .top');
  assert.ok(close.top >= 47, `the close button is at ${close.top}`);
  assert.ok(top.top >= 47, `the first line is at ${top.top}`);
  assert.equal(await at(b, close.left + 4, close.top + 4), 'pane', 'and nothing covers it');
}, { insets: { top: 47, bottom: 34 } }));

test('0160 AC2: scrolled to its end, the full ticket shows nothing behind the status bar, not even its border', skip, () => withPanel(async b => {
  await b.js(`(() => { const n = [...document.querySelectorAll('#shaping .item')].find(n => n.querySelector('.id').textContent === '0001'); n.querySelector('.head').click(); })()`);
  await b.until(`!!document.querySelector('#shaping .item.open .full-open')`, 'the ticket to open');
  await b.js(`document.querySelector('#shaping .item.open .full-open').click()`);
  await b.until(`!document.querySelector('#full-ticket').hidden && document.querySelector('#full-ticket').scrollHeight > 2 * innerHeight`, 'the long full ticket');
  await b.js(`document.querySelector('#full-ticket').scrollTop = 100000`);
  await new Promise(r => setTimeout(r, 100));
  assert.ok(await b.js(`document.querySelector('#full-ticket').scrollTop`) > 500, 'the pane scrolled');
  const pane = await box(b, '#full-ticket');
  assert.ok(pane.top >= 47, `the pane, border and all, starts below the status bar (at ${pane.top})`);
  for (const x of [pane.left, pane.left + 1, pane.left + 20, 374]) for (const y of [1, 23, 46]) assert.notEqual(await at(b, x, y), 'pane', `(${x}, ${y})`);
}, { insets: { top: 47, bottom: 34 } }));

for (const insets of [null, { top: 47, bottom: 34 }]) {
  const where = insets ? 'in the home-screen app' : 'in a browser tab';
  test(`0160 AC5: ${where}, jumping to a ticket shows it below the header, not behind it`, skip, () => withPanel(async b => {
    await b.js(`document.querySelector('#queue').scrollIntoView()`);
    await b.js(`[...document.querySelectorAll('#queue .goto')].find(n => n.textContent === '0001').click()`);
    await b.until(`!!document.querySelector('#shaping .item.flash')`, 'the highlight');
    await new Promise(r => setTimeout(r, 600)); // any smooth scroll and the header's fade
    const h = await box(b, 'header');
    const t = await box(b, '#shaping .item.flash');
    assert.ok(t.top >= h.bottom, `the ticket's top (${t.top}) is below the header's bottom (${h.bottom})`);
  }, { insets }));

  test(`0160 AC5: ${where}, the opened full ticket shows over the header, with nothing behind its close button`, skip, () => withPanel(async b => {
    await scrollTo(b, 400);
    await b.js(`(() => { const n = [...document.querySelectorAll('#shaping .item')].find(n => n.querySelector('.id').textContent === '0001'); n.querySelector('.head').click(); })()`);
    await b.until(`!!document.querySelector('#shaping .item.open .full-open')`, 'the ticket to open');
    await b.js(`document.querySelector('#shaping .item.open .full-open').click()`);
    await b.until(`!document.querySelector('#full-ticket').hidden`, 'the full ticket');
    const close = await box(b, '#full-ticket .close');
    assert.equal(await at(b, close.left + 4, close.top + 4), 'pane');
    const pane = await box(b, '#full-ticket');
    assert.equal(await at(b, pane.left + 20, pane.top + 2), 'pane', 'the pane is above the header');
  }, { insets }));
}
