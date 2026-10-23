import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, page, panelRepo, freePort, startPanel, stop, raw, styles } from './support/panel.mjs';

// ---------- 0302: the builder badge on the LCD screen, drawn by the design's own renderer ----------
// 0416: the cards have no badge now. The renderer and its colours stay, for speck's screen (0413).

// 0320: the design's new renderer, with its logo.
const SHA = '3b0b714a151bb0bcbf6b453a135e02c5474878960142baec2472648c4f7049fb';
const sha = b => crypto.createHash('sha256').update(b).digest('hex');

test('0302 AC1: the panel serves the design\'s renderer unchanged, from its own copy of docs/design/lcd/lcd.js', async () => {
  const design = fs.readFileSync(path.join(ROOT, 'docs', 'design', 'lcd', 'lcd.js'));
  assert.equal(sha(design), SHA, 'the design file is the one the ticket names');
  assert.equal(sha(fs.readFileSync(path.join(ROOT, 'templates', 'lcd.js'))), SHA, 'the copy that ships with speck is the same file');
  assert.match(page(), /<script src="\/lcd\.js"><\/script>\s*<script>/, 'the page loads it before its own script');
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    const res = await raw(panel.port, '/lcd.js');
    assert.equal(res.status, 200);
    assert.match(String(res.headers['content-type']), /^text\/javascript\b/);
    assert.equal(sha(res.body), SHA, 'the copy the page loads');
  } finally { await stop(panel); }
});

// The page's CSS custom properties in a rule, as { name: value }.
const tokens = rule => Object.fromEntries([...rule.matchAll(/(--lcd-[a-z]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
// The light look's screen and unlit dots are lighter since 0308.
const LIGHT = { '--lcd-bg': '#e6e9db', '--lcd-off': '#dde1cf', '--lcd-ink': '#20241d', '--lcd-red': '#d63f28', '--lcd-shadow': 'rgba(30, 40, 15, .14)' };
const DARK = { '--lcd-bg': '#0d130f', '--lcd-off': '#151d17', '--lcd-ink': '#cfe6c6', '--lcd-red': '#ff5a3f', '--lcd-shadow': 'transparent' };

test('0302 AC3: the page has the screen\'s colours as tokens, with the design\'s values in the light and dark looks', () => {
  const css = styles();
  assert.deepEqual(tokens(css.match(/(?:^|\n) {2}:root \{([\s\S]*?)\n {2}\}/)[1]), LIGHT);
  assert.deepEqual(tokens(css.match(/(?:^|\n) {2}:root\[data-theme="dark"\] \{([\s\S]*?)\n {2}\}/)[1]), DARK);
});
