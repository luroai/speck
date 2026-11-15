import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import test from 'node:test';
import assert from 'node:assert/strict';
import { panelBoard } from '../scripts/board-feed.mjs';
import { T, round, fakePage, click, shippedRows, stoppedClock, panelRepo, freePort, startPanel, stop, browserPage, findChrome, openLane } from './support/panel.mjs';

// ---------- 0694: Shipped's By model table, and what built a shipped ticket ----------

const NOW = new Date(2026, 10, 15, 12, 0).getTime();
const ago = s => new Date(NOW - s * 1000).toISOString();
const show = async tickets => { const p = fakePage([{ run: { on: false }, tickets, ideas: [] }], { Date: stoppedClock(NOW) }); await p.settle(); return p; };
const byClass = (p, n, cls) => p.all(n).filter(c => String(c.className || '').split(' ').includes(cls));
const one = (p, n, cls) => byClass(p, n, cls)[0];
const of = (p, n, tag) => p.all(n).filter(c => c.tagName === tag);
const sentBack = n => ({ ...round(n, 500), verdict: 'changes_requested' });
const model = (name, cost) => ({ model: name, tokens: { input: 1, cached: 0, write: 0, output: 1 }, cost_usd: cost });
// A shipped ticket that took `min` minutes, with `rounds` and its builder's models and cost.
const shipped = (id, min, models, o = {}) => T(id, 'done', { started: ago(600 + min * 60), finished: ago(600), rounds: [round(1, 500)], builder_models: models,
  builder_cost_usd: models.reduce((n, m) => n + (m.cost_usd ?? 0), 0) || null, ...o });
// The table's rows as text, one array of cells a row, heading row first.
const table = p => of(p, p.byId('shipped-models'), 'tr').map(r => r.children.map(c => c.textContent));

test('0694 AC1: Shipped has a By model table under its figures, a row per builder model with its tickets, median minutes, rounds, first-round share and builder cost', async () => {
  const p = await show([
    shipped('0801', 10, [model('claude-opus-5-5', 4)]),
    shipped('0802', 20, [model('claude-opus-5-5', 6)], { rounds: [sentBack(1), round(2, 500)] }),
    shipped('0803', 40, [model('claude-opus-5-5', 8)], { rounds: [sentBack(1), round(2, 500), round(3, 500)] }),
    shipped('0804', 5, [model('claude-sonnet-5-5', 0.5)]),
  ]);
  const box = p.byId('shipped-models');
  assert.equal(box.hidden, false);
  assert.equal(one(p, box, 'by-model-head').textContent, 'By model');
  assert.deepEqual(table(p).map(r => r.length), [6, 6, 6]);
  const [, opus, sonnet] = table(p);
  assert.equal(opus[0], 'claude-opus-5-5');
  assert.match(opus[1], /^3/);
  assert.deepEqual(opus.slice(2), ['20', '2', '33%', '$6.00']);
  assert.equal(sonnet[0], 'claude-sonnet-5-5');
  assert.deepEqual(sonnet.slice(2), ['5', '1', '100%', '$0.50']);
});

test('0694 AC1: its rows count the tickets the figures count, so one whose ship is still running is left out', async () => {
  const p = await show([shipped('0801', 10, [model('claude-opus-5-5', 4)]), shipped('0802', 10, [model('claude-opus-5-5', 4)], { ship: { running: true } })]);
  assert.match(table(p)[1][1], /^1/);
});

test('0694 AC1: a figure a model\'s tickets have nothing for is a dash, and with nothing shipped there is no table', async () => {
  const p = await show([T('0801', 'done', { builder_models: [model('claude-opus-5-5', null)] })]);
  assert.deepEqual(table(p)[1].slice(2), ['–', '–', '–', '–']);
  const none = await show([]);
  assert.equal(none.byId('shipped-models').hidden, true);
});

test('0694 AC2: a ticket counts under the model that cost most across its builds, and one with none recorded under Unknown, last', async () => {
  const p = await show([
    shipped('0801', 10, [model('claude-sonnet-5-5', 1), model('claude-opus-5-5', 3)]),
    shipped('0802', 10, []),
    shipped('0803', 10, [model(null, 2)]), // as speck spend --by=model: unknown model
    shipped('0804', 10, [model('gpt-6.1-sol', 2)]),
  ]);
  assert.deepEqual(table(p).slice(1).map(r => [r[0], r[1].match(/^\d+/)[0]]), [['claude-opus-5-5', '1'], ['gpt-6.1-sol', '1'], ['Unknown', '2']]);
});

