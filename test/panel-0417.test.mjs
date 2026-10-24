import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, panelRepo, freePort, startPanel, stop, findChrome, browserPage, T, full, round, openLane, styles } from './support/panel.mjs';

// ---------- 0417: finger-sized controls on touch screens only ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const css = () => styles();

// Each top-level block of the stylesheet: its prelude ('' for a plain rule, or the @media query) and its body.
function blocks(text) {
  text = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf('{', i);
    if (open < 0) break;
    const prelude = text.slice(i, open).trim();
    let depth = 1, j = open + 1;
    while (depth && j < text.length) { if (text[j] === '{') depth++; else if (text[j] === '}') depth--; j++; }
    out.push({ prelude, body: text.slice(open + 1, j - 1) });
    i = j;
  }
  return out;
}
// The rules in a block's body: [selector, declarations].
const rules = body => [...body.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(m => [m[1].trim().replace(/\s+/g, ' '), m[2].trim()]);
const media = q => blocks(css()).filter(b => b.prelude === `@media ${q}`);

// Every selector with a 44 px minimum (or a 44 px width and height) under 700 px before this ticket.
const SIZED = ['.bezel .settings-open', '.tab', '.toggle', '.head', '.item.ticket .prio', '.prio-menu button', '.set-ready, .full-open',
  '.goto', '.q .top', '.q .full-open', '.q .stop-build, .q .back-to-plan, .q .go-with, .foreman-ask .ask-reply', '.resume .copy',
  '.more-stats', 'td .title-link', 'td .full-open',
  '#full-ticket .close, #full-ticket .ship, #full-ticket .ask-changes, #doc-view .close, #doc-view .ship, #doc-view .ask-changes, #foreman .close, #settings .close',
  '#full-ticket .md summary, #doc-view .md summary'];

test('0417 AC1: no rule outside the touch screen rules gives a control a 44 px size, at any width', () => {
  const found = [];
  for (const b of blocks(css())) {
    if (b.prelude === '@media (pointer: coarse)') continue;
    for (const [sel, decls] of b.prelude.startsWith('@') ? rules(b.body) : [[b.prelude, b.body]]) if (/\b44px\b/.test(decls)) found.push(`${b.prelude || '(no media query)'} ${sel}`);
  }
  assert.deepEqual(found, []);
});

test('0417 AC2: the touch screen rules apply at any width and keep each 44 px minimum the narrow rules had', () => {
  const coarse = media('(pointer: coarse)');
  assert.equal(coarse.length, 1, 'one block for touch screens, with no width in its query');
  const got = new Map();
  for (const [sel, decls] of rules(coarse[0].body)) got.set(sel, (got.get(sel) || '') + decls);
  for (const sel of SIZED) {
    const d = got.get(sel) || '';
    assert.ok(/min-height:\s*44px|(^|[\s;])height:\s*44px/.test(d), `${sel} is at least 44 px high on a touch screen: ${d}`);
  }
  for (const sel of ['.toggle', '.prio-menu button', '.set-ready, .full-open', '.resume .copy', '.more-stats', 'td .title-link', '.item.ticket .prio'])
    assert.match(got.get(sel), /min-width:\s*44px/, `${sel} is at least 44 px wide on a touch screen`);
  // The tags' 44 px tap areas, and the gaps that keep them apart (0165)
  assert.match(got.get('.tag:not(.pick)::after') || '', /44px/);
  assert.match(got.get('.tag-row') || '', /gap:\s*18px/); // 0465: the full ticket has no tags
});

// The rules for narrow windows that aren't about a control's size, as they were before this ticket. 0418: the panel's
// own layout is the same at every width, so only those for Settings and for class names shared with the lanes are left.
const NARROW = ['#settings .switch-row .info::after, #settings .setting .info::after', '#settings .looks [role="radio"]',
  '#settings .switch-row .row, #settings .setting .row, #settings .arow .row', '.sh', '.detail', '.ready', '.resume', '.resume .cmd'];

test('0417 AC3: the other rules for narrow windows are still under 700 px', () => {
  const narrow = media('(max-width: 699.98px)');
  assert.equal(narrow.length, 1);
  const got = rules(narrow[0].body);
  const sels = got.map(([s]) => s);
  for (const sel of NARROW) assert.ok(sels.includes(sel), `${sel} is still in the narrow rules`);
  assert.match(got.find(([s]) => s === '.detail')[1], /grid-template-columns:\s*minmax\(0, 1fr\)/);
  // 0158: tables as blocks, and the review pack's criteria laid out for a narrow window
  assert.ok(sels.some(s => s.includes('#full-ticket .md table')) && sels.some(s => s.includes('.ac-table tr')), 'the narrow table rules');
});

// ---------- the real thing: a narrow pane with a mouse, and a touch screen at any width ----------

const NOW = Date.now();
const ago = m => new Date(NOW - m * 60000).toISOString();
const STATE = {
  run: { on: true }, resume_command: 'claude --resume {session}',
  tickets: [
    full('0201', { priority: 1 }),
    T('0203', 'building', { started: ago(3), build_running: true }),
    T('0206', 'approved', { started: ago(40), approved: ago(30), rounds: [round(1, 1000)] }),
    ...[1, 2].map(n => T(`010${n}`, 'done', { started: ago(200), approved: ago(190), finished: ago(180), rounds: [round(1, 1234)] })),
  ],
  ideas: [],
};
const stub = `(() => {
  const STATE = ${JSON.stringify(STATE)};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(STATE) : opts.method === 'POST' ? json({}) : real(url, opts);
})();`;

async function withPanel(fn) {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    const ready = `location.port === '${panel.port}' && document.readyState === 'complete' && !!document.querySelector('#shipped tr') && !!document.querySelector('#queue .q')`;
    for (let i = 0; ; i++) {
      try { if (await b.js(ready)) break; } catch (e) { if (i >= 100) throw e; }
      if (i >= 100) throw new Error('timed out waiting for the panel');
      await new Promise(res => setTimeout(res, 100));
    }
    await fn(b);
  } finally { await b.close(); await stop(panel); }
}
const settle = b => b.js(`new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`);
async function view(b, width, touch) {
  await b.send('Emulation.setDeviceMetricsOverride', { width, height: 800, deviceScaleFactor: 1, mobile: width < 700 });
  await b.send('Emulation.setTouchEmulationEnabled', touch ? { enabled: true, maxTouchPoints: 1 } : { enabled: false });
  assert.equal(await b.js(`matchMedia('(pointer: coarse)').matches`), touch, 'the pointer is as emulated');
  await settle(b);
}
// Opens the lane, then every Plan item or Build row in it, and gives each shown control in it with its size and minimums.
const CONTROLS = lane => `(async () => {
  document.getElementById('tab-${lane}').click();
  for (const h of document.querySelectorAll('#shaping .item:not(.open) .head, #queue .q:not(.open) .top')) h.click();
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const shown = n => { const r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(n).visibility === 'visible'; };
  return [...document.querySelectorAll('button, summary, .head, .q .top, .item.ticket .prio, td .title-link, .goto')].filter(shown).map(n => {
    const s = getComputedStyle(n), r = n.getBoundingClientRect();
    return { what: n.tagName.toLowerCase() + '.' + String(n.className).trim().split(/\\s+/).join('.'), width: r.width, height: r.height, minWidth: s.minWidth, minHeight: s.minHeight };
  });
})()`;
const LANES = ['plan', 'build', 'shipped'];

