import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { page } from './support/panel.mjs';
import { ICONS, PNGS, LCD, markDots, png, readPng } from './support/icons.mjs';

// ---------- 0305: the app icon is speck on the LCD screen, as the header's mark (0303) draws it ----------

const SVG = () => fs.readFileSync(path.join(ICONS, 'icon.svg'), 'utf8');
const hex = c => `#${c.map(n => n.toString(16).padStart(2, '0')).join('')}`;
const attrs = s => Object.fromEntries([...s.matchAll(/([\w-]+)="([^"]*)"/g)].map(a => [a[1], a[2]]));
const OPTIONS = "LCD.PANEL, 'still', { cols: 16, rows: 16, k: .3, ox: 8, oy: 15, still: true }";

// icon.svg's dots: each <rect> inside a <g fill>, with its colour.
const svgDots = svg => [...svg.matchAll(/<g fill="(#[0-9a-f]{6})">([\s\S]*?)<\/g>/g)]
  .flatMap(g => [...g[2].matchAll(/<rect\b([^>]*)\/>/g)].map(r => ({ ...attrs(r[1]), fill: g[1] })));
// The dots laid back onto a grid by their spacing, as rows of '.', '#' and 'R', trimmed to the lit ones.
function grid(dots) {
  const xs = dots.map(d => +d.x), ys = dots.map(d => +d.y), x0 = Math.min(...xs), y0 = Math.min(...ys);
  const steps = v => [...new Set(v)].sort((a, b) => a - b).flatMap((n, i, a) => (i ? [n - a[i - 1]] : []));
  const pitch = Math.min(...steps(xs), ...steps(ys));
  const cols = (Math.max(...xs) - x0) / pitch + 1, rows = (Math.max(...ys) - y0) / pitch + 1;
  const g = Array.from({ length: rows }, () => Array(cols).fill('.'));
  for (const d of dots) g[(+d.y - y0) / pitch][(+d.x - x0) / pitch] = d.fill === LCD.red ? 'R' : '#';
  return { rows: g.map(r => r.join('')), pitch };
}
// The renderer's dots, trimmed to the lit ones.
function trimmed(rows) {
  const lit = rows.map((r, y) => [...r].some(c => c !== '.') ? y : -1).filter(y => y >= 0);
  const cols = rows.flatMap(r => [...r].flatMap((c, x) => (c === '.' ? [] : [x])));
  return rows.slice(lit[0], lit.at(-1) + 1).map(r => r.slice(Math.min(...cols), Math.max(...cols) + 1));
}
// Each pixel's colour in a PNG, and the box its non-screen pixels fill.
function pixels(name) {
  const img = readPng(fs.readFileSync(path.join(ICONS, name)));
  const at = (x, y) => hex(img.at(x, y));
  let left = img.w, top = img.h, right = -1, bottom = -1;
  const colours = new Set();
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const c = at(x, y); colours.add(c);
    if (c !== LCD.bg) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
  }
  return { img, at, colours, margins: { left, top, right: img.w - 1 - right, bottom: img.h - 1 - bottom } };
}

test('0305 AC1: the dots are the header\'s mark, from the renderer\'s still tile', () => {
  assert.ok(page().includes(`LCD.tile($('mark'), ${OPTIONS})`), 'the header draws its mark with the same tile');
  const dots = markDots();
  assert.equal(dots.length, 16);
  assert.ok(dots.every(r => r.length === 16));
  assert.ok(dots.join('').includes('R') && dots.join('').includes('#'), 'ink and red dots');
});

