// 0532: a Codex build's spend counts the sub-agents its session started, and theirs, each at its own model.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { builderSpend, sumParts } from '../scripts/spend.mjs';
import { priceFile } from './support/round-cost.mjs';

process.env.SPECK_PRICES = priceFile(); // openai/gpt-test: $2 a million input, $0.20 cached, $10 output
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} is not ${b}`);
const log = events => events.map(e => JSON.stringify(e)).join('\n');
const usage = (input, cached, output) => ({ input_tokens: input, cached_input_tokens: cached, cache_write_input_tokens: 0, output_tokens: output, reasoning_output_tokens: 7 });
const PARENT = usage(10000, 8000, 500);
const CODEX = log([{ type: 'thread.started', thread_id: 'P' }, { type: 'turn.started' }, { type: 'turn.completed', usage: PARENT }]);
const command = ['codex', 'exec', '--json', '-m', 'gpt-test', '$speck-build 0001'];
const price = u => (u.input_tokens - u.cached_input_tokens) * 0.000002 + u.cached_input_tokens * 0.0000002 + u.output_tokens * 0.00001;

// A Codex home with a sessions folder, and a way to add a rollout file to it: a session `id` started by `parent`
// (none for a top-level session) on `model`, whose token_count events report each usage in `usages` in turn.
function home() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-codex-0532-'));
  const day = path.join(dir, 'sessions', '2026', '10', '27');
  fs.mkdirSync(day, { recursive: true });
  const add = (id, { parent, model = 'gpt-test', usages = [], text, folder = day } = {}) => {
    fs.mkdirSync(folder, { recursive: true });
    const meta = { type: 'session_meta', payload: { id, base_instructions: { text: 'x'.repeat(200000) },
      ...(parent ? { source: { subagent: { thread_spawn: { parent_thread_id: parent, depth: 1 } } } } : { source: 'exec' }) } };
    const lines = [meta, { type: 'turn_context', payload: { model } },
      ...usages.map(u => ({ type: 'event_msg', payload: { type: 'token_count', info: { total_token_usage: u, last_token_usage: u } } }))];
    const file = path.join(folder, `rollout-2026-10-27T16-41-15-${id}.jsonl`);
    fs.writeFileSync(file, text ?? lines.map(l => JSON.stringify(l)).join('\n') + '\n');
    return file;
  };
  return { dir, day, add };
}
const withHome = (h, fn) => {
  const was = process.env.CODEX_HOME;
  process.env.CODEX_HOME = h.dir;
  try { return fn(); } finally { if (was === undefined) delete process.env.CODEX_HOME; else process.env.CODEX_HOME = was; }
};

// ---------- AC1 ----------

test('0532 AC1: a Codex build counts its sub-agents\' last total_token_usage with its own turn.completed tokens', () => {
  const h = home();
  const a = usage(14617, 0, 654), b = usage(14500, 1000, 717);
  h.add('A', { parent: 'P', usages: [usage(100, 0, 10), a] });
  h.add('B', { parent: 'P', usages: [b] });
  h.add('P', { usages: [PARENT] });
  h.add('X', { parent: 'OTHER', usages: [usage(999999, 0, 1)] }); // another session's sub-agent
  const s = withHome(h, () => builderSpend(CODEX, { command }));
  assert.equal(s.tokens, 10500 + 15271 + 15217);
});

test('0532 AC1: a sub-agent of a sub-agent counts, however deep, and each session once', () => {
  const h = home();
  h.add('A', { parent: 'P', usages: [usage(1000, 0, 100)] });
  h.add('A1', { parent: 'A', usages: [usage(2000, 0, 200)] });
  h.add('A2', { parent: 'A1', usages: [usage(3000, 0, 300)] });
  h.add('A2', { parent: 'A1', usages: [usage(3000, 0, 300)], folder: path.join(h.dir, 'sessions', '2026', '10', '28') }); // a second file for the same session
  h.add('LOOP', { parent: 'A2', usages: [usage(4, 0, 0)] });
  h.add('P', { parent: 'LOOP', usages: [usage(50, 0, 0)] }); // a loop back to the build's own thread doesn't count it again
  const s = withHome(h, () => builderSpend(CODEX, { command }));
  assert.equal(s.tokens, 10500 + 1100 + 2200 + 3300 + 4);
});

test('0532 AC1: the build\'s thread comes from its run record\'s session when its log has no thread.started line', () => {
  const h = home();
  h.add('S', { parent: 'P', usages: [usage(1000, 0, 100)] });
  const text = log([{ type: 'turn.completed', usage: PARENT }]);
  const s = withHome(h, () => builderSpend(text, { command, session: 'P' }));
  assert.equal(s.tokens, 10500 + 1100);
});

// ---------- AC2 ----------

test('0532 AC2: each sub-agent is priced at its own model and summed with any thread on the same model', () => {
  const h = home();
  const a = usage(14617, 0, 654), b = usage(14500, 1000, 717), c = usage(3000, 0, 50);
  h.add('A', { parent: 'P', usages: [a] });
  h.add('B', { parent: 'P', usages: [b] });
  h.add('C', { parent: 'P', model: 'other-test', usages: [c] });
  const s = withHome(h, () => builderSpend(CODEX, { command }));
  const gpt = s.models.find(m => m.model === 'gpt-test');
  assert.deepEqual(gpt.tokens, { input: 2000 + 14617 + 13500, cached: 8000 + 1000, write: 0, output: 500 + 654 + 717 });
  close(gpt.cost_usd, price(PARENT) + price(a) + price(b));
  const other = s.models.find(m => m.model === 'other-test');
  assert.deepEqual(other, { model: 'other-test', tokens: { input: 3000, cached: 0, write: 0, output: 50 }, cost_usd: null });
  assert.equal(s.models.length, 2);
  assert.equal(s.cost_usd, null, 'a sub-agent with no rates leaves the build\'s cost unknown');
  assert.deepEqual(sumParts([{ part: 'builder', ...s }]).total_cost_unknown, ['builder']);
});

test('0532 AC2: with rates for every model the build\'s cost is the sum of its threads\'', () => {
  const h = home();
  const a = usage(14617, 0, 654);
  h.add('A', { parent: 'P', usages: [a] });
  const s = withHome(h, () => builderSpend(CODEX, { command: ['codex', 'exec', '--json', '-m', 'other-test', 'x'] }));
  assert.equal(s.cost_usd, null, 'the parent\'s model has no rates');
  const t = withHome(h, () => builderSpend(CODEX, { command }));
  close(t.cost_usd, price(PARENT) + price(a));
  assert.deepEqual(sumParts([{ part: 'builder', ...t }]).total_cost_unknown, []);
});

// ---------- AC3 ----------

test('0532 AC3: a Codex build with no sub-agent sessions, or no sessions folder, records what it did before', () => {
  const h = home();
  h.add('P', { usages: [PARENT] });
  h.add('X', { parent: 'OTHER', usages: [usage(1, 0, 1)] });
  const expected = { tokens: 10500, cost_usd: price(PARENT), models: [{ model: 'gpt-test', tokens: { input: 2000, cached: 8000, write: 0, output: 500 }, cost_usd: price(PARENT) }] };
  const s = withHome(h, () => builderSpend(CODEX, { command }));
  assert.equal(s.tokens, expected.tokens); close(s.cost_usd, expected.cost_usd); close(s.models[0].cost_usd, expected.cost_usd);
  assert.deepEqual({ ...s, cost_usd: 0, models: [{ ...s.models[0], cost_usd: 0 }] }, { ...expected, cost_usd: 0, models: [{ ...expected.models[0], cost_usd: 0 }] });
  const none = { dir: path.join(h.dir, 'missing') };
  const t = withHome(none, () => builderSpend(CODEX, { command }));
  assert.deepEqual(t, s);
});

// ---------- AC4 ----------

test('0532 AC4: a sub-agent session file that can\'t be read or parsed is left out, and the rest still count', () => {
  const h = home();
  h.add('A', { parent: 'P', usages: [usage(1000, 0, 100)] });
  h.add('BAD', { text: '{"type":"session_meta","payload":{"id":"BAD","source":{"subagent":{"thread_spawn":{"parent_thread_id":"P"' });
  h.add('JUNK', { text: 'not json at all\n{]\n' });
  h.add('NOUSE', { parent: 'P', usages: [] }); // no token_count yet
  const odd = h.add('ODD', { parent: 'P', usages: [{ input_tokens: 'x', output_tokens: -1 }] });
  assert.ok(fs.existsSync(odd));
  const dirFile = path.join(h.day, 'rollout-2026-10-27T16-41-15-DIR.jsonl'); // a folder where a file should be
  fs.mkdirSync(dirFile);
  const s = withHome(h, () => builderSpend(CODEX, { command }));
  assert.equal(s.tokens, 10500 + 1100);
  assert.ok(s.models.every(m => m.model === 'gpt-test'));
  close(s.cost_usd, price(PARENT) + price(usage(1000, 0, 100)));
});

// ---------- AC5 ----------

test('0532 AC5: the brief names the sessions folder a Codex build\'s sub-agents are read from', () => {
  const brief = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8');
  assert.ok(brief.includes('`$CODEX_HOME/sessions/`'));
});
