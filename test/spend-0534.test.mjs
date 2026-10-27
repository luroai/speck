// 0534: a Codex session started in a ticket's worktree, however it was started, counts in that ticket's spend.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { recordDelegatedSpend, delegatedSpent, spendParts, sumParts, DELEGATED_SPEND, WATCH_SPEND, BACKFILL_BUILDS } from '../scripts/spend.mjs';
import { spendReport, spendLines } from '../scripts/spend-view.mjs';
import { priceFile } from './support/round-cost.mjs';
import { CLI, env, runRepo, startRun, until, stopRun, record } from './support/run.mjs';

process.env.SPECK_PRICES = priceFile(); // openai/gpt-test: $2 a million input, $0.20 cached, $10 output
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} is not ${b}`);
const usage = (input, cached, output) => ({ input_tokens: input, cached_input_tokens: cached, cache_write_input_tokens: 0, output_tokens: output, reasoning_output_tokens: 7 });
const price = u => (u.input_tokens - u.cached_input_tokens) * 0.000002 + u.cached_input_tokens * 0.0000002 + u.output_tokens * 0.00001;
const tmp = name => fs.mkdtempSync(path.join(os.tmpdir(), `speck-0534-${name}-`));

// A Codex home with a sessions folder, and a way to add a rollout file to it: session `id` run in folder `cwd`, started
// by `parent` (none for a top-level session) on `model`, whose token_count events report each usage in `usages`.
function home() {
  const dir = tmp('codex');
  const day = path.join(dir, 'sessions', '2026', '10', '27');
  fs.mkdirSync(day, { recursive: true });
  const add = (id, { cwd, parent, model = 'gpt-test', usages = [], text } = {}) => {
    const meta = { type: 'session_meta', payload: { id, timestamp: '2026-10-27T16:41:15Z', cwd, originator: 'codex_exec',
      ...(parent ? { source: { subagent: { thread_spawn: { parent_thread_id: parent, depth: 1 } } } } : { source: 'exec' }) } };
    const lines = [meta, { type: 'turn_context', payload: { model } },
      ...usages.map(u => ({ type: 'event_msg', payload: { type: 'token_count', info: { total_token_usage: u, last_token_usage: u } } }))];
    const file = path.join(day, `rollout-2026-10-27T16-41-15-${id}.jsonl`);
    fs.writeFileSync(file, text ?? lines.map(l => JSON.stringify(l)).join('\n') + '\n');
    return file;
  };
  return { dir, add };
}
// A worktree folder for a ticket, beside another ticket's whose name starts the same, and an empty runs folder.
function setup() {
  const base = tmp('wt');
  const wt = path.join(base, '0001-export'), other = path.join(base, '0001-export-2');
  fs.mkdirSync(path.join(wt, 'research', 'deep'), { recursive: true });
  fs.mkdirSync(other, { recursive: true });
  return { wt, other, base, runs: tmp('runs'), h: home() };
}
const kept = runs => { try { return fs.readFileSync(path.join(runs, DELEGATED_SPEND), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch { return []; } };
const record0 = (s, rounds = []) => recordDelegatedSpend(s.runs, '0001', { worktree: s.wt, rounds, home: s.h.dir });

// ---------- AC1 ----------

test('0534 AC1: a session run in the worktree or a folder inside it is recorded, counted and priced as a Codex build\'s', () => {
  const s = setup();
  const a = usage(10000, 8000, 500), b = usage(2000, 0, 100);
  s.h.add('A', { cwd: s.wt, usages: [usage(10, 0, 1), a] });
  s.h.add('B', { cwd: path.join(s.wt, 'research', 'deep'), usages: [b] });
  const got = record0(s);
  assert.deepEqual(got.map(x => x.thread).sort(), ['A', 'B']);
  const A = kept(s.runs).find(x => x.thread === 'A');
  assert.equal(A.id, '0001');
  assert.equal(A.tokens, 10500);
  close(A.cost_usd, price(a));
  assert.deepEqual(A.models, [{ model: 'gpt-test', tokens: { input: 2000, cached: 8000, write: 0, output: 500 }, cost_usd: A.cost_usd }]);
  assert.ok(!Number.isNaN(Date.parse(A.ended)));
  const t = delegatedSpent(s.runs, '0001');
  assert.equal(t.tokens, 10500 + 2100);
  close(t.cost_usd, price(a) + price(b));
});

test('0534 AC1: a session\'s sub-agents count with it, each at its own model (0532)', () => {
  const s = setup();
  const own = usage(1000, 0, 100), sub = usage(3000, 1000, 300), deep = usage(500, 0, 50);
  s.h.add('A', { cwd: s.wt, usages: [own] });
  s.h.add('A1', { cwd: s.wt, parent: 'A', model: 'gpt-other', usages: [sub] });
  s.h.add('A2', { cwd: s.wt, parent: 'A1', usages: [deep] });
  record0(s);
  const rows = kept(s.runs);
  assert.deepEqual(rows.map(x => x.thread), ['A'], 'its sub-agents aren\'t kept as sessions of their own');
  assert.equal(rows[0].tokens, 1100 + 3300 + 550);
  assert.deepEqual(rows[0].models.map(m => m.model).sort(), ['gpt-other', 'gpt-test']);
  assert.equal(rows[0].cost_usd, null, 'gpt-other has no rates, so the cost is unknown');
  close(rows[0].models.find(m => m.model === 'gpt-test').cost_usd, price(own) + price(deep));
});

test('0534 AC1: a sub-agent with usage counts when its parent has none, or its parent\'s file is missing or can\'t be parsed', () => {
  const s = setup();
  s.h.add('EMPTY', { cwd: s.wt }); // a parent with no token_count yet
  s.h.add('E1', { cwd: s.wt, parent: 'EMPTY', usages: [usage(1000, 0, 100)] });
  s.h.add('E2', { cwd: s.wt, parent: 'E1', usages: [usage(500, 0, 50)] });
  s.h.add('HALF', { text: `${JSON.stringify({ type: 'session_meta', payload: { id: 'HALF', cwd: s.wt, source: 'exec' } })}\n{"type":"event_msg","payload":{"type":"token_count","info":{"total_` });
  s.h.add('H1', { cwd: s.wt, parent: 'HALF', usages: [usage(3000, 0, 300)] });
  s.h.add('M1', { cwd: s.wt, parent: 'MISSING', usages: [usage(2000, 0, 200)] }); // its parent has no file
  s.h.add('BROKEN', { text: 'not json\n' });
  s.h.add('B1', { cwd: s.wt, parent: 'BROKEN', usages: [usage(4000, 0, 400)] });
  record0(s);
  const by = Object.fromEntries(kept(s.runs).map(x => [x.thread, x.tokens]));
  assert.deepEqual(by, { EMPTY: 1100 + 550, HALF: 3300, M1: 2200, B1: 4400 });
  assert.deepEqual(record0(s), [], 'and once');
  close(delegatedSpent(s.runs, '0001').cost_usd, [usage(1000, 0, 100), usage(500, 0, 50), usage(3000, 0, 300), usage(2000, 0, 200), usage(4000, 0, 400)].reduce((t, u) => t + price(u), 0));
});

test('0534 AC1: a session with no usage, and no sub-agent with any, records nothing until it has some', () => {
  const s = setup();
  s.h.add('LATER', { cwd: s.wt });
  assert.deepEqual(record0(s), []);
  s.h.add('LATER', { cwd: s.wt, usages: [usage(1000, 0, 100)] });
  assert.deepEqual(record0(s).map(x => x.tokens), [1100]);
});

test('0534 AC1: a session run outside the worktree, in another ticket\'s worktree or with no cwd, isn\'t counted', () => {
  const s = setup();
  s.h.add('OUT', { cwd: s.base, usages: [usage(100, 0, 10)] });
  s.h.add('OTHER', { cwd: s.other, usages: [usage(100, 0, 10)] });
  s.h.add('UP', { cwd: path.join(s.wt, '..', '0001-export-2'), usages: [usage(100, 0, 10)] });
  s.h.add('NONE', { usages: [usage(100, 0, 10)] });
  s.h.add('REL', { cwd: 'research', usages: [usage(100, 0, 10)] });
  assert.deepEqual(record0(s), []);
  assert.deepEqual(delegatedSpent(s.runs, '0001'), { tokens: null, cost_usd: null });
});

test('0534 AC1: speck run records a session started in the worktree when the build ends', async () => {
  const h = home();
  // A build that starts its ticket, as /speck-build does, then runs "Codex" in the worktree speck start printed.
  const fake = path.join(tmp('fake'), 'fake-build.cjs');
  fs.writeFileSync(fake, `
const { spawnSync } = require('node:child_process'), fs = require('node:fs'), path = require('node:path');
const out = spawnSync(process.execPath, [${JSON.stringify(CLI)}, 'start', process.argv[2]], { encoding: 'utf8' }).stdout.trim().split('\\n');
const wt = out[out.length - 1];
const lines = [{ type: 'session_meta', payload: { id: 'DELEGATED', cwd: wt, source: 'exec' } }, { type: 'turn_context', payload: { model: 'gpt-test' } },
  { type: 'event_msg', payload: { type: 'token_count', info: { total_token_usage: { input_tokens: 4000, cached_input_tokens: 0, output_tokens: 200 } } } }];
fs.writeFileSync(path.join(${JSON.stringify(h.dir)}, 'sessions', '2026', '10', '27', 'rollout-2026-10-27T16-41-15-DELEGATED.jsonl'), lines.map(l => JSON.stringify(l)).join('\\n') + '\\n');
process.stdout.write(JSON.stringify({ type: 'result', subtype: 'success', session_id: 's', usage: { input_tokens: 10, output_tokens: 0 }, total_cost_usd: 0.5 }) + '\\n');
`);
  const r = runRepo({ command: `"${process.execPath}" "${fake}" {id} {session}`, worktrees: 'true' });
  const run = startRun(r.dir, { CODEX_HOME: h.dir, SPECK_PRICES: process.env.SPECK_PRICES });
  try {
    assert.ok(await until(() => { try { return Object.hasOwn(record(r.dir, '0001'), 'exited') && kept(path.join(r.dir, 'speck', '.cache', 'runs')).length > 0; } catch { return false; } }, 20000), run.out());
  } finally { await stopRun(run); }
  const s = JSON.parse(spawnSync(process.execPath, [CLI, 'status', '--json'], { cwd: r.dir, encoding: 'utf8', env: { ...env, SPECK_PRICES: process.env.SPECK_PRICES } }).stdout).tickets.find(t => t.id === '0001');
  assert.equal(s.delegated_tokens, 4200);
  close(s.delegated_cost_usd, 4000 * 0.000002 + 200 * 0.00001);
  assert.equal(s.total_tokens, 4210);
  close(s.total_cost_usd, 0.5 + s.delegated_cost_usd);
});

// ---------- AC2 ----------

test('0534 AC2: each session counts once, however many builds of the ticket end', () => {
  const s = setup();
  s.h.add('A', { cwd: s.wt, usages: [usage(1000, 0, 100)] });
  assert.equal(record0(s).length, 1);
  assert.deepEqual(record0(s), []);
  s.h.add('B', { cwd: s.wt, usages: [usage(2000, 0, 100)] });
  assert.deepEqual(record0(s).map(x => x.thread), ['B']);
  assert.equal(kept(s.runs).length, 2);
  assert.equal(delegatedSpent(s.runs, '0001').tokens, 1100 + 2100);
  // A line kept twice by mistake still counts once.
  fs.appendFileSync(path.join(s.runs, DELEGATED_SPEND), `${JSON.stringify(kept(s.runs)[0])}\n`);
  assert.equal(delegatedSpent(s.runs, '0001').tokens, 1100 + 2100);
});

test('0534 AC2: a session counted as a build, review round or watch agent run, or a sub-agent of one, isn\'t counted again', () => {
  const s = setup();
  for (const id of ['BUILD', 'EARLIER', 'LOGGED', 'BACK', 'ROUND', 'WATCHED', 'WATCHSESSION', 'NEW'])
    s.h.add(id, { cwd: s.wt, usages: [usage(1000, 0, 100)] });
  s.h.add('ROUNDSUB', { cwd: s.wt, parent: 'ROUND', usages: [usage(5000, 0, 100)] });
  s.h.add('BUILDSUB', { cwd: s.wt, parent: 'BUILD', usages: [usage(5000, 0, 100)] });
  fs.writeFileSync(path.join(s.runs, '0001.json'), JSON.stringify({ id: '0001', session: 'BUILD', earlier_builds: [{ ended: null, tokens: 1, cost_usd: null, session: 'EARLIER' }] }));
  fs.writeFileSync(path.join(s.runs, '0001.log'), `${JSON.stringify({ type: 'thread.started', thread_id: 'LOGGED' })}\n`);
  fs.writeFileSync(path.join(s.runs, BACKFILL_BUILDS), `${JSON.stringify({ id: '0001', session: 'BACK', tokens: 1 })}\n`);
  fs.writeFileSync(path.join(s.runs, WATCH_SPEND), [{ id: '0002', run: 'w', thread: 'WATCHED' }, { id: '0001', run: 'v', session: 'WATCHSESSION' }].map(x => JSON.stringify(x)).join('\n') + '\n');
  const rounds = [{ meta: { round: 1, reviewer: 'codex', thread_id: 'ROUND' } }, null, { meta: null }];
  assert.deepEqual(record0(s, rounds).map(x => x.thread), ['NEW']);
});

// ---------- AC3 ----------

test('0534 AC3: the totals include delegated spend, and name it when a session has tokens but no known cost', () => {
  const s = setup();
  s.h.add('A', { cwd: s.wt, usages: [usage(1000, 0, 100)] });
  s.h.add('B', { cwd: s.wt, model: 'gpt-unpriced', usages: [usage(2000, 0, 100)] });
  record0(s);
  const parts = spendParts(s.runs, '0001', []);
  assert.deepEqual(parts.map(p => p.part), ['delegated', 'delegated']);
  const sum = sumParts(parts);
  assert.equal(sum.total_tokens, 1100 + 2100);
  close(sum.total_cost_usd, price(usage(1000, 0, 100)));
  assert.deepEqual(sum.total_cost_unknown, ['delegated']);
  assert.equal(delegatedSpent(s.runs, '0001').cost_usd, sum.total_cost_usd);
  assert.deepEqual(delegatedSpent(s.runs, '0002'), { tokens: null, cost_usd: null });
});

test('0534 AC3: speck status --json and speck spend give delegated spend as a part of its own', () => {
  const r = runRepo({ tickets: [['0001', {}], ['0002', {}]] });
  const runs = path.join(r.dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(runs, DELEGATED_SPEND), [
    { id: '0001', thread: 'A', ended: '2026-10-27T10:00:00.000Z', tokens: 4200, cost_usd: 0.25, models: [{ model: 'gpt-test', tokens: { input: 4000, cached: 0, write: 0, output: 200 }, cost_usd: 0.25 }] },
    { id: '0001', thread: 'B', ended: '2026-10-27T11:00:00.000Z', tokens: 100, cost_usd: null, models: [{ model: 'x', tokens: { input: 100, cached: 0, write: 0, output: 0 }, cost_usd: null }] },
    'not json',
  ].map(x => (typeof x === 'string' ? x : JSON.stringify(x))).join('\n') + '\n');
  fs.writeFileSync(path.join(runs, '0001.json'), JSON.stringify({ id: '0001', session: 's', exited: '2026-10-27T09:00:00.000Z', builder: { tokens: 1000, cost_usd: 1 } }));
  const tickets = JSON.parse(spawnSync(process.execPath, [CLI, 'status', '--json'], { cwd: r.dir, encoding: 'utf8', env }).stdout).tickets;
  const one = tickets.find(t => t.id === '0001'), two = tickets.find(t => t.id === '0002');
  assert.deepEqual([one.delegated_tokens, one.delegated_cost_usd], [4300, 0.25]);
  assert.deepEqual([two.delegated_tokens, two.delegated_cost_usd], [null, null]);
  assert.equal(one.total_tokens, 5300);
  close(one.total_cost_usd, 1.25);
  assert.deepEqual(one.total_cost_unknown, ['delegated']);
  const rep = spendReport(r.dir);
  assert.deepEqual(rep.rows[0].delegated, { cost_usd: 0.25, cost_unknown: true });
  close(rep.rows[0].total.cost_usd, 1.25);
  const lines = spendLines(rep);
  assert.match(lines[0], /^Ticket\s+Title\s+Builder\s+Reviewer\s+Watch\s+Delegated\s+Total\s+Tokens$/);
  assert.match(lines[1], /^0001\s+.*\$1\.00\s+-\s+-\s+at least \$0\.25\s+at least \$1\.25\s+5,300$/);
});

// ---------- AC4 ----------

test('0534 AC4: a missing sessions folder records nothing', () => {
  const s = setup();
  assert.deepEqual(recordDelegatedSpend(s.runs, '0001', { worktree: s.wt, home: path.join(s.base, 'no-codex') }), []);
  const file = path.join(s.base, 'a-file');
  fs.writeFileSync(file, 'x');
  assert.deepEqual(recordDelegatedSpend(s.runs, '0001', { worktree: s.wt, home: file }), []);
  assert.deepEqual(recordDelegatedSpend(s.runs, '0001', { worktree: path.join(s.base, 'gone'), home: s.h.dir }), []);
  assert.deepEqual(recordDelegatedSpend(s.runs, '0001', { home: s.h.dir }), []);
  assert.deepEqual(kept(s.runs), []);
});

test('0534 AC4: a session file that can\'t be read or parsed records nothing for it, and the rest are still recorded', () => {
  const s = setup();
  s.h.add('GOOD', { cwd: s.wt, usages: [usage(1000, 0, 100)] });
  s.h.add('BAD', { text: 'not json\n' });
  s.h.add('HALF', { text: `${JSON.stringify({ type: 'session_meta', payload: { id: 'HALF', cwd: s.wt } })}\n{"type":"event_msg","payload":{"type":"token_count","info":{"total_` });
  s.h.add('NOUSAGE', { cwd: s.wt });
  s.h.add('ARRAY', { text: '[1,2]\n' });
  const dir = s.h.add('DIR', { cwd: s.wt, usages: [usage(1, 0, 1)] });
  fs.rmSync(dir); fs.mkdirSync(dir); // a folder where the file should be
  assert.deepEqual(record0(s).map(x => x.thread), ['GOOD']);
});

// ---------- AC5 ----------

test('0534 AC5: the brief says speck run counts Codex sessions started in the ticket\'s worktree', () => {
  const brief = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8');
  for (const name of ['run.delegated-spend.jsonl', '`delegated_tokens`', '`delegated_cost_usd`', '`delegated`', '`codex exec`']) assert.ok(brief.includes(name), name);
});
