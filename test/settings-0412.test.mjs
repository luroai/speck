import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { page, findChrome, browserPage } from './support/panel.mjs';
import { sharedPanel } from './support/shared-panel.mjs';
import { settingsPage, openSettings, saveButton, posted } from './support/settings.mjs';

// ---------- 0412: Appearance offers System, Light and Dark ----------

const S = (key, value, o = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, ...o });
const VIEW = () => ({ groups: [{ title: 'Shipping', settings: [S('auto_ship', false, { choices: ['true', 'false'] })] }] });

// The <head> script, run as a page load does: `kept` is this browser's storage, which a reload keeps, and `dark` the
// computer's setting. turn(d) changes the computer's setting while the page is open.
function load({ kept = new Map(), dark = false, storage } = {}) {
  const script = page().match(/<script id="theme-start">([\s\S]*?)<\/script>/)[1];
  const root = { dataset: {}, classList: { toggle() {} } };
  const localStorage = storage || { getItem: k => kept.get(k) ?? null, setItem: (k, v) => kept.set(k, String(v)), removeItem: k => kept.delete(k) };
  const changes = [];
  const media = { matches: dark, addEventListener: (t, fn) => changes.push(fn) };
  const ctx = { document: { documentElement: root }, localStorage, matchMedia: () => media };
  ctx.globalThis = ctx;
  vm.runInNewContext(script, ctx);
  const turn = d => { media.matches = d; for (const fn of changes) fn({ matches: d }); };
  return { ctx, root, kept, localStorage, turn };
}
// The Settings view on the fake page, over a <head> script loaded as above.
async function opened(opts) {
  const h = load(opts);
  const { setLook, pickLook, lookChoice } = h.ctx;
  const p = settingsPage([VIEW()], [], { localStorage: h.localStorage, setLook, pickLook, lookChoice, scrollX: 0, scrollY: 0, scrollTo() {} });
  p.document.documentElement = h.root;
  p.document.querySelectorAll = () => [];
  await p.settle();
  await openSettings(p);
  return { ...h, p };
}
const group = p => p.all(p.byId('settings')).find(n => n.id === 'look');
const choices = p => group(p).children;
const chosen = p => choices(p).filter(b => b.attrs['aria-checked'] === 'true').map(b => b.textContent);
const choose = (p, word) => p.press(choices(p).find(b => b.textContent === word));
const keyOn = (p, key) => group(p).listeners.keydown({ key, target: choices(p).find(b => b.tabIndex === 0), preventDefault() {} });

test('0412 AC1: Appearance offers System, Light and Dark, in that order, and shows which is chosen', async () => {
  for (const [kept, shown] of [[undefined, 'System'], ['light', 'Light'], ['dark', 'Dark']]) {
    const { p } = await opened({ kept: new Map(kept ? [['speck-theme', kept]] : []) });
    assert.deepEqual(choices(p).map(b => b.textContent), ['System', 'Light', 'Dark']);
    assert.deepEqual(chosen(p), [shown], `${kept || 'nothing'} kept: ${shown} chosen`);
  }
});

test('0412 AC1: in a browser where no look has been chosen, or one that is neither light nor dark, System is chosen', async () => {
  for (const kept of [new Map(), new Map([['speck-theme', '__proto__']]), new Map([['speck-theme', 'system']])]) {
    const { p, ctx } = await opened({ kept });
    assert.equal(ctx.lookChoice(), 'system');
    assert.deepEqual(chosen(p), ['System']);
  }
  const refused = await opened({ storage: { getItem() { throw new Error('SecurityError'); } } });
  assert.deepEqual(chosen(refused.p), ['System'], 'storage the browser refuses counts as no choice');
});

test('0412 AC2: with System chosen, the panel shows the computer\'s setting and follows it as it changes', async () => {
  for (const dark of [false, true]) {
    const { root, turn, p } = await opened({ dark });
    assert.equal(root.dataset.theme, dark ? 'dark' : 'light');
    turn(!dark);
    assert.equal(root.dataset.theme, dark ? 'light' : 'dark', 'switched without a reload');
    turn(dark);
    assert.equal(root.dataset.theme, dark ? 'dark' : 'light');
    assert.deepEqual(chosen(p), ['System'], 'still System');
  }
});

test('0412 AC3: Light or Dark switches the panel at once and keeps that look through a reload, whatever the computer\'s setting', async () => {
  for (const [word, look] of [['Light', 'light'], ['Dark', 'dark']]) {
    const dark = look === 'light'; // the computer shows the other look
    const { root, turn, p, kept } = await opened({ dark });
    choose(p, word);
    assert.equal(root.dataset.theme, look, 'at once');
    assert.deepEqual(chosen(p), [word]);
    turn(!dark);
    turn(dark);
    assert.equal(root.dataset.theme, look, 'the computer\'s changes leave it');
    assert.equal(kept.get('speck-theme'), look);
    const again = await opened({ kept, dark });
    assert.equal(again.root.dataset.theme, look, 'kept through a reload');
    assert.deepEqual(chosen(again.p), [word]);
  }
});

