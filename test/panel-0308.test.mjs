import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ROOT, page, styles } from './support/panel.mjs';

// ---------- 0308: a lighter LCD screen in the panel's light look (shade C) ----------

const LIGHT = { '--lcd-bg': '#e6e9db', '--lcd-off': '#dde1cf', '--lcd-ink': '#20241d', '--lcd-red': '#d63f28', '--lcd-shadow': 'rgba(30, 40, 15, .14)' };
const DARK = { '--lcd-bg': '#0d130f', '--lcd-off': '#151d17', '--lcd-ink': '#cfe6c6', '--lcd-red': '#ff5a3f', '--lcd-shadow': 'transparent' };
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const tokens = rule => Object.fromEntries([...rule.matchAll(/(--lcd-[a-z]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
const css = () => styles();
const lightRule = () => tokens(css().match(/(?:^|\n) {2}:root \{([\s\S]*?)\n {2}\}/)[1]);
const darkRule = () => tokens(css().match(/(?:^|\n) {2}:root\[data-theme="dark"\] \{([\s\S]*?)\n {2}\}/)[1]);

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

// 0308 AC3 gave the app icon shade C's screen. Since 0320 the app icons are the design's logo in its own colours, so
// they're checked in logo-0320.test.mjs.

test('0308 AC4: the dark look\'s colours and the design\'s renderer are unchanged', () => {
  assert.deepEqual(darkRule(), DARK);
  // The renderer as copied from the design (since 0320, its new one with the logo), and the panel's copy the same file.
  const SHA = '3b0b714a151bb0bcbf6b453a135e02c5474878960142baec2472648c4f7049fb';
  assert.equal(sha(fs.readFileSync(path.join(ROOT, 'docs', 'design', 'lcd', 'lcd.js'))), SHA);
  assert.equal(sha(fs.readFileSync(path.join(ROOT, 'templates', 'lcd.js'))), SHA);
});
