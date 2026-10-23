import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, full, round, click, items, top, queueRows, page, panelRepo, fm, good, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0410: Plan, Build and Shipped as tabs ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const clone = s => JSON.parse(JSON.stringify(s));
const at = h => new Date(Date.UTC(2026, 9, 9, h)).toISOString();
const shipped = (id, h, o = {}) => full(id, { status: 'done', started: at(h - 1), finished: at(h), rounds: [round(1, 100)], ...o });
// 0001 is a draft; 0002 is ready and waits on it; 0003 is ready; 0005 has shipped.
const board = (o = {}) => ({
  tickets: [full('0001', { title: 'A draft', ...o['0001'] }), T('0002', 'ready', { after: ['0001'], waiting_on: ['0001'] }),
    full('0003', { status: 'ready', title: 'Queued one', ...o['0003'] }), shipped('0005', 8, { title: 'Shipped one' })],
  ideas: [],
  ...(o.foreman ? { foreman: o.foreman } : {}),
});
const LANE = { plan: 'shaping-section', build: 'build-section', shipped: 'shipped-section' };
const TAB = { plan: 'tab-plan', build: 'tab-build', shipped: 'tab-shipped' };
// The lanes showing, and the tabs marked open.
const showing = p => Object.keys(LANE).filter(l => !p.byId(LANE[l]).hidden);
const selected = p => Object.keys(TAB).filter(l => (p.byId(TAB[l]).attrs || {})['aria-selected'] === 'true');
const openIs = (p, lane, what) => { assert.deepEqual(showing(p), [lane], `${what}: only ${lane} shows`); assert.deepEqual(selected(p), [lane], `${what}: its tab is marked open`); };

// A fake page whose /api/state answers with `p.state` at that moment, where each node can take the focus and
// `p.focused()` is the node holding it. `onFocus` is called as each node takes it.
function livePage(s, onFocus = () => {}) {
  const box = { state: s };
  let focused = null;
  const focusable = n => { n.focus = () => { focused = n; p.document.activeElement = n; onFocus(n); }; return n; };
  const p = fakePage([], {
    fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: 'built', truncated: false } : clone(box.state)) }),
  }, { made: focusable });
  for (const id of ['full-ticket', ...Object.values(LANE), ...Object.values(TAB)]) focusable(p.byId(id));
  p.set = next => { box.state = next; };
  p.focused = () => focused;
  return p;
}
const refresh = async p => { p.timers.shift()(); await p.settle(); };
const arrow = (p, lane, key) => p.byId(TAB[lane]).listeners.keydown({ key, preventDefault() {} });
const staticHtml = () => page().replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<style>[\s\S]*?<\/style>/g, '');

// ---------- AC1 ----------

