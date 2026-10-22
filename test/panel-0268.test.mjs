import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, panelRepo, freePort, startPanel, stop, findChrome, browserPage, heldTimeouts } from './support/panel.mjs';

// ---------- 0268: each setting's explanation in a tooltip ----------

const KEYS = ['auto_ship', 'auto_ship_risk', 'builder', 'reviewer', 'max_parallel_builds', 'limits.max_review_rounds'];
const view = () => ({ groups: [{ title: 'Some', settings: KEYS.map(key => ({ key, value: 1, default: false, explain: `What ${key} does.`, editable: key === 'reviewer' })) }] });

// A page whose fetch answers the board with an empty one and GET /api/settings with `view()`.
async function openSettings() {
  const fetch = async url => ({ ok: true, status: 200, json: async () => String(url).startsWith('/api/settings') ? view() : { tickets: [], ideas: [], resume_command: '' } });
  const clock = heldTimeouts(); // 0371: the pointer's pause before an explanation shows
  const p = fakePage([], { fetch, setTimeout: clock.setTimeout, clearTimeout: clock.clearTimeout });
  p.rest = () => clock.rest(500);
  await p.settle();
  p.press(p.byId('settings-open'));
  await p.settle();
  return p;
}
const rowOf = (p, key) => p.all(p.byId('settings')).filter(n => /\bsetting\b/.test(n.className || ''))
  .find(r => p.all(r).find(n => /\bname\b/.test(n.className || ''))?.textContent === key);
const infoOf = (p, key) => p.all(rowOf(p, key)).find(n => n.tagName === 'button' && /\binfo\b/.test(n.className));
const tipOf = (p, key) => p.all(rowOf(p, key)).find(n => n.tagName === 'p' && n.textContent === `What ${key} does.`);
const shown = p => KEYS.filter(k => !tipOf(p, k).hidden);
const fire = (n, type) => n.listeners[type]({ target: n, currentTarget: n, stopPropagation() {}, preventDefault() {} });
// 0371: the pointer onto the info button, resting there until its explanation's pause is up.
const hover = (p, n) => { fire(n, 'mouseenter'); p.rest(); };

test('0268 AC1: no explanation shows until asked for, and each setting has an info button beside its name, named after the setting', async () => {
  const p = await openSettings();
  for (const k of KEYS) {
    const tip = tipOf(p, k), info = infoOf(p, k);
    assert.ok(tip, `${k}'s explanation is in the view`);
    assert.equal(tip.hidden, true, `${k}'s explanation is hidden`);
    assert.ok(info, `${k} has an info button`);
    assert.equal(info.type, 'button');
    assert.equal(info.attrs['aria-label'], `About ${k}`);
    const line = info.parentNode;
    const name = line.children.find(n => /\bname\b/.test(n.className || ''));
    assert.equal(line.children.indexOf(info), line.children.indexOf(name) + 1, `${k}'s info button is just after its name`);
  }
});

test('0268 AC2: the explanation shows while the pointer is over the info button, and while it has focus', async () => {
  const p = await openSettings();
  const info = infoOf(p, 'builder');
  hover(p, info);
  assert.deepEqual(shown(p), ['builder']);
  fire(info, 'mouseleave');
  assert.deepEqual(shown(p), []);
  fire(info, 'focus');
  assert.deepEqual(shown(p), ['builder']);
  fire(info, 'blur');
  assert.deepEqual(shown(p), []);
  // Both at once: it stays until both have ended.
  fire(info, 'focus');
  hover(p, info);
  fire(info, 'mouseleave');
  assert.deepEqual(shown(p), ['builder'], 'still focused');
  fire(info, 'blur');
  assert.deepEqual(shown(p), []);
});

test('0268 AC2: a tap or click keeps it until it is tapped or clicked again, or another setting\'s is opened', async () => {
  const p = await openSettings();
  const a = infoOf(p, 'auto_ship'), b = infoOf(p, 'reviewer');
  // A tap: focus, then a click.
  fire(a, 'focus');
  p.press(a);
  fire(a, 'blur');
  assert.deepEqual(shown(p), ['auto_ship'], 'kept after focus leaves');
  // A mouse click: hover, then a click.
  hover(p, a);
  p.press(a);
  assert.deepEqual(shown(p), [], 'a second click hides it, though the pointer is still over it');
  p.press(a);
  fire(a, 'mouseleave');
  assert.deepEqual(shown(p), ['auto_ship'], 'kept after the pointer leaves');
  p.press(b);
  assert.deepEqual(shown(p), ['reviewer'], 'another setting\'s replaces it');
  hover(p, a);
  assert.deepEqual(shown(p), ['auto_ship'], 'hovering another opens it instead');
  fire(a, 'mouseleave');
  assert.deepEqual(shown(p), []);
});

test('0268 AC3: Escape hides an open explanation and leaves the view open, and with none open it closes the view', async () => {
  const p = await openSettings();
  for (const how of ['click', 'focus', 'mouseenter']) {
    const info = infoOf(p, 'reviewer');
    if (how === 'click') p.press(info); else if (how === 'mouseenter') hover(p, info); else fire(info, how);
    assert.deepEqual(shown(p), ['reviewer'], how);
    p.key('Escape');
    assert.deepEqual(shown(p), [], `${how}: Escape hides it`);
    assert.equal(p.byId('settings').hidden, false, `${how}: the view stays open`);
    fire(info, how === 'click' ? 'blur' : how === 'focus' ? 'blur' : 'mouseleave');
  }
  p.key('Escape');
  assert.equal(p.byId('settings').hidden, true, 'the next Escape closes the view');
});

test('0268 AC3: closing and opening the view again starts with every explanation hidden', async () => {
  const p = await openSettings();
  p.press(infoOf(p, 'builder'));
  p.key('Escape');
  p.key('Escape');
  p.press(p.byId('settings-open'));
  await p.settle();
  assert.deepEqual(shown(p), []);
});

test('0268 AC4: each info button is linked to its own explanation, inside its setting in the Settings view', async () => {
  const p = await openSettings();
  const ids = new Set();
  for (const k of KEYS) {
    const tip = tipOf(p, k), id = infoOf(p, k).attrs['aria-describedby'];
    assert.ok(id, `${k} has aria-describedby`);
    assert.equal(tip.id, id, `${k}'s button points at its explanation`);
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
    await b.until(`!!document.querySelector('#settings .setting .info')`, 'the settings');
    const out = await b.js(`[...document.querySelectorAll('#settings .setting .info')].map(info => {
      info.click();
      const pane = document.getElementById('settings').getBoundingClientRect();
      const tip = document.getElementById(info.getAttribute('aria-describedby'));
      const r = tip.getBoundingClientRect();
      const res = { name: info.getAttribute('aria-label'), shown: !tip.hidden && r.width > 0, inside: r.left >= pane.left && r.right <= pane.right + 0.5,
        scrolls: document.getElementById('settings').scrollWidth > document.getElementById('settings').clientWidth };
      info.click();
      return res;
    })`);
    assert.ok(out.length >= 10, 'every setting has its button');
    for (const o of out) {
      assert.ok(o.shown, `${o.name}: shown once clicked`);
      assert.ok(o.inside, `${o.name}: inside the view`);
      assert.equal(o.scrolls, false, `${o.name}: the view doesn't scroll sideways`);
    }
  } finally { await b.close(); await stop(panel); }
});
