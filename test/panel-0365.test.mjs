import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, full, fakePage, page, findChrome, browserPage } from './support/panel.mjs';
import { sharedPanel } from './support/shared-panel.mjs';
import { LCD, foreman, state, boardPage, dotsOf, expected, LONG, LONG_W } from './support/board.mjs';

// ---------- 0365: the Foreman's status scrolls across a dot-matrix notice board ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const css = () => (page().match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';

test('0365 AC1: the Foreman\'s button is a dot-matrix screen drawing its word in the 5 × 7 font, in capitals', async () => {
  const p = boardPage([state(foreman())]);
  await p.settle();
  const run = p.byId('run'), svg = p.svg();
  assert.equal(run.hidden, false);
  assert.equal(svg.namespaceURI, 'http://www.w3.org/2000/svg');
  assert.equal(svg.attrs['aria-hidden'], 'true');
  assert.equal(svg.attrs.class, 'board');
  const lit = p.all(svg).filter(n => n.attrs && n.attrs.class === 'lit');
  assert.equal(lit.length, 2, 'the text, and its copy for looping round');
  assert.deepEqual(dotsOf(lit[0].attrs.d), expected('Building 2'));
  assert.equal(svg.attrs.viewBox, `0 0 ${Math.min(90, 10 * 6 - 1 + 2)} 9`, 'one row above and below the seven');
  assert.equal(svg.attrs.height, '18', 'dots 2 px apart, as the panel\'s badges');
  assert.ok(p.all(svg).some(n => n.tagName === 'pattern' && n.attrs.id === 'board-dots'), 'its unlit dots');
  assert.ok(!p.all(run).some(n => n.tagName === 'canvas'), 'no builder');
});

test('0365 AC1: the "·" between its parts is one dot, and the renderer is unchanged', async () => {
  assert.equal(LCD.F5.g['·'], undefined, 'not in the font');
  const p = boardPage([state(foreman({ word: '·' }))]);
  await p.settle();
  assert.deepEqual([...dotsOf(p.all(p.svg()).find(n => n.attrs && n.attrs.class === 'lit').attrs.d)], ['2,4'], 'one dot, in the middle');
});

