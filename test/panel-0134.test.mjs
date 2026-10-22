import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, page, PALETTE, paletteProblems, panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0134: restyle the control panel in the zen look ----------

const rootVars = html => {
  const root = (html.match(/:root \{([\s\S]*?)\}/) || [])[1] || '';
  return new Map([...root.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)].map(m => [m[1], m[2].trim()]));
};
const ZEN = { '--bg': '#faf9f5', '--panel': '#ffffff', '--raise': '#f0eee6', '--line': '#87847d', '--line-soft': '#e8e7e3',
  '--text': '#141413', '--muted': '#3d3d3a', '--faint': '#4d4c48', '--accent': '#853123', '--bad': '#921f2d' };
const OWN = ['--ok', '--warn', '--run', '--idea', '--inbox', '--bug', '--fix'];
const luminance = hex => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const css = () => (page().match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
const staticHtml = () => page().replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<style>[\s\S]*?<\/style>/g, '');

test('0134 AC1: the first :root block sets the zen colours', () => {
  const vars = rootVars(page());
  for (const [k, v] of Object.entries(ZEN)) assert.equal(vars.get(k), v, k);
});

test('0134 AC1: each of the panel\'s own colours is a distinct 6-digit hex that reads against the page', () => {
  const vars = rootVars(page());
  const bg = vars.get('--bg');
  for (const k of OWN) {
    const v = vars.get(k);
    assert.match(v || '', /^#[0-9a-f]{6}$/i, `${k} is a 6-digit hex colour in the first :root block`);
    assert.ok(contrast(v, bg) >= 3, `${k} (${v}) has a contrast of at least 3:1 against --bg (${contrast(v, bg).toFixed(2)})`);
    for (const o of [...OWN.filter(x => x !== k), '--accent', '--bad']) assert.notEqual(v.toLowerCase(), (vars.get(o) || '').toLowerCase(), `${k} differs from ${o}`);
  }
  // No later :root block sets any of them again.
  const later = [...css().matchAll(/:root \{([^}]*)\}/g)].slice(1).map(m => m[1]).join(' ');
  for (const k of [...Object.keys(ZEN), ...OWN]) assert.doesNotMatch(later, new RegExp(`${k}\\s*:`), `${k} is set only once`);
});

test('0134 AC1: PALETTE lists the new values for the same 14 names, and the colour check holds', () => {
  const names = PALETTE.split('; ').map(d => d.split(': ')[0]);
  assert.deepEqual(names, ['--bg', '--panel', '--raise', '--line', '--line-soft', '--text', '--muted', '--faint', '--accent', '--ok', '--warn', '--bad', '--run', '--idea']);
  const vars = rootVars(page());
  for (const d of PALETTE.split('; ')) { const [k, v] = d.split(': '); if (ZEN[k]) assert.equal(v, ZEN[k], k); else assert.equal(v, vars.get(k), k); }
  assert.deepEqual(paletteProblems(page()), []);
  const changed = page().replace('--accent: #853123;', '--accent: #b0412f;');
  assert.notEqual(changed, page());
  assert.deepEqual(paletteProblems(changed), ['--accent should be #853123']);
  const src = fs.readFileSync(path.join(ROOT, 'test', 'mockup-0126.test.mjs'), 'utf8');
  assert.ok(src.includes(`assert.equal(PALETTE, '${PALETTE}')`), 'the 0126 AC2 literal lists the new values');
});

test('0134 AC2: the page loads nothing from another host', () => {
  const html = page();
  assert.doesNotMatch(html, /<link\b[^>]*https?:\/\//i, 'no <link> to another host');
  assert.doesNotMatch(html, /<script\b[^>]*\bsrc\s*=\s*["']?https?:\/\//i, 'no <script src> on another host');
  assert.doesNotMatch(css(), /@import/i, 'no @import');
  assert.doesNotMatch(css(), /url\(\s*["']?https?:/i, 'no url() on another host');
});

test('0134 AC2: the stylesheet names the zen fonts first, with standard fall-backs', () => {
  const s = css();
  assert.match(s, /"Shippori Mincho",\s*"Noto Serif JP",\s*Georgia,\s*serif/);
  assert.match(s, /"Zen Kaku Gothic New",\s*"Noto Sans JP",\s*system-ui,\s*sans-serif/);
  assert.match(s, /"IBM Plex Mono",\s*ui-monospace,\s*monospace/);
});

test('0134 AC3 (undone by 0135): no section heading has a number beside it', () => {
  const html = staticHtml();
  for (const name of ['Plan', 'Build', 'Shipped']) {
    assert.match(html, new RegExp(`<div class="sh"><h2>${name}</h2>`), `the ${name} heading is still exactly <h2>${name}</h2>, with nothing before it`);
  }
  assert.doesNotMatch(html, /<span class="num"/, 'no section number');
});

// AC4: the ids and visible text in the page's static HTML before this ticket. 0150 removed the connection pill, its id
// and its "connecting…", and 0162 the three hints beside the section headings.
const IDS = ['offline', 'restart', 'shaping-section', 'shaping-toggle', 'shaping', 'queue-n', 'queue', 'shipped-n', 'shipped-stats', 'shipped', 'full-backdrop', 'full-ticket'];
// 0373: the header's title is speck, then "base <branch>", without the project, then "control panel".
const TEXT = ['speck', 'base', '{{base}}', 'control panel',
  'Disconnected: can\'t reach speck panel. Showing the last state received. Retrying every 2 seconds…',
  'Plan', 'Build', 'Shipped'];

test('0134 AC4: every static id is still there, and no visible text was added (0135 removed the section numbers)', () => {
  const html = staticHtml();
  for (const id of IDS) assert.match(html, new RegExp(`\\bid="${id}"`), id);
  const text = html.replace(/<head>[\s\S]*?<\/head>/, '')
    .split(/<[^>]*>/).map(t => t.trim()).filter(Boolean);
  assert.deepEqual(text, TEXT);
});

test('0134 AC2-AC3: in a real browser, headings are serif and ticket ids monospace, with no number before a heading (0135)', { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' }, async () => {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage(`http://127.0.0.1:${panel.port}/`);
  try {
    await b.until(`!!document.querySelector('main .id')`, 'a ticket id');
    const heads = await b.js(`[...document.querySelectorAll('.sh h2')].map(h => [h.textContent, getComputedStyle(h).fontFamily, h.previousElementSibling === null])`);
    assert.deepEqual(heads.map(h => [h[0], h[2]]), [['Plan', true], ['Build', true], ['Shipped', true]]);
    for (const [name, family] of heads.map(h => [h[0], h[1]])) {
      assert.match(family, /\bserif\b/, `${name} is serif: ${family}`);
      assert.doesNotMatch(family, /monospace|sans-serif/, `${name} is not monospace: ${family}`);
    }
    assert.match(await b.js(`getComputedStyle(document.querySelector('main .id')).fontFamily`), /\bmonospace\b/);
  } finally { await b.close(); await stop(panel); }
});
