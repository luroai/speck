// 0528: speck spend --backfill, past spend from Claude Code's transcripts and saved review rounds.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { backfillSpend, spendReport, spendOptions } from '../scripts/spend-view.mjs';
import { transcriptsDir, promptKind } from '../scripts/backfill.mjs';
import { builderSpent, watchSpent, earlierBuilds } from '../scripts/spend.mjs';
import { statusData, runsOf } from '../scripts/speck.mjs';
import { recordWatchSpend } from '../scripts/spend.mjs';
import { runRepo } from './support/run.mjs';

// A price table of round numbers, so each cost below can be worked out by hand: [input, cached, write, output] a token.
// Written in each test's own folder, as the folder for temporary files is emptied after each test.
const PRICES = JSON.stringify({ source: 'test', taken: '2026-10-27', models: {
  'claude-opus-5-5': [1e-6, 1e-7, 2e-6, 1e-5], 'claude-haiku-5-5': [1e-7, 1e-8, 2e-7, 1e-6],
  'gpt-6.1-sol': [2e-6, 2e-7, 2e-6, 2e-5], 'gpt-6.1-mini': [1e-6, 1e-7, 1e-6, 1e-5] } });

const close = (a, b) => assert.ok(a !== null && Math.abs(a - b) < 1e-9, `${a} is not ${b}`);
const jsonl = list => `${list.map(o => JSON.stringify(o)).join('\n')}\n`;
const command = id => `<command-message>speck-build</command-message>\n<command-name>/speck-build</command-name>\n<command-args>${id}</command-args>`;
const user = (content, timestamp) => ({ type: 'user', message: { role: 'user', content }, timestamp });
const said = (id, model, [i, c, w, o], timestamp) => ({ type: 'assistant', message: { id, model, role: 'assistant',
  usage: { input_tokens: i, cache_read_input_tokens: c, cache_creation_input_tokens: w, output_tokens: o } }, timestamp });
