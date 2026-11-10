import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, panelRepo, fm, good, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0481: the open lane in the strip has a bar under its name ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const headerCss = () => fs.readFileSync(path.join(ROOT, 'templates', 'panel-header.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
// The declarations of every plain rule in the header's styles whose selectors include `sel`.
const decls = sel => [...headerCss().matchAll(/([^{}]+)\{([^}]*)\}/g)].filter(m => m[1].split(',').map(s => s.trim()).includes(sel)).map(m => m[2]).join(';');

// 0582: the bar is under the whole tab now, in the accent; a transparent one under the others, so nothing moves.
test('0481 AC1: the open lane has a bar under it in the accent, the others none showing, and every name keeps its weight and size', () => {
  const open = decls('.tab[aria-selected="true"] .tab-name');
  assert.match(decls('.tab'), /border-bottom:\s*2px solid transparent/, 'each tab has room for the bar');
  assert.match(decls('.tab[aria-selected="true"]'), /border-bottom-color:\s*var\(--blue\)/, 'the open lane\'s shows, in the accent');
  assert.match(decls('.tab[aria-selected="true"]'), /color:\s*var\(--text\)/, 'the open lane in the text colour');
  assert.match(decls('.tab'), /color:\s*var\(--muted\)/, 'the others muted');
  assert.doesNotMatch(decls('.tab .tab-name'), /border/, 'no bar on the names themselves');
  assert.doesNotMatch(open, /font|letter-spacing|padding-(left|right)|margin/, 'the open name keeps its weight, size and width');
});

// The strip and each lane in it: the name's box, its bar, its colours and the button's box.
const measure = b => b.js(`(() => {
  const nav = document.getElementById('tabs'), r = nav.getBoundingClientRect();
  const probe = nav.appendChild(document.createElement('i'));
  probe.style.color = 'var(--blue)';
  const accent = getComputedStyle(probe).color;
  probe.remove();
  return { height: r.height, accent, bg: getComputedStyle(nav).backgroundColor, lanes: [...nav.querySelectorAll('[role="tab"]')].map(t => {
    const n = t.querySelector('.tab-name'), s = getComputedStyle(n), own = getComputedStyle(t), nb = n.getBoundingClientRect(), tb = t.getBoundingClientRect();
    return { id: t.id, open: t.getAttribute('aria-selected') === 'true', colour: getComputedStyle(t).color, weight: s.fontWeight, size: s.fontSize,
      bar: own.borderBottomStyle === 'none' || own.borderBottomColor === 'rgba(0, 0, 0, 0)' ? 0 : parseFloat(own.borderBottomWidth), barColour: own.borderBottomColor, barStyle: own.borderBottomStyle,
      nameLeft: nb.left, nameWidth: nb.width, textWidth: n.scrollWidth, left: tb.left, width: tb.width, height: tb.height };
  }) };
})()`);
const rgb = c => c.match(/[\d.]+/g).map(Number);
const lum = c => { const [r, g, bl, a = 1] = rgb(c); return [r, g, bl].map(v => v / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0) * a; };

test('0481 AC1–AC4: in a real browser at 390 px, in both looks, the bar is under the open lane only, shows without colour, follows each change of lane and the refresh, and nothing moves', skip, async () => {
  const r = panelRepo();
  r.write('0010-ready.md', fm({ id: '"0010"', title: 'Ready ticket', status: 'ready' }), good);
  r.write('0020-draft.md', fm({ id: '"0020"', title: 'Draft ticket', status: 'draft' }), good);
  r.write('0030-done.md', fm({ id: '"0030"', title: 'Shipped ticket', status: 'done' }), good, 'speck/tickets/done');
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage(`http://127.0.0.1:${panel.port}/`);
  try {
    await b.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    await b.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 700, deviceScaleFactor: 1, mobile: true });
    await b.until(`!!document.querySelector('#queue .id') && !!document.querySelector('#shaping .item')`, 'the board');
    await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 690 }); // off the strip
    let first;
    const check = async (lane, at) => {
      await b.until(`document.getElementById('tab-${lane}').getAttribute('aria-selected') === 'true' && !document.querySelector('main').dataset.slide`, `${at}: ${lane} to open`, 3000);
      const s = await measure(b);
      assert.ok(s.height >= 44 && s.height <= 45, `${at}: the strip is ${s.height} px tall`);
      for (const l of s.lanes) {
        assert.ok(l.width >= 44 && l.height >= 44, `${at}, ${l.id}: ${l.width} × ${l.height} px`);
        assert.equal(l.weight, '600', `${at}, ${l.id}: its weight`);
        assert.equal(l.size, '14px', `${at}, ${l.id}: its size`);
        if (l.open) {
          assert.ok(l.bar >= 2, `${at}, ${l.id}: a bar ${l.bar} px tall under it`);
          assert.equal(l.barStyle, 'solid');
          assert.equal(l.barColour, s.accent, `${at}, ${l.id}: the bar in the accent`);
          // AC2: with the colours removed, only lightness is left: the bar stands out from the strip behind it
          const [hi, lo] = [lum(l.barColour), lum(s.bg)].sort((x, y) => y - x);
          assert.ok((hi + 0.05) / (lo + 0.05) >= 3, `${at}, ${l.id}: the bar shows without its colour (${l.barColour} on ${s.bg})`);
        } else assert.equal(l.bar, 0, `${at}, ${l.id}: no bar`);
      }
      const open = s.lanes.find(l => l.open);
      assert.ok(s.lanes.filter(l => !l.open).every(l => l.colour !== open.colour), `${at}: the others stay muted`);
      const where = s.lanes.map(l => [l.left, l.width, l.nameLeft]); // 0609: Build has no needs-you number
      if (!first) first = where;
      else assert.deepEqual(where, first, `${at}: nothing in the strip moved`);
    };
    const key = async k => { for (const type of ['rawKeyDown', 'keyUp']) await b.send('Input.dispatchKeyEvent', { type, key: k, code: k, windowsVirtualKeyCode: k === 'ArrowLeft' ? 37 : 39 }); };
    const middle = () => b.js(`(() => { const r = document.querySelector('main').getBoundingClientRect(); return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)]; })()`);
    const swipe = async dir => { // a quick swipe a third of the card's width: -1 to the lane on the right
      const [x, y] = await middle(), w = await b.js(`document.querySelector('main').getBoundingClientRect().width`), start = Date.now() / 1000;
      const pts = Array.from({ length: 5 }, (_, i) => [x - (dir * w) / 6 + (dir * w * i) / 12, y]);
      for (const [i, [px, py]] of pts.entries()) await b.send('Input.dispatchTouchEvent', { type: i ? 'touchMove' : 'touchStart', touchPoints: [{ x: px, y: py, id: 1 }], timestamp: start + i / 100 });
      await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [], timestamp: start + 0.05 });
    };
    for (const look of ['light', 'dark']) {
      await b.js(`document.documentElement.dataset.theme = '${look}', 1`);
      first = null; // each look has its own colours
      await check('build', `${look}, as it opens`);
      await b.js(`document.getElementById('tab-plan').click(), 1`);
      await check('plan', `${look}, pressing Plan`);
      await b.js('document.activeElement.blur(), 1');
      await key('ArrowRight');
      await check('build', `${look}, →`);
      await key('ArrowRight');
      await check('shipped', `${look}, → again`);
      await key('ArrowLeft');
      await check('build', `${look}, ←`);
      await swipe(-1);
      await check('shipped', `${look}, a swipe left`);
      await swipe(1);
      await check('build', `${look}, a swipe right`);
      // After the 2-second refresh, the bar is still under the open lane
      await b.js(`document.getElementById('tab-plan').click(), 1`);
      await check('plan', `${look}, pressing Plan again`);
      // the board changes, so the panel fetches it again and draws it afresh
      await b.js(`window.__drawn = document.querySelectorAll('#shaping .item').length, 1`);
      r.write(`00${look === 'light' ? 40 : 50}-draft.md`, fm({ id: `"00${look === 'light' ? 40 : 50}"`, title: 'Another draft', status: 'draft' }), good);
      await b.until(`document.querySelectorAll('#shaping .item').length > window.__drawn`, 'the refresh to draw the new ticket', 10000);
      await check('plan', `${look}, after the refresh`);
      await b.js(`document.getElementById('tab-build').click(), 1`);
      await check('build', `${look}, back to Build`);
    }
  } finally { await b.close(); await stop(panel); }
});
