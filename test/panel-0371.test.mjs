import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, heldTimeouts, page, panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0371: a setting's explanation floats over its row, after a pause ----------

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
const rowOf = (p, key) => p.all(p.byId('settings')).filter(n => /\bsetting\b/.test(n.className || ''))
  .find(r => p.all(r).find(n => /\bname\b/.test(n.className || ''))?.textContent === key);
const infoOf = (p, key) => p.all(rowOf(p, key)).find(n => n.tagName === 'button' && /\binfo\b/.test(n.className));
const tipOf = (p, key) => p.all(rowOf(p, key)).find(n => n.tagName === 'p' && n.textContent === `What ${key} does.`);
const shown = p => KEYS.filter(k => !tipOf(p, k).hidden);
const fire = (n, type) => n.listeners[type]({ target: n, currentTarget: n, stopPropagation() {}, preventDefault() {} });

test('0371 AC1: the explanation is taken out of the flow, floated just above its row and over what is there', async () => {
  const css = page();
  const rule = sel => (css.match(new RegExp(`${sel.replace(/[.]/g, '\\.')} \\{([^}]*)\\}`)) || [])[1] || '';
  assert.match(rule('#settings .setting'), /position: relative/, 'the row is what it floats from');
  const tip = rule('#settings .setting p.explain');
  assert.match(tip, /position: absolute/, 'out of the flow, so nothing moves');
  assert.match(tip, /bottom: calc\(100% - 4px\)/, 'above the row');
  assert.match(tip, /z-index: 2/, 'over what is behind it');
  assert.match(rule('#settings .setting p.explain.below'), /top: calc\(100% - 4px\)/, 'below the row when there is no room above');
});

test('0371 AC2: the pointer must rest on the info button for half a second before the explanation shows', async () => {
  const p = await openSettings();
  const info = infoOf(p, 'builder');
  fire(info, 'mouseenter');
  assert.deepEqual(shown(p), [], 'not as soon as the pointer is over it');
  assert.equal(p.clock.pending(500), 1, 'a pause of half a second');
  p.clock.rest(500);
  assert.deepEqual(shown(p), ['builder'], 'shown once the pause is up');
  fire(info, 'mouseleave');
  assert.deepEqual(shown(p), [], 'moving off afterwards hides it');
});

test('0371 AC2: moving off before the half second shows nothing, even if the pointer comes back for less than that', async () => {
  const p = await openSettings();
  const a = infoOf(p, 'builder'), b = infoOf(p, 'auto_ship');
  fire(a, 'mouseenter');
  fire(a, 'mouseleave');
  p.clock.rest(500);
  assert.deepEqual(shown(p), [], 'off before the pause ends');
  fire(a, 'mouseenter');
  fire(a, 'mouseleave');
  fire(a, 'mouseenter'); // back again: only its own pause counts
  const first = p.clock.pending(500);
  assert.equal(first, 2);
  fire(b, 'mouseenter'); // on to another one before the pause ends
  p.clock.rest(500);
  assert.deepEqual(shown(p), ['auto_ship'], 'only the button the pointer rested on last');
});

test('0371 AC2: moving off after a click keeps the explanation open', async () => {
  const p = await openSettings();
  const info = infoOf(p, 'reviewer');
  fire(info, 'mouseenter');
  p.press(info);
  fire(info, 'mouseleave');
  p.clock.rest(500);
  assert.deepEqual(shown(p), ['reviewer']);
});

test('0371 AC3: a click shows it at once and keeps it until clicked again or another is opened; focus shows it at once', async () => {
  const p = await openSettings();
  const a = infoOf(p, 'builder'), b = infoOf(p, 'reviewer');
  fire(a, 'mouseenter');
  p.press(a);
  assert.deepEqual(shown(p), ['builder'], 'a click: at once, with no pause');
  p.clock.rest(500); // the pause from the hover ends while it's kept
  assert.deepEqual(shown(p), ['builder']);
  fire(a, 'mouseleave');
  assert.deepEqual(shown(p), ['builder'], 'kept after the pointer leaves');
  p.press(b);
  assert.deepEqual(shown(p), ['reviewer'], 'another setting\'s replaces it');
  p.press(b);
  assert.deepEqual(shown(p), [], 'a second click hides it');
  fire(a, 'focus');
  assert.deepEqual(shown(p), ['builder'], 'keyboard focus: at once');
  fire(a, 'blur');
  assert.deepEqual(shown(p), []);
});

test('0371 AC3: Escape hides an open explanation and leaves Settings open', async () => {
  const p = await openSettings();
  const info = infoOf(p, 'auto_ship');
  fire(info, 'mouseenter');
  p.clock.rest(500);
  assert.deepEqual(shown(p), ['auto_ship']);
  p.key('Escape');
  assert.deepEqual(shown(p), []);
  assert.equal(p.byId('settings').hidden, false);
  p.press(info);
  p.key('Escape');
  assert.deepEqual(shown(p), []);
  assert.equal(p.byId('settings').hidden, false);
});

test('0371 AC4: each info button is still described by its own explanation, inside its setting', async () => {
  const p = await openSettings();
  for (const k of KEYS) {
    const tip = tipOf(p, k), info = infoOf(p, k);
    assert.ok(tip.id);
    assert.equal(info.attrs['aria-describedby'], tip.id);
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
    await b.until(`!!document.querySelector('#settings .setting .info')`, 'the settings');
    const out = await b.js(`(() => {
      const pane = document.getElementById('settings');
      const rows = () => [...pane.querySelectorAll('.setting')].map(r => r.getBoundingClientRect().top + pane.scrollTop);
      const res = [];
      for (const [i, info] of [...pane.querySelectorAll('.setting .info')].entries()) {
        const row = info.closest('.setting');
        if (i % 2) row.scrollIntoView({ block: 'center' }); else pane.scrollTop += row.getBoundingClientRect().top - pane.getBoundingClientRect().top; // its row at the very top
        const atTop = Math.abs(row.getBoundingClientRect().top - pane.getBoundingClientRect().top) < 1;
        const before = rows();
        info.click();
        const after = rows();
        const tip = document.getElementById(info.getAttribute('aria-describedby'));
        const t = tip.getBoundingClientRect(), p = pane.getBoundingClientRect(), w = row.getBoundingClientRect();
        const hit = document.elementFromPoint((t.left + t.right) / 2, (t.top + t.bottom) / 2);
        res.push({ name: info.getAttribute('aria-label'), top: atTop, moved: before.some((y, j) => Math.abs(y - after[j]) > 0.5),
          shown: !tip.hidden && t.width > 0, inside: t.left >= p.left && t.right <= p.right + 0.5 && t.top >= p.top - 0.5,
          over: !!hit && tip.contains(hit), above: t.bottom <= w.top + 5, below: t.top >= w.bottom - 5 });
        info.click();
      }
      return res;
    })()`);
    assert.ok(out.length >= 10, 'every setting has its button');
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
