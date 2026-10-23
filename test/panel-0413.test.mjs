import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, page, findChrome, browserPage } from './support/panel.mjs';
import { sharedPanel } from './support/shared-panel.mjs';
import { settingsPage } from './support/settings.mjs';
import { rules, get, selectors } from './support/css.mjs';
import { screenPage, foreman, state, wordDots, expected } from './support/screen.mjs';

// ---------- 0413: speck's LCD screen is the panel's header ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const headerHtml = () => (page().match(/<header>([\s\S]*?)<\/header>/) || [])[1] || '';
const script = () => page().match(/<script>([\s\S]*?)<\/script>/)[1];
const decl = (sel, prop) => rules().filter(r => !r.at.length && selectors(r).includes(sel)).map(r => get(r, prop)).filter(v => v !== undefined).pop();

test('0413 AC1: the header is speck\'s screen in its dark frame, under a title row of speck, then the project and base branch', () => {
  const h = headerHtml();
  assert.match(h, /^\s*<div class="bezel" id="bezel">\s*<div class="print"><b class="name">speck<\/b><span class="repo">\{\{repo\}\} · <code>\{\{base\}\}<\/code><\/span>/);
  assert.match(h, /<\/div>\s*<button class="glass" id="run"[^>]*><canvas class="lcd" id="screen" aria-hidden="true"><\/canvas><\/button>\s*<\/div>\s*$/, 'the screen under the title row, in the frame');
  assert.match(decl('.bezel', 'background'), /var\(--bezel\)/);
  assert.match(decl('.bezel .name', 'font-family'), /^"Doto",/, 'speck in the dot-matrix font');
  assert.equal(decl('.bezel .repo', 'text-overflow'), 'ellipsis');
  assert.equal(decl('.bezel .repo', 'white-space'), 'nowrap');
  assert.equal(decl('.bezel .repo', 'font-size') || (/\b(\d+)px\b/.exec(decl('.bezel .repo', 'font')) || [])[0], '12px', 'small plain text');
  const css = page().match(/<style>([\s\S]*?)<\/style>/)[1];
  for (const look of [/:root \{([^}]*)\}/, /:root\[data-theme="dark"\] \{([^}]*)\}/]) assert.match(css.match(look)[1], /--bezel: #[0-9a-f]{6}/, 'a frame colour in each look');
});

test('0413 AC1: the old header row and the notice board are gone', () => {
  const h = headerHtml(), s = script();
  for (const gone of ['class="logo"', 'class="mark"', 'control panel', 'run-state']) assert.ok(!h.includes(gone), `no ${gone}`);
  for (const gone of ['boardText', 'drawBoard', 'boardFrame', 'board-text', "'board-dots'"]) assert.ok(!s.includes(gone), `no ${gone}`);
  assert.ok(!rules().some(r => selectors(r).some(x => /\.run-state|\.logo\b|\.board\b/.test(x))), 'none of their styles');
});

test('0413 AC2: the top row shows the Foreman\'s word in the dot font, in capitals, with speck below it', async () => {
  for (const word of ['Off', 'Idle', 'Building 2', 'Needs you 1']) {
    const p = screenPage([state(foreman({ word }))]);
    await p.settle();
    assert.ok(p.made(), `the screen is made: ${word}`);
    assert.equal(p.made().cols, 160);
    assert.deepEqual(wordDots(p.draw()), expected(word.toUpperCase(), 4, 2), word);
    assert.ok(p.cast().cur, 'speck is cast'); // 0414: in the pose the pipeline gives it (panel-0414.test.mjs)
    const below = p.draw().filter(([, r]) => r > 12);
    assert.ok(below.length > 100, `speck is drawn below the word: ${below.length} dots`);
  }
});

