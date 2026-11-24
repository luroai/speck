// 0718: a delegated Codex session that a later build carries on counts at its newest total, once.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { recordDelegatedSpend, delegatedSpent, spendParts, DELEGATED_SPEND, WATCH_SPEND } from '../scripts/spend.mjs';
import { priceFile } from './support/round-cost.mjs';

process.env.SPECK_PRICES = priceFile(); // openai/gpt-test: $2 a million input, $0.20 cached, $10 output
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} is not ${b}`);
const usage = (input, output) => ({ input_tokens: input, cached_input_tokens: 0, cache_write_input_tokens: 0, output_tokens: output, reasoning_output_tokens: 0 });
const price = u => u.input_tokens * 0.000002 + u.output_tokens * 0.00001;
const tmp = name => fs.mkdtempSync(path.join(os.tmpdir(), `speck-0718-${name}-`));

// A Codex home, a ticket's worktree and a runs folder, with a way to write (or rewrite) session `id`'s rollout file:
// run in `cwd`, started by `parent`, whose token_count events report each usage in `usages`.
function setup() {
  const dir = tmp('codex'), day = path.join(dir, 'sessions', '2026', '11', '24');
  fs.mkdirSync(day, { recursive: true });
  const wt = path.join(tmp('wt'), '0001-export');
  fs.mkdirSync(wt, { recursive: true });
  const add = (id, { parent, usages = [] } = {}) => {
    const meta = { type: 'session_meta', payload: { id, timestamp: '2026-11-24T10:00:00Z', cwd: wt, originator: 'codex_exec',
      ...(parent ? { source: { subagent: { thread_spawn: { parent_thread_id: parent, depth: 1 } } } } : { source: 'exec' }) } };
    const lines = [meta, { type: 'turn_context', payload: { model: 'gpt-test' } },
      ...usages.map(u => ({ type: 'event_msg', payload: { type: 'token_count', info: { total_token_usage: u, last_token_usage: u } } }))];
    fs.writeFileSync(path.join(day, `rollout-2026-11-24T10-00-00-${id}.jsonl`), lines.map(l => JSON.stringify(l)).join('\n') + '\n');
  };
  const runs = tmp('runs');
  const record = (id = '0001', rounds = []) => recordDelegatedSpend(runs, id, { worktree: wt, rounds, home: dir });
  const kept = () => { try { return fs.readFileSync(path.join(runs, DELEGATED_SPEND), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch { return []; } };
  return { add, runs, record, kept, wt };
}

test('0718 AC1: a session a later build carries on counts at its newest total, once', () => {
  const s = setup();
  const first = usage(1000, 100), later = usage(4000, 400);
  s.add('A', { usages: [first] });
  assert.deepEqual(s.record().map(x => x.tokens), [1100]);
  s.add('A', { usages: [first, later] });
  const got = s.record();
  assert.deepEqual(got.map(x => [x.thread, x.tokens]), [['A', 4400]]);
  close(got[0].cost_usd, price(later));
  const t = delegatedSpent(s.runs, '0001');
  assert.equal(t.tokens, 4400, 'the newest total, not the two added up');
  close(t.cost_usd, price(later));
  const parts = spendParts(s.runs, '0001', []).filter(p => p.part === 'delegated');
  assert.deepEqual(parts.map(p => p.tokens), [4400]);
});

test('0718 AC1: a session grown over several later builds counts once at its newest total', () => {
  const s = setup();
  s.add('A', { usages: [usage(1000, 100)] });
  s.add('B', { usages: [usage(500, 50)] });
  s.record();
  s.add('A', { usages: [usage(2000, 200)] });
  s.record();
  s.add('A', { usages: [usage(3000, 300)] });
  s.record();
  assert.equal(delegatedSpent(s.runs, '0001').tokens, 3300 + 550);
});

test('0718 AC2: a sub-agent started later under an already recorded session is counted', () => {
  const s = setup();
  const own = usage(1000, 100), sub = usage(2000, 200);
  s.add('A', { usages: [own] });
  s.record();
  s.add('A1', { parent: 'A', usages: [sub] });
  const got = s.record();
  assert.deepEqual(got.map(x => [x.thread, x.tokens]), [['A', 1100 + 2200]]);
  assert.ok(!s.kept().some(x => x.thread === 'A1'), 'the sub-agent counts with its session, not as one of its own');
  const t = delegatedSpent(s.runs, '0001');
  assert.equal(t.tokens, 3300);
  close(t.cost_usd, price(own) + price(sub));
});

test('0718 AC3: a session whose tokens haven\'t grown isn\'t counted again', () => {
  const s = setup();
  s.add('A', { usages: [usage(1000, 100)] });
  s.record();
  assert.deepEqual(s.record(), []);
  s.add('A', { usages: [usage(1000, 100)] }); // rewritten, same total
  assert.deepEqual(s.record(), []);
  s.add('A', { usages: [usage(500, 50)] }); // smaller
  assert.deepEqual(s.record(), []);
  assert.equal(s.kept().length, 1);
  assert.equal(delegatedSpent(s.runs, '0001').tokens, 1100);
});

test('0718 AC3: a session recorded for another ticket, a review round, a watch run or a build isn\'t counted, even grown', () => {
  const s = setup();
  for (const id of ['OTHER', 'ROUND', 'WATCHED', 'BUILD']) s.add(id, { usages: [usage(1000, 100)] });
  fs.writeFileSync(path.join(s.runs, DELEGATED_SPEND), `${JSON.stringify({ id: '0002', thread: 'OTHER', tokens: 1100 })}\n`);
  fs.writeFileSync(path.join(s.runs, WATCH_SPEND), `${JSON.stringify({ id: '0001', run: 'w', thread: 'WATCHED' })}\n`);
  fs.writeFileSync(path.join(s.runs, '0001.json'), JSON.stringify({ id: '0001', session: 'BUILD' }));
  const rounds = [{ meta: { round: 1, reviewer: 'codex', thread_id: 'ROUND' } }];
  assert.deepEqual(s.record('0001', rounds), []);
  for (const id of ['OTHER', 'ROUND', 'WATCHED', 'BUILD']) s.add(id, { usages: [usage(9000, 900)] });
  assert.deepEqual(s.record('0001', rounds), []);
  assert.deepEqual(delegatedSpent(s.runs, '0001'), { tokens: null, cost_usd: null });
  assert.equal(delegatedSpent(s.runs, '0002').tokens, 1100, 'the other ticket keeps what it recorded');
});
