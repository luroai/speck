import './support/tmp.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { T, boardPage, fakePage, click, queueRows, styles, panelRepo, freePort, startPanel, stop, browserPage } from './support/panel.mjs';

const NOW = Date.now();
const ago = s => new Date(NOW - s * 1000).toISOString();
const STARTED = { started: ago(18 * 60 + 5), build_running: true };
const board = (tickets, extra = {}) => ({ run: { on: true }, ideas: [], tickets, ...extra });
const show = async (b, globals) => { const p = boardPage([b], { getSelection: () => ({ isCollapsed: true, rangeCount: 0 }), ...globals }); await p.settle(); return p; };
// What Build lists, top to bottom: a group's head as its text, a row as its id.
const listed = p => p.byId('queue').children.map(n => (/\bq\b/.test(n.className) ? p.all(n).find(c => c.className === 'id')._text : n.textContent));
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).find(c => c.className === 'id')._text === id);
const whereOf = (p, id) => p.all(rowOf(p, id)).find(c => /^where\b/.test(c.className));
const asking = (...ids) => ({ foreman: { agent: { asks: ids.map(id => ({ id, question: 'Which one?' })) } } });

test('0585 AC1: three groups, each headed with its count, in the order Needs you, Building, Queued', async () => {
  const p = await show(board([
    T('0701', 'building', STARTED),
    T('0702', 'reviewing', { ...STARTED, review_running: 1 }),
    T('0703', 'blocked', { ...STARTED, blocked_question: 'A or B?' }),
    T('0704', 'approved', { ...STARTED, auto_ship: false }),
    T('0705', 'ready'),
  ]));
  assert.deepEqual(listed(p), ['Needs you 2', '0703', '0704', 'Building 2', '0701', '0702', 'Queued 1', '0705']);
});

test('0585 AC1: a group with nothing in it is left out', async () => {
  const p = await show(board([T('0701', 'building', STARTED)]));
  assert.deepEqual(listed(p), ['Building 1', '0701']);
});

test('0585 AC1: an engineering manager\'s question puts a ticket under Needs you, whatever its status', async () => {
  const p = await show(board([T('0701', 'ready'), T('0702', 'building', STARTED)], asking('0701', '0702')));
  assert.deepEqual(listed(p), ['Needs you 2', '0702', '0701']);
});

test('0585 AC1: a blocked ticket the manager will answer is not waiting for you', async () => {
  const p = await show(board([T('0701', 'blocked', { ...STARTED, blocked_question: 'A or B?', foreman_will: true })]));
  assert.deepEqual(listed(p), ['Building 1', '0701']);
});

test('0585 AC1: an approved ticket speck run will ship is not waiting for you, and one it will not ship is', async () => {
  const on = await show(board([T('0701', 'approved', { ...STARTED, auto_ship: true, build_exit: { code: 0, at: ago(5) } })]));
  assert.deepEqual(listed(on), ['Building 1', '0701']);
  const off = await show({ ...board([T('0701', 'approved', { ...STARTED, auto_ship: true })]), run: { on: false } });
  assert.deepEqual(listed(off), ['Needs you 1', '0701']);
});

test('0585 AC1: a ticket that is shipping is under Building', async () => {
  const p = await show(board([T('0701', 'approved', { ...STARTED, auto_ship: false, ship: { running: true, started: ago(5) } })]));
  assert.deepEqual(listed(p), ['Building 1', '0701']);
});

test('0585 AC2: a row is its id in the mono font, its title and one line saying where it is', async () => {
  const p = await show(board([T('0701', 'reviewing', { ...STARTED, review_running: 2, title: 'Show it' })]));
  const row = rowOf(p, '0701'), id = p.all(row).find(c => c.className === 'id');
  assert.equal(id._text, '0701');
  assert.equal(p.all(row).find(c => c.className === 'title').textContent, 'Show it');
  assert.equal(whereOf(p, '0701').textContent, 'Reviewing · round 2 · 18 min');
  assert.match(styles(), /code, \.mono, \.id \{ font-family: var\(--font-mono\); \}/);
});

test('0585 AC2: a ready ticket says it is ready, and what it waits on', async () => {
  const p = await show(board([T('0701', 'ready', { waiting_on: ['0557'], after: ['0557'] }), T('0702', 'ready')]));
  assert.equal(whereOf(p, '0701').textContent, 'Ready · after 0557');
  assert.equal(whereOf(p, '0702').textContent, 'Ready');
});

test('0585 AC2: the dot is orange for needs you, blue while it\'s worked on and grey while it waits', async () => {
  const p = await show(board([
    T('0701', 'blocked', { ...STARTED, blocked_question: 'A or B?' }),
    T('0702', 'building', STARTED),
    T('0703', 'ready'),
    T('0704', 'building', { ...STARTED, paused: true }),
  ]));
  assert.match(whereOf(p, '0701').className, /\bneeds\b/);
  assert.match(whereOf(p, '0702').className, /\brun\b/);
  assert.match(whereOf(p, '0703').className, /\bwait\b/);
  assert.match(whereOf(p, '0704').className, /\bwait\b/);
  assert.match(styles(), /\.where\.needs::before \{ background: var\(--needs-you\); \}/);
  assert.match(styles(), /\.where\.run::before \{ background: var\(--accent\); \}/);
  assert.match(styles(), /\.where\.wait::before \{ background: var\(--muted\); \}/);
});

