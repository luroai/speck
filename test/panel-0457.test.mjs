import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rules, selectors, tokens } from './support/css.mjs';
import { panelRepo, freePort, startPanel, stop, findChrome, browserPage, fm, good, openLane } from './support/panel.mjs';
import { readPng } from './support/icons.mjs';

// ---------- 0457: the open tab and the lane under it are one sheet, like a file folder's tab ----------

const RS = rules();
// What the plain rules naming any of `sels` set, in the order they come (as 0428's tests read the cascade).
function resolve(sels) {
  const out = {};
  for (const r of RS) if (!r.at.length && selectors(r).some(s => sels.includes(s))) for (const [k, v] of r.decls) out[k] = v;
  return out;
}
// The colour token each side's border ends up with, from the shorthands and the longhands in the order they were set.
function colours(sels) {
  const side = { top: null, right: null, bottom: null, left: null };
  for (const r of RS) {
    if (r.at.length || !selectors(r).some(s => sels.includes(s))) continue;
    for (const [k, v] of r.decls) {
      const m = k.match(/^border(?:-(top|right|bottom|left))?(?:-color)?$/);
      if (!m || !tokens(v)[0]) continue;
      for (const d of m[1] ? [m[1]] : Object.keys(side)) side[d] = tokens(v)[0];
    }
  }
  return side;
}
const OPEN = ['button', '.tab', '.tab[aria-selected="true"]'], CLOSED = ['button', '.tab'];

test('0457 AC1 AC2 AC3: the open tab\'s bottom edge is the lane\'s colour, over the tab row\'s line; its other edges and the closed tabs\' are as before', () => {
  const open = resolve(OPEN);
  assert.deepEqual(colours(OPEN), { top: '--text', right: '--text', bottom: '--panel', left: '--text' }, 'the open tab: no line along its bottom');
  assert.deepEqual(colours(CLOSED), { top: '--line', right: '--line', bottom: '--line', left: '--line' }, 'a closed tab keeps all four edges');
  assert.equal(open['margin-bottom'], '-.5px', 'the open tab sits over the tab row\'s line');
  assert.equal(open['box-shadow'], '0 1px 0 var(--panel)', 'and its shadow, the lane\'s colour, covers what a browser draws of the line below that');
  assert.equal(open['z-index'], '1', 'and is drawn over it');
  assert.match(open.background, /^var\(--panel\)$/, 'AC2: the open tab is on --panel');
  assert.match(resolve(['section']).background, /^var\(--panel\)$/, 'AC2: and so is its lane');
  assert.match(resolve(['.tabs'])['border-bottom'], /var\(--line\)/, 'AC3: the line under the tab row stays');
  assert.equal(open['border-radius'], '8px 8px 0 0', 'AC3: its top corners stay rounded');
});

// A repo whose panel has something in each lane.
function repo() {
  const r = panelRepo();
  const iso = t => new Date(t).toISOString();
  r.write('0002-a.md', fm({ id: '"0002"', title: "'An approved ticket'", status: 'approved' }), good);
  r.write('0003-d.md', fm({ id: '"0003"', title: "'A draft to shape'", status: 'draft', priority: 2 }), good);
  r.write('0010-t.md', fm({ id: '"0010"', title: "'A shipped ticket'", status: 'done', started: iso(Date.now() - 3e6), finished: iso(Date.now() - 1e6) }), good, 'speck/tickets/done');
  r.g('add', '-A'); r.g('commit', '-qm', 'tickets');
  return r;
}
const frames = `new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))`;
const skip = findChrome() ? false : 'needs Chrome or Chromium';
const differs = (p, q) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]) >= 24;

test('0457 AC1 AC2 AC3 AC4: on a phone at a pixel ratio of 3, in both looks, no line shows under the open tab, whichever it is, and the line shows under the others', { skip }, async () => {
  const r = repo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  const DPR = 3;
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: DPR, mobile: true });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`document.readyState === 'complete' && !!document.querySelector('#shipped .details')`, 'the panel');
    await b.js(`document.fonts.ready.then(() => true)`);
    for (const look of ['light', 'dark']) {
      await b.js(`document.documentElement.dataset.theme = '${look}', true`);
      for (const lane of ['plan', 'build', 'shipped']) {
        await b.js(openLane(lane));
        await b.js(frames);
        const at = `${look} look, ${lane} open`;
        const m = await b.js(`(() => {
          const rect = n => { const r = n.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; };
          const row = document.getElementById('tabs').getBoundingClientRect();
          // AC2: the colour of whatever is drawn directly under the open tab, from the nearest element with a background
          const t = document.getElementById('tab-${lane}'), tr = t.getBoundingClientRect();
          let n = document.elementFromPoint((tr.left + tr.right) / 2, row.bottom + 2);
          while (n && getComputedStyle(n).backgroundColor === 'rgba(0, 0, 0, 0)') n = n.parentElement;
          return { row: rect(document.getElementById('tabs')), tabBg: getComputedStyle(t).backgroundColor, under: n && getComputedStyle(n).backgroundColor,
            tabs: ['plan', 'build', 'shipped'].map(l => ({ lane: l, open: document.getElementById('tab-' + l).getAttribute('aria-selected') === 'true', ...rect(document.getElementById('tab-' + l)) })) };
        })()`);
        assert.equal(m.tabBg, m.under, `${at}: the open tab is the colour of the lane under it`);
        assert.deepEqual(m.tabs.filter(t => t.open).map(t => t.lane), [lane], `${at}: only its tab is open`);
        const png = readPng(Buffer.from((await b.send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
        assert.equal(png.w, 390 * DPR, 'the picture is in device pixels');
        // The device pixels around the tab row's line, against the lane's own colour a few device pixels under it.
        const lineTop = Math.floor((m.row.bottom - 1) * DPR), lineBottom = Math.ceil(m.row.bottom * DPR);
        const below = Math.ceil(m.row.bottom * DPR) + 4;
        for (const t of m.tabs) {
          const L = Math.round(t.left * DPR), R = Math.round(t.right * DPR);
          const xs = []; for (let x = Math.ceil(L + (R - L) / 3); x <= Math.floor(R - (R - L) / 3); x++) xs.push(x);
          const lined = xs.filter(x => { for (let y = lineTop; y <= lineBottom; y++) if (differs(png.at(x, y), png.at(x, below))) return true; return false; }).length / xs.length;
          if (t.open) assert.equal(lined, 0, `${at}: no line under the open ${t.lane} tab (${(lined * 100).toFixed(0)}% of its middle)`);
          else assert.ok(lined >= 0.9, `${at}: the line shows under the closed ${t.lane} tab (${(lined * 100).toFixed(0)}% of its middle)`);
        }
      }
    }
  } finally { await b.close(); await stop(panel); }
});
