import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';
import { rules, rule, get } from './support/css.mjs';

// ---------- 0309: a larger mark and title in the header ----------

// Every rule for a selector, in any at-rule, so a phone's own size can't undo the header's.
const all = sel => rules().filter(r => r.sel.split(',').map(s => s.trim()).includes(sel));

test('0309 AC1: the header\'s mark is 32 px square, two screen pixels for each of its 16 × 16 dots', () => {
  const r = rule('.logo .mark');
  assert.equal(get(r, 'width'), '32px');
  assert.equal(get(r, 'height'), '32px');
  for (const p of ['width', 'height']) for (const x of all('.logo .mark')) assert.ok([undefined, '32px'].includes(get(x, p)), `no other ${p} for the mark: ${x.sel} in ${x.at}`);
});

test('0309 AC2: "speck" is 26 px Doto at weight 900, at every width', () => {
  const r = rule('.logo .name');
  assert.match(get(r, 'font-family'), /^"Doto",/);
  assert.equal(get(r, 'font-weight'), '900');
  assert.equal(get(r, 'font-size'), '26px');
  for (const x of all('.logo .name')) assert.ok([undefined, '26px'].includes(get(x, 'font-size')), `no other size for speck: ${x.at}`);
});

// ---------- in a real browser ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

const MEASURE = `(async () => {
  await document.fonts.ready;
  const box = s => { const e = document.querySelector(s), r = e.getBoundingClientRect(), shown = getComputedStyle(e).display !== 'none' && r.width > 0;
    return { shown, top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height, mid: r.top + r.height / 2 }; };
  const c = document.getElementById('mark');
  return { header: box('header'), logo: box('.logo'), mark: box('.logo .mark'), name: box('.logo .name'), label: box('.logo span'), repo: box('.repo'),
    theme: box('#theme'), settings: box('#settings-open'), canvas: [c.width, c.height], font: getComputedStyle(document.querySelector('.logo .name')).fontFamily,
    scroll: document.documentElement.scrollWidth, view: innerWidth };
})()`;
const apart = (a, b) => a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;

test('0309 AC1 to AC4: in a real browser, the mark and title are larger, centred together, and the header fits from 320 px up, in both looks', skip, async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    for (const width of [1280, 700, 699, 400, 320]) {
      const phone = width < 700;
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 800, deviceScaleFactor: 1, mobile: phone });
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
      await b.until(`document.readyState === 'complete' && !!document.querySelector('.logo .name')`, 'the panel');
      for (const look of ['light', 'dark']) {
        if ((await b.js('document.documentElement.dataset.theme')) !== look) await b.js(`document.querySelector('.theme').click()`);
        await b.until(`document.documentElement.dataset.theme === '${look}' && document.getElementById('mark').width === 32`, `the ${look} look, with the mark drawn`);
        const m = await b.js(MEASURE);
        const at = `${width} px, ${look}: ${JSON.stringify(m)}`;
        // AC1: 32 px on screen, drawn 32 × 32, so each of the 16 dots is 2 × 2
        assert.equal(m.mark.width, 32, at);
        assert.equal(m.mark.height, 32, at);
        assert.deepEqual(m.canvas, [32, 32], `drawn at two pixels a dot: ${at}`);
        // AC2: on the mark's line, centred with it
        assert.match(m.font, /^Doto,/, at);
        assert.ok(Math.abs(m.name.mid - m.mark.mid) <= 0.5, `speck is centred on the mark: ${at}`);
        assert.ok(m.name.left >= m.mark.right && m.name.left - m.mark.right <= 8, `speck follows the mark on its line: ${at}`);
        // AC3: buttons as they were, and the header only as tall as the mark needs (63 px wide, 100 px plus the mark's extra 5 on a phone)
        const button = phone ? 44 : 34;
        for (const k of ['theme', 'settings']) assert.ok(m[k].width === button && m[k].height === button, `${k} stays ${button} px: ${at}`);
        assert.equal(m.logo.height, 32, `the logo is no taller than the mark: ${at}`);
        assert.equal(m.header.height, phone ? 105 : 63, `the header grows only by what the mark needs: ${at}`);
        // AC4: nothing past the right edge, and nothing overlapping
        assert.ok(m.scroll <= m.view, `nothing past the right edge: ${at}`);
        assert.ok(m.label.shown && m.repo.shown, `"control panel" and the project show at the top of the page: ${at}`);
        assert.ok(m.label.left >= m.name.right, `"control panel" after speck: ${at}`);
        for (const [x, y] of [['logo', 'repo'], ['logo', 'theme'], ['logo', 'settings'], ['repo', 'theme'], ['repo', 'settings']]) assert.ok(apart(m[x], m[y]), `${x} and ${y} don't overlap: ${at}`);
        assert.ok(m.repo.right <= m.view, at);
        if (phone) {
          // Scrolled down, the header goes slim: "control panel" and the project hide, as they did before
          await b.js(`document.querySelector('header').classList.add('slim')`);
          const s = await b.js(MEASURE);
          const sat = `${width} px slim, ${look}: ${JSON.stringify(s)}`;
          assert.ok(!s.label.shown && !s.repo.shown, `"control panel" and the project hide: ${sat}`);
          assert.ok(s.scroll <= s.view, `nothing past the right edge: ${sat}`);
          for (const [x, y] of [['logo', 'theme'], ['logo', 'settings']]) assert.ok(apart(s[x], s[y]), `${x} and ${y} don't overlap: ${sat}`);
          await b.js(`document.querySelector('header').classList.remove('slim')`);
        }
      }
    }
  } finally { await b.close(); await stop(panel); }
});
