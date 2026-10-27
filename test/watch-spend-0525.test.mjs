// 0525: each watch agent run's tokens and cost are added to the ticket it looked into.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { foremanAgentQueue, foremanArgv } from '../scripts/foreman-agent.mjs';
import { recordWatchSpend, watchSpent, builderSpend } from '../scripts/spend.mjs';
import { statusData, loadConfig, runsOf } from '../scripts/speck.mjs';
import { T } from './support/panel.mjs';
import { blockedRepo } from './support/blocked.mjs';
import { runRepo } from './support/run.mjs';
import { priceFile } from './support/round-cost.mjs';

process.env.SPECK_PRICES = priceFile(); // openai/gpt-test and anthropic/claude-test
process.env.CODEX_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-codex-none-')); // no sessions
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} is not ${b}`);
const log = events => events.map(e => JSON.stringify(e)).join('\n');

// gpt-test: $2 a million input, $0.20 cached, $10 output.
const CLAUDE = log([{ type: 'system', subtype: 'init', session_id: 's' }, { type: 'assistant', message: {} },
  { type: 'result', subtype: 'success', session_id: 's', total_cost_usd: 0.25,
    modelUsage: { 'claude-opus-5-5': { inputTokens: 10, outputTokens: 90, cacheReadInputTokens: 900, cacheCreationInputTokens: 0, costUSD: 0.25 } } }]);
const codexUsage = { input_tokens: 10000, cached_input_tokens: 8000, output_tokens: 500 };
const CODEX = log([{ type: 'thread.started', thread_id: 'T525' }, { type: 'turn.completed', usage: codexUsage }]);
const CODEX_COST = 2000 * 0.000002 + 8000 * 0.0000002 + 500 * 0.00001;
const CURSOR = log([{ type: 'system', subtype: 'init', session_id: 's' }, { type: 'result', subtype: 'success', usage: { inputTokens: 1000, outputTokens: 10, cacheReadTokens: 0, cacheWriteTokens: 0 } }]);
const KILLED = log([{ type: 'system', subtype: 'init', session_id: 's' }, { type: 'assistant', message: {} }]);

// The watch agent's queue in a repo whose config sets `cfg`, with a stand-in for starting the agent that writes `text`
// to its log as its run ends (end()).
function watch(r, cfg = {}) {
  const starts = [], said = [], live = new Set();
  const q = foremanAgentQueue({ repo: r.dir, runs: () => r.runs, readConfig: () => ({ ...loadConfig(r.dir), watch: 'fix', ...cfg }),
    words: [], cfg: { base_branch: 'main', branch_prefix: 'speck/' }, max: 1, running: new Set(), ships: { again() {} }, say: m => said.push(m),
    startBuild() {}, providers: [], cantStart: () => '',
    start: (argv, cwd, file) => { const pid = 91000 + starts.length; fs.writeFileSync(file, ''); starts.push({ argv, file, pid }); live.add(pid); return { pid, exited: () => !live.has(pid) }; },
    alive: pid => live.has(pid), withToken: () => [] });
  const end = (text, at = null) => { const s = starts.at(-1); fs.writeFileSync(s.file, text); if (at) fs.utimesSync(s.file, at, at); live.delete(s.pid); };
  return { q, starts, said, end, check: (tickets = [T('0001', 'building'), T('0002', 'building')]) => q.check(tickets) };
}
const lookInto = (w, id) => { w.q.stuck({ id, what: 'its build ended with the ticket still building', log: '' }); w.check(); };
const spendLines = r => { try { return fs.readFileSync(path.join(r.runs, 'run.watch-spend.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch { return []; } };

// ---------- AC1 ----------

test('0525 AC1: a watch agent run that ends with a result line keeps its spend for its ticket, read as a build\'s, with the time it ended', () => {
  const r = blockedRepo({ status: 'building' }), w = watch(r);
  lookInto(w, '0001');
  assert.equal(w.starts.length, 1);
  const at = new Date('2026-10-27T09:30:00.000Z');
  w.end(CLAUDE, at);
  w.check();
  const kept = spendLines(r);
  assert.equal(kept.length, 1);
  assert.equal(kept[0].id, '0001');
  assert.equal(kept[0].ended, at.toISOString());
  const b = builderSpend(CLAUDE);
  assert.equal(kept[0].tokens, b.tokens);
  assert.equal(kept[0].cost_usd, 0.25);
  assert.deepEqual(kept[0].models, b.models);
});

test('0525 AC1: it\'s kept before the next run replaces the log, and each run counts once', () => {
  const r = blockedRepo({ status: 'building' }), w = watch(r);
  lookInto(w, '0001');
  w.end(CLAUDE);
  w.q.stuck({ id: '0002', what: 'its build ended with the ticket still building', log: '' });
  w.check(); // finishes 0001's run, then starts 0002's, which replaces the log
  assert.equal(w.starts.length, 2);
  assert.equal(fs.readFileSync(w.starts[1].file, 'utf8'), '', 'the log was replaced');
  assert.deepEqual(spendLines(r).map(x => x.id), ['0001']);
  w.check(); w.check();
  assert.equal(spendLines(r).length, 1, 'counted once');
  // Recording the same run again, as a later speck run might, adds nothing.
  const file = path.join(r.runs, 'again.log');
  fs.writeFileSync(file, CLAUDE);
  const run = spendLines(r)[0].run;
  assert.equal(recordWatchSpend(r.runs, { id: '0001', run, log: file }), null);
  assert.equal(spendLines(r).length, 1);
});

// ---------- AC2 ----------

test('0525 AC2: speck status --json gives watch_tokens and watch_cost_usd summed over each run, null for a ticket never looked into', () => {
  const r = runRepo();
  const runs = runsOf(r.dir);
  fs.mkdirSync(runs, { recursive: true });
  const file = path.join(runs, 'w.log');
  fs.writeFileSync(file, CLAUDE);
  recordWatchSpend(runs, { id: '0001', run: 'a', log: file });
  fs.writeFileSync(file, CODEX);
  recordWatchSpend(runs, { id: '0001', run: 'b', command: ['codex', 'exec', '--json', '-m', 'gpt-test'], log: file });
  const t = statusData(r.dir).tickets.find(x => x.id === '0001');
  assert.equal(t.watch_tokens, 1000 + 10500);
  close(t.watch_cost_usd, 0.25 + CODEX_COST);
  const others = statusData(r.dir).tickets.filter(x => x.id !== '0001');
  for (const o of others) { assert.equal(o.watch_tokens, null); assert.equal(o.watch_cost_usd, null); }
  assert.deepEqual(watchSpent(runs, '0009'), { tokens: null, cost_usd: null });
  assert.deepEqual(watchSpent(fs.mkdtempSync(path.join(os.tmpdir(), 'none-')), '0001'), { tokens: null, cost_usd: null }, 'no file at all');
});

test('0525 AC2: malformed lines and odd ids are skipped', () => {
  const runs = fs.mkdtempSync(path.join(os.tmpdir(), 'runs-'));
  fs.writeFileSync(path.join(runs, 'run.watch-spend.jsonl'), ['not json', '[]', 'null', JSON.stringify({ id: '0001', run: 'x', tokens: 'many', cost_usd: -1 }),
    JSON.stringify({ id: '0001', run: 'y', tokens: 5, cost_usd: 0.5 }), JSON.stringify({ id: '0001', run: 'y', tokens: 5, cost_usd: 0.5 }),
    JSON.stringify({ id: '__proto__', run: 'z', tokens: 9, cost_usd: 9 })].join('\n'));
  assert.deepEqual(watchSpent(runs, '0001'), { tokens: 5, cost_usd: 0.5 }, 'the same run once');
  assert.deepEqual(watchSpent(runs, 'constructor'), { tokens: null, cost_usd: null });
  assert.deepEqual(watchSpent(runs, '../x'), { tokens: null, cost_usd: null });
});

// ---------- AC3 ----------

test('0525 AC3: a Codex watch agent run is priced from the price table at its -m model', () => {
  const r = blockedRepo({ status: 'building' }), w = watch(r, { watch_agent: 'codex', watch_model: 'gpt-test' });
  lookInto(w, '0001');
  assert.ok(w.starts[0].argv.includes('-m'));
  w.end(CODEX);
  w.check();
  const [k] = spendLines(r);
  assert.equal(k.models[0].model, 'gpt-test');
  close(k.cost_usd, CODEX_COST);
  assert.equal(k.tokens, 10500);
});

test('0525 AC3: a Cursor watch agent run on a model with no rates keeps its tokens with an unknown cost', () => {
  const r = blockedRepo({ status: 'building' }), w = watch(r, { watch_agent: 'cursor', watch_model: 'auto' });
  lookInto(w, '0001');
  assert.ok(foremanArgv({ watch_agent: 'cursor', watch_model: 'auto' }, 'b', 'agent').includes('--model'));
  w.end(CURSOR);
  w.check();
  const [k] = spendLines(r);
  assert.equal(k.tokens, 1010);
  assert.equal(k.cost_usd, null);
  assert.equal(k.models[0].model, 'auto');
  const t = watchSpent(r.runs, '0001');
  assert.equal(t.tokens, 1010);
  assert.equal(t.cost_usd, null);
});

// ---------- AC4 ----------

test('0525 AC4: a run that ends without a result line, such as a killed one, adds nothing, and no other ticket changes', () => {
  const r = blockedRepo({ status: 'building' }), w = watch(r);
  lookInto(w, '0002');
  w.end(CLAUDE);
  w.check();
  const before = { one: watchSpent(r.runs, '0001'), two: watchSpent(r.runs, '0002') };
  lookInto(w, '0001');
  w.end(KILLED);
  w.check();
  assert.deepEqual(watchSpent(r.runs, '0001'), before.one);
  assert.deepEqual(before.one, { tokens: null, cost_usd: null });
  assert.deepEqual(watchSpent(r.runs, '0002'), before.two);
  assert.equal(spendLines(r).length, 1);
  // One that ended with an empty log, or none, adds nothing too.
  assert.equal(recordWatchSpend(r.runs, { id: '0001', run: 'q', log: path.join(r.runs, 'missing.log') }), null);
  assert.equal(spendLines(r).length, 1);
});

test('0525: the brief names the watch agent\'s spend file and status fields', () => {
  const brief = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8');
  for (const name of ['run.watch-spend.jsonl', '`watch_tokens`', '`watch_cost_usd`']) assert.ok(brief.includes(name), name);
});
