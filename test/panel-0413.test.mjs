import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, page, fakePage, findChrome, browserPage, styles, pageScript } from './support/panel.mjs';
import { sharedPanel } from './support/shared-panel.mjs';
import { settingsPage } from './support/settings.mjs';
import { rules, get, selectors } from './support/css.mjs';
import { foreman, state } from './support/bar.mjs';

// ---------- 0413: the panel's header, the bar since 0580 ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const headerHtml = () => (page().match(/<header>([\s\S]*?)<\/header>/) || [])[1] || '';
const script = () => pageScript();
const decl = (sel, prop) => rules().filter(r => !r.at.length && selectors(r).includes(sel)).map(r => get(r, prop)).filter(v => v !== undefined).pop();

test('0413 AC1: the header is a dark frame with the status, the project and the base branch (0580: the bar)', () => {
  const h = headerHtml();
  assert.match(h, /^\s*<div class="bezel" id="bezel">\s*<button class="bar-status" id="run"[^>]*>[\s\S]*<span class="repo">\{\{repo\}\}<\/span>[\s\S]*<code>\{\{base\}\}<\/code>/);
  assert.match(decl('.bezel', 'background'), /var\(--bar\)/);
  assert.equal(decl('.bezel .bar-top .repo', 'text-overflow'), 'ellipsis');
  assert.equal(decl('.bezel .bar-more', 'white-space'), 'nowrap');
  const css = styles();
  assert.match(css.match(/:root \{([^}]*)\}/)[1], /--bar: #[0-9a-f]{6}/i, 'one bar colour, for both looks');
  assert.doesNotMatch(css.match(/:root\[data-theme="dark"\] \{([^}]*)\}/)[1], /--bar:/, 'not set again for the dark look');
});

test('0413 AC1: the old header row and the notice board are gone', () => {
  const h = headerHtml(), s = script();
  for (const gone of ['class="logo"', 'class="mark"', 'control panel', 'run-state']) assert.ok(!h.includes(gone), `no ${gone}`);
  for (const gone of ['boardText', 'drawBoard', 'boardFrame', 'board-text', "'board-dots'"]) assert.ok(!s.includes(gone), `no ${gone}`);
  assert.ok(!rules().some(r => selectors(r).some(x => /\.run-state|\.logo\b|\.board\b/.test(x))), 'none of their styles');
});

test('0413 AC2: the frame\'s edge is in the needs-you colour only while the word is "Needs you <n>"', async () => {
  assert.match(decl('.bezel.needs', 'border-color'), /var\(--bar-needs\)/, 'the bar\'s needs-you colour');
  for (const [word, needs] of [['Needs you 1', true], ['Needs you 12', true], ['Building 2', false], ['Idle', false], ['Off', false]]) {
    const p = fakePage([state(foreman({ word }))]);
    await p.settle();
    assert.equal(p.byId('bezel').className, needs ? 'bezel needs' : 'bezel', word);
  }
  const p = fakePage([state(foreman({ word: 'Needs you 1' })), state(foreman({ word: 'Idle' }))]);
  await p.settle();
  assert.equal(p.byId('bezel').className, 'bezel needs');
  p.timers.shift()(); // the next board
  await p.settle();
  assert.equal(p.byId('bezel').className, 'bezel', 'and back when nothing needs you');
});

test('0413 AC2: there\'s no text under the screen and no A, B or C button', () => {
  const h = headerHtml(), after = h.slice(h.indexOf('</button>'));
  assert.equal(after.replace(/<[^>]*>/g, '').trim(), '', 'nothing after the screen');
  assert.ok(!/>\s*[ABC]\s*</.test(h), 'no A, B or C key');
  assert.equal((h.match(/<button\b/g) || []).length, 2, 'Settings and the screen');
});

test('0413 AC3: Settings ends the frame\'s title row and opens Settings', async () => {
  const h = headerHtml();
  assert.match(h, /<\/span>\s*<button class="settings-open" id="settings-open" type="button" aria-label="Settings"[\s\S]*?<\/button>\s*<\/div>\s*$/, 'the last thing in the bar');
  const p = settingsPage([{ settings: [] }]);
  await p.settle();
  assert.equal(p.settingsCalls.some(c => c.url.startsWith('/api/settings')), false);
  p.press(p.byId('settings-open'));
  await p.settle();
  assert.ok(p.settingsCalls.some(c => c.url.startsWith('/api/settings') && c.method === 'GET'), 'it reads the settings to show them');
  assert.equal(p.byId('settings').hidden, false, 'Settings is open');
});

test('0413 AC4: pressing the screen opens the Foreman\'s detail, and again closes it', async () => {
  assert.match(headerHtml(), /<button class="bar-status" id="run" type="button"[^>]* aria-expanded="false" aria-controls="foreman"/, 'a button, so Enter and Space press it');
  const p = fakePage([state(foreman())], { scrollX: 0, scrollY: 0, scrollTo() {} });
  p.document.documentElement = { classList: { toggle() {} } };
  p.document.querySelectorAll = () => [];
  await p.settle();
  assert.equal(p.byId('foreman').hidden, true);
  p.press(p.byId('run'));
  await p.settle();
  assert.equal(p.byId('foreman').hidden, false);
  assert.equal(p.byId('run').attrs['aria-expanded'], 'true');
  assert.match(p.byId('foreman').textContent, /Pipeline log/); // 0415: titled Pipeline. 0458: with only the log. 0470: titled Pipeline log
  p.press(p.byId('run'));
  await p.settle();
  assert.equal(p.byId('foreman').hidden, true);
});

