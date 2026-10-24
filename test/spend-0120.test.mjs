import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CLI, env, runRepo, startRun, until, stopRun, record } from './support/run.mjs';
import { panelModel, T, round, fakePage, shippedRows, openDetails } from './support/panel.mjs';
import { builderSpend } from '../scripts/core.mjs';

// ---------- 0120: record what each build's builder spends ----------

const runsPath = (dir, f) => path.join(dir, 'speck', '.cache', 'runs', f);
const statusOf = (dir, id) => JSON.parse(spawnSync(process.execPath, [CLI, 'status', '--json'], { cwd: dir, encoding: 'utf8', env }).stdout).tickets.find(t => t.id === id);
const line = o => JSON.stringify(o);
const usage = (input, read, write, output) => ({ input_tokens: input, cache_read_input_tokens: read, cache_creation_input_tokens: write, output_tokens: output });
const result = o => line({ type: 'result', subtype: 'success', session_id: 's', ...o });

// A repo whose build_command prints the given log lines, as Claude Code's stream-json output does, then exits.
function spendRepo(lines) {
  const fake = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fake-')), 'fake-build.cjs');
  fs.writeFileSync(fake, `process.stdout.write(${JSON.stringify(lines.map(l => `${l}\n`).join(''))});`);
  return runRepo({ command: `"${process.execPath}" "${fake}" {id} {session}` });
}
async function runToExit(r) {
  const run = startRun(r.dir);
  try {
    assert.ok(await until(() => { try { return Object.hasOwn(record(r.dir, '0001'), 'exited'); } catch { return false; } }), run.out());
  } finally { await stopRun(run); }
  return record(r.dir, '0001');
}

test('0120 AC1: when a build speck run launched ends, its final result line gives the builder\'s tokens and cost', async () => {
  const r = spendRepo([
    line({ type: 'system', subtype: 'init', session_id: 's' }),
    result({ usage: usage(1, 2, 3, 4), total_cost_usd: 0.01 }), // an earlier turn's result
    'not json',
    result({ usage: usage(10, 1000, 200, 30), total_cost_usd: 1.5 }),
  ]);
  const rec = await runToExit(r);
  assert.deepEqual(rec.builder, { tokens: 1240, cost_usd: 1.5 });
});

test('0120 AC1: tokens come from the final result\'s modelUsage, summed over models, which covers a resumed session', () => {
  const log = [
    result({ usage: usage(0, 0, 0, 0), total_cost_usd: 0.7, modelUsage: { a: { inputTokens: 30, outputTokens: 9058, cacheReadInputTokens: 599125, cacheCreationInputTokens: 49797, costUSD: 0.7 } } }),
    result({ usage: usage(34, 1179030, 16154, 8650), total_cost_usd: 1.42,
      modelUsage: { a: { inputTokens: 76, outputTokens: 19935, cacheReadInputTokens: 2141794, cacheCreationInputTokens: 73552, thinkingTokens: 4847, costUSD: 1.4 },
        b: { inputTokens: 100, outputTokens: 50, cacheReadInputTokens: 0, cacheCreationInputTokens: 0, costUSD: 0.02 } } }),
    '',
  ].join('\n');
  assert.deepEqual(builderSpend(log), { tokens: 76 + 19935 + 2141794 + 73552 + 150, cost_usd: 1.42 });
});

test('0120 AC1: no result line, or a final one without usage, records nothing', () => {
  assert.equal(builderSpend(''), null);
  assert.equal(builderSpend('plain text\n{"type":"assistant"}\n'), null);
  assert.equal(builderSpend(`${result({ usage: usage(1, 1, 1, 1), total_cost_usd: 1 })}\n${result({ total_cost_usd: 2 })}\n`), null, 'the final result has no usage');
  assert.equal(builderSpend(result({ usage: 'lots', total_cost_usd: 2 })), null);
  assert.deepEqual(builderSpend(result({ usage: usage(1, 2, 3, 4) })), { tokens: 10, cost_usd: null }, 'no cost: tokens only');
  assert.deepEqual(builderSpend(result({ usage: { output_tokens: 5, input_tokens: 'x' }, total_cost_usd: -1 })), { tokens: 5, cost_usd: null }, 'odd values count as nothing');
});

test('0120 AC1: a build whose log has no usage gets no builder spend in its record', async () => {
  const rec = await runToExit(spendRepo([line({ type: 'system', subtype: 'init' }), 'Error: something went wrong']));
  assert.ok(Object.hasOwn(rec, 'exited'));
  assert.equal(Object.hasOwn(rec, 'builder'), false);
});