test('0305 AC1: icon.svg is the mark\'s dots, as ink and red squares on the light look\'s screen, with no script', () => {
  const svg = SVG();
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 (\d+) \1"/);
  const size = +svg.match(/viewBox="0 0 (\d+)/)[1];
  assert.match(svg, new RegExp(`<rect width="${size}" height="${size}" fill="${LCD.bg}"/>`), 'the screen fills the icon');
  assert.doesNotMatch(svg, /<script|on\w+=|<path|<circle/i, 'only squares, and no script');
  const dots = svgDots(svg);
  assert.ok(dots.every(d => d.width === d.height), 'every dot is square');
  assert.equal(new Set(dots.map(d => d.width)).size, 1, 'every dot is the same size');
  assert.deepEqual([...new Set(dots.map(d => d.fill))].sort(), [LCD.ink, LCD.red].sort());
  const { rows, pitch } = grid(dots);
  assert.deepEqual(rows, trimmed(markDots()), 'the same dots as the header\'s mark');
  assert.ok(+dots[0].width < pitch, 'a gap between dots, as on the screen');
});

test('0305 AC1: each PNG is the mark\'s dots in ink and red on the screen colour, drawn the same way as icon.svg', () => {
  for (const [name, size] of Object.entries(PNGS)) {
    const file = fs.readFileSync(path.join(ICONS, name));
    assert.ok(file.equals(png(size)), `${name} is drawn from the mark: make it again with writeIcons() in test/support/icons.mjs`);
    const { at, margins } = pixels(name);
    // Read the dots back from the pixels: the mark spans 13 × 15 dots, so its pitch is its height over 15 rows.
    const want = trimmed(markDots()), h = size - margins.top - margins.bottom, pitch = Math.round(h / want.length);
    const got = want.map((r, y) => [...r].map((_, x) => {
      const c = at(margins.left + x * pitch + 2, margins.top + y * pitch + 2);
      return c === LCD.red ? 'R' : c === LCD.ink ? '#' : '.';
    }).join(''));
    assert.deepEqual(got, want, `${name} shows the mark's dots`);
  }
});

test('0305 AC2: the mark sits with the same margin top and bottom, and left and right, clear of rounded corners', () => {
  const svg = SVG(), size = +svg.match(/viewBox="0 0 (\d+)/)[1], dots = svgDots(svg);
  const edge = (k, w) => [Math.min(...dots.map(d => +d[k])), size - Math.max(...dots.map(d => +d[k] + +d[w]))];
  const [l, r] = edge('x', 'width'), [t, b] = edge('y', 'height');
  assert.equal(l, r, 'icon.svg: left and right');
  assert.equal(t, b, 'icon.svg: top and bottom');
  for (const name of Object.keys(PNGS)) {
    const { img, margins: m } = pixels(name);
    assert.equal(m.left, m.right, `${name}: left and right`);
    assert.equal(m.top, m.bottom, `${name}: top and bottom`);
    // A phone's rounded corner takes about 22% of the side as its radius, so it cuts in about 7% at the corner.
    assert.ok(Math.min(m.left, m.top) >= 0.1 * img.w, `${name}: a margin of ${Math.min(m.left, m.top)} px`);
    // The mark fills the icon: its tallest side takes most of it.
    assert.ok(Math.max(img.w - m.left - m.right, img.h - m.top - m.bottom) >= 0.65 * img.w, `${name} is filled`);
  }
});

test('0305 AC3: the PNGs are 192, 512 and 180 pixels square, RGB, with sharp dot edges', () => {
  assert.deepEqual(PNGS, { 'icon-192.png': 192, 'icon-512.png': 512, 'apple-touch-icon.png': 180 });
  for (const [name, size] of Object.entries(PNGS)) {
    const { img, colours } = pixels(name);
    assert.deepEqual([img.w, img.h], [size, size], name);
    assert.equal(img.type, 2, `${name} is RGB, with no alpha channel`);
    // Sharp: no blend of colours at a dot's edge, only the screen, the ink and the red.
    assert.deepEqual([...colours].sort(), [LCD.bg, LCD.ink, LCD.red].sort(), `${name} has only the three colours`);
  }
});

test('0305 AC4: the manifest and the page\'s icon links are as they were', () => {
  const m = JSON.parse(fs.readFileSync(path.join(ICONS, 'manifest.webmanifest'), 'utf8'));
  assert.deepEqual(m.icons, [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
  ]);
  assert.deepEqual([m.background_color, m.theme_color], ['#faf9f5', '#faf9f5']);
  const head = (page().match(/<head>([\s\S]*?)<\/head>/) || [])[1] || '';
  for (const link of ['<link rel="icon" href="/icon.svg" type="image/svg+xml">',
    '<link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192">',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">']) assert.ok(head.includes(link), link);
});
