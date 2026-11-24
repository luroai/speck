// 0719: a review round on Claude Code keeps Claude's latest usage reading, as a Claude build does.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { readUsage } from '../scripts/agent-usage.mjs';
import { verdictFromOutput } from '../scripts/reviewers.mjs';
import { changesVerdict } from './support/speck.mjs';
import { claudeRepo, after } from './support/claude-reviewer.mjs';
import { standInRepo } from './support/review-stand-in.mjs';
import { CLAUDE_EVENT, claudeLog } from './support/agent-usage.mjs';
import { speck } from './support/cli.mjs';
import { yourAgentsFile } from '../scripts/your-agents.mjs';

const HOUR = 3600000;
const RATE = (five, seven) => JSON.stringify(CLAUDE_EVENT({ five, seven }));
const verdictText = `Here is my review.\n\`\`\`json\n${JSON.stringify(changesVerdict)}\n\`\`\``;

// Replaces the fake `claude` in `bin` with one that answers `auth` as signed in and otherwise prints `lines`, one per
// line, logging its arguments, and exits with `status`.
function claudeSaying(bin, lines, status = 0) {
  const log = path.join(bin, 'said.log');
  fs.writeFileSync(path.join(bin, 'claude'), `#!${process.execPath}
const fs = require('fs'), args = process.argv.slice(2);
if (args[0] === 'auth') { console.log(JSON.stringify({ loggedIn: true })); process.exit(0); }
fs.readFileSync(0, 'utf8');
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify(args) + '\\n');
process.stdout.write(${JSON.stringify(lines.map(l => (typeof l === 'string' ? l : JSON.stringify(l))).join('\n') + '\n')});
process.exit(${status});
`, { mode: 0o755 });
  return () => fs.readFileSync(log, 'utf8').trim().split('\n').map(l => JSON.parse(l));
}

// ---------- AC1 ----------

test('0719 AC1: a round with the Claude reviewer runs it with stream-json and keeps the usage it reported', () => {
  const r = claudeRepo();
  const res = r.review({ FAKE_RATE_EVENT: RATE(0.33, 0.61) });
  assert.equal(res.status, 10, res.stderr);
  const [call] = r.calls();
  assert.equal(after(call.args, '--output-format'), 'stream-json');
  assert.ok(call.args.includes('--verbose'), 'stream-json needs --verbose in print mode');
  const usage = readUsage(r.dir).claude;
  assert.equal(usage.windows.five_hour.used_percent, 33);
  assert.equal(usage.windows.seven_day.used_percent, 61);
  assert.equal(usage.windows.seven_day.resets_at, '2026-11-15T09:00:00.000Z');
});

test('0719 AC1: a resumed Claude round keeps the later reading', () => {
  const r = claudeRepo();
  assert.equal(r.review({ FAKE_RATE_EVENT: RATE(0.1, 0.2) }).status, 10);
  const two = r.secondRound({ FAKE_RATE_EVENT: RATE(0.45, 0.5) });
  assert.equal(two.status, 10, two.stderr);
  const calls = r.calls();
  assert.ok(calls[1].args.includes('--resume'));
  assert.equal(after(calls[1].args, '--output-format'), 'stream-json');
  assert.equal(readUsage(r.dir).claude.windows.five_hour.used_percent, 45);
});

test('0719 AC1: speck agents shows the reading a Claude review round kept, as it does after a build', () => {
  const r = claudeRepo();
  assert.equal(r.review({ FAKE_RATE_EVENT: RATE(0.27, 0.4) }).status, 10);
  const out = speck(r.dir, { ...process.env, PATH: `${r.bin}${path.delimiter}${process.env.PATH}` }, 'agents', '--json');
  assert.equal(out.status, 0, out.stderr);
  const claude = JSON.parse(out.stdout).agents.find(a => a.id === 'claude');
  assert.equal(claude.usage.windows.five_hour.used_percent, 27);
});

test('0719 AC1: a Claude round standing in from reviewer_bench keeps Claude\'s usage too', () => {
  const { r, review, PATH } = standInRepo();
  const bin = PATH.split(path.delimiter)[0];
  const said = claudeSaying(bin, [{ type: 'system', subtype: 'init', session_id: 'C1' }, RATE(0.52, 0.7),
    { type: 'result', subtype: 'success', is_error: false, session_id: 'C1', result: verdictText, total_cost_usd: 0.25, usage: { input_tokens: 10, output_tokens: 2 } }]);
  const runs = path.join(r.dir, 'speck', '.cache', 'runs', 'reviewer-limits');
  fs.mkdirSync(runs, { recursive: true });
  const until = Date.now() + 2 * HOUR;
  fs.writeFileSync(path.join(runs, '0002.json'), JSON.stringify({ reviewer: 'codex', resets: new Date(until - 60000).toISOString(), carry_on: new Date(until).toISOString(), session: 'other' }));
  const res = review();
  assert.equal(res.status, 10, res.stderr);
  assert.equal(r.roundFile(1).meta.stand_in.for, 'codex');
  assert.equal(after(said()[0], '--output-format'), 'stream-json');
  assert.equal(readUsage(r.dir).claude.windows.five_hour.used_percent, 52);
});

