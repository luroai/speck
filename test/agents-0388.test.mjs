// 0388: a ticket uses the builder and reviewer the settings give, unless it names its own.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseTicket, ticketAgents } from '../scripts/core.mjs';
import { buildPlan } from '../scripts/ticket-builder.mjs';
import { ticketSameModelProblem } from '../scripts/same-model.mjs';
import { lintTicket } from '../scripts/lint.mjs';
import { resumableSession } from '../scripts/reviewers.mjs';
import { statusData } from '../scripts/speck.mjs';
import { reviewRepo } from './support/speck.mjs';
import { claudeRepo, after } from './support/claude-reviewer.mjs';

const fmOf = file => parseTicket(fs.readFileSync(file, 'utf8')).fm;
const cfg = (o = {}) => ({ builder: 'claude', reviewer: 'codex', reviewer_model: 'm1', reviewer_effort: 'high', limits: { max_acceptance_criteria: 5, max_ticket_body_lines: 40 }, ...o });
const round = (n, meta) => ({ meta: { round: n, ...meta }, verdict: { verdict: 'changes_requested', criteria: [], findings: [], summary: '' } });

test('0388 AC1: a new ticket leaves builder, reviewer, reviewer_model and reviewer_effort blank', () => {
  const r = reviewRepo({ config: 'builder: codex\nreviewer: claude\nreviewer_model: m1\nreviewer_effort: high\n' });
  const fm = fmOf(r.ticketFile);
  for (const k of ['builder', 'reviewer', 'reviewer_model', 'reviewer_effort']) assert.equal(fm[k], '', `${k} should be blank`);
});

test('0388 AC2: a ticket with blank fields takes the builder, reviewer, model and effort from the settings', () => {
  assert.deepEqual(ticketAgents({ builder: '', reviewer: '', reviewer_model: '', reviewer_effort: '' }, cfg()),
    { builder: 'claude', reviewer: 'codex', reviewer_model: 'm1', reviewer_effort: 'high' });
  assert.deepEqual(ticketAgents({}, cfg({ builder: 'cursor', reviewer: 'claude', reviewer_model: '', reviewer_effort: '' })),
    { builder: 'cursor', reviewer: 'claude', reviewer_model: null, reviewer_effort: null });
  assert.equal(buildPlan(cfg({ builder: 'codex', build_command: '' }), { builder: '' }, () => true).agent, 'codex');
});

test('0388 AC2: a round whose reviewer or model differs from the last round\'s starts fresh', () => {
  const settings = { model: 'm1', effort: null };
  const last = round(1, { reviewer: 'codex', reviewer_model: 'm1', thread_id: 'T1' });
  assert.equal(resumableSession([last], 'codex', settings).thread, 'T1');
  assert.match(resumableSession([last], 'claude', settings).why, /codex/);
  assert.match(resumableSession([last], 'codex', { model: 'm2' }).why, /m1/);
  assert.match(resumableSession([round(1, { reviewer: 'codex', reviewer_model: 'default', thread_id: 'T1' })], 'codex', settings).why, /default/);
  assert.equal(resumableSession([round(1, { reviewer: 'codex', reviewer_model: 'default', thread_id: 'T1' })], 'codex', {}).thread, 'T1');
});

