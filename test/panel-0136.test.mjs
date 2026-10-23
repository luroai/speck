import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { page, paletteProblems, panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0136: a dark look you can switch to ----------

const DARK = { '--bg': '#141414', '--panel': '#181818', '--raise': '#1c1c1c', '--line': '#E4E4E462', '--line-soft': '#E4E4E413',
  '--text': '#E4E4E4EB', '--muted': '#E4E4E4B8', '--faint': '#E4E4E4B8', '--accent': '#e34671', '--bad': '#ef95ad',
  '--ok': '#7fbc95', '--warn': '#d9a65e', '--run': '#97b2cc', '--idea': '#c4a6be', '--inbox': '#88c0d0', '--bug': '#e69d83', '--fix': '#d9a65e',
  '--accent-bg': '#27221b', '--idea-bg': '#242124', '--inbox-bg': '#212527', '--bad-bg': '#281c1f' };
const ZEN = { '--bg': '#f3f3f3', '--panel': '#fcfcfc', '--raise': '#f3f3f3', '--line': '#14141476', '--line-soft': '#14141413',
  '--text': '#141414EB', '--muted': '#141414BA', '--faint': '#141414BA', '--accent': '#cf2d56', '--bad': '#96213f',
  '--ok': '#145a42', '--warn': '#6d4700', '--run': '#285372', '--idea': '#833063', '--inbox': '#4c7f8c', '--bug': '#86371b', '--fix': '#6d4700' };
// The light tints, set in the later plain :root block.
const ZEN_TINTS = { '--accent-bg': '#f5f0e8', '--idea-bg': '#f7edf3', '--inbox-bg': '#eef2f3', '--bad-bg': '#f8ebef' };
const OWN = ['--ok', '--warn', '--run', '--idea', '--inbox', '--bug', '--fix'];
// 0426: the fix tag is in Cursor's yellow, as --warn is
const SHARED = new Set(['--fix --warn', '--warn --fix']);
const TINTS = ['--accent-bg', '--idea-bg', '--inbox-bg', '--bad-bg'];

const vars = block => new Map([...block.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)].map(m => [m[1], m[2].trim()]));
const css = () => (page().match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
const darkVars = () => vars([...css().matchAll(/:root\[data-theme="dark"\] \{([^}]*)\}/g)].map(m => m[1]).join(' '));
const luminance = hex => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const header = () => page().match(/<header>([\s\S]*?)<\/header>/)[1];
// The script in <head> that sets the look before the page is first drawn.
const startScript = () => (page().match(/<head>[\s\S]*?<script id="theme-start">([\s\S]*?)<\/script>[\s\S]*?<\/head>/) || [])[1];

// Runs the <head> script with a stored value (or a storage that throws) and a computer setting; returns the look it set.
function startLook({ stored = null, dark = false, storage } = {}) {
  const root = { dataset: {} };
  let onChange = null;
  const localStorage = storage || { getItem: k => (k === 'speck-theme' ? stored : null) };
  const matchMedia = q => ({ matches: q === '(prefers-color-scheme: dark)' && dark, addEventListener: (t, fn) => { if (t === 'change') onChange = fn; } });
  vm.runInNewContext(startScript(), { document: { documentElement: root }, localStorage, matchMedia });
  return { theme: root.dataset.theme, change: matches => { onChange && onChange({ matches }); return root.dataset.theme; } };
}

// 0372: light and dark are chosen in Settings now: the header has no button for them.
test('0136 AC1 (0372): the header has no light/dark button, and the stylesheet draws none', () => {
  assert.doesNotMatch(header(), /id="theme"|class="theme"|light and dark/);
  assert.doesNotMatch(css(), /\.theme\b/);
});

test('0136 AC2: the dark look sets the mockup\'s colours exactly', () => {
  const d = darkVars();
  for (const [k, v] of Object.entries(DARK)) assert.equal(d.get(k), v, k);
});

