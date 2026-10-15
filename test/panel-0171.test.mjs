import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, queueRows, exitOf, round, panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';
import { rules, tokens, get, rule } from './support/css.mjs';

// ---------- 0171: colour a running ticket's border by its build stage ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const ago = s => new Date(Date.now() - s * 1000).toISOString();
// Each stage's class on the card and the colour token of its border.
const STAGES = { 'at-build': '--run', 'at-check': '--inbox', 'at-review': '--warn', 'at-ship': '--ok' };
const TICKETS = [
  T('0501', 'building', { title: 'Writing its code', started: ago(65), build_running: true }),
  T('0502', 'building', { title: 'Checking itself', started: ago(65), build_running: true, self_check: 'no changes' }),
  T('0503', 'reviewing', { title: 'Under review, round 1', started: ago(65), build_running: true, self_check: 'no changes' }),
  T('0504', 'reviewing', { title: 'Under review, round 2', started: ago(65), build_running: true, self_check: 'no changes',
    rounds: [{ ...round(1, 10), verdict: 'request_changes' }] }),
  T('0505', 'approved', { title: 'Being shipped by auto-ship', started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)],
    auto_ship: true, ship: { running: true, auto: true, started: ago(5) } }),
  T('0506', 'approved', { title: 'Being shipped by hand', started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)],
    auto_ship: false, build_exit: { code: 0 }, ship: { running: true, auto: false, started: ago(5) } }),
  T('0507', 'blocked', { title: 'Blocked in review', started: ago(300), self_check: 'no changes', blocked_question: 'Which one?' }),
  T('0508', 'reviewing', { title: 'A build that stopped in review', started: ago(200), self_check: 'no changes', ...exitOf('It ended.') }),
  T('0509', 'approved', { title: 'Waiting for you to ship it', started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)],
    auto_ship: false, build_exit: { code: 0 } }),
  T('0510', 'ready', { title: 'A ready ticket' }),
  T('0511', 'reviewing', { title: 'Paused in review', started: ago(65), build_running: true, paused: true, self_check: 'no changes' }),
  T('0512', 'approved', { title: 'Approved, auto-ship about to start', started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)],
    auto_ship: true, build_running: true }),
];
// What each card should show: a stage class, a state class (0167), or neither.
const EXPECT = { '0501': 'at-build', '0502': 'at-check', '0503': 'at-review', '0504': 'at-review', '0505': 'at-ship', '0506': 'at-ship',
  '0507': 'blocked', '0508': 'blocked', '0509': 'to-ship', '0510': null, '0511': null, '0512': null };

// speck run is on, as its ship queue ships the approved tickets auto-ship covers (0203: with it off, they wait for you).
function fake(state) {
  return fakePage([], {
    fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify({ tickets: state.tickets, ideas: [], run: { on: true } }))) }),
  });
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const classes = row => row.className.split(/\s+/);
const looks = row => classes(row).filter(c => c in STAGES || c === 'blocked' || c === 'to-ship');

test('0171 AC1: a card whose agent is at work has its stage\'s class: building, self-check, review (any round) or shipping', async () => {
  const p = fake({ tickets: TICKETS });
  await p.settle();
  for (const id of ['0501', '0502', '0503', '0504', '0505', '0506']) assert.deepEqual(looks(rowOf(p, id)), [EXPECT[id]], id);
});

test('0171 AC1: each stage has a 2px border in its colour, and leaves the card\'s background alone', () => {
  for (const [cls, token] of Object.entries(STAGES)) {
    const r = rule(`.q.${cls}`);
    assert.ok(r, `.q.${cls} has a rule`);
    assert.deepEqual(tokens(get(r, 'border-color')), [token], `.q.${cls}: its border colour`);
    assert.equal(get(r, 'border-width'), '2px', `.q.${cls}: its border width`);
    assert.equal(get(r, 'background') ?? get(r, 'background-color'), undefined, `.q.${cls}: no fill`);
  }
});

test('0171 AC2: when a running ticket moves to its next stage, its card takes the new stage\'s class on the next update', async () => {
  const state = { tickets: [T('0601', 'building', { title: 'Moving on', started: ago(65), build_running: true })] };
  const p = fake(state);
  await p.settle();
  const next = async tickets => { state.tickets = tickets; for (const fn of p.timers.splice(0)) fn(); await p.settle(); };
  assert.deepEqual(looks(rowOf(p, '0601')), ['at-build']);
  await next([T('0601', 'building', { title: 'Moving on', started: ago(65), build_running: true, self_check: 'no changes' })]);
  assert.deepEqual(looks(rowOf(p, '0601')), ['at-check']);
  await next([T('0601', 'reviewing', { title: 'Moving on', started: ago(65), build_running: true, self_check: 'no changes' })]);
  assert.deepEqual(looks(rowOf(p, '0601')), ['at-review']);
  await next([T('0601', 'approved', { title: 'Moving on', started: ago(65), approved: ago(1), self_check: 'no changes', rounds: [round(1, 10)],
    auto_ship: true, ship: { running: true, auto: true, started: ago(1) } })]);
  assert.deepEqual(looks(rowOf(p, '0601')), ['at-ship']);
});