test('0410 AC1: three tabs under the header, Plan, Build and Shipped, and Build is open when the panel loads', async () => {
  const html = staticHtml();
  const nav = html.match(/<\/header>[\s\S]*?(<nav [^>]*role="tablist"[^>]*>[\s\S]*?<\/nav>)\s*<main>/);
  assert.ok(nav, 'a tab row between the header and the lanes');
  const tabs = [...nav[1].matchAll(/<button ([^>]*)>([\s\S]*?)<\/button>/g)];
  assert.deepEqual(tabs.map(t => (t[1].match(/\bid="([^"]+)"/) || [])[1]), ['tab-plan', 'tab-build', 'tab-shipped']);
  assert.deepEqual(tabs.map(t => t[2].replace(/<[^>]*>/g, '')), ['Plan', 'Build', 'Shipped']);
  const p = livePage(board());
  await p.settle();
  openIs(p, 'build', 'on load');
});

test('0410 AC1: pressing a tab opens its lane, and only its lane', async () => {
  const p = livePage(board());
  await p.settle();
  for (const lane of ['plan', 'shipped', 'build', 'plan']) {
    click(p.byId(TAB[lane]));
    openIs(p, lane, `after pressing ${lane}`);
  }
});

test('0410 AC1: Build and Shipped show the counts their headings did; Plan shows none', async () => {
  const nav = staticHtml().match(/<nav [^>]*role="tablist"[^>]*>([\s\S]*?)<\/nav>/)[1];
  const tab = id => nav.match(new RegExp(`<button [^>]*id="${id}"[^>]*>([\\s\\S]*?)</button>`))[1];
  assert.equal(tab('tab-plan'), '<span class="tab-name">Plan</span>', 'Plan\'s tab is its name alone');
  assert.match(tab('tab-build'), /<span class="tab-name">Build<\/span><span class="n" id="queue-n"><\/span>/, 'Build\'s count is in its tab');
  assert.match(tab('tab-shipped'), /<span class="tab-name">Shipped<\/span><span class="n" id="shipped-n"><\/span>/, 'Shipped\'s count is in its tab');
  assert.doesNotMatch(staticHtml().split('</nav>')[1], /id="(queue-n|shipped-n)"/, 'and nowhere else');
  const p = livePage(board());
  await p.settle();
  assert.equal(p.byId('queue-n').textContent, '0 in flight · 2 queued');
  assert.equal(p.byId('shipped-n').textContent, '1 in total');
  p.set({ tickets: [], ideas: [] });
  await refresh(p);
  assert.equal(p.byId('queue-n').textContent, 'Nothing in flight or ready');
  assert.equal(p.byId('shipped-n').textContent, '0 in total');
  assert.match(p.byId('queue').textContent, /Nothing in flight or ready\./, 'an empty Build lane says so');
});

test('0410 AC1: the tabs are buttons Tab reaches, and Enter and Space press them', () => {
  const nav = staticHtml().match(/<nav [^>]*role="tablist"[^>]*>([\s\S]*?)<\/nav>/)[1];
  for (const [, attrs] of nav.matchAll(/<button ([^>]*)>/g)) {
    assert.match(attrs, /\btype="button"/, attrs);
    assert.match(attrs, /\brole="tab"/, attrs);
    assert.doesNotMatch(attrs, /\btabindex=/, `${attrs}: left in the Tab order`);
    assert.doesNotMatch(attrs, /\bdisabled\b/, attrs);
  }
});

test('0410 AC1: the left and right arrow keys open the tab beside it, round the ends, with the focus on it', async () => {
  const p = livePage(board());
  await p.settle();
  for (const [from, key, to] of [['build', 'ArrowRight', 'shipped'], ['shipped', 'ArrowRight', 'plan'], ['plan', 'ArrowLeft', 'shipped'], ['shipped', 'ArrowLeft', 'build'], ['build', 'ArrowLeft', 'plan']]) {
    arrow(p, from, key);
    openIs(p, to, `${key} on ${from}`);
    assert.equal(p.focused(), p.byId(TAB[to]), `${key} on ${from}: the focus is on ${to}'s tab`);
  }
  arrow(p, 'plan', 'ArrowDown');
  openIs(p, 'plan', 'another key changes nothing');
});

test('0410 AC1 (self-check): an arrow key with Alt, Ctrl or Cmd held is left to the browser, as Alt+Left goes back', async () => {
  const p = livePage(board());
  await p.settle();
  for (const mod of ['altKey', 'ctrlKey', 'metaKey']) {
    let prevented = false;
    p.byId(TAB.build).listeners.keydown({ key: 'ArrowLeft', [mod]: true, preventDefault() { prevented = true; } });
    openIs(p, 'build', `${mod} with ArrowLeft`);
    assert.equal(prevented, false, `${mod}: left alone`);
  }
});

// ---------- AC2 ----------

test('0410 AC2: in a real browser, at every width the page doesn\'t scroll and the open lane\'s list does, under a header and tab row that stay put', skip, async () => {
  const r = panelRepo();
  for (let n = 10; n < 50; n++) {
    r.write(`00${n}-ready.md`, fm({ id: `"00${n}"`, title: `Ready ticket ${n}`, status: 'ready' }), good);
    r.write(`01${n}-draft.md`, fm({ id: `"01${n}"`, title: `Draft ticket ${n}`, status: 'draft' }), good);
    r.write(`02${n}-done.md`, fm({ id: `"02${n}"`, title: `Shipped ticket ${n}`, status: 'done' }), good, 'speck/tickets/done');
  }
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage(`http://127.0.0.1:${panel.port}/`);
  try {
    await b.until(`document.querySelectorAll('#queue .q').length >= 40 && document.querySelectorAll('#shipped tr').length >= 5`, 'the board');
    const where = `JSON.stringify(['header', '#tabs'].map(s => Math.round(document.querySelector(s).getBoundingClientRect().top)))`;
    for (const width of [1280, 900, 375, 320]) {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 420, deviceScaleFactor: 1, mobile: width < 700 });
      for (const [lane, list] of [['plan', 'shaping'], ['build', 'queue'], ['shipped', 'shipped-list']]) {
        await b.js(`document.getElementById('tab-${lane}').click(), 1`);
        const before = await b.js(where);
        const sizes = await b.js(`(() => { const l = document.getElementById('${list}'); return { page: document.scrollingElement.scrollHeight, inner: innerHeight, list: l.scrollHeight, box: l.clientHeight }; })()`);
        assert.ok(sizes.page <= sizes.inner, `${width} px, ${lane}: the page is no taller than the window (${JSON.stringify(sizes)})`);
        assert.ok(sizes.list > sizes.box, `${width} px, ${lane}: the list is longer than its box, so it scrolls (${JSON.stringify(sizes)})`);
        await b.js(`document.getElementById('${list}').scrollTop = 200; scrollTo(0, 500); 1`);
        assert.equal(await b.js(`document.getElementById('${list}').scrollTop`), 200, `${width} px, ${lane}: the list scrolled`);
        assert.equal(await b.js('scrollY'), 0, `${width} px, ${lane}: the page didn't`);
        assert.equal(await b.js(where), before, `${width} px, ${lane}: the header and the tabs stayed where they were`);
        await b.js(`document.getElementById('${list}').scrollTop = 0, 1`);
      }
    }
  } finally { await b.close(); await stop(panel); }
});

