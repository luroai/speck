import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, freePort, startPanel, stop, raw, findChrome, browserPage } from './support/panel.mjs';
import { ICONS, readPng } from './support/icons.mjs';

// ---------- 0170: speck's eared logo, from the landing page, across the panel ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

// 0305: the app icon is speck on the LCD screen now, in place of the eared mark, so its checks are in
// icons-0305.test.mjs.

// 0303: the header's mark is drawn on the LCD screen, so its markup, shapes and colours are checked in
// panel-0303.test.mjs. Where it sits, beside the wordmark, is checked here still.

// The panel's page in Chrome, at a width, in a look.
async function inBrowser(fn, { width = 1280, theme = 'light' } = {}) {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height: 700, deviceScaleFactor: 1, mobile: width < 700 });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('speck-theme', ${JSON.stringify(theme)});` });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && !!document.querySelector('header .logo .mark')`, 'the panel');
    await fn(b);
  } finally { await b.close(); await stop(panel); }
}
// Where the mark and the wordmark are drawn, and their colours.
const measure = b => b.js(`(() => {
  const logo = document.querySelector('header .logo'), mark = logo.querySelector('.mark'), word = logo.querySelector('.name').firstChild; // 0304: in its own element
  const r = document.createRange(); r.setStart(word, 0); r.setEnd(word, 5);
  const m = mark.getBoundingClientRect(), w = r.getBoundingClientRect();
  return { text: r.toString(), mark: { left: m.left, right: m.right, top: m.top, bottom: m.bottom, height: m.height },
    word: { left: w.left, top: w.top, bottom: w.bottom }, font: parseFloat(getComputedStyle(logo.querySelector('.name')).fontSize),
    shown: getComputedStyle(mark).display !== 'none' && m.width > 0, wordShown: getComputedStyle(logo.querySelector('.name')).display !== 'none' };
})()`);

for (const theme of ['light', 'dark']) for (const width of [1280, 375]) {
  test(`0170 AC3: ${theme}, at ${width} px, the mark is just left of "speck" and about as tall (0364: under 700 px, the mark alone)`, skip, () => inBrowser(async b => {
    const check = async where => {
      const x = await measure(b);
      assert.equal(x.text, 'speck');
      assert.ok(x.shown, `${where}: the mark shows`);
      // 0364: under 700 px the "speck" word is hidden, and the mark stays, at the top and scrolled
      if (width < 700) return assert.equal(x.wordShown, false, `${where}: no "speck" word on a phone`);
      assert.ok(x.wordShown, `${where}: the "speck" word shows`);
      assert.ok(x.mark.right <= x.word.left && x.word.left - x.mark.right <= 10, `${where}: immediately left of the wordmark: ${JSON.stringify(x)}`);
      // 0309: a 32 px mark beside a 26 px speck
      assert.ok(x.mark.height >= x.font * 0.8 && x.mark.height <= x.font * 1.25, `${where}: about as tall as the wordmark: ${JSON.stringify(x)}`);
      assert.ok(x.mark.top >= x.word.top - 2 && x.mark.bottom <= x.word.bottom + 2, `${where}: on the wordmark's line: ${JSON.stringify(x)}`);
    };
    await check('at the top');
    if (width < 700) {
      // 0364: scrolled down on a phone, the header is the same one row.
      await b.js(`document.body.style.minHeight = '4000px'; scrollTo(0, 900)`);
      await b.until(`scrollY >= 900`, 'the scroll');
      await check('scrolled down');
    }
  }, { width, theme }));
}

test('0170 AC4: in a browser, the speck name reads as "speck control panel", with nothing from the mark', skip, () => inBrowser(async b => {
  const ax = await b.send('Accessibility.getFullAXTree');
  const names = ax.nodes.filter(n => !n.ignored).map(n => n.name?.value).filter(Boolean);
  assert.ok(!ax.nodes.some(n => !n.ignored && /^(image|graphics-document|svg)/i.test(n.role?.value || '') && n.name?.value === ''), 'no unnamed image');
  assert.ok(await b.js(`document.querySelector('header .logo .mark').getAttribute('aria-hidden') === 'true'`));
  assert.ok(names.some(n => /^speck\s*$/.test(n) || /^speck control panel$/i.test(n)), JSON.stringify(names.slice(0, 10)));
}));

test('0170 AC4: the manifest and icons are still served', async () => {
  const r = panelRepo();
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    const m = await raw(p.port, '/manifest.webmanifest');
    assert.equal(m.status, 200);
    for (const icon of JSON.parse(m.body).icons) {
      const res = await raw(p.port, icon.src);
      assert.equal(res.status, 200, icon.src);
      assert.ok(res.body.equals(fs.readFileSync(path.join(ICONS, path.basename(icon.src)))), `${icon.src} is the file in templates/icons`);
    }
    const svg = await raw(p.port, '/icon.svg');
    assert.equal(svg.status, 200);
    assert.ok(svg.body.equals(fs.readFileSync(path.join(ICONS, 'icon.svg'))), 'icon.svg is the file in templates/icons');
    const touch = await raw(p.port, '/apple-touch-icon.png');
    assert.equal(touch.status, 200);
    assert.deepEqual([readPng(touch.body).w, readPng(touch.body).h], [180, 180]);
  } finally { await stop(p); }
});