// Each look's colour tokens, from the page's :root blocks.
const looks = () => {
  const vars = re => Object.fromEntries([...css().matchAll(re)].flatMap(m => [...m[1].matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-f]{6})/gi)].map(v => [v[1], v[2]])));
  const light = vars(/:root \{([^}]*)\}/g);
  return { light, dark: { ...light, ...vars(/:root\[data-theme="dark"\] \{([^}]*)\}/g) } };
};
const lum = hex => { const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

test('0365 AC1: each tone\'s colour, and the hover\'s, reads on the board\'s background at 4.5:1, its letters being 14 px tall, in light and dark', () => {
  for (const [name, look] of Object.entries(looks())) {
    for (const t of ['--muted', '--ok', '--warn', '--bad', '--text']) {
      assert.ok(look[t] && look['--lcd-bg'], `${name}: ${t} and --lcd-bg`);
      const r = contrast(look[t], look['--lcd-bg']);
      assert.ok(r >= 4.5, `${name}: ${t} ${look[t]} on --lcd-bg ${look['--lcd-bg']} is ${r.toFixed(2)}:1`);
    }
  }
});

test('0365 AC1: it keeps its place, its tooltip, its tone\'s colour and what pressing it does', async () => {
  const h = page().match(/<header>([\s\S]*?)<\/header>/)[1];
  assert.match(h, /<div class="repo">[\s\S]*<button class="run-state" id="run" type="button" aria-expanded="false" aria-controls="foreman" hidden><\/button>\s*<button class="settings-open"/, 'a button (Enter and Space press it), between the project and Settings');
  for (const [word, tone] of [['Building 2', 'ok'], ['Needs you 1', 'bad'], ['Off', 'off'], ['Waiting: the base branch is failing its tests', 'warn']]) {
    const p = boardPage([state(foreman({ word, tone }))]);
    await p.settle();
    assert.equal(p.byId('run').className, `run-state fm-${tone}`);
    assert.equal(p.byId('run').title, 'What speck run is doing, and what is waiting');
  }
  assert.match(css(), /\.run-state\.fm-bad \{ color: var\(--bad\);/, '"Needs you" in red');
  assert.match(css(), /\.run-state \.board \.lit \{ fill: currentColor; \}/, 'the lit dots in the tone\'s colour');
  assert.match(css(), /\.run-state \.board \{[^}]*background: var\(--lcd-bg\)/, 'on the LCD screens\' background');
  assert.match(css(), /\.run-state \.board pattern rect \{ fill: var\(--lcd-off\); \}/, 'with their unlit dots');
  const p = boardPage([state(foreman()), state(foreman())]);
  await p.settle();
  p.press(p.byId('run'));
  assert.equal(p.byId('run').attrs['aria-expanded'], 'true');
  assert.equal(p.byId('foreman').hidden, false);
  p.press(p.byId('run'));
  assert.equal(p.byId('foreman').hidden, true);
});

test('0365 AC1: without the renderer\'s font, the button shows its text as words', async () => {
  const p = fakePage([state(foreman())], { SpeckLCD: { badge() { return { set() {}, scr: { still: false, size() {} }, cast: { still: false } }; } } });
  await p.settle();
  const b = p.byId('run').children.find(n => n.tagName === 'svg');
  assert.equal(b.attrs.class, 'board plain');
  assert.equal(p.byId('run').textContent, 'Building 2');
  assert.match(css(), /\.run-state \.board\.plain \{ display: none; \}/);
  assert.match(css(), /\.run-state \.board\.plain \+ \.board-text \{ position: static;/);
});

test('0365 AC2: the board\'s text is the word, then each ticket building, shipping and blocked', async () => {
  const cases = [
    [foreman({ building: ['0362', '0363'], blocked: [{ id: '0358', title: 'X' }] }), 'Building 2 · 0362 building · 0363 building · 0358 blocked'],
    [foreman({ word: 'Shipping 0360', ship: { running: '0360', waiting: [{ id: '0361', why: 'waits' }] }, building: ['0362'] }), 'Shipping 0360 · 0362 building · 0360 shipping'],
    [foreman({ word: 'Idle', tone: 'idle' }), 'Idle'],
    [foreman({ word: 'Needs you 1', tone: 'bad', blocked: [{ id: '0358' }], ready: [{ id: '0359', why: 'x' }] }), 'Needs you 1 · 0358 blocked'],
  ];
  for (const [f, text] of cases) {
    const p = boardPage([state(f)]);
    await p.settle();
    assert.equal(p.name(), text);
    assert.deepEqual(dotsOf(p.all(p.svg()).find(n => n.attrs && n.attrs.class === 'lit').attrs.d), expected(text));
  }
  const stale = boardPage([state(foreman({ building: ['0362'] }), { page: 'newer-code' })]);
  await stale.settle();
  assert.equal(stale.name(), 'Reload page', 'out of date');
  assert.equal(stale.byId('run').className, 'run-state fm-warn');
});

test('0365 AC3: text wider than the board scrolls from right to left at 10 dots a second (0374), and loops round with a gap', async () => {
  const p = boardPage([state(LONG)]);
  await p.settle();
  const cols = 90, P = LONG_W + 16;
  assert.equal(p.svg().attrs.viewBox, `0 0 ${cols} 9`);
  assert.equal(p.x(), cols, 'it starts at the right-hand edge');
  p.frame(1000);
  assert.equal(p.x(), cols, 'the first frame starts the clock');
  p.frame(2000);
  assert.equal(p.x(), cols - 10, '10 dots in a second');
  p.frame(1000 + 300);
  assert.equal(p.x(), cols - 3);
  const copy = p.all(p.group()).filter(n => n.attrs && n.attrs.class === 'lit')[1];
  assert.equal(copy.attrs.transform, `translate(${P} 0)`, 'its copy follows a 16-dot gap after its end');
  assert.equal(copy.attrs.display, 'inline');
  // Once the text has gone off the left, it's back where its copy was: no jump.
  for (const s of [cols + P - 1, cols + P, cols + P + 1, cols + 2 * P + 5]) {
    p.frame(1000 + (s * 1000) / 10 + 1);
    const x = p.x();
    assert.ok(x > -P && x <= cols, `${s} dots in: ${x}`);
    assert.equal(((cols - s - x) % P + P) % P, 0, `${s} dots in: on the loop`);
  }
  assert.ok(p.frames.length > 0, 'it keeps going');
});

test('0365 AC3: text that fits stays still, and a board cut short by a narrow screen scrolls it', async () => {
  const p = boardPage([state(foreman())]);
  await p.settle();
  p.frame(0); p.frame(5000);
  assert.equal(p.x(), 1, 'still, a dot in from the left');
  assert.equal(p.all(p.group()).filter(n => n.attrs && n.attrs.class === 'lit')[1].attrs.display, 'none', 'no copy');
  const narrow = boardPage([state(foreman())], { width: 40 }); // 20 dots showing
  await narrow.settle();
  narrow.frame(0); narrow.frame(3000);
  assert.equal(narrow.x(), 20 - 30, 'scrolls through the 20 dots that show');
});

test('0365 AC3: with reduced motion, it never scrolls and shows the word alone', async () => {
  const p = boardPage([state(LONG), state(LONG)], { reduce: true });
  await p.settle();
  assert.equal(p.frames.length, 0, 'no frames asked for');
  assert.equal(p.x(), 1);
  assert.deepEqual(dotsOf(p.all(p.svg()).find(n => n.attrs && n.attrs.class === 'lit').attrs.d), expected('Building 2'));
  assert.equal(p.name(), 'Building 2 · 0362 building · 0363 building · 0358 blocked', 'its name is still the whole text');
  const long = boardPage([state(foreman({ word: 'Waiting: the base branch is failing its tests', tone: 'warn' }))], { reduce: true, width: 60 });
  await long.settle();
  assert.equal(long.x(), 1, 'a word too long for the board is cut short, not scrolled');
  assert.equal(long.frames.length, 0);
});

test('0365 AC4: the button\'s name is the board\'s whole text, whatever has scrolled into view', async () => {
  const p = boardPage([state(LONG)]);
  await p.settle();
  p.frame(0); p.frame(3000);
  const text = 'Building 2 · 0362 building · 0363 building · 0358 blocked';
  assert.equal(p.byId('run').textContent, text, 'its only text, the SVG being hidden from screen readers');
  assert.equal(p.name(), text);
  assert.match(css(), /\.run-state \.board-text \{ position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset\(50%\);/, 'read out, not shown');
  assert.equal(p.byId('run').attrs['aria-label'], text, 'its name');
});

test('0365 AC4: with "Fixing on" beside the board, the name is still the board\'s whole text, moving or still', async () => {
  for (const reduce of [false, true]) {
    const p = boardPage([state({ ...LONG, fixing: 'fix' })], { reduce });
    await p.settle();
    assert.ok(p.byId('run').children.some(n => n.className === 'fixing' && n.textContent === 'Fixing on'), '"Fixing on" shows');
    assert.equal(p.byId('run').attrs['aria-label'], 'Building 2 · 0362 building · 0363 building · 0358 blocked', reduce ? 'reduced motion' : 'moving');
  }
  const stale = boardPage([state({ ...LONG, fixing: 'fix' }, { page: 'newer-code' })]);
  await stale.settle();
  assert.equal(stale.byId('run').attrs['aria-label'], 'Reload page');
});

test('0365 AC4: a refresh with the same text carries on scrolling; new text starts again from the right-hand edge', async () => {
  const BUSY = foreman({ word: 'Building 3', building: ['0362', '0363', '0364'], blocked: [{ id: '0358' }] });
  const p = boardPage([state(LONG), state(LONG), state(BUSY)]);
  await p.settle();
  const b = p.board();
  p.frame(0); p.frame(6000);
  assert.equal(p.x(), 90 - 60);
  await p.timers.shift()(); await p.settle(); // the next board: the same text
  assert.equal(p.board(), b, 'the same board');
  assert.equal(p.byId('run').children.at(-1).className, 'board-text');
  assert.equal(p.x(), 90 - 60, 'no jump');
  p.frame(9000);
  assert.equal(p.x(), 90 - 90, 'carries on');
  await p.timers.shift()(); await p.settle(); // new text
  assert.equal(p.name(), 'Building 3 · 0362 building · 0363 building · 0364 building · 0358 blocked');
  assert.equal(p.x(), 90, 'back at the right-hand edge');
  p.frame(12000); p.frame(15000);
  assert.equal(p.x(), 90 - 30, 'and scrolls from there');
});

// ---------- in a real browser ----------

const board = f => ({ tickets: [full('0001'), ...['0362', '0363'].map(id => T(id, 'building')), T('0358', 'blocked')], ideas: [], run: { on: true, pid: 1 }, foreman: f });
async function withPanel(fn, { width, f = LONG, theme = null } = {}) {
  const panel = await sharedPanel();
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height: 640, deviceScaleFactor: 1, mobile: width < 700 });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
      ${theme ? `localStorage.setItem('speck-theme', ${JSON.stringify(theme)});` : ''}
      const STATE = ${JSON.stringify(board(f))}, real = window.fetch.bind(window);
      window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? new Response(JSON.stringify(STATE), { status: 200, headers: { 'content-type': 'application/json' } }) : real(url, opts);
    })();` });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && !!document.querySelector('#run svg.board') && !document.querySelector('#run').hidden`, 'the panel');
    await b.js('document.fonts.ready.then(() => true)');
    await fn(b);
  } finally { await b.close(); }
}
const layout = b => b.js(`(() => {
  const box = s => { const r = document.querySelector(s).getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, height: r.height, width: r.width }; };
  const run = box('#run'), board = box('#run .board');
  return { parts: ['.logo .mark', '.repo', '#run', '#settings-open'].map(box), run, board, page: document.documentElement.scrollWidth, width: innerWidth };
})()`);

