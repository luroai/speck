import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { claudeRepo, after } from './support/claude-reviewer.mjs';
import { panelRepo } from './support/panel.mjs';
import { settingsPage, openSettings, controlOf } from './support/settings.mjs';
import { panelSettings, reviewerModels, CLAUDE_MODELS } from '../scripts/settings.mjs';
import { modelFamily } from '../scripts/core.mjs';
import { sameModelProblem } from '../scripts/same-model.mjs';
import { doctorChecks } from '../scripts/install.mjs';
import { skillText } from './support/speck.mjs';

// ---------- 0292: review with Claude Code when the builder isn't Claude ----------

test('0292 AC1: reviewer claude runs Claude Code without a person, read-only, with the round prompt on stdin, and records the verdict', () => {
  const r = claudeRepo();
  const res = r.review();
  assert.equal(res.status, 10, res.stderr);
  assert.match(res.stdout, /NEXT: fix/);
  const [call] = r.calls();
  assert.ok(call.args.includes('-p'), 'runs without a person (print mode)');
  assert.equal(after(call.args, '--permission-mode'), 'dontAsk', 'anything not pre-approved is denied, not asked');
  assert.deepEqual(after(call.args, '--disallowedTools').split(/[\s,]+/).sort(), ['Edit', 'NotebookEdit', 'Write'], 'no file-writing tools');
  assert.equal(after(call.args, '--output-format'), 'json');
  assert.ok(!call.args.some(a => /bypass|dangerously/i.test(a)), 'never skips permissions');
  assert.equal(call.stdin.trimEnd(), r.run('prompt', '1').stdout.trimEnd(), 'the same text speck prompt prints');
  const r1 = r.roundFile(1);
  assert.equal(r1.meta.reviewer, 'claude');
  assert.equal(r1.verdict.findings[0].id, 'F1', 'the verdict is read out of the envelope\'s result');
  assert.deepEqual(r1.meta.usage, { input_tokens: 100, output_tokens: 20 });
});

test('0292 AC1: without Claude Code on the PATH, the round fails in plain words and records nothing', () => {
  const r = claudeRepo();
  // A PATH with git but no claude, as the machine's own Claude Code may be installed.
  fs.rmSync(path.join(r.bin, 'claude'));
  fs.symlinkSync(spawnSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).stdout.trim(), path.join(r.bin, 'git'));
  const res = r.review({ PATH: r.bin });
  assert.equal(res.status, 1);
  assert.match(res.stderr, /`claude` isn't installed or isn't on your PATH/);
  assert.doesNotMatch(res.stderr, /\n\s+at /, 'no stack trace');
  assert.equal(r.roundFile(1), undefined);
});

test('0292 AC1: a claude command set under reviewer_options is run instead of the built-in one', () => {
  const r = claudeRepo({ config: `reviewer_options:\n  claude:\n    command: "claude --mine"\n` });
  assert.equal(r.review().status, 10);
  assert.deepEqual(r.calls()[0].args, ['--mine']);
});