test('0412 AC3: System after Light or Dark switches to the computer\'s setting at once, and a reload keeps System', async () => {
  for (const [word, dark] of [['Dark', false], ['Light', true]]) {
    const { root, turn, p, kept } = await opened({ dark });
    choose(p, word);
    choose(p, 'System');
    assert.equal(root.dataset.theme, dark ? 'dark' : 'light', 'the computer\'s setting, at once');
    assert.deepEqual(chosen(p), ['System']);
    assert.equal(kept.has('speck-theme'), false, 'kept as no choice');
    turn(!dark);
    assert.equal(root.dataset.theme, dark ? 'light' : 'dark', 'and it follows it again');
    const again = await opened({ kept, dark: !dark });
    assert.equal(again.root.dataset.theme, dark ? 'light' : 'dark', 'a reload follows the computer');
    assert.deepEqual(chosen(again.p), ['System']);
  }
});

test('0412 AC3: without the <head> script\'s pickLook, a choice still switches the page and shows', async () => {
  const root = { dataset: { theme: 'light' }, classList: { toggle() {} } };
  const p = settingsPage([VIEW()], [], { localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, scrollX: 0, scrollY: 0, scrollTo() {} });
  p.document.documentElement = root;
  p.document.querySelectorAll = () => [];
  await p.settle();
  await openSettings(p);
  assert.deepEqual(chosen(p), ['System']);
  choose(p, 'Dark');
  assert.equal(root.dataset.theme, 'dark');
  assert.deepEqual(chosen(p), ['Dark']);
  choose(p, 'System');
  assert.equal(root.dataset.theme, 'light', 'no matchMedia: light');
  assert.deepEqual(chosen(p), ['System']);
});

test('0412 AC4: the choice is kept in this browser only: nothing is sent, Save stays off and Close asks nothing', async () => {
  const { p } = await opened();
  for (const word of ['Dark', 'Light', 'System']) choose(p, word);
  await p.settle();
  assert.deepEqual(posted(p), []);
  assert.ok(!p.settingsCalls.some(c => /look|theme/.test(c.url)), 'no request names the look');
  assert.equal(saveButton(p).disabled, true, 'no unsaved change');
  p.press(p.all(p.byId('settings')).find(n => n.tagName === 'button' && n.className === 'close'));
  await p.settle();
  assert.equal(p.byId('settings-unsaved').hidden, true);
  assert.equal(p.byId('settings').hidden, true);
});

test('0412 AC4: storage the browser refuses still switches the look, and keeps the choice while the page is open', async () => {
  const storage = { getItem: () => null, setItem() { throw new Error('SecurityError'); }, removeItem() { throw new Error('SecurityError'); } };
  const { root, turn, p } = await opened({ storage, dark: false });
  choose(p, 'Dark');
  assert.equal(root.dataset.theme, 'dark');
  turn(true);
  turn(false);
  assert.equal(root.dataset.theme, 'dark', 'Dark stays though nothing could be stored');
  assert.deepEqual(chosen(p), ['Dark']);
  choose(p, 'System');
  assert.equal(root.dataset.theme, 'light');
  assert.deepEqual(chosen(p), ['System']);
});

test('0412 AC5: a radio group a screen reader names Appearance, of three buttons that say which is chosen', async () => {
  const { p } = await opened({ kept: new Map([['speck-theme', 'light']]) });
  const g = group(p);
  assert.equal(g.attrs.role, 'radiogroup');
  assert.equal(g.attrs['aria-label'], 'Appearance');
  for (const b of choices(p)) {
    assert.equal(b.tagName, 'button');
    assert.equal(b.type, 'button');
    assert.equal(b.attrs.role, 'radio');
    assert.equal(b.attrs['aria-checked'], String(b.textContent === 'Light'));
    assert.equal(b.attrs['aria-label'], undefined, 'named by its word');
    assert.equal(b.tabIndex, b.textContent === 'Light' ? 0 : -1, 'Tab reaches the chosen one');
  }
});

test('0412 AC5: the arrow keys, Home and End choose another, on the same buttons, and other keys do nothing', async () => {
  const { p, root } = await opened({ dark: false });
  const buttons = [...choices(p)];
  for (const [key, word] of [['ArrowRight', 'Light'], ['ArrowDown', 'Dark'], ['ArrowRight', 'System'], ['ArrowLeft', 'Dark'], ['ArrowUp', 'Light'], ['Home', 'System'], ['End', 'Dark'], ['a', 'Dark'], ['Tab', 'Dark']]) {
    keyOn(p, key);
    assert.deepEqual(chosen(p), [word], `${key} → ${word}`);
  }
  assert.equal(root.dataset.theme, 'dark');
  assert.deepEqual(choices(p), buttons, 'the same buttons, so focus stays');
});

