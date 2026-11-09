import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, page, panelRepo, freePort, startPanel, stop, raw, findChrome, browserPage } from './support/panel.mjs';
import { ICONS, APP_ICONS, TAB_ICONS, iconSvg, draw, readPng } from './support/icons.mjs';

// ---------- 0594: the app icon and favicon are speck as the Premium screen on the black slab ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const BAR = fs.readFileSync(path.join(ROOT, 'templates', 'panel-base.css'), 'utf8').match(/--bar: (#[0-9A-Fa-f]{6})/)[1];
const SCREEN = '#06070a', EYE = '#ff6a4d';
const read = name => fs.readFileSync(path.join(ICONS, name));
const hex = c => `#${c.map(n => n.toString(16).padStart(2, '0')).join('')}`;
const channels = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const alpha = (img, x, y) => img.px[(y * img.w + x) * 4 + 3];
// The pixel of an icon holding this point of speck's drawing, whose device is centred on the icon at 1.8 times its size.
const point = (size, x, y) => [Math.floor((50 + 1.8 * x) * size / 100), Math.floor((95 + 1.8 * y) * size / 100)];
const at = (img, x, y) => hex(img.at(...point(img.w, x, y)));
const VISOR = [0, -25], GLOW = [0, -28.6], GLASS = [-4, -33], TOP = [-14, -41], BOTTOM = [-14, -9.5];