test('0292 AC2: later rounds resume the same Claude Code session with only the new round\'s prompt', () => {
  const r = claudeRepo();
  assert.equal(r.review({ FAKE_SESSION: 'S7' }).status, 10);
  assert.equal(r.roundFile(1).meta.thread_id, 'S7', 'the session id is saved from the output');
  const res = r.secondRound({ FAKE_SESSION: 'S7' });
  assert.equal(res.status, 10, res.stderr);
  const [first, second] = r.calls();
  assert.ok(!first.args.includes('--resume'));
  assert.equal(after(second.args, '--resume'), 'S7');
  assert.equal(after(second.args, '--permission-mode'), 'dontAsk', 'still read-only when resumed');
  assert.ok(second.args.includes('--disallowedTools'));
  assert.match(second.stdin, /^# Review round 2/);
  assert.match(second.stdin, /fixed for the resumed round/);
  assert.doesNotMatch(second.stdin, /# Earlier review rounds/, 'no history resent');
  assert.equal(r.roundFile(2).meta.session, 'continued');
});

test('0292 AC2: a resume that fails starts a fresh read-only session with the full history', () => {
  const r = claudeRepo();
  r.review();
  const res = r.secondRound({ FAKE_RESUME_FAIL: '1' });
  assert.equal(res.status, 10, res.stderr);
  const last = r.calls().at(-1);
  assert.ok(!last.args.includes('--resume'));
  assert.equal(after(last.args, '--permission-mode'), 'dontAsk');
  assert.match(last.stdin, /# Earlier review rounds/);
  assert.equal(r.roundFile(2).meta.session, 'fresh');
});

test('0292 AC3: reviewer_model and reviewer_effort are passed as --model and --effort when set, and left out when blank', () => {
  const set = claudeRepo({ ticketFields: 'reviewer_model: opus\nreviewer_effort: high' });
  assert.equal(set.review().status, 10);
  set.secondRound();
  for (const call of set.calls()) {
    assert.equal(after(call.args, '--model'), 'opus');
    assert.equal(after(call.args, '--effort'), 'high');
  }
  assert.equal(set.roundFile(1).meta.reviewer_model, 'opus');
  assert.equal(set.roundFile(1).meta.reviewer_effort, 'high');

  const blank = claudeRepo();
  assert.equal(blank.review().status, 10);
  assert.ok(!blank.calls()[0].args.includes('--model'));
  assert.ok(!blank.calls()[0].args.includes('--effort'));
});

test('0292 AC4: claude is Claude\'s family for the same-family check, as claude-subagent is', () => {
  assert.equal(modelFamily('claude'), modelFamily('claude-subagent'));
  assert.ok(sameModelProblem('claude', 'claude', {}, ''), 'a claude builder with a claude reviewer is kept apart');
  assert.equal(sameModelProblem('codex', 'claude', {}, ''), null, 'a codex builder may be reviewed by claude');
  assert.equal(sameModelProblem('cursor', 'claude', {}, ''), null);
});

test('0292 AC4: the Settings view offers claude as a reviewer, with Claude\'s models, and only when Claude Code is ready', async () => {
  const r = panelRepo(), cfg = path.join(r.dir, 'speck', 'config.yml');
  const reviewerOf = s => s.groups.flatMap(g => g.settings).find(x => x.key === 'reviewer');
  assert.ok(reviewerOf(panelSettings(r.dir)).choices.includes('claude'));
  const notReady = { agents: [{ id: 'claude', name: 'Claude Code', installed: false, signed_in: false, why: 'Claude Code isn\'t installed.' },
    { id: 'codex', name: 'Codex', installed: true, signed_in: true }] };
  const row = reviewerOf(panelSettings(r.dir, { agents: notReady }));
  assert.ok(!row.choices.includes('claude'));
  assert.match(row.missing, /claude \(Claude Code isn't installed\)/);

  fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^reviewer: .*$/m, 'reviewer: claude'));
  let asked = false;
  const models = await reviewerModels(r.dir, async () => { asked = true; return { models: [] }; });
  assert.equal(asked, false);
  assert.deepEqual(models, { reviewer: 'claude', models: CLAUDE_MODELS });
});

test('0292 AC4: picking claude in the Settings view offers Claude\'s model names', async () => {
  const keys = ['reviewer', 'reviewer_model', 'reviewer_effort'];
  const view = { groups: [{ title: 'Building and reviewing', settings: keys.map(key => ({
    key, value: key === 'reviewer' ? 'claude' : '', default: false, explain: `What ${key} does.`, editable: true,
    ...(key === 'reviewer' ? { choices: ['codex', 'claude'] } : key === 'reviewer_effort' ? { choices: ['', 'low', 'high'] } : {}) })) }],
    reviewer_models: { reviewer: 'codex', models: [] }, claude_models: CLAUDE_MODELS };
  const p = settingsPage([view]);
  await openSettings(p);
  assert.equal(controlOf(p, 'reviewer_model').tagName, 'select');
  const offered = p.all(controlOf(p, 'reviewer_model')).filter(n => n.tagName === 'option' && !n.disabled).map(o => o.value);
  assert.deepEqual(offered, ['', 'fable', 'opus', 'sonnet', 'haiku']);
});

test('0292 AC4: setup offers reviewer claude', () => {
  assert.match(skillText('speck-setup'), /speck config set reviewer claude`/);
});

test('0292 AC1: speck doctor checks Claude Code is on the PATH for reviewer claude', () => {
  const r = claudeRepo();
  const saved = process.env.PATH;
  try {
    for (const [PATH, ok] of [[r.bin, true], [fs.mkdtempSync(path.join(path.dirname(r.bin), 'empty-')), false]]) {
      process.env.PATH = PATH;
      const row = doctorChecks(r.dir, { builder: 'codex', reviewer: 'claude' }).find(c => /reviews tickets/.test(c.name));
      assert.equal(row.name, 'Claude Code (reviews tickets)');
      assert.equal(row.ok, ok, PATH);
    }
  } finally { process.env.PATH = saved; }
});
