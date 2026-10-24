import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { page, findChrome, browserPage } from './support/panel.mjs';
import { sharedPanel } from './support/shared-panel.mjs';
import { settingsPage, openSettings, posted } from './support/settings.mjs';

// ---------- 0396: Appearance and Auto-build at the top of Settings, as toggles ----------

const S = (key, value, o = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, ...o });
const VIEW = () => ({ groups: [
  { title: 'Shipping', settings: [S('auto_ship', false, { choices: ['true', 'false'] })] },
  { title: 'Watching', settings: [S('watch', 'fix', { choices: ['off', 'tell', 'fix'] })] },
] });

// The Settings view on the fake page, in `theme`, with speck run off, a localStorage that records what's stored,
// and setLook as the <head> script makes it. `saves` answers the page's POSTs, the speck run switch's among them.
async function opened({ theme = 'light', saves = [], storage, withSetLook = true } = {}) {
  const stored = [], looks = [];
  const localStorage = storage || { getItem: () => null, setItem: (k, v) => stored.push([k, v]) };
  const root = { dataset: { theme }, classList: { toggle() {} } };
  const globals = { localStorage, scrollX: 0, scrollY: 0, scrollTo() {} };
  if (withSetLook) globals.setLook = look => { looks.push(look); root.dataset.theme = look; };
  const p = settingsPage([VIEW()], saves, globals);
  p.document.documentElement = root;
  p.document.querySelectorAll = () => [];
  await p.settle();
  await openSettings(p);
  return { p, root, stored, looks };
}
const pane = p => p.byId('settings');
// The switches' box, then each group of settings.
const groupsOf = p => pane(p).children.filter(n => /\b(sgroup|switches)\b/.test(n.className || ''));
const lookSwitch = p => p.all(pane(p)).find(n => n.id === 'look'); // 0412: System, Light and Dark, no longer a switch
const lookChoice = (p, look) => lookSwitch(p).children.find(b => b.id === `look-${look}`);
const runSwitch = p => p.all(pane(p)).find(n => n.id === 'run-switch');
const rowOfSwitch = (p, sw) => { let n = sw; while (n && !/\bswitch-row\b/.test(n.className || '')) n = n.parentNode; return n; };
const nameOf = (p, row) => p.all(row).find(n => /\bname\b/.test(n.className || ''))?.textContent;

test('0396 AC1: Settings opens with Appearance, then Auto-build, above every other group, each a row of its name and a switch with no description', async () => {
  const { p } = await opened();
  const first = groupsOf(p)[0];
  const rows = first.children.filter(n => /\bswitch-row\b/.test(n.className || ''));
  assert.deepEqual(rows.map(r => nameOf(p, r)), ['Appearance', 'Auto-build'], 'Appearance first, then Auto-build');
  assert.ok(!p.all(first).some(n => n.tagName === 'h4'), 'no heading over them');
  assert.ok(pane(p).children.indexOf(first) < pane(p).children.indexOf(groupsOf(p)[1]), 'above the other groups');
  for (const g of groupsOf(p).slice(1)) assert.ok(!p.all(g).some(n => n.id === 'look' || n.id === 'run-switch'), 'not in another group');
  assert.ok(groupsOf(p).slice(1).some(g => g.textContent.startsWith('Watching')), 'the Foreman group is still there');
  assert.equal(rowOfSwitch(p, lookSwitch(p)), rows[0]);
  assert.equal(rowOfSwitch(p, runSwitch(p)), rows[1]);
  for (const row of rows) {
    const lines = p.all(row).filter(n => n.tagName === 'p' && !n.hidden && !/\bexplain\b/.test(n.className || ''));
    assert.deepEqual(lines.map(n => n.textContent), [], `${nameOf(p, row)} has no description under it`);
  }
  assert.doesNotMatch(pane(p).textContent, /For the panel in this browser|light or dark|ready tickets wait\.$/);
  assert.ok(!p.all(pane(p)).some(n => n.tagName === 'select' && n.id === 'look'), 'no list of looks');
});

// 0409: while the settings load the view isn't open yet, so it's only when they fail to load.
test('0396 AC1: the two rows come first when the settings fail to load', async () => {
  const p = settingsPage([{ status: 500, body: { error: 'no' } }], [], { scrollX: 0, scrollY: 0, scrollTo() {} });
  p.document.documentElement = { dataset: { theme: 'light' }, classList: { toggle() {} } };
  p.document.querySelectorAll = () => [];
  await p.settle();
  await openSettings(p);
  const first = groupsOf(p)[0];
  assert.ok(first && p.all(first).some(n => n.id === 'look') && p.all(first).some(n => n.id === 'run-switch'));
  assert.equal(pane(p).children.indexOf(first), 1, 'just under the view\'s top line');
});

