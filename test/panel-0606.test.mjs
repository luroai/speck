import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, round, fakePage, click, page, styles, cssRules, cssValue } from './support/panel.mjs';

// ---------- 0606: Shipped's figures, one tidy grid of even tiles ----------

const ago = s => new Date(Date.now() - s * 1000).toISOString();
// Three shipped tickets: all three have a build time and review rounds, two a builder cost and tokens, one a total cost.
const STATE = () => ({ run: { on: false }, ideas: [], tickets: [
  T('0901', 'done', { started: ago(1500), finished: ago(600), rounds: [round(1, 500)], builder_tokens: 2000, builder_cost_usd: 1.5, total_cost_usd: 2.5 }),
  T('0902', 'done', { started: ago(1800), finished: ago(600), rounds: [round(1, 700)], builder_tokens: 4000, builder_cost_usd: 2.5 }),
  T('0903', 'done', { started: ago(2400), finished: ago(600), rounds: [round(1, 900)] }),
] });
const show = async (state = STATE()) => { const p = fakePage([state]); await p.settle(); return p; };
const byClass = (p, n, cls) => p.all(n).filter(c => String(c.className || '').split(' ').includes(cls));
const one = (p, n, cls) => byClass(p, n, cls)[0];
const labels = p => p.byId('shipped-stats').children.map(c => one(p, c, 'label').textContent);
const plain = () => styles().replace(/\/\*[\s\S]*?\*\//g, '');
// The declarations for a selector inside the @media block that opens with `query`.
const inMedia = (query, sel) => { const at = plain().indexOf(query); assert.ok(at >= 0, query); const block = plain().slice(at, plain().indexOf('}', plain().indexOf(sel, at)) + 1); return block.slice(block.indexOf(sel)); };

const ALWAYS = ['shipped today', 'median build time', 'median review rounds', 'approved first round'];
const OTHERS = ['median builder cost', 'total cost', 'median review tokens', 'median builder tokens'];

test('0606 AC1: every figure is a tile of one style: the surface colour, no border, every corner rounded alike, one gap', () => {
  const tile = cssRules('.stat');
  assert.equal(cssValue(tile, 'background'), 'var(--surface)');
  assert.equal(cssValue(tile, 'border'), '0');
  assert.match(cssValue(tile, 'border-radius'), /^\d+px$/, 'one radius for all four corners');
  assert.ok(!/border-(top|bottom)-(left|right)-radius/.test(plain().match(/[^}]*\.stat[^}]*\}/g).join('')), 'no corner of its own');
  const grid = cssRules('.stats');
  assert.match(cssValue(grid, 'gap'), /^\d+px$/, 'one gap between tiles');
  assert.equal(cssValue(grid, 'background'), undefined, 'no grid colour showing between tiles');
  assert.equal(cssValue(grid, 'border-radius'), undefined, 'the grid itself has no rounded corners to cut tiles');
  assert.ok(!/\.stat:last-child/.test(plain()), 'no tile spans its row');
});

test('0606 AC1: its number is in the panel\'s font, and its label in the muted colour on one line', () => {
  assert.equal(cssValue(cssRules('.stat .num'), 'font-family'), 'var(--font-ui)');
  const label = cssRules('.stat .label');
  assert.equal(cssValue(label, 'color'), 'var(--muted)');
  assert.equal(cssValue(label, 'white-space'), 'nowrap');
  assert.equal(cssValue(label, 'text-overflow'), 'ellipsis');
  assert.equal(cssValue(cssRules('.stats'), 'grid-auto-rows'), '1fr', 'tiles in a row the same height');
});

test('0606 AC2: two columns below 480 px wide and four from 480 px', () => {
  assert.equal(cssValue(cssRules('.stats').slice(0, 1), 'grid-template-columns'), 'repeat(2, minmax(0, 1fr))');
  assert.match(inMedia('@media (min-width: 480px)', '.stats'), /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
});

test('0606 AC2: four figures always show, and the other four join them when the rest are open', async () => {
  const p = await show();
  assert.deepEqual(labels(p), ALWAYS);
  click(p.byId('more-stats'));
  await p.settle();
  assert.deepEqual(labels(p), [...ALWAYS, ...OTHERS]);
  const nums = p.byId('shipped-stats').children.map(c => one(p, c, 'num').textContent);
  assert.deepEqual(nums.slice(4), ['$2.00', '$2.50', '700', '3,000']);
});

test('0606 AC2: total cost keeps its tile, as a dash, when no shipped ticket has one, so the last row stays full', async () => {
  const s = STATE();
  delete s.tickets[0].total_cost_usd;
  const p = await show(s);
  click(p.byId('more-stats'));
  await p.settle();
  assert.equal(p.byId('shipped-stats').children.length, 8);
  const tile = p.byId('shipped-stats').children[5];
  assert.deepEqual([one(p, tile, 'num').textContent, one(p, tile, 'label').textContent], ['–', 'total cost']);
  assert.equal(tile.title, 'No shipped ticket has a known total cost');
});

test('0606 AC3: a tile names its tickets only when its figure comes from fewer than all those shipped', async () => {
  const p = await show();
  click(p.byId('more-stats'));
  await p.settle();
  const counts = p.byId('shipped-stats').children.map(c => one(p, c, 'count')?.textContent ?? null);
  assert.deepEqual(counts, [null, null, null, null, 'from 2 tickets', 'from 1 ticket', null, 'from 2 tickets']);
});

test('0606 AC3: the "in total" line is gone, as the tab gives the count', async () => {
  assert.doesNotMatch(page(), /id="shipped-n"/);
  const p = await show();
  const section = p.byId('shipped-section');
  assert.doesNotMatch(section.textContent, /in total/);
  assert.equal(p.byId('tab-shipped-n').textContent, '3');
});

test('0606 AC4: All figures is a text link in the accent colour under the grid, with a 44 px tall tap area', async () => {
  const html = page();
  assert.match(html, /<div class="stats" id="shipped-stats" hidden><\/div>\s*<button class="more-stats" id="more-stats" type="button" aria-expanded="false" aria-controls="shipped-stats" hidden><\/button>/);
  assert.doesNotMatch(html, /id="shipped-more"|id="shipped-stats-line"/, 'one grid, no line round the link');
  const link = cssRules('.more-stats');
  assert.equal(cssValue(link, 'color'), 'var(--accent)');
  assert.equal(cssValue(link, 'border'), '0');
  assert.equal(cssValue(link, 'background'), 'none');
  assert.equal(cssValue(link, 'min-height'), '44px');
  assert.ok(!cssRules('.full-open.more-stats').length, 'not the bordered button');
  const p = await show();
  const more = p.byId('more-stats');
  assert.equal(more.hidden, false);
  assert.deepEqual([more.textContent, more.attrs['aria-expanded']], ['All figures', 'false']);
  click(more);
  await p.settle();
  assert.deepEqual([more.textContent, more.attrs['aria-expanded']], ['Fewer figures', 'true']);
  click(more);
  await p.settle();
  assert.equal(more.textContent, 'All figures');
  assert.equal(p.byId('shipped-stats').children.length, 4);
});

test('0606 AC4: with nothing shipped there are no tiles and no link', async () => {
  const p = await show({ run: { on: false }, ideas: [], tickets: [] });
  assert.equal(p.byId('shipped-stats').hidden, true);
  assert.equal(p.byId('more-stats').hidden, true);
});