test('0413 AC4: while the panel runs newer code, the top row reads "Reload page" and the detail offers its Reload page button', async () => {
  const p = fakePage([state(foreman({ word: 'Needs you 1' }), { page: 'newer' })], { scrollX: 0, scrollY: 0, scrollTo() {} });
  p.document.documentElement = { classList: { toggle() {} } };
  p.document.querySelectorAll = () => [];
  await p.settle();
  assert.equal(p.byId('bar-word').textContent, 'Reload page');
  assert.equal(p.byId('bezel').className, 'bezel', 'the word is Reload page now');
  assert.match(p.byId('run').title, /^speck: Reload page · /); // 0485: the word is in its tooltip
  p.press(p.byId('run'));
  await p.settle();
  const reload = p.all(p.byId('foreman')).find(n => n.id === 'foreman-reload');
  assert.ok(reload, 'its Reload page button');
  assert.equal(reload.textContent, 'Reload page');
});

// 0485: its accessible name is speck's screen, and the word is in its tooltip, which a screen reader reads with it.
test('0413 AC5: the screen\'s tooltip includes speck\'s word', async () => {
  for (const word of ['Off', 'Idle', 'Building 2', 'Needs you 1']) {
    const p = fakePage([state(foreman({ word }))]);
    await p.settle();
    assert.ok(p.byId('run').title.startsWith(`speck: ${word} · `), `${word}: ${p.byId('run').title}`);
  }
  assert.doesNotMatch(headerHtml(), /<canvas/, 'no canvas: the face is an svg (0580)');
});

// A long board, so the lane's list scrolls, at 320 px.
const STATE = { tickets: Array.from({ length: 30 }, (_, i) => T(String(5000 + i), 'ready')), ideas: [], run: { on: true, pid: 1 },
  foreman: foreman({ word: 'Needs you 1', tone: 'bad' }) };
test('0413 AC1, AC4 and AC5: at 320 px the frame fits without sideways scrolling, stays at the top while the list scrolls, and Enter and Space open the detail', skip, async () => {
  const panel = await sharedPanel();
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 1, mobile: true });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
      const STATE = ${JSON.stringify(STATE)}, real = window.fetch.bind(window);
      window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? new Response(JSON.stringify(STATE), { status: 200, headers: { 'content-type': 'application/json' } }) : real(url, opts);
    })();` });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && /Needs you 1/.test(document.querySelector('#run').title || '')`, 'the panel');
    await b.js('document.fonts.ready.then(() => true)');
    const m = await b.js(`(() => {
      const r = s => { const b = document.querySelector(s).getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, height: b.height }; };
      const repo = document.querySelector('.bar-top .repo');
      return { page: document.documentElement.scrollWidth, width: innerWidth, bezel: r('.bezel'), repo: r('.bar-top .repo'),
        settings: r('#settings-open'), screen: r('#run'), face: r('#bar-face svg'), repoCut: repo.scrollWidth > repo.clientWidth, edge: getComputedStyle(document.querySelector('.bezel')).borderTopColor };
    })()`);
    const at = JSON.stringify(m);
    assert.ok(m.page <= m.width, `no sideways scrolling: ${at}`);
    for (const k of ['bezel', 'repo', 'settings', 'screen', 'face']) assert.ok(m[k].left >= 0 && m[k].right <= m.width + 0.5, `${k} is on screen: ${at}`);
    assert.ok(m.repo.right <= m.settings.left + 0.5 && m.settings.right <= m.bezel.right, `the status, then Settings, in the bar: ${at}`);
    assert.ok(m.face.height >= 40, `speck is drawn: ${at}`);
    assert.notEqual(m.edge, await b.js(`getComputedStyle(document.querySelector('.bezel')).backgroundColor`), 'the frame\'s edge shows the needs-you colour');
    // The list scrolls and the screen stays.
    const top = await b.js(`document.querySelector('header').getBoundingClientRect().top`);
    const scrolled = await b.js(`(() => { const l = document.querySelector('#build-section .lane-list') || document.querySelector('main'); l.scrollTop = 400; return [l.scrollTop, document.querySelector('header').getBoundingClientRect().top, scrollY]; })()`);
    assert.ok(scrolled[0] > 0, `the list scrolled: ${scrolled}`);
    assert.equal(scrolled[1], top, 'the screen stays at the top');
    assert.equal(scrolled[2], 0, 'the page itself doesn\'t scroll');
    // Enter and Space on the focused screen open the Foreman's detail.
    for (const key of ['Enter', ' ']) {
      await b.js(`document.querySelector('#run').focus()`);
      const code = key === 'Enter' ? 'Enter' : 'Space', vk = key === 'Enter' ? 13 : 32;
      await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk, text: key === 'Enter' ? '\r' : ' ' });
      await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk });
      await b.until(`!document.querySelector('#foreman').hidden`, `the detail, with ${code}`);
      await b.js(`document.querySelector('#foreman .close').click()`);
      await b.until(`document.querySelector('#foreman').hidden`, 'the detail closed');
    }
  } finally { await b.close(); }
});

// 0451: "FIXING ON" is gone from the top row, which has the time at its right instead (panel-0451.test.mjs).
