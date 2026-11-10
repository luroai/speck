import './support/tmp.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { panelBoard } from '../scripts/board-feed.mjs';
import { T, round, fakePage, click, shippedRows, stoppedClock, panelRepo, freePort, startPanel, stop, browserPage, openLane } from './support/panel.mjs';

// Midday local time, so "today" covers what shipped minutes ago.
const NOW = new Date(2026, 9, 28, 12, 0).getTime();
const ago = s => new Date(NOW - s * 1000).toISOString();
const show = async (tickets, states) => { const p = fakePage(states || [{ run: { on: false }, tickets, ideas: [] }], { Date: stoppedClock(NOW) }); await p.settle(); return p; };
const byClass = (p, n, cls) => p.all(n).filter(c => String(c.className || '').split(' ').includes(cls));
const one = (p, n, cls) => byClass(p, n, cls)[0];
const rowOf = (p, id) => shippedRows(p).find(r => one(p, r, 'id').textContent === id);
const sentBack = n => ({ ...round(n, 500), verdict: 'changes_requested' });
const shippedAt = (id, o = {}) => T(id, 'done', { started: ago(1500), finished: ago(600), rounds: [round(1, 500)], ...o });

test('0587 AC1: Shipped opens with three tiles: median build time, median review rounds and the share approved in the first round', async () => {
  const p = await show([
    shippedAt('0701', { started: ago(1800), finished: ago(600), rounds: [round(1, 500)] }), // 20 min
    shippedAt('0702', { started: ago(1200), finished: ago(600), rounds: [round(1, 500)] }), // 10 min
    shippedAt('0703', { started: ago(2400), finished: ago(600), rounds: [sentBack(1), round(2, 500), round(3, 500)] }), // 30 min
  ]);
  const shown = p.byId('shipped-stats');
  assert.equal(shown.hidden, false);
  assert.deepEqual(shown.children.map(c => c.className), ['stat', 'stat', 'stat']);
  assert.deepEqual(shown.children.map(c => one(p, c, 'num').textContent), ['20 min', '1', '67%']);
  assert.deepEqual(shown.children.map(c => one(p, c, 'label').textContent), ['median build time', 'median review rounds', 'approved first round']);
  assert.deepEqual(shown.children.map(c => one(p, c, 'count').textContent), ['3 tickets', '3 tickets', '3 tickets']);
});

test('0587 AC1: the first-round share counts the tickets the median rounds does, so one with no review rounds is left out', async () => {
  const p = await show([shippedAt('0701', { rounds: [round(1, 500)] }), shippedAt('0702', { rounds: [sentBack(1), round(2, 500)] }), shippedAt('0703', { rounds: [] })]);
  const share = p.byId('shipped-stats').children[2];
  assert.equal(one(p, share, 'num').textContent, '50%');
  assert.equal(one(p, share, 'count').textContent, '2 tickets');
});

test('0587 AC1: a ticket approved in its first round still counts when merge rounds follow, and one sent back does not', async () => {
  const p = await show([shippedAt('0701', { rounds: [round(1, 500), round(2, 500), round(3, 500)] }), shippedAt('0702', { rounds: [sentBack(1), round(2, 500)] })]);
  assert.equal(one(p, p.byId('shipped-stats').children[2], 'num').textContent, '50%');
});

test('0587 AC1: the board keeps whether the first round approved an older ticket when it cuts its rounds down', () => {
  const stamp = i => new Date(NOW - i * 60000).toISOString();
  const tickets = Array.from({ length: 12 }, (_, i) => T(`07${String(i).padStart(2, '0')}`, 'done', { finished: stamp(i), rounds: i === 11 ? [sentBack(1), round(2, 500)] : i === 10 ? [round(1, 500), round(2, 500)] : [round(1, 500)] }));
  const cut = panelBoard({ tickets }).tickets.slice(10).map(t => t.review_total);
  assert.deepEqual(cut, [{ rounds: 2, tokens: 1000, first_approved: true }, { rounds: 2, tokens: 1000, first_approved: false }]);
});

test('0587 AC1: a ticket cut down to its Shipped figures counts by what its total says of the first round', async () => {
  const p = await show([shippedAt('0701', { rounds: undefined, review_total: { rounds: 3, tokens: 500, first_approved: true } }), shippedAt('0702', { rounds: undefined, review_total: { rounds: 2, tokens: 500, first_approved: false } })]);
  assert.equal(one(p, p.byId('shipped-stats').children[2], 'num').textContent, '50%');
});

test('0587 AC1: a figure with nothing to work from shows a dash and no unit', async () => {
  const p = await show([T('0701', 'done', { title: 'Nothing at all' })]);
  assert.deepEqual(p.byId('shipped-stats').children.map(c => one(p, c, 'num').textContent), ['–', '–', '–']);
});

