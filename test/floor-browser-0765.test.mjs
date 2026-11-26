import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0765: the factory floor in a real browser, for what only a browser shows: how its stations and lanes lay out at a
// window's width, and a change in a project reaching the page by itself. Its address is started in this process, with
// stand-in panels.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, findChrome, browserPage } from './support/panel.mjs';
import { panelsHere } from './support/serve-front.mjs';
import { floorPanel, floorFront, summary, board } from './support/floor.mjs';

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

// A board with a card in every lane, some with long words, as a project's panel gives it.
const busyBoard = name => board({
  tickets: [
    T('0010', 'draft', { title: `Plan ${name}'s next step, with a title long enough to wrap onto a second line of its card` }),
    T('0020', 'building', { title: 'Build it', started: new Date(Date.now() - 6e5).toISOString() }),
    T('0021', 'ready', { title: 'Queued_with_a_very_long_unbroken_identifier_that_must_not_push_the_page_sideways' }),
    T('0030', 'done', { title: 'Shipped one', started: new Date(Date.now() - 3.6e6).toISOString(), finished: new Date(Date.now() - 6e5).toISOString() }),
  ],
  ideas: [{ path: 'speck/ideas/2026-11-20-a.md', title: 'An idea', status: 'idea', body: 'Captured: 2026-11-20 · Status: idea\n' }],
});

// How many rows and columns the lanes and the stations are in, from the distinct tops and lefts of their boxes, and
// whether the page is wider than its window.
const LAYOUT = `(() => {
  const count = (sel, side) => new Set([...document.querySelectorAll(sel)].map(n => Math.round(n.getBoundingClientRect()[side]))).size;
  return { laneRows: count('#lanes .lane', 'top'), laneCols: count('#lanes .lane', 'left'), stationRows: count('#stations .station', 'top'),
    stationCols: count('#stations .station', 'left'), sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth };
})()`;

async function floorOpen(t, names) {
  const dir = panelsHere(), panels = [];
  for (const name of names) {
    const p = await floorPanel(dir, name, { summary: summary({ status: 'Building 1', tone: 'ok', busy: true, building: 1, queued: 1, shipped_week: 1 }), board: busyBoard(name) });
    t.after(() => p.stop());
    panels.push(p);
  }
  const f = await floorFront(t, dir, () => panels.map(p => ({ folder: `/x/${p.name}`, name: p.name, port: p.port })));
  const b = await browserPage(`http://127.0.0.1:${f.port}/floor`);
  t.after(() => b.close());
  await b.loaded();
  await b.until(`document.querySelectorAll('#stations .station').length === ${names.length} && document.querySelectorAll('#lanes .lane').length === 4`, 'the stations and the lanes');
  return { b, panels };
}
const widen = async (b, width) => {
  await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
  await b.until(`window.innerWidth === ${width}`, `a window ${width} px wide`);
};

test('0765 AC4: in a real browser, the lanes are side by side and the stations in a row in a wide window, and under 1024 px two by two and in two rows, with no sideways scroll', skip, async t => {
  const { b } = await floorOpen(t, ['alpha', 'bravo', 'charlie', 'delta', 'echo']);
  for (const width of [1280, 1024]) {
    await widen(b, width);
    assert.deepEqual(await b.js(LAYOUT), { laneRows: 1, laneCols: 4, stationRows: 1, stationCols: 5, sideways: false }, `${width} px wide`);
  }
  for (const width of [1023, 800, 600]) {
    await widen(b, width);
    assert.deepEqual(await b.js(LAYOUT), { laneRows: 2, laneCols: 2, stationRows: 2, stationCols: 3, sideways: false }, `${width} px wide`);
  }
});

test('0765 AC4: in a real browser, a change in any project shows on the floor by itself within 5 seconds', skip, async t => {
  const { b, panels } = await floorOpen(t, ['alpha', 'bravo']);
  const [alpha, bravo] = panels;
  bravo.summary = summary({ status: 'Needs you 1', tone: 'bad', needs_you: 1 });
  await b.until(`document.querySelectorAll('#stations .station')[1].textContent.includes('Needs you 1')`, 'bravo\'s new state on its station', 5000);
  alpha.board = board({ ...busyBoard('alpha'), tickets: [...busyBoard('alpha').tickets, T('0022', 'ready', { title: 'One more' })] });
  await b.until(`[...document.querySelectorAll('#lanes .lane')][2].textContent.includes('One more')`, 'alpha\'s new ticket in its Build lane', 5000);
});
