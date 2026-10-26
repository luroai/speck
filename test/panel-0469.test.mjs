import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, panelRepo, freePort, startPanel, stop, findChrome, browserPage, styles, T, full, idea, round, openLane } from './support/panel.mjs';

// ---------- 0469: the touch screen's layout with a mouse too ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

// Each top-level block of the stylesheets, with comments taken out: its prelude ('' for a plain rule) and its body.
function blocks(text) {
  text = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  for (let i = 0; ;) {
    const open = text.indexOf('{', i);
    if (open < 0) return out;
    let depth = 1, j = open + 1;
    while (depth && j < text.length) { if (text[j] === '{') depth++; else if (text[j] === '}') depth--; j++; }
    out.push({ prelude: text.slice(i, open).trim(), body: text.slice(open + 1, j - 1) });
    i = j;
  }
}
const rules = body => [...body.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(m => [m[1].trim().replace(/\s+/g, ' '), m[2].trim()]);

// The header's and the cards' styles, and the base styles they share. The full ticket, Settings and the Pipeline
// pop-up keep their own touch screen sizes.
const LANES = () => ['panel-base.css', 'panel-header.css', 'panel-cards.css'].map(f => fs.readFileSync(path.join(ROOT, 'templates', f), 'utf8')).join('\n');

test('0469 AC1: the header\'s and cards\' touch screen rules change no layout: each only gives a tap area that reaches past a control', () => {
  const touch = blocks(LANES()).filter(b => /pointer:\s*coarse/.test(b.prelude)).flatMap(b => rules(b.body));
  assert.ok(touch.length > 0, 'the tap areas are still there on a touch screen');
  for (const [sel, decls] of touch) {
    const props = decls.split(';').map(d => d.split(':')[0].trim()).filter(Boolean);
    const tapArea = /::after$/.test(sel) && props.every(p => ['content', 'position', 'inset'].includes(p));
    assert.ok(tapArea || (props.length === 1 && props[0] === 'z-index') || (sel === '.tag:not(.pick)' && decls === 'position: relative;'),
      `${sel} { ${decls} } is a tap area only`);
  }
});

test('0469 AC3: with a mouse, hovering still highlights a card', () => {
  const hover = blocks(styles()).filter(b => b.prelude === '@media (hover: hover)').flatMap(b => rules(b.body));
  assert.ok(hover.some(([sel, decls]) => sel === '.item:hover' && /background:\s*var\(--raise\)/.test(decls)), 'a card is raised under a mouse');
});

// ---------- in a real browser: every card in each lane, closed and open, with a mouse and with a touch screen ----------

const NOW = Date.now();
const ago = m => new Date(NOW - m * 60000).toISOString();
const STATE = {
  run: { on: true }, resume_command: 'claude --resume {session}',
  tickets: [
    full('0501', { title: 'A draft that waits on another', priority: 1, after: ['0503'], waiting_on: ['0503'] }),
    full('0502', { title: 'A draft whose title is long enough that it has to wrap onto a second line when it is open', priority: 3, risk: 'high', type: 'bug' }),
    T('0503', 'building', { title: 'Building now', started: ago(65), build_running: true }),
    T('0504', 'reviewing', { title: 'Under review', started: ago(30), build_running: true, rounds: [{ round: 1, verdict: 'request_changes' }], review_running: 2, reviewer: 'codex' }),
    T('0505', 'ready', { title: 'Queued behind', after: ['0503'], waiting_on: ['0503'] }),
    T('0506', 'blocked', { title: 'Blocked on a question', started: ago(90), session: '11111111-2222-3333-4444-555555555555', type: 'fix',
      blocked_question: 'ISO dates or the locale?', recommended: 'ISO', changes_notice: 'yes', clear_winner: 'no' }),
    T('0507', 'approved', { title: 'Approved, not shipped', started: ago(40), approved: ago(30), rounds: [round(1, 1000)] }),
    ...[1, 2].map(n => T(`040${n}`, 'done', { title: `Shipped ${n}`, type: n === 1 ? 'bug' : '', started: ago(200), approved: ago(190), finished: ago(180), rounds: [round(1, 1234)] })),
  ],
  ideas: [idea('2026-10-24-an-idea', 'idea'), idea('2026-10-24-in-the-inbox', 'inbox')],
};
const stub = `(() => {
  const STATE = ${JSON.stringify(STATE)};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(STATE) : /\\/log$/.test(String(url)) ? json({ text: '' }) : opts.method === 'POST' ? json({}) : real(url, opts);
})();`;

// Each view of the header, the tabs and a lane: [name, script that opens it, what shows once it's open].
const VIEWS = [
  ['Plan, tickets closed', `${openLane('plan')}, true`, `!!document.querySelector('#shaping .item.ticket')`],
  ['Plan, tickets open', `[...document.querySelectorAll('#shaping .item:not(.open) .head')].forEach(h => h.click()), true`, `document.querySelectorAll('#shaping .item.open').length === 2`],
  // 0520: ideas and the inbox are in Capture, one list
  ['Capture, closed', `${openLane('capture')}, true`, `!!document.querySelector('#capture .item.idea') && !!document.querySelector('#capture .item.inbox')`],
  ['Capture, an idea open', `document.querySelector('#capture .item.idea .head').click(), true`, `!!document.querySelector('#capture .item.idea.open')`],
  ['Build, closed', `${openLane('build')}, true`, `document.querySelectorAll('#queue .q').length === 5`],
  ['Build, open', `[...document.querySelectorAll('#queue .q:not(.open) .top')].forEach(t => t.click()), true`, `document.querySelectorAll('#queue .q.open').length === 5`],
  ['Shipped, closed', `${openLane('shipped')}, true`, `document.querySelectorAll('#shipped tr').length === 2`],
  ['Shipped, open', `[...document.querySelectorAll('#shipped tr:not(.open) .line .title')].forEach(t => t.click()), true`, `document.querySelectorAll('#shipped tr.open').length === 2`],
];
// Each shown element in the header, the tabs and the open lane: where it is, its size, and the styles that lay it out.
const READ = `(async () => {
  await document.fonts.ready;
  for (const a of document.getAnimations()) { a.pause(); a.currentTime = 0; }
  const where = n => { const p = []; for (; n && n.nodeType === 1 && n !== document.body; n = n.parentElement) p.unshift(n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + (typeof n.className === 'string' && n.className ? '.' + n.className.trim().split(/\\s+/).join('.') : '')); return p.join(' > '); };
  const lane = document.querySelector('[role="tabpanel"]:not([hidden])');
  const nodes = [document.querySelector('header'), document.getElementById('tabs'), lane].flatMap(n => [n, ...n.querySelectorAll('*')]);
  return nodes.filter(n => n.getClientRects().length).map(n => { const r = n.getBoundingClientRect(), s = getComputedStyle(n);
    return [where(n), [r.x, r.y, r.width, r.height].map(v => Math.round(v * 100) / 100).join(','),
      ['padding', 'margin', 'lineHeight', 'gap', 'minHeight', 'minWidth', 'fontSize', 'fontFamily'].map(k => s[k]).join('|')].join(' :: '); });
})()`;

for (const width of [390, 600]) {
  test(`0469 AC1, AC2: at ${width} px, the header, tabs and every card closed and open are laid out the same with a mouse as on a touch screen, in the same font sizes`, skip, async () => {
    const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
    const b = await browserPage('about:blank');
    const pointer = async touch => {
      await b.send('Emulation.setTouchEmulationEnabled', touch ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
      assert.equal(await b.js(`matchMedia('(pointer: coarse)').matches`), touch, touch ? 'a touch screen' : 'a mouse');
      await b.js(`new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))`);
    };
    try {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
      await b.send('Page.enable');
      await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
      await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
      await b.until(`location.port === '${panel.port}' && document.querySelectorAll('#queue .q').length === 5`, 'the panel');
      let compared = 0;
      for (const [view, open, shows] of VIEWS) {
        await b.js(open);
        await b.until(shows, view);
        await pointer(true);
        const touch = await b.js(READ);
        await pointer(false);
        const mouse = await b.js(READ);
        assert.equal(mouse.length, touch.length, `${view}: the same elements`);
        const differ = mouse.map((m, i) => [m, touch[i]]).filter(([m, t]) => m !== t);
        assert.deepEqual(differ.slice(0, 3), [], `${view}: ${differ.length} elements differ, mouse then touch`);
        compared += mouse.length;
      }
      // the controls the criterion names were among those compared
      assert.ok(await b.js(`getComputedStyle(document.getElementById('settings-open')).width === '44px' && getComputedStyle(document.getElementById('tab-plan')).minHeight === '44px'`), 'the 44 px Settings button and tabs, with a mouse');
      assert.ok(compared > 300, `elements compared: ${compared}`);
    } finally { await b.close(); await stop(panel); }
  });
}