test('0585 AC2: the row\'s minutes move on with the clock', async () => {
  let now = NOW;
  const Clock = class extends Date { constructor(...a) { super(...(a.length ? a : [now])); } static now() { return now; } };
  const p = await show(board([T('0701', 'building', STARTED)]), { Date: Clock });
  assert.match(whereOf(p, '0701').textContent, /· 18 min$/);
  now += 2 * 60000;
  [...p.intervals.values()].find(v => v.ms === 1000).fn();
  assert.match(whereOf(p, '0701').textContent, /· 20 min$/);
});

test('0585 AC3: pressing a row opens the ticket\'s full view', async () => {
  const p = await show(board([T('0701', 'building', STARTED)]));
  assert.equal(p.byId('full-ticket').hidden, true);
  click(rowOf(p, '0701').children[0]);
  await p.settle();
  assert.equal(p.byId('full-ticket').hidden, false);
  assert.match(p.byId('full-ticket').textContent, /Ticket 0701/);
});

test('0585 AC3: a row can be pressed from the keyboard', async () => {
  const p = await show(board([T('0701', 'ready')]));
  const top = rowOf(p, '0701').children[0];
  assert.equal(top.tabIndex, 0);
  assert.equal(top.attrs.role, 'button');
  top.listeners.keydown({ key: 'Enter', preventDefault() {}, stopPropagation() {}, currentTarget: top });
  await p.settle();
  assert.equal(p.byId('full-ticket').hidden, false);
});

test('0585 AC3: no live details are left on a row, and pressing it never opens it in the list', async () => {
  const p = await show(board([
    T('0701', 'building', STARTED),
    T('0702', 'blocked', { ...STARTED, blocked_question: 'A or B?' }),
    T('0703', 'ready'),
  ], asking('0703')));
  for (const id of ['0701', '0702', '0703']) {
    click(rowOf(p, id).children[0]);
    await p.settle();
    const row = rowOf(p, id);
    assert.doesNotMatch(row.className, /\bopen\b/);
    const classes = p.all(row).map(n => n.className);
    for (const gone of [/^log\b/, /^lights\b/, /^stop-build\b/, /^go-with\b/, /^foreman-ask\b/, /^track\b/, /^facts\b/, /^full-open\b/, /^back-to-plan\b/, /^question\b/]) assert.ok(!classes.some(c => gone.test(c)), `${id} has no ${gone}`);
    assert.equal(p.all(row).filter(n => n.tagName === 'button').length, 0);
  }
});

test('0585 AC3: Back to Plan, which was on the card, is in a ready ticket\'s full view', async () => {
  const p = fakePage([board([T('0701', 'ready')]), {}], { getSelection: () => ({ isCollapsed: true, rangeCount: 0 }) });
  await p.settle();
  click(rowOf(p, '0701').children[0]);
  await p.settle();
  const b = p.all(p.byId('full-ticket')).find(n => n.className === 'back-to-plan');
  assert.ok(b, 'the full view has it');
  b.listeners.click({ stopPropagation() {} });
  await p.settle();
  assert.ok(p.calls.some(c => /\/api\/tickets\/0701\/draft$/.test(String(c.url)) && c.opts?.method === 'POST'));
});

test('0585 AC4: at 320 px wide a row is at least 44 px tall and a long title is cut off on one line (0599)', async () => {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  const LONG = 'A ticket whose title is long enough that it never fits on one line of a narrow phone at all, however it is set';
  const state = board([T('0701', 'ready', { title: 'Short' }), T('0702', 'building', { ...STARTED, title: LONG })]);
  const stub = `(() => { const real = window.fetch.bind(window); const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
    window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(${JSON.stringify(state)}) : /\\/log$/.test(String(url)) ? json({ text: '' }) : real(url, opts); })();`;
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 700, deviceScaleFactor: 1, mobile: true });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.querySelectorAll('#queue .q').length === 2`, 'the rows');
    await b.send('Runtime.evaluate', { expression: `document.getElementById('tab-build').click()`, awaitPromise: false });
    await b.until(`!document.getElementById('build-section').hidden`, 'Build');
    const m = await b.js(`[...document.querySelectorAll('#queue .q')].map(c => { const t = c.querySelector('.title'), s = getComputedStyle(t), r = c.getBoundingClientRect();
      return { id: c.querySelector('.id').textContent, height: r.height, top: c.firstElementChild.getBoundingClientRect().height, right: r.right, nowrap: s.whiteSpace, overflow: t.scrollWidth > t.clientWidth + 0.5, ellipsis: s.textOverflow, titleHeight: t.getBoundingClientRect().height, line: parseFloat(s.lineHeight) }; })`);
    for (const row of m) assert.ok(row.top >= 44, `${row.id} is ${row.top} px tall`);
    const long = m.find(x => x.id === '0702');
    assert.equal(long.nowrap, 'nowrap', 'its title stays on one line (0599)');
    assert.equal(long.overflow, true, 'cut off');
    assert.equal(long.ellipsis, 'ellipsis', 'with an ellipsis');
    assert.ok(long.titleHeight <= long.line + 0.5, `on one line (${long.titleHeight} px at ${long.line} px a line)`);
    assert.ok(long.right <= 320.5, 'it stays on the screen');
  } finally { await b.close(); await stop(panel); }
});