// 0412: a choice of System, Light and Dark rather than a switch; its own tests check what it shows.
test('0396 AC2: Appearance switches the look both ways, through setLook', async () => {
  for (const [from, to] of [['light', 'dark'], ['dark', 'light']]) {
    const { p, root, looks, stored } = await opened({ theme: from });
    const c = lookSwitch(p);
    p.press(lookChoice(p, to));
    assert.deepEqual(looks, [to]);
    assert.equal(root.dataset.theme, to);
    assert.equal(lookSwitch(p), c, 'the same control, so it keeps the focus');
    assert.equal(lookChoice(p, to).attrs['aria-checked'], 'true', 'it shows the new look');
    assert.deepEqual(stored, [['speck-theme', to]], 'kept in this browser, as 0372');
  }
  // Without the <head> script's setLook, it still switches and shows it.
  const { p, root } = await opened({ withSetLook: false });
  p.press(lookChoice(p, 'dark'));
  assert.equal(root.dataset.theme, 'dark');
  assert.equal(lookChoice(p, 'dark').attrs['aria-checked'], 'true');
});

test('0396 AC2: the look is not sent to the server and Save stays off; storage the browser refuses still switches it', async () => {
  const { p } = await opened();
  p.press(lookChoice(p, 'dark'));
  await p.settle();
  assert.deepEqual(posted(p), []);
  assert.ok(!p.settingsCalls.some(c => /look|theme/.test(c.url)));
  const refused = await opened({ storage: { getItem: () => null, setItem() { throw new Error('SecurityError'); } } });
  refused.p.press(lookChoice(refused.p, 'dark'));
  assert.equal(refused.root.dataset.theme, 'dark');
});

test('0396 AC2: the <head> script still applies the kept look on load and has the open switch show a look it sets', () => {
  const script = page().match(/<script id="theme-start">([\s\S]*?)<\/script>/)[1];
  const root = { dataset: {} }, drawn = [];
  let onChange = null;
  const ctx = { document: { documentElement: root }, localStorage: { getItem: k => (k === 'speck-theme' ? 'dark' : null) },
    matchMedia: () => ({ matches: false, addEventListener: (t, fn) => { onChange = fn; } }) };
  ctx.globalThis = ctx;
  vm.runInNewContext(script, ctx);
  assert.equal(root.dataset.theme, 'dark', 'the kept look');
  ctx.drawLook = () => drawn.push(root.dataset.theme);
  ctx.localStorage.getItem = () => null;
  onChange({ matches: true });
  ctx.setLook('light');
  assert.deepEqual(drawn, ['dark', 'light'], 'the page shows each look it sets');
});

test('0396 AC3: Auto-build\'s switch turns speck run on and off, shows whether it\'s on, and says Auto-build, not speck run', async () => {
  const { p } = await opened({ saves: [{ ok: true, run: { on: true, pid: 7 } }, { ok: true, run: { on: false, pid: null } }] });
  const sw = runSwitch(p), row = rowOfSwitch(p, sw);
  assert.equal(nameOf(p, row), 'Auto-build');
  assert.doesNotMatch(row.children[0].textContent, /speck run/, 'its row doesn\'t say speck run');
  assert.equal(sw.attrs['aria-checked'], 'false');
  assert.match(sw.textContent, /Off/);
  p.press(sw);
  await p.settle();
  assert.equal(p.settingsCalls.filter(c => c.method === 'POST').at(-1).url, '/api/run/on');
  assert.equal(runSwitch(p), sw, 'the same switch');
  assert.equal(sw.attrs['aria-checked'], 'true');
  assert.match(sw.textContent, /On/);
  p.press(sw);
  await p.settle();
  assert.equal(p.settingsCalls.filter(c => c.method === 'POST').at(-1).url, '/api/run/off');
  assert.equal(sw.attrs['aria-checked'], 'false');
});