test('0413 AC2: the frame\'s edge is in the needs-you colour only while the word is "Needs you <n>"', async () => {
  assert.match(decl('.bezel.needs', 'border-color'), /var\(--bad\)/, 'the panel\'s needs-you colour, as on the Build tab');
  for (const [word, needs] of [['Needs you 1', true], ['Needs you 12', true], ['Building 2', false], ['Idle', false], ['Off', false]]) {
    const p = screenPage([state(foreman({ word }))]);
    await p.settle();
    assert.equal(p.byId('bezel').className, needs ? 'bezel needs' : 'bezel', word);
  }
  const p = screenPage([state(foreman({ word: 'Needs you 1' })), state(foreman({ word: 'Idle' }))]);
  await p.settle();
  assert.equal(p.byId('bezel').className, 'bezel needs');
  p.timers.shift()(); // the next board
  await p.settle();
  assert.equal(p.byId('bezel').className, 'bezel', 'and back when nothing needs you');
});

test('0413 AC2: there\'s no text under the screen and no A, B or C button', () => {
  const h = headerHtml(), after = h.slice(h.indexOf('<button class="glass"'));
  assert.equal(after.replace(/<[^>]*>/g, '').trim(), '', 'nothing after the screen');
  assert.ok(!/>\s*[ABC]\s*</.test(h), 'no A, B or C key');
  assert.equal((h.match(/<button\b/g) || []).length, 2, 'Settings and the screen');
});

test('0413 AC3: Settings ends the frame\'s title row and opens Settings', async () => {
  const h = headerHtml();
  assert.match(h, /<div class="print">[\s\S]*<\/span><button class="settings-open" id="settings-open" type="button" aria-label="Settings"[\s\S]*?<\/button><\/div>/, 'the last thing in the title row');
  const p = settingsPage([{ settings: [] }]);
  await p.settle();
  assert.equal(p.settingsCalls.some(c => c.url.startsWith('/api/settings')), false);
  p.press(p.byId('settings-open'));
  await p.settle();
  assert.ok(p.settingsCalls.some(c => c.url.startsWith('/api/settings') && c.method === 'GET'), 'it reads the settings to show them');
  assert.equal(p.byId('settings').hidden, false, 'Settings is open');
});

test('0413 AC4: pressing the screen opens the Foreman\'s detail, and again closes it', async () => {
  assert.match(headerHtml(), /<button class="glass" id="run" type="button"[^>]* aria-expanded="false" aria-controls="foreman"/, 'a button, so Enter and Space press it');
  const p = screenPage([state(foreman())], { scrollX: 0, scrollY: 0, scrollTo() {} });
  p.document.documentElement = { classList: { toggle() {} } };
  p.document.querySelectorAll = () => [];
  await p.settle();
  assert.equal(p.byId('foreman').hidden, true);
  p.press(p.byId('run'));
  await p.settle();
  assert.equal(p.byId('foreman').hidden, false);
  assert.equal(p.byId('run').attrs['aria-expanded'], 'true');
  assert.match(p.byId('foreman').textContent, /The Foreman[\s\S]*Building/);
  p.press(p.byId('run'));
  await p.settle();
  assert.equal(p.byId('foreman').hidden, true);
});

test('0413 AC4: while the panel runs newer code, the top row reads "Reload page" and the detail offers its Reload page button', async () => {
  const p = screenPage([state(foreman({ word: 'Needs you 1' }), { page: 'newer' })], { scrollX: 0, scrollY: 0, scrollTo() {} });
  p.document.documentElement = { classList: { toggle() {} } };
  p.document.querySelectorAll = () => [];
  await p.settle();
  assert.deepEqual(wordDots(p.draw()), expected('RELOAD PAGE', 4, 2));
  assert.equal(p.byId('bezel').className, 'bezel', 'the word is Reload page now');
  assert.match(p.byId('run').attrs['aria-label'], /Reload page/);
  p.press(p.byId('run'));
  await p.settle();
  const reload = p.all(p.byId('foreman')).find(n => n.id === 'foreman-reload');
  assert.ok(reload, 'its Reload page button');
  assert.equal(reload.textContent, 'Reload page');
});

