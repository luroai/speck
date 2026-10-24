import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, panelRepo, freePort, startPanel, stop, findChrome, browserPage, MONO_UI, monoFont } from './support/panel.mjs';

// ---------- 0441: the tests' browser draws the panel in a proportional font ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

test('0441 AC1: in the tests\' browser, the panel\'s interface font draws an i and an m at different widths', skip, async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage(`http://127.0.0.1:${panel.port}/`);
  try {
    await b.loaded();
    assert.equal(await b.js(MONO_UI), false, 'system-ui is proportional');
    assert.equal(await b.js(monoFont('17px sans-serif')), false, 'sans-serif is proportional');
    // the panel's own interface font, as its body sets it
    const body = await b.js(`getComputedStyle(document.body).fontFamily`);
    assert.match(body, /system-ui/, `the body is in the interface font: ${body}`);
    assert.equal(await b.js(monoFont(`700 17px ${body}`)), false, `the body's font is proportional: ${body}`);
    assert.equal(await b.js(monoFont('14px monospace')), true, 'monospace is still a monospace');
  } finally { await b.close(); await stop(panel); }
});

test('0441 AC2: the checks 0427 eased for a monospaced panel have no exception for one', () => {
  for (const f of ['panel-0151.test.mjs', 'panel-0155.test.mjs', 'panel-0419.test.mjs', 'panel-0420.test.mjs']) {
    const s = fs.readFileSync(path.join(ROOT, 'test', f), 'utf8');
    assert.doesNotMatch(s, /MONO_UI|monoUi/, `${f} asks nothing about a monospace interface font`);
  }
  const plan = fs.readFileSync(path.join(ROOT, 'test', 'panel-0151.test.mjs'), 'utf8');
  assert.match(plan, /t\.lines\.length <= most\b/, '0151: a title on at most the lines it allowed before 0427');
  const build = fs.readFileSync(path.join(ROOT, 'test', 'panel-0155.test.mjs'), 'utf8');
  assert.match(build, /ready\.lines\.length <= most\b/, '0155: a ready title on at most the lines it allowed before 0427');
  assert.match(build, /flying\.lines\.length <= most\b/, '0155: a building title on at most the lines it allowed before 0427');
  // the 375 px limit is 3 lines for everyone, as the user chose, and every other width keeps the limit it had before 0427
  for (const s of [plan, build]) assert.ok(s.includes('of [[375, 3], [699, 3], [700, 3], [1000, 3], [1279, 3], [1280, 1], [1440, 1]]'), 'the line limits');
});
