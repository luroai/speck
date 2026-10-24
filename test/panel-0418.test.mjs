import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { panelRepo, freePort, startPanel, stop, findChrome, browserPage, T, full, round } from './support/panel.mjs';

// ---------- 0418: one column at every width, and no border round a lane ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

const NOW = Date.now();
const ago = m => new Date(NOW - m * 60000).toISOString();
// A Plan ticket and an idea, a Build ticket in each state with its own tint or edge, and two shipped.
const STATE = {
  run: { on: true }, resume_command: 'claude --resume {session}',
  tickets: [
    full('0201', { priority: 1 }),
    T('0202', 'ready', { after: ['0201'], waiting_on: ['0201'] }),
    T('0203', 'building', { started: ago(3), build_running: true }),
    T('0204', 'blocked', { started: ago(30), blocked_question: 'Which one?' }),
    T('0206', 'approved', { started: ago(40), approved: ago(30), auto_ship: false, rounds: [round(1, 1000)] }),
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

// One panel and one browser page for the file: each test sets the width it needs.
let panel, b;
before(async () => {
  if (skip.skip) return;
  panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  b = await browserPage('about:blank');
  await b.send('Page.enable');
  await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
  await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
  const ready = `location.port === '${panel.port}' && document.readyState === 'complete' && !!document.querySelector('#shipped tr') && !!document.querySelector('#queue .q')`;
  for (let i = 0; ; i++) {
    try { if (await b.js(ready)) break; } catch (e) { if (i >= 100) throw e; }
    if (i >= 100) throw new Error('timed out waiting for the panel');
    await new Promise(res => setTimeout(res, 100));
  }
});
after(async () => { if (b) await b.close(); if (panel) await stop(panel); });

const settle = () => b.js(`new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`);
async function width(w) {
  await b.send('Emulation.setDeviceMetricsOverride', { width: w, height: 800, deviceScaleFactor: 1, mobile: false });
  await settle();
}

// For each lane, opened by its tab with every Plan item and Build row in it open: the boxes of the header's frame, the
// tabs, the lane and its list, each ticket in it and the parts of each open Plan item's details.
const LAYOUT = `(async () => {
  const box = n => { const r = n.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width }; };
  const frame = n => n ? { header: box(document.querySelector('header')), bezel: box(document.querySelector('.bezel')),
    tabs: box(document.getElementById('tabs')), main: box(document.querySelector('main')) } : null;
  // A list's box inside its padding and any scroll bar.
  const inside = n => { const r = n.getBoundingClientRect(), s = getComputedStyle(n);
    return { left: r.left + n.clientLeft + parseFloat(s.paddingLeft), right: r.left + n.clientLeft + n.clientWidth - parseFloat(s.paddingRight) }; };
  const lanes = [];
  for (const tab of document.querySelectorAll('#tabs .tab')) {
    tab.click();
    for (const h of document.querySelectorAll('#shaping .item:not(.open) .head, #queue .q:not(.open) .top')) h.click();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const section = [...document.querySelectorAll('main > section')].find(n => !n.hidden);
    const list = section.querySelector('.lane-list');
    const tickets = [...list.querySelectorAll('.item, .q, #shipped tr')].filter(n => n.getBoundingClientRect().width > 0);
    const details = [...list.querySelectorAll('.item.open .detail')].map(d => [...d.children].filter(c => c.getBoundingClientRect().width > 0).map(box));
    lanes.push({ name: tab.querySelector('.tab-name').textContent, section: box(section), details,
      tickets: tickets.map(n => ({ id: n.className || n.tagName.toLowerCase(), ...box(n), list: inside(n.parentElement) })) });
  }
  document.getElementById('tab-build').click();
  return { vw: document.documentElement.clientWidth, ...frame(true), lanes };
})()`;

const WIDTHS = [320, 375, 600, 700, 720, 721, 1024, 1280, 1920];
const near = (a, b) => Math.abs(a - b) < 1;

// ---------- AC1 ----------

for (const w of WIDTHS) {
  test(`0418 AC1: at ${w} px, one column: the screen, the tabs, then the open lane's list, each ticket the list's full width`, skip, async () => {
    await width(w);
    const l = await b.js(LAYOUT);
    assert.ok(l.bezel.bottom <= l.tabs.top + 1, 'the tabs are under the screen');
    assert.ok(l.tabs.bottom <= l.main.top + 1, 'the lanes are under the tabs');
    assert.ok(l.bezel.left >= l.tabs.left - 1 && l.bezel.right <= l.tabs.right + 1, 'the screen is inside the column');
    assert.deepEqual(l.lanes.map(x => x.name), ['Plan', 'Build', 'Shipped']);
    for (const lane of l.lanes) {
      assert.ok(lane.section.top >= l.tabs.bottom - 1, `${lane.name} is under the tabs`);
      assert.ok(near(lane.section.left, l.main.left) || lane.section.left > l.main.left, `${lane.name} is inside the column`);
      assert.ok(lane.tickets.length > 0, `${lane.name} has tickets`);
      for (const t of lane.tickets) assert.ok(near(t.left, t.list.left) && near(t.right, t.list.right), `${lane.name}: ${t.id} spans its list: ${JSON.stringify(t)}`);
      for (const [a, z] of lane.tickets.slice(0, -1).map((t, i) => [t, lane.tickets[i + 1]])) assert.ok(z.top >= a.bottom - 1, `${lane.name}: ${z.id} is under ${a.id}`);
      for (const parts of lane.details) {
        assert.ok(parts.length > 1, 'an open Plan item has details to lay out');
        for (const [a, z] of parts.slice(0, -1).map((p, i) => [p, parts[i + 1]])) assert.ok(z.top >= a.bottom - 1 && near(z.left, a.left), `${lane.name}: an open item's details are one under another, not side by side`);
      }
    }
  });
}

// ---------- AC2 ----------

for (const w of WIDTHS) {
  test(`0418 AC2: at ${w} px, the column is ${w > 720 ? '720 px wide and centred' : 'the full width'}`, skip, async () => {
    await width(w);
    const l = await b.js(LAYOUT);
    const want = Math.min(720, l.vw), left = (l.vw - want) / 2;
    for (const part of ['header', 'tabs', 'main']) {
      assert.ok(near(l[part].width, want), `${part} is ${want} px wide: ${l[part].width}`);
      assert.ok(near(l[part].left, left) && near(l[part].right, left + want), `${part} is centred: ${JSON.stringify(l[part])}`);
    }
  });
}

// ---------- AC3 ----------

const BORDERS = `(() => {
  const sides = n => { const s = getComputedStyle(n); return ['Top', 'Right', 'Bottom', 'Left'].map(k => s['border' + k + 'Style'] === 'none' ? 0 : parseFloat(s['border' + k + 'Width'])); };
  const lanes = [...document.querySelectorAll('main > section')].map(n => ({ id: n.id, sides: sides(n) }));
  const tickets = [];
  for (const tab of document.querySelectorAll('#tabs .tab')) {
    tab.click();
    for (const n of document.querySelectorAll('main > section:not([hidden]) :is(.item, .q, #shipped tr)')) tickets.push({ id: n.className || n.tagName, sides: sides(n) });
  }
  document.getElementById('tab-build').click();
  return { lanes, tickets };
})()`;

for (const w of [375, 1280]) {
  test(`0418 AC3: at ${w} px, no lane has a border round it, and each ticket keeps its full border`, skip, async () => {
    await width(w);
    const { lanes, tickets } = await b.js(BORDERS);
    assert.deepEqual(lanes.map(l => l.id), ['shaping-section', 'build-section', 'shipped-section']);
    for (const l of lanes) assert.deepEqual(l.sides, [0, 0, 0, 0], `${l.id} has no border`);
    assert.ok(tickets.length >= 7, 'every ticket was checked');
    for (const t of tickets) assert.ok(t.sides.every(x => x >= 1), `${t.id} has a border on every side: ${t.sides}`);
  });
}

// Each Build row's border and fill, by its state, against the colours its state has had since 0161, 0167 and 0171.
test('0418 AC3: a ticket that needs you, waits for you or is being built keeps its tint or edge', skip, async () => {
  await width(375);
  const got = await b.js(`(() => {
    const root = getComputedStyle(document.documentElement);
    const colour = v => { const p = document.createElement('i'); p.style.color = root.getPropertyValue(v); document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; };
    const row = cls => { const n = document.querySelector('#queue .q.' + cls); if (!n) return null; const s = getComputedStyle(n);
      return { border: s.borderTopColor, width: s.borderTopWidth, fill: s.backgroundColor }; };
    return { want: { bad: colour('--bad'), badBg: colour('--bad-bg'), ok: colour('--ok'), okBg: colour('--ok-bg'), blue: colour('--blue'), raise: colour('--raise') },
      blocked: row('blocked'), toShip: row('to-ship'), atBuild: row('at-build'), wait: row('wait') };
  })()`);
  const w = got.want;
  assert.deepEqual(got.blocked, { border: w.bad, width: '1px', fill: w.badBg }, 'a ticket that needs you is crimson');
  assert.deepEqual(got.toShip, { border: w.ok, width: '1px', fill: w.okBg }, 'a ticket waiting for you to ship it is green (0440)');
  assert.ok(got.atBuild, 'a ticket being built is in the list');
  assert.deepEqual([got.atBuild.border, got.atBuild.width], [w.blue, '2px'], 'a ticket being built has a 2px edge in its stage\'s colour (0426: Cursor\'s blue)');
  assert.equal(got.wait && got.wait.fill, w.raise, 'a ticket waiting on another is set back by its fill');
});