test('0694 AC2: there is no Unknown row when every ticket has a model, even one cut down to its Shipped figures by the board', async () => {
  const stamp = i => new Date(NOW - i * 60000).toISOString();
  const tickets = Array.from({ length: 12 }, (_, i) => T(`08${String(i).padStart(2, '0')}`, 'done', { started: stamp(i + 10), finished: stamp(i), rounds: [round(1, 500)], builder_models: [model(i % 2 ? 'claude-opus-5-5' : 'claude-sonnet-5-5', 1)] }));
  const cut = panelBoard({ tickets }).tickets;
  assert.deepEqual(cut[11].builder_models, [{ model: 'claude-opus-5-5', cost_usd: 1 }], 'the board keeps an older ticket\'s models and their costs');
  const p = await show(cut);
  assert.deepEqual(table(p).slice(1).map(r => r[0]), ['claude-opus-5-5', 'claude-sonnet-5-5']);
});

test('0694 AC3: a row with fewer than 5 tickets says few tickets beside its count, and one with 5 does not', async () => {
  const p = await show([
    ...['0801', '0802', '0803', '0804', '0805'].map(id => shipped(id, 10, [model('claude-opus-5-5', 1)])),
    ...['0806', '0807'].map(id => shipped(id, 10, [model('claude-sonnet-5-5', 1)])),
  ]);
  const rows = of(p, p.byId('shipped-models'), 'tr').slice(1);
  assert.equal(rows[0].children[1].textContent, '5');
  assert.equal(byClass(p, rows[0], 'few').length, 0);
  assert.equal(one(p, rows[1], 'few').textContent, 'few tickets');
  assert.equal(rows[1].children[1].textContent, '2few tickets');
});

const openFull = async (p, id) => { click(shippedRows(p).find(r => one(p, r, 'id').textContent === id)); await p.settle(); return p.byId('full-ticket'); };
const fact = (p, full, label) => { const f = byClass(p, full, 'fact').find(c => c.children[0].textContent === label); return f ? f.children[1].textContent : null; };

test('0694 AC4: a shipped ticket\'s full view has a Built with fact naming the models its builds ran on', async () => {
  const p = await show([shipped('0801', 10, [model('claude-opus-5-5', 3), model('claude-sonnet-5-5', 1), model(null, 1)])]);
  assert.equal(fact(p, await openFull(p, '0801'), 'Built with'), 'claude-opus-5-5, claude-sonnet-5-5');
});

test('0694 AC4: one with no recorded model says Not recorded', async () => {
  const p = await show([shipped('0801', 10, []), shipped('0802', 10, [model(null, 1)])]);
  assert.equal(fact(p, await openFull(p, '0801'), 'Built with'), 'Not recorded');
  const q = await show([shipped('0802', 10, [model(null, 1)])]);
  assert.equal(fact(q, await openFull(q, '0802'), 'Built with'), 'Not recorded');
});

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
test('0694 AC5: at 375 px wide the By model table fits the lane with no horizontal scroll', skip, async () => {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  const stamp = new Date().toISOString();
  const LONG = 'a-builder-model-with-a-very-long-name-indeed-5-5';
  const tickets = [['0801', 'claude-opus-5-5'], ['0802', 'claude-sonnet-5-5'], ['0803', LONG], ['0804', null]].map(([id, m]) =>
    T(id, 'done', { started: stamp, finished: stamp, rounds: [round(1, 500)], builder_cost_usd: 123.45, builder_models: m ? [{ model: m, cost_usd: 123.45 }] : [] }));
  const state = { run: { on: false }, ideas: [], tickets };
  const stub = `(() => { const real = window.fetch.bind(window); window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? new Response(${JSON.stringify(JSON.stringify(state))}, { status: 200, headers: { 'content-type': 'application/json' } }) : real(url, opts); })();`;
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 800, deviceScaleFactor: 1, mobile: true });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.querySelectorAll('#shipped-models tr').length === 5`, 'the table');
    await b.js(openLane('shipped'));
    await b.until(`!document.getElementById('shipped-section').hidden`, 'the lane');
    const fit = await b.js(`(() => { const box = document.getElementById('shipped-models'), t = box.querySelector('table'), lane = document.getElementById('shipped-list');
      return { right: t.getBoundingClientRect().right, laneRight: lane.getBoundingClientRect().right, scroll: lane.scrollWidth - lane.clientWidth, page: document.documentElement.scrollWidth,
        cells: [...t.querySelectorAll('th, td')].filter(c => c.scrollWidth > c.clientWidth + 0.5).map(c => c.textContent) }; })()`);
    assert.ok(fit.right <= fit.laneRight + 0.5, `the table ends at ${fit.right} px, the lane at ${fit.laneRight} px`);
    assert.ok(fit.scroll <= 0.5, `the lane scrolls ${fit.scroll} px sideways`);
    assert.ok(fit.page <= 375, `the page is ${fit.page} px wide`);
    assert.deepEqual(fit.cells, [], 'no cell spills out of its column');
  } finally { await b.close(); await stop(panel); }
});