// ---------- AC2 ----------

test('0719 AC2: a stream-json round still saves its verdict, cost and session id', () => {
  const r = claudeRepo();
  const res = r.review({ FAKE_RATE_EVENT: RATE(0.1, 0.2), FAKE_SESSION: 'S-0719', FAKE_COST: '0.42' });
  assert.equal(res.status, 10, res.stderr);
  const meta = r.roundFile(1).meta;
  assert.equal(r.roundFile(1).verdict.findings[0].id, 'F1');
  assert.equal(meta.thread_id, 'S-0719');
  assert.equal(meta.cost_usd, 0.42);
  assert.deepEqual(meta.usage, { input_tokens: 100, output_tokens: 20 });
});

test('0719 AC2: the verdict comes from the last result line of a stream, not from text in earlier lines', () => {
  const approve = { ...changesVerdict, verdict: 'approve', findings: [] };
  const stream = claudeLog([{ type: 'system', subtype: 'init' }, JSON.parse(RATE(0.1, 0.1)),
    { type: 'assistant', message: { content: [{ type: 'text', text: `\`\`\`json\n${JSON.stringify(approve)}\n\`\`\`` }] } },
    { type: 'result', is_error: false, session_id: 'X', result: verdictText, total_cost_usd: 1 }]);
  const { verdict, envelope } = verdictFromOutput(stream);
  assert.equal(verdict.verdict, 'changes_requested');
  assert.equal(envelope.session_id, 'X');
  // A stream with no result line, or one whose result isn't text, has no verdict.
  assert.equal(verdictFromOutput(claudeLog([{ type: 'system' }, { type: 'assistant', message: {} }])).verdict, null);
  assert.equal(verdictFromOutput(claudeLog([{ type: 'system' }, { type: 'result', result: 5 }])).verdict, null);
});

test('0719 AC2: a stream-json round refused on Claude\'s usage limit stops as before, with no round recorded', () => {
  const r = claudeRepo();
  // 0649: no agents of yours on this machine, so none stands in, whatever this machine has set up.
  fs.mkdirSync(path.dirname(yourAgentsFile(r.dir)), { recursive: true });
  fs.writeFileSync(yourAgentsFile(r.dir), JSON.stringify({ agents: [] }));
  claudeSaying(r.bin, [{ type: 'system', subtype: 'init' }, JSON.stringify(CLAUDE_EVENT({ five: 1, seven: 0.5, status: 'rejected' })),
    { type: 'result', subtype: 'success', is_error: true, result: 'You\'ve hit your limit · resets 3pm (UTC)' }], 1);
  const res = r.review();
  assert.equal(res.status, 18, res.stderr + res.stdout);
  assert.equal(r.roundFile(1), undefined);
  assert.equal(readUsage(r.dir).claude.windows.five_hour.refused, true, 'the refused reading is kept');
});

// ---------- AC3 ----------

test('0719 AC3: a reviewer command of your own that prints a single JSON result still gives its verdict and cost', () => {
  const r = claudeRepo({ config: 'reviewer_options:\n  claude:\n    command: "claude --mine --output-format json"\n' });
  const res = r.review({ FAKE_COST: '0.3', FAKE_SESSION: 'MINE' });
  assert.equal(res.status, 10, res.stderr);
  const [call] = r.calls();
  assert.equal(after(call.args, '--output-format'), 'json');
  const rec = r.roundFile(1);
  assert.equal(rec.verdict.findings[0].id, 'F1');
  assert.equal(rec.meta.cost_usd, 0.3);
  assert.equal(rec.meta.thread_id, undefined, 'no session_id_path is set for it');
  assert.equal(verdictFromOutput(JSON.stringify({ result: verdictText, total_cost_usd: 2 })).envelope.total_cost_usd, 2);
  assert.equal(verdictFromOutput(JSON.stringify(changesVerdict)).verdict.verdict, 'changes_requested');
  assert.equal(verdictFromOutput(`Some prose first.\n${verdictText}`).verdict.verdict, 'changes_requested', 'prose with a fenced block');
});
