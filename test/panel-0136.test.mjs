import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { page, paletteProblems, panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0136: a dark look you can switch to ----------

const DARK = { '--bg': '#181818', '--panel': '#1f1f1f', '--raise': '#222222', '--line': '#737373', '--line-soft': '#262626',
  '--text': '#e4e4e4', '--muted': '#c4c4c4', '--faint': '#b4b4b4', '--accent': '#e5a495', '--bad': '#f39ba5',
  '--ok': '#a5bb8e', '--warn': '#daac5d', '--run': '#97b7d8', '--idea': '#c3abd1', '--inbox': '#82bfb5', '--bug': '#e0a2bf', '--fix': '#c9b65c',
  '--accent-bg': '#2e2320', '--idea-bg': '#2a2430', '--inbox-bg': '#1d2a28', '--bad-bg': '#341d21' };
const ZEN = { '--bg': '#faf9f5', '--panel': '#ffffff', '--raise': '#f0eee6', '--line': '#87847d', '--line-soft': '#e8e7e3',
  '--text': '#141413', '--muted': '#3d3d3a', '--faint': '#4d4c48', '--accent': '#853123', '--bad': '#921f2d',
  '--ok': '#3f522e', '--warn': '#67460b', '--run': '#304f6d', '--idea': '#623f6c', '--inbox': '#22544c', '--bug': '#7a3553', '--fix': '#584c0e' };
// The light tints, set in the later plain :root block.
const ZEN_TINTS = { '--accent-bg': '#f7ebe6', '--idea-bg': '#f2ecf3', '--inbox-bg': '#e9f2f0', '--bad-bg': '#fae6e8' };
const OWN = ['--ok', '--warn', '--run', '--idea', '--inbox', '--bug', '--fix'];
const TINTS = ['--accent-bg', '--idea-bg', '--inbox-bg', '--bad-bg'];
const LABEL = 'Switch between light and dark';

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

test('0136 AC1: the header ends with a button named "Switch between light and dark", after Auto-build (0150), with a moon and a sun icon and no text', () => {
  const h = header();
  const run = h.indexOf('id="run"');
  const m = h.match(/[\s\S]*<button\b([^>]*)>([\s\S]*?)<\/button>\s*$/); // the last button: Auto-build is one too (0150)
  assert.ok(m, 'a button is the last thing in the header');
  assert.ok(run >= 0 && run < h.indexOf('id="theme"'), 'the button comes after Auto-build');
  assert.match(m[1], /\btype="button"/);
  assert.match(m[1], /\bid="theme"/);
  assert.match(m[1], new RegExp(`\\baria-label="${LABEL}"`));
  assert.equal(m[2].replace(/<[^>]*>/g, '').trim(), '', 'no visible text');
  assert.match(m[2], /<svg class="moon"/);
  assert.match(m[2], /<svg class="sun"/);
  // Not inside Auto-build, whose contents the page replaces on every refresh.
  assert.doesNotMatch(h.match(/<button class="run-state" id="run"[\s\S]*?<\/button>/)[0], /id="theme"/);
});

test('0136 AC1: the stylesheet shows the moon in the light look and the sun in the dark one', () => {
  const s = css();
  assert.match(s, /\.theme \.sun \{ display: none; \}/);
  assert.match(s, /:root\[data-theme="dark"\] \.theme \.sun \{ display: block; \}/);
  assert.match(s, /:root\[data-theme="dark"\] \.theme \.moon \{ display: none; \}/);
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
    for (const o of [...OWN.filter(x => x !== k), '--accent', '--bad']) assert.notEqual(v.toLowerCase(), (d.get(o) || '').toLowerCase(), `${k} differs from ${o}`);
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

test('0136 AC2: the full ticket pane\'s backdrop and shadow have dark counterparts', () => {
  const s = css();
  assert.match(s, /:root\[data-theme="dark"\] #full-backdrop \{ background: rgba\(/);
  assert.match(s, /:root\[data-theme="dark"\] #full-backdrop \{ background: rgba\(0, 0, 0, \.45\); \}/);
  assert.match(s, /\n {2}#full-backdrop \{[^}]*background: rgba\(20, 20, 19, \.2\);/);
  assert.match(s, /:root\[data-theme="dark"\] #full-ticket \{ box-shadow: /);
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
const LIGHT_BG = 'rgb(250, 249, 245)';
const DARK_BG = 'rgb(24, 24, 24)';
const shown = `[...document.querySelectorAll('#theme svg')].filter(s => getComputedStyle(s).display !== 'none').map(s => s.getAttribute('class'))`;

async function withPanel(fn, { scheme } = {}) {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    if (scheme) await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
    const open = async () => {
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
      // The page can be swapped out while it's checked: try again until it's there.
      const ready = `location.port === '${panel.port}' && document.readyState === 'complete' && !!document.getElementById('theme')`;
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

test('0136 AC1-AC2: in a browser, the button switches the look by click, Enter and Space, and shows the right icon', skip, async () => {
  await withPanel(async b => {
    assert.equal(await b.js(bodyBg), LIGHT_BG);
    assert.deepEqual(await b.js(shown), ['moon']);
    assert.equal(await b.js(`document.getElementById('theme').getAttribute('aria-label')`), LABEL);
    assert.equal(await b.js(`document.getElementById('theme').innerText.trim()`), '');
    await b.js(`document.getElementById('theme').click()`);
    await b.until(`getComputedStyle(document.body).backgroundColor === '${DARK_BG}'`, 'the dark look');
    assert.deepEqual(await b.js(shown), ['sun']);
    for (const key of [['Enter', 13, '\r'], [' ', 32, ' ']]) {
      const before = await b.js(bodyBg);
      await b.js(`document.getElementById('theme').focus()`);
      const k = { key: key[0], code: key[0] === ' ' ? 'Space' : 'Enter', windowsVirtualKeyCode: key[1], text: key[2] };
      await b.send('Input.dispatchKeyEvent', { type: 'keyDown', ...k });
      await b.send('Input.dispatchKeyEvent', { type: 'keyUp', ...k });
      const want = before === DARK_BG ? LIGHT_BG : DARK_BG;
      await b.until(`getComputedStyle(document.body).backgroundColor === '${want}'`, `${key[0] === ' ' ? 'Space' : 'Enter'} to switch the look`);
    }
  }, { scheme: 'light' });
});

test('0136 AC4: in a browser, the look chosen is kept through a reload, whatever the computer\'s setting', skip, async () => {
  await withPanel(async (b, open) => {
    assert.equal(await b.js(bodyBg), DARK_BG, 'starts dark, from the computer\'s setting');
    await b.js(`document.getElementById('theme').click()`);
    await b.until(`getComputedStyle(document.body).backgroundColor === '${LIGHT_BG}'`, 'the light look');
    assert.equal(await b.js(`localStorage.getItem('speck-theme')`), 'light');
    await open();
    assert.equal(await b.js(bodyBg), LIGHT_BG, 'still light after a reload, though the computer is dark');
    assert.deepEqual(await b.js(shown), ['moon']);
  }, { scheme: 'dark' });
});

test('0136 AC5: in a browser, before any choice, the panel follows the computer\'s setting', skip, async () => {
  await withPanel(async (b, open) => {
    assert.equal(await b.js(bodyBg), DARK_BG);
    assert.deepEqual(await b.js(shown), ['sun']);
    await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
    await b.until(`getComputedStyle(document.body).backgroundColor === '${LIGHT_BG}'`, 'the light look once the computer is light');
    await open();
    assert.equal(await b.js(bodyBg), LIGHT_BG);
  }, { scheme: 'dark' });
});
