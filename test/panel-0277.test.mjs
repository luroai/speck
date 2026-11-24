import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0277: line up the Settings view's info buttons. 0729: there are none now: its names and controls line up,
// as Cursor's settings line them up. Only a real browser lays the view out. ----------

// Each block's rows as laid out: where its name starts and its control ends, from the block's own edges inside its
// padding, how far apart they are, and whether the control went under the name.
const MEASURE = `(() => [...document.querySelectorAll('#settings .sgroup, #settings .switches')].flatMap(g => [...g.querySelectorAll('.block')].map(block => {
  const c = getComputedStyle(block), b = block.getBoundingClientRect(), left = b.left + parseFloat(c.paddingLeft), right = b.right - parseFloat(c.paddingRight);
  return { title: g.querySelector('h4').textContent, rows: [...block.querySelectorAll('.setting:not(.model) > .row, .switch-row > .row')].filter(r => r.getClientRects().length).map(row => {
    const label = row.querySelector(':scope > .label').getBoundingClientRect(), control = row.querySelector(':scope > .control').getBoundingClientRect();
    return { name: row.querySelector('.name').textContent, label: label.left - left, control: right - control.right, gap: control.left - label.right, under: control.top >= label.bottom - 0.5 };
  }) };
})))()`;

const skip = findChrome() ? false : 'needs Chrome or Chromium';
test('0277 AC1, AC2, AC5: at every width, each name starts at its block\'s edge, each control ends at the other, and a control beside its name is clear of it (0729)', { skip }, async () => {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    let under = 0;
    for (const width of [320, 400, 1200]) {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 2400, deviceScaleFactor: 1, mobile: width < 900 });
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/?w=${width}` });
      await b.until(`location.search === '?w=${width}' && document.readyState === 'complete'`, 'the panel');
      await b.js(`document.getElementById('settings-open').click()`);
      await b.until(`document.querySelectorAll('#settings .setting').length >= 10`, 'the settings');
      const blocks = (await b.js(MEASURE)).filter(k => k.rows.length);
      assert.ok(blocks.length >= 4, 'the view has its blocks of settings');
      for (const k of blocks) {
        for (const o of k.rows) {
          const at = `${width} px, ${k.title}, ${o.name}`;
          if (o.under) under++;
          // AC1: every name starts at its block's edge, a wrapped one's too
          assert.ok(Math.abs(o.label) < 0.5, `${at}: its name starts ${o.label} px from the block's edge`);
          // AC5: every control ends at the block's other edge, beside its name or under it
          assert.ok(Math.abs(o.control) < 0.5, `${at}: its control ends ${o.control} px from the block's edge`);
          // AC2: clear of the name beside it
          if (!o.under) assert.ok(o.gap >= 12 - 0.01, `${at}: its control is ${o.gap} px from its name`);
        }
      }
    }
    assert.ok(under > 0, 'some control goes under its name at the narrow widths, so that case is checked too');
  } finally { await b.close(); await stop(panel); }
});
