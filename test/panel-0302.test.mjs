import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, T, fakePage, queueRows, exitOf, round, page, panelRepo, freePort, startPanel, stop, raw, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0302: the builder badge on the LCD screen, drawn by the design's own renderer ----------

// 0320: the design's new renderer, with its logo.
const SHA = '3b0b714a151bb0bcbf6b453a135e02c5474878960142baec2472648c4f7049fb';
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const ago = s => new Date(Date.now() - s * 1000).toISOString();
// One in-flight ticket for each pose, and a ready one.
const TICKETS = [
  T('0401', 'building', { title: 'Writing its code', started: ago(65), build_running: true, reviewer: 'codex' }),
  T('0402', 'building', { title: 'Checking itself', started: ago(65), build_running: true, self_check: 'no changes', reviewer: 'codex' }),
  T('0403', 'reviewing', { title: 'Under review', started: ago(65), build_running: true, self_check: 'no changes', reviewer: 'codex',
    rounds: [{ ...round(1, 10), verdict: 'request_changes' }] }),
  T('0404', 'reviewing', { title: 'Paused in review', started: ago(65), build_running: true, paused: true, self_check: 'no changes', reviewer: 'codex' }),
  T('0405', 'approved', { title: 'Waiting to ship', started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], ...exitOf('Done.') }),
  T('0406', 'blocked', { title: 'With a question', started: ago(300), blocked_question: 'A or B?' }),
  T('0408', 'approved', { title: 'Being shipped', started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)],
    ship: { running: true, started: ago(5) } }),
  T('0409', 'ready', { title: 'Ready' }),
];
const POSES = { '0401': 'type', '0402': 'check', '0403': 'review', '0404': 'still', '0405': 'wait', '0406': 'bad', '0408': 'ship' };

// The page with a stand-in for the design's renderer, which records each badge it makes and each pose it's set to.
// `board()` gives the board each time the page asks for it, so a test can change it between refreshes.
// `motion` is the reduced-motion setting the page sees, which a test can change.
function fake(board, motion = { reduce: false }) {
  const made = [];
  const SpeckLCD = { badge(canvas, pose, o) { const b = { canvas, pose, o, sets: [] }; made.push(b); return { set(p) { b.sets.push(p); } }; } };
  const p = fakePage([], {
    SpeckLCD,
    matchMedia: q => ({ matches: q === '(prefers-reduced-motion: reduce)' && motion.reduce, addEventListener() {} }), devicePixelRatio: 1,
    fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify({ tickets: board(), ideas: [], run: { on: true } }))) }),
  });
  return { p, made };
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const canvasOf = (p, id) => p.all(rowOf(p, id)).find(n => n.tagName === 'canvas' && /^badge\b/.test(n.className));
// The page's next refresh of the board, as the board feed asks for one.
const refresh = async p => { p.timers.shift()(); await p.settle(); };

test('0302 AC1: the panel serves the design\'s renderer unchanged, from its own copy of docs/design/lcd/lcd.js', async () => {
  const design = fs.readFileSync(path.join(ROOT, 'docs', 'design', 'lcd', 'lcd.js'));
  assert.equal(sha(design), SHA, 'the design file is the one the ticket names');
  assert.equal(sha(fs.readFileSync(path.join(ROOT, 'templates', 'lcd.js'))), SHA, 'the copy that ships with speck is the same file');
  assert.match(page(), /<script src="\/lcd\.js"><\/script>\s*<script>/, 'the page loads it before its own script');
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    const res = await raw(panel.port, '/lcd.js');
    assert.equal(res.status, 200);
    assert.match(String(res.headers['content-type']), /^text\/javascript\b/);
    assert.equal(sha(res.body), SHA, 'the copy the page loads');
  } finally { await stop(panel); }
});