test('0587 AC1: with nothing shipped there are no tiles', async () => {
  const p = await show([]);
  assert.equal(p.byId('shipped-stats').hidden, true);
});

test('0587 AC2: a shipped ticket is one row: its id, title, then when it shipped, its rounds and how long it took', async () => {
  const p = await show([shippedAt('0701', { title: 'Show it', finished: new Date(2026, 9, 27, 13, 58).toISOString(), started: new Date(2026, 9, 27, 13, 54).toISOString() })]);
  const row = rowOf(p, '0701');
  assert.deepEqual(row.children.map(c => c.className), ['name', 'sum']);
  assert.equal(one(p, row, 'title').textContent, 'Show it');
  assert.equal(one(p, row, 'meta').textContent, '27 Oct, 13:58 · 1 round · 4 min');
});

test('0587 AC2: the line says the time alone for today, and leaves out what it does not know', async () => {
  const p = await show([shippedAt('0701', { rounds: [round(1, 500), round(2, 500)] }), T('0702', 'done', { finished: ago(120) }), T('0703', 'done', { started: ago(900) })]);
  assert.equal(one(p, rowOf(p, '0701'), 'meta').textContent, '11:50 · 2 rounds · 15 min');
  assert.equal(one(p, rowOf(p, '0702'), 'meta').textContent, '11:58');
  assert.equal(byClass(p, rowOf(p, '0703'), 'meta').length, 0, 'nothing to say, so no line');
});

test('0587 AC2: the row keeps a ticket\'s total cost as its tooltip, out of the line', async () => {
  const p = await show([shippedAt('0701', { total_cost_usd: 2.5 })]);
  const meta = one(p, rowOf(p, '0701'), 'meta');
  assert.doesNotMatch(meta.textContent, /\$/);
  assert.match(meta.title, /\$2\.50/);
});

test('0587 AC2: pressing the row opens its full view, and the row stays one row', async () => {
  const p = await show([shippedAt('0701', { title: 'Show it' })]);
  click(rowOf(p, '0701'));
  await p.settle();
  assert.equal(p.byId('full-ticket').hidden, false);
  assert.match(p.byId('full-ticket').textContent, /Show it/);
  assert.deepEqual(rowOf(p, '0701').children.map(c => c.className), ['name', 'sum']);
  assert.doesNotMatch(rowOf(p, '0701').className, /\bopen\b/);
});

test('0587 AC2: the title opens the full view from the keyboard too', async () => {
  const p = await show([shippedAt('0701', { title: 'Show it' })]);
  const title = one(p, rowOf(p, '0701'), 'title');
  assert.equal(title.tabIndex, 0);
  assert.equal(title.attrs.role, 'button');
  p.press(title);
  await p.settle();
  assert.equal(p.byId('full-ticket').hidden, false);
});

test('0587 AC2: a press that lands on its push warning opens nothing', async () => {
  const p = await show([shippedAt('0701', { ship: { running: false, unpushed: true, message: 'Run git push.' } })]);
  const row = rowOf(p, '0701');
  p.press(one(p, row, 'unpushed-head'));
  await p.settle();
  assert.equal(p.byId('full-ticket').hidden, true, 'not from the warning');
});

test('0587 AC2: a press that ends selecting text in the row opens nothing', async () => {
  const p = fakePage([{ run: { on: false }, tickets: [shippedAt('0701')], ideas: [] }], { Date: stoppedClock(NOW), getSelection: () => ({ isCollapsed: false }) });
  await p.settle();
  click(rowOf(p, '0701'));
  await p.settle();
  assert.equal(p.byId('full-ticket').hidden, true);
});

test('0587 AC2: pressing a bug tag in the row explains the tag and opens nothing', async () => {
  const p = await show([shippedAt('0701', { type: 'bug' })]);
  p.press(one(p, rowOf(p, '0701'), 'bug'));
  await p.settle();
  assert.equal(p.byId('full-ticket').hidden, true);
});

test('0587 AC2: the review pack can still be reached, from the full view', async () => {
  const p = await show([shippedAt('0701')]);
  click(rowOf(p, '0701'));
  await p.settle();
  assert.ok(p.all(p.byId('full-ticket')).some(n => n.tagName === 'button' && n.textContent === 'Review pack'));
});

