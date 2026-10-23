import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0281: every Settings control's border on all four sides. Only a real browser lays the view out. ----------

// Each info button, list, text box and number box in the view: its left and right edges, and its borders' widths as
// the stylesheet sets them at this pixel ratio. Chromium draws any border under 1px as 1px, so its computed widths
// can't show what a browser that draws half a pixel, as Safari does, is given. The last matching declaration wins, which
// holds here as the Settings rules all share one specificity.
const MEASURE = `(() => {
  const rules = [];
  const walk = list => { for (const r of Array.from(list)) {
    if (r.media) { if (matchMedia(r.media.mediaText).matches) walk(r.cssRules); }
    else if (r.selectorText) rules.push(r);
  } };
  for (const sheet of Array.from(document.styleSheets)) walk(sheet.cssRules);
  // A shorthand with var() in it leaves its longhands blank, so the width is read from the shorthand then.
  const set = (st, side) => st['border' + side + 'Width']
    || (st.getPropertyValue('border-' + side.toLowerCase()) || st.getPropertyValue('border')).match(/(?:^|\\s)([\\d.]+px)\\b/)?.[1];
  const declared = (n, side) => {
    let w = null;
    for (const r of rules) if (n.matches(r.selectorText) && set(r.style, side)) w = set(r.style, side);
    return w;
  };
  return [...document.querySelectorAll('#settings .setting .info, #settings .setting select.edit, #settings .setting input.edit[type="text"], #settings .setting input.edit[type="number"]')]
    .filter(n => n.getClientRects().length).map(n => {
      const r = n.getBoundingClientRect();
      return { what: n.getAttribute('aria-label') || n.tagName, tag: n.tagName, left: r.left, right: r.right,
        borders: ['Top', 'Right', 'Bottom', 'Left'].map(side => declared(n, side)) };
    });
})()`;
// Outside the view, a section keeps its own look, with no outline or shadow: since 0418, no border.
const OUTSIDE = `(() => { const cs = getComputedStyle(document.getElementById('shaping-section'));
  return { style: cs.borderLeftStyle, width: cs.borderLeftWidth, outline: cs.outlineStyle, shadow: cs.boxShadow }; })()`;
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
        for (const w of o.borders) {
          assert.match(String(w), /^[\d.]+px$/, `${at}: ${o.what}'s border width ${w} is set in px`);
          assert.ok(parseFloat(w) * dpr >= 1 - 1e-6, `${at}: ${o.what} has a ${w} border`);
        }
      }
      // AC3
      assert.deepEqual(await b.js(OUTSIDE), { style: 'none', width: '0px', outline: 'none', shadow: 'none' }, `${at}: the Plan section's border`);
    }
  } finally { await b.close(); await stop(panel); }
});

// Every rule using what this ticket brings in is one of the Settings view's. 0423: or the full ticket's own rule, whose
// centred column is rounded to whole pixels the same way.
test('0281 AC3: the change is limited to the Settings view', () => {
  const css = fs.readFileSync(new URL('../templates/panel.css', import.meta.url), 'utf8');
  const rules = css.split("\n").filter(l => l.includes("{") && /round\(|--gap|box-shadow: 0 0 0|max-resolution/.test(l));
  assert.ok(rules.length >= 5, `the ticket's rules: ${rules.length}`);
  for (const l of rules) {
    const inner = l.trim().replace(/^@media[^{]*\{/, '');
    for (const sel of inner.slice(0, inner.indexOf('{')).split(',')) assert.match(sel.trim(), /^#settings |^#full-ticket$/, l.trim());
  }
});
