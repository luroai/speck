import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakePage, full, round, click, page, styles, panelRepo, fm, good, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';
import { lane, slidingPage, swipe } from './support/lanes.mjs';

// ---------- 0582: the lanes as four tabs with their counts ----------

const TAB = { capture: 'tab-capture', plan: 'tab-plan', build: 'tab-build', shipped: 'tab-shipped' };
const NAME = { capture: 'Capture', plan: 'Plan', build: 'Build', shipped: 'Shipped' };
const at = h => new Date(Date.UTC(2026, 9, 9, h)).toISOString();
const note = n => ({ path: `speck/ideas/2026-10-0${n}-note.md`, title: `Note ${n}`, status: 'inbox', body: `# Note ${n}\n\nCaptured: 2026-10-0${n} · Status: inbox\n` });
const shipped = id => full(id, { status: 'done', title: `Shipped ${id}`, started: at(7), finished: at(8), rounds: [round(1, 100)] });
const board = () => ({
  ideas: [note(1), note(2), note(3)],
  tickets: [full('0001', { title: 'A draft' }), full('0002', { title: 'Another draft' }),
    full('0003', { status: 'ready', title: 'Queued' }), full('0004', { status: 'building', title: 'Flying', started: at(6) }),
    full('0005', { status: 'blocked', title: 'Stuck', started: at(6) }), full('0006', { status: 'ready', title: 'Queued too' }),
    shipped('0007')],
});
// A fake page whose /api/state answers with `p.state` at that moment.
function livePage(s) {
  const box = { state: s };
  const p = fakePage([], { fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify(box.state))) }) });
  p.set = next => { box.state = next; };
  return p;
}
const refresh = async p => { p.timers.shift()(); await p.settle(); };
const started = async s => { const p = livePage(s); await p.settle(); return p; };
const counts = p => Object.fromEntries(Object.entries(TAB).map(([l, t]) => [l, p.byId(`${t}-n`).textContent]));
const label = (p, l) => (p.byId(TAB[l]).attrs || {})['aria-label'];
const nav = () => page().match(/<nav [^>]*id="tabs"[^>]*>[\s\S]*?<\/nav>/)[0];
const decls = sel => [...styles().replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^}]*)\}/g)].filter(m => m[1].split(',').map(s => s.trim()).includes(sel)).map(m => m[2]).join(';');

// ---------- AC1 ----------

test('0582 AC1: four tabs in order, each with its lane\'s name and a place for its count, after the bar', () => {
  const html = page();
  assert.ok(html.indexOf('</header>') < html.indexOf('id="tabs"'), 'the tabs are under the bar');
  assert.deepEqual([...nav().matchAll(/<button [^>]*id="(tab-[a-z]+)"[^>]*><span class="tab-name">([^<]+)<\/span><span class="tab-n" id="(tab-[a-z]+-n)"><\/span>/g)].map(m => m.slice(1)),
    Object.keys(TAB).map(l => [TAB[l], NAME[l], `${TAB[l]}-n`]));
});

test('0582 AC1: each tab shows how many its lane holds', async () => {
  const p = await started(board());
  assert.deepEqual(counts(p), { capture: '3', plan: '2', build: '4', shipped: '1' });
});

test('0582 AC1: an empty lane says 0, and nothing is shown before the first board', async () => {
  const p = livePage({ ideas: [], tickets: [] });
  assert.deepEqual(counts(p), { capture: '', plan: '', build: '', shipped: '' }, 'before the first board');
  await p.settle();
  assert.deepEqual(counts(p), { capture: '0', plan: '0', build: '0', shipped: '0' });
});

test('0582 AC1: the open tab is underlined in the accent and its name in the text colour; the others are muted with no underline showing', () => {
  assert.match(decls('.tab[aria-selected="true"]'), /color:\s*var\(--text\)/);
  assert.match(decls('.tab[aria-selected="true"]'), /border-bottom-color:\s*var\(--blue\)/);
  assert.match(decls('.tab'), /(^|;|\s)color:\s*var\(--muted\)/);
  assert.match(decls('.tab'), /border-bottom:\s*2px solid transparent/);
});

test('0582 AC1: each tab is at least 44 px tall, in a strip that holds it', () => {
  assert.match(decls('.tab'), /min-height:\s*44px/);
  assert.doesNotMatch(decls('.tabs'), /(^|;|\s)height:/, 'no fixed height that the tabs would stick out of');
});