test('0136 AC2: the dark look\'s own colours are distinct 6-digit hexes that read against the dark --bg', () => {
  const d = darkVars();
  for (const k of OWN) {
    const v = d.get(k) || '';
    assert.match(v, /^#[0-9a-f]{6}$/i, `${k} is a 6-digit hex colour in the dark look`);
    assert.ok(contrast(v, DARK['--bg']) >= 3, `${k} (${v}) has a contrast of at least 3:1 against the dark --bg (${contrast(v, DARK['--bg']).toFixed(2)})`);
    for (const o of [...OWN.filter(x => x !== k), '--accent', '--bad'].filter(o => !SHARED.has(`${k} ${o}`))) assert.notEqual(v.toLowerCase(), (d.get(o) || '').toLowerCase(), `${k} differs from ${o}`);
  }
});

test('0136 AC2: the dark tints are dark enough for the dark --text to read on them', () => {
  const d = darkVars();
  for (const k of TINTS) {
    const v = d.get(k) || '';
    assert.match(v, /^#[0-9a-f]{6}$/i, `${k} is set in the dark look`);
    assert.ok(contrast(DARK['--text'], v) >= 4.5, `--text on ${k} (${v}) has a contrast of at least 4.5:1 (${contrast(DARK['--text'], v).toFixed(2)})`);
  }
});

test('0136 AC2: the full ticket pane\'s backdrop has a dark counterpart (0423: the pane, over the whole panel, has no shadow)', () => {
  const s = css();
  assert.match(s, /:root\[data-theme="dark"\] #full-backdrop \{ background: rgba\(/);
  assert.match(s, /:root\[data-theme="dark"\] #full-backdrop \{ background: rgba\(0, 0, 0, \.45\); \}/);
  assert.match(s, /\n {2}#full-backdrop \{[^}]*background: rgba\(20, 20, 19, \.2\);/);
});

test('0136 AC3: the first :root block still sets the light colours, and the colour check passes', () => {
  const first = vars((page().match(/:root \{([\s\S]*?)\}/) || [])[1] || '');
  for (const [k, v] of Object.entries(ZEN)) assert.equal(first.get(k), v, k);
  const light = vars([...css().matchAll(/:root \{([^}]*)\}/g)].map(m => m[1]).join(' '));
  for (const [k, v] of Object.entries(ZEN_TINTS)) assert.equal(light.get(k), v, k);
  assert.deepEqual(paletteProblems(page()), []);
  assert.ok(page().indexOf(':root[data-theme="dark"]') > page().indexOf(':root {'), 'the dark values come after the first :root block');
});

test('0136 AC4: the <head> script applies a saved choice, whatever the computer\'s setting, and ignores anything else saved', () => {
  assert.ok(startScript(), 'a <script id="theme-start"> in <head>');
  assert.ok(page().indexOf('id="theme-start"') < page().indexOf('<body>'), 'it runs before the page is first drawn');
  assert.equal(startLook({ stored: 'light', dark: true }).theme, 'light');
  assert.equal(startLook({ stored: 'dark', dark: false }).theme, 'dark');
  assert.equal(startLook({ stored: 'purple', dark: false }).theme, 'light');
  assert.equal(startLook({ stored: '__proto__', dark: true }).theme, 'dark');
  // A saved choice holds when the computer's setting changes.
  assert.equal(startLook({ stored: 'light', dark: false }).change(true), 'light');
});

test('0136 AC5: with no choice saved, the <head> script follows the computer\'s setting, also when it changes', () => {
  assert.equal(startLook({ dark: true }).theme, 'dark');
  assert.equal(startLook({ dark: false }).theme, 'light');
  assert.equal(startLook({ dark: false }).change(true), 'dark');
  assert.equal(startLook({ dark: true }).change(false), 'light');
  // Storage the browser refuses counts as no choice.
  const refused = { getItem() { throw new Error('SecurityError'); } };
  assert.equal(startLook({ dark: true, storage: refused }).theme, 'dark');
});

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const bodyBg = `getComputedStyle(document.body).backgroundColor`;
const LIGHT_BG = 'rgb(243, 243, 243)';
const DARK_BG = 'rgb(20, 20, 20)';
// 0372: the look Settings' list shows, opening Settings if it's closed, and a look picked there.
const LOOK = `(async () => { if (!document.getElementById('look')) document.getElementById('settings-open').click(); for (let i = 0; i < 100 && !document.getElementById('look'); i++) await new Promise(r => setTimeout(r, 20)); return document.getElementById('look'); })()`;
// 0412: Appearance's System, Light and Dark: the one chosen, and one picked.
const shown = `${LOOK}.then(l => l.querySelector('[aria-checked="true"]').id.replace('look-', ''))`;
const pick = look => `${LOOK}.then(l => { l.querySelector('#look-${look}').click(); return true; })`;

async function withPanel(fn, { scheme } = {}) {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    if (scheme) await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
    const open = async () => {
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
      // The page can be swapped out while it's checked: try again until it's there.
      const ready = `location.port === '${panel.port}' && document.readyState === 'complete' && !!document.getElementById('settings-open')`;
      for (let i = 0; ; i++) {
        try { if (await b.js(ready)) return; } catch (e) { if (i >= 100) throw e; }
        if (i >= 100) throw new Error('timed out waiting for the panel');
        await new Promise(res => setTimeout(res, 100));
      }
    };
    await open();
    await fn(b, open);
  } finally { await b.close(); await stop(panel); }
}

test('0136 AC1-AC2 (0372): in a browser, Settings\' list switches the look both ways and shows the one chosen', skip, async () => {
  await withPanel(async b => {
    assert.equal(await b.js(bodyBg), LIGHT_BG);
    assert.equal(await b.js(shown), 'system', '0412: nothing chosen yet');
    await b.js(pick('dark'));
    await b.until(`getComputedStyle(document.body).backgroundColor === '${DARK_BG}'`, 'the dark look');
    assert.equal(await b.js(shown), 'dark');
    await b.js(pick('light'));
    await b.until(`getComputedStyle(document.body).backgroundColor === '${LIGHT_BG}'`, 'the light look again');
    assert.equal(await b.js(shown), 'light');
  }, { scheme: 'light' });
});

test('0136 AC4: in a browser, the look chosen is kept through a reload, whatever the computer\'s setting', skip, async () => {
  await withPanel(async (b, open) => {
    assert.equal(await b.js(bodyBg), DARK_BG, 'starts dark, from the computer\'s setting');
    await b.js(pick('light'));
    await b.until(`getComputedStyle(document.body).backgroundColor === '${LIGHT_BG}'`, 'the light look');
    assert.equal(await b.js(`localStorage.getItem('speck-theme')`), 'light');
    await open();
    assert.equal(await b.js(bodyBg), LIGHT_BG, 'still light after a reload, though the computer is dark');
    assert.equal(await b.js(shown), 'light');
  }, { scheme: 'dark' });
});

test('0136 AC5: in a browser, before any choice, the panel follows the computer\'s setting', skip, async () => {
  await withPanel(async (b, open) => {
    assert.equal(await b.js(bodyBg), DARK_BG);
    assert.equal(await b.js(shown), 'system', '0412: System, showing the computer\'s dark');
    await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
    await b.until(`getComputedStyle(document.body).backgroundColor === '${LIGHT_BG}'`, 'the light look once the computer is light');
    await open();
    assert.equal(await b.js(bodyBg), LIGHT_BG);
  }, { scheme: 'dark' });
});