test('0587 AC2: its full view keeps the ticket\'s own costs and tokens', async () => {
  const p = await show([shippedAt('0701', { builder_tokens: 2000, builder_cost_usd: 1.5, reviewer_cost_usd: 0.25, total_cost_usd: 1.75 })]);
  click(rowOf(p, '0701'));
  await p.settle();
  const text = p.byId('full-ticket').textContent;
  for (const fact of ['Builder cost', '$1.50', 'Reviewer cost', '$0.25', 'Total cost', '$1.75', 'Builder tokens', '2,000', 'Reviewer tokens', '500']) assert.ok(text.includes(fact), `shows ${fact}`);
});

test('0587 AC3: the toggle shows every other figure, costs included, and hides them again', async () => {
  const p = await show([shippedAt('0701', { builder_tokens: 2000, builder_cost_usd: 1.5, total_cost_usd: 2.5, rounds: [round(1, 500)] })]);
  const more = p.byId('more-stats');
  assert.equal(p.byId('shipped-more').hidden, true);
  assert.equal(more.textContent, 'More stats');
  click(more);
  await p.settle();
  assert.equal(p.byId('shipped-more').hidden, false);
  assert.equal(p.byId('more-stats').textContent, 'Fewer stats');
  assert.deepEqual(p.byId('shipped-more').children.map(c => `${one(p, c, 'num').textContent} ${one(p, c, 'label').textContent}`),
    ['1 shipped today', '$1.50 median builder cost', '$2.50 total cost', '500 median reviewer tokens', '2,000 median builder tokens']);
  click(p.byId('more-stats'));
  await p.settle();
  assert.equal(p.byId('shipped-more').hidden, true);
});

test('0587 AC3: total cost is left out when no ticket has one, and says when it is only a floor', async () => {
  const none = await show([shippedAt('0701')]);
  click(none.byId('more-stats'));
  await none.settle();
  assert.doesNotMatch(none.byId('shipped-more').textContent, /total cost/);
  const part = await show([shippedAt('0701', { total_cost_usd: 2.5, total_cost_unknown: ['watch'] })]);
  const tile = part.byId('shipped-more').children.find(c => /total cost/.test(c.textContent));
  assert.match(tile.title, /at least/);
});

test('0587 AC4: at 320 px wide each row is at least 44 px tall, long titles are cut off on one line (0599), and the tiles fit', async () => {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  const LONG = 'A shipped ticket whose title is long enough that it never fits on one line of a narrow phone at all';
  const stamp = new Date().toISOString();
  const state = { run: { on: false }, ideas: [], tickets: [T('0701', 'done', { title: 'Short', started: stamp, finished: stamp, rounds: [round(1, 500)] }), T('0702', 'done', { title: LONG, type: 'bug', started: stamp, finished: stamp, rounds: [round(1, 500)] }), T('0703', 'done', { title: 'Bare' })] };
  const stub = `(() => { const real = window.fetch.bind(window); window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? new Response(${JSON.stringify(JSON.stringify(state))}, { status: 200, headers: { 'content-type': 'application/json' } }) : real(url, opts); })();`;
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 700, deviceScaleFactor: 1, mobile: true });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.querySelectorAll('#shipped tr').length === 3`, 'the rows');
    await b.js(openLane('shipped'));
    await b.until(`!document.getElementById('shipped-section').hidden && document.querySelectorAll('#shipped-stats .stat').length === 3`, 'the tiles');
    const rows = await b.js(`[...document.querySelectorAll('#shipped tr')].map(r => { const t = r.querySelector('.title'), s = getComputedStyle(t), box = r.getBoundingClientRect();
      return { title: t.textContent, height: box.height, right: box.right, nowrap: s.whiteSpace, overflow: t.scrollWidth > t.clientWidth + 0.5, ellipsis: s.textOverflow, titleHeight: t.getBoundingClientRect().height, line: parseFloat(s.lineHeight) }; })`);
    for (const row of rows) { assert.ok(row.height >= 44, `"${row.title}" is ${row.height} px tall`); assert.ok(row.right <= 320.5, `"${row.title}" stays on the screen`); }
    const long = rows.find(x => x.title === LONG);
    assert.equal(long.nowrap, 'nowrap', 'its title stays on one line (0599)');
    assert.equal(long.overflow, true, 'cut off');
    assert.equal(long.ellipsis, 'ellipsis', 'with an ellipsis');
    assert.ok(long.titleHeight <= long.line + 0.5, `on one line (${long.titleHeight} px at ${long.line} px a line)`);
    const fit = await b.js(`[...document.querySelectorAll('#shipped-stats .stat')].map(s => ({ right: s.getBoundingClientRect().right, over: s.scrollWidth > s.clientWidth + 0.5 }))`);
    for (const tile of fit) { assert.ok(tile.right <= 320.5); assert.equal(tile.over, false, 'its text fits the tile'); }
  } finally { await b.close(); await stop(panel); }
});
