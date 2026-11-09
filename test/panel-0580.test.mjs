import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, page, click, fakePage, findChrome, browserPage, styles } from './support/panel.mjs';
import { sharedPanel } from './support/shared-panel.mjs';
import { rules, get, selectors } from './support/css.mjs';

// ---------- 0580: the black bar in place of the LCD screen ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const headerHtml = () => (page().match(/<header>([\s\S]*?)<\/header>/) || [])[1] || '';
const decl = (sel, prop) => rules().filter(r => !r.at.length && selectors(r).includes(sel)).map(r => get(r, prop)).filter(v => v !== undefined).pop();
const foreman = (o = {}) => ({ word: 'Building 4', tone: 'ok', mood: 'focused', building: [], ready: [], held: [], ship: { running: null, waiting: [] }, blocked: [], took: [], ...o });
const board = (f, o = {}) => ({ tickets: [T('0001', 'building')], ideas: [], run: { on: true, pid: 1 }, foreman: f, ...o });
const ready = n => Array.from({ length: n }, (_, i) => ({ id: String(i + 1).padStart(4, '0'), why: 'all 2 build slots in use' }));
const opened = async (st, globals) => { const p = fakePage([st], globals); await p.settle(); return p; };

test('0580 AC1: the top of the panel is a rounded, inset dark bar with no LCD screen', () => {
  const h = headerHtml();
  assert.match(h, /^\s*<div class="bezel" id="bezel">/, 'the bar');
  assert.doesNotMatch(h, /<canvas/, 'no screen');
  assert.doesNotMatch(h, /class="name"/, 'no dot-matrix title');
  assert.match(decl('.bezel', 'border-radius'), /^\d+px$/, 'rounded');
  assert.match(decl('header', 'padding'), /16px/, 'inset from the edges');
  assert.equal(decl('.bezel', 'display'), 'flex', 'one row');
});

test('0580 AC1: the bar holds speck at 44 px in its current mood, and follows it', async () => {
  const f = foreman({ mood: 'focused' }), p = fakePage([board(f), board({ ...f, word: 'Off', mood: 'asleep' })]);
  await p.settle();
  const face = () => p.byId('bar-face').children[0];
  assert.equal(face().attrs.width, '44');
  assert.equal(face().attrs.height, '44');
  assert.equal(face().attrs['data-mood'], 'focused');
  for (const t of p.timers.splice(0)) t();
  await p.settle();
  assert.equal(face().attrs['data-mood'], 'asleep');
  assert.equal(p.byId('bar-face').children.length, 1, 'one face, kept between redraws');
});

test('0580 AC1: the first line is the status word and the project', async () => {
  const h = headerHtml();
  assert.match(h, /<span class="bar-word" id="bar-word"><\/span> · <span class="repo">\{\{repo\}\}<\/span>/);
  const p = await opened(board(foreman()));
  assert.equal(p.byId('bar-word').textContent, 'Building 4');
});

test('0580 AC1: until the first board arrives the status lines stay hidden, rather than show their separators alone', () => {
  assert.match(styles(), /\.bezel \.bar-lines:has\(\.bar-word:empty\) \{ visibility: hidden; \}/);
});

test('0580 AC1: the second line says what is queued, how many need you, in orange, and the base branch', async () => {
  assert.match(headerHtml(), /id="bar-queued"><\/span><span id="bar-needs-part" hidden> · <span class="needs" id="bar-needs"><\/span><\/span> · <code>\{\{base\}\}<\/code>/);
  assert.equal(decl('.bezel .bar-more .needs', 'color'), 'var(--bar-needs)');
  for (const [f, queued, needs] of [
    [foreman({ ready: ready(3) }), '3 queued', null],
    [foreman({ word: 'Needs you 1', mood: 'asking', ready: ready(1) }), '1 queued', '1 needs you'],
    [foreman({ word: 'Needs you 2', mood: 'asking' }), 'Nothing queued', '2 need you'],
  ]) {
    const p = await opened(board(f));
    assert.equal(p.byId('bar-queued').textContent, queued);
    assert.equal(p.byId('bar-needs-part').hidden, needs === null, f.word);
    if (needs) assert.equal(p.byId('bar-needs').textContent, needs);
  }
});

test('0580 AC1: the Settings button is in the bar', () => {
  assert.match(headerHtml(), /<div class="bezel" id="bezel">[\s\S]*<button class="settings-open" id="settings-open"[\s\S]*<\/div>\s*$/);
});

test('0580 AC2: pressing the bar\'s status opens the Pipeline log', async () => {
  assert.match(headerHtml(), /<button class="bar-status" id="run" type="button" aria-expanded="false" aria-controls="foreman"/);
  const p = await opened(board(foreman()));
  click(p.byId('run'));
  await p.settle();
  assert.equal(p.byId('foreman').hidden, false);
  assert.equal(p.byId('run').attrs['aria-expanded'], 'true');
});