test('0417 AC1, AC3: in a 375 px window with no touch screen, no control has a 44 px minimum and the narrow layout still applies', skip, () => withPanel(async b => {
  await view(b, 375, false);
  const seen = [];
  for (const lane of LANES) {
    const all = await b.js(CONTROLS(lane));
    seen.push(...all);
    const big = all.filter(c => c.minWidth === '44px' || c.minHeight === '44px').map(c => `${lane}: ${c.what} ${c.minWidth} x ${c.minHeight}`);
    assert.deepEqual(big, [], 'no 44 px minimums with a mouse');
  }
  assert.ok(seen.some(c => /toggle/.test(c.what)) && seen.some(c => /set-ready/.test(c.what)), 'the controls were there to check');
  const gear = await b.js(`(() => { const r = document.getElementById('settings-open').getBoundingClientRect(); return [r.width, r.height]; })()`);
  assert.deepEqual(gear, [30, 30], 'Settings keeps its compact 30 px button');
  // AC3: the narrow layout itself, which isn't about a control's size
  await b.js(openLane('build'));
  assert.equal(await b.js(`getComputedStyle(document.getElementById('tab-build')).flexDirection`), 'row', 'each tab\'s name on one line (0425)');
  assert.equal(await b.js(`getComputedStyle(document.getElementById('queue')).paddingLeft`), '16px'); // 0418: the lane's list, as main has none
}));

for (const width of [375, 1280]) {
  test(`0417 AC2: at ${width} px on a touch screen, every control that had a 44 px minimum is at least 44 px each way`, skip, () => withPanel(async b => {
    await view(b, width, true);
    const small = [];
    const seen = new Set();
    for (const lane of LANES) {
      for (const c of await b.js(CONTROLS(lane))) {
        seen.add(c.what.split('.')[1] || c.what);
        const minW = /^(button\.(toggle|set-ready|full-open|copy|more-stats|settings-open|prio)|span\.title-link)/.test(c.what);
        if (c.height < 43.5 || (minW && c.width < 43.5)) small.push(`${lane}: ${c.what} ${Math.round(c.width)}x${Math.round(c.height)}`);
      }
    }
    assert.deepEqual(small, [], 'finger-sized on a touch screen');
    for (const c of ['toggle', 'set-ready', 'settings-open', 'head', 'top']) assert.ok(seen.has(c), `${c} was checked`);
  }));
}
