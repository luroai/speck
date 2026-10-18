import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ICONS, PNGS, png, readPng, logo } from './support/icons.mjs';

// ---------- 0184: the logo's red dot is the builder's eye: larger, and just above the circle's centre ----------

const EYE = { cx: '31.7', cy: '33.2', r: '4.8' };
const SVG = () => fs.readFileSync(path.join(ICONS, 'icon.svg'), 'utf8');
const hex = c => `#${c.map(n => n.toString(16).padStart(2, '0')).join('')}`;
const attrs = s => Object.fromEntries([...s.matchAll(/([\w-]+)="([^"]*)"/g)].map(a => [a[1], a[2]]));
const circlesOf = svg => [...svg.matchAll(/<circle\b([^>]*)>/g)].map(m => attrs(m[1]));

test('0184 AC1: icon.svg\'s dot is the eye, in the same red, with the rest of the icon unchanged', () => {
  const svg = SVG();
  assert.equal(svg, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#faf9f5"/>
  <g transform="translate(0 -3)" fill="none" stroke="#141413" stroke-width="2.2" stroke-linecap="round">
    <path d="M14.5 22.5 A21.5 21.5 0 1 0 22 16.2"/>
    <path d="M12.6 19.8 a5.2 5.2 0 0 1 8.2 -5.6"/>
    <path d="M43.2 14.2 a5.2 5.2 0 0 1 8.2 5.6"/>
    <circle cx="31.7" cy="33.2" r="4.8" fill="#b0412e" stroke="none"/>
  </g>
</svg>
`);
  const [dot] = circlesOf(svg);
  assert.deepEqual({ cx: dot.cx, cy: dot.cy, r: dot.r, fill: dot.fill }, { ...EYE, fill: '#b0412e' });
});

test('0184 AC2: each PNG is made again from the new icon.svg, with the eye where the SVG draws it', () => {
  const L = logo(), [dx, dy] = L.at;
  for (const [name, size] of Object.entries(PNGS)) {
    const file = fs.readFileSync(path.join(ICONS, name));
    assert.ok(file.equals(png(size)), `${name} is drawn from icon.svg: make it again with writeIcons() in test/support/icons.mjs`);
    const img = readPng(file);
    const at = (u, v) => hex(img.at(Math.floor((u + dx) * size / 64), Math.floor((v + dy) * size / 64)));
    // The eye's centre and points well inside its edge are red; the old nose's spot, below it, is background now.
    for (const [u, v] of [[31.7, 33.2], [31.7 - 3.5, 33.2], [31.7 + 3.5, 33.2], [31.7, 33.2 - 3.5], [31.7, 33.2 + 3.5]]) {
      assert.equal(at(u, v), '#b0412e', `${name} has the eye at ${u},${v}`);
    }
    assert.equal(at(32, 40), '#faf9f5', `${name} has no dot where the old nose was`);
  }
});

// 0303: the header's mark is drawn on the LCD screen, from the renderer's still pose, so its checks are in
// panel-0303.test.mjs.
