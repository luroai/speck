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
const name = () => rule('.bezel .name'); // 0413: in the title row of speck's screen's frame

test('0304 AC1: the header\'s "speck" is its own element, set in Doto at weight 900, at 20 px since 0413', () => {
  assert.match(page(), /<div class="print"><b class="name">speck<\/b><span class="repo">/); // 0413: first in the title row of speck's screen's frame
  const r = name();
  assert.ok(r, 'a rule for the name');
  assert.match(get(r, 'font-family'), /^"Doto",/, 'Doto first');
  assert.equal(get(r, 'font-weight'), '900');
  assert.equal(get(r, 'font-size'), '20px', 'the size 0413 sets speck at, in the frame\'s title row');
  assert.equal(get(r, 'line-height'), '1', 'no taller a line than its size, so the header keeps its height');
});

test('0304 AC2: the panel serves Doto itself, from the repo\'s own copy, with its licence beside it', async () => {
  const font = fs.readFileSync(FONT);
  assert.equal(font.subarray(0, 4).toString('hex'), '00010000', 'a TrueType font');
  assert.match(fs.readFileSync(path.join(ROOT, 'templates', 'fonts', 'OFL.txt'), 'utf8'), /SIL OPEN FONT LICENSE Version 1\.1/);
  const f = face();
  assert.ok(f, 'an @font-face for Doto');
  assert.match(get(f, 'src'), /^url\("\/fonts\/Doto\.ttf"\) format\("truetype"\)$/, 'loaded from the panel, not the internet');
  assert.doesNotMatch((page() + styles()), /fonts\.(googleapis|gstatic)\.com/, 'nothing fetched from Google Fonts');
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  try {
    const res = await raw(panel.port, '/fonts/Doto.ttf');
    assert.equal(res.status, 200);
    assert.equal(res.headers['content-type'], 'font/ttf');
    assert.ok(Buffer.from(res.body).equals(font), 'the repo\'s file, byte for byte');
  } finally { await stop(panel); }
});

test('0304 AC2: when Doto can\'t load, the title falls back to a monospace font', () => {
  assert.match(get(name(), 'font-family'), /, ui-monospace, monospace$/);
  assert.equal(get(face(), 'font-display'), 'swap', 'the fallback shows while Doto loads, rather than no title');
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

test('0304 AC1, AC2 and AC4: in a real browser, Doto loads from the panel and the header keeps its height, in both looks, wide and narrow', skip, async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    for (const width of [1280, 320]) {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 800, deviceScaleFactor: 1, mobile: width < 700 });
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
      await b.until(`document.readyState === 'complete' && !!document.querySelector('.bezel .name')`, 'the panel');
      for (const look of ['light', 'dark']) {
        if ((await b.js('document.documentElement.dataset.theme')) !== look) await b.js(`setLook(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark')`);
        await b.until(`document.documentElement.dataset.theme === '${look}'`, `the ${look} look`);
        const m = await b.js(MEASURE);
        const at = `${width} px, ${look}: ${JSON.stringify(m)}`;
        assert.ok(m.loaded, `Doto loaded, from the panel: ${at}`); // 0413: "speck" shows at every width
        assert.match(m.font, /^Doto,/, at);
        assert.equal(m.header, m.serif, `the header is as tall as with the old serif title: ${at}`);
        assert.ok(m.width <= m.view, `nothing past the right edge: ${at}`);
      }
    }
  } finally { await b.close(); await stop(panel); }
});
