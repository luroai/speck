// 0526: a ticket's total AI spend, builder, reviewer and watch agent together, in speck status --json and the panel.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { totalSpent, recordWatchSpend } from '../scripts/spend.mjs';
import { statusData, runsOf } from '../scripts/speck.mjs';
import { T, round, fakePage, shippedRows, stoppedClock, panelModel } from './support/panel.mjs';
import { runRepo } from './support/run.mjs';

const NOW = new Date(2026, 9, 27, 12, 0).getTime();
const ago = s => new Date(NOW - s * 1000).toISOString();
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} is not ${b}`);
// A saved review round, as the ticket's ## Review rounds keeps it: its tokens from usage, its cost when known.
const saved = (input, output, cost_usd) => ({ meta: { usage: { input_tokens: input, output_tokens: output }, ...(cost_usd === undefined ? {} : { cost_usd }) } });

// ---------- AC1 ----------

test('0526 AC1: the total sums the known builder, reviewer and watch agent costs and tokens', () => {
  const t = totalSpent({ builder: { tokens: 1000, cost_usd: 1.5 }, rounds: [saved(100, 20, 0.1), saved(200, 30, 0.2)], watch: { tokens: 50, cost_usd: 0.05 } });
  close(t.total_cost_usd, 1.85);
  assert.equal(t.total_tokens, 1000 + 120 + 230 + 50);
  assert.deepEqual(t.total_cost_unknown, []);
});

test('0526 AC1: with no part known the total cost and tokens are null; a part left out counts only what is known', () => {
  assert.deepEqual(totalSpent({}), { total_cost_usd: null, total_tokens: null, total_cost_unknown: [] });
  assert.deepEqual(totalSpent({ builder: { tokens: null, cost_usd: null }, rounds: [], watch: { tokens: null, cost_usd: null } }),
    { total_cost_usd: null, total_tokens: null, total_cost_unknown: [] });
  // Tokens but no cost: the cost stays unknown, the tokens count.
  assert.deepEqual(totalSpent({ builder: { tokens: 900, cost_usd: null } }), { total_cost_usd: null, total_tokens: 900, total_cost_unknown: ['builder'] });
  // One reviewer round with tokens and no cost leaves the reviewer out, even when another round's cost is known.
  const t = totalSpent({ builder: { tokens: 10, cost_usd: 2 }, rounds: [saved(100, 0, 0.5), saved(300, 0)], watch: { tokens: 7, cost_usd: null } });
  close(t.total_cost_usd, 2.5);
  assert.equal(t.total_tokens, 10 + 400 + 7);
  assert.deepEqual(t.total_cost_unknown, ['reviewer', 'watch']);
  // A round with no tokens and no cost, or something that isn't a round, leaves nothing out.
  assert.deepEqual(totalSpent({ rounds: [saved(0, 0), null, 'x', { meta: { usage: { input_tokens: -5 } } }] }).total_cost_unknown, []);
});

test('0526 AC1: speck status --json gives each ticket\'s total_cost_usd and total_tokens', () => {
  const r = runRepo({ tickets: [['0001', {}], ['0002', {}]] });
  const runs = runsOf(r.dir);
  fs.mkdirSync(runs, { recursive: true });
  const file = path.join(runs, 'w.log');
  fs.writeFileSync(file, [{ type: 'system', subtype: 'init', session_id: 's' }, { type: 'result', subtype: 'success', session_id: 's', total_cost_usd: 0.25,
    modelUsage: { 'claude-opus-5-5': { inputTokens: 10, outputTokens: 90, cacheReadInputTokens: 900, cacheCreationInputTokens: 0, costUSD: 0.25 } } }].map(e => JSON.stringify(e)).join('\n'));
  recordWatchSpend(runs, { id: '0001', run: 'a', log: file });
  const tickets = statusData(r.dir).tickets, one = tickets.find(t => t.id === '0001'), two = tickets.find(t => t.id === '0002');
  close(one.total_cost_usd, 0.25);
  assert.equal(one.total_tokens, one.watch_tokens);
  assert.ok(one.total_tokens > 0);
  assert.equal(two.total_cost_usd, null);
  assert.equal(two.total_tokens, null);
});

test('0526 AC5: the total covers only the shipped tickets shown, the latest ten', () => {
  const at = n => new Date(NOW - (n + 1) * 60000).toISOString();
  const tickets = Array.from({ length: 12 }, (_, i) => T(String(i + 1).padStart(4, '0'), 'done', { finished: at(i), total_cost_usd: 1, total_cost_unknown: [] }));
  const m = panelModel({ Date: stoppedClock(NOW) })({ run: { on: false }, ideas: [], tickets });
  assert.equal(m.shipped.length, 10);
  assert.deepEqual(m.stats.totalCost, { sum: 10, count: 10, partial: false });
});

// ---------- AC2, AC3 ----------

const TICKETS = [
  T('0901', 'done', { title: 'Every cost', started: ago(1500), finished: ago(600), builder_cost_usd: 2.906, reviewer_cost_usd: 0.4, total_cost_usd: 3.306, total_cost_unknown: [], rounds: [round(1, 500)] }),
  T('0902', 'done', { title: 'No cost', started: ago(3000), finished: ago(1200) }),
  T('0903', 'done', { title: 'Reviewer cost unknown', started: ago(3000), finished: ago(1300), builder_cost_usd: 1.5, total_cost_usd: 1.5, total_cost_unknown: ['reviewer'], rounds: [round(1, 500)] }),
  T('0905', 'done', { title: 'One round\'s cost unknown', started: ago(3000), finished: ago(1500), builder_cost_usd: 1, reviewer_cost_usd: 0.2, total_cost_usd: 1.2, total_cost_unknown: ['reviewer'], rounds: [round(1, 500), round(2, 500)] }),
  T('0904', 'done', { title: 'Every part unknown', started: ago(3000), finished: ago(1400), builder_tokens: 50, total_cost_usd: null, total_cost_unknown: ['builder', 'reviewer', 'watch'], rounds: [round(1, 500)] }),
];
const page = (tickets = TICKETS) => fakePage([{ run: { on: false }, ideas: [], tickets }], { Date: stoppedClock(NOW) });
const cardOf = (p, id) => shippedRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const factsOf = (p, id) => cardOf(p, id).children.find(c => c.className === 'steps').children[1];
const cell = (p, id, label) => factsOf(p, id).children.find(c => c.children[0].textContent === label)?.children[1];
async function open(p, ...ids) {
  for (const id of ids) { p.press(p.all(cardOf(p, id)).find(n => n.className === 'title')); await p.settle(); }
}

test('0526 AC2: a shipped ticket\'s facts show Reviewer cost and Total cost beside Builder cost, or — with no known cost', async () => {
  const p = page();
  await p.settle();
  await open(p, '0901', '0902');
  const labels = factsOf(p, '0901').children.map(c => c.children[0].textContent);
  assert.deepEqual(labels.slice(3, 6), ['Builder cost', 'Reviewer cost', 'Total cost']);
  assert.equal(labels.length, 8);
  assert.equal(cell(p, '0901', 'Reviewer cost').textContent, '$0.40');
  assert.equal(cell(p, '0901', 'Total cost').textContent, '$3.31');
  assert.equal(cell(p, '0901', 'Total cost').title, '$3.31');
  for (const label of ['Builder cost', 'Reviewer cost', 'Total cost']) assert.equal(cell(p, '0902', label).textContent, '—', label);
});

test('0526 AC3: a total that leaves out a part with tokens but no cost says "at least", and its tooltip names each part left out', async () => {
  const p = page();
  await p.settle();
  await open(p, '0901', '0903', '0904');
  assert.equal(cell(p, '0903', 'Total cost').textContent, 'at least $1.50');
  assert.match(cell(p, '0903', 'Total cost').title, /Reviewer cost unknown/);
  assert.equal(cell(p, '0903', 'Reviewer cost').textContent, '—');
  // No part known at all: nothing to add up, so "—", with the parts named.
  assert.equal(cell(p, '0904', 'Total cost').textContent, '—');
  assert.equal(cell(p, '0904', 'Total cost').title, 'Builder cost unknown, Reviewer cost unknown, Watch agent cost unknown');
  assert.equal(cell(p, '0903', 'Total cost').title, 'at least $1.50: Reviewer cost unknown');
  assert.equal(cell(p, '0901', 'Total cost').title.includes('unknown'), false);
});

test('0526 AC3: a reviewer cost that leaves out a round whose cost is unknown also says "at least"', async () => {
  const p = page();
  await p.settle();
  await open(p, '0901', '0905');
  assert.equal(cell(p, '0905', 'Reviewer cost').textContent, 'at least $0.20');
  assert.equal(cell(p, '0905', 'Total cost').textContent, 'at least $1.20');
  assert.equal(cell(p, '0901', 'Reviewer cost').textContent, '$0.40');
});

// ---------- AC4 ----------

test('0526 AC4: a shipped ticket\'s line shows its total cost where it showed its builder cost', async () => {
  const p = page();
  await p.settle();
  const fig = id => p.all(cardOf(p, id)).find(n => n.className === 'figline')?.textContent;
  assert.equal(fig('0901'), '15 min · 1 round · $3.31');
  assert.equal(fig('0903'), '28 min · 1 round · at least $1.50');
  assert.equal(fig('0902'), '30 min', 'no cost: none shown');
  assert.equal(fig('0904'), '27 min · 1 round');
});

// ---------- AC5 ----------

test('0526 AC5: the stats add the total cost of the shipped tickets with a known total, saying how many it covers', async () => {
  const p = page();
  await p.settle();
  const stats = p.byId('shipped-stats');
  assert.match(stats.textContent, /, \$1\.50, \$6\.01 total$/, 'beside the median builder cost');
  const part = p.all(stats).find(n => n.className === 'part' && /total/.test(n.textContent));
  assert.equal(part.title, 'Total AI cost of the shipped tickets shown, over 3 tickets, at least: some of their costs are unknown');
  const m = panelModel({ Date: stoppedClock(NOW) })({ run: { on: false }, ideas: [], tickets: TICKETS });
  assert.deepEqual(m.stats.totalCost, { sum: 6.01, count: 3, partial: true });
});

test('0526 AC5: with no known total the stats line shows no total', async () => {
  const p = page([TICKETS[1]]);
  await p.settle();
  assert.equal(p.byId('shipped-stats').textContent, '1 today · median 30 min, –');
});

test('0526 AC1: the brief names the total fields speck status --json gives', () => {
  const brief = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8');
  for (const name of ['`total_cost_usd`', '`total_tokens`', '`total_cost_unknown`']) assert.ok(brief.includes(name), name);
});
