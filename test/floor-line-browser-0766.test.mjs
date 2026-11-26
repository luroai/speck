import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0766: the line on the factory floor in a real browser, for what only a browser shows: that under 1024 px it scrolls
// sideways inside its own box, and the page doesn't. Its address is started in this process, with stand-in panels.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findChrome, browserPage } from './support/panel.mjs';
import { panelsHere } from './support/serve-front.mjs';
import { floorPanel, floorFront, summary, board } from './support/floor.mjs';
import { lineOf } from './support/floor-line.mjs';

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

const WIDTHS = `(() => {
  const box = document.getElementById('line'), page = document.documentElement;
  return { box: box.scrollWidth > box.clientWidth, page: page.scrollWidth > page.clientWidth, scrolls: getComputedStyle(box).overflowX };
})()`;

test('0766 AC4: in a real browser, under 1024 px the line scrolls sideways inside its own box, and the page doesn\'t', skip, async t => {
  const dir = panelsHere(), panels = [];
  for (const name of ['alpha', 'bravo']) {
    const p = await floorPanel(dir, name, { summary: summary({ status: 'Building 2', tone: 'ok', busy: true, building: 2, mood: 'focused', line: lineOf() }), board: board() });
    t.after(() => p.stop());
    panels.push(p);
  }
  const f = await floorFront(t, dir, () => panels.map(p => ({ folder: `/x/${p.name}`, name: p.name, port: p.port })));
  const b = await browserPage(`http://127.0.0.1:${f.port}/floor`);
  t.after(() => b.close());
  await b.loaded();
  await b.until(`document.querySelectorAll('#line .line-row').length === 2 && document.querySelectorAll('#line .slot.lit').length === 8`, 'the line with its work');
  for (const width of [800, 600]) {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await b.until(`window.innerWidth === ${width}`, `a window ${width} px wide`);
    assert.deepEqual(await b.js(WIDTHS), { box: true, page: false, scrolls: 'auto' }, `${width} px wide`);
  }
  await b.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await b.until('window.innerWidth === 1440', 'a window 1440 px wide');
  assert.equal((await b.js(WIDTHS)).page, false, 'nor in a wide window');
});
