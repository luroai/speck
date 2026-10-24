import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fakePage, T, click } from './support/panel.mjs';
import { foremanView, foremanLines } from '../scripts/foreman.mjs';
import { agentView } from '../scripts/foreman-agent.mjs';
import { askKey } from '../scripts/foreman-answer.mjs';

// ---------- 0328: say what became of a question the Foreman asked, in its recent actions ----------

const ON = { on: true, pid: process.pid };
const ASKED = '2026-10-18T14:00:00.000Z';
const QUESTION = 'Should it keep the old test?';

// A runs folder whose did list has `actions` (the ask about 0001 by default), and a reply to that ask when given.
function runsWith({ actions = [ask()], reply = null } = {}) {
  const runs = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0328-'));
  fs.writeFileSync(path.join(runs, 'run.foreman-did.jsonl'), actions.map(a => JSON.stringify(a)).join('\n') + '\n');
  if (reply) fs.writeFileSync(path.join(runs, `run.foreman-answer.${askKey('0001', ASKED)}.json`), JSON.stringify({ id: '0001', ask_at: ASKED, question: QUESTION, status: 'building', ...reply }));
  return runs;
}
function ask(o = {}) { return { run: 'x', id: '0001', action: 'ask', text: QUESTION, why: 'the build stopped on a choice', at: ASKED, status: 'building', ...o }; }

const viewOf = (runs, status = 'building') => {
  const tickets = [T('0001', status)];
  return foremanView({ run: ON, record: { lock: process.pid }, tickets, agent: agentView(runs, tickets) });
};
const statusLines = (runs, status) => foremanLines(viewOf(runs, status));
const askLine = lines => lines.find(l => /The Foreman asked you/.test(l));

async function detail(runs, status = 'building') {
  const f = viewOf(runs, status);
  const p = fakePage([{ tickets: [T('0001', status)], ideas: [], resume_command: '', run: ON, foreman: f }]);
  await p.settle();
  click(p.byId('run'));
  await p.settle();
  return { f, text: p.byId('foreman').textContent };
}

test('0328 AC1: a dismissed question is listed as asked about its ticket, then "You dismissed it" and when', () => {
  const runs = runsWith({ reply: { action: 'dismiss', text: '', at: '2026-10-19T09:30:00.000Z' } });
  const line = askLine(statusLines(runs));
  assert.match(line, /The Foreman asked you about 0001: Should it keep the old test\?\. Why: the build stopped on a choice\. You dismissed it at 2026-10-19 09:30 UTC\.$/);
  assert.doesNotMatch(line, /asked you for/);
});

test('0328 AC2: an answered question is followed by "You answered it", when, and your answer', () => {
  const runs = runsWith({ reply: { action: 'answer', text: 'Keep it', at: '2026-10-19T09:31:00.000Z', carry: 'resume' } });
  assert.match(askLine(statusLines(runs)), /The Foreman asked you about 0001: .*\. You answered it at 2026-10-19 09:31 UTC: Keep it\.$/);
});

test('0328 AC3: a question whose ticket has moved on says it no longer waits, naming the ticket\'s status now', () => {
  const runs = runsWith();
  assert.match(askLine(statusLines(runs, 'done')), /The Foreman asked you about 0001: .*\. No longer waiting: 0001 is done now\.$/);
});

test('0328 AC3: a question the Foreman did something else about since says it no longer waits, and why', () => {
  const runs = runsWith({ actions: [ask(), { run: 'y', id: '0001', action: 'reship', text: '', why: 'it was a flaky push', at: '2026-10-18T15:00:00.000Z', status: 'building' }] });
  const lines = statusLines(runs);
  assert.match(askLine(lines), /\. No longer waiting: the Foreman has done something else about 0001 since\.$/);
  assert.ok(lines.includes('  The Foreman asked speck run to ship it again, once for 0001. Why: it was a flaky push'), 'other actions keep their wording');
});

test('0328 AC4: a question still waiting is listed as asked about its ticket with nothing after it, and the ask line is unchanged', () => {
  const runs = runsWith();
  const lines = statusLines(runs);
  assert.match(askLine(lines), /^ {2}The Foreman asked you about 0001: Should it keep the old test\?\. Why: the build stopped on a choice$/);
  assert.ok(lines.includes('  The Foreman asks you about 0001: Should it keep the old test?'));
  assert.ok(lines.includes('    Answer with speck foreman answer 0001 "<your answer>", or dismiss it with speck foreman dismiss 0001'));
});

test('0328 AC5: speck status shows each outcome, which 0458 took out of the panel\'s Foreman detail, and Needs you is unchanged', async () => {
  const cases = [
    [runsWith({ reply: { action: 'dismiss', text: '', at: '2026-10-19T09:30:00.000Z' } }), 'building', 'You dismissed it at 2026-10-19 09:30 UTC.'],
    [runsWith({ reply: { action: 'answer', text: 'Keep it', at: '2026-10-19T09:31:00.000Z' } }), 'building', 'You answered it at 2026-10-19 09:31 UTC: Keep it.'],
    [runsWith(), 'done', 'No longer waiting: 0001 is done now.'],
  ];
  for (const [runs, status, said] of cases) {
    const { f, text } = await detail(runs, status);
    assert.ok(!text.includes(said), `0458: not in the panel's detail: ${text}`);
    assert.ok(askLine(foremanLines(f)).endsWith(said));
    assert.equal(f.word, 'Idle', 'nothing waits for you');
  }
  const { f, text } = await detail(runsWith());
  assert.equal(f.word, 'Needs you 1');
  assert.doesNotMatch(text, /No longer waiting|You dismissed|You answered/);
});

test('0328 AC1/AC2: odd replies still read as a sentence: no answer text, an unreadable time, no reason', () => {
  const blank = runsWith({ actions: [ask({ why: '' })], reply: { action: 'answer', text: '  ', at: 'not a time' } });
  assert.match(askLine(statusLines(blank)), /\. Why:  You answered it\.$/);
  const ended = runsWith({ actions: [ask({ why: 'it ended!' })], reply: { action: 'dismiss', at: '2026-10-19T09:30:00Z' } });
  assert.match(askLine(statusLines(ended)), /Why: it ended! You dismissed it at 2026-10-19 09:30 UTC\.$/);
});

test('0328 AC3: a question for a ticket no longer on the board says it no longer waits', () => {
  const runs = runsWith();
  const tickets = [T('0002', 'ready')];
  const lines = foremanLines(foremanView({ run: ON, record: { lock: process.pid }, tickets, agent: agentView(runs, tickets) }));
  assert.match(askLine(lines), /No longer waiting: 0001 is no longer on the board\.$/);
});
