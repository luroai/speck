import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { cursorRepo } from './support/cursor-reviewer.mjs';
import { after } from './support/claude-reviewer.mjs';
import { splitCommand } from '../scripts/reviewers.mjs';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');

// The flags every built-in Cursor review runs with: without a person, read-only (ask mode), past the trust prompt, as JSON.
function readOnly(args) {
  assert.ok(args.includes('-p'), 'runs without a person (print mode)');
  assert.equal(after(args, '--mode'), 'ask', 'ask mode is read-only');
  assert.ok(args.includes('--trust'), 'never stops at the Workspace Trust prompt');
  assert.equal(after(args, '--output-format'), 'json');
  assert.ok(!args.some(a => /^--(force|yolo|sandbox)$/.test(a)), 'never forces commands through or asks for a sandbox');
}

test('0332 AC1: reviewer cursor runs Cursor\'s agent CLI read-only, with the round prompt on stdin, and records the verdict', () => {
  const r = cursorRepo({ ticketFields: 'reviewer_model: gpt-5' });
  const res = r.review();
  assert.equal(res.status, 10, res.stderr);
  assert.match(res.stdout, /NEXT: fix/);
  const [call] = r.calls();
  assert.equal(call.cli, 'agent');
  readOnly(call.args);
  assert.equal(after(call.args, '--model'), 'gpt-5');
  assert.equal(call.stdin.trimEnd(), r.run('prompt', '1').stdout.trimEnd(), 'the same text speck prompt prints');
  const r1 = r.roundFile(1);
  assert.equal(r1.meta.reviewer, 'cursor');
  assert.equal(r1.meta.reviewer_model, 'gpt-5');
  assert.equal(r1.verdict.findings[0].id, 'F1', 'the verdict is read out of the reply in result');
});

test('0332 AC1: a blank reviewer_model leaves --model out', () => {
  const r = cursorRepo();
  assert.equal(r.review().status, 10);
  assert.ok(!r.calls()[0].args.includes('--model'));
});

test('0332 AC1: with only cursor-agent installed, it runs cursor-agent', () => {
  const r = cursorRepo({ cli: 'cursor-agent', onlyCli: true });
  const res = r.review();
  assert.equal(res.status, 10, res.stderr);
  const [call] = r.calls();
  assert.equal(call.cli, 'cursor-agent');
  readOnly(call.args);
});

test('0332 AC1: without Cursor\'s CLI on the PATH, the round fails in plain words and records nothing', () => {
  const r = cursorRepo({ onlyCli: true });
  fs.rmSync(path.join(r.bin, 'agent'));
  const res = r.review();
  assert.equal(res.status, 1);
  assert.match(res.stderr, /`agent` isn't installed or isn't on your PATH/);
  assert.doesNotMatch(res.stderr, /\n\s+at /, 'no stack trace');
  assert.equal(r.roundFile(1), undefined);
});

test('0332 AC2: round 2 resumes the chat round 1 started, read-only, with only the new round\'s prompt', () => {
  const r = cursorRepo({ ticketFields: 'reviewer_model: gpt-5' });
  assert.equal(r.review({ FAKE_SESSION: 'chat-7' }).status, 10);
  assert.equal(r.roundFile(1).meta.thread_id, 'chat-7', 'the session id is saved from round 1\'s output');
  const res = r.secondRound({ FAKE_SESSION: 'chat-7' });
  assert.equal(res.status, 10, res.stderr);
  const [first, second] = r.calls();
  assert.ok(!first.args.includes('--resume'));
  assert.equal(after(second.args, '--resume'), 'chat-7');
  readOnly(second.args);
  assert.equal(after(second.args, '--model'), 'gpt-5');
  assert.match(second.stdin, /^# Review round 2/);
  assert.doesNotMatch(second.stdin, /# Earlier review rounds/, 'no history resent');
  assert.equal(r.roundFile(2).meta.session, 'continued');
});

test('0332 AC2: a resume that fails starts a fresh read-only chat with the full history', () => {
  const r = cursorRepo();
  r.review();
  const res = r.secondRound({ FAKE_RESUME_FAIL: '1' });
  assert.equal(res.status, 10, res.stderr);
  const last = r.calls().at(-1);
  assert.ok(!last.args.includes('--resume'));
  readOnly(last.args);
  assert.match(last.stdin, /# Earlier review rounds/);
  assert.equal(r.roundFile(2).meta.session, 'fresh');
});

test('0332 AC3: a cursor command set under reviewer_options is run instead of the built-in one', () => {
  const r = cursorRepo({ config: `reviewer_options:\n  cursor:\n    command: "agent --mine"\n` });
  assert.equal(r.review().status, 10);
  assert.deepEqual(r.calls()[0].args, ['--mine']);
});

test('0332 AC4: no reviewer command in the README or the brief runs Cursor\'s CLI without --trust', () => {
  for (const doc of ['README.md', 'docs/brief.md']) {
    const text = fs.readFileSync(path.join(ROOT, doc), 'utf8');
    const commands = [...text.matchAll(/^\s*(?:resume_)?command:\s*(.+)$/gm)].map(m => m[1].trim().replace(/^(['"])(.*)\1$/, '$2'));
    for (const c of commands) {
      const [first] = splitCommand(c);
      if (first === 'agent' || first === 'cursor-agent') assert.ok(splitCommand(c).includes('--trust'), `${doc}: ${c}`);
    }
  }
});