test('0594 AC1: icon.svg is speck as the Premium screen, on the black bar\'s colour with rounded corners', () => {
  const svg = read('icon.svg').toString();
  assert.equal(svg, iconSvg(), 'make it again with writeIcons() in test/support/icons.mjs');
  assert.doesNotMatch(svg, /<script|on\w+=/i, 'no script');
  const slab = svg.match(/<rect [^>]*>/)[0];
  assert.match(slab, new RegExp(`fill="${BAR}"`), 'the black slab first, in the bar\'s colour');
  assert.match(slab, /width="100" height="100" rx="22"/, 'rounded corners');
  assert.match(svg, /<linearGradient[^>]*>.*#5A5C54.*#1D1E1A.*<\/linearGradient>/, 'the device\'s bezel, as it looks on a dark background');
  assert.match(svg, /<rect [^>]*fill="#06070A"/i, 'the recessed screen');
  assert.match(svg, /M -5 -25 Q 0 -25 5 -25/, 'the watching visor');
  assert.match(svg, /stroke-width="8.6" stroke-opacity="0.28"/, 'its glow');
  assert.match(svg, /fill="#FFFFFF" fill-opacity="0.07"/, 'the reflection across the glass');
});

test('0594 AC1: the PNGs are the same drawing: speck, watching, with its glow and reflection, on the slab with rounded corners', () => {
  assert.deepEqual(APP_ICONS, { 'icon-192.png': 192, 'icon-512.png': 512, 'apple-touch-icon.png': 180 });
  for (const [name, size] of Object.entries(APP_ICONS)) {
    const file = read(name), img = readPng(file);
    assert.deepEqual([img.w, img.h, img.type], [size, size, 6], `${name}: ${size} px square, with transparency`);
    assert.ok(img.px.equals(draw(size)), `${name}: make it again with writeIcons() in test/support/icons.mjs`);
    assert.equal(alpha(img, 0, 0), 0, `${name}: the corner is rounded away`);
    assert.equal(alpha(img, 3, Math.floor(size / 2)), 255, `${name}: the slab reaches the edge`);
    assert.equal(hex(img.at(Math.floor(size * .03), Math.floor(size / 2))), BAR.toLowerCase(), `${name}: the slab`);
    assert.equal(at(img, ...VISOR), EYE, `${name}: the visor`);
    const [r, , b] = img.at(...point(size, ...GLOW));
    assert.ok(r > 60 && r > b * 1.5, `${name}: the visor's glow, not ${img.at(...point(size, ...GLOW))}`);
    const glass = img.at(...point(size, ...GLASS)), plain = channels(SCREEN);
    assert.ok(glass.every((c, i) => c > plain[i]), `${name}: the reflection lightens the screen, not ${glass}`);
    assert.ok(channels(at(img, ...TOP))[0] > channels(at(img, ...BOTTOM))[0], `${name}: the bezel is lighter at the top`);
  }
});

test('0594 AC2: at 16 and 32 px the favicon PNGs show the plain visor, without the reflection or glow', () => {
  assert.deepEqual(TAB_ICONS, { 'icon-16.png': 16, 'icon-32.png': 32 });
  for (const [name, size] of Object.entries(TAB_ICONS)) {
    const file = read(name), img = readPng(file);
    assert.deepEqual([img.w, img.h, img.type], [size, size, 6], `${name}: ${size} px square, with transparency`);
    assert.ok(img.px.equals(draw(size, true)), `${name}: make it again with writeIcons() in test/support/icons.mjs`);
    assert.equal(alpha(img, 0, 0), 0, `${name}: the corner is rounded away`);
    const [red, , blue] = img.at(...point(size, ...VISOR));
    assert.ok(red > 150 && red > blue * 2, `${name}: the visor, red, not ${img.at(...point(size, ...VISOR))}`);
    assert.equal(at(img, ...GLOW), SCREEN, `${name}: no glow above the visor`);
    assert.equal(at(img, ...GLASS), SCREEN, `${name}: no reflection on the glass`);
  }
});

test('0594 AC2: icon.svg leaves out only its glow and reflection when it\'s drawn at tab sizes', () => {
  const svg = read('icon.svg').toString();
  assert.match(svg, /@media \(max-width:48px\)\{\.d\{display:none\}\}/, 'a rule that covers 16 and 32 px, and a sharper screen\'s larger pixels');
  assert.deepEqual([...svg.matchAll(/<(\w+) class="d"[^>]*?(stroke-width="[\d.]+"|fill="#FFFFFF")/g)].map(m => [m[1], m[2]]), [['path', 'stroke-width="8.6"'], ['path', 'fill="#FFFFFF"']]);
});

test('0594 AC2: icon.svg, drawn at tab sizes in a real browser, shows the plain visor, and at larger sizes the glow and reflection', skip, async () => {
  const b = await browserPage('about:blank');
  try {
    const shot = async size => {
      // Drawn on the page at this size, as a tab draws it: the SVG's own sizing rule is about the size it's shown at.
      await b.js(`new Promise(ok => { document.body.style.cssText = 'margin:0;background:#000'; const i = new Image(${size}, ${size}); i.style.display = 'block'; i.onload = () => ok(1); i.onerror = () => ok(0); document.body.replaceChildren(i); i.src = 'data:image/svg+xml,' + encodeURIComponent(${JSON.stringify(read('icon.svg').toString())}); })`);
      return readPng(Buffer.from((await b.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: size, height: size, scale: 1 } })).data, 'base64'));
    };
    for (const size of [16, 32]) {
      const img = await shot(size), [x, y] = point(size, ...GLOW), [gx, gy] = point(size, ...GLASS);
      assert.deepEqual([img.w, img.h], [size, size]);
      assert.equal(hex(img.at(x, y)), SCREEN, `no glow at ${size} px`);
      assert.equal(hex(img.at(gx, gy)), SCREEN, `no reflection at ${size} px`);
    }
    const big = await shot(64), [x, y] = point(64, ...GLOW), [gx, gy] = point(64, ...GLASS);
    assert.notEqual(hex(big.at(x, y)), SCREEN, 'the glow at 64 px');
    assert.notEqual(hex(big.at(gx, gy)), SCREEN, 'the reflection at 64 px');
  } finally { await b.close(); }
});

test('0594 AC3: the web app manifest\'s theme and background colours are the black bar\'s', () => {
  const m = JSON.parse(read('manifest.webmanifest').toString());
  assert.deepEqual([m.theme_color, m.background_color], [BAR, BAR]);
});

test('0594 AC4: the page\'s tab and the phone\'s home-screen icon use the new icons', async () => {
  const head = (page().match(/<head>([\s\S]*?)<\/head>/) || [])[1] || '';
  for (const link of ['<link rel="icon" href="icon.svg" type="image/svg+xml">',
    '<link rel="icon" href="icon-16.png" type="image/png" sizes="16x16">',
    '<link rel="icon" href="icon-32.png" type="image/png" sizes="32x32">',
    '<link rel="apple-touch-icon" href="apple-touch-icon.png" sizes="180x180">']) assert.ok(head.includes(link), link);
  const p = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  try {
    for (const name of [...Object.keys(TAB_ICONS), ...Object.keys(APP_ICONS), 'icon.svg']) {
      const res = await raw(p.port, `/${name}`);
      assert.equal(res.status, 200, name);
      assert.ok(res.body.equals(read(name)), `${name} is the file in templates/icons`);
    }
  } finally { await stop(p); }
});
