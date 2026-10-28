import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { page, findChrome, browserPage, full, T, styles } from './support/panel.mjs';
import fs from 'node:fs';
import { sharedPanel } from './support/shared-panel.mjs';
import { reload } from './support/reload.mjs';
import { settingsPage, openSettings, saveButton, posted } from './support/settings.mjs';

// ---------- 0372: move the light/dark control into Settings ----------

const header = () => page().match(/<header>([\s\S]*?)<\/header>/)[1];
const css = () => styles();
const S = (key, value, o = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, ...o });
const VIEW = () => ({ groups: [{ title: 'Shipping', settings: [S('auto_ship', false, { choices: ['true', 'false'] })] }] });

// The Settings view on the fake page, in `theme`, with a localStorage that records what's stored, and setLook as the
// <head> script makes it when `withSetLook`.
async function lookPage({ theme = 'light', withSetLook = true, storage } = {}) {
  const stored = [], looks = [];
  const localStorage = storage || { getItem: () => null, setItem: (k, v) => stored.push([k, v]) };
  const root = { dataset: { theme }, classList: { toggle() {} } };
  const globals = { localStorage, scrollX: 0, scrollY: 0, scrollTo() {} };
  if (withSetLook) globals.setLook = look => { looks.push(look); root.dataset.theme = look; };
  const p = settingsPage([VIEW()], [], globals);
  p.document.documentElement = root; // with what holdPage needs of the page while Settings is open
  p.document.querySelectorAll = () => [];
  await p.settle();
  await openSettings(p);
  return { p, root, stored, looks };
}
// The look's control in the Settings view (0412: System, Light and Dark), and the one it shows chosen.
const lookList = p => p.all(p.byId('settings')).find(n => n.id === 'look');
const shows = c => c.children.find(b => b.attrs['aria-checked'] === 'true').id.replace('look-', '');
// A look picked.
const pick = (p, look) => p.press(lookList(p).children.find(b => b.id === `look-${look}`));

test('0372 AC1: the header has no light/dark button, and Settings and the Foreman (0413: speck\'s screen) stay', () => {
  const h = header();
  assert.doesNotMatch(h, /id="theme"/);
  assert.doesNotMatch(h, /class="theme"/);
  assert.doesNotMatch(h, /light and dark/i);
  assert.doesNotMatch(h, /class="(moon|sun)"/);
  assert.match(h, /<button class="settings-open" id="settings-open"/);
  assert.match(h, /<button class="glass" id="run"/);
  // Nothing in the stylesheet brings it back at any width.
  assert.doesNotMatch(css(), /\.theme\b/);
});

test('0372 AC1: the build skill sends picture-taking to the look in Settings, not a theme button', () => {
  const skill = fs.readFileSync(new URL('../skills/speck-build/SKILL.md', import.meta.url), 'utf8');
  assert.doesNotMatch(skill, /theme button/);
  assert.match(skill, /the look in Settings/);
});

// 0412: it shows the choice, System until one is made, rather than the look the page has.
test('0372 AC2: Settings has a look row offering light and dark', async () => {
  for (const theme of ['light', 'dark']) {
    const { p } = await lookPage({ theme });
    const c = lookList(p);
    assert.ok(c, 'a control for the look');
    assert.equal(c.attrs.role, 'radiogroup');
    assert.deepEqual(c.children.map(b => b.textContent), ['System', 'Light', 'Dark']);
    assert.equal(shows(c), 'system', 'nothing chosen yet');
  }
});

test('0372 AC2: choosing a look switches the page, from either look, and the list shows the choice', async () => {
  for (const [from, to] of [['light', 'dark'], ['dark', 'light']]) {
    const { p, root, looks } = await lookPage({ theme: from });
    pick(p, to);
    assert.deepEqual(looks, [to], 'through setLook, as the button did');
    assert.equal(root.dataset.theme, to);
    assert.equal(shows(lookList(p)), to);
  }
  // Without the <head> script's setLook, it still switches.
  const { p, root } = await lookPage({ theme: 'light', withSetLook: false });
  pick(p, 'dark');
  assert.equal(root.dataset.theme, 'dark');
});

test('0372 AC2: the <head> script\'s setLook keeps an open list showing the look the page has', () => {
  const script = page().match(/<script id="theme-start">([\s\S]*?)<\/script>/)[1];
  const root = { dataset: {} }, shown = [];
  let onChange = null;
  const ctx = { document: { documentElement: root }, localStorage: { getItem: () => null },
    matchMedia: () => ({ matches: false, addEventListener: (t, fn) => { onChange = fn; } }) };
  ctx.globalThis = ctx;
  vm.runInNewContext(script, ctx);
  ctx.drawLook = () => shown.push(root.dataset.theme); // 0396: the page's, which draws the switch
  onChange({ matches: true }); // the computer turns dark, with no choice made
  assert.equal(root.dataset.theme, 'dark');
  assert.deepEqual(shown, ['dark']);
});