// ---------- AC3 ----------

test('0410 AC3: the open tab, and each lane\'s scroll position, stay as they were through the refresh', async () => {
  const p = livePage(board());
  await p.settle();
  click(p.byId(TAB.plan));
  p.byId('shaping').scrollTop = 120;
  click(p.byId(TAB.shipped));
  p.byId('shipped-list').scrollTop = 80;
  p.byId('queue').scrollTop = 40;
  p.set(board({ '0003': { title: 'Queued one, renamed' } }));
  await refresh(p);
  await refresh(p);
  openIs(p, 'shipped', 'after two refreshes');
  assert.deepEqual(['shaping', 'queue', 'shipped-list'].map(id => p.byId(id).scrollTop), [120, 40, 80]);
});

test('0410 AC3: a lane\'s list is where it was when its tab opens again', async () => {
  const p = livePage(board());
  await p.settle();
  p.byId('queue').scrollTop = 300;
  click(p.byId(TAB.plan));
  p.byId('queue').scrollTop = 0; // as a browser drops the scroll position of a list it stops showing
  await refresh(p);
  click(p.byId(TAB.build));
  assert.equal(p.byId('queue').scrollTop, 300);
});

test('0410 AC3: in a real browser, the open lane\'s list keeps its scroll position through a refresh that changes the board', skip, async () => {
  const r = panelRepo();
  for (let n = 10; n < 50; n++) r.write(`00${n}-ready.md`, fm({ id: `"00${n}"`, title: `Ready ticket ${n}`, status: 'ready' }), good);
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage(`http://127.0.0.1:${panel.port}/`);
  try {
    await b.until(`document.querySelectorAll('#queue .q').length >= 40`, 'the board');
    await b.js(`document.getElementById('queue').scrollTop = 250, 1`);
    r.write('0030-ready.md', fm({ id: '"0030"', title: 'Renamed while scrolled', status: 'ready' }), good);
    await b.until(`document.getElementById('queue').textContent.includes('Renamed while scrolled')`, 'the refresh');
    assert.equal(await b.js(`document.getElementById('queue').scrollTop`), 250);
    assert.equal(await b.js(`document.getElementById('build-section').hidden`), false, 'Build is still open');
    // Self-check: while the full ticket covers the page, the tabs can't be reached or pressed, as the rest of the page can't.
    await b.js(`document.querySelector('#queue .q .top').click(), 1`);
    await b.js(`[...document.querySelectorAll('#queue .q.open button')].find(x => x.textContent === 'Full ticket').click(), 1`);
    await b.until(`!document.getElementById('full-ticket').hidden`, 'the full ticket');
    assert.equal(await b.js(`document.getElementById('tabs').inert`), true, 'the tab row is inert under the pane');
  } finally { await b.close(); await stop(panel); }
});

