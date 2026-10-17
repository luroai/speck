import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0281: every Settings control's border on all four sides. Only a real browser lays the view out. ----------

// Each info button, list, text box and number box in the view: its left and right edges, and its border widths.
const MEASURE = `[...document.querySelectorAll('#settings .setting .info, #settings .setting select.edit, #settings .setting input.edit[type="text"], #settings .setting input.edit[type="number"]')]
  .filter(n => n.getClientRects().length).map(n => {
    const r = n.getBoundingClientRect(), cs = getComputedStyle(n);
    return { what: n.getAttribute('aria-label') || n.tagName, tag: n.tagName, left: r.left, right: r.right,
      borders: ['Top', 'Right', 'Bottom', 'Left'].map(s => parseFloat(cs['border' + s + 'Width'])) };
  })`;
const whole = x => Math.abs(x - Math.round(x)) < 1e-6;

const skip = findChrome() ? false : 'needs Chrome or Chromium';
test('0281 AC1 AC2: at every width and pixel ratio, the controls sit on whole pixels, each border at least a device pixel', { skip }, async () => {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    for (const dpr of [1, 2, 3]) for (const width of [320, 390, 400, 1280]) {
      const at = `${width} px at ${dpr}x`;
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: dpr, mobile: width < 900 });
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/?w=${width}&d=${dpr}` });
      await b.until(`location.search === '?w=${width}&d=${dpr}' && document.readyState === 'complete'`, 'the panel');
      await b.js(`document.getElementById('settings-open').click()`);
      await b.until(`document.querySelectorAll('#settings .setting').length >= 10`, 'the settings');
      const all = await b.js(MEASURE);
      for (const tag of ['BUTTON', 'SELECT', 'INPUT']) assert.ok(all.some(o => o.tag === tag), `${at}: the view has a ${tag}`);
      for (const o of all) {
        // AC1
        assert.ok(whole(o.left), `${at}: ${o.what}'s left edge at ${o.left} px`);
        assert.ok(whole(o.right), `${at}: ${o.what}'s right edge at ${o.right} px`);
        // AC2
        for (const w of o.borders) assert.ok(w * dpr >= 1 - 1e-6, `${at}: ${o.what} has a ${w} px border`);
      }
    }
  } finally { await b.close(); await stop(panel); }
});

// The rules this ticket adds or changes are all the Settings view's.
test('0281 AC3: the change is limited to the Settings view', () => {
  const css = fs.readFileSync(new URL('../templates/panel.html', import.meta.url), 'utf8').split('</style>')[0];
  const rules = css.split('\n').filter(l => /0281/.test(l) && /\{/.test(l));
  assert.ok(rules.length >= 1, 'the ticket\'s rules are marked 0281');
  for (const l of rules) for (const sel of l.slice(0, l.indexOf('{')).split(',')) assert.match(sel.trim(), /^#settings /, l.trim());
});
