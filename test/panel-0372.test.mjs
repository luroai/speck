import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { page, findChrome, browserPage, full, T } from './support/panel.mjs';
import { LONG } from './support/board.mjs';
import fs from 'node:fs';
import { sharedPanel } from './support/shared-panel.mjs';
import { settingsPage, openSettings, saveButton, posted } from './support/settings.mjs';

// ---------- 0372: move the light/dark control into Settings ----------

const header = () => page().match(/<header>([\s\S]*?)<\/header>/)[1];
const css = () => (page().match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
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
// The look's list in the Settings view.
const lookList = p => p.all(p.byId('settings')).find(n => n.id === 'look');
const pick = (p, look) => { const c = lookList(p); c.value = look; c.listeners.change({ target: c }); };

test('0372 AC1: the header has no light/dark button, and Settings and the notice board stay', () => {
  const h = header();
  assert.doesNotMatch(h, /id="theme"/);
  assert.doesNotMatch(h, /class="theme"/);
  assert.doesNotMatch(h, /light and dark/i);
  assert.doesNotMatch(h, /class="(moon|sun)"/);
  assert.match(h, /<button class="settings-open" id="settings-open"/);
  assert.match(h, /<button class="run-state" id="run"/);
  // Nothing in the stylesheet brings it back at any width.
  assert.doesNotMatch(css(), /\.theme\b/);
});

test('0372 AC1: the build skill sends picture-taking to the look in Settings, not a theme button', () => {
  const skill = fs.readFileSync(new URL('../skills/speck-build/SKILL.md', import.meta.url), 'utf8');
  assert.doesNotMatch(skill, /theme button/);
  assert.match(skill, /the look in Settings/);
});

test('0372 AC2: Settings has a look row offering light and dark, showing the look the page has', async () => {
  for (const theme of ['light', 'dark']) {
    const { p } = await lookPage({ theme });
    const c = lookList(p);
    assert.ok(c, 'a list of looks');
    const row = c.parentNode.parentNode;
    assert.match(row.textContent, /light or dark/);
    assert.ok(p.all(p.byId('settings')).some(n => n.tagName === 'h4' && n.textContent === 'Look'), 'in a Look group');
    assert.equal(c.tagName, 'select');
    assert.deepEqual(c.children.map(o => o.value), ['light', 'dark']);
    assert.equal(c.value, theme, `it shows ${theme}`);
  }
});

test('0372 AC2: choosing a look switches the page, from either look, and the list shows the choice', async () => {
  for (const [from, to] of [['light', 'dark'], ['dark', 'light']]) {
    const { p, root, looks } = await lookPage({ theme: from });
    pick(p, to);
    assert.deepEqual(looks, [to], 'through setLook, as the button did');
    assert.equal(root.dataset.theme, to);
    assert.equal(lookList(p).value, to);
  }
  // Without the <head> script's setLook, it still switches.
  const { p, root } = await lookPage({ theme: 'light', withSetLook: false });
  pick(p, 'dark');
  assert.equal(root.dataset.theme, 'dark');
});

test('0372 AC2: the <head> script\'s setLook keeps an open list showing the look the page has', () => {
  const script = page().match(/<script id="theme-start">([\s\S]*?)<\/script>/)[1];
  const list = { value: 'light' }, root = { dataset: {} };
  let onChange = null;
  const ctx = { document: { documentElement: root, getElementById: id => (id === 'look' ? list : null) }, localStorage: { getItem: () => null },
    matchMedia: () => ({ matches: false, addEventListener: (t, fn) => { onChange = fn; } }) };
  ctx.globalThis = ctx;
  vm.runInNewContext(script, ctx);
  onChange({ matches: true }); // the computer turns dark, with no choice made
  assert.equal(root.dataset.theme, 'dark');
  assert.equal(list.value, 'dark');
});

test('0372 AC2: a value that is neither light nor dark changes nothing', async () => {
  const { p, root, stored, looks } = await lookPage({ theme: 'light' });
  pick(p, '__proto__');
  assert.equal(root.dataset.theme, 'light');
  assert.deepEqual(looks, []);
  assert.deepEqual(stored, []);
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

const STATE = { tickets: [full('0001'), ...['0362', '0363'].map(id => T(id, 'building')), T('0358', 'blocked')], ideas: [], run: { on: true, pid: 1 }, foreman: LONG };
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
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && !!document.querySelector('#run svg.board') && !document.querySelector('#run').hidden`, 'the panel');
    await b.js('document.fonts.ready.then(() => true)');
    await fn(b);
  } finally { await b.close(); }
}
const PARTS = ['.logo .mark', '.repo', '#run', '#settings-open'];
const measure = b => b.js(`(() => {
  const box = s => { const r = document.querySelector(s).getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, height: r.height, width: r.width, mid: r.top + r.height / 2 }; };
  const board = document.querySelector('#run .board');
  return { parts: ${JSON.stringify(PARTS)}.map(box), board: box('#run .board'), full: Number(board.getAttribute('width')), header: box('header'), page: document.documentElement.scrollWidth, width: innerWidth };
})()`);
// The old button put back after Settings, as it was: 34 px, 44 px under 700 px, 6 px closer to Settings above 700 px.
const putBack = b => b.js(`(() => {
  const n = document.createElement('button'), narrow = innerWidth < 700, s = getComputedStyle(document.querySelector('#settings-open'));
  n.id = 'old-theme';
  Object.assign(n.style, { flexShrink: '0', width: narrow ? '44px' : '34px', height: narrow ? '44px' : '34px', padding: '0', border: s.border, marginLeft: narrow ? '0' : '-6px' });
  document.querySelector('header').appendChild(n);
  return getComputedStyle(document.querySelector('header')).columnGap;
})()`);

for (const width of [320, 375, 500, 699, 700, 1200]) {
  test(`0372 AC4: at ${width} px, the notice board has the button's room, in one row with nothing overlapping${width < 700 ? ', each button at least 44 px tall' : ''}`, skip, () => withPanel(async b => {
    const now = await measure(b);
    assert.ok(now.page <= now.width, `no sideways scroll: ${now.page} > ${now.width}`);
    for (let i = 1; i < now.parts.length; i++) assert.ok(now.parts[i].left >= now.parts[i - 1].right - 0.5, `${PARTS[i]} comes after ${PARTS[i - 1]}`);
    const mids = now.parts.map(x => x.mid);
    assert.ok(Math.max(...mids) - Math.min(...mids) < 4, `one row: ${mids}`);
    if (width < 700) for (const k of ['#run', '#settings-open']) assert.ok(now.parts[PARTS.indexOf(k)].height >= 44, `${k}: ${now.parts[PARTS.indexOf(k)].height} px`);
    // With the old button back, a board cut short would be narrower by the button and the gap before it. One shown in
    // full has no more to show, then and now.
    const gap = parseFloat(await putBack(b));
    const was = await measure(b);
    const room = (width < 700 ? 44 : 34) + gap + (width < 700 ? 0 : -6), gained = now.board.width - was.board.width;
    // 0373: with speck's word back, at 320 px the old button would squeeze the Foreman's button to its 44 px least, so
    // the board can't lose all of the button's room there: it gains what it had to give up.
    const floored = was.parts[PARTS.indexOf('#run')].width <= 44.5;
    if (floored) assert.ok(gained > 0 && now.board.width > was.board.width, `the board gained ${gained} px, with the Foreman's button at its least`);
    else if (was.board.width < was.full - 0.5) assert.ok(Math.abs(gained - room) <= 1 || Math.abs(now.board.width - now.full) <= 0.5, `the board gained ${gained} px, the button's ${room} px`);
    else assert.ok(Math.abs(now.board.width - now.full) <= 0.5 && Math.abs(gained) <= 0.5, `shown in full both ways: ${now.board.width} of ${now.full}`);
  }, width));
}

