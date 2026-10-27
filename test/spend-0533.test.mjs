// 0533: a Claude Code build's recorded spend counts the sub-agents it started, checked on a real build's log and
// transcripts (test/fixtures/claude-subagents-0533: a `claude -p --output-format stream-json` run on haiku that started
// two sub-agents with the Agent tool, with everything but its messages and usage stripped out).
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { builderSpend, logSpend } from '../scripts/spend.mjs';
import { sessionSpend } from '../scripts/backfill.mjs';

const FIXTURE = new URL('./fixtures/claude-subagents-0533/', import.meta.url).pathname;
const SESSION = 'f2a9d40e-699b-498e-b656-0ff5eadbe40b';
const transcript = path.join(FIXTURE, `${SESSION}.jsonl`);
const subagents = path.join(FIXTURE, SESSION, 'subagents');
const log = fs.readFileSync(path.join(FIXTURE, 'build.log'), 'utf8');
const events = log.split('\n').filter(Boolean).map(l => JSON.parse(l));
const command = ['claude', '-p', '/speck-build 0001', '--output-format', 'stream-json', '--verbose'];

// A sub-agent transcript's own tokens, as sessionSpend counts them, read from a copy on its own (with no subagents folder).
function ownTokens(file) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0533-'));
  const copy = path.join(dir, path.basename(file));
  fs.copyFileSync(file, copy);
  return sessionSpend(copy).tokens;
}
const subFiles = () => fs.readdirSync(subagents).filter(n => n.endsWith('.jsonl')).map(n => path.join(subagents, n));

// ---------- AC1 ----------

test('0533 AC1: the fixture is a real stream-json build log that started at least two sub-agents, with its transcripts', () => {
  const init = events.find(e => e.type === 'system' && e.subtype === 'init');
  assert.equal(init?.session_id, SESSION);
  const agents = events.filter(e => e.type === 'assistant').flatMap(e => e.message.content).filter(b => b.type === 'tool_use' && b.name === 'Agent');
  assert.ok(agents.length >= 2, `Agent tool calls: ${agents.length}`);
  assert.equal(events.at(-1).type, 'result');
  assert.ok(events.at(-1).subagent_stats.spawned >= 2);
  assert.ok(fs.statSync(transcript).isFile());
  const subs = subFiles();
  assert.ok(subs.length >= 2, `sub-agent transcripts: ${subs.length}`);
  for (const f of subs) assert.ok(ownTokens(f) > 0, `${f} has usage`);
});

test('0533 AC1: the fixture holds no home folder path', () => {
  for (const f of [path.join(FIXTURE, 'build.log'), transcript, ...subFiles()])
    assert.ok(!fs.readFileSync(f, 'utf8').includes(os.homedir()), `${f} names the home folder`);
});

// ---------- AC2 ----------

test('0533 AC2: the tokens a Claude Code build records are at least its session\'s, sub-agents included, by less than the smallest sub-agent', () => {
  const recorded = builderSpend(log, { command });
  const session = sessionSpend(transcript);
  const smallest = Math.min(...subFiles().map(ownTokens));
  assert.ok(smallest > 0);
  assert.ok(recorded.tokens >= session.tokens, `recorded ${recorded.tokens} < session ${session.tokens}`);
  assert.ok(recorded.tokens - session.tokens < smallest, `recorded ${recorded.tokens} exceeds session ${session.tokens} by ${smallest} or more`);
});

test('0533 AC2: a recorded spend that left out any one sub-agent, or all of them, would fail the check', () => {
  const recorded = builderSpend(log, { command }).tokens;
  const session = sessionSpend(transcript).tokens;
  for (const t of subFiles().map(ownTokens)) assert.ok(recorded - t < session, `leaving out a sub-agent of ${t} tokens is caught`);
  assert.ok(ownTokens(transcript) < session, 'the parent alone is short of the session');
});

// ---------- AC3 ----------

test('0533 AC3: the build\'s recorded spend, read from its log in speck run\'s runs folder, covers its sub-agents', () => {
  const runs = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0533-runs-'));
  fs.writeFileSync(path.join(runs, '0001.log'), log);
  const recorded = logSpend(runs, '0001', { command, session: SESSION });
  const session = sessionSpend(transcript);
  const smallest = Math.min(...subFiles().map(ownTokens));
  assert.ok(recorded.tokens >= session.tokens && recorded.tokens - session.tokens < smallest);
  // Each model's tokens cover what the transcripts hold for it, sub-agents included.
  for (const m of session.models) {
    const r = recorded.models.find(x => x.model === m.model);
    assert.ok(r, `${m.model} is recorded`);
    for (const k of ['input', 'cached', 'write', 'output']) assert.ok(r.tokens[k] >= m.tokens[k], `${m.model} ${k}: ${r.tokens[k]} < ${m.tokens[k]}`);
  }
  assert.ok(recorded.cost_usd > 0);
});

// ---------- AC4 ----------

test('0533 AC4: the brief names the result line\'s modelUsage a Claude Code build\'s tokens are read from', () => {
  const brief = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8');
  assert.ok(brief.includes('`modelUsage`'));
});
