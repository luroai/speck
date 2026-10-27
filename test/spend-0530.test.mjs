// 0530: every build's spend records the model or models it ran on, with each model's tokens and cost.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { builderSpend, builderSpent, earlierBuilds, logSpend } from '../scripts/spend.mjs';
import { statusData } from '../scripts/speck.mjs';
import { runRepo } from './support/run.mjs';
import { priceFile, codexHome } from './support/round-cost.mjs';

process.env.SPECK_PRICES = priceFile(); // openai/gpt-test and anthropic/claude-test
process.env.CODEX_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-codex-none-')); // no sessions unless a test gives some
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} is not ${b}`);
const log = events => events.map(e => JSON.stringify(e)).join('\n');
const runsDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'runs-'));
const save = (dir, id, rec, text) => {
  fs.writeFileSync(path.join(dir, `${id}.json`), `${JSON.stringify({ id, ...rec }, null, 2)}\n`);
  if (text !== undefined) fs.writeFileSync(path.join(dir, `${id}.log`), text);
};

// gpt-test: $2 a million input, $0.20 cached, $10 output. claude-test: $3, $0.30 cached, $3.75 cache writes, $15 output.
const CLAUDE = log([{ type: 'result', subtype: 'success', session_id: 's', total_cost_usd: 1.42,
  usage: { input_tokens: 34, cache_read_input_tokens: 1179030, cache_creation_input_tokens: 16154, output_tokens: 8650 },
  modelUsage: {
    'claude-opus-5-5': { inputTokens: 76, outputTokens: 19935, cacheReadInputTokens: 2141794, cacheCreationInputTokens: 73552, thinkingTokens: 4847, costUSD: 1.4 },
    'claude-haiku-5-5': { inputTokens: 100, outputTokens: 50, cacheReadInputTokens: 0, cacheCreationInputTokens: 0, costUSD: 0.02 },
  } }]);
const codexUsage = { input_tokens: 10000, cached_input_tokens: 8000, cache_write_input_tokens: 0, output_tokens: 500, reasoning_output_tokens: 200 };
const CODEX = log([{ type: 'thread.started', thread_id: 'T530' }, { type: 'turn.started' }, { type: 'turn.completed', usage: codexUsage }]);
const codexCommand = model => ['codex', 'exec', '--json', '--dangerously-bypass-approvals-and-sandbox', ...(model ? ['-m', model] : []), '$speck-build 0001'];
const cursorUsage = { inputTokens: 17120, outputTokens: 300, cacheReadTokens: 13440, cacheWriteTokens: 50 };
const CURSOR = log([{ type: 'system', subtype: 'init', session_id: 's', model: 'x' }, { type: 'result', subtype: 'success', session_id: 's', usage: cursorUsage }]);
const cursorCommand = model => ['agent', '-p', '--force', '--trust', '--output-format', 'stream-json', '--model', model, '--resume', 'c1', '/speck-build 0001'];

// ---------- AC1 ----------

test('0530 AC1: a Claude Code build keeps each model in modelUsage, with its tokens split and its costUSD', () => {
  const s = builderSpend(CLAUDE);
  assert.deepEqual(s.models, [
    { model: 'claude-opus-5-5', tokens: { input: 76, cached: 2141794, write: 73552, output: 19935 }, cost_usd: 1.4 },
    { model: 'claude-haiku-5-5', tokens: { input: 100, cached: 0, write: 0, output: 50 }, cost_usd: 0.02 },
  ]);
  assert.equal(s.cost_usd, 1.42, 'the build\'s cost stays its total_cost_usd');
});

test('0530 AC1: a model with odd counts or no costUSD keeps what it can, with an unknown cost', () => {
  const s = builderSpend(log([{ type: 'result', total_cost_usd: 0.5, modelUsage: { m: { inputTokens: 'x', outputTokens: 7, costUSD: -1 }, junk: 'no', __proto__x: null } }]));
  assert.deepEqual(s.models, [{ model: 'm', tokens: { input: 0, cached: 0, write: 0, output: 7 }, cost_usd: null }]);
});

// ---------- AC2 ----------

test('0530 AC2: a Codex build keeps its -m model, its tokens split from the last turn, and a cost from the price table', () => {
  const s = builderSpend(CODEX, { command: codexCommand('gpt-test') });
  const cost = 2000 * 0.000002 + 8000 * 0.0000002 + 500 * 0.00001;
  assert.equal(s.models.length, 1);
  assert.equal(s.models[0].model, 'gpt-test');
  assert.deepEqual(s.models[0].tokens, { input: 2000, cached: 8000, write: 0, output: 500 });
  close(s.models[0].cost_usd, cost);
  close(s.cost_usd, cost);
  assert.equal(s.tokens, 10500, 'its tokens are counted as before');
});

test('0530 AC2: a Codex build without -m takes its model from its session file', () => {
  const home = codexHome('T530', ['gpt-other', 'gpt-test']);
  const prev = process.env.CODEX_HOME;
  process.env.CODEX_HOME = home;
  try {
    const s = builderSpend(CODEX, { command: codexCommand(null) });
    assert.equal(s.models[0].model, 'gpt-test', 'the last turn\'s model');
    assert.notEqual(s.cost_usd, null);
    // A record's session names the thread when the log doesn't.
    const noThread = log([{ type: 'turn.completed', usage: codexUsage }]);
    assert.equal(builderSpend(noThread, { command: codexCommand(null), session: 'T530' }).models[0].model, 'gpt-test');
    // The command's -m wins over the session file.
    assert.equal(builderSpend(CODEX, { command: codexCommand('gpt-five') }).models[0].model, 'gpt-five');
  } finally { process.env.CODEX_HOME = prev; }
});

test('0530 AC2: a Codex build whose model is unknown, or has no rates, keeps its tokens with an unknown cost', () => {
  for (const command of [codexCommand(null), codexCommand('gpt-unpriced'), undefined]) {
    const s = builderSpend(CODEX, { command });
    assert.equal(s.cost_usd, null);
    assert.equal(s.models[0].cost_usd, null);
    assert.deepEqual(s.models[0].tokens, { input: 2000, cached: 8000, write: 0, output: 500 });
  }
  assert.equal(builderSpend(CODEX).models[0].model, null);
});

// ---------- AC3 ----------

test('0530 AC3: a Cursor build keeps its --model, its tokens split as a review round\'s are, and a priced cost', () => {
  const s = builderSpend(CURSOR, { command: cursorCommand('claude-test') });
  const split = { input: 3680, cached: 13440, write: 50, output: 300 };
  const cost = 3680 * 0.000003 + 13440 * 0.0000003 + 50 * 0.00000375 + 300 * 0.000015;
  assert.equal(s.models[0].model, 'claude-test');
  assert.deepEqual(s.models[0].tokens, split);
  close(s.models[0].cost_usd, cost);
  close(s.cost_usd, cost);
});

test('0530 AC3: a Cursor build counts its cache reads once in builder_tokens', () => {
  assert.equal(builderSpend(CURSOR, { command: cursorCommand('claude-test') }).tokens, 17120 + 50 + 300);
});

test('0530 AC3: a Cursor build on auto, or on a model with no rates, keeps its tokens with an unknown cost, never $0', () => {
  for (const model of ['auto', 'grok-unpriced']) {
    const s = builderSpend(CURSOR, { command: cursorCommand(model) });
    assert.equal(s.cost_usd, null, model);
    assert.deepEqual(s.models, [{ model, tokens: { input: 3680, cached: 13440, write: 50, output: 300 }, cost_usd: null }]);
    assert.equal(s.tokens, 17470);
  }
});

// ---------- AC4 ----------

test('0530 AC4: the spend read from a build\'s log uses its run record\'s command', () => {
  const dir = runsDir();
  save(dir, '0001', { started: '2026-10-27T10:00:00.000Z', command: cursorCommand('claude-test') }, CURSOR);
  assert.equal(logSpend(dir, '0001', JSON.parse(fs.readFileSync(path.join(dir, '0001.json'), 'utf8'))).models[0].model, 'claude-test');
  assert.equal(logSpend(dir, '0002', {}), null, 'no log');
  // A build that stopped before its exit was saved is carried forward with its models.
  const [b] = earlierBuilds(dir, '0001');
  assert.equal(b.models[0].model, 'claude-test');
  assert.notEqual(b.cost_usd, null);
});

test('0530 AC4: speck status --json gives builder_cost_usd with priced Codex and Cursor builds, and builder_models', () => {
  const r = runRepo();
  const dir = path.join(r.dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(dir, { recursive: true });
  const codex = builderSpend(CODEX, { command: codexCommand('gpt-test') });
  const cursor = builderSpend(CURSOR, { command: cursorCommand('auto') });
  const claude = builderSpend(CLAUDE);
  save(dir, '0001', { started: '2026-10-27T10:00:00.000Z', exited: '2026-10-27T11:00:00.000Z', builder: codex,
    earlier_builds: [{ ended: 'a', ...claude }, { ended: 'b', ...cursor }, { ended: 'c', ...codex }] });
  const t = statusData(r.dir).tickets.find(x => x.id === '0001');
  close(t.builder_cost_usd, 1.42 + 2 * codex.cost_usd);
  assert.equal(t.builder_tokens, claude.tokens + cursor.tokens + 2 * codex.tokens);
  const by = Object.fromEntries(t.builder_models.map(m => [m.model, m]));
  assert.deepEqual(Object.keys(by).sort(), ['auto', 'claude-haiku-5-5', 'claude-opus-5-5', 'gpt-test']);
  assert.deepEqual(by['gpt-test'].tokens, { input: 4000, cached: 16000, write: 0, output: 1000 }, 'summed over its builds');
  close(by['gpt-test'].cost_usd, 2 * codex.cost_usd);
  assert.equal(by.auto.cost_usd, null);
  assert.equal(by['claude-opus-5-5'].cost_usd, 1.4);
});

test('0530 AC4: a ticket with no builds, or builds without models, gives an empty builder_models', () => {
  const r = runRepo();
  const dir = path.join(r.dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(dir, { recursive: true });
  assert.deepEqual(statusData(r.dir).tickets.find(x => x.id === '0001').builder_models, []);
  save(dir, '0001', { builder: { tokens: 5, cost_usd: 1, models: 'junk' }, earlier_builds: [{ tokens: 1, cost_usd: null, models: [null, { model: 7 }, { model: '__proto__', tokens: { input: 'x' }, cost_usd: -2 }] }] });
  const t = statusData(r.dir).tickets.find(x => x.id === '0001');
  assert.deepEqual(t.builder_models, [{ model: '__proto__', tokens: { input: 0, cached: 0, write: 0, output: 0 }, cost_usd: null }]);
  assert.equal(t.builder_tokens, 6);
  assert.deepEqual(builderSpent(dir, '0009'), { tokens: null, cost_usd: null });
});

// ---------- AC5 ----------

test('0530 AC5: a Claude Code build\'s builder_tokens and builder_cost_usd are as before', () => {
  const s = builderSpend(CLAUDE);
  assert.equal(s.tokens, 76 + 19935 + 2141794 + 73552 + 150);
  assert.equal(s.cost_usd, 1.42);
  const usageOnly = builderSpend(log([{ type: 'result', usage: { input_tokens: 1, cache_read_input_tokens: 2, cache_creation_input_tokens: 3, output_tokens: 4 } }]));
  assert.deepEqual(usageOnly, { tokens: 10, cost_usd: null });
  const dir = runsDir();
  save(dir, '0001', { builder: s, earlier_builds: [{ ended: 'a', tokens: 100, cost_usd: 0.5 }] });
  const spent = builderSpent(dir, '0001');
  assert.equal(spent.tokens, s.tokens + 100);
  close(spent.cost_usd, 1.92);
});

test('0530 AC4: the brief names builder_cost_usd and builder_models in speck run\'s row', () => {
  const row = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8').split('\n').find(l => l.startsWith('| `speck run` |'));
  for (const fact of ['`builder_cost_usd`', '`builder_models`', '`speck status --json`', "Cursor's `auto`"]) assert.ok(row.includes(fact), fact);
});