for (const [width, theme] of [[320, 'light'], [320, 'dark'], [375, 'light'], [699, 'dark'], [700, 'light'], [1200, 'light']]) {
  test(`0365 AC5: at ${width} px, ${theme}, the board fits the header overlapping nothing${width < 700 ? ', at least 44 px tall' : ''}`, skip, () => withPanel(async b => {
    const h = await layout(b);
    assert.ok(h.page <= h.width, `no sideways scroll: ${h.page} > ${h.width}`);
    for (let i = 1; i < h.parts.length; i++) assert.ok(h.parts[i].left >= h.parts[i - 1].right - 0.5, `part ${i} comes after part ${i - 1}`);
    assert.ok(h.board.width > 0 && h.board.left >= h.run.left - 0.5 && h.board.right <= h.run.right + 0.5, 'the board is inside its button');
    assert.ok(h.board.top >= h.run.top - 0.5 && h.board.bottom <= h.run.bottom + 0.5);
    if (width < 700) assert.ok(h.run.height >= 44, `${h.run.height} px tall`);
    // And it moves: the text scrolls in from the right.
    const x = () => b.js(`document.querySelector('#run .board g').getAttribute('transform')`);
    const first = await x();
    await b.until(`document.querySelector('#run .board g').getAttribute('transform') !== ${JSON.stringify(first)}`, 'the board to scroll');
  }, { width, theme }));
}