test('0302 AC1: every in-flight card\'s badge is made once with the renderer\'s badge(canvas, pose), in the pose it shows', async () => {
  const { p, made } = fake(() => TICKETS);
  await p.settle();
  assert.deepEqual(made.map(b => [b.canvas.className, b.pose]).sort(), Object.values(POSES).map(k => [`badge ${k}`, k]).sort());
  for (const [id, pose] of Object.entries(POSES)) {
    const c = canvasOf(p, id);
    assert.equal(made.filter(b => b.canvas === c).length, 1, `${id}: one badge, on its own canvas`);
    assert.equal(made.find(b => b.canvas === c).pose, pose, id);
  }
  assert.equal(p.all(rowOf(p, '0409')).filter(n => n.tagName === 'canvas').length, 0, 'a ready ticket has none');
  assert.doesNotMatch(page(), /const POSES = \{/, 'the panel no longer draws the poses itself');
});

test('0302 AC2: a change of pose calls the same badge\'s set(pose); a refresh that keeps the pose leaves it running', async () => {
  let tickets = TICKETS;
  const { p, made } = fake(() => tickets);
  await p.settle();
  const first = canvasOf(p, '0402'), badge = made.find(b => b.canvas === first);
  // A refresh that changes the ticket but not its pose: its row is made again, with the same badge in it.
  tickets = tickets.map(t => (t.id === '0402' ? { ...t, title: 'Checking itself again' } : t));
  await refresh(p);
  assert.ok(p.all(rowOf(p, '0402')).some(n => n._text === 'Checking itself again'), 'the refresh showed');
  assert.equal(canvasOf(p, '0402'), first, 'the same badge');
  assert.deepEqual(badge.sets, [], 'not set again');
  // Into review: the same badge blends into its new pose.
  tickets = tickets.map(t => (t.id === '0402' ? { ...t, status: 'reviewing', rounds: [{ ...round(1, 10), verdict: 'request_changes' }] } : t));
  await refresh(p);
  assert.equal(canvasOf(p, '0402'), first, 'still the same badge');
  assert.deepEqual(badge.sets, ['review']);
  assert.equal(first.className, 'badge review');
  assert.equal(first.attrs['aria-label'], 'The builder is with the reviewer');
  assert.equal(made.length, Object.keys(POSES).length, 'no new badge was made');
  // Out of flight and back: a new badge, as the old one's card is gone.
  tickets = tickets.filter(t => t.id !== '0402');
  await refresh(p);
  tickets = TICKETS;
  await refresh(p);
  assert.notEqual(canvasOf(p, '0402'), first, 'a new badge');
  assert.equal(made.length, Object.keys(POSES).length + 1);
});

test('0302 AC2: a badge made after reduced motion is turned on holds still, as the renderer reads the setting only as the page loads', async () => {
  let tickets = TICKETS.filter(t => t.id !== '0402');
  const motion = { reduce: false };
  const { p, made } = fake(() => tickets, motion);
  await p.settle();
  assert.ok(made.length > 0 && made.every(b => b.o.still === false), 'the first badges move');
  motion.reduce = true;
  tickets = TICKETS;
  await refresh(p);
  assert.equal(made.find(b => b.canvas === canvasOf(p, '0402')).o.still, true, 'the new one holds still');
});

test('0302 AC2: without the renderer (it didn\'t load), the cards still show, with their badges named for what they show', async () => {
  const p = fakePage([], { fetch: async () => ({ ok: true, status: 200, json: async () => JSON.parse(JSON.stringify({ tickets: TICKETS, ideas: [], run: { on: true } })) }) });
  await p.settle();
  for (const [id, pose] of Object.entries(POSES)) assert.equal(canvasOf(p, id).className, `badge ${pose}`, id);
});

// The page's CSS custom properties in a rule, as { name: value }.
const tokens = rule => Object.fromEntries([...rule.matchAll(/(--lcd-[a-z]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
// The light look's screen and unlit dots are lighter since 0308.
const LIGHT = { '--lcd-bg': '#e6e9db', '--lcd-off': '#dde1cf', '--lcd-ink': '#20241d', '--lcd-red': '#d63f28', '--lcd-shadow': 'rgba(30, 40, 15, .14)' };
const DARK = { '--lcd-bg': '#0d130f', '--lcd-off': '#151d17', '--lcd-ink': '#cfe6c6', '--lcd-red': '#ff5a3f', '--lcd-shadow': 'transparent' };

test('0302 AC3: the page has the screen\'s colours as tokens, with the design\'s values in the light and dark looks', () => {
  const css = page().match(/<style>([\s\S]*?)<\/style>/)[1];
  assert.deepEqual(tokens(css.match(/\n {2}:root \{([\s\S]*?)\n {2}\}/)[1]), LIGHT);
  assert.deepEqual(tokens(css.match(/\n {2}:root\[data-theme="dark"\] \{([\s\S]*?)\n {2}\}/)[1]), DARK);
});

test('0302 AC4: a badge waiting for you has a purple frame, a blocked one a crimson frame, and the others the line colour', () => {
  const css = page().match(/<style>([\s\S]*?)<\/style>/)[1];
  assert.match(css, /\.q \.top \.badge \{[^}]*outline: 1px solid var\(--line\); outline-offset: -1px;/);
  assert.match(css, /\.q \.top \.badge\.wait \{ outline-color: var\(--idea\); \}/);
  assert.match(css, /\.q \.top \.badge\.bad \{ outline-color: var\(--bad\); \}/);
});

// ---------- in a real browser ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const stub = `(() => {
  try { localStorage.setItem('speck-theme', 'light'); } catch {}
  const STATE = ${JSON.stringify({ run: { on: true }, tickets: TICKETS, ideas: [] })};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u === '/api/state') return json(STATE);
    if (/\\/log$/.test(u)) return json({ text: '' });
    return real(url, opts);
  };
})();`;
const CARD = id => `[...document.querySelectorAll('#queue .q')].find(n => n.querySelector('.id').textContent === ${JSON.stringify(id)})`;
const RGB = v => `(() => { const s = document.createElement('span'); s.style.color = ${JSON.stringify(v)}; document.body.appendChild(s);
  const c = getComputedStyle(s).color; s.remove(); return c.match(/\\d+/g).slice(0, 3).map(Number); })()`;
// A pixel in the gap after a badge's top-left dot (the screen's own colour, with 4 pixels to a dot), its frame's colour, and its size.
const LOOK = id => `(() => { const c = ${CARD(id)}.querySelector('canvas.badge'), r = c.getBoundingClientRect(), cs = getComputedStyle(c);
  return { bg: [...c.getContext('2d').getImageData(3, 3, 1, 1).data].slice(0, 3), frame: cs.outlineColor.match(/\\d+/g).slice(0, 3).map(Number),
    w: r.width, h: r.height, cw: c.width, lcd: !!c.__lcd }; })()`;

test('0302 AC1, AC3 and AC4: in a real browser, each badge is the renderer\'s 56 px screen, in the look\'s colours, with its frame', skip, async () => {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 2, mobile: false });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`document.readyState === 'complete' && document.querySelectorAll('#queue canvas.badge').length === ${Object.keys(POSES).length}`, 'the badges');
    for (const look of ['light', 'dark']) {
      if (look === 'dark') await b.js(`document.querySelector('.theme').click()`);
      await b.until(`document.documentElement.dataset.theme === '${look}'`, `the ${look} look`);
      const want = {};
      for (const k of ['lcd-bg', 'line', 'idea', 'bad']) want[k] = await b.js(RGB(`var(--${k})`));
      assert.deepEqual(want['lcd-bg'], await b.js(RGB(look === 'light' ? LIGHT['--lcd-bg'] : DARK['--lcd-bg'])), `${look}: the screen's token`);
      for (const [id, pose] of Object.entries(POSES)) {
        await b.js(`${CARD(id)}.scrollIntoView({ block: 'center' })`); // the renderer draws only the screens in view
        await b.until(`(${LOOK(id)}).bg.join() === ${JSON.stringify(want['lcd-bg'].join())}`, `${id}: the ${look} screen`);
        const l = await b.js(LOOK(id));
        assert.ok(l.lcd, `${id}: drawn by the renderer`);
        assert.ok(Math.abs(l.w - 56) < .5 && Math.abs(l.h - 56) < .5, `${id}: 56 px, ${l.w}×${l.h}`);
        assert.equal(l.cw, 112, `${id}: 28 dots, 4 pixels each at twice the pixels`);
        assert.deepEqual(l.frame, want[pose === 'wait' ? 'idea' : pose === 'bad' ? 'bad' : 'line'], `${id}: its frame in the ${look} look`);
      }
    }
  } finally { await b.close(); await stop(panel); }
});
