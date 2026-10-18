import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { page } from './support/panel.mjs';
import { ICONS } from './support/icons.mjs';

// ---------- 0305: the app icon is speck on the LCD screen, as the header's mark (0303) draws it ----------

// 0305 AC1 to AC3 made the app icon the header's mark on the LCD screen, from the renderer's still tile. Since 0320 the
// header's mark and the icons are the design's own logo, so what they show is checked in logo-0320.test.mjs, along
// with the PNGs' sizes.

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
