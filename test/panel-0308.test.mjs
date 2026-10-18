import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ROOT, page } from './support/panel.mjs';
import { ICONS, PNGS, readPng } from './support/icons.mjs';

// ---------- 0308: a lighter LCD screen in the panel's light look (shade C) ----------

const LIGHT = { '--lcd-bg': '#e6e9db', '--lcd-off': '#dde1cf', '--lcd-ink': '#20241d', '--lcd-red': '#d63f28', '--lcd-shadow': 'rgba(30, 40, 15, .14)' };
const DARK = { '--lcd-bg': '#0d130f', '--lcd-off': '#151d17', '--lcd-ink': '#cfe6c6', '--lcd-red': '#ff5a3f', '--lcd-shadow': 'transparent' };
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const tokens = rule => Object.fromEntries([...rule.matchAll(/(--lcd-[a-z]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
const css = () => page().match(/<style>([\s\S]*?)<\/style>/)[1];
const lightRule = () => tokens(css().match(/\n {2}:root \{([\s\S]*?)\n {2}\}/)[1]);
const darkRule = () => tokens(css().match(/\n {2}:root\[data-theme="dark"\] \{([\s\S]*?)\n {2}\}/)[1]);

test('0308 AC1: the light look\'s screen is shade C, with its ink and red unchanged', () => {
  assert.deepEqual(lightRule(), LIGHT);
});

// The renderer (templates/lcd.js, as the panel serves it) with stand-ins for the browser: each canvas records what it's
// filled with, and the page's tokens come from the panel's own light or dark rule, as data-theme says.
function renderer() {
  const root = { dataset: { theme: 'light' } }, watchers = [];
  const ctx2d = () => {
    const g = { fills: [], fillStyle: '', globalAlpha: 1 };
    g.fillRect = () => g.fills.push(g.fillStyle); g.fill = () => g.fills.push(g.fillStyle);
    g.clearRect = g.drawImage = g.save = g.restore = g.translate = () => {};
    return g;
  };
  const canvas = () => { const g = ctx2d(); return { g, width: 0, height: 0, isConnected: true, getContext: () => g, getBoundingClientRect: () => ({ width: 56 }) }; };
  const cx = {
    window: {}, performance: { now: () => 0 }, devicePixelRatio: 1,
    document: { documentElement: root, createElement: canvas },
    getComputedStyle: () => ({ getPropertyValue: n => (root.dataset.theme === 'dark' ? darkRule() : lightRule())[n] || '' }),
    MutationObserver: class { constructor(fn) { watchers.push(fn); } observe() {} },
    Path2D: class { rect() {} },
  };
  vm.createContext(cx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'templates', 'lcd.js'), 'utf8'), cx);
  return { L: cx.window.SpeckLCD, canvas, look(t) { root.dataset.theme = t; for (const fn of watchers) fn([]); } };
}
// What a screen's cached background was filled with (the screen, then its unlit dots), and what its lit dots were drawn in.
function drawn(scr) {
  scr.cache = null; scr.dirty = true; scr.tick(1000, 16);
  return { bg: scr.cache.getContext().fills[0], off: scr.cache.getContext().fills[1], lit: new Set(scr.g.fills) };
}

test('0308 AC2: the badges and the Foreman\'s builder are drawn in shade C, and again after switching to dark and back', () => {
  const R = renderer();
  const screens = { badge: R.L.badge(R.canvas(), 'type', { still: true }).scr, foreman: R.L.mini(R.canvas(), false).scr };
  for (const look of ['light', 'dark', 'light']) {
    R.look(look);
    const want = look === 'light' ? LIGHT : DARK;
    for (const [name, scr] of Object.entries(screens)) {
      const d = drawn(scr);
      assert.equal(d.bg, want['--lcd-bg'], `${name}: the ${look} screen`);
      assert.equal(d.off, want['--lcd-off'], `${name}: the ${look} unlit dots`);
      assert.ok(d.lit.has(want['--lcd-ink']), `${name}: the ${look} ink`);
      if (look === 'light') assert.ok(d.lit.has(LIGHT['--lcd-shadow']), `${name}: the light look's shadow`);
    }
  }
});

// The icon's dots as they were before this ticket: icon.svg without its background, and each PNG's non-screen pixels.
const SVG_DOTS = 'debb96f37294889e0f1566ecebc5e64d7ebe8b455bf7a3d7d8c643d2ad506b32';
const PNG_DOTS = {
  'icon-192.png': '9cc84f4b022abed34966a279d22fe8738c49c4a309b560a93eeeae6a294d4dfe',
  'icon-512.png': '830d1619ba83f0b944098982dae3aaa5c9c1831d912d3b7913ce4e900aa4e170',
  'apple-touch-icon.png': '4e1c792a3a4d25f38bd02a44d1e306cc2fba55a0550ce75212af4652b2a3d257',
};

test('0308 AC3: the app icon\'s background is shade C, with its dots unchanged', () => {
  const svg = fs.readFileSync(path.join(ICONS, 'icon.svg'), 'utf8');
  const bg = /^ {2}<rect width="180" height="180" fill="(#[0-9a-f]{6})"\/>\n/m;
  assert.equal(svg.match(bg)?.[1], '#e6e9db', 'icon.svg');
  assert.equal(sha(svg.replace(bg, '')), SVG_DOTS, 'icon.svg: the same dots');
  for (const name of Object.keys(PNGS)) {
    const img = readPng(fs.readFileSync(path.join(ICONS, name))), out = [];
    assert.deepEqual(img.at(0, 0), [0xe6, 0xe9, 0xdb], `${name}: its background`);
    for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
      const p = img.at(x, y).join();
      if (p !== '230,233,219') out.push(`${x},${y}:${p}`);
    }
    assert.equal(sha(out.join(';')), PNG_DOTS[name], `${name}: the same dots`);
  }
});

test('0308 AC4: the dark look\'s colours and the design\'s renderer are unchanged', () => {
  assert.deepEqual(darkRule(), DARK);
  // The renderer as 0302 copied it from the design, and the panel's copy still the same file.
  const SHA = '39c97086e87535110d8a5fc9e057aa275438a60ffaabb72e2175aa109dbfcf49';
  assert.equal(sha(fs.readFileSync(path.join(ROOT, 'docs', 'design', 'lcd', 'lcd.js'))), SHA);
  assert.equal(sha(fs.readFileSync(path.join(ROOT, 'templates', 'lcd.js'))), SHA);
});
