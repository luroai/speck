import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, panelRepo, freePort, startPanel, stop, raw, findChrome, browserPage } from './support/panel.mjs';
import { ICONS, PNGS, png, readPng, logo } from './support/icons.mjs';

// ---------- 0170: speck's eared logo, from the landing page, across the panel ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
// The landing page's mark, <symbol id="mark"> in speck-site's site/index.html: the open circle, the two ears and the dot.
const SITE = {
  paths: ['M14.5 22.5 A21.5 21.5 0 1 0 22 16.2', 'M12.6 19.8 a5.2 5.2 0 0 1 8.2 -5.6', 'M43.2 14.2 a5.2 5.2 0 0 1 8.2 5.6'],
  // 0184: the dot is the builder's eye, larger and just above the circle's centre, in place of the site's nose.
  dot: { cx: '31.7', cy: '33.2', r: '4.8' },
};
const LIGHT_DOT = '#b0412e';
const SVG = () => fs.readFileSync(path.join(ICONS, 'icon.svg'), 'utf8');
const hex = c => `#${c.map(n => n.toString(16).padStart(2, '0')).join('')}`;
const attrs = s => Object.fromEntries([...s.matchAll(/([\w-]+)="([^"]*)"/g)].map(a => [a[1], a[2]]));
const pathsOf = svg => [...svg.matchAll(/<path\b([^>]*)>/g)].map(m => attrs(m[1]).d);
const circlesOf = svg => [...svg.matchAll(/<circle\b([^>]*)>/g)].map(m => attrs(m[1]));

test('0170 AC1: icon.svg is the open circle, the two ears and the red dot on the solid #faf9f5 background', () => {
  const svg = SVG();
  assert.match(svg, /<rect width="64" height="64" fill="#faf9f5"\/>/);
  assert.equal(pathsOf(svg).length, 3, 'the circle and two ears');
  const dots = circlesOf(svg);
  assert.equal(dots.length, 1);
  assert.equal(dots[0].fill, LIGHT_DOT);
  assert.match(svg, /stroke="#141413"/);
  assert.match(svg, /stroke-linecap="round"/);
  assert.doesNotMatch(svg, /M18\.5 14\.1 A22 22 0 1 0 28\.5 10/, '0149\'s ensō is gone');
});

test('0170 AC1: each PNG is the new mark, centred, on a solid background, with strokes thick enough to read at 180 px', () => {
  const L = logo();
  // 180 px across 64 units: a stroke at least 6 px wide.
  assert.ok(L.half * 2 * 180 / 64 >= 6, `the stroke is ${(L.half * 2 * 180 / 64).toFixed(1)} px at 180 px`);
  // Centred: the mark's ink, with its stroke, sits within a unit of the middle each way.
  const [dx, dy] = L.at, xs = [], ys = [];
  for (const a of L.arcs) for (let t = 0; t < 2 * Math.PI; t += 0.001) if (a.onArc(t)) { xs.push(a.cx + a.r * Math.cos(t) + dx); ys.push(a.cy + a.r * Math.sin(t) + dy); }
  const mid = v => (Math.min(...v) - L.half + Math.max(...v) + L.half) / 2;
  assert.ok(Math.abs(mid(xs) - 32) <= 1, `centred across (${mid(xs).toFixed(2)})`);
  assert.ok(Math.abs(mid(ys) - 32) <= 1, `centred up and down (${mid(ys).toFixed(2)})`);
  for (const [name, size] of Object.entries(PNGS)) {
    const file = fs.readFileSync(path.join(ICONS, name));
    assert.ok(file.equals(png(size)), `${name} is drawn from icon.svg: make it again with writeIcons() in test/support/icons.mjs`);
    const img = readPng(file);
    assert.equal(img.type, 2, `${name} is RGB, with no alpha channel`);
    // A point given in the mark's own units, moved by the icon's translate.
    const at = (u, v) => hex(img.at(Math.floor((u + dx) * size / 64), Math.floor((v + dy) * size / 64)));
    for (const [u, v] of [[1, 4], [62, 4], [1, 62], [62, 62], [32, 9], [32, 26]]) assert.equal(at(u, v), '#faf9f5', `${name} background at ${u},${v}`);
    assert.equal(at(31.7, 33.2), LIGHT_DOT, `${name} has the red dot`);
    const c = L.arcs[0];
    for (const t of [Math.PI / 2, 0, Math.PI]) assert.equal(at(c.cx + c.r * Math.cos(t), c.cy + c.r * Math.sin(t)), '#141413', `${name} has the circle at ${t.toFixed(2)} rad`);
    for (const e of L.arcs.slice(1)) assert.equal(at(e.cx, e.cy - e.r), '#141413', `${name} has the ear at ${e.cx.toFixed(1)}`);
  }
});

test('0170 AC2: icon.svg draws the landing page\'s own circle, ears and dot, changing only stroke width and placement', () => {
  const svg = SVG();
  assert.deepEqual(pathsOf(svg), SITE.paths);
  const { cx, cy, r } = circlesOf(svg)[0];
  assert.deepEqual({ cx, cy, r }, SITE.dot);
  // Only a translate moves it: no scale, rotate or skew, so its shapes are the site's.
  for (const t of svg.matchAll(/transform="([^"]*)"/g)) assert.match(t[1], /^translate\([-\d.]+[\s,]+[-\d.]+\)$/);
});

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
    shown: getComputedStyle(mark).display !== 'none' && m.width > 0 };
})()`);

for (const theme of ['light', 'dark']) for (const width of [1280, 375]) {
  test(`0170 AC3: ${theme}, at ${width} px, the mark is just left of "speck" and about as tall`, skip, () => inBrowser(async b => {
    const check = async where => {
      const x = await measure(b);
      assert.equal(x.text, 'speck');
      assert.ok(x.shown, `${where}: the mark shows`);
      assert.ok(x.mark.right <= x.word.left && x.word.left - x.mark.right <= 10, `${where}: immediately left of the wordmark: ${JSON.stringify(x)}`);
      // 0309: a 32 px mark beside a 26 px speck
      assert.ok(x.mark.height >= x.font * 0.8 && x.mark.height <= x.font * 1.25, `${where}: about as tall as the wordmark: ${JSON.stringify(x)}`);
      assert.ok(x.mark.top >= x.word.top - 2 && x.mark.bottom <= x.word.bottom + 2, `${where}: on the wordmark's line: ${JSON.stringify(x)}`);
    };
    await check('at the top');
    if (width < 700) {
      // 0160: scrolled down on a phone, the header slims to one row.
      await b.js(`document.body.style.minHeight = '4000px'; scrollTo(0, 900)`);
      await b.until(`document.querySelector('header').classList.contains('slim')`, 'the slim header');
      await new Promise(r => setTimeout(r, 300)); // its fade
      await check('in the slim header');
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

test('0170 AC4: the manifest and icons are still served, and icon.svg is the new mark', async () => {
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
    assert.deepEqual(pathsOf(svg.body.toString()), SITE.paths);
    const touch = await raw(p.port, '/apple-touch-icon.png');
    assert.equal(touch.status, 200);
    assert.deepEqual([readPng(touch.body).w, readPng(touch.body).h], [180, 180]);
  } finally { await stop(p); }
});

test('0170 AC5: 0149\'s artwork checks now check the eared mark, not the ensō', () => {
  const suite = fs.readFileSync(path.join(ROOT, 'test', 'panel-0149.test.mjs'), 'utf8');
  assert.doesNotMatch(suite, /M18\\\.5 14\\\.1/, 'no check of the old ensō path');
  assert.doesNotMatch(suite, /ensō open at the top left/);
  assert.match(suite, /the circle, the two ears/);
});
