import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, page, panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';
import { logo } from './support/icons.mjs';

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

// 0320 AC3 and AC4 made icon.svg and the PNGs the renderer's logo. Since 0594 they're speck as the Premium screen, so
// what they show is checked in icons-0594.test.mjs.

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
