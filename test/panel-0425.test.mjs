import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, full, round, click, page, panelRepo, fm, good, freePort, startPanel, stop, findChrome, browserPage, styles } from './support/panel.mjs';

// ---------- 0425: the lane tabs share the row equally, and the lanes' counts are at the top of the lanes ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const clone = s => JSON.parse(JSON.stringify(s));
const at = h => new Date(Date.UTC(2026, 9, 9, h)).toISOString();
const board = (foreman = null) => ({
  tickets: [full('0001', { title: 'A draft' }), full('0003', { status: 'ready', title: 'Queued one' }),
    full('0005', { status: 'done', title: 'Shipped one', started: at(7), finished: at(8), rounds: [round(1, 100)] })],
  ideas: [],
  ...(foreman ? { foreman } : {}),
});
const TAB = { plan: 'tab-plan', build: 'tab-build', shipped: 'tab-shipped' };
const LANE = { plan: 'shaping-section', build: 'build-section', shipped: 'shipped-section' };
// A fake page whose /api/state answers with `p.state` at that moment, where each tab can take the focus.
function livePage(s) {
  const box = { state: s };
  let focused = null;
  const focusable = n => { n.focus = () => { focused = n; p.document.activeElement = n; }; return n; };
  const p = fakePage([], { fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : clone(box.state)) }) }, { made: focusable });
  for (const id of ['full-ticket', ...Object.values(LANE), ...Object.values(TAB)]) focusable(p.byId(id));
  p.set = next => { box.state = next; };
  p.focused = () => focused;
  return p;
}
const refresh = async p => { p.timers.shift()(); await p.settle(); };
const staticHtml = () => page().replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<style>[\s\S]*?<\/style>/g, '');
const css = () => styles();
const nav = () => staticHtml().match(/<nav [^>]*role="tablist"[^>]*>([\s\S]*?)<\/nav>/)[1];
const tabHtml = id => nav().match(new RegExp(`<button [^>]*id="${id}"[^>]*>([\\s\\S]*?)</button>`))[1];
const open = p => Object.keys(LANE).filter(l => !p.byId(LANE[l]).hidden);

// ---------- AC1 ----------

test('0425 AC1: in a real browser, at every width from 320 px the three tabs are each a third of the row and the same height, each name on one line', skip, async () => {
  const r = panelRepo();
  r.write('0010-ready.md', fm({ id: '"0010"', title: 'Ready ticket', status: 'ready' }), good);
  r.write('0020-done.md', fm({ id: '"0020"', title: 'Shipped ticket', status: 'done' }), good, 'speck/tickets/done');
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage(`http://127.0.0.1:${panel.port}/`);
  try {
    await b.until(`!!document.querySelector('#queue .id') && document.getElementById('queue-n').textContent !== ''`, 'the board');
    // With Plan open and a two-digit needs-you number on Build, its widest.
    await b.js(`document.getElementById('tab-plan').click(), document.getElementById('build-needs').textContent = '12', 1`);
    for (const width of [320, 360, 375, 414, 600, 720, 900, 1280]) {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 600, deviceScaleFactor: 1, mobile: width < 700 });
      const s = await b.js(`(() => {
        const nav = document.getElementById('tabs'), cs = getComputedStyle(nav), r = nav.getBoundingClientRect();
        const row = { left: r.left + parseFloat(cs.paddingLeft), right: r.right - parseFloat(cs.paddingRight) };
        return { row, tabs: [...nav.querySelectorAll('.tab')].map(t => { const b = t.getBoundingClientRect(), name = t.querySelector('.tab-name');
          const needs = t.querySelector('.needs'), nb = needs && needs.getBoundingClientRect();
          return { left: b.left, right: b.right, width: b.width, height: b.height, lines: name.getClientRects().length,
            nameWhole: name.scrollWidth <= name.clientWidth, nameTop: name.getBoundingClientRect().top,
            needsIn: !needs || (nb.right <= b.right + 0.5 && nb.width > 0), needsTop: nb ? nb.top : null,
            nameH: name.getBoundingClientRect().height }; }) };
      })()`);
      const third = (s.row.right - s.row.left) / 3;
      assert.equal(s.tabs.length, 3);
      s.tabs.forEach((t, i) => {
        assert.ok(Math.abs(t.width - third) <= 1, `${width} px, tab ${i + 1}: ${t.width} px wide, a third is ${third}`);
        assert.ok(Math.abs(t.left - (s.row.left + i * third)) <= 1, `${width} px, tab ${i + 1}: starts a third along the row`);
        assert.equal(t.height, s.tabs[0].height, `${width} px, tab ${i + 1}: the same height as the others`);
        assert.equal(t.lines, 1, `${width} px, tab ${i + 1}: its name on one line`);
        assert.ok(t.nameWhole, `${width} px, tab ${i + 1}: its name isn't cut off`);
        assert.ok(t.needsIn, `${width} px, tab ${i + 1}: the needs-you number fits in the tab`);
      });
      assert.ok(Math.abs(s.tabs[1].needsTop - s.tabs[1].nameTop) < s.tabs[1].nameH, `${width} px: Build's number is on its name's line`);
      assert.ok(s.row.right - s.tabs[2].right <= 1, `${width} px: the tabs fill the row`);
    }
  } finally { await b.close(); await stop(panel); }
});

