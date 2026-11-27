import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { panelRepo, fm, good, freePort, startPanel, stop, findChrome, browserPage, openLane } from './support/panel.mjs';
import { swipe, leftFrom, widen, widenKept, middleOf, swipeChangesLane } from './support/swipe-0761.mjs';

// ---------- 0761: the lane lists never scroll sideways ----------
// In a real Chromium, with touch, as the criteria are about how the lists lay out and scroll: the fake page has no layout.

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const LISTS = ['capture', 'shaping', 'queue', 'shipped-list'];
const LANE_OF = { capture: 'capture', shaping: 'plan', queue: 'build', 'shipped-list': 'shipped' };
// A draft whose Builder fact is "Claude Code · Opus · medium" (0669), and one whose Problem has a code block too wide for a phone.
const CODE = 'x'.repeat(30) + ' ' + 'y'.repeat(200);
const withCode = good.replace('Users cannot export.', `Users cannot export.\n\n\`\`\`\n${CODE}\n\`\`\``);

let panel = null, page = null;
before(async () => {
  if (skip.skip) return;
  const r = panelRepo({ prefix: 'speck-keep-' }); // speck-keep-*: kept between this file's tests, which share it
  r.write('0002-long-builder.md', fm({ id: '"0002"', title: 'A draft with a long builder', status: 'draft', builder: 'claude', builder_model: 'opus', builder_effort: 'medium' }));
  r.write('0003-wide-code.md', fm({ id: '"0003"', title: 'A draft with wide code', status: 'draft' }), withCode);
  r.g('add', '-A'); r.g('commit', '-qm', 'drafts');
  panel = await startPanel(r.dir, ['--port', String(await freePort())]);
});
after(async () => { await page?.close(); if (panel) await stop(panel); });

// The page `width` px wide, as a phone with touch, loaded afresh, with Plan open and its rows drawn. The tests share one
// page, as a third page on the same panel in a file can wait for its board.
async function phone(width = 390) {
  if (!page) {
    page = await browserPage(`http://127.0.0.1:${panel.port}/`);
    await page.loaded();
    await page.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  } else {
    await page.js('window.before0761 = true');
    await page.send('Page.reload', {});
    await page.until('!window.before0761 && document.readyState === "complete"', 'the page to load again');
  }
  await page.send('Emulation.setDeviceMetricsOverride', { width, height: 800, deviceScaleFactor: 1, mobile: true });
  await page.until(`document.querySelectorAll('#shaping .item.ticket').length === 2`, 'the two drafts in Plan');
  await page.js(openLane('plan'));
  return page;
}
const lane = b => b.js(`document.querySelector('[role=tab][aria-selected=true]').id.replace('tab-', '')`);
const openRows = b => b.js(`[...document.querySelectorAll('#shaping .item.ticket:not(.open) .head')].forEach(h => h.click()), true`);
const waitFrames = b => b.js(`new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))`);
// ---------- AC1 ----------

test('0761 AC1: no lane\'s list can be scrolled sideways, by script, trackpad or touch, even with something wider in it, which is cut off at its edges', skip, async () => {
  const b = await phone(390);
  try {
    for (const id of LISTS) {
      await b.js(`document.getElementById('tab-${LANE_OF[id]}').click(), true`);
      await b.js(openLane(LANE_OF[id]));
      await b.js(widen(id));
      const s = await b.js(`(() => { const l = document.getElementById(${JSON.stringify(id)}); return { ox: getComputedStyle(l).overflowX, wider: l.scrollWidth > l.clientWidth }; })()`);
      assert.ok(s.wider, `${id}: the block is wider than the list`);
      assert.match(s.ox, /^(hidden|clip)$/, `${id}: what sticks out is cut off at the list's edges, rather than scrolled to`);
      // by script
      await b.js(`document.getElementById(${JSON.stringify(id)}).scrollLeft = 300, document.getElementById(${JSON.stringify(id)}).scrollBy(200, 0), true`);
      await waitFrames(b);
      assert.equal(await b.js(`document.getElementById(${JSON.stringify(id)}).scrollLeft`), 0, `${id}: a script scroll sideways goes straight back`);
      // by trackpad: a sideways wheel over the block
      const at = await middleOf(b, `#${id} .wide-0761`);
      await b.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: at[0], y: at[1], deltaX: 300, deltaY: 0 });
      await waitFrames(b);
      assert.equal(await b.js(`document.getElementById(${JSON.stringify(id)}).scrollLeft`), 0, `${id}: a sideways trackpad scroll`);
      // by touch: a slow drag sideways, then back to this lane
      await b.js(openLane(LANE_OF[id]));
      await swipe(b, Array.from({ length: 6 }, (_, i) => [at[0] - i * 8, at[1]]));
      await waitFrames(b);
      assert.equal(await b.js(`document.getElementById(${JSON.stringify(id)}).scrollLeft`), 0, `${id}: a sideways drag`);
    }
  } finally { /* the page is shared */ }
});