test('0396 AC3: what on and off do is in Auto-build\'s info button', async () => {
  const { p } = await opened();
  const row = rowOfSwitch(p, runSwitch(p));
  const info = p.all(row).find(n => n.tagName === 'button' && n.className === 'info');
  assert.ok(info, 'an info button');
  assert.equal(info.attrs['aria-label'], 'About Auto-build');
  const tip = p.all(row).find(n => n.className === 'explain' && n.id === info.attrs['aria-describedby']);
  assert.ok(tip, 'its explanation, read with it');
  assert.match(tip.textContent, /On:.*builds each ready ticket.*ships each approved one auto_ship covers/);
  assert.match(tip.textContent, /Off:.*ready tickets wait/);
  assert.equal(tip.hidden, true, 'shown only when asked for');
  p.press(info);
  assert.equal(tip.hidden, false);
});

test('0396 AC3: a refused switch shows speck run\'s message beside it, as 0368', async () => {
  const { p } = await opened({ saves: [{ status: 409, body: { error: 'speck run won\'t start: no build_command.' } }] });
  const sw = runSwitch(p);
  p.press(sw);
  await p.settle();
  const said = p.all(rowOfSwitch(p, sw)).find(n => n.tagName === 'p' && n.className === 'bad' && n.hidden === false);
  assert.equal(said?.textContent, 'speck run won\'t start: no build_command.');
  assert.equal(p.byId('run-error').textContent, 'speck run won\'t start: no build_command.');
  assert.equal(sw.attrs['aria-checked'], 'false', 'still off');
});

// 0412: Appearance is a radio group now, checked in its own tests.
test('0396 AC4: Auto-build is a button a key presses, with the switch role and a name a screen reader reads', async () => {
  const { p } = await opened();
  for (const [sw, name] of [[runSwitch(p), /^Auto-build$/]]) {
    assert.equal(sw.tagName, 'button');
    assert.equal(sw.type, 'button');
    assert.equal(sw.attrs.role, 'switch');
    assert.ok(['true', 'false'].includes(sw.attrs['aria-checked']));
    assert.equal(sw.attrs['aria-pressed'], undefined, 'a switch says it\'s on with aria-checked alone');
    assert.match(sw.attrs['aria-label'], name);
  }
});

// ---------- in a real browser ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

test('0396 AC4: at 320 px each switch is on one row with its name, and Space switches the focused one', skip, async () => {
  const panel = await sharedPanel();
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 1, mobile: true });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && !!document.getElementById('settings-open')`, 'the panel');
    await b.js(`localStorage.removeItem('speck-theme'); document.documentElement.dataset.theme = 'light'; document.getElementById('settings-open').click(); true`);
    await b.until(`!!document.getElementById('look') && !/Loading the settings/.test(document.getElementById('settings').textContent)`, 'the Settings view');
    await b.js('document.fonts.ready.then(() => true)');
    const rows = await b.js(`(() => ['look', 'run-switch'].map(id => {
      const sw = document.getElementById(id), row = sw.closest('.switch-row'), name = row.querySelector('.name');
      const s = sw.getBoundingClientRect(), n = name.getBoundingClientRect(), r = row.getBoundingClientRect(), pane = document.getElementById('settings').getBoundingClientRect();
      return { id, swMid: s.top + s.height / 2, nameMid: n.top + n.height / 2, swH: s.height, nameH: n.height, rowRight: r.right, swRight: s.right, paneRight: pane.right, rowH: r.height };
    }))()`);
    for (const r of rows) {
      assert.ok(Math.abs(r.swMid - r.nameMid) < 4, `${r.id}: the switch beside its name, ${r.swMid} and ${r.nameMid}`);
      assert.ok(r.nameH < 24, `${r.id}: its name on one line, ${r.nameH} px`);
      assert.ok(r.swH < 40, `${r.id}: the switch on one line, ${r.swH} px`);
      assert.ok(r.swRight <= r.rowRight + 0.5 && r.rowRight <= r.paneRight + 0.5, `${r.id}: inside the row: ${JSON.stringify(r)}`);
      assert.ok(r.rowH < 64, `${r.id}: one row, ${r.rowH} px`);
    }
    await b.js(`document.getElementById('look-dark').focus(); true`); // 0412: Appearance's Dark
    await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32, text: ' ' });
    await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
    await b.until(`document.documentElement.dataset.theme === 'dark' && document.getElementById('look-dark').getAttribute('aria-checked') === 'true'`, 'Space to switch to dark');
    assert.equal(await b.js(`document.activeElement === document.getElementById('look-dark')`), true, 'it keeps the focus');
  } finally {
    await b.js(`localStorage.removeItem('speck-theme'); true`).catch(() => {});
    await b.close();
  }
});