const rounds = list => `\n## Review rounds\n<!-- Written by speck after each review round. Don't edit it by hand. -->\n\n${list.map((meta, i) =>
  `<details><summary>Round ${i + 1} · codex · approve</summary>\n\n\`\`\`json\n${JSON.stringify({ meta: { round: i + 1, ...meta }, verdict: { round: i + 1, verdict: 'approve', summary: 's', findings: [] } })}\n\`\`\`\n\n</details>\n`).join('\n')}`;

// A project with tickets 0001 to 0003, a Claude Code home with its transcripts folder and a Codex home.
function setup({ transcripts = true } = {}) {
  const r = runRepo({ tickets: [['0001', { title: 'One' }], ['0002', { title: 'Two' }], ['0003', { title: 'Three' }]] });
  const claudeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-home-')), codexHome = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-home-'));
  process.env.SPECK_PRICES = path.join(claudeHome, 'prices.json');
  fs.writeFileSync(process.env.SPECK_PRICES, PRICES);
  const dir = transcriptsDir(r.dir, claudeHome), runs = runsOf(r.dir);
  if (transcripts) fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(runs, { recursive: true });
  const session = (name, lines, subagents = {}) => {
    fs.writeFileSync(path.join(dir, `${name}.jsonl`), jsonl(lines));
    for (const [agent, sub] of Object.entries(subagents)) {
      fs.mkdirSync(path.join(dir, name, 'subagents'), { recursive: true });
      fs.writeFileSync(path.join(dir, name, 'subagents', `agent-${agent}.jsonl`), jsonl(sub));
    }
  };
  const ticket = id => path.join(r.dir, 'speck', 'tickets', `${id}-t.md`);
  const backfill = () => backfillSpend(r.dir, { claudeHome, codexHome });
  return { r, dir, runs, claudeHome, codexHome, session, ticket, backfill };
}

// The build session of ticket 0001 the AC1 tests use: two messages on opus, the second written on two lines while it
// streamed, and a subagent on haiku whose transcript repeats the parent's first message, as a fork's does.
function buildSession(s, name = 'b1') {
  s.session(name, [
    { type: 'queue-operation', operation: 'enqueue', timestamp: '2026-10-10T10:00:00.000Z', content: '/speck-build 0001' },
    user(command('0001'), '2026-10-10T10:00:01.000Z'),
    said('m1', 'claude-opus-5-5', [10, 1000, 100, 50], '2026-10-10T10:00:02.000Z'),
    said('m2', 'claude-opus-5-5', [5, 2000, 0, 10], '2026-10-10T10:01:00.000Z'),
    said('m2', 'claude-opus-5-5', [5, 2000, 0, 200], '2026-10-10T10:01:01.000Z'),
    said('s0', '<synthetic>', [0, 0, 0, 0], '2026-10-10T10:01:02.000Z'),
  ], { a1: [
    said('m1', 'claude-opus-5-5', [10, 1000, 100, 50], '2026-10-10T10:00:02.000Z'),
    said('h1', 'claude-haiku-5-5', [100, 500, 0, 40], '2026-10-10T10:30:00.000Z'),
  ] });
}
// opus: input 15, cached 3000, writes 100, output 250; haiku: input 100, cached 500, output 40.
const OPUS = 15e-6 + 3000e-7 + 100 * 2e-6 + 250e-5, HAIKU = 100e-7 + 500e-8 + 40e-6;

// ---------- AC1 ----------

test('0528 AC1: a /speck-build session adds its spend to its ticket\'s builder, each message once, subagents too', () => {
  const s = setup();
  buildSession(s);
  s.backfill();
  const b = builderSpent(s.runs, '0001');
  assert.equal(b.tokens, 3365 + 640);
  close(b.cost_usd, OPUS + HAIKU);
  const byModel = Object.fromEntries(b.models.map(m => [m.model, m]));
  assert.deepEqual(byModel['claude-opus-5-5'].tokens, { input: 15, cached: 3000, write: 100, output: 250 });
  assert.deepEqual(byModel['claude-haiku-5-5'].tokens, { input: 100, cached: 500, write: 0, output: 40 });
  assert.equal(byModel['<synthetic>'], undefined);
  const parts = spendReport(s.r.dir, { by: 'week' });
  assert.equal(parts.rows.length, 1);
  const st = statusData(s.r.dir).tickets.find(t => t.id === '0001');
  close(st.builder_cost_usd, OPUS + HAIKU);
  close(st.total_cost_usd, OPUS + HAIKU);
});

test('0528 AC1: the spend is dated by the session\'s last message, a subagent\'s included', () => {
  const s = setup();
  buildSession(s);
  s.backfill();
  const lines = fs.readFileSync(path.join(s.runs, 'run.backfill-builds.jsonl'), 'utf8').trim().split('\n').map(l => JSON.parse(l));
  assert.equal(lines.length, 1);
  assert.equal(lines[0].ended, '2026-10-10T10:30:00.000Z');
  assert.equal(spendReport(s.r.dir, { since: '2026-10-10', until: '2026-10-10' }).rows.length, 1);
  assert.equal(spendReport(s.r.dir, { since: '2026-10-11' }).rows.length, 0);
});

test('0528 AC1: a session the ticket\'s run record already counts isn\'t added; one it lists without spend is', () => {
  const s = setup();
  buildSession(s, 'counted');
  buildSession(s, 'nospend');
  fs.writeFileSync(path.join(s.dir, 'nospend.jsonl'), fs.readFileSync(path.join(s.dir, 'nospend.jsonl'), 'utf8').replace(/0001/g, '0002'));
  fs.writeFileSync(path.join(s.runs, '0001.json'), JSON.stringify({ id: '0001', session: 'counted', exited: '2026-10-10T10:31:00.000Z', builder: { tokens: 7, cost_usd: 0.5 } }));
  fs.writeFileSync(path.join(s.runs, '0002.json'), JSON.stringify({ id: '0002', session: 'nospend', exited: '2026-10-10T10:31:00.000Z' }));
  s.backfill();
  assert.deepEqual(builderSpent(s.runs, '0001'), { tokens: 7, cost_usd: 0.5 });
  assert.equal(builderSpent(s.runs, '0002').tokens, 4005);
});

test('0528 AC1: a build still running, or a session that isn\'t a /speck-build of one ticket, isn\'t added', () => {
  const s = setup();
  buildSession(s, 'running');
  fs.writeFileSync(path.join(s.runs, '0001.json'), JSON.stringify({ id: '0001', session: 'running', started: '2026-10-10T10:00:00.000Z' }));
  s.session('chat', [user('Build 0002 for me', '2026-10-10T10:00:00.000Z'), said('x1', 'claude-opus-5-5', [1, 1, 1, 1], '2026-10-10T10:00:01.000Z')]);
  s.session('clear', [user('<command-name>/clear</command-name>\n<command-args></command-args>', '2026-10-10T10:00:00.000Z'), said('x2', 'claude-opus-5-5', [1, 1, 1, 1], '2026-10-10T10:00:01.000Z')]);
  s.session('more', [user(command('0002 and 0003'), '2026-10-10T10:00:00.000Z'), said('x3', 'claude-opus-5-5', [1, 1, 1, 1], '2026-10-10T10:00:01.000Z')]);
  fs.writeFileSync(path.join(s.dir, 'broken.jsonl'), 'not json\n{"type":\n');
  s.backfill();
  assert.equal(fs.existsSync(path.join(s.runs, 'run.backfill-builds.jsonl')), false);
  assert.equal(builderSpent(s.runs, '0002').tokens, null);
  assert.deepEqual(promptKind('/speck-build 7'), { kind: 'build', id: '0007' });
  assert.equal(promptKind('/speck-build __proto__'), null);
});

test('0528 AC1: the project folder is the checkout\'s path with each character that isn\'t a letter or digit as -', () => {
  assert.equal(transcriptsDir('/tmp/a.b/c_d-e', '/h'), path.join('/h', 'projects', '-tmp-a-b-c-d-e'));
});

// ---------- AC2 ----------

test('0528 AC2: a watch agent session is added to the watch agent spend of the ticket it looked into', () => {
  const s = setup();
  s.session('w1', [user('You are speck, watching the pipeline. Work on ticket 0002 stopped for a reason speck has no steps for.\nWhat happened: x', '2026-10-11T09:00:00.000Z'),
    said('w', 'claude-opus-5-5', [10, 0, 0, 10], '2026-10-11T09:00:05.000Z')]);
  s.session('w2', [user("You are speck's Foreman. Work on ticket 0003 stopped for a reason speck has no steps for.", '2026-10-11T09:00:00.000Z'),
    said('w', 'claude-opus-5-5', [20, 0, 0, 0], '2026-10-11T09:00:05.000Z')]);
  s.backfill();
  const two = watchSpent(s.runs, '0002');
  assert.equal(two.tokens, 20);
  close(two.cost_usd, 10e-6 + 10e-5);
  assert.equal(watchSpent(s.runs, '0003').tokens, 20);
  assert.equal(builderSpent(s.runs, '0002').tokens, null);
  const st = statusData(s.r.dir).tickets.find(t => t.id === '0002');
  close(st.watch_cost_usd, 10e-6 + 10e-5);
});

test('0528 AC2: a watch run speck run kept isn\'t added again, by its session or, without one, by when it ended', () => {
  const s = setup();
  const brief = id => `You are speck, watching the pipeline. Work on ticket ${id} stopped for a reason speck has no steps for.`;
  s.session('kept', [user(brief('0002'), '2026-10-11T09:00:00.000Z'), said('w', 'claude-opus-5-5', [10, 0, 0, 10], '2026-10-11T09:00:05.000Z')]);
  s.session('old', [user(brief('0003'), '2026-10-11T09:00:00.000Z'), said('w', 'claude-opus-5-5', [10, 0, 0, 10], '2026-10-11T09:00:05.000Z')]);
  // speck run's watch log names its session, and it keeps it with the run (0528).
  const log = path.join(s.runs, 'run.watch.log');
  fs.writeFileSync(log, jsonl([{ type: 'system', subtype: 'init', session_id: 'kept' }, { type: 'result', usage: { input_tokens: 1, output_tokens: 1 }, total_cost_usd: 0.25 }]));
  const kept = recordWatchSpend(s.runs, { id: '0002', run: 't1', command: ['claude'], log });
  assert.equal(kept.session, 'kept');
  fs.appendFileSync(path.join(s.runs, 'run.watch-spend.jsonl'), `${JSON.stringify({ id: '0003', run: 't0', ended: '2026-10-11T09:01:00.000Z', tokens: 2, cost_usd: 0.5 })}\n`);
  s.backfill();
  assert.deepEqual(watchSpent(s.runs, '0002'), { tokens: 2, cost_usd: 0.25 });
  assert.deepEqual(watchSpent(s.runs, '0003'), { tokens: 2, cost_usd: 0.5 });
});

// ---------- AC3 ----------

test('0528 AC3: a review round saved without a cost gets one, from its tokens and reviewer_model', () => {
  const s = setup();
  fs.appendFileSync(s.ticket('0001'), rounds([
    { reviewer: 'codex', reviewer_model: 'gpt-6.1-sol', thread_id: 't-a', usage: { input_tokens: 1000, cached_input_tokens: 600, output_tokens: 100 }, saved_at: '2026-10-09T10:00:00.000Z' },
    { reviewer: 'codex', reviewer_model: 'gpt-6.1-sol', model: 'gpt-6.1-sol', tokens: { input: 1, cached: 0, write: 0, output: 0 }, cost_usd: 0.75, saved_at: '2026-10-09T11:00:00.000Z' },
  ]));
  s.backfill();
  const st = statusData(s.r.dir).tickets.find(t => t.id === '0001');
  close(st.reviewer_cost_usd, 400 * 2e-6 + 600 * 2e-7 + 100 * 2e-5 + 0.75);
  assert.deepEqual(st.total_cost_unknown, []);
  const model = spendReport(s.r.dir, { by: 'model' }).rows.find(x => x.model === 'gpt-6.1-sol');
  assert.deepEqual(model.tokens, { input: 401, cached: 600, write: 0, output: 100 });
});

test('0528 AC3: a Codex round saved with default is priced at the model its session file records for its thread', () => {
  const s = setup();
  const day = path.join(s.codexHome, 'sessions', '2026', '10', '09');
  fs.mkdirSync(day, { recursive: true });
  fs.writeFileSync(path.join(day, 'rollout-2026-10-09T10-00-00-t-b.jsonl'), jsonl([{ type: 'turn_context', payload: { model: 'gpt-6.1-mini' } }]));
  fs.appendFileSync(s.ticket('0002'), rounds([
    { reviewer: 'codex', reviewer_model: 'default', thread_id: 't-b', usage: { input_tokens: 1000, cached_input_tokens: 0, output_tokens: 100 }, saved_at: '2026-10-09T10:00:00.000Z' },
    // Carried on the same thread: Codex reported the thread's totals, so the first round's are taken out.
    { reviewer: 'codex', reviewer_model: 'default', session: 'continued', thread_id: 't-b', usage: { input_tokens: 1500, cached_input_tokens: 0, output_tokens: 300 }, saved_at: '2026-10-09T10:05:00.000Z' },
    { reviewer: 'codex', reviewer_model: 'default', thread_id: 't-gone', usage: { input_tokens: 10, cached_input_tokens: 0, output_tokens: 10 }, saved_at: '2026-10-09T10:09:00.000Z' },
  ]));
  const lines = s.backfill();
  const st = statusData(s.r.dir).tickets.find(t => t.id === '0002');
  close(st.reviewer_cost_usd, (1000e-6 + 100e-5) + (500e-6 + 200e-5));
  assert.deepEqual(st.total_cost_unknown, ['reviewer'], 'the round whose model no session file records stays unknown');
  assert.ok(lines.some(l => /^0002: .*3 review rounds.*1 added with an unknown cost/.test(l)), lines.join('\n'));
});

// ---------- AC4 ----------

test('0528 AC4: running --backfill a second time changes nothing', () => {
  const s = setup();
  buildSession(s);
  s.session('w1', [user('You are speck, watching the pipeline. Work on ticket 0002 stopped for a reason.', '2026-10-11T09:00:00.000Z'), said('w', 'claude-opus-5-5', [10, 0, 0, 10], '2026-10-11T09:00:05.000Z')]);
  fs.appendFileSync(s.ticket('0003'), rounds([{ reviewer: 'codex', reviewer_model: 'gpt-6.1-sol', thread_id: 't', usage: { input_tokens: 10, cached_input_tokens: 0, output_tokens: 1 }, saved_at: '2026-10-09T10:00:00.000Z' }]));
  s.backfill();
  const files = () => Object.fromEntries(fs.readdirSync(s.runs).map(f => [f, fs.readFileSync(path.join(s.runs, f), 'utf8')]));
  const before = files(), report = spendReport(s.r.dir);
  const again = s.backfill();
  assert.deepEqual(files(), before);
  assert.deepEqual(spendReport(s.r.dir), report);
  assert.match(again.at(-1), /^Added 0 sessions and 0 review rounds across 0 tickets; skipped 3 as already counted; 0 added with an unknown cost\.$/);
});

test('0528 AC4: a backfilled session a later run record keeps, as its latest build or an earlier one, counts once', () => {
  const s = setup();
  buildSession(s, 'resumed');
  fs.writeFileSync(path.join(s.runs, '0001.json'), JSON.stringify({ id: '0001', session: 'resumed', exited: '2026-10-10T10:31:00.000Z' }));
  s.backfill();
  assert.equal(builderSpent(s.runs, '0001').tokens, 4005);
  // speck run resumed the session and recorded its whole spend: the backfilled copy is left out.
  fs.writeFileSync(path.join(s.runs, '0001.json'), JSON.stringify({ id: '0001', session: 'resumed', exited: '2026-10-12T10:00:00.000Z', builder: { tokens: 5000, cost_usd: 1 } }));
  assert.deepEqual(builderSpent(s.runs, '0001'), { tokens: 5000, cost_usd: 1 });
  // A new build carries it forward with its session, and it's still counted once.
  const earlier = earlierBuilds(s.runs, '0001');
  assert.deepEqual(earlier, [{ ended: '2026-10-12T10:00:00.000Z', tokens: 5000, cost_usd: 1, session: 'resumed' }]);
  fs.writeFileSync(path.join(s.runs, '0001.json'), JSON.stringify({ id: '0001', session: 'new', exited: '2026-10-13T10:00:00.000Z', builder: { tokens: 10, cost_usd: 0.1 }, earlier_builds: earlier }));
  assert.deepEqual(builderSpent(s.runs, '0001'), { tokens: 5010, cost_usd: 1.1 });
  assert.equal(statusData(s.r.dir).tickets.find(t => t.id === '0001').total_tokens, 5010);
});

test('0528 AC4: an earlier build kept without a session counts the session that ended within minutes of it', () => {
  const s = setup();
  buildSession(s, 'old');
  fs.writeFileSync(path.join(s.runs, '0001.json'), JSON.stringify({ id: '0001', session: 'new', exited: '2026-10-12T10:00:00.000Z', builder: { tokens: 10, cost_usd: 0.1 },
    earlier_builds: [{ ended: '2026-10-10T10:31:30.000Z', tokens: 4000, cost_usd: 0.2 }] }));
  const lines = s.backfill(), b = builderSpent(s.runs, '0001');
  assert.equal(b.tokens, 4010);
  close(b.cost_usd, 0.3);
  assert.match(lines[0], /^0001: added 0 build sessions, 0 watch agent sessions and 0 review rounds; skipped 1 as already counted; 0 added with an unknown cost\.$/);
});

// ---------- AC5 ----------

test('0528 AC5: it prints what it added and skipped for each ticket and how many have an unknown cost', () => {
  const s = setup();
  buildSession(s);
  s.session('nomodel', [user(command('0002'), '2026-10-10T10:00:00.000Z'), said('n1', 'some-unpriced-model', [1, 0, 0, 1], '2026-10-10T10:00:01.000Z')]);
  fs.appendFileSync(s.ticket('0003'), rounds([{ reviewer: 'codex', reviewer_model: 'gpt-6.1-sol', model: 'gpt-6.1-sol', tokens: { input: 1, cached: 0, write: 0, output: 0 }, cost_usd: 0.1, saved_at: '2026-10-09T10:00:00.000Z' }]));
  const lines = s.backfill();
  assert.deepEqual(lines, [
    '0001: added 1 build session, 0 watch agent sessions and 0 review rounds; skipped 0 as already counted; 0 added with an unknown cost.',
    '0002: added 1 build session, 0 watch agent sessions and 0 review rounds; skipped 0 as already counted; 1 added with an unknown cost.',
    '0003: added 0 build sessions, 0 watch agent sessions and 0 review rounds; skipped 1 as already counted; 0 added with an unknown cost.',
    'Added 2 sessions and 0 review rounds across 2 tickets; skipped 1 as already counted; 1 added with an unknown cost.',
  ]);
  assert.deepEqual(statusData(s.r.dir).tickets.find(t => t.id === '0002').total_cost_unknown, ['builder']);
});

test('0528 AC5: with no transcripts folder it says so and adds only the review rounds', () => {
  const s = setup({ transcripts: false });
  fs.appendFileSync(s.ticket('0001'), rounds([{ reviewer: 'codex', reviewer_model: 'gpt-6.1-sol', thread_id: 't', usage: { input_tokens: 10, cached_input_tokens: 0, output_tokens: 1 }, saved_at: '2026-10-09T10:00:00.000Z' }]));
  const lines = s.backfill();
  assert.equal(lines[0], `No Claude Code transcripts for this project in ${s.dir}, so only review rounds were added.`);
  assert.match(lines[1], /^0001: added 0 build sessions, 0 watch agent sessions and 1 review round;/);
  close(statusData(s.r.dir).tickets.find(t => t.id === '0001').reviewer_cost_usd, 10 * 2e-6 + 2e-5);
});

test('0528 AC5: --backfill is an option of speck spend, on its own', () => {
  assert.equal(spendOptions(['--backfill']).backfill, true);
  assert.throws(() => spendOptions(['--backfill', '--json']), /--backfill takes no other options/);
  assert.throws(() => spendOptions(['--backfill=yes']), /Unknown option/);
});

test('0528 AC5: a runs folder it can\'t write to gives a plain error saying what to do', () => {
  const s = setup();
  buildSession(s);
  fs.rmSync(s.runs, { recursive: true, force: true });
  fs.writeFileSync(s.runs, 'not a folder');
  assert.throws(() => s.backfill(), e => e.name === 'SpeckError' && /couldn't keep the spend it recovered/.test(e.message) && /run speck spend --backfill again/.test(e.message));
});

test('0528 AC5: the brief and speck\'s help name speck spend --backfill and cleanupPeriodDays', () => {
  const brief = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8');
  assert.match(brief, /`speck spend --backfill`/);
  assert.match(brief, /`cleanupPeriodDays`/);
  assert.match(fs.readFileSync(new URL('../scripts/speck.mjs', import.meta.url), 'utf8'), /--backfill recovers past spend/);
});
