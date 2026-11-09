import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, page, panelRepo, freePort, startPanel, stop, raw, findChrome, browserPage, styles } from './support/panel.mjs';
import { rules, rule, get } from './support/css.mjs';

// ---------- 0304: the panel's title in the LCD design's dot-matrix lettering, Doto ----------

const FONT = path.join(ROOT, 'templates', 'fonts', 'Doto.ttf');
const face = () => rules().find(r => r.sel === '@font-face' && /"Doto"/.test(get(r, 'font-family') || ''));

test('0304 AC2: the panel serves Doto itself, from the repo\'s own copy, with its licence beside it', async () => {
  const font = fs.readFileSync(FONT);
  assert.equal(font.subarray(0, 4).toString('hex'), '00010000', 'a TrueType font');
  assert.match(fs.readFileSync(path.join(ROOT, 'templates', 'fonts', 'OFL.txt'), 'utf8'), /SIL OPEN FONT LICENSE Version 1\.1/);
  const f = face();
  assert.ok(f, 'an @font-face for Doto');
  assert.match(get(f, 'src'), /^url\("fonts\/Doto\.ttf"\) format\("truetype"\)$/, 'loaded from the panel, not the internet');
  assert.doesNotMatch((page() + styles()), /fonts\.(googleapis|gstatic)\.com/, 'nothing fetched from Google Fonts');
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  try {
    const res = await raw(panel.port, '/fonts/Doto.ttf');
    assert.equal(res.status, 200);
    assert.equal(res.headers['content-type'], 'font/ttf');
    assert.ok(Buffer.from(res.body).equals(font), 'the repo\'s file, byte for byte');
  } finally { await stop(panel); }
});

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

// The header and the title, measured as they are, then with the title back in the old serif.
const MEASURE = `(async () => {
  await document.fonts.ready;
  const n = document.querySelector('.bezel .name'), h = () => document.querySelector('header').getBoundingClientRect().height;
  const box = e => { const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, right: r.right, mid: r.top + r.height / 2 }; };
  const now = { header: h(), name: box(n), font: getComputedStyle(n).fontFamily,
    loaded: document.fonts.check('900 18px Doto'), width: document.documentElement.scrollWidth, view: innerWidth };
  n.style.font = '600 18px "Shippori Mincho", "Noto Serif JP", Georgia, serif';
  const serif = h();
  n.style.font = '';
  return { ...now, serif };
})()`;