// 0412: a look that is neither shows System, and Dark picks dark.
test('0372 AC2: a value that is neither light nor dark changes nothing', async () => {
  const { p, root, stored, looks } = await lookPage({ theme: '__proto__' });
  assert.equal(shows(lookList(p)), 'system');
  assert.deepEqual(looks, []);
  assert.deepEqual(stored, []);
  pick(p, 'dark');
  assert.equal(root.dataset.theme, 'dark');
  assert.deepEqual(stored, [['speck-theme', 'dark']]);
});

test('0372 AC3: the choice is stored in this browser as speck-theme, which the <head> script applies on load', async () => {
  const { p, stored } = await lookPage({ theme: 'light' });
  pick(p, 'dark');
  assert.deepEqual(stored, [['speck-theme', 'dark']]);
  const script = page().match(/<script id="theme-start">([\s\S]*?)<\/script>/)[1];
  const root = { dataset: {} };
  vm.runInNewContext(script, { document: { documentElement: root }, localStorage: { getItem: k => (k === 'speck-theme' ? 'dark' : null) },
    matchMedia: () => ({ matches: false, addEventListener() {} }) });
  assert.equal(root.dataset.theme, 'dark');
});

test('0372 AC3: storage the browser refuses still switches the look', async () => {
  const { p, root } = await lookPage({ theme: 'light', storage: { getItem: () => null, setItem() { throw new Error('SecurityError'); } } });
  pick(p, 'dark');
  assert.equal(root.dataset.theme, 'dark');
});

test('0372 AC3: the look is not sent to the server, Save stays off, and Close asks nothing', async () => {
  const { p } = await lookPage({ theme: 'light' });
  pick(p, 'dark');
  await p.settle();
  assert.deepEqual(posted(p), [], 'nothing posted');
  assert.equal(saveButton(p).disabled, true, 'no unsaved change');
  const close = p.all(p.byId('settings')).find(n => n.tagName === 'button' && n.className === 'close');
  p.press(close);
  await p.settle();
  assert.equal(p.byId('settings-unsaved').hidden, true, 'no question about unsaved changes');
  assert.equal(p.byId('settings').hidden, true, 'Settings closed');
  assert.ok(!p.settingsCalls.some(c => /look|theme/.test(c.url)), 'no request names the look');
});

// ---------- in a real browser ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

const STATE = { tickets: [full('0001'), ...['0362', '0363'].map(id => T(id, 'building')), T('0358', 'blocked')], ideas: [], run: { on: true, pid: 1 }, foreman: { word: 'Building 2', tone: 'ok' } };
async function withPanel(fn, width) {
  const panel = await sharedPanel();
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height: 640, deviceScaleFactor: 1, mobile: width < 700 });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
      const STATE = ${JSON.stringify(STATE)}, real = window.fetch.bind(window);
      window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? new Response(JSON.stringify(STATE), { status: 200, headers: { 'content-type': 'application/json' } }) : real(url, opts);
    })();` });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && !!document.querySelector('#run canvas')`, 'the panel');
    await b.js('document.fonts.ready.then(() => true)');
    await fn(b);
  } finally { await b.close(); }
}
// 0413: the notice board, and the room it had in the header row, are speck's screen in its frame now (panel-0413.test.mjs).

test('0372 AC2: in a real browser, choosing dark in Settings switches the page, and it stays dark after a reload', skip, () => withPanel(async b => {
  const bg = `getComputedStyle(document.body).backgroundColor`;
  await b.js(`localStorage.removeItem('speck-theme'); document.documentElement.dataset.theme = 'light'; true`);
  const light = await b.js(bg);
  await b.js(`document.getElementById('settings-open').click()`);
  await b.until(`!!document.getElementById('look')`, 'the look\'s choices');
  assert.equal(await b.js(`document.getElementById('look-dark').getAttribute('aria-checked')`), 'false');
  await b.js(`document.getElementById('look-dark').click(), true`);
  assert.equal(await b.js(`document.documentElement.dataset.theme`), 'dark');
  assert.notEqual(await b.js(bg), light, 'the page looks different');
  assert.equal(await b.js(`localStorage.getItem('speck-theme')`), 'dark');
  // 0542: waits for the reloaded panel to be ready, riding out the page changing over, before it reads the look
  await reload(b, `!!document.querySelector('#run canvas')`, 'the reloaded panel');
  assert.equal(await b.js(`document.documentElement.dataset.theme`), 'dark', 'dark after a reload');
  await b.js(`localStorage.removeItem('speck-theme'); true`);
}, 1200));

test('0372 AC2: Settings opens on a page whose root has no dataset, showing System (0412)', async () => {
  const p = settingsPage([VIEW()], [], { scrollX: 0, scrollY: 0, scrollTo() {} });
  p.document.documentElement = { classList: { toggle() {} } };
  p.document.querySelectorAll = () => [];
  await p.settle();
  await openSettings(p);
  assert.equal(shows(p.all(p.byId('settings')).find(n => n.id === 'look')), 'system');
});
