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
  assert.equal(cssValue(tile, 'color'), 'var(--text)', 'its own text colour on its fill (0161)');
});

test('0606 AC1: its number is in the panel\'s font, and its label in the muted colour on one line', () => {
  assert.equal(cssValue(cssRules('.stat .num'), 'font-family'), 'var(--font-ui)');
  const label = cssRules('.stat .label');
  assert.equal(cssValue(label, 'color'), 'var(--muted)');
  assert.equal(cssValue(label, 'white-space'), 'nowrap');
  assert.equal(cssValue(label, 'text-overflow'), 'ellipsis');
  assert.equal(cssValue(cssRules('.stats'), 'grid-auto-rows'), '1fr', 'tiles in a row the same height');
});

// A 480 px window's grid is 448 px wide, inside the lane's 16 px margins. The real-browser checks are in panel-0162 and panel-0157.
test('0606 AC2: two columns below 480 px wide and four from 480 px, chosen by the grid\'s own width, with no media query of its own (0140)', () => {
  assert.equal(cssValue(cssRules('.lane-list'), 'padding'), '0 16px');
  assert.equal(cssValue(cssRules('.stats'), 'grid-template-columns'), 'repeat(auto-fill, minmax(clamp(25% - 6.1px, (448px - 100%) * 1000, 50% - 4.1px), 1fr))');
  assert.equal(cssValue(cssRules('.stats'), 'gap'), '8px');
  // auto-fill with the column the clamp gives at each grid width: how many fit, gaps included
  const columns = w => { const track = Math.min(Math.max(w / 4 - 6.1, (448 - w) * 1000), w / 2 - 4.1); return Math.floor((w + 8) / (track + 8)); };
  for (const [window, want] of [[320, 2], [375, 2], [479, 2], [480, 4], [600, 4], [720, 4]]) assert.equal(columns(window - 32), want, `${window} px`);
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
  assert.equal(cssValue(link, 'color'), 'var(--run)', 'the links\' blue');
  const base = styles();
  for (const look of [/--accent: (#\w+)[\s\S]*?--run: (#\w+)/, /--bg: #111214[\s\S]*?--accent: (#\w+)[\s\S]*?--run: (#\w+)/]) { const [, accent, run] = base.match(look); assert.equal(run, accent, 'the accent colour in each look'); }
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