test('0413 AC5: the screen\'s accessible name includes the Foreman\'s word', async () => {
  for (const word of ['Off', 'Idle', 'Building 2', 'Needs you 1']) {
    const p = screenPage([state(foreman({ word }))]);
    await p.settle();
    assert.ok(p.byId('run').attrs['aria-label'].includes(word), `${word}: ${p.byId('run').attrs['aria-label']}`);
  }
  assert.match(headerHtml(), /<canvas class="lcd" id="screen" aria-hidden="true">/, 'the canvas is drawn for the eye only');
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
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && /Needs you 1/.test(document.querySelector('#run').getAttribute('aria-label') || '')`, 'the panel');
    await b.js('document.fonts.ready.then(() => true)');
    const m = await b.js(`(() => {
      const r = s => { const b = document.querySelector(s).getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, height: b.height }; };
      const repo = document.querySelector('.print .repo');
      return { page: document.documentElement.scrollWidth, width: innerWidth, bezel: r('.bezel'), print: r('.print'), name: r('.print .name'), repo: r('.print .repo'),
        settings: r('#settings-open'), screen: r('#run'), canvas: r('#screen'), repoCut: repo.scrollWidth > repo.clientWidth, edge: getComputedStyle(document.querySelector('.bezel')).borderTopColor };
    })()`);
    const at = JSON.stringify(m);
    assert.ok(m.page <= m.width, `no sideways scrolling: ${at}`);
    for (const k of ['bezel', 'print', 'name', 'repo', 'settings', 'screen', 'canvas']) assert.ok(m[k].left >= 0 && m[k].right <= m.width + 0.5, `${k} is on screen: ${at}`);
    assert.ok(m.name.right <= m.repo.left + 0.5 && m.repo.right <= m.settings.left + 0.5, `speck, the project and base branch, then Settings, in a row: ${at}`);
    assert.ok(m.settings.right <= m.bezel.right && m.screen.top >= m.print.bottom - 0.5, `the title row is above the screen, in the frame: ${at}`);
    assert.ok(m.canvas.height > 60, `the screen is drawn: ${at}`);
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

test('0413 AC2: a word too wide for the top row starts at its left, then scrolls; with reduced motion it stays, cut short', async () => {
  const word = 'Waiting: the base branch is failing its tests';
  const p = screenPage([state(foreman({ word }))]);
  await p.settle();
  const start = [...expected(word.toUpperCase(), 4, 2)].filter(d => Number(d.split(',')[0]) <= 156); // 4 dots in from each side
  const first = wordDots(p.draw(5000, false));
  assert.deepEqual(first, new Set(start), 'its start, cut at the right edge');
  assert.deepEqual(wordDots(p.draw(5000 + 1500, false)), first, 'still during the pause');
  assert.notDeepEqual(wordDots(p.draw(5000 + 1800 + 1000, false)), first, 'then it moves');
  assert.deepEqual(wordDots(p.draw(1000, true)), new Set(start), 'still with reduced motion');
  assert.ok([...first].every(d => Number(d.split(',')[0]) < 160), 'nothing past the screen');
});

test('0413 AC2: with foreman_fixing fix, "FIXING ON" sits at the right of the top row, and a short word is drawn in full beside it', async () => {
  const p = screenPage([state(foreman({ word: 'Idle', fixing: 'fix' }))]);
  await p.settle();
  const top = wordDots(p.draw());
  for (const d of expected('IDLE', 4, 2)) assert.ok(top.has(d), `the word: ${d}`);
  const W = 'FIXING ON'.length * 6 - 1;
  assert.ok([...top].some(d => Number(d.split(',')[0]) >= 156 - W), 'something drawn at the right');
  assert.equal(p.byId('run').attrs['aria-label'], 'The Foreman: Idle, fixing on');
  const q = screenPage([state(foreman({ word: 'Idle', fixing: 'tell' }))]);
  await q.settle();
  assert.deepEqual(wordDots(q.draw()), expected('IDLE', 4, 2), 'only the word without it');
});

test('0413 AC1: a change of the screen\'s pixels per CSS pixel gives speck\'s screen its new size, as it does the badges', async () => {
  const changes = [];
  const matchMedia = q => ({ matches: false, addEventListener(type, fn) { if (/resolution/.test(q)) changes.push(fn); } });
  const p = screenPage([state(foreman())], { matchMedia, devicePixelRatio: 1 });
  await p.settle();
  let sized = 0;
  const before = changes.length;
  assert.ok(before > 0, 'it listens for a change of resolution');
  // The Screen the page made counts its resizes.
  p.lcd().size = () => { sized++; };
  changes[before - 1]();
  assert.equal(sized, 1);
});
