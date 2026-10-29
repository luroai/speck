// 0556: a build's end opens only the Codex session files that changed since the ticket's first build started.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { recordDelegatedSpend, DELEGATED_SPEND } from '../scripts/spend.mjs';
import { codexSessionsIn, codexSubagents } from '../scripts/round-cost.mjs';
import { priceFile } from './support/round-cost.mjs';

process.env.SPECK_PRICES = priceFile();
const usage = (input, output) => ({ input_tokens: input, cached_input_tokens: 0, cache_write_input_tokens: 0, output_tokens: output });
const tmp = name => fs.mkdtempSync(path.join(os.tmpdir(), `speck-0556-${name}-`));
const STARTED = '2026-10-29T12:00:00.000Z', START_MS = Date.parse(STARTED);

// A Codex home, a ticket's worktree and a runs folder, and a way to add a rollout file for session `id` run in the
// worktree (or `cwd`), started by `parent`, that last changed at `at` (milliseconds), in day folder `day`.
function setup() {
  const dir = tmp('codex'), wt = tmp('wt'), runs = tmp('runs');
  const add = (id, { parent, usages = [], at = START_MS + 60000, day = '2026/10/29', cwd = wt } = {}) => {
    const folder = path.join(dir, 'sessions', ...day.split('/'));
    fs.mkdirSync(folder, { recursive: true });
    const meta = { type: 'session_meta', payload: { id, cwd, source: parent ? { subagent: { thread_spawn: { parent_thread_id: parent, depth: 1 } } } : 'exec' } };
    const lines = [meta, { type: 'turn_context', payload: { model: 'gpt-test' } },
      ...usages.map(u => ({ type: 'event_msg', payload: { type: 'token_count', info: { total_token_usage: u } } }))];
    const file = path.join(folder, `rollout-${day.replaceAll('/', '-')}T10-00-00-${id}.jsonl`);
    fs.writeFileSync(file, lines.map(l => JSON.stringify(l)).join('\n') + '\n');
    fs.utimesSync(file, new Date(at), new Date(at));
    return file;
  };
  return { dir, wt, runs, add };
}
const kept = runs => { try { return fs.readFileSync(path.join(runs, DELEGATED_SPEND), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch { return []; } };
const record = (s, started) => recordDelegatedSpend(s.runs, '0001', { worktree: s.wt, rounds: [], home: s.dir, ...(started === undefined ? {} : { started }) });

// The files opened while `fn` runs, by any of the ways speck reads a session file.
function opened(fn) {
  const seen = new Set(), saved = { openSync: fs.openSync, readFileSync: fs.readFileSync, createReadStream: fs.createReadStream };
  const spy = name => (file, ...rest) => { if (typeof file === 'string') seen.add(path.resolve(file)); return saved[name].call(fs, file, ...rest); };
  for (const name of Object.keys(saved)) fs[name] = spy(name);
  try { return { result: fn(), seen }; } finally { Object.assign(fs, saved); }
}

// ---------- AC1 ----------

test('0556 AC1: sessions changed after the ticket started, with their sub-agents, are kept as without a start time', () => {
  const runOnce = started => {
    const s = setup();
    s.add('A', { usages: [usage(1000, 100)] });
    s.add('A1', { parent: 'A', usages: [usage(2000, 200)] });
    s.add('A2', { parent: 'A1', usages: [usage(300, 30)] });
    s.add('B', { usages: [usage(500, 50)], day: '2026/10/01', at: START_MS + 1000 }); // a session resumed later, in an old day folder
    s.add('B1', { parent: 'B', usages: [usage(40, 4)], day: '2026/10/01', at: START_MS });
    s.add('C', { usages: [] }); // no usage yet
    s.add('OUT', { cwd: tmp('elsewhere'), usages: [usage(9, 1)] });
    record(s, started);
    return kept(s.runs).map(({ ended, ...x }) => x).sort((a, b) => a.thread.localeCompare(b.thread));
  };
  const all = runOnce(undefined), recent = runOnce(STARTED);
  assert.deepEqual(recent.map(x => [x.thread, x.tokens]), [['A', 1100 + 2200 + 330], ['B', 550 + 44]]);
  assert.deepEqual(recent, all);
});

test('0556 AC1: codexSessionsIn and codexSubagents find the same recent sessions with a start time as without one', () => {
  const s = setup();
  s.add('A', { usages: [usage(1000, 100)] });
  s.add('A1', { parent: 'A', usages: [usage(2000, 200)], day: '2026/09/30' });
  const strip = list => list.map(({ ended, ...x }) => x);
  assert.deepEqual(strip(codexSessionsIn(s.wt, s.dir, { since: STARTED })), strip(codexSessionsIn(s.wt, s.dir)));
  assert.deepEqual(codexSubagents('A', s.dir, { since: STARTED }), codexSubagents('A', s.dir));
  assert.equal(codexSubagents('A', s.dir, { since: STARTED }).length, 1);
});

// ---------- AC2 ----------

test('0556 AC2: a session file that last changed before the ticket started is never opened, not even for its first line', () => {
  const s = setup();
  const fresh = s.add('NEW', { usages: [usage(1000, 100)] });
  const old = [
    s.add('OLD', { usages: [usage(7000, 700)], at: START_MS - 1, day: '2026/10/29' }),
    s.add('OLDER', { usages: [usage(7000, 700)], at: START_MS - 86400000, day: '2026/10/28' }),
    s.add('NEW1', { parent: 'NEW', usages: [usage(7000, 700)], at: START_MS - 5000 }), // a sub-agent's old file too
  ];
  const { result, seen } = opened(() => record(s, STARTED));
  assert.deepEqual(result.map(x => [x.thread, x.tokens]), [['NEW', 1100]]);
  for (const f of old) assert.ok(!seen.has(path.resolve(f)), `${path.basename(f)} was opened`);
  assert.ok(seen.has(path.resolve(fresh)), 'the recent file is read');
});

test('0556 AC2: a file changed exactly at the start time is read', () => {
  const s = setup();
  s.add('EDGE', { usages: [usage(10, 1)], at: START_MS });
  assert.deepEqual(record(s, STARTED).map(x => x.thread), ['EDGE']);
});

// ---------- AC3 ----------

test('0556 AC3: with no start time, or one that can\'t be read, every session file is read as today', () => {
  for (const started of [undefined, null, '', '   ', 'not a time', {}]) {
    const s = setup();
    const files = [s.add('OLD', { usages: [usage(100, 10)], at: START_MS - 86400000 * 30, day: '2026/09/29' }),
      s.add('NEW', { usages: [usage(200, 20)] })];
    const { result, seen } = opened(() => record(s, started));
    assert.deepEqual(result.map(x => x.thread).sort(), ['NEW', 'OLD'], `started: ${JSON.stringify(started)}`);
    for (const f of files) assert.ok(seen.has(path.resolve(f)));
  }
});

test('0556 AC1: a start time given as a Date or milliseconds limits the files as its ISO string does', () => {
  for (const started of [new Date(STARTED), START_MS]) {
    const s = setup();
    s.add('OLD', { usages: [usage(100, 10)], at: START_MS - 1000 });
    s.add('NEW', { usages: [usage(200, 20)] });
    assert.deepEqual(record(s, started).map(x => x.thread), ['NEW']);
  }
});

test('0556 AC1: speck run passes the ticket\'s start time when a build ends', () => {
  const src = fs.readFileSync(new URL('../scripts/run.mjs', import.meta.url), 'utf8');
  assert.match(src, /recordDelegatedSpend\([^\n]*started: t\.fm\.started/);
});