test('0582 AC1: in a real browser at 320 px, with big counts, each name is whole and each tab at least 44 px tall', { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' }, async () => {
  const r = panelRepo();
  r.write('0010-ready.md', fm({ id: '"0010"', title: 'Ready ticket', status: 'ready' }), good);
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage(`http://127.0.0.1:${panel.port}/`);
  try {
    await b.until(`(document.getElementById('tab-build-n')?.textContent || '') !== ''`, 'the counts');
    await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 700, deviceScaleFactor: 1, mobile: true });
    // Kept at these whenever the page draws them again
    await b.js(`(() => { for (const [id, v] of [['tab-capture-n', '22'], ['tab-plan-n', '14'], ['tab-build-n', '11'], ['tab-shipped-n', '570']]) {
      const n = document.getElementById(id), put = () => { if (n.textContent !== v) n.textContent = v; };
      put(); new MutationObserver(put).observe(n, { childList: true, characterData: true, subtree: true }); } return 1; })()`);
    const tabs = await b.js(`[...document.querySelectorAll('#tabs [role="tab"]')].map(t => { const n = t.querySelector('.tab-name'); return { id: t.id, height: t.getBoundingClientRect().height, cut: n.scrollWidth > n.clientWidth }; })`);
    assert.equal(tabs.length, 4);
    for (const t of tabs) {
      assert.ok(t.height >= 44, `${t.id}: ${t.height} px tall`);
      assert.equal(t.cut, false, `${t.id}: its name is whole`);
    }
    assert.equal(await b.js(`document.getElementById('tabs').scrollWidth <= document.getElementById('tabs').clientWidth`), true, 'nothing sticks out of the row');
  } finally { b.close(); await stop(panel); }
});

// ---------- AC2 ----------

test('0582 AC2: pressing a tab opens its lane and moves the selection to it', async () => {
  const p = await started(board());
  for (const l of ['capture', 'shipped', 'plan', 'build']) {
    click(p.byId(TAB[l]));
    await p.settle();
    assert.equal(lane(p), l);
  }
});

test('0582 AC2: a swipe, the trackpad and the arrow keys still change lane, moving the selection with them', async () => {
  const p = await slidingPage();
  p.touch([[200, 300], [215, 300], [230, 300], [245, 300]]);
  assert.equal(lane(p), 'plan', 'a flick');
  await p.rest();
  p.scroll(swipe(), { pause: 400 });
  assert.equal(lane(p), 'build', 'the trackpad');
  await p.rest();
  p.document.listeners.keydown({ key: 'ArrowRight', target: { tagName: 'BODY' }, preventDefault() {} });
  assert.equal(lane(p), 'shipped', 'an arrow key on the page');
  await p.rest();
  p.byId(TAB.shipped).listeners.keydown({ key: 'ArrowLeft', preventDefault() {} });
  assert.equal(lane(p), 'build', 'an arrow key on a tab');
});

// ---------- AC3 ----------

test('0582 AC3: the tabs are a tab list, and only the open one is selected', async () => {
  assert.match(nav(), /<nav [^>]*role="tablist"/);
  assert.equal([...nav().matchAll(/<button [^>]*role="tab"/g)].length, 4);
  const p = await started(board());
  click(p.byId(TAB.plan));
  await p.settle();
  assert.deepEqual(Object.keys(TAB).map(l => p.byId(TAB[l]).attrs['aria-selected']), ['false', 'true', 'false', 'false']);
});

test('0582 AC3: each tab\'s name to a screen reader has its lane and its count, in words', async () => {
  const p = await started(board());
  assert.equal(label(p, 'capture'), 'Capture, 3 notes');
  assert.equal(label(p, 'plan'), 'Plan, 2 tickets');
  assert.equal(label(p, 'build'), 'Build, 4 tickets');
  assert.equal(label(p, 'shipped'), 'Shipped, 1 ticket');
});

test('0582 AC3: Build\'s name is its name and count, whatever needs you (0609)', async () => {
  const p = await started({ ...board(), foreman: { word: 'Needs you 2', tone: 'idle' } });
  assert.equal(label(p, 'build'), 'Build, 4 tickets');
});

// ---------- AC4 ----------

test('0582 AC4: the counts change as the board does', async () => {
  const p = await started(board());
  assert.deepEqual(counts(p), { capture: '3', plan: '2', build: '4', shipped: '1' });
  const b = board();
  b.ideas.pop();
  b.tickets = b.tickets.filter(t => t.id !== '0001' && t.id !== '0003').concat(shipped('0008'), shipped('0009'));
  p.set(b);
  await refresh(p);
  assert.deepEqual(counts(p), { capture: '2', plan: '1', build: '3', shipped: '3' });
  assert.equal(label(p, 'shipped'), 'Shipped, 3 tickets');
});

test('0582 AC4: opening a lane leaves the counts as they were', async () => {
  const p = await started(board());
  click(p.byId(TAB.shipped));
  await p.settle();
  assert.deepEqual(counts(p), { capture: '3', plan: '2', build: '4', shipped: '1' });
});