// ---------- AC2 ----------

test('0761 AC2: with something in Plan\'s list wider than it, a sideways swipe on the list changes lane, as it does with nothing wider', skip, async () => {
  const b = await phone(390);
  try {
    await swipeChangesLane(b, '#shaping .item.ticket', 'a swipe on a plain list to change lane to Build');
    await b.js(openLane('plan'));
    await b.js(widenKept('shaping'));
    assert.equal(await lane(b), 'plan');
    await swipeChangesLane(b, '#shaping .wide-0761', 'a swipe that starts on the wide block to change lane to Build');
    await b.js(openLane('plan'));
    await swipeChangesLane(b, '#shaping .item.ticket', 'a swipe that starts on a row of the wide list to change lane to Build');
  } finally { /* the page is shared */ }
});

// ---------- AC3 ----------

test('0761 AC3: a code block in an open ticket still scrolls sideways, and a swipe that starts on it scrolls it rather than changing lane', skip, async () => {
  const b = await phone(390);
  try {
    await openRows(b);
    await b.until(`!!document.querySelector('#shaping .md pre')`, 'the open draft\'s code block');
    const pre = await b.js(`(() => { const p = document.querySelector('#shaping .md pre'); p.scrollIntoView({ block: 'center' }); return { ox: getComputedStyle(p).overflowX, wider: p.scrollWidth > p.clientWidth }; })()`);
    assert.equal(pre.ox, 'auto');
    assert.ok(pre.wider, 'its line is wider than the block');
    await b.js(`document.querySelector('#shaping .md pre').scrollLeft = 50, true`);
    await waitFrames(b);
    assert.equal(await b.js(`document.querySelector('#shaping .md pre').scrollLeft`), 50, 'a script scrolls it');
    await b.js(`document.querySelector('#shaping .md pre').scrollLeft = 0, true`);
    await swipe(b, leftFrom(await middleOf(b, '#shaping .md pre')));
    await b.until(`document.querySelector('#shaping .md pre').scrollLeft > 0`, 'the swipe to scroll the code block');
    await waitFrames(b);
    assert.equal(await lane(b), 'plan', 'and the lane stays');
    assert.equal(await b.js(`document.getElementById('shaping').scrollLeft`), 0, 'and the list itself doesn\'t scroll sideways');
  } finally { /* the page is shared */ }
});

// ---------- AC4 ----------

for (const width of [375, 390]) {
  test(`0761 AC4: at ${width} px, no row in Plan, open or closed, is wider than its list, and the Builder fact stays inside its cell`, skip, async () => {
    const b = await phone(width);
    try {
      const measure = () => b.js(`(() => { const l = document.getElementById('shaping'), lr = l.getBoundingClientRect();
        return { overflow: l.scrollWidth - l.clientWidth, rows: [...l.children].map(n => ({ cls: n.className, right: n.getBoundingClientRect().right, wide: n.scrollWidth - n.clientWidth })), right: lr.right,
          builders: [...l.querySelectorAll('.set-builder')].map(n => { const c = n.closest('.fact').getBoundingClientRect(), r = n.getBoundingClientRect(); return { text: n.textContent, right: r.right, cell: c.right}; }) }; })()`);
      const check = (m, what) => {
        assert.equal(m.overflow, 0, `${what}: nothing in Plan's list runs past it`);
        for (const r of m.rows) {
          assert.ok(r.right <= m.right + 0.5, `${what}: the row "${r.cls}" ends at ${r.right}, past the list at ${m.right}`);
          assert.ok(r.wide <= 0, `${what}: the row "${r.cls}" has content ${r.wide} px wider than it`);
        }
      };
      check(await measure(), 'closed');
      await openRows(b);
      await b.until(`document.querySelectorAll('#shaping .item.ticket.open .set-builder').length === 2`, 'both drafts open, with their Builder facts');
      const m = await measure();
      check(m, 'open');
      const long = m.builders.find(x => x.text === 'Claude Code · Opus · medium');
      assert.ok(long, `the long Builder fact is there: ${JSON.stringify(m.builders.map(x => x.text))}`);
      assert.ok(long.right <= long.cell + 0.5, `it ends at ${long.right}, past its cell at ${long.cell}`);
    } finally { /* the page is shared */ }
  });
}