test('0388 AC2: a Codex round after the settings\' model changes uses it, in a fresh session with the full history', () => {
  const r = reviewRepo({ config: 'reviewer_model: m1\n' });
  assert.equal(r.run('review', '1').status, 10);
  assert.equal(after(r.calls()[0], '-m'), 'm1');
  assert.equal(r.run('config', 'set', 'reviewer_model', 'm2').status, 0);
  fs.writeFileSync(path.join(r.dir, 'a.txt'), 'fix\n');
  r.git('add', '-A'); r.git('commit', '-qm', 'fix');
  assert.equal(r.run('review', '1').status, 10);
  const second = r.calls()[1];
  assert.ok(!second.includes('resume'), `round 2 resumed: ${second.join(' ')}`);
  assert.equal(after(second, '-m'), 'm2');
  assert.match(r.prompts()[1], /# Earlier review rounds/);
  assert.equal(r.roundFile(2).meta.reviewer_model, 'm2');
  assert.equal(r.roundFile(2).meta.session, 'fresh');
});

test('0388 AC2: a fresh Codex session after a change gets every earlier response, verdict and the round-1 test output', () => {
  const r = reviewRepo({ config: 'reviewer_model: m1\n' });
  const file = (name, text) => { const f = path.join(r.dir, '..', `${name}-${path.basename(r.dir)}.txt`); fs.writeFileSync(f, text); return f; };
  const commit = n => { fs.writeFileSync(path.join(r.dir, 'a.txt'), `fix ${n}\n`); r.git('add', '-A'); r.git('commit', '-qm', `fix ${n}`); };
  assert.equal(r.run('review', '1', `--tests=${file('t1', 'TESTS-ONE-MARKER\n')}`, `--response=${file('r1', '- RESPONSE-ONE-MARKER\n')}`).status, 10);
  commit(1);
  assert.equal(r.run('review', '1', `--response=${file('r2', '- RESPONSE-TWO-MARKER\n')}`).status, 10);
  assert.deepEqual(r.calls()[1].slice(0, 2), ['exec', 'resume']);
  commit(2);
  assert.equal(r.run('config', 'set', 'reviewer_model', 'm2').status, 0);
  assert.equal(r.run('review', '1', `--response=${file('r3', '- RESPONSE-THREE-MARKER\n')}`).status, 10);
  assert.ok(!r.calls()[2].includes('resume'));
  const third = r.prompts()[2];
  for (const marker of ['TESTS-ONE-MARKER', 'RESPONSE-ONE-MARKER', 'RESPONSE-TWO-MARKER', 'RESPONSE-THREE-MARKER', 'Your round 1 verdict', 'Your round 2 verdict'])
    assert.ok(third.includes(marker), `missing ${marker}`);
});

test('0388 AC2: a Codex round with the same reviewer and model still resumes the last session', () => {
  const r = reviewRepo({ config: 'reviewer_model: m1\n' });
  assert.equal(r.run('review', '1').status, 10);
  fs.writeFileSync(path.join(r.dir, 'a.txt'), 'fix\n');
  r.git('add', '-A'); r.git('commit', '-qm', 'fix');
  assert.equal(r.run('review', '1').status, 10);
  assert.deepEqual(r.calls()[1].slice(0, 2), ['exec', 'resume']);
  assert.equal(r.roundFile(2).meta.session, 'continued');
});

test('0388 AC2: a command reviewer whose model changed starts a fresh session with the full history', () => {
  const c = claudeRepo({ ticketFields: 'reviewer: ""', config: 'reviewer: claude\nreviewer_model: m1\nallow_same_model_review: true\n' });
  assert.equal(c.review().status, 10);
  assert.equal(after(c.calls()[0].args, '--model'), 'm1');
  assert.equal(c.run('config', 'set', 'reviewer_model', 'm2').status, 0);
  assert.equal(c.secondRound().status, 10);
  const second = c.calls()[1];
  assert.ok(!second.args.includes('--resume'), `round 2 resumed: ${second.args.join(' ')}`);
  assert.equal(after(second.args, '--model'), 'm2');
  assert.match(second.stdin, /# Earlier review rounds/);
  assert.equal(c.roundFile(2).meta.session, 'fresh');
});

test('0388 AC3: a ticket that names its agents uses them, and the same-model check judges the values used', () => {
  const named = { builder: 'codex', reviewer: 'claude', reviewer_model: 'x', reviewer_effort: 'low' };
  assert.deepEqual(ticketAgents(named, cfg()), { builder: 'codex', reviewer: 'claude', reviewer_model: 'x', reviewer_effort: 'low' });
  const same = cfg({ reviewer: 'claude-subagent', reviewer_model: '' });
  assert.match(ticketSameModelProblem({ builder: '', reviewer: '' }, same) ?? '', /claude/);
  assert.equal(ticketSameModelProblem({ builder: '', reviewer: 'codex' }, same), null);
  assert.match(ticketSameModelProblem({ builder: 'claude', reviewer: '' }, same) ?? '', /claude/);
});

test('0388 AC3: speck lint refuses a blank ticket whose settings would review with the same model', () => {
  const r = reviewRepo();
  const t = parseTicket(fs.readFileSync(r.ticketFile, 'utf8'));
  t.file = r.ticketFile;
  const lint = c => lintTicket(t, cfg({ reviewer_model: '', reviewer_effort: '', ...c })).errors.join('\n');
  assert.match(lint({ reviewer: 'claude-subagent' }), /same model family|both "claude"/);
  assert.doesNotMatch(lint({ reviewer: 'codex' }), /same model family|both "claude"/);
});

test('0388 AC4: speck status gives the builder and reviewer a ticket would use now', () => {
  const r = reviewRepo({ config: 'builder: codex\nreviewer: claude\n' });
  const shown = () => statusData(r.dir).tickets.find(t => t.id === '0001');
  assert.equal(shown().builder, 'codex');
  assert.equal(shown().reviewer, 'claude');
  assert.equal(r.run('config', 'set', 'reviewer', 'cursor').status, 0);
  assert.equal(shown().reviewer, 'cursor');
});