// ---------- AC2 ----------

test('0425 AC2: each tab holds its name and nothing else, except Build\'s needs-you number', () => {
  assert.equal(tabHtml('tab-plan'), '<span class="tab-name">Plan</span>');
  assert.equal(tabHtml('tab-build'), '<span class="tab-name">Build</span><span class="needs" id="build-needs"></span>');
  assert.equal(tabHtml('tab-shipped'), '<span class="tab-name">Shipped</span>');
  assert.match(css(), /\.tab \.needs \{ color: var\(--bad\); \}/, 'the number is in the panel\'s crimson');
  assert.match(css(), /\.tab \{[^}]*white-space: nowrap;/, 'a tab never wraps its name');
});

test('0425 AC2: with Plan or Shipped open and the Foreman reading "Needs you <n>", Build shows <n> alone, and its accessible name says "<n> needs you"', async () => {
  const p = livePage(board({ word: 'Needs you 3', tone: 'bad' }));
  await p.settle();
  const label = () => (p.byId('tab-build').attrs || {})['aria-label'];
  assert.equal(p.byId('build-needs').textContent, '', 'Build open: no number');
  assert.ok(!label() || label() === 'Build', 'Build open: its name is Build');
  for (const lane of ['plan', 'shipped']) {
    click(p.byId(TAB[lane]));
    assert.equal(p.byId('build-needs').textContent, '3', `${lane} open: the number alone`);
    assert.match(label(), /^Build\b.*\b3 needs you$/, `${lane} open: the accessible name`);
  }
  p.set(board({ word: 'Needs you 12', tone: 'bad' }));
  await refresh(p);
  assert.equal(p.byId('build-needs').textContent, '12');
  assert.match(label(), /\b12 needs you$/);
  for (const word of ['Building', 'Idle', 'Needs you', 'Blocked 2']) {
    p.set(board({ word, tone: 'idle' }));
    await refresh(p);
    assert.equal(p.byId('build-needs').textContent, '', `"${word}": no number`);
    assert.equal(label(), 'Build', `"${word}": its name is Build`);
  }
});

// ---------- AC3 ----------

test('0425 AC3: Build\'s and Shipped\'s counts are the first line of their lane, above its tickets, with today\'s wording', async () => {
  const html = staticHtml();
  const first = id => html.match(new RegExp(`<section id="${id}"[^>]*>\\s*<h2 class="lane-title">[^<]*</h2>\\s*<([a-z]+) [^>]*id="([^"]+)"`))[2]; // 0476: under the lane's name
  assert.equal(first('build-section'), 'queue-n', 'Build\'s count opens its lane');
  assert.equal(first('shipped-section'), 'shipped-n', 'Shipped\'s count opens its lane');
  assert.doesNotMatch(nav(), /id="(queue-n|shipped-n)"/, 'and neither is in a tab');
  const p = livePage(board());
  await p.settle();
  assert.equal(p.byId('queue-n').textContent, '0 in flight · 1 queued');
  assert.equal(p.byId('shipped-n').textContent, '1 in total');
  p.set({ tickets: [T('0007', 'building', { started: at(9) })], ideas: [] });
  await refresh(p);
  assert.equal(p.byId('queue-n').textContent, '1 in flight · 0 queued');
  assert.equal(p.byId('shipped-n').textContent, '0 in total');
  p.set({ tickets: [], ideas: [] });
  await refresh(p);
  assert.equal(p.byId('queue-n').textContent, ''); // 0449: an empty lane says so in its message alone
  assert.equal(p.byId('queue-n').hidden, true);
});

// ---------- AC4 ----------

test('0425 AC4: the tabs are still buttons Tab reaches and Enter or Space press, and a click opens each', async () => {
  for (const [, attrs] of nav().matchAll(/<button ([^>]*)>/g)) {
    assert.match(attrs, /\btype="button"/, attrs);
    assert.match(attrs, /\brole="tab"/, attrs);
    assert.doesNotMatch(attrs, /\btabindex=|\bdisabled\b/, attrs);
  }
  const p = livePage(board());
  await p.settle();
  for (const lane of ['plan', 'shipped', 'build']) {
    click(p.byId(TAB[lane]));
    assert.deepEqual(open(p), [lane], `pressing ${lane}`);
  }
});

test('0425 AC4: the left and right arrow keys still open the tab beside it, round the ends, with the focus on it', async () => {
  const p = livePage(board());
  await p.settle();
  for (const [from, key, to] of [['build', 'ArrowRight', 'shipped'], ['shipped', 'ArrowRight', 'plan'], ['plan', 'ArrowLeft', 'shipped'], ['shipped', 'ArrowLeft', 'build']]) {
    p.byId(TAB[from]).listeners.keydown({ key, preventDefault() {} });
    assert.deepEqual(open(p), [to], `${key} on ${from}`);
    assert.equal(p.focused(), p.byId(TAB[to]), `${key} on ${from}: the focus is on ${to}`);
  }
});