// ---------- AC4 ----------

test('0410 AC4: with Plan or Shipped open and the Foreman reading "Needs you <n>", the Build tab says "<n> needs you"', async () => {
  const needs = { word: 'Needs you 2', tone: 'bad' };
  const p = livePage(board({ foreman: needs }));
  await p.settle();
  assert.equal(p.byId('build-needs').textContent, '', 'Build open: nothing extra');
  click(p.byId(TAB.plan));
  assert.equal(p.byId('build-needs').textContent, '2 needs you', 'Plan open');
  click(p.byId(TAB.shipped));
  assert.equal(p.byId('build-needs').textContent, '2 needs you', 'Shipped open');
  for (const word of ['Building', 'Idle', 'Off', 'Needs you', 'Needs you soon', 'Blocked 2']) {
    p.set(board({ foreman: { word, tone: 'idle' } }));
    await refresh(p);
    assert.equal(p.byId('build-needs').textContent, '', `"${word}": nothing extra`);
  }
  p.set(board({ foreman: { word: 'Needs you 11', tone: 'bad' } }));
  await refresh(p);
  assert.equal(p.byId('build-needs').textContent, '11 needs you', 'and it follows the count');
  click(p.byId(TAB.build));
  assert.equal(p.byId('build-needs').textContent, '', 'gone once Build opens');
});

test('0410 AC4 (review F1): going to a ticket in Plan, or the focus going back there, puts "<n> needs you" on Build straight away', async () => {
  const p = livePage(board({ foreman: { word: 'Needs you 2', tone: 'bad' } }));
  await p.settle();
  const waiting = queueRows(p).find(n => idOf(p, n) === '0002');
  p.press(gotoIn(p, waiting, '0001'));
  openIs(p, 'plan', 'after going to a Plan ticket');
  assert.equal(p.byId('build-needs').textContent, '2 needs you', 'before any refresh');
  // Back to Build through a link, then opened from Build and closed once it's back in Plan.
  p.press(gotoIn(p, items(p).find(n => idOf(p, n) === '0001'), '0002'));
  assert.equal(p.byId('build-needs').textContent, '', 'Build open again');
  const row = queueRows(p).find(n => idOf(p, n) === '0003');
  click(row.children.find(n => n.className === 'top'));
  await p.settle();
  click(p.all(queueRows(p).find(n => idOf(p, n) === '0003')).find(n => n.tagName === 'button' && n.textContent === 'Full ticket'));
  p.set(board({ '0003': { status: 'draft' }, foreman: { word: 'Needs you 2', tone: 'bad' } }));
  await refresh(p);
  click(top(items(p).find(n => idOf(p, n) === '0003')));
  await p.settle();
  p.key('Escape');
  openIs(p, 'plan', 'after the focus went back to Plan');
  assert.equal(p.byId('build-needs').textContent, '2 needs you');
});