test('0120 AC2: speck status --json gives each ticket\'s recorded builder tokens and cost, or null', () => {
  const r = runRepo({ tickets: [['0001', { status: 'done' }], ['0002', { status: 'done' }], ['0003', { status: 'done' }], ['0004', { status: 'done' }]] });
  fs.mkdirSync(runsPath(r.dir, ''), { recursive: true });
  const rec = o => JSON.stringify({ session: 's', cwd: r.dir, pid: 1, exited: '2026-10-11T10:00:00.000Z', exit_code: 0, ...o });
  fs.writeFileSync(runsPath(r.dir, '0001.json'), rec({ id: '0001', builder: { tokens: 1240, cost_usd: 1.5 } }));
  fs.writeFileSync(runsPath(r.dir, '0002.json'), rec({ id: '0002' }));
  fs.writeFileSync(runsPath(r.dir, '0004.json'), rec({ id: '0004', builder: { tokens: 'many', cost_usd: Infinity } }));
  const s = id => statusOf(r.dir, id);
  assert.deepEqual([s('0001').builder_tokens, s('0001').builder_cost_usd], [1240, 1.5]);
  assert.deepEqual([s('0002').builder_tokens, s('0002').builder_cost_usd], [null, null], 'no spend recorded');
  assert.deepEqual([s('0003').builder_tokens, s('0003').builder_cost_usd], [null, null], 'no run record');
  assert.deepEqual([s('0004').builder_tokens, s('0004').builder_cost_usd], [null, null], 'not numbers');
});

// 0464: an open card's figures are in its facts table, after its Shipped cell, whose time depends on the clock
const figsOf = tr => tr.children.find(n => n.className === 'steps').children.find(n => n.className === 'facts').children.slice(1).map(c => c.textContent).join('');
test('0120 AC3: Shipped rows label the existing figure as reviewer tokens and show the builder\'s tokens and cost', async () => {
  const now = Date.now(), iso = ms => new Date(ms).toISOString();
  const p = fakePage([{ tickets: [
    T('0011', 'done', { started: iso(now - 4 * 60000), finished: iso(now), rounds: [round(1, 1200)], builder_tokens: 2345678, builder_cost_usd: 1.159 }),
    T('0012', 'done', { started: iso(now - 9 * 60000), finished: iso(now - 60000), rounds: [round(1, 300)], builder_tokens: 1000, builder_cost_usd: null }),
  ], ideas: [] }]);
  await p.settle();
  await openDetails(p); // 0162: the labelled figures are under Details
  // 0157: label and value pairs, a token count from 10,000 up shortened.
  const [a, b] = shippedRows(p).map(figsOf);
  assert.equal(a, 'Time4 minReview rounds1Builder cost$1.16Builder tokens2.3MReviewer tokens1,200');
  assert.equal(b, 'Time8 minReview rounds1Builder cost—Builder tokens1,000Reviewer tokens300', 'a dash for what isn\'t recorded (0464)');
});

test('0120 AC4: the stats add median builder tokens and cost, each over the done tickets with that data', async () => {
  const model = panelModel();
  const now = Date.now(), iso = ms => new Date(ms).toISOString();
  const done = (id, o) => T(id, 'done', { finished: iso(now), rounds: [], ...o });
  const state = { tickets: [
    done('0011', { builder_tokens: 100, builder_cost_usd: 0.5 }),
    done('0012', { builder_tokens: 300, builder_cost_usd: 1.25 }),
    done('0013', { builder_tokens: 800, builder_cost_usd: null }),
    done('0014', {}),
    T('0015', 'building', { builder_tokens: 9, builder_cost_usd: 9 }),
  ], ideas: [] };
  const m = model(state);
  assert.deepEqual(m.stats.builderTokens, { median: 300, count: 3 });
  assert.deepEqual(m.stats.builderCost, { median: 0.88, count: 2 }, 'mean of 0.5 and 1.25, to the cent');
  const p = fakePage([state]);
  await p.settle();
  const texts = p.byId('shipped-more').children.map(c => c.textContent);
  assert.match(p.byId('shipped-stats').textContent, /, \$0\.88$/); // one line since 0420
  assert.equal(p.all(p.byId('shipped-stats')).find(n => n.className === 'part' && n.textContent === '$0.88').title, 'Median builder cost, over 2 tickets');
  assert.deepEqual(texts.slice(1), ['–median reviewer tokens0 tickets', '300median builder tokens3 tickets']); // as 0162 lays them out
});

test('0120 AC5: a ticket with no builder spend shows none, and the rest of Shipped is unchanged', async () => {
  const now = Date.now(), iso = ms => new Date(ms).toISOString();
  const state = { tickets: [T('0011', 'done', { started: iso(now - 4 * 60000), finished: iso(now), rounds: [round(1, 1200), round(2, 300)] })], ideas: [] };
  const p = fakePage([state]);
  await p.settle();
  await openDetails(p);
  assert.equal(figsOf(shippedRows(p)[0]), 'Time4 minReview rounds2Builder cost—Builder tokens—Reviewer tokens1,500'); // as 0464 lays them out
  assert.equal(p.byId('shipped-stats').textContent, '1 today · median 4 min, –'); // one line since 0420
  assert.deepEqual(p.byId('shipped-more').children.map(c => c.textContent),
    ['2median review rounds1 ticket', '1,500median reviewer tokens1 ticket', '–median builder tokens0 tickets']); // as 0162 lays them out
  const m = panelModel()(state);
  assert.equal(m.shipped[0].tokens, 1500);
  assert.equal(m.shipped[0].builderTokens, null);
  assert.equal(m.shipped[0].builderCost, null);
});
