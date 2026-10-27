// 0529: every review round saves its model, its tokens and its cost, whichever agent reviewed it.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { roundTokens, codexModel, codexSpend, commandSpend } from '../scripts/round-cost.mjs';
import { ticketRounds, reviewerCost } from '../scripts/core.mjs';
import { appendRounds } from '../scripts/review.mjs';
import { reviewRepo, ROOT } from './support/speck.mjs';
import path from 'node:path';
import { priceFile, codexHome, claudeCostRepo } from './support/round-cost.mjs';

const prices = priceFile();
process.env.SPECK_PRICES = prices;
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} is not ${b}`);
const codexUsage = { input_tokens: 10000, cached_input_tokens: 8000, cache_write_input_tokens: 0, output_tokens: 500, reasoning_output_tokens: 200 };
const turn = usage => JSON.stringify({ type: 'turn.completed', usage });
const status = r => JSON.parse(r.runEnv({ SPECK_PRICES: prices }, 'status', '--json').stdout).tickets.find(t => t.id === '0001');

test('0529 AC1: a Codex round splits input_tokens into uncached and cached input', () => {
  assert.deepEqual(roundTokens(codexUsage, { codex: true }), { input: 2000, cached: 8000, write: 0, output: 500 });
});

test('0529 AC1: a Cursor round takes cacheReadTokens out of inputTokens, with cacheWriteTokens as cache writes', () => {
  assert.deepEqual(roundTokens({ inputTokens: 17120, outputTokens: 300, cacheReadTokens: 13440, cacheWriteTokens: 50 }), { input: 3680, cached: 13440, write: 50, output: 300 });
});

test('0529 AC1: a Claude Code round keeps input_tokens as the uncached input', () => {
  assert.deepEqual(roundTokens({ input_tokens: 40, cache_read_input_tokens: 9000, cache_creation_input_tokens: 700, output_tokens: 120 }), { input: 40, cached: 9000, write: 700, output: 120 });
});

test('0529 AC1: a resumed Codex round counts only what it used since the round it resumed', () => {
  const before = { input_tokens: 6000, cached_input_tokens: 5000, cache_write_input_tokens: 0, output_tokens: 300 };
  assert.deepEqual(roundTokens(codexUsage, { codex: true, before }), { input: 1000, cached: 3000, write: 0, output: 200 });
  // An earlier round with no usage saved, or larger counts than this one, leaves this round's tokens unknown.
  assert.equal(roundTokens(codexUsage, { codex: true, before: null }), null);
  assert.equal(roundTokens(codexUsage, { codex: true, before: {} }), null);
  assert.equal(roundTokens(codexUsage, { codex: true, before: { reasoning_output_tokens: 3 } }), null);
  assert.equal(roundTokens(before, { codex: true, before: codexUsage }), null);
});

test('0529 AC1, AC3: a Codex review round saves its model, its tokens and its cost from the price table', () => {
  const r = reviewRepo();
  const home = codexHome('T1', ['gpt-test']);
  const res = r.runEnv({ SPECK_PRICES: prices, CODEX_HOME: home, FAKE_CODEX_EVENT: turn(codexUsage) }, 'review', '1');
  assert.equal(res.status, 10, res.stderr);
  const m = r.roundFile(1).meta;
  assert.equal(m.model, 'gpt-test');
  assert.deepEqual(m.tokens, { input: 2000, cached: 8000, write: 0, output: 500 });
  close(m.cost_usd, 2000 * 0.000002 + 8000 * 0.0000002 + 500 * 0.00001);
  assert.deepEqual(m.usage, codexUsage, 'the usage Codex gave is kept as it was');
  close(status(r).reviewer_cost_usd, m.cost_usd);
});

test('0529 AC3: a Codex round runs on its reviewer_model when one is set, or else the model its session file records', () => {
  const home = codexHome('T9', ['gpt-older', 'gpt-test']);
  assert.equal(codexModel('T9', home), 'gpt-test', 'the last turn\'s model');
  assert.equal(codexModel('missing', home), null);
  assert.equal(codexModel('../T9', home), null);
  const prev = process.env.CODEX_HOME;
  process.env.CODEX_HOME = home;
  try {
    const own = codexSpend(codexUsage, { model: 'gpt-test', thread: 'nope' });
    assert.equal(own.model, 'gpt-test');
    const fromFile = codexSpend(codexUsage, { model: null, thread: 'T9' });
    assert.equal(fromFile.model, 'gpt-test');
    close(fromFile.cost_usd, own.cost_usd);
    assert.equal(codexSpend(codexUsage, { model: 'gpt-older', thread: 'T9' }).cost_usd, null, 'reviewer_model wins over the session file');
  } finally { if (prev === undefined) delete process.env.CODEX_HOME; else process.env.CODEX_HOME = prev; }
});

test('0529 AC3: a Cursor round is priced at its reviewer_model\'s rates', () => {
  const s = commandSpend({ usage: { inputTokens: 17120, outputTokens: 300, cacheReadTokens: 13440, cacheWriteTokens: 0 } }, { model: 'gpt-test' });
  assert.equal(s.model, 'gpt-test');
  close(s.cost_usd, 3680 * 0.000002 + 13440 * 0.0000002 + 300 * 0.00001);
});

test('0529 AC2: a Claude round costs its total_cost_usd, and a resumed one only what it added to the session', () => {
  const envelope = cost => ({ usage: { input_tokens: 10, cache_read_input_tokens: 500, output_tokens: 50 }, total_cost_usd: cost,
    modelUsage: { 'claude-haiku-test': { costUSD: 0.01 }, 'claude-test': { costUSD: cost - 0.01 } } });
  const first = commandSpend(envelope(0.5), { model: 'opus' });
  assert.equal(first.model, 'claude-test', 'the model its result says it ran on');
  assert.equal(first.cost_usd, 0.5);
  assert.equal(first.session_cost_usd, 0.5);
  const second = commandSpend(envelope(0.8), { earlier: first });
  close(second.cost_usd, 0.3);
  assert.equal(second.session_cost_usd, 0.8);
  assert.equal(commandSpend(envelope(0.8), { earlier: { usage: {} } }).cost_usd, null, 'an earlier round with no session cost saved');
});

test('0529 AC2: a Claude reviewer\'s rounds save their cost, the resumed one less the round before\'s', () => {
  const r = claudeCostRepo();
  const env = cost => ({ SPECK_PRICES: prices, FAKE_ENVELOPE: JSON.stringify({ usage: { input_tokens: 10, cache_read_input_tokens: 500, cache_creation_input_tokens: 20, output_tokens: 50 },
    total_cost_usd: cost, modelUsage: { 'claude-test': { costUSD: cost } } }) });
  assert.equal(r.review(env(0.5)).status, 10);
  assert.equal(r.secondRound(env(0.75)).status, 10);
  const [one, two] = [r.roundFile(1).meta, r.roundFile(2).meta];
  assert.equal(two.session, 'continued');
  assert.deepEqual(one.tokens, { input: 10, cached: 500, write: 20, output: 50 });
  assert.equal(one.model, 'claude-test');
  assert.equal(one.cost_usd, 0.5);
  close(two.cost_usd, 0.25);
  close(status(r).reviewer_cost_usd, 0.75);
});

test('0529 AC4: Cursor\'s auto, an unknown model or a round with no usage saves an unknown cost, never $0', () => {
  const usage = { inputTokens: 100, outputTokens: 10, cacheReadTokens: 0, cacheWriteTokens: 0 };
  for (const model of ['auto', 'no-such-model', null, 'default']) {
    const s = commandSpend({ usage }, { model });
    assert.equal(s.cost_usd, null, String(model));
    assert.ok(s.tokens, 'its tokens are still saved');
  }
  assert.deepEqual(commandSpend({ result: 'x' }, { model: 'gpt-test' }), { model: 'gpt-test', tokens: null, cost_usd: null });
  assert.equal(commandSpend({ total_cost_usd: 0.4 }, {}).cost_usd, null, 'no usage, even with a total');
  assert.equal(codexSpend({}, { model: 'gpt-test' }).cost_usd, null);
});

test('0529 AC4: a Codex round that reports no usage saves an unknown cost, and status gives null', () => {
  const r = reviewRepo();
  assert.equal(r.runEnv({ SPECK_PRICES: prices, CODEX_HOME: codexHome('T1', ['gpt-test']) }, 'review', '1').status, 10);
  const m = r.roundFile(1).meta;
  assert.equal(m.cost_usd, null);
  assert.equal(m.tokens, null);
  assert.equal(status(r).reviewer_cost_usd, null);
});

test('0529 AC4, AC5: reviewer_cost_usd sums only the known costs, and rounds saved before read as they do today', () => {
  const v = { verdict: 'changes_requested', criteria: [], findings: [], summary: 's', escalation_question: '' };
  const old = { meta: { round: 1, reviewer: 'codex', usage: { input_tokens: 1000, output_tokens: 50 } }, verdict: { ...v, round: 1 } };
  assert.equal(reviewerCost([old]), null);
  assert.equal(reviewerCost([old, { meta: { cost_usd: null } }, { meta: { cost_usd: 0.25 } }, { meta: { cost_usd: 0.5 } }]), 0.75);
  assert.equal(reviewerCost(undefined), null);
  const r = reviewRepo();
  fs.writeFileSync(r.ticketFile, appendRounds(fs.readFileSync(r.ticketFile, 'utf8'), [old]));
  r.git('commit', '-qam', 'an old round');
  const t = status(r);
  assert.equal(t.reviewer_cost_usd, null);
  assert.deepEqual(t.rounds, [{ round: 1, reviewer: 'codex', verdict: 'changes_requested', seconds: null, tokens: 1050 }]);
  assert.deepEqual(ticketRounds(fs.readFileSync(r.ticketFile, 'utf8')).rounds[0], old);
});

test('0529 AC4: the brief names the status field that sums a ticket\'s round costs', () => {
  assert.match(fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8'), /`reviewer_cost_usd`/);
});

test('0529 AC1: a resumed Codex round whose earlier round reported no usage saves unknown tokens and cost', () => {
  const r = reviewRepo();
  const env = { SPECK_PRICES: prices, CODEX_HOME: codexHome('T1', ['gpt-test']) };
  assert.equal(r.runEnv(env, 'review', '1').status, 10);
  assert.deepEqual(r.roundFile(1).meta.usage, {});
  fs.writeFileSync(path.join(r.dir, 'a.txt'), 'fix\n');
  r.git('add', '-A'); r.git('commit', '-qm', 'fix 1');
  const resp = path.join(r.dir, '..', `resp-${path.basename(r.dir)}.md`);
  fs.writeFileSync(resp, '- F1: fixed.\n');
  assert.equal(r.runEnv({ ...env, FAKE_CODEX_EVENT: turn(codexUsage) }, 'review', '1', `--response=${resp}`).status, 10);
  const m = r.roundFile(2).meta;
  assert.equal(m.session, 'continued');
  assert.equal(m.tokens, null);
  assert.equal(m.cost_usd, null);
  assert.deepEqual(m.usage, codexUsage);
});
