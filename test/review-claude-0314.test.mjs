import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { claudeRepo, after } from './support/claude-reviewer.mjs';

// ---------- 0314: keep the Claude reviewer away from your MCP servers and connectors ----------

const noMcp = (args, what) => {
  assert.ok(args.includes('--strict-mcp-config'), `${what}: loads MCP servers only from --mcp-config`);
  assert.ok(!args.some(a => /^--mcp-config(=|$)/.test(a)), `${what}: and gives it none`);
};

test('0314 AC1: speck review starts the Claude reviewer with --strict-mcp-config and no --mcp-config', () => {
  const r = claudeRepo();
  assert.equal(r.review().status, 10);
  noMcp(r.calls()[0].args, 'first round');
});

test('0314 AC2: a resumed round, and a fresh one after a failed resume, are started the same way', () => {
  const r = claudeRepo();
  assert.equal(r.review({ FAKE_SESSION: 'S7' }).status, 10);
  assert.equal(r.secondRound({ FAKE_SESSION: 'S7' }).status, 10);
  const resumed = r.calls()[1];
  assert.equal(after(resumed.args, '--resume'), 'S7');
  noMcp(resumed.args, 'resumed round');

  const f = claudeRepo();
  f.review();
  assert.equal(f.secondRound({ FAKE_RESUME_FAIL: '1' }).status, 10);
  const fresh = f.calls().at(-1);
  assert.ok(!fresh.args.includes('--resume'));
  noMcp(fresh.args, 'fresh round after a failed resume');
});

test('0314 AC3: the reviewer\'s other options are as before', () => {
  const r = claudeRepo({ ticketFields: 'reviewer_model: opus\nreviewer_effort: high' });
  assert.equal(r.review().status, 10);
  r.secondRound();
  for (const { args } of r.calls()) {
    assert.ok(args.includes('-p'));
    assert.equal(after(args, '--permission-mode'), 'dontAsk');
    assert.ok(args.includes('--setting-sources='));
    assert.deepEqual(after(args, '--disallowedTools').split(/[\s,]+/).sort(), ['Edit', 'NotebookEdit', 'Write']);
    assert.equal(after(args, '--output-format'), 'json');
    assert.equal(after(args, '--model'), 'opus');
    assert.equal(after(args, '--effort'), 'high');
    assert.ok(!args.some(a => /bypass|dangerously/i.test(a)));
  }
});

test('0314 AC4: a round with the Claude reviewer still records its verdict', () => {
  const r = claudeRepo();
  const res = r.review();
  assert.equal(res.status, 10, res.stderr);
  assert.match(res.stdout, /NEXT: fix/);
  const r1 = r.roundFile(1);
  assert.equal(r1.meta.reviewer, 'claude');
  assert.equal(r1.verdict.findings[0].id, 'F1');
});

test('0314 AC1: the brief gives the reviewer\'s command with --strict-mcp-config', () => {
  const brief = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8');
  const row = brief.split('\n').find(l => l.startsWith('| `claude` | `claude -p'));
  assert.match(row, /--setting-sources= --strict-mcp-config --disallowedTools/);
});