test('0372 AC2: in a real browser, choosing dark in Settings switches the page, and it stays dark after a reload', skip, () => withPanel(async b => {
  const bg = `getComputedStyle(document.body).backgroundColor`;
  await b.js(`localStorage.removeItem('speck-theme'); document.documentElement.dataset.theme = 'light'; true`);
  const light = await b.js(bg);
  await b.js(`document.getElementById('settings-open').click()`);
  await b.until(`!!document.getElementById('look')`, 'the look list');
  assert.equal(await b.js(`document.getElementById('look').value`), 'light');
  await b.js(`(() => { const l = document.getElementById('look'); l.value = 'dark'; l.dispatchEvent(new Event('change')); return true; })()`);
  assert.equal(await b.js(`document.documentElement.dataset.theme`), 'dark');
  assert.notEqual(await b.js(bg), light, 'the page looks different');
  assert.equal(await b.js(`localStorage.getItem('speck-theme')`), 'dark');
  await b.js(`location.reload(), true`);
  await b.until(`document.readyState === 'complete' && document.documentElement.dataset.theme === 'dark'`, 'dark after a reload');
  await b.js(`localStorage.removeItem('speck-theme'); true`);
}, 1200));

test('0372 AC2: Settings opens on a page whose root has no dataset, showing light', async () => {
  const p = settingsPage([VIEW()], [], { scrollX: 0, scrollY: 0, scrollTo() {} });
  p.document.documentElement = { classList: { toggle() {} } };
  p.document.querySelectorAll = () => [];
  await p.settle();
  await openSettings(p);
  assert.equal(p.all(p.byId('settings')).find(n => n.id === 'look').value, 'light');
});