test('0171 AC3: blocked, stopped and waiting tickets keep 0167\'s colours, and every other card has no stage class', async () => {
  const p = fake({ tickets: TICKETS });
  await p.settle();
  for (const id of ['0507', '0508', '0509', '0510', '0511', '0512']) {
    assert.deepEqual(looks(rowOf(p, id)), EXPECT[id] ? [EXPECT[id]] : [], id);
  }
});

// ---------- In the browser ----------

const STATE = { run: { on: true }, tickets: TICKETS, ideas: [] };
const stub = theme => `(() => {
  try { localStorage.setItem('speck-theme', ${JSON.stringify(theme)}); } catch {}
  const STATE = ${JSON.stringify(STATE)};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u === '/api/state') return json(STATE);
    if (/\\/log$/.test(u)) return json({ text: '' });
    if (opts.method === 'POST') return json({});
    return real(url, opts);
  };
})();`;

async function withPanel(fn, theme) {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub(theme) });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && document.querySelectorAll('#queue .q').length === ${TICKETS.length}`, 'the panel');
    assert.equal(await b.js(`document.documentElement.dataset.theme`), theme);
    await fn(b);
  } finally { await b.close(); await stop(panel); }
}
const settle = b => b.js(`new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`);
const RGB = v => `(() => { const s = document.createElement('span'); s.style.color = ${JSON.stringify(v)}; document.body.appendChild(s);
  const c = getComputedStyle(s).color; s.remove(); return c; })()`;
const colours = async b => {
  const c = {};
  for (const k of ['line', 'text', 'run', 'inbox', 'warn', 'ok', 'idea', 'idea-bg', 'bad', 'bad-bg', 'panel', 'raise']) c[k] = await b.js(RGB(`var(--${k})`));
  return c;
};
const LOOK = `[...document.querySelectorAll('#queue .q')].map(n => { const s = getComputedStyle(n);
  return { id: n.querySelector('.id').textContent, cls: n.className, back: s.backgroundColor,
    sides: ['Top', 'Right', 'Bottom', 'Left'].map(k => [s['border' + k + 'Color'], parseFloat(s['border' + k + 'Width']), s['border' + k + 'Style']]) }; })`;
const border = (card, colour, width, what) => {
  for (const [k, [col, w, style]] of card.sides.entries()) {
    assert.equal(col, colour, `${what}: side ${k} is ${col}, not ${colour}`);
    assert.ok(style === 'solid' && (width === 2 ? w === 2 : w > 0 && w <= 1), `${what}: side ${k} is ${w} px ${style}`);
  }
};
const lum = rgb => {
  const [r, g, b] = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map(v => v / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

for (const theme of ['light', 'dark']) {
  test(`0171 AC1 AC3 AC4: in the ${theme} look, running cards have their stage's 2px border, closed, open and lit, and the rest keep theirs`, skip, async () => {
    await withPanel(async b => {
      const c = await colours(b);
      const plainBack = (await b.js(LOOK)).find(x => x.id === '0510').back;
      const check = async when => {
        for (const card of await b.js(LOOK)) {
          const want = EXPECT[card.id], what = `${card.id} ${when}`, open = /\bopen\b/.test(card.cls);
          if (want in STAGES) {
            border(card, c[STAGES[want].slice(2)], 2, what);
            assert.equal(card.back, open ? c.raise : plainBack, `${what}: the normal card background`);
          } else if (want === 'blocked') { border(card, c.bad, 1, what); assert.equal(card.back, c['bad-bg'], `${what}: crimson fill`); }
          else if (want === 'to-ship') { border(card, c.idea, 1, what); assert.equal(card.back, c['idea-bg'], `${what}: purple fill`); }
          else border(card, open ? c.text : c.line, 1, what);
        }
      };
      await check('closed');
      // Lit from a linked id: the ring is inside the border, which stays.
      await b.js(`document.querySelectorAll('#queue .q').forEach(n => n.classList.add('flash'))`);
      await settle(b);
      await check('lit');
      for (const id of Object.keys(EXPECT)) {
        await b.js(`[...document.querySelectorAll('#queue .q')].find(n => n.querySelector('.id').textContent === '${id}').querySelector('.top').click()`);
        await settle(b);
      }
      await check('open');
      for (const [cls, token] of Object.entries(STAGES)) {
        for (const back of ['panel', 'raise']) {
          const k = contrast(c[token.slice(2)], c[back]);
          assert.ok(k >= 3, `${cls}: ${token} against --${back} is ${k.toFixed(2)}:1`);
        }
      }
    }, theme);
  });
}