// ---------- AC5 ----------

const idOf = (p, n) => p.all(n).find(x => x.className === 'id')._text;
const gotoIn = (p, n, id) => p.all(n).find(x => /\bgoto\b/.test(x.className || '') && x.textContent === id);

test('0410 AC5: "Go to ticket" opens the tab holding the ticket, then scrolls to it and lights it', async () => {
  let opened = null;
  const p = livePage(board());
  await p.settle();
  const row = items(p).find(n => idOf(p, n) === '0001');
  row.scrollIntoView = () => { opened = showing(p); };
  const waiting = queueRows(p).find(n => idOf(p, n) === '0002');
  p.press(gotoIn(p, waiting, '0001'));
  assert.deepEqual(opened, ['plan'], 'Plan was open when it scrolled to the ticket');
  openIs(p, 'plan', 'after going to a Plan ticket');
  assert.match(row.className, /\bflash\b/, 'and it is lit');
});

test('0410 AC5: going to a Build ticket from another tab opens Build', async () => {
  const p = livePage(board());
  await p.settle();
  click(p.byId(TAB.shipped));
  const unlocks = items(p).find(n => idOf(p, n) === '0001');
  // 0001 unlocks 0002, so its note links to it; press it as a hidden lane's button can't be, straight through goTo
  const link = gotoIn(p, unlocks, '0002');
  assert.ok(link, 'the Plan ticket links to the Build ticket it unlocks');
  let opened = null;
  queueRows(p).find(n => idOf(p, n) === '0002').scrollIntoView = () => { opened = showing(p); };
  p.press(link);
  assert.deepEqual(opened, ['build']);
  openIs(p, 'build', 'after going to a Build ticket');
});

test('0410 AC5: closing the full ticket opens the tab holding where the focus goes back to, before focusing it', async () => {
  const seen = [];
  const p = livePage(board(), n => { if (n !== p.byId('full-ticket')) seen.push([n, showing(p)]); });
  await p.settle();
  // Opened from Build, and the ticket has gone back to Plan since: the focus goes to its Full ticket button there.
  const row = queueRows(p).find(n => idOf(p, n) === '0003');
  click(row.children.find(n => n.className === 'top'));
  await p.settle();
  click(p.all(queueRows(p).find(n => idOf(p, n) === '0003')).find(n => n.tagName === 'button' && n.textContent === 'Full ticket'));
  p.set(board({ '0003': { status: 'draft' } }));
  await refresh(p);
  click(top(items(p).find(n => idOf(p, n) === '0003')));
  await p.settle();
  p.key('Escape');
  const [to, lanes] = seen.at(-1);
  assert.equal(to.textContent, 'Full ticket', 'the focus is on its Full ticket button');
  assert.deepEqual(lanes, ['plan'], 'with Plan open as it took the focus');
  openIs(p, 'plan', 'after closing');
});

test('0410 AC5: when the ticket has left the board, the tab of the section the focus goes to opens', async () => {
  const seen = [];
  const p = livePage(board(), n => { if (n !== p.byId('full-ticket')) seen.push([n, showing(p)]); });
  await p.settle();
  click(top(items(p).find(n => idOf(p, n) === '0001')));
  await p.settle();
  click(p.all(items(p).find(n => idOf(p, n) === '0001')).find(n => n.tagName === 'button' && n.textContent === 'Full ticket'));
  click(p.byId(TAB.shipped)); // as a click behind the pane can't, but the state could have it so
  p.set(board({ '0001': { status: 'done', started: at(9), finished: at(10), rounds: [round(1, 100)] } }));
  await refresh(p);
  p.key('Escape');
  const [to, lanes] = seen.at(-1);
  assert.equal(to, p.byId('shaping-section'), 'the top of Plan');
  assert.deepEqual(lanes, ['plan']);
});