test('0580 AC3: the project menu stays in the bar, lists the running panels and switches between them', async () => {
  assert.match(headerHtml(), /<div class="bezel" id="bezel">[\s\S]*<span class="project-pick" id="project-pick"[^>]*hidden><select id="project"/);
  const st = board(foreman(), { projects: { self: 5001, list: [{ port: 5001, name: 'speck' }, { port: 5002, name: 'alpha' }] } });
  let reloaded = 0;
  const p = await opened(st, { location: { reload() { reloaded++; } } });
  assert.equal(p.byId('project-pick').hidden, false);
  assert.deepEqual(p.byId('project').children.map(o => o.textContent), ['speck', 'alpha']);
  p.byId('project').value = '5002';
  p.byId('project').listeners.change();
  await p.settle();
  assert.ok(p.calls.some(c => c.url === '/api/projects/5002' && c.opts.method === 'POST'), 'asks for that project');
  assert.equal(reloaded, 1, 'and shows it');
});

test('0580 AC4: the bar has its own colours, so both looks show the same one, and speck is drawn for a dark background', async () => {
  const css = rules().filter(r => !r.at.length && selectors(r).some(s => /^:root/.test(s)));
  for (const v of ['--bar', '--bar-ink', '--bar-muted', '--bar-needs']) {
    const values = new Set(css.map(r => get(r, v)).filter(Boolean));
    assert.equal(values.size, 1, `${v} is one colour in both looks: ${[...values]}`);
  }
  assert.equal(decl('.bezel', 'background'), 'var(--bar)');
  const p = await opened(board(foreman()));
  assert.equal(p.byId('bar-face').children[0].attrs['data-look'], 'dark');
});

const STATE = { tickets: Array.from({ length: 30 }, (_, i) => T(String(1000 + i), 'ready')), ideas: [], run: { on: true, pid: 1 },
  foreman: foreman({ word: 'Waiting: other tickets', mood: 'watching', ready: ready(30) }) };
test('0580 AC4: at 320 px the first line stays on one line, and the bar looks the same in both looks and stays put while a list scrolls', skip, async () => {
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
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && document.querySelector('#bar-word').textContent === 'Waiting: other tickets' && !!document.querySelector('#bar-face svg')`, 'the bar');
    await b.js('document.fonts.ready.then(() => true)');
    await b.js(`document.querySelector('.bar-top .repo').textContent = 'a-client-project-with-a-long-name'; true`);
    const m = await b.js(`(() => {
      const r = s => { const b = document.querySelector(s).getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, width: b.width, height: b.height }; };
      const top = document.querySelector('.bar-top'), range = document.createRange();
      range.selectNodeContents(top);
      return { page: document.documentElement.scrollWidth, width: innerWidth, lines: new Set([...range.getClientRects()].map(x => Math.round(x.top + x.height / 2))).size,
        word: r('#bar-word').width, top: r('.bar-top'), bar: r('.bezel'), face: r('#bar-face svg'), settings: r('#settings-open') };
    })()`);
    const at = JSON.stringify(m);
    assert.ok(m.page <= m.width, `no sideways scrolling: ${at}`);
    assert.equal(m.lines, 1, `one line: ${at}`);
    assert.ok(m.word > 40, `the word still shows: ${at}`);
    assert.ok(m.top.right <= m.settings.left + 0.5, `it stops before Settings: ${at}`);
    assert.ok(m.bar.left >= 8 && m.bar.right <= m.width - 8, `inset: ${at}`);
    assert.equal(m.face.width, 44, `speck at 44 px: ${at}`);
    assert.ok(m.bar.height <= 56, `thin: ${at}`);
    const look = async theme => b.js(`(() => {
      setLook(${JSON.stringify(theme)});
      const s = n => getComputedStyle(document.querySelector(n));
      return [s('.bezel').backgroundColor, s('.bar-word').color, s('.bar-more').color, s('#bar-face svg .sf-screen').fill, getComputedStyle(document.querySelector('#bar-face svg .sf-light')).stroke];
    })()`);
    assert.deepEqual(await look('dark'), await look('light'), 'the same in both looks');
    const before = await b.js(`document.querySelector('.bezel').getBoundingClientRect().top`);
    const scrolled = await b.js(`(() => { const l = document.querySelector('#build-section .lane-list'); l.scrollTop = 400; return [l.scrollTop, document.querySelector('.bezel').getBoundingClientRect().top]; })()`);
    assert.ok(scrolled[0] > 0, `the list scrolled: ${scrolled}`);
    assert.equal(scrolled[1], before, 'the bar stays put');
  } finally { await b.close(); }
});
