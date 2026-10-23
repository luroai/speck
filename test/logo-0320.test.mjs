import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, page, panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';
import { ICONS, PNGS, logo, draw, png, readPng, shapes } from './support/icons.mjs';

// ---------- 0320: the design's new logo in the header and the app icons ----------

const SHA = '3b0b714a151bb0bcbf6b453a135e02c5474878960142baec2472648c4f7049fb';
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const DESIGN = path.join(ROOT, 'docs', 'design', 'lcd');
const read = (...p) => fs.readFileSync(path.join(...p));
const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

test('0320 AC1: the design\'s new renderer is in docs/design/lcd/ and templates/, byte for byte', () => {
  assert.equal(sha(read(DESIGN, 'lcd.js')), SHA, 'docs/design/lcd/lcd.js');
  assert.equal(sha(read(ROOT, 'templates', 'lcd.js')), SHA, 'templates/lcd.js');
  assert.equal(typeof logo().markSVG, 'function', 'it has the logo');
});

test('0320 AC1: the new panel mock and concept page are beside it, and next/ is gone', () => {
  assert.equal(fs.existsSync(path.join(DESIGN, 'next')), false, 'docs/design/lcd/next/ is removed');
  assert.match(read(DESIGN, 'panel-mock.html').toString(), /L\.logo\.markSVG\(\)/, 'the panel mock with the new logo');
  assert.match(read(DESIGN, 'concept.html').toString(), /id="logos"/, 'the concept page with its Logos band');
  assert.equal(execFileSync('git', ['ls-files', 'docs/design/lcd/next'], { cwd: ROOT, encoding: 'utf8' }), '', 'nothing tracked in next/');
});

test('0320 AC1: the tests that pin the renderer pin the new one', () => {
  for (const f of ['panel-0302.test.mjs', 'panel-0308.test.mjs']) {
    const src = read(ROOT, 'test', f).toString();
    assert.ok(src.includes(SHA), `${f} pins the new renderer`);
    assert.ok(!src.includes('39c97086e87535110d8a5fc9e057aa275438a60ffaabb72e2175aa109dbfcf49'), `${f} no longer pins the old one`);
  }
});

// 0413: the header's mark went with the header row; speck's screen is the top of the panel now (panel-0413.test.mjs).

test('0320 AC3: icon.svg is the renderer\'s faviconSVG(), which follows the browser\'s light or dark look', () => {
  const svg = read(ICONS, 'icon.svg').toString();
  assert.equal(svg, logo().faviconSVG());
  assert.match(svg, /@media \(prefers-color-scheme:dark\)/);
  assert.doesNotMatch(svg, /<script|on\w+=/i, 'no script');
});

test('0320 AC4: the PNG icons are the renderer\'s appIconSVG(\'light\') drawn at their sizes', () => {
  assert.deepEqual(PNGS, { 'icon-192.png': 192, 'icon-512.png': 512, 'apple-touch-icon.png': 180 });
  for (const [name, size] of Object.entries(PNGS)) {
    const file = read(ICONS, name), img = readPng(file);
    assert.deepEqual([img.w, img.h, img.type], [size, size, 2], `${name}: ${size} px square, RGB`);
    assert.ok(file.equals(png(size)), `${name} is drawn from appIconSVG('light'): make it again with writeIcons() in test/support/icons.mjs`);
  }
});

test('0320 AC4: in the design\'s own colours: its shell, bezel and screen, not the panel\'s lighter screen', () => {
  const L = logo().LOOKS.light, hex = c => `#${c.map(n => n.toString(16).padStart(2, '0')).join('')}`;
  for (const [name, size] of Object.entries(PNGS)) {
    const img = readPng(read(ICONS, name)), at = (x, y) => hex(img.at(Math.floor(x * size / 100), Math.floor(y * size / 100)));
    assert.equal(at(5, 5), L.shell, `${name}: the shell`);
    assert.equal(at(14, 50), L.bezel, `${name}: the bezel`);
    // The middle of the screen's first dot, which is unlit.
    assert.equal(at(18.5 + 63 / 40, 18.5 + 63 / 40), L.off, `${name}: the design's unlit dots`);
    // None of the panel's lighter screen, from 0308, anywhere.
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) assert.ok(!['230,233,219', '221,225,207'].includes(img.at(x, y).join()), `${name}: shade C at ${x}, ${y}`);
  }
  // The gap between the first two dots, wide enough at 512 px to show the screen itself.
  const big = readPng(read(ICONS, 'icon-512.png'));
  assert.equal(hex(big.at(110, 102)), L.bg, 'icon-512.png: the design\'s screen');
});

test('0320 AC4: the drawing reads only the shapes the design draws, and refuses any it can\'t', () => {
  const s = shapes(logo().appIconSVG('light'));
  assert.deepEqual(s.slice(0, 3).map(x => x.fill), ['#f2f1ec', '#262722', '#c3c9b1']);
  assert.ok(s.some(x => /^rgba/.test(x.fill)), 'the dots\' shadow');
  assert.throws(() => shapes('<svg viewBox="0 0 100 100"><circle r="3"/></svg>'), /<circle>/);
  assert.throws(() => shapes('<svg viewBox="0 0 100 100"><path fill="#000" d="M0 0l3 3z"/></svg>'), /can't read/);
  assert.throws(() => draw(10, '<svg viewBox="0 0 100 100"><rect width="1" height="1" fill="red"/></svg>'), /colour/);
});

// The old renderer's drawing code, lines 1 to 706 as 0302 copied them from the design, before its export line.
const DRAWING = 'aab9409deb0458e88c7d6f82c55f1bca0272eb836c71e00dfee627026c966a75';

test('0320 AC5: the new renderer draws the badges and the Foreman\'s builder with the same code as before (0364 and 0416: the panel draws neither)', () => {
  for (const file of [path.join(DESIGN, 'lcd.js'), path.join(ROOT, 'templates', 'lcd.js')]) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    assert.equal(sha(lines.slice(0, 706).join('\n')), DRAWING, `${file}: the same code up to the logo`);
    assert.match(lines[706], /^ {2}\/\/ ---- The logo ----$/, 'then the logo section');
  }
  // 0416: the panel draws no badges now. 0364: the Foreman's button has no builder now.
  assert.doesNotMatch(page(), /LCD\.badge\(/);
  assert.doesNotMatch(page(), /LCD\.mini\(/);
});

// ---------- in a real browser ----------

test('0320 AC3: in a real browser, icon.svg loads (0413: the header\'s mark, checked here too, went with the header row)', skip, async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`document.readyState === 'complete'`, 'the panel');
    const icon = await b.js(`new Promise(ok => { const i = new Image(); i.onload = () => ok(i.naturalWidth); i.onerror = () => ok('failed'); i.src = '/icon.svg'; })`);
    assert.notEqual(icon, 'failed', 'icon.svg loads');
  } finally { try { await b.close(); } finally { await stop(panel); } }
});
