import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, panelRepo, freePort, startPanel, stop, findChrome, browserPage, heldTimeouts } from './support/panel.mjs';

// ---------- 0268: each setting's explanation in a tooltip. 0729: shown from the setting's name, not an info button ----------

const KEYS = ['auto_ship', 'auto_ship_risk', 'builder', 'reviewer', 'max_parallel_builds', 'limits.max_review_rounds'];
const view = () => ({ groups: [{ title: 'Some', settings: KEYS.map(key => ({ key, value: 1, default: false, explain: `What ${key} does.`, editable: key === 'reviewer' })) }] });

// A page whose fetch answers the board with an empty one and GET /api/settings with `view()`.
async function openSettings() {
  const fetch = async url => ({ ok: true, status: 200, json: async () => String(url).startsWith('/api/settings') ? view() : { tickets: [], ideas: [], resume_command: '' } });
  const clock = heldTimeouts(); // 0371: nothing waits on the pointer any more (0729), which this shows
  const p = fakePage([], { fetch, setTimeout: clock.setTimeout, clearTimeout: clock.clearTimeout });
  p.clock = clock;
  await p.settle();
  p.press(p.byId('settings-open'));
  await p.settle();
  return p;
}
const rowOf = (p, key) => p.all(p.byId('settings')).filter(n => /\bsetting\b/.test(n.className || '')).find(r => r.attrs?.['data-key'] === key);
// 0729: the setting's name and short line, a button that shows its explanation
const nameOf = (p, key) => p.all(rowOf(p, key)).find(n => n.tagName === 'button' && /\bname\b/.test(n.className));
const tipOf = (p, key) => p.all(rowOf(p, key)).find(n => n.tagName === 'p' && n.textContent === `What ${key} does.`);
const shown = p => KEYS.filter(k => !tipOf(p, k).hidden);

test('0268 AC1: no explanation shows until asked for, and each setting\'s name, before its control, is the button that shows it (0729: no info button)', async () => {
  const p = await openSettings();
  for (const k of KEYS) {
    const tip = tipOf(p, k), name = nameOf(p, k);
    assert.ok(tip, `${k}'s explanation is in the view`);
    assert.equal(tip.hidden, true, `${k}'s explanation is hidden`);
    assert.ok(name, `${k}'s name is a button`);
    assert.equal(name.type, 'button');
    assert.equal(name.attrs['aria-expanded'], 'false', `${k}: said to be closed`);
    const line = name.parentNode.parentNode;
    assert.equal(line.children.indexOf(name.parentNode), 0, `${k}'s name starts its row`);
    assert.match(line.children[1].className, /\bcontrol\b/, `${k}'s control is after its name`);
    assert.ok(!p.all(rowOf(p, k)).some(n => /\binfo\b/.test(n.className || '')), `${k} has no info button`);
  }
});

test('0268 AC2: the explanation shows on a press of the name, not while the pointer is over it or it has focus (0729)', async () => {
  const p = await openSettings();
  const name = nameOf(p, 'builder');
  for (const type of ['mouseenter', 'mouseleave', 'focus', 'blur']) assert.equal(name.listeners[type], undefined, `nothing waits for ${type}`);
  assert.equal(p.clock.pending(500), 0, 'nor for the pointer to rest on it');
  p.press(name);
  assert.deepEqual(shown(p), ['builder'], 'shown at once on a press');
  assert.equal(name.attrs['aria-expanded'], 'true');
});

test('0268 AC2: a tap or click keeps it until it is tapped or clicked again, or another setting\'s is opened', async () => {
  const p = await openSettings();
  const a = nameOf(p, 'auto_ship'), b = nameOf(p, 'reviewer');
  p.press(a);
  assert.deepEqual(shown(p), ['auto_ship'], 'kept after a press');
  p.press(a);
  assert.deepEqual(shown(p), [], 'a second press hides it');
  p.press(a);
  p.press(b);
  assert.deepEqual(shown(p), ['reviewer'], 'another setting\'s replaces it');
  assert.deepEqual([a.attrs['aria-expanded'], b.attrs['aria-expanded']], ['false', 'true'], 'each says whether its own is open');
});

test('0268 AC3: Escape hides an open explanation and leaves the view open, and with none open it closes the view', async () => {
  const p = await openSettings();
  const name = nameOf(p, 'reviewer');
  p.press(name);
  assert.deepEqual(shown(p), ['reviewer']);
  p.key('Escape');
  assert.deepEqual(shown(p), [], 'Escape hides it');
  assert.equal(name.attrs['aria-expanded'], 'false');
  assert.equal(p.byId('settings').hidden, false, 'the view stays open');
  p.key('Escape');
  assert.equal(p.byId('settings').hidden, true, 'the next Escape closes the view');
});

test('0268 AC3: closing and opening the view again starts with every explanation hidden', async () => {
  const p = await openSettings();
  p.press(nameOf(p, 'builder'));
  p.key('Escape');
  p.key('Escape');
  p.press(p.byId('settings-open'));
  await p.settle();
  assert.deepEqual(shown(p), []);
});

test('0268 AC4: each setting\'s name is linked to its own explanation, inside its setting in the Settings view', async () => {
  const p = await openSettings();
  const ids = new Set();
  for (const k of KEYS) {
    const tip = tipOf(p, k), id = nameOf(p, k).attrs['aria-describedby'];
    assert.ok(id, `${k} has aria-describedby`);
    assert.equal(tip.id, id, `${k}'s name points at its explanation`);
    assert.equal(nameOf(p, k).attrs['aria-controls'], id, `${k}'s name controls it`);
    ids.add(id);
    let n = tip;
    while (n && n !== p.byId('settings')) n = n.parentNode;
    assert.ok(n, `${k}'s explanation is inside the Settings view`);
  }
  assert.equal(ids.size, KEYS.length, 'every id is its own');
});

const skip = findChrome() ? false : 'needs Chrome or Chromium';
test('0268 AC4: at the panel\'s narrowest width, each explanation stays inside the Settings view', { skip }, async () => {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 1, mobile: true });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete'`, 'the panel');
    await b.js(`document.getElementById('settings-open').click()`);
    await b.until(`!!document.querySelector('#settings .setting .label button.name')`, 'the settings');
    const out = await b.js(`[...document.querySelectorAll('#settings .setting .label button.name')].map(info => {
      info.click();
      const pane = document.getElementById('settings').getBoundingClientRect();
      const tip = document.getElementById(info.getAttribute('aria-describedby'));
      const r = tip.getBoundingClientRect();
      const res = { name: info.closest('.setting').getAttribute('data-key'), shown: !tip.hidden && r.width > 0, inside: r.left >= pane.left && r.right <= pane.right + 0.5,
        scrolls: document.getElementById('settings').scrollWidth > document.getElementById('settings').clientWidth };
      info.click();
      return res;
    })`);
    assert.ok(out.length >= 10, 'every setting has its name as a button');
    for (const o of out) {
      assert.ok(o.shown, `${o.name}: shown once clicked`);
      assert.ok(o.inside, `${o.name}: inside the view`);
      assert.equal(o.scrolls, false, `${o.name}: the view doesn't scroll sideways`);
    }
  } finally { await b.close(); await stop(panel); }
});
