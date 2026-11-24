import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, heldTimeouts, page, panelRepo, freePort, startPanel, stop, findChrome, browserPage, styles } from './support/panel.mjs';

// ---------- 0371: a setting's explanation floats over its row. 0729: on a press of its name, with no pause ----------

const KEYS = ['auto_ship', 'builder', 'reviewer', 'max_parallel_builds'];
const view = () => ({ groups: [{ title: 'Some', settings: KEYS.map(key => ({ key, value: 1, default: false, explain: `What ${key} does.`, editable: key === 'reviewer' })) }] });

async function openSettings() {
  const fetch = async url => ({ ok: true, status: 200, json: async () => String(url).startsWith('/api/settings') ? view() : { tickets: [], ideas: [], resume_command: '' } });
  const clock = heldTimeouts();
  const p = fakePage([], { fetch, setTimeout: clock.setTimeout, clearTimeout: clock.clearTimeout });
  p.clock = clock;
  await p.settle();
  p.press(p.byId('settings-open'));
  await p.settle();
  return p;
}
const rowOf = (p, key) => p.all(p.byId('settings')).filter(n => /\bsetting\b/.test(n.className || '')).find(r => r.attrs?.['data-key'] === key);
// 0729: the setting's name and short line, the button that shows its explanation in place of an info button
const nameOf = (p, key) => p.all(rowOf(p, key)).find(n => n.tagName === 'button' && /\bname\b/.test(n.className));
const tipOf = (p, key) => p.all(rowOf(p, key)).find(n => n.tagName === 'p' && n.textContent === `What ${key} does.`);
const shown = p => KEYS.filter(k => !tipOf(p, k).hidden);

test('0371 AC1: the explanation is taken out of the flow, floated just above its row and over what is there', async () => {
  const css = styles();
  const rule = sel => (css.match(new RegExp(`${sel.replace(/[.]/g, '\\.')} \\{([^}]*)\\}`)) || [])[1] || '';
  assert.match(rule('#settings .setting'), /position: relative/, 'the row is what it floats from');
  const tip = rule('#settings .setting p.explain');
  assert.match(tip, /position: absolute/, 'out of the flow, so nothing moves');
  assert.match(tip, /bottom: calc\(100% - 4px\)/, 'above the row');
  assert.match(tip, /z-index: 2/, 'over what is behind it');
  assert.match(rule('#settings .setting p.explain.below'), /top: calc\(100% - 4px\)/, 'below the row when there is no room above');
});

// 0729: a setting's name is a big target, so nothing shows from the pointer resting on it, which the info button's pause was for
test('0371 AC2: the pointer resting on a setting\'s name shows nothing, and waits for nothing (0729)', async () => {
  const p = await openSettings();
  for (const k of KEYS) for (const type of ['mouseenter', 'mouseleave']) assert.equal(nameOf(p, k).listeners[type], undefined, `${k}: nothing on ${type}`);
  assert.equal(p.clock.pending(500), 0, 'no pause is waited on');
  assert.deepEqual(shown(p), []);
});

test('0371 AC3: a press shows it at once and keeps it until pressed again or another is opened; focus alone shows nothing (0729)', async () => {
  const p = await openSettings();
  const a = nameOf(p, 'builder'), b = nameOf(p, 'reviewer');
  p.press(a);
  assert.deepEqual(shown(p), ['builder'], 'a press: at once, with no pause');
  assert.equal(p.clock.pending(500), 0);
  p.press(b);
  assert.deepEqual(shown(p), ['reviewer'], 'another setting\'s replaces it');
  p.press(b);
  assert.deepEqual(shown(p), [], 'a second press hides it');
  assert.equal(a.listeners.focus, undefined, 'keyboard focus shows nothing: Enter or Space presses it');
});

test('0371 AC3: Escape hides an open explanation and leaves Settings open', async () => {
  const p = await openSettings();
  const name = nameOf(p, 'auto_ship');
  p.press(name);
  assert.deepEqual(shown(p), ['auto_ship']);
  p.key('Escape');
  assert.deepEqual(shown(p), []);
  assert.equal(p.byId('settings').hidden, false);
  p.press(name);
  assert.deepEqual(shown(p), ['auto_ship'], 'it shows again on the next press');
  p.key('Escape');
  assert.deepEqual(shown(p), []);
  assert.equal(p.byId('settings').hidden, false);
});

test('0371 AC4: each setting\'s name is still described by its own explanation, inside its setting', async () => {
  const p = await openSettings();
  for (const k of KEYS) {
    const tip = tipOf(p, k), name = nameOf(p, k);
    assert.ok(tip.id);
    assert.equal(name.attrs['aria-describedby'], tip.id);
    assert.equal(tip.parentNode, rowOf(p, k), `${k}'s explanation is in its own row`);
  }
});

// The real layout: showing an explanation moves no setting, floats over what's there and stays in the view, at the
// panel's narrowest width, including for a row at the very top of what's shown.
const skip = findChrome() ? false : 'needs Chrome or Chromium';
test('0371 AC1, AC4: at the narrowest width, showing an explanation moves nothing and it floats inside the view', { skip }, async () => {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 1, mobile: true });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete'`, 'the panel');
    await b.js(`document.getElementById('settings-open').click()`);
    await b.until(`!!document.querySelector('#settings .setting .label button.name')`, 'the settings');
    const out = await b.js(`(() => {
      const pane = document.getElementById('settings');
      const rows = () => [...pane.querySelectorAll('.setting')].map(r => r.getBoundingClientRect().top + pane.scrollTop);
      const res = [];
      for (const [i, info] of [...pane.querySelectorAll('.setting .label button.name')].entries()) {
        const row = info.closest('.setting');
        if (i % 2) row.scrollIntoView({ block: 'center' }); else pane.scrollTop += row.getBoundingClientRect().top - pane.getBoundingClientRect().top; // its row at the very top
        const atTop = Math.abs(row.getBoundingClientRect().top - pane.getBoundingClientRect().top) < 1;
        const before = rows();
        info.click();
        const after = rows();
        const tip = document.getElementById(info.getAttribute('aria-describedby'));
        const t = tip.getBoundingClientRect(), p = pane.getBoundingClientRect(), w = row.getBoundingClientRect();
        const hit = document.elementFromPoint((t.left + t.right) / 2, (t.top + t.bottom) / 2);
        res.push({ name: row.getAttribute('data-key'), top: atTop, moved: before.some((y, j) => Math.abs(y - after[j]) > 0.5),
          shown: !tip.hidden && t.width > 0, inside: t.left >= p.left && t.right <= p.right + 0.5 && t.top >= p.top - 0.5,
          over: !!hit && tip.contains(hit), above: t.bottom <= w.top + 5, below: t.top >= w.bottom - 5 });
        info.click();
      }
      return res;
    })()`);
    assert.ok(out.length >= 10, 'every setting has its name as a button');
    for (const o of out) {
      assert.ok(o.shown, `${o.name}: shown once clicked`);
      assert.equal(o.moved, false, `${o.name}: no setting moved`);
      assert.ok(o.inside, `${o.name}: inside the view`);
      assert.ok(o.over, `${o.name}: over what is behind it`);
      assert.ok(o.above || o.below, `${o.name}: just above or below its row`);
      if (o.top) assert.ok(o.below, `${o.name}: at the top of the view, it goes below its row`);
    }
    assert.ok(out.some(o => o.top), 'some row was at the very top');
    assert.ok(out.some(o => !o.top && o.above), 'a row with room above it gets its explanation above');
  } finally { await b.close(); await stop(panel); }
});
