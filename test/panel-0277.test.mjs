import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0277: line up the Settings view's info buttons. Only a real browser lays the view out. ----------

// Each group's rows as laid out: where its info button and control start, the gaps and sizes, and whether any part of
// a setting's name is split across lines.
const MEASURE = `(() => [...document.querySelectorAll('#settings .sgroup')].map(g => {
  const left = g.getBoundingClientRect().left;
  const controls = [...g.querySelectorAll('.setting .control > *')].filter(n => !n.matches('.default') && n.getClientRects().length)
    .map(n => n.getBoundingClientRect().height);
  return { title: g.querySelector('h4').textContent, controls, rows: [...g.querySelectorAll('.setting .row')].map(row => {
    const info = row.querySelector('.info'), i = info.getBoundingClientRect(), c = row.querySelector('.control').getBoundingClientRect();
    const name = row.querySelector('.name');
    const parts = [...name.querySelectorAll('span')];
    // the button's target: every point of a 24 by 24 px square around its middle reaches it
    const mx = i.left + i.width / 2, my = i.top + i.height / 2;
    const target = [[-11.5, -11.5], [11.5, -11.5], [-11.5, 11.5], [11.5, 11.5], [0, 0]].every(([dx, dy]) => {
      const hit = document.elementFromPoint(mx + dx, my + dy);
      return hit === info || info.contains(hit);
    });
    return { name: name.textContent, info: i.left - left, control: c.left - left, gap: c.left - i.right, height: i.height, target,
      lines: new Set(parts.map(s => Math.round(s.getBoundingClientRect().top))).size,
      split: parts.filter(s => s.getClientRects().length > 1).map(s => s.textContent) };
  }) };
}))()`;

const skip = findChrome() ? false : 'needs Chrome or Chromium';
test('0277 AC1–AC5: at every width, info buttons line up, sit clear of the values, match the controls, and names wrap only at _ or .', { skip }, async () => {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    let wrapped = 0;
    for (const width of [320, 400, 1200]) {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 2400, deviceScaleFactor: 1, mobile: width < 900 });
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/?w=${width}` });
      await b.until(`location.search === '?w=${width}' && document.readyState === 'complete'`, 'the panel');
      await b.js(`document.getElementById('settings-open').click()`);
      await b.until(`document.querySelectorAll('#settings .setting').length >= 10`, 'the settings');
      const groups = await b.js(MEASURE);
      assert.ok(groups.length >= 2, 'the view has its groups');
      for (const g of groups) {
        const at = `${width} px, ${g.title}`;
        const first = g.rows[0];
        for (const o of g.rows) {
          if (o.lines > 1) wrapped++;
          // AC1: every info button in the group starts at the same place, a wrapped name's too
          assert.ok(Math.abs(o.info - first.info) < 0.5, `${at}: ${o.name}'s info button at ${o.info} px, not ${first.info} px`);
          // AC2: clear of the value
          assert.ok(o.gap >= 8 - 0.01, `${at}: ${o.name}'s info button is ${o.gap} px from its value`);
          // AC3: no taller than the group's controls, with a 24 by 24 px target
          assert.ok(g.controls.length, `${at}: the group has controls`);
          assert.ok(g.controls.every(h => o.height <= h + 0.01), `${at}: ${o.name}'s info button is ${o.height} px tall, its controls ${g.controls.join(', ')} px`);
          assert.ok(o.target, `${at}: ${o.name}'s info button has a 24 by 24 px target`);
          // AC4: no part of a name is broken in the middle
          assert.deepEqual(o.split, [], `${at}: ${o.name} breaks only after _ or .`);
          // AC5: controls still line up
          assert.ok(Math.abs(o.control - first.control) < 0.5, `${at}: ${o.name}'s control at ${o.control} px, not ${first.control} px`);
        }
      }
    }
    assert.ok(wrapped > 0, 'some long name wraps at the narrow widths, so AC1 is checked on a wrapped name');
  } finally { await b.close(); await stop(panel); }
});