// ---------- in a real browser ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

async function withBrowser(width, fn) {
  const panel = await sharedPanel();
  const b = await browserPage('about:blank');
  const scheme = value => b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value }] });
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height: 640, deviceScaleFactor: 1, mobile: width < 700 });
    await scheme('light');
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && !!document.getElementById('settings-open')`, 'the panel');
    await b.js(`localStorage.removeItem('speck-theme'); true`);
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`document.readyState === 'complete' && !!document.getElementById('settings-open')`, 'the panel, with no look kept');
    await b.js(`document.getElementById('settings-open').click(); true`);
    await b.until(`!!document.getElementById('look') && !/Loading the settings/.test(document.getElementById('settings').textContent)`, 'the Settings view');
    await b.js('document.fonts.ready.then(() => true)');
    await fn(b, scheme);
  } finally {
    await b.js(`localStorage.removeItem('speck-theme'); true`).catch(() => {});
    await b.close();
  }
}
const checked = `[...document.querySelectorAll('#look [role="radio"]')].filter(n => n.getAttribute('aria-checked') === 'true').map(n => n.textContent).join()`;
const press = (b, key, code, vk) => b.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk })
  .then(() => b.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk }));

test('0412 AC2: in a real browser, System follows the computer turning dark and light while the panel is open', skip, () => withBrowser(1200, async (b, scheme) => {
  assert.equal(await b.js(checked), 'System');
  assert.equal(await b.js('document.documentElement.dataset.theme'), 'light');
  await b.js('window.notReloaded = true');
  await scheme('dark');
  await b.until(`document.documentElement.dataset.theme === 'dark'`, 'the dark look, as the computer turns dark');
  await scheme('light');
  await b.until(`document.documentElement.dataset.theme === 'light'`, 'the light look again');
  assert.equal(await b.js('window.notReloaded === true'), true, 'without a reload');
  assert.equal(await b.js(checked), 'System');
}));

test('0412 AC5: at 320 px the Appearance row is one line, and the keyboard reaches and moves the choice', skip, () => withBrowser(320, async (b, scheme) => {
  const r = await b.js(`(() => {
    const g = document.getElementById('look'), row = g.closest('.switch-row'), name = row.querySelector('.name');
    const box = n => n.getBoundingClientRect(), pane = box(document.getElementById('settings'));
    const bs = [...g.children].map(box), n = box(name), rw = box(row);
    return { mids: [...bs, n].map(x => x.top + x.height / 2), heights: bs.map(x => x.height), nameH: n.height, right: Math.max(...bs.map(x => x.right)), rowRight: rw.right, paneRight: pane.right, rowH: rw.height, page: document.documentElement.scrollWidth, width: innerWidth, colRight: box(g.parentNode).right };
  })()`);
  assert.ok(Math.max(...r.mids) - Math.min(...r.mids) < 4, `the three choices beside the name, on one line: ${r.mids}`);
  assert.ok(r.nameH < 24 && r.heights.every(h => h < 40), `nothing wraps: ${JSON.stringify(r)}`);
  assert.ok(r.right <= r.colRight + 0.5 && r.colRight <= r.rowRight + 0.5 && r.rowRight <= r.paneRight + 0.5, `inside its half of the row: ${JSON.stringify(r)}`);
  assert.ok(r.rowH < 64, `one row, ${r.rowH} px`);
  assert.ok(r.page <= r.width, 'no sideways scroll');
  // Tab from the info button lands on the chosen one, then the arrow keys choose and move the focus.
  await b.js(`document.getElementById('look').closest('.switch-row').querySelector('.info').focus(); true`);
  await press(b, 'Tab', 'Tab', 9);
  assert.equal(await b.js(`document.activeElement.id`), 'look-system');
  await press(b, 'ArrowRight', 'ArrowRight', 39);
  await b.until(`document.activeElement.id === 'look-light' && ${checked} === 'Light'`, 'Light, focused');
  await scheme('dark');
  await press(b, 'ArrowRight', 'ArrowRight', 39);
  await b.until(`document.activeElement.id === 'look-dark' && document.documentElement.dataset.theme === 'dark'`, 'Dark, focused');
  await scheme('light');
  assert.equal(await b.js('document.documentElement.dataset.theme'), 'dark', 'Dark stays when the computer turns light');
  await press(b, 'Home', 'Home', 36);
  await b.until(`document.activeElement.id === 'look-system' && document.documentElement.dataset.theme === 'light'`, 'System, focused, following the computer');
  await b.js(`document.getElementById('look-dark').focus(); true`);
  await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32, text: ' ' });
  await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
  await b.until(`${checked} === 'Dark' && document.documentElement.dataset.theme === 'dark'`, 'Space chooses the focused one');
}));
