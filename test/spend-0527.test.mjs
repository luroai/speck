// 0527: speck spend, what the project's tickets spent on AI, by ticket, model, week or month.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spendReport, spendLines, spendOptions } from '../scripts/spend-view.mjs';
import { statusData, runsOf, runCommand } from '../scripts/speck.mjs';
import { runRepo, ROOT } from './support/run.mjs';

// Local times, so weeks and months are the ones a reader here would see.
const at = (m, d, h) => new Date(2026, m - 1, d, h, 30).toISOString();
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} is not ${b}`);
const opus = (input, cached, write, output, cost_usd) => ({ model: 'claude-opus-5-5', tokens: { input, cached, write, output }, cost_usd });
// A review round block as speck writes it under ## Review rounds.
const rounds = list => `\n## Review rounds\n<!-- Written by speck after each review round. Don't edit it by hand. -->\n\n${list.map((meta, i) =>
  `<details><summary>Round ${i + 1} · codex · approve</summary>\n\n\`\`\`json\n${JSON.stringify({ meta: { round: i + 1, ...meta }, verdict: { round: i + 1, verdict: 'approve', summary: 's', findings: [] } })}\n\`\`\`\n\n</details>\n`).join('\n')}`;

// Ticket 0001 has two builds (Tue 20 and Sun 25 Oct), a review round (Mon 26 Oct) and a watch agent run (Mon 2 Nov).
// Ticket 0002 has one build with tokens but no cost or model (Wed 21 Oct). Ticket 0003 spent nothing.
function repo({ spend = true } = {}) {
  const r = runRepo({ tickets: [['0001', { title: 'Ticket one' }], ['0002', { title: 'Ticket two' }], ['0003', { title: 'Ticket three' }]] });
  if (!spend) return r;
  const runs = runsOf(r.dir);
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(runs, '0001.json'), JSON.stringify({ exited: at(10, 25, 23),
    builder: { tokens: 2000, cost_usd: 2, models: [opus(200, 1600, 100, 100, 2)] },
    earlier_builds: [{ ended: at(10, 20, 10), tokens: 1000, cost_usd: 1, models: [opus(100, 800, 50, 50, 1)] }] }));
  fs.writeFileSync(path.join(runs, '0002.json'), JSON.stringify({ exited: at(10, 21, 9), builder: { tokens: 500, cost_usd: null } }));
  fs.writeFileSync(path.join(runs, 'run.watch-spend.jsonl'), `${JSON.stringify({ id: '0001', run: 'w1', ended: at(11, 2, 9), tokens: 300, cost_usd: 0.3, models: [opus(30, 200, 20, 50, 0.3)] })}\n`);
  const file = path.join(r.dir, 'speck', 'tickets', '0001-t.md');
  fs.appendFileSync(file, rounds([{ reviewer: 'codex', model: 'gpt-6.1-sol', tokens: { input: 10, cached: 20, write: 0, output: 5 }, cost_usd: 0.1, saved_at: at(10, 26, 0) }]));
  return r;
}
const cli = (r, ...args) => runCommand(['spend', ...args], { cwd: r.dir });

// ---------- AC1 ----------

test('0527 AC1: one line per ticket with spend, its builder, reviewer, watch, total cost and tokens, then the totals', () => {
  const r = repo(), rep = spendReport(r.dir);
  assert.deepEqual(rep.rows.map(x => x.id), ['0001', '0002']);
  const [one, two] = rep.rows;
  assert.equal(one.title, 'Ticket one');
  close(one.builder.cost_usd, 3); close(one.reviewer.cost_usd, 0.1); close(one.watch.cost_usd, 0.3); close(one.total.cost_usd, 3.4);
  assert.equal(one.tokens, 3000 + 35 + 300);
  assert.deepEqual([two.builder.cost_usd, two.builder.cost_unknown, two.reviewer.cost_usd, two.reviewer.cost_unknown], [null, true, null, false]);
  assert.equal(two.tokens, 500);
  close(rep.totals.cost_usd, 3.4);
  assert.equal(rep.totals.tokens, 3835);
  assert.equal(rep.totals.tickets_with_unknown_cost, 1);
  const lines = spendLines(rep);
  assert.equal(lines.length, 4, lines.join('\n'));
  assert.match(lines[1], /^0001\s+Ticket one\s+\$3\.00\s+\$0\.10\s+\$0\.30\s+\$3\.40\s+3,335$/);
  assert.match(lines[2], /^0002\s+Ticket two\s+unknown\s+-\s+-\s+unknown\s+500$/);
  assert.doesNotMatch(lines[2], /\$0/);
  assert.match(lines[3], /at least \$3\.40/);
  assert.match(lines[3], /3,835 tokens/);
  assert.match(lines[3], /1 ticket has a part with an unknown cost/);
});

test('0527 AC1: each ticket\'s total is the one speck status --json gives', () => {
  const r = repo(), rep = spendReport(r.dir), status = statusData(r.dir).tickets;
  for (const row of rep.rows) {
    const s = status.find(t => t.id === row.id);
    assert.equal(row.total.cost_usd, s.total_cost_usd, row.id);
    assert.equal(row.tokens, s.total_tokens, row.id);
    assert.deepEqual(row.total_cost_unknown, s.total_cost_unknown, row.id);
  }
});

test('0527 AC1: with no recorded spend it prints one line saying so', () => {
  const r = repo({ spend: false }), out = cli(r);
  assert.equal(out.status, 0, out.stderr);
  assert.equal(out.stdout.trim(), 'No AI spend recorded.');
});

// ---------- AC2 ----------

test('0527 AC2: --by=model gives each model its split tokens and cost, unknown models grouped, then the totals', () => {
  const r = repo(), rep = spendReport(r.dir, { by: 'model' });
  assert.deepEqual(rep.rows.map(x => x.model), ['claude-opus-5-5', 'gpt-6.1-sol', 'unknown model']);
  const [o, g, u] = rep.rows;
  assert.deepEqual(o.tokens, { input: 330, cached: 2600, write: 170, output: 200 });
  close(o.cost_usd, 3.3);
  assert.deepEqual(g.tokens, { input: 10, cached: 20, write: 0, output: 5 });
  close(g.cost_usd, 0.1);
  assert.equal(u.total_tokens, 500);
  assert.deepEqual([u.cost_usd, u.cost_unknown], [null, true]);
  const lines = spendLines(rep);
  assert.equal(lines.length, 5);
  assert.match(lines[1], /^claude-opus-5-5\s+330\s+2,600\s+170\s+200\s+3,300\s+\$3\.30$/);
  assert.match(lines[3], /^unknown model\s.*unknown$/);
  assert.match(lines[4], /at least \$3\.40, 3,835 tokens/);
});

test('0527 AC2: an old review round with no model of its own counts under its reviewer_model, or else "unknown model"', () => {
  const r = runRepo({ tickets: [['0001', { title: 'Old' }]] });
  fs.appendFileSync(path.join(r.dir, 'speck', 'tickets', '0001-t.md'), rounds([
    { reviewer_model: 'gpt-6.1-sol', usage: { input_tokens: 40, output_tokens: 2 }, cost_usd: 0.01, saved_at: at(10, 5, 9) },
    { reviewer_model: 'default', usage: { input_tokens: 7, output_tokens: 1 }, saved_at: at(10, 5, 10) }]));
  const rows = spendReport(r.dir, { by: 'model' }).rows;
  assert.deepEqual(rows.map(x => [x.model, x.total_tokens, x.cost_usd, x.cost_unknown]), [['gpt-6.1-sol', 42, 0.01, false], ['unknown model', 8, null, true]]);
  assert.deepEqual(rows.map(x => x.tokens), [{ input: 40, cached: 0, write: 0, output: 2 }, { input: 7, cached: 0, write: 0, output: 1 }]);
});

test('0527 AC2: an old round\'s split takes the cached input out of the input as its reviewer counts it, and adds up to its tokens', () => {
  const r = runRepo({ tickets: [['0001', { title: 'Old' }]] });
  fs.appendFileSync(path.join(r.dir, 'speck', 'tickets', '0001-t.md'), rounds([
    { model: 'gpt-6.1-sol', usage: { input_tokens: 1000, cached_input_tokens: 800, output_tokens: 20 }, cost_usd: 0.01 },
    { model: 'cursor-x', usage: { inputTokens: 500, cacheReadTokens: 300, outputTokens: 5 }, cost_usd: 0.01 },
    { model: 'claude-opus-5-5', usage: { input_tokens: 9, cache_read_input_tokens: 4000, output_tokens: 3 }, cost_usd: 0.01 }]));
  const rows = spendReport(r.dir, { by: 'model' }).rows;
  assert.deepEqual(rows.map(x => [x.model, x.tokens, x.total_tokens]), [
    ['claude-opus-5-5', { input: 9, cached: 0, write: 0, output: 3 }, 12],
    ['cursor-x', { input: 200, cached: 300, write: 0, output: 5 }, 505],
    ['gpt-6.1-sol', { input: 200, cached: 800, write: 0, output: 20 }, 1020]]);
  assert.equal(spendReport(r.dir).rows[0].tokens, 12 + 505 + 1020);
});

// ---------- AC3 ----------

test('0527 AC3: --by=week names each week by its Monday and counts each part in the week it ended, so a ticket can fall in two', () => {
  const r = repo(), rep = spendReport(r.dir, { by: 'week' });
  assert.deepEqual(rep.rows.map(x => [x.week, x.tokens]), [['2026-10-19', 3500], ['2026-10-26', 35], ['2026-11-02', 300]]);
  close(rep.rows[0].cost_usd, 3);
  assert.equal(rep.rows[0].cost_unknown, true);
  close(rep.rows[1].cost_usd, 0.1);
  const lines = spendLines(rep);
  assert.match(lines[1], /^2026-10-19\s+at least \$3\.00\s+3,500$/);
  assert.match(lines.at(-1), /at least \$3\.40, 3,835 tokens/);
});

test('0527 AC3: --by=month gives one line per calendar month', () => {
  const rep = spendReport(repo().dir, { by: 'month' });
  assert.deepEqual(rep.rows.map(x => [x.month, x.tokens]), [['2026-10', 3535], ['2026-11', 300]]);
  close(rep.rows[0].cost_usd, 3.1); close(rep.rows[1].cost_usd, 0.3);
});

// ---------- AC4 ----------

test('0527 AC4: --since and --until count only spend that ended on or after, and on or before, those days', () => {
  const r = repo();
  const since = spendReport(r.dir, spendOptions(['--since=2026-10-26']));
  assert.deepEqual(since.rows.map(x => x.id), ['0001']);
  assert.deepEqual([since.rows[0].builder.cost_usd, since.rows[0].reviewer.cost_usd, since.rows[0].watch.cost_usd], [null, 0.1, 0.3]);
  assert.equal(spendLines(since)[1].split(/\s{2,}/)[2], '-');
  const until = spendReport(r.dir, spendOptions(['--until=2026-10-25', '--by=month']));
  assert.deepEqual(until.rows.map(x => [x.month, x.tokens]), [['2026-10', 3500]]);
  const both = spendReport(r.dir, spendOptions(['--since=2026-10-21', '--until=2026-10-21', '--by=model']));
  assert.deepEqual(both.rows.map(x => x.model), ['unknown model']);
  assert.equal(spendLines(spendReport(r.dir, spendOptions(['--since=2027-01-01'])))[0], 'No AI spend recorded from 2027-01-01.');
});

test('0527 AC4: a date that isn\'t a real YYYY-MM-DD date, or a --since after the --until, is refused with why', () => {
  const r = repo();
  for (const bad of ['--since=2026-02-30', '--until=2026-1-05', '--since=yesterday', '--until=', '--since']) {
    const out = cli(r, bad);
    assert.notEqual(out.status, 0, bad);
    assert.match(out.stderr, /isn't a date: give a real day as YYYY-MM-DD/, bad);
    assert.equal(out.stdout, '', bad);
  }
  const out = cli(r, '--since=2026-11-01', '--until=2026-10-01');
  assert.notEqual(out.status, 0);
  assert.match(out.stderr, /--since=2026-11-01 is after --until=2026-10-01/);
  assert.equal(cli(r, '--since=2026-10-01', '--until=2026-10-01').status, 0);
});

// ---------- AC5 ----------

test('0527 AC5: --json prints the chosen view, every unknown cost as null, with a totals object', () => {
  const r = repo();
  const out = cli(r, '--json');
  assert.equal(out.status, 0, out.stderr);
  const j = JSON.parse(out.stdout);
  assert.equal(j.by, 'ticket');
  assert.deepEqual(j.rows.map(x => x.id), ['0001', '0002']);
  assert.equal(j.rows[1].builder.cost_usd, null);
  assert.equal(j.rows[1].total.cost_usd, null);
  assert.deepEqual(Object.keys(j.totals).sort(), ['cost_unknown', 'cost_usd', 'tickets_with_unknown_cost', 'tokens']);
  const m = JSON.parse(cli(r, '--json', '--by=model', '--since=2026-10-01').stdout);
  assert.equal(m.rows.find(x => x.model === 'unknown model').cost_usd, null);
  assert.equal(m.since, '2026-10-01');
  const w = JSON.parse(cli(r, '--by=week', '--json').stdout);
  assert.deepEqual(w.rows.map(x => x.week), ['2026-10-19', '2026-10-26', '2026-11-02']);
  assert.equal(JSON.parse(cli(repo({ spend: false }), '--json').stdout).rows.length, 0);
});

test('0527 AC5: docs/brief.md\'s command table lists speck spend with --by, --since, --until and --json', () => {
  const row = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8').split('\n').find(l => l.startsWith('| `speck spend'));
  assert.ok(row, 'a row for speck spend');
  for (const flag of ['--by', '--since', '--until', '--json']) assert.ok(row.includes(flag), flag);
});

test('0527: an unknown view or option is refused', () => {
  const r = repo();
  assert.match(cli(r, '--by=day').stderr, /--by=day isn't a view: give ticket, model, week or month/);
  assert.match(cli(r, '--weekly').stderr, /Unknown option "--weekly"/);
});
