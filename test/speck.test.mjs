import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseYaml, parseTicket, setField, lintTicket, nextAction, validateVerdict, reviewerSettings, ticketHeader, syncHeader, ticketRounds, ticketedStatus } from '../scripts/speck.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(ROOT, 'scripts', 'speck.mjs');
const cfg = { allow_same_model_review: false, limits: { max_acceptance_criteria: 5, max_ticket_body_lines: 40, max_review_rounds: 3, escalate_after_repeat_disputes: 2 } };

const ticket = (fm, body) => parseTicket(`---\n${fm}\n---\n${body}`);
const good = `## Problem\nUsers cannot export.\n## Outcome\nUsers can export CSV.\n## Acceptance criteria\n1. Export button downloads a CSV.\n## Out of scope\n- PDF export\n`;
const fm = (o = {}) => Object.entries({ id: '"0001"', title: 'Export bookings as CSV', status: 'draft', size: 'S', risk: 'low', builder: 'claude', reviewer: 'codex', ...o }).map(([k, v]) => `${k}: ${v}`).join('\n');

test('parseYaml handles nesting, comments and scalars', () => {
  const y = parseYaml('a: 1 # c\nb:\n  c: "x # y"\n  d: true\ne: []\nf: [1, 2]\n');
  assert.deepEqual(y, { a: 1, b: { c: 'x # y', d: true }, e: [], f: [1, 2] });
});

test('setField replaces values, keeps comments and adds missing fields', () => {
  const t = '---\nstatus: draft   # comment\n---\nbody';
  assert.equal(setField(t, 'status', 'ready'), '---\nstatus: ready   # comment\n---\nbody');
  assert.equal(setField(t, 'started', '2026-10-08T10:00:00Z'), '---\nstatus: draft   # comment\nstarted: "2026-10-08T10:00:00Z"\n---\nbody');
});

test('setField keeps the blank line before the closing fence', () => {
  const t = '---\nstatus: draft\n\n---\nbody';
  assert.equal(setField(t, 'status', 'ready'), '---\nstatus: ready\n\n---\nbody');
  assert.equal(setField(t, 'started', 'x'), '---\nstatus: draft\nstarted: x\n\n---\nbody');
  assert.deepEqual(parseTicket(t).fm, { status: 'draft' });
});

test('a well-formed ticket passes lint', () => {
  assert.deepEqual(lintTicket(ticket(fm(), good), cfg).errors, []);
});

test('size L, too many criteria and same-model review are errors', () => {
  const many = good.replace('1. Export button downloads a CSV.', [1, 2, 3, 4, 5, 6].map(n => `${n}. Criterion ${n}`).join('\n'));
  const r = lintTicket(ticket(fm({ size: 'L', reviewer: 'claude' }), many), cfg);
  assert.equal(r.errors.length, 3);
});

test('a claude-subagent reviewer counts as the same model as a claude builder', () => {
  const same = lintTicket(ticket(fm({ reviewer: 'claude-subagent' }), good), cfg).errors;
  assert.equal(same.length, 1, 'refused without allow_same_model_review');
  assert.match(same[0], /builder "claude" and reviewer "claude-subagent" are the same model/);
  assert.match(same[0], /allow_same_model_review: true/);
  assert.deepEqual(lintTicket(ticket(fm({ reviewer: 'claude-subagent' }), good), { ...cfg, allow_same_model_review: true }).errors, []);
  assert.deepEqual(lintTicket(ticket(fm({ reviewer: 'codex' }), good), cfg).errors, [], 'a different model is fine');
  assert.equal(lintTicket(ticket(fm({ builder: 'codex', reviewer: 'codex' }), good), cfg).errors.length, 1, 'identical names still refused');
});

test('titles joining outcomes get a warning', () => {
  assert.equal(lintTicket(ticket(fm({ title: 'Add search and add filters' }), good), cfg).warnings.filter(w => /two outcomes/.test(w)).length, 1);
  assert.equal(lintTicket(ticket(fm(), good), cfg).warnings.filter(w => /two outcomes/.test(w)).length, 0);
});

test('an approve with failing criteria is overridden', () => {
  const v = validateVerdict({ verdict: 'approve', criteria: [{ id: 1, status: 'fail', evidence: '' }], findings: [], product_md: { accurate: true, note: '' }, summary: 's', escalation_question: '' });
  assert.equal(v.verdict, 'changes_requested');
});

const round = (verdict, findings = []) => ({ meta: {}, verdict: { verdict, findings, criteria: [], escalation_question: '' } });
test('nextAction: approve ships, max rounds and repeat disputes block', () => {
  assert.equal(nextAction([round('approve')], cfg).action, 'ship');
  assert.equal(nextAction([round('changes_requested')], cfg).action, 'fix');
  assert.equal(nextAction([1, 2, 3].map(() => round('changes_requested')), cfg).action, 'block');
  const d = [{ id: 'F1', state: 'dispute_rejected', severity: 'blocking' }];
  assert.equal(nextAction([round('changes_requested', d), round('changes_requested', d)], cfg).action, 'block');
  assert.equal(nextAction([round('escalate')], cfg).action, 'block');
});

test('CLI: init, new, lint, set ready, status', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  const run = (...a) => spawnSync('node', [CLI, ...a], { cwd: dir, encoding: 'utf8' });
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  assert.equal(run('init', '--skip-checks').status, 0);
  assert.ok(fs.existsSync(path.join(dir, 'speck', 'config.yml')));
  assert.match(fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8'), /@AGENTS\.md/);
  assert.match(fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8'), /\/speck-build/);
  const file = run('new', 'Export', 'bookings', 'as', 'CSV').stdout.trim();
  assert.equal(file, path.join('speck', 'tickets', '0001-export-bookings-as-csv.md'));
  assert.equal(run('lint', '1').status, 1, 'empty template must fail lint');
  assert.notEqual(run('set', '1', 'status', 'ready').status, 0, 'cannot be ready while lint fails');
  const p = path.join(dir, file);
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8').split('## Problem')[0] + good);
  assert.equal(run('lint', '1').status, 0);
  assert.equal(run('set', '1', 'status', 'ready').status, 0);
  assert.match(run('status').stdout, /READY \(1\)/);
  assert.equal(run('new', 'Second').stdout.trim(), path.join('speck', 'tickets', '0002-second.md'));
});

test('init installs the CLI and skills into the project, and re-running refreshes them', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const init = () => spawnSync('node', [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(init().status, 0);
  const names = fs.readdirSync(path.join(ROOT, 'skills')).filter(n => n.startsWith('speck-'));
  assert.equal(names.length, 6);
  for (const base of ['.claude/skills', '.agents/skills']) {
    for (const n of names) {
      const md = fs.readFileSync(path.join(dir, base, n, 'SKILL.md'), 'utf8');
      assert.match(md, new RegExp(`^---\\nname: ${n}\\n`), `${base}/${n} name matches its folder`);
      assert.doesNotMatch(md, /CLAUDE_PLUGIN_ROOT|\/speck:/);
      assert.ok(!fs.lstatSync(path.join(dir, base, n)).isSymbolicLink(), 'copied, not linked');
    }
  }
  // The installed CLI works on its own, as the skills call it.
  const local = (...a) => spawnSync('node', ['.speck/scripts/speck.mjs', ...a], { cwd: dir, encoding: 'utf8' });
  assert.equal(local('new', 'First').status, 0);
  assert.equal(local('status').status, 0);
  assert.notEqual(local('init').status, 0, 'the installed copy points people at the real installer');
  // Re-running replaces stale skill files but keeps the user's config.
  fs.writeFileSync(path.join(dir, '.claude/skills/speck-build/SKILL.md'), 'stale');
  fs.appendFileSync(path.join(dir, 'speck/config.yml'), '# mine\n');
  assert.equal(init().status, 0);
  assert.match(fs.readFileSync(path.join(dir, '.claude/skills/speck-build/SKILL.md'), 'utf8'), /name: speck-build/);
  assert.match(fs.readFileSync(path.join(dir, 'speck/config.yml'), 'utf8'), /# mine/);
});

test('doctor gives a plain-English fix for anything missing', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-bin-'));
  fs.symlinkSync(process.execPath, path.join(bin, 'node')); // a PATH with Node and nothing else
  const r = spawnSync(process.execPath, [CLI, 'doctor'], { cwd: dir, encoding: 'utf8', env: { ...process.env, PATH: bin } });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /✓ Node\.js 20 or newer/);
  assert.match(r.stdout, /✗ git\n\s+Fix: Install git/);
  assert.match(r.stdout, /✗ Codex CLI/);
});

// ---------- 0005: reviewer model and effort ----------

const EFFORT_VALUES = ['low', 'medium', 'high', 'xhigh', 'max'];
const gitIn = (dir, ...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd: dir, encoding: 'utf8' });

// A repo with speck installed, one ready ticket on a branch, and a fake `codex` on PATH that logs its arguments.
function reviewRepo({ config = '', ticketFields = '', extraEnv = {} } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-bin-'));
  const log = path.join(bin, 'calls.log');
  fs.writeFileSync(path.join(bin, 'codex'), `#!${process.execPath}
const fs = require('fs');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify(args) + '\\n');
fs.appendFileSync(${JSON.stringify(log + '.prompts')}, JSON.stringify(fs.readFileSync(0, 'utf8')) + '\\n');
const out = args[args.indexOf('-o') + 1];
fs.writeFileSync(out, JSON.stringify({ verdict: 'changes_requested', criteria: [{ id: 1, status: 'pass', evidence: 'ok' }], findings: [], product_md: { accurate: true, note: '' }, summary: 'fine', escalation_question: '' }));
console.log(JSON.stringify({ type: 'thread.started', thread_id: 'T1' }));
if (process.env.FAKE_CODEX_EVENT) console.log(process.env.FAKE_CODEX_EVENT);
`, { mode: 0o755 });
  const env = { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}` };
  const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env: { ...env, ...extraEnv } });
  gitIn(dir, 'init', '-q', '-b', 'main');
  assert.equal(run('init', '--skip-checks').status, 0);
  const cfgFile = path.join(dir, 'speck', 'config.yml');
  fs.writeFileSync(cfgFile, fs.readFileSync(cfgFile, 'utf8') + config);
  const file = path.join(dir, run('new', 'Export bookings').stdout.trim());
  let text = fs.readFileSync(file, 'utf8').split('## Problem')[0] + good;
  for (const line of ticketFields.split('\n').filter(Boolean)) { const [k, ...v] = line.split(': '); text = setField(text, k, v.join(': ')); }
  fs.writeFileSync(file, text);
  gitIn(dir, 'add', '-A'); gitIn(dir, 'commit', '-qm', 'base');
  gitIn(dir, 'checkout', '-qb', 'speck/0001-x');
  fs.writeFileSync(path.join(dir, 'a.txt'), 'change\n');
  gitIn(dir, 'add', '-A'); gitIn(dir, 'commit', '-qm', 'work');
  const calls = () => fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').map(l => JSON.parse(l)) : [];
  const prompts = () => fs.existsSync(log + '.prompts') ? fs.readFileSync(log + '.prompts', 'utf8').trim().split('\n').map(l => JSON.parse(l)) : [];
  // Rounds are kept in the ticket file (0011).
  const roundFile = n => ticketRounds(fs.readFileSync(file, 'utf8')).rounds[n - 1];
  return { dir, run, calls, prompts, roundFile, ticketFile: file, git: (...a) => gitIn(dir, ...a) };
}

test('AC1: config and ticket templates have blank reviewer_model and reviewer_effort', () => {
  const config = parseYaml(fs.readFileSync(path.join(ROOT, 'templates', 'config.yml'), 'utf8'));
  assert.equal(config.reviewer_model, '');
  assert.equal(config.reviewer_effort, '');
  const t = parseTicket(fs.readFileSync(path.join(ROOT, 'templates', 'ticket.md'), 'utf8'));
  assert.equal(t.fm.reviewer_model, '');
  assert.equal(t.fm.reviewer_effort, '');
});

test('AC1: speck new copies the config values into the ticket', () => {
  const { ticketFile } = reviewRepo({ config: 'reviewer_model: some-model-1\nreviewer_effort: high\n' });
  const t = parseTicket(fs.readFileSync(ticketFile, 'utf8'));
  assert.equal(t.fm.reviewer_model, 'some-model-1');
  assert.equal(t.fm.reviewer_effort, 'high');
});

test('AC1: a ticket value overrides config and a blank ticket value falls back to config', () => {
  const c = { reviewer_model: 'cfg-model', reviewer_effort: 'low' };
  assert.deepEqual(reviewerSettings({ reviewer_model: 'tkt-model', reviewer_effort: 'max' }, c), { model: 'tkt-model', effort: 'max' });
  assert.deepEqual(reviewerSettings({ reviewer_model: '', reviewer_effort: '' }, c), { model: 'cfg-model', effort: 'low' });
  assert.deepEqual(reviewerSettings({}, c), { model: 'cfg-model', effort: 'low' });
  assert.deepEqual(reviewerSettings({ reviewer_model: 'tkt-model' }, { reviewer_model: '', reviewer_effort: '' }), { model: 'tkt-model', effort: null });
});

test('AC2: with nothing set, no model or effort is passed to codex', () => {
  assert.deepEqual(reviewerSettings({ reviewer_model: '', reviewer_effort: '' }, { reviewer_model: '', reviewer_effort: '' }), { model: null, effort: null });
  const { run, calls } = reviewRepo();
  assert.equal(run('review', '1').status, 10);
  const args = calls()[0];
  assert.ok(!args.includes('-m') && !args.includes('--model'), args.join(' '));
  assert.ok(!args.some(a => /model/.test(a)), args.join(' '));
});

test('AC2: no model name is hard-coded in speck code, templates or skills', () => {
  const MODEL = /\b(gpt-[\w.-]+|o[1-9](-mini|-pro)?|claude-(opus|sonnet|haiku|instant)[\w.-]*|(opus|sonnet|haiku)-?\d[\w.-]*|gemini-[\w.-]+|codex-mini[\w.-]*)\b/i;
  const files = d => fs.readdirSync(path.join(ROOT, d), { recursive: true }).map(f => path.join(ROOT, d, f)).filter(f => fs.statSync(f).isFile());
  for (const f of [...files('scripts'), ...files('templates'), ...files('skills')]) {
    const hit = fs.readFileSync(f, 'utf8').match(MODEL);
    assert.equal(hit, null, `${path.relative(ROOT, f)} names a model: ${hit && hit[0]}`);
  }
});

test('AC3: speck review passes the model and effort to codex in round 1 and resumed rounds', () => {
  const { run, calls } = reviewRepo({ config: 'reviewer_model: cfg-model\nreviewer_effort: low\n', ticketFields: 'reviewer_model: tkt-model-2\nreviewer_effort: xhigh' });
  assert.equal(run('review', '1').status, 10);
  assert.equal(run('review', '1').status, 10);
  const [r1, r2] = calls();
  assert.deepEqual(r1.slice(0, 1), ['exec']);
  assert.deepEqual(r2.slice(0, 2), ['exec', 'resume']);
  for (const args of [r1, r2]) {
    assert.equal(args[args.indexOf('-m') + 1], 'tkt-model-2');
    assert.ok(args.includes('model_reasoning_effort="xhigh"'), args.join(' '));
  }
});

test('AC3: the review skill tells the builder to start a claude-subagent with the resolved model and effort (manual smoke test in ticket 0005 Notes)', () => {
  const skill = fs.readFileSync(path.join(ROOT, 'skills', 'speck-review', 'SKILL.md'), 'utf8');
  assert.match(skill, /speck reviewer-settings <id>/);
  assert.match(skill, /`model`/);
  assert.match(skill, /`effort`/);
  const { run } = reviewRepo({ ticketFields: 'reviewer_model: tkt-model\nreviewer_effort: medium' });
  assert.match(run('reviewer-settings', '1').stdout, /model: tkt-model\neffort: medium/);
  assert.match(reviewRepo().run('reviewer-settings', '1').stdout, /model: default\neffort: default/);
});

test('AC4: lint rejects an unknown reviewer_effort and passes model names through', () => {
  for (const e of ['', ...EFFORT_VALUES])
    assert.deepEqual(lintTicket(ticket(fm({ reviewer_effort: `"${e}"`, reviewer_model: 'Anything at all/9' }), good), cfg).errors, [], e);
  for (const e of ['huge', 'minimal', 'HIGH'])
    assert.equal(lintTicket(ticket(fm({ reviewer_effort: e }), good), cfg).errors.length, 1, e);
  assert.equal(lintTicket(ticket(fm(), good), { ...cfg, reviewer_effort: 'huge' }).errors.length, 1, 'config value is checked too');
});

test('AC5: saved rounds and the review pack show the reviewer model and effort, or default', () => {
  const set = reviewRepo({ ticketFields: 'reviewer_model: tkt-model\nreviewer_effort: high' });
  assert.equal(set.run('review', '1').status, 10);
  assert.equal(set.roundFile(1).meta.reviewer_model, 'tkt-model');
  assert.equal(set.roundFile(1).meta.reviewer_effort, 'high');
  const pack = set.run('pack', '1').stdout;
  assert.match(pack, /\*\*Verdict:\*\*.*model tkt-model, effort high/);
  assert.match(pack, /Round 1 \(codex, model tkt-model, effort high\)/);

  const unset = reviewRepo();
  assert.equal(unset.run('review', '1').status, 10);
  assert.equal(unset.roundFile(1).meta.reviewer_model, 'default');
  assert.equal(unset.roundFile(1).meta.reviewer_effort, 'default');
  assert.match(unset.run('pack', '1').stdout, /Round 1 \(codex, model default, effort default\)/);

  // Rounds recorded from another reviewer carry the settings too.
  const v = path.join(unset.dir, 'v.json');
  fs.writeFileSync(v, JSON.stringify({ verdict: 'approve', criteria: [{ id: 1, status: 'pass', evidence: 'ok' }], findings: [], product_md: { accurate: true, note: '' }, summary: 's', escalation_question: '' }));
  unset.run('record', '1', v, '--reviewer=claude-subagent');
  assert.equal(unset.roundFile(2).meta.reviewer_model, 'default');
  assert.equal(unset.roundFile(2).meta.reviewer_effort, 'default');
});

test('AC5: recorded subagent rounds keep the settings the reviewer was started with', () => {
  const r = reviewRepo({ ticketFields: 'reviewer_model: first-model\nreviewer_effort: low' });
  assert.match(r.run('reviewer-settings', '1').stdout, /model: first-model\neffort: low/);
  const v = path.join(r.dir, 'v.json');
  fs.writeFileSync(v, JSON.stringify({ verdict: 'changes_requested', criteria: [{ id: 1, status: 'pass', evidence: 'ok' }], findings: [], product_md: { accurate: true, note: '' }, summary: 's', escalation_question: '' }));
  r.run('record', '1', v, '--reviewer=claude-subagent');
  // The ticket's settings change mid-loop, but the same subagent is resumed for round 2.
  fs.writeFileSync(r.ticketFile, setField(setField(fs.readFileSync(r.ticketFile, 'utf8'), 'reviewer_model', 'second-model'), 'reviewer_effort', 'max'));
  r.run('record', '1', v, '--reviewer=claude-subagent');
  for (const n of [1, 2]) {
    assert.equal(r.roundFile(n).meta.reviewer_model, 'first-model');
    assert.equal(r.roundFile(n).meta.reviewer_effort, 'low');
  }
});

// ---------- 0006: ship approved tickets locally ----------

const gitEnv = { GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
const approveVerdict = { verdict: 'approve', criteria: [{ id: 1, status: 'pass', evidence: 'ok' }], findings: [], product_md: { accurate: true, note: '' }, summary: 's', escalation_question: '' };

// A repo with one ticket built on its branch, approved by the reviewer and set to `approved`.
function shipRepo({ test = 'true', approve = true } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-ship-'));
  const env = { ...process.env, ...gitEnv };
  const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env });
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', env }).stdout.trim();
  g('init', '-q', '-b', 'main');
  assert.equal(run('init', '--skip-checks').status, 0);
  const cfgFile = path.join(dir, 'speck', 'config.yml');
  fs.writeFileSync(cfgFile, fs.readFileSync(cfgFile, 'utf8').replace(/^  test: .*$/m, `  test: ${JSON.stringify(test)}`));
  const file = path.join(dir, run('new', 'Export bookings').stdout.trim());
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').split('## Problem')[0] + good);
  fs.writeFileSync(path.join(dir, 'shared.txt'), 'base\n');
  g('add', '-A'); g('commit', '-qm', 'base');
  g('checkout', '-qb', 'speck/0001-export-bookings');
  fs.writeFileSync(path.join(dir, 'shared.txt'), 'feature\n');
  g('add', '-A'); g('commit', '-qm', 'work');
  if (approve) {
    const v = path.join(os.tmpdir(), `verdict-${path.basename(dir)}.json`);
    fs.writeFileSync(v, JSON.stringify(approveVerdict));
    run('record', '1', v);
    run('set', '1', 'status', 'approved');
    g('add', '-A'); g('commit', '-qm', 'approved');
  }
  // A shipped ticket moves into speck/tickets/done/, so look in both places.
  const ticketAt = () => ['speck/tickets/0001-export-bookings.md', 'speck/tickets/done/0001-export-bookings.md']
    .map(p => path.join(dir, p)).find(p => fs.existsSync(p));
  const status = () => parseTicket(fs.readFileSync(ticketAt(), 'utf8')).fm.status;
  const state = () => ({ branch: g('branch', '--show-current'), main: g('rev-parse', 'main'), feature: g('rev-parse', '--verify', '-q', 'speck/0001-export-bookings') });
  return { dir, run, g, status, state };
}

test('AC1: approved is a valid status, listed first by speck status as waiting for the user', () => {
  const r = shipRepo();
  assert.equal(r.status(), 'approved');
  assert.equal(r.run('new', 'Another').status, 0);
  const out = r.run('status').stdout;
  assert.match(out, /APPROVED \(1\)/);
  assert.ok(out.indexOf('APPROVED') < out.indexOf('DRAFT'), out);
  assert.match(out, /\/speck-ship/);
});

test('AC1: the build ends at approved, with no PR and no GitHub CLI', () => {
  const build = fs.readFileSync(path.join(ROOT, 'skills', 'speck-build', 'SKILL.md'), 'utf8');
  const approvedStep = build.split('## 5. Approved')[1].split('\n## ')[0];
  assert.match(approvedStep, /`## Review log`/);
  assert.match(approvedStep, /`## Delivery log`/);
  assert.match(approvedStep, /speck set <id> status approved/);
  assert.match(approvedStep, /commit the ticket \(`speck\(<id>\): approved`\)/);
  assert.ok(approvedStep.indexOf('Review log') < approvedStep.indexOf('status approved'), 'logs are filled in before approval is committed');
  for (const n of ['speck-build', 'speck-review', 'speck-ship'])
    assert.doesNotMatch(fs.readFileSync(path.join(ROOT, 'skills', n, 'SKILL.md'), 'utf8'), /\bgh\s|pull request|gh pr/i, n);
});

test('AC2: speck ship refuses, changing nothing, unless every check passes', () => {
  const cases = [
    ['not approved', r => { r.run('set', '1', 'status', 'reviewing'); r.g('commit', '-qam', 'x'); }, /approved/],
    ['dirty tree', r => fs.writeFileSync(path.join(r.dir, 'shared.txt'), 'dirty\n'), /uncommitted|clean/i],
    ['code changed after review', r => { fs.writeFileSync(path.join(r.dir, 'later.js'), '1\n'); r.g('add', '-A'); r.g('commit', '-qm', 'late'); }, /later\.js/],
  ];
  for (const [name, breakIt, why] of cases) {
    const r = shipRepo();
    breakIt(r);
    const before = r.state();
    const res = r.run('ship', '1');
    assert.notEqual(res.status, 0, name);
    assert.match(res.stderr, why, name);
    assert.deepEqual(r.state(), before, name);
  }
  // No approving review round, so speck next doesn't say ship.
  const none = shipRepo({ approve: false });
  none.run('set', '1', 'status', 'approved'); none.g('commit', '-qam', 'x');
  const b = none.state();
  assert.match(none.run('ship', '1').stderr, /review/i);
  assert.deepEqual(none.state(), b);
  // A code change after the review that was later reverted still counts (F1).
  const reverted = shipRepo();
  fs.writeFileSync(path.join(reverted.dir, 'sneaky.js'), '1\n'); reverted.g('add', '-A'); reverted.g('commit', '-qm', 'add');
  reverted.g('rm', '-q', 'sneaky.js'); reverted.g('commit', '-qm', 'revert');
  const rb = reverted.state();
  const rr = reverted.run('ship', '1');
  assert.notEqual(rr.status, 0);
  assert.match(rr.stderr, /sneaky\.js/);
  assert.deepEqual(reverted.state(), rb);
  // No test command set (F2).
  const noTests = shipRepo({ test: '' });
  const nb = noTests.state();
  const nr = noTests.run('ship', '1');
  assert.notEqual(nr.status, 0);
  assert.match(nr.stderr, /commands\.test/);
  assert.deepEqual(noTests.state(), nb);
  assert.equal(noTests.status(), 'approved');
  assert.equal(noTests.g('status', '--porcelain'), '');
  // Failing tests.
  const failing = shipRepo({ test: 'exit 3' });
  const f = failing.state();
  const res = failing.run('ship', '1');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /test/i);
  assert.deepEqual(failing.state(), f);
  assert.equal(failing.status(), 'approved');
});

test('AC2: changes under speck/ after the review do not block shipping', () => {
  const r = shipRepo();
  fs.appendFileSync(path.join(r.dir, 'speck', 'product.md'), '\nnote\n');
  r.g('commit', '-qam', 'speck only');
  assert.equal(r.run('ship', '1').status, 0);
});

test('AC3: speck ship marks the ticket done, merges with a merge commit, deletes the branch and leaves you on main', () => {
  const r = shipRepo();
  const res = r.run('ship', '1');
  assert.equal(res.status, 0, res.stderr);
  const s = r.state();
  assert.equal(s.branch, 'main');
  assert.equal(s.feature, '', 'branch deleted');
  assert.equal(r.g('rev-list', '--parents', '-n', '1', 'main').split(' ').length, 3, 'merge commit');
  assert.equal(r.status(), 'done');
  assert.match(fs.readFileSync(path.join(r.dir, 'speck', 'tickets', 'done', '0001-export-bookings.md'), 'utf8'), /^finished: /m);
  assert.equal(fs.readFileSync(path.join(r.dir, 'shared.txt'), 'utf8'), 'feature\n');
  assert.equal(r.g('status', '--porcelain'), '');
});

test('AC3: a conflicting merge is aborted and leaves main and the branch as they were', () => {
  const r = shipRepo();
  r.g('checkout', '-q', 'main');
  fs.writeFileSync(path.join(r.dir, 'shared.txt'), 'main moved\n');
  r.g('commit', '-qam', 'main moved');
  r.g('checkout', '-q', 'speck/0001-export-bookings');
  const before = r.state();
  const res = r.run('ship', '1');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /conflict/i);
  assert.deepEqual(r.state(), before);
  assert.equal(r.g('status', '--porcelain'), '');
  assert.equal(r.status(), 'approved');
});

test('AC4: speck ship pushes main to its remote, or says why it did not', () => {
  // With a remote.
  const r = shipRepo();
  const bare = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-remote-'));
  spawnSync('git', ['init', '-q', '--bare', '-b', 'main', bare]);
  r.g('remote', 'add', 'origin', bare);
  r.g('push', '-q', '-u', 'origin', 'main');
  r.g('push', '-q', '-u', 'origin', 'speck/0001-export-bookings');
  const res = r.run('ship', '1');
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /pushed/i);
  assert.equal(spawnSync('git', ['rev-parse', 'main'], { cwd: bare, encoding: 'utf8' }).stdout.trim(), r.g('rev-parse', 'main'));
  // The ticket branch is deleted on the remote as well as locally.
  const remoteHeads = () => spawnSync('git', ['for-each-ref', '--format=%(refname:short)', 'refs/heads'], { cwd: bare, encoding: 'utf8' }).stdout.trim();
  assert.equal(remoteHeads(), 'main');
  assert.match(res.stdout, /Deleted speck\/0001-export-bookings on origin/);
  // Without a remote.
  const local = shipRepo();
  const out = local.run('ship', '1');
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /no remote/i);
  // A refused push: the merge stays, and the user is told how to fix it.
  const refused = shipRepo();
  const bare2 = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-remote-'));
  spawnSync('git', ['init', '-q', '--bare', '-b', 'main', bare2]);
  refused.g('remote', 'add', 'origin', bare2);
  refused.g('push', '-q', '-u', 'origin', 'main');
  refused.g('push', '-q', '-u', 'origin', 'speck/0001-export-bookings');
  fs.writeFileSync(path.join(bare2, 'hooks', 'pre-receive'), '#!/bin/sh\necho "protected branch" >&2\nexit 1\n', { mode: 0o755 });
  const p = refused.run('ship', '1');
  assert.notEqual(p.status, 0);
  assert.match(p.stderr, /push/i);
  assert.match(p.stderr, /git push/);
  assert.equal(refused.state().branch, 'main');
  assert.equal(refused.status(), 'done');
  // The push failed, so the remote copy of the branch is kept as the backup.
  assert.match(spawnSync('git', ['for-each-ref', '--format=%(refname:short)', 'refs/heads'], { cwd: bare2, encoding: 'utf8' }).stdout, /speck\/0001-export-bookings/);
  assert.match(p.stderr, /kept on origin/);
});

test('AC4: doctor treats the GitHub CLI as optional', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-bin-'));
  fs.symlinkSync(process.execPath, path.join(bin, 'node'));
  const r = spawnSync(process.execPath, [CLI, 'doctor'], { cwd: dir, encoding: 'utf8', env: { ...process.env, PATH: bin } });
  assert.doesNotMatch(r.stdout, /✗ GitHub CLI/);
  assert.match(r.stdout, /GitHub CLI.*optional/i);
});

test('AC5: only the user can ship, and the agent rules say so', () => {
  const ship = fs.readFileSync(path.join(ROOT, 'skills', 'speck-ship', 'SKILL.md'), 'utf8');
  assert.match(ship.split('\n---')[0], /^disable-model-invocation: true$/m);
  assert.match(ship, /speck ship <id>/);
  for (const n of ['speck-build', 'speck-review'])
    assert.match(fs.readFileSync(path.join(ROOT, 'skills', n, 'SKILL.md'), 'utf8'), /never (merge|ship)[^.]*unless the user runs `\/speck-ship`/i, n);
  assert.match(fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8'), /unless the user runs `\/speck-ship`/);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  spawnSync(process.execPath, [CLI, 'init', '--skip-checks'], { cwd: dir });
  assert.match(fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8'), /unless the user runs `\/speck-ship`/);
});

test('AC3: speck ship works when run from main, where the ticket is not yet approved', () => {
  const r = shipRepo();
  r.g('checkout', '-q', 'main');
  const res = r.run('ship', '1');
  assert.equal(res.status, 0, res.stderr);
  assert.equal(r.status(), 'done');
  assert.equal(r.state().feature, '');
});

// ---------- 0007: finished tickets move into speck/tickets/done/ ----------

// A repo with speck installed, plus helpers for lint-clean tickets and file paths.
function doneRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-done-'));
  const env = { ...process.env, ...gitEnv };
  const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env });
  const at = p => fs.existsSync(path.join(dir, p));
  const read = p => fs.readFileSync(path.join(dir, p), 'utf8');
  const fm = p => parseTicket(read(p)).fm;
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir, encoding: 'utf8', env });
  assert.equal(run('init', '--skip-checks').status, 0);
  const add = title => {
    const p = run('new', ...title.split(' ')).stdout.trim();
    fs.writeFileSync(path.join(dir, p), read(p).split('## Problem')[0] + good);
    return p;
  };
  return { dir, run, add, at, read, fm };
}

test('AC1: setting a ticket to done moves it into speck/tickets/done/, and out again', () => {
  const r = doneRepo();
  const live = r.add('Export bookings');
  const done = path.join('speck', 'tickets', 'done', path.basename(live));
  assert.equal(r.run('set', '1', 'status', 'done').status, 0);
  assert.equal(r.at(live), false, 'no longer in speck/tickets/');
  assert.equal(r.at(done), true, 'moved into speck/tickets/done/ under the same name');
  assert.equal(r.fm(done).status, 'done');
  assert.match(r.read(done), /^finished: /m, 'the finished timestamp survives the move');
  // A done ticket that goes back to work returns to speck/tickets/.
  assert.equal(r.run('set', '1', 'status', 'reviewing').status, 0);
  assert.equal(r.at(live), true);
  assert.equal(r.at(done), false, 'only one copy is left behind');
});

test('AC1: speck ship leaves the finished ticket in speck/tickets/done/', () => {
  const r = shipRepo();
  const res = r.run('ship', '1');
  assert.equal(res.status, 0, res.stderr);
  assert.equal(fs.existsSync(path.join(r.dir, 'speck', 'tickets', 'done', '0001-export-bookings.md')), true);
  assert.equal(fs.existsSync(path.join(r.dir, 'speck', 'tickets', '0001-export-bookings.md')), false);
  assert.equal(r.g('status', '--porcelain'), '', 'the move is committed, not left loose');
});

test('AC2: commands find a done ticket, status still lists it, and new never reuses its number', () => {
  const r = doneRepo();
  r.add('Export bookings');
  assert.equal(r.run('set', '1', 'status', 'done').status, 0);
  const done = path.join('speck', 'tickets', 'done', '0001-export-bookings.md');
  // A command that takes an id finds the ticket in the done folder.
  assert.equal(r.run('set', '1', 'priority', '1').status, 0);
  assert.equal(r.fm(done).priority, 1);
  assert.equal(r.run('lint', '1').status, 0);
  assert.equal(r.run('set', '1', 'status', 'ready').status, 0, 'lint found the ticket in the done folder too');
  assert.equal(r.at(path.join('speck', 'tickets', '0001-export-bookings.md')), true, 'a live ticket is back in speck/tickets/');
  assert.equal(r.run('status').stdout.includes('DONE (1)'), false, 'it is not done any more');
  assert.equal(r.run('set', '1', 'status', 'done').status, 0);
  assert.match(r.run('status').stdout, /DONE \(1\)/, 'done tickets are still listed');
  // The next number skips the one in the done folder.
  assert.equal(r.run('new', 'Second').stdout.trim(), path.join('speck', 'tickets', '0002-second.md'));
});

test('AC3: speck init moves done tickets left in speck/tickets/ and leaves the others alone', () => {
  const r = doneRepo();
  const oldLayout = r.add('Old work');
  const live = r.add('New work');
  assert.equal(r.run('set', '1', 'status', 'done').status, 0);
  // Put the done ticket back where the previous version of speck kept it.
  fs.renameSync(path.join(r.dir, 'speck', 'tickets', 'done', path.basename(oldLayout)), path.join(r.dir, oldLayout));
  assert.equal(r.at(path.join('speck', 'tickets', 'done', path.basename(oldLayout))), false);
  const first = r.run('init', '--skip-checks');
  assert.equal(first.status, 0);
  assert.match(first.stdout, /moved\s+1 done ticket into speck\/tickets\/done\//);
  // Running it again finds nothing to move and says nothing.
  assert.doesNotMatch(r.run('init', '--skip-checks').stdout, /moved/);
  assert.equal(r.at(path.join('speck', 'tickets', 'done', path.basename(oldLayout))), true);
  assert.equal(r.at(oldLayout), false);
  assert.equal(r.at(live), true, 'a ticket still in progress stays where it is');
  assert.equal(r.at(path.join('speck', 'tickets', 'done', path.basename(live))), false, 'and is not moved into done/');
  assert.equal(r.fm(live).status, 'draft', 'it was left untouched');
});

test('AC3: a name clash makes init refuse rather than overwrite an archived ticket (F1)', () => {
  const r = doneRepo();
  const live = r.add('Old work');
  const done = path.join('speck', 'tickets', 'done', path.basename(live));
  // The same file name in both folders, with different contents.
  fs.writeFileSync(path.join(r.dir, done), r.read(live).replace('status: draft', 'status: done') + 'ARCHIVED COPY\n');
  fs.writeFileSync(path.join(r.dir, live), r.read(live).replace('status: draft', 'status: done') + 'LIVE COPY\n');
  const init = r.run('init', '--skip-checks');
  assert.notEqual(init.status, 0);
  assert.match(init.stderr, /two tickets called 0001-old-work\.md/);
  assert.match(r.read(done), /ARCHIVED COPY/, 'the archived ticket is not overwritten');
  assert.match(r.read(live), /LIVE COPY/, 'the live ticket is still there');
});

test('AC2: pack and reviewer-settings find a shipped ticket in the done folder', () => {
  const r = shipRepo();
  assert.equal(r.run('ship', '1').status, 0);
  const pack = r.run('pack', '1');
  assert.equal(pack.status, 0, pack.stderr);
  assert.match(pack.stdout, /0001 · Export bookings/);
  assert.equal(r.run('reviewer-settings', '1').status, 0);
});

test('init skips a ticket file it cannot read, and still updates speck', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const init = () => spawnSync(process.execPath, [CLI, 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8' });
  assert.equal(init().status, 0);
  fs.writeFileSync(path.join(dir, 'speck', 'tickets', '0003-broken.md'), 'no frontmatter here\n');
  fs.writeFileSync(path.join(dir, '.claude', 'skills', 'speck-build', 'SKILL.md'), 'stale');
  const r = init();
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /skipped speck\/tickets\/0003-broken\.md/);
  assert.ok(fs.existsSync(path.join(dir, 'speck', 'tickets', '0003-broken.md')), 'left where it was');
  assert.match(fs.readFileSync(path.join(dir, '.claude', 'skills', 'speck-build', 'SKILL.md'), 'utf8'), /name: speck-build/, 'skills still refreshed');
});

// A ticket ready to ship, with main on a bare remote that someone else has pushed to.
function shipWithRemoteMoved(file, content) {
  const r = shipRepo();
  const bare = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-remote-'));
  spawnSync('git', ['init', '-q', '--bare', '-b', 'main', bare]);
  r.g('remote', 'add', 'origin', bare);
  r.g('push', '-q', '-u', 'origin', 'main');
  const other = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-other-'));
  const o = (...a) => spawnSync('git', a, { cwd: other, encoding: 'utf8', env: { ...process.env, ...gitEnv } });
  o('clone', '-q', bare, '.');
  fs.writeFileSync(path.join(other, file), content);
  o('add', '-A'); o('commit', '-qm', 'someone else'); o('push', '-q', 'origin', 'main');
  const remoteMain = () => spawnSync('git', ['rev-parse', 'main'], { cwd: bare, encoding: 'utf8' }).stdout.trim();
  return { ...r, bare, remoteMain, theirs: o('rev-parse', 'HEAD').stdout.trim() };
}

test('ship catches up with new commits on the remote before merging, then pushes', () => {
  const r = shipWithRemoteMoved('other.txt', 'from elsewhere\n');
  const res = r.run('ship', '1');
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /bringing your main up to date/);
  assert.equal(spawnSync('git', ['merge-base', '--is-ancestor', r.theirs, 'main'], { cwd: r.dir }).status, 0, 'remote commit is in main');
  assert.ok(fs.existsSync(path.join(r.dir, 'other.txt')));
  assert.equal(r.remoteMain(), r.g('rev-parse', 'main'), 'pushed');
  assert.equal(r.status(), 'done');
});

test('ship refuses, changing nothing, when local and remote main have both moved on', () => {
  const r = shipWithRemoteMoved('other.txt', 'from elsewhere\n');
  r.g('checkout', '-q', 'main');
  fs.writeFileSync(path.join(r.dir, 'local.txt'), 'local\n');
  r.g('add', '-A'); r.g('commit', '-qm', 'local only');
  const before = r.state();
  const remoteBefore = r.remoteMain();
  const res = r.run('ship', '1');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /git pull/);
  assert.doesNotMatch(res.stderr, /protected/);
  assert.deepEqual(r.state(), before);
  assert.equal(r.remoteMain(), remoteBefore);
});

test('a conflict with new remote commits leaves local main exactly as it was', () => {
  const r = shipWithRemoteMoved('shared.txt', 'changed elsewhere\n');
  const before = r.state();
  const res = r.run('ship', '1');
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /conflict/i);
  assert.deepEqual(r.state(), before);
  assert.equal(r.g('status', '--porcelain'), '');
});

// ---------- 0004: a readable header at the top of every ticket ----------

const EMOJI = { draft: '📝', ready: '📋', building: '🔨', reviewing: '🔍', blocked: '⛔', approved: '👍', done: '✅' };
const bodyOf = text => text.slice(text.indexOf('\n---', 4) + 5);
const headerOf = text => bodyOf(text).split('\n').slice(0, 3).join('\n');

test('AC1: speck new writes the heading and status line straight after the frontmatter', () => {
  const r = shipRepo({ approve: false });
  const file = path.join(r.dir, r.run('new', 'Search: by date').stdout.trim());
  const text = fs.readFileSync(file, 'utf8');
  assert.equal(headerOf(text), '# 0002 · Search: by date\n\n**Status:** 📝 draft');
  assert.equal(parseTicket(text).fm.title, 'Search: by date');
});

test('AC1: every status has its own emoji, and none is a coloured circle', () => {
  for (const [status, emoji] of Object.entries(EMOJI))
    assert.match(ticketHeader({ id: '0009', title: 'T', status }), new RegExp(`\\*\\*Status:\\*\\* ${emoji} ${status}$`));
  assert.equal(new Set(Object.values(EMOJI)).size, 7);
  assert.doesNotMatch(Object.values(EMOJI).join(''), /[🔴🟠🟡🟢🔵🟣🟤⚫⚪]/u);
});

test('AC2: speck set and speck ship keep the header in sync, and add it if missing', () => {
  const r = shipRepo();
  const file = () => fs.readdirSync(path.join(r.dir, 'speck', 'tickets')).includes('0001-export-bookings.md')
    ? path.join(r.dir, 'speck', 'tickets', '0001-export-bookings.md') : path.join(r.dir, 'speck', 'tickets', 'done', '0001-export-bookings.md');
  assert.equal(headerOf(fs.readFileSync(file(), 'utf8')), '# 0001 · Export bookings\n\n**Status:** 👍 approved');
  // A ticket with no header at all gets one from the next speck set.
  const bare = fs.readFileSync(file(), 'utf8').replace(/\n---\n[\s\S]*?(?=## Problem)/, '\n---\n');
  fs.writeFileSync(file(), bare);
  assert.equal(r.run('set', '1', 'priority', '2').status, 0);
  assert.equal(headerOf(fs.readFileSync(file(), 'utf8')), '# 0001 · Export bookings\n\n**Status:** 👍 approved');
  r.g('commit', '-qam', 'header');
  // A hand edit to the header is overwritten on the next change.
  fs.writeFileSync(file(), fs.readFileSync(file(), 'utf8').replace('# 0001 · Export bookings', '# 0001 · Something else'));
  r.run('set', '1', 'title', 'Export bookings as CSV');
  assert.equal(headerOf(fs.readFileSync(file(), 'utf8')), '# 0001 · Export bookings as CSV\n\n**Status:** 👍 approved');
  assert.equal(fs.readFileSync(file(), 'utf8').split('**Status:**').length, 2, 'only one status line');
  r.g('commit', '-qam', 'title');
  assert.equal(r.run('ship', '1').status, 0);
  assert.equal(headerOf(fs.readFileSync(file(), 'utf8')), '# 0001 · Export bookings as CSV\n\n**Status:** ✅ done');
});

test('AC3: lint warns when the heading or status line is missing or out of date', () => {
  const synced = t => parseTicket(syncHeader(`---\n${t}\n---\n${good}`));
  const headerWarnings = t => lintTicket(t, cfg).warnings.filter(w => /heading|status line/i.test(w));
  assert.deepEqual(headerWarnings(synced(fm())), []);
  assert.equal(headerWarnings(ticket(fm(), good)).length, 2, 'both missing');
  const stale = synced(fm()).raw.replace('📝 draft', '📋 ready');
  assert.equal(headerWarnings(parseTicket(stale)).length, 1, 'status line out of date');
  const renamed = synced(fm()).raw.replace('· Export bookings as CSV', '· Old title');
  assert.equal(headerWarnings(parseTicket(renamed)).length, 1, 'heading out of date');
});

test('AC4: re-running init adds or corrects every header and changes nothing else', () => {
  const r = shipRepo({ approve: false });
  const live = path.join(r.dir, 'speck', 'tickets', '0001-export-bookings.md');
  const done = path.join(r.dir, 'speck', 'tickets', 'done', '0002-old.md');
  const doneText = `---\nid: "0002"\ntitle: "Old"\nstatus: done\n\n---\n# 0002 · Wrong\n\n**Status:** 🔍 reviewing\n\n## Problem\nX.\n`;
  fs.writeFileSync(done, doneText);
  const before = fs.readFileSync(live, 'utf8');
  assert.equal(r.run('init', '--skip-checks').status, 0);
  const after = fs.readFileSync(live, 'utf8');
  assert.equal(headerOf(after), '# 0001 · Export bookings\n\n**Status:** 📝 draft');
  assert.equal(after.slice(0, after.indexOf('\n---', 4)), before.slice(0, before.indexOf('\n---', 4)), 'frontmatter unchanged');
  assert.equal(after.slice(after.indexOf('**Status:**')).split('\n').slice(1).join('\n'), before.slice(before.indexOf('**Status:**')).split('\n').slice(1).join('\n'), 'body after the header unchanged');
  assert.equal(fs.readFileSync(done, 'utf8'), doneText.replace('# 0002 · Wrong\n\n**Status:** 🔍 reviewing', '# 0002 · Old\n\n**Status:** ✅ done'));
  // Running it again changes nothing.
  assert.equal(r.run('init', '--skip-checks').status, 0);
  assert.equal(fs.readFileSync(live, 'utf8'), after);
});

test('AC2/AC4 (F1): syncing the header keeps the rest of the body byte for byte', () => {
  const head = '---\nid: "0003"\ntitle: "T"\nstatus: ready\n\n---\n';
  const header = '# 0003 · T\n\n**Status:** 📋 ready';
  const bodies = ['\n\n\n    indented code\n\n## Problem\nX.\n', '\n## Problem\n  - nested\n', '    indented first line\n## Problem\n'];
  for (const body of bodies) {
    // With no header yet: the header goes on top, and the body is untouched apart from one separating empty line if it had none.
    const added = syncHeader(head + body);
    assert.equal(added, head + header + '\n' + (body.startsWith('\n') ? '' : '\n') + body, JSON.stringify(body));
    // With a stale header: only the header changes.
    const stale = head + '# 0003 · Old\n\n**Status:** 📝 draft\n' + body;
    assert.equal(syncHeader(stale), added, JSON.stringify(body));
    // And syncing again changes nothing.
    assert.equal(syncHeader(added), added);
  }
});

// ---------- 0011: review rounds live in the ticket file ----------

const roundsSection = text => text.slice(text.indexOf('\n## Review rounds\n'));

test('AC1: review rounds are added to a Review rounds section at the end of the ticket, and nothing else is tracked', () => {
  const r = reviewRepo();
  assert.equal(r.run('review', '1').status, 10);
  assert.equal(r.run('review', '1').status, 10, 'a round only changes the ticket, so the next round still runs');
  const text = fs.readFileSync(r.ticketFile, 'utf8');
  const section = roundsSection(text);
  assert.ok(text.includes('\n## Review rounds\n'), 'section added');
  assert.doesNotMatch(section.slice(1), /\n## /, 'it is the last section');
  const blocks = [...section.matchAll(/<details><summary>(.*?)<\/summary>\n\n```json\n([\s\S]*?)\n```\n\n<\/details>/g)];
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0][1], 'Round 1 · codex · changes_requested');
  assert.equal(blocks[1][1], 'Round 2 · codex · changes_requested');
  const rec = JSON.parse(blocks[1][2]);
  assert.equal(rec.meta.round, 2);
  assert.equal(rec.meta.thread_id, 'T1');
  assert.equal(rec.verdict.summary, 'fine');
  assert.deepEqual(r.roundFile(2), rec);
  assert.equal(fs.existsSync(path.join(r.dir, 'speck', 'reviews')), false, 'no speck/reviews/');
  assert.equal(r.git('status', '--porcelain').stdout.trim(), `M ${path.relative(r.dir, r.ticketFile)}`, 'only the ticket changed');
  // Recorded rounds from another reviewer go in the same place.
  const v = path.join(os.tmpdir(), `v-${path.basename(r.dir)}.json`);
  fs.writeFileSync(v, JSON.stringify(approveVerdict));
  assert.equal(r.run('reviewer-settings', '1').status, 0);
  assert.equal(r.run('record', '1', v, '--reviewer=claude-subagent').status, 0);
  assert.match(roundsSection(fs.readFileSync(r.ticketFile, 'utf8')), /<summary>Round 3 · claude-subagent · approve<\/summary>/);
  assert.equal(r.git('status', '--porcelain').stdout.trim(), `M ${path.relative(r.dir, r.ticketFile)}`, 'working files are not tracked');
});

test('AC1: the rest of the ticket is kept byte for byte when a round is added', () => {
  const r = reviewRepo();
  const before = fs.readFileSync(r.ticketFile, 'utf8');
  assert.equal(r.run('review', '1').status, 10);
  const after = fs.readFileSync(r.ticketFile, 'utf8');
  assert.ok(after.startsWith(before.replace(/\n*$/, '\n')), 'everything before the section is unchanged');
});

test('AC2: next, pack and ship read rounds from the ticket file', () => {
  const r = shipRepo({ approve: false });
  const v = path.join(os.tmpdir(), `v-${path.basename(r.dir)}.json`);
  assert.equal(r.run('next', '1').stdout.trim(), 'review');
  fs.writeFileSync(v, JSON.stringify({ ...approveVerdict, verdict: 'changes_requested', findings: [{ id: 'F1', severity: 'blocking', state: 'open', file: 'shared.txt', issue: 'bad', suggested_fix: '' }] }));
  assert.equal(r.run('record', '1', v).status, 10);
  assert.equal(r.run('next', '1').stdout.trim(), 'fix');
  fs.writeFileSync(v, JSON.stringify({ ...approveVerdict, findings: [{ id: 'F1', severity: 'blocking', state: 'resolved', file: 'shared.txt', issue: 'bad', suggested_fix: '' }] }));
  assert.equal(r.run('record', '1', v).status, 0);
  assert.equal(r.run('next', '1').stdout.trim(), 'ship');
  const pack = r.run('pack', '1').stdout;
  assert.match(pack, /Round 1 \(claude-subagent.*\*\*changes_requested\*\*, 1 open blocking/);
  assert.match(pack, /Round 2 \(claude-subagent.*\*\*approve\*\*, 0 open blocking, 1 resolved/);
  r.run('set', '1', 'status', 'approved');
  r.g('add', '-A'); r.g('commit', '-qm', 'approved');
  const res = r.run('ship', '1');
  assert.equal(res.status, 0, res.stderr);
  const done = fs.readFileSync(path.join(r.dir, 'speck', 'tickets', 'done', '0001-export-bookings.md'), 'utf8');
  assert.equal(ticketRounds(done).rounds.length, 2, 'the rounds travel with the ticket into done/');
  assert.equal(r.run('next', '1').stdout.trim(), 'ship');
});

test('AC3: the reviewer diff and size count leave out the Review rounds section, but show other ticket edits', () => {
  const r = reviewRepo();
  assert.equal(r.run('review', '1').status, 10);
  // The builder edits the ticket's notes and commits it, together with round 1.
  fs.writeFileSync(r.ticketFile, fs.readFileSync(r.ticketFile, 'utf8').replace('## Out of scope', '## Notes\nA builder note.\n\n## Out of scope'));
  r.git('add', '-A'); r.git('commit', '-qm', 'fixes');
  assert.equal(r.run('review', '1').status, 10);
  const round2 = r.prompts()[1];
  assert.match(round2, /\+A builder note\./, 'other ticket edits are shown');
  assert.doesNotMatch(round2, /Review rounds|<details>|"verdict"|"thread_id"/, 'the rounds section is left out');
  // speck diff prints the same diff for reviewers speck doesn't start itself.
  r.git('add', '-A'); r.git('commit', '-qm', 'round 2');
  const d = r.run('diff', '1');
  assert.equal(d.status, 0, d.stderr);
  assert.doesNotMatch(d.stdout, /Review rounds|"verdict"/);
  const p = r.run('prompt', '1');
  assert.match(p.stdout, /A builder note/);
  assert.doesNotMatch(p.stdout.split('Return ONLY')[0], /## Review rounds|"thread_id"/, 'the round-1 prompt leaves the section out too');
  // The size count leaves out all of speck/ by design (tickets, product.md), so neither the rounds nor the notes count.
  assert.match(r.run('diffstat').stdout, /^1 changed lines/m, 'only a.txt counts towards the size limit');
});

test('AC3 (F3): other tickets in the diff lose their Review rounds sections too, but keep their other edits', () => {
  const r = reviewRepo();
  const other = path.join(r.dir, 'speck', 'tickets', 'done', '0002-older.md');
  const otherText = `---\nid: "0002"\ntitle: "Older"\nstatus: done\n\n---\n## Problem\nX.\n`;
  fs.writeFileSync(other, otherText);
  fs.mkdirSync(path.join(r.dir, 'speck', 'reviews', '0002'), { recursive: true });
  fs.writeFileSync(path.join(r.dir, 'speck', 'reviews', '0002', 'round-1.json'), '{"meta":{"round":1,"thread_id":"OLD"}}\n');
  r.git('add', '-A'); r.git('commit', '-qm', 'older ticket');
  r.git('branch', '-f', 'main');
  const block = `<details><summary>Round 1 · codex · approve</summary>\n\n\`\`\`json\n{"meta":{"round":1,"thread_id":"OLD"}}\n\`\`\`\n\n</details>`;
  fs.writeFileSync(other, otherText.replace('X.', 'X, edited.') + `\n## Review rounds\n\n${block}\n`);
  fs.rmSync(path.join(r.dir, 'speck', 'reviews'), { recursive: true }); // as init does when it migrates them
  r.git('add', '-A'); r.git('commit', '-qm', 'migrated');
  const p = r.run('prompt', '1').stdout.split('Return ONLY')[0];
  assert.match(p, /\+X, edited\./, 'the ordinary edit is shown');
  assert.doesNotMatch(p, /## Review rounds|"thread_id"|OLD|speck\/reviews/, "the other ticket's rounds, and the old review files it replaced, are left out");
});

// A ticket with one round written the way speck writes it.
const appendable = (body, rec) => `---\n${fm()}\n---\n${body}\n## Review rounds\n\n<details><summary>Round 1 · codex · approve</summary>\n\n\`\`\`json\n${JSON.stringify(rec, null, 2)}\n\`\`\`\n\n</details>\n`;

test('AC4 (F1): a damaged round block is an error, not silently dropped', () => {
  const block = n => `<details><summary>Round ${n} · codex · approve</summary>\n\n\`\`\`json\n{"meta":{"round":${n}}}\n\`\`\`\n\n</details>`;
  const t = blocks => `---\n${fm()}\n---\n${good}\n## Review rounds\n\n${blocks.join('\n\n')}\n`;
  const noClose = block(2).replace('}\n```', '}\n');
  assert.equal(ticketRounds(t([block(1), noClose, block(3)])).errors.length, 1, 'missing closing fence');
  assert.equal(ticketRounds(t([block(1), block(2).replace('```json', '```')])).errors.length, 1, 'not a json fence');
  assert.equal(ticketRounds(t([block(1), block(2).replace('</details>', '')])).errors.length, 1, 'missing </details>');
  assert.equal(ticketRounds(t(['```json\n{}\n```'])).errors.length, 1, 'a code block outside any round');
  // Round 3 F1: a stray, invalid block before a valid round is reported, not dropped.
  assert.equal(ticketRounds(t(['```json\n{ not json\n```', block(1)])).errors.length, 1, 'stray invalid block before round 1');
  assert.equal(ticketRounds(t(['Some text', block(1)])).errors.length, 1, 'stray text before round 1');
  assert.deepEqual(ticketRounds(t(['<!-- a comment -->', block(1)])).errors, [], 'comments are fine');
  assert.equal(lintTicket(parseTicket(t([block(1), noClose])), cfg).errors.filter(e => /round/i.test(e)).length, 1, 'lint reports it');
  // A reviewer quoting "<details>" or a code fence in its own words doesn't break the round it's in.
  const quoted = { meta: { round: 1 }, verdict: { summary: 'A <details> block with ```json and </details> inside.' } };
  const qt = parseTicket(appendable(good, quoted));
  assert.deepEqual(ticketRounds(qt.raw), { rounds: [quoted], errors: [] });
  // Commands that read the history refuse rather than guess.
  const rr = reviewRepo();
  fs.writeFileSync(rr.ticketFile, fs.readFileSync(rr.ticketFile, 'utf8') + `\n## Review rounds\n\n${block(1)}\n\n${noClose}\n`);
  const next = rr.run('next', '1');
  assert.notEqual(next.status, 0);
  assert.match(next.stderr, /Review round 2 .*isn't a complete block/);
  const stray = reviewRepo();
  fs.writeFileSync(stray.ticketFile, fs.readFileSync(stray.ticketFile, 'utf8') + `\n## Review rounds\n\n\`\`\`json\n{ not json\n\`\`\`\n\n${block(1)}\n`);
  assert.notEqual(stray.run('next', '1').status, 0, 'next refuses');
  assert.notEqual(stray.run('lint', '1').status, 0, 'lint refuses');
});

test('AC4: lint reports an error for a round that is not valid JSON, or rounds out of order', () => {
  const block = n => `<details><summary>Round ${n} · codex · approve</summary>\n\n\`\`\`json\n${JSON.stringify({ meta: { round: n }, verdict: { verdict: 'approve' } }, null, 2)}\n\`\`\`\n\n</details>`;
  const withRounds = blocks => ticket(fm(), `${good}\n## Review rounds\n\n${blocks.join('\n\n')}\n`);
  const roundErrors = t => lintTicket(t, cfg).errors.filter(e => /round/i.test(e));
  assert.deepEqual(roundErrors(withRounds([block(1), block(2)])), []);
  assert.equal(ticketRounds(withRounds([block(1), block(2)]).raw).rounds.length, 2);
  assert.equal(roundErrors(withRounds([block(1), block(2).replace('"round": 2', '"round": 2,,')])).length, 1, 'bad JSON');
  assert.equal(roundErrors(withRounds([block(1), block(3)])).length, 1, 'a gap');
  assert.equal(roundErrors(withRounds([block(2), block(1)])).length, 1, 'out of order');
  assert.deepEqual(roundErrors(ticket(fm(), good)), [], 'no section is fine');
});

test('AC5: init moves old review files into their tickets, removes speck/reviews/, and a second run changes nothing', () => {
  const r = doneRepo();
  r.add('Live work');
  const finished = r.add('Finished work');
  assert.equal(r.run('set', '2', 'status', 'done').status, 0);
  const rec = (n, verdict) => ({ meta: { round: n, reviewer: 'codex', thread_id: 'T9' }, verdict: { ...approveVerdict, round: n, verdict } });
  const old = (id, files) => {
    const d = path.join(r.dir, 'speck', 'reviews', id);
    fs.mkdirSync(d, { recursive: true });
    for (const [f, c] of Object.entries(files)) fs.writeFileSync(path.join(d, f), typeof c === 'string' ? c : JSON.stringify(c, null, 2) + '\n');
  };
  old('0001', { 'round-1.json': rec(1, 'changes_requested'), 'round-2.json': rec(2, 'approve'), 'round-10.json': rec(3, 'approve'), 'codex-thread': 'T9\n' });
  old('0002', { 'round-1.json': rec(1, 'approve'), 'reviewer-settings.json': '{}' });
  fs.writeFileSync(path.join(r.dir, 'speck', 'reviews', '.gitkeep'), '');
  const res = r.run('init', '--skip-checks');
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /moved\s+review rounds for 2 tickets/);
  const live = ticketRounds(r.read('speck/tickets/0001-live-work.md')).rounds;
  assert.deepEqual(live.map(x => x.verdict.verdict), ['changes_requested', 'approve', 'approve'], 'in round order, not file-name order');
  assert.equal(ticketRounds(r.read(path.join('speck', 'tickets', 'done', path.basename(finished)))).rounds.length, 1, 'done tickets too');
  assert.equal(r.at('speck/reviews'), false, 'speck/reviews/ is gone');
  assert.equal(r.run('lint', '1').status, 0, 'the migrated ticket passes lint');
  const snapshot = () => [r.read('speck/tickets/0001-live-work.md'), r.read(path.join('speck', 'tickets', 'done', path.basename(finished)))];
  const after = snapshot();
  const again = r.run('init', '--skip-checks');
  assert.equal(again.status, 0);
  assert.doesNotMatch(again.stdout, /review rounds/);
  assert.deepEqual(snapshot(), after, 'running it again changes nothing');
  assert.equal(r.at('speck/reviews'), false, 'init no longer creates speck/reviews/');
});

test('AC5: rounds init cannot place are left where they are with a reason, and the rest are migrated', () => {
  const r = doneRepo();
  r.add('Live work');
  r.add('Already migrated');
  const rec = n => JSON.stringify({ meta: { round: n, reviewer: 'codex' }, verdict: { ...approveVerdict, round: n } });
  const put = (id, f, c) => { const d = path.join(r.dir, 'speck', 'reviews', id); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, f), c); };
  put('0001', 'round-1.json', rec(1));
  put('0099', 'round-1.json', rec(1));                  // no ticket 0099
  put('0003', 'round-1.json', rec(1));                  // ticket 0003 can't be read
  fs.writeFileSync(path.join(r.dir, 'speck', 'tickets', '0003-broken.md'), 'no frontmatter\n');
  put('0002', 'round-1.json', '{ not json');            // a round that isn't JSON
  const res = r.run('init', '--skip-checks');
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /skipped speck\/reviews\/0099\/: .*no ticket/i);
  assert.match(res.stdout, /skipped speck\/reviews\/0003\/: /);
  assert.match(res.stdout, /skipped speck\/reviews\/0002\/: .*round-1\.json/);
  assert.equal(ticketRounds(r.read('speck/tickets/0001-live-work.md')).rounds.length, 1, 'the good one is migrated');
  assert.equal(r.at('speck/reviews/0001'), false);
  for (const id of ['0099', '0003', '0002']) assert.equal(r.at(`speck/reviews/${id}/round-1.json`), true, `${id} left where it was`);
  assert.doesNotMatch(r.read('speck/tickets/0002-already-migrated.md'), /Review rounds/, 'a ticket is not half-migrated');
  // A ticket that already has rounds is not given a second set.
  const t1 = r.read('speck/tickets/0001-live-work.md');
  put('0001', 'round-1.json', rec(1));
  const again = r.run('init', '--skip-checks');
  assert.match(again.stdout, /skipped speck\/reviews\/0001\/: .*already has review rounds/);
  assert.equal(r.read('speck/tickets/0001-live-work.md'), t1);
});

// ---------- 0001: warn when the reviewer cannot run commands ----------

const cmdEvent = (output, extra = {}) => JSON.stringify({ type: 'item.completed', item: { id: 'item_1', type: 'command_execution', command: 'git diff', aggregated_output: output, exit_code: 1, status: 'failed', ...extra } });
const BWRAP = 'bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted';

test('AC1: speck review warns when a command failed because of the sandbox', () => {
  const r = reviewRepo({ extraEnv: { FAKE_CODEX_EVENT: cmdEvent(BWRAP) } });
  const res = r.run('review', '0001', '--tests=/dev/null');
  assert.match(res.stdout, /⚠️ Reviewer could not inspect the repo; reviewed the diff only/);
});

test('AC1: a non-zero exit with sandbox output warns whatever the status label says', () => {
  const r = reviewRepo({ extraEnv: { FAKE_CODEX_EVENT: cmdEvent(BWRAP, { status: 'completed', exit_code: 1 }) } });
  assert.match(r.run('review', '0001', '--tests=/dev/null').stdout, /could not inspect/);
  assert.equal(r.roundFile(1).meta.sandbox_ok, false);
});

test('AC1: no warning when commands ran, or failed for another reason', () => {
  for (const ev of [undefined, cmdEvent('npm: not found'), cmdEvent('ok', { exit_code: 0, status: 'completed' }), cmdEvent(BWRAP, { exit_code: 0, status: 'completed' })]) {
    const r = reviewRepo({ extraEnv: ev ? { FAKE_CODEX_EVENT: ev } : {} });
    assert.doesNotMatch(r.run('review', '0001', '--tests=/dev/null').stdout, /could not inspect/);
  }
});

test('AC2: the round stores sandbox_ok: false in meta only when the sandbox failed', () => {
  const bad = reviewRepo({ extraEnv: { FAKE_CODEX_EVENT: cmdEvent(BWRAP) } });
  bad.run('review', '0001', '--tests=/dev/null');
  assert.equal(bad.roundFile(1).meta.sandbox_ok, false);
  const good = reviewRepo();
  good.run('review', '0001', '--tests=/dev/null');
  assert.notEqual(good.roundFile(1).meta.sandbox_ok, false);
});

test('AC3: the review pack flags each round where the reviewer could not inspect the repo', () => {
  const bad = reviewRepo({ extraEnv: { FAKE_CODEX_EVENT: cmdEvent(BWRAP) } });
  bad.run('review', '0001', '--tests=/dev/null');
  assert.match(bad.run('pack', '0001').stdout, /⚠️ Reviewer could not inspect the repo; reviewed the diff only \(round 1\)/);
  const good = reviewRepo();
  good.run('review', '0001', '--tests=/dev/null');
  assert.doesNotMatch(good.run('pack', '0001').stdout, /could not inspect/);
});

// ---------- 0008: cancel a ticket with a recorded reason ----------

// A repo with speck installed, plus helpers for lint-clean tickets and file paths.
function cancelRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-cancel-'));
  const env = { ...process.env, ...gitEnv };
  const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env });
  const at = p => fs.existsSync(path.join(dir, p));
  const read = p => fs.readFileSync(path.join(dir, p), 'utf8');
  const fm = p => parseTicket(read(p)).fm;
  const filed = p => path.join('speck', 'tickets', 'done', path.basename(p));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir, encoding: 'utf8', env });
  assert.equal(run('init', '--skip-checks').status, 0);
  const add = title => {
    const p = run('new', ...title.split(' ')).stdout.trim();
    fs.writeFileSync(path.join(dir, p), read(p).split('## Problem')[0] + good);
    return p;
  };
  return { dir, run, add, at, read, fm, filed };
}

test('AC1: speck cancel records the reason and the date, files the ticket under done/ and rewrites the header', () => {
  const r = cancelRepo();
  const live = r.add('Export bookings');
  const res = r.run('cancel', '1', 'Superseded by the new export work');
  assert.equal(res.status, 0, res.stderr);
  assert.equal(r.at(live), false, 'no longer in speck/tickets/');
  assert.equal(r.at(r.filed(live)), true, 'filed away with finished work, under the same name');
  const f = r.fm(r.filed(live));
  assert.equal(f.status, 'cancelled');
  assert.equal(f.cancel_reason, 'Superseded by the new export work', 'the reason is stored');
  assert.match(String(f.cancelled), /^\d{4}-\d{2}-\d{2}$/, 'the date it was cancelled is stored');
  assert.match(r.read(r.filed(live)), /^\*\*Status:\*\* ❌ cancelled$/m, 'the header says so');
});

test('AC1: cancel works from every status except done', () => {
  for (const status of ['draft', 'ready', 'building', 'reviewing', 'blocked', 'approved']) {
    const r = cancelRepo();
    const live = r.add('Export bookings');
    if (status !== 'draft') assert.equal(r.run('set', '1', 'status', status).status, 0, status);
    const res = r.run('cancel', '1', 'Not needed after all');
    assert.equal(res.status, 0, `${status}: ${res.stderr}`);
    assert.equal(r.fm(r.filed(live)).status, 'cancelled', `from ${status}`);
  }
});

test('AC2: cancel refuses a missing or blank reason and changes nothing', () => {
  for (const [name, args] of [['a missing reason', ['cancel', '1']], ['a blank reason', ['cancel', '1', '   ']]]) {
    const r = cancelRepo();
    const live = r.add('Export bookings');
    const before = r.read(live);
    const res = r.run(...args);
    assert.notEqual(res.status, 0, `${name} is refused`);
    assert.match(res.stderr + res.stdout, /reason/i, name);
    assert.equal(r.read(live), before, `${name}: the ticket is untouched`);
    assert.equal(r.at(r.filed(live)), false, `${name}: nothing moved`);
  }
});

test('AC2: cancel refuses a done ticket and an already-cancelled one, and changes nothing', () => {
  const r = cancelRepo();
  const live = r.add('Export bookings');
  assert.equal(r.run('set', '1', 'status', 'done').status, 0);
  const before = r.read(r.filed(live));
  const res = r.run('cancel', '1', 'Changed my mind');
  assert.notEqual(res.status, 0, 'delivered work cannot be cancelled');
  assert.match(res.stderr, /done/i);
  assert.equal(r.read(r.filed(live)), before, 'nothing changed');

  const c = cancelRepo();
  const cancelled = c.add('Export bookings');
  assert.equal(c.run('cancel', '1', 'First reason').status, 0);
  const filed = c.read(c.filed(cancelled));
  const again = c.run('cancel', '1', 'A second reason');
  assert.notEqual(again.status, 0, 'an already-cancelled ticket is refused');
  assert.match(again.stderr + again.stdout, /already cancelled/i);
  assert.equal(c.read(c.filed(cancelled)), filed, 'nothing changed');
});

test('AC3: set status cancelled refuses and points at speck cancel', () => {
  const r = cancelRepo();
  const live = r.add('Export bookings');
  const res = r.run('set', '1', 'status', 'cancelled');
  assert.notEqual(res.status, 0, 'it refuses');
  assert.match(res.stderr, /speck cancel/, 'and points at the command that records a reason');
  assert.equal(r.fm(live).status, 'draft', 'nothing changed');
  assert.equal(r.at(live), true, 'nothing moved');
});

test('AC3: reviving a cancelled ticket moves it back to speck/tickets/ and keeps the reason', () => {
  const r = cancelRepo();
  const live = r.add('Export bookings');
  assert.equal(r.run('cancel', '1', 'Superseded by 0007').status, 0);
  assert.equal(r.run('set', '1', 'status', 'ready').status, 0);
  assert.equal(r.at(live), true, 'back in speck/tickets/');
  assert.equal(r.at(r.filed(live)), false, 'only one copy is left behind');
  assert.equal(r.fm(live).status, 'ready');
  assert.equal(r.fm(live).cancel_reason, 'Superseded by 0007', 'the recorded reason is kept');
});

test('AC4: status lists cancelled tickets in a CANCELLED group after DONE, with the reason below', () => {
  const r = cancelRepo();
  r.add('Export bookings');
  r.add('Old idea');
  assert.equal(r.run('set', '1', 'status', 'done').status, 0);
  assert.equal(r.run('cancel', '2', 'Superseded by 0007').status, 0);
  const out = r.run('status').stdout;
  assert.match(out, /DONE \(1\)/);
  assert.match(out, /CANCELLED \(1\)/);
  assert.ok(out.indexOf('DONE') < out.indexOf('CANCELLED'), 'CANCELLED comes after DONE');
  const lines = out.split('\n');
  const head = lines.findIndex(l => /CANCELLED \(1\)/.test(l));
  assert.match(lines[head + 1], /0002/, 'the ticket follows its group heading');
  assert.match(lines[head + 2], /Superseded by 0007/, 'its reason is on the line below it');
});

test('AC4: speck new never reuses a cancelled ticket number', () => {
  const r = cancelRepo();
  r.add('Export bookings');
  assert.equal(r.run('cancel', '1', 'Not now').status, 0);
  assert.equal(r.run('new', 'Second').stdout.trim(), path.join('speck', 'tickets', '0002-second.md'));
});

// Review round 3 (F1): a reason is stored and shown exactly as typed.
const AWKWARD = ['false', '0', '123', 'true', 'null', 'Use option: "B"', 'C:\\temp\\x', 'Too costly # revisit later', "it's 'quoted'", 'line one\nline two', '[a, b]', 'say " # later', 'back\\" # slash', 'ends with backslash\\'];

test('AC1/AC4: a reason reads back exactly as typed and appears in status, even when it looks like YAML', () => {
  for (const reason of AWKWARD) {
    const r = cancelRepo();
    const p = r.add('Export bookings');
    const res = r.run('cancel', '1', reason);
    assert.equal(res.status, 0, `${JSON.stringify(reason)}: ${res.stderr}`);
    assert.strictEqual(r.fm(r.filed(p)).cancel_reason, reason, `stored: ${JSON.stringify(reason)}`);
    assert.ok(r.run('status').stdout.includes(`❌ ${reason}`), `shown in status: ${JSON.stringify(reason)}`);
  }
});

test('AC3: reopening keeps an awkward reason exactly, and cancelling again replaces it', () => {
  const r = cancelRepo();
  const p = r.add('Export bookings');
  r.run('cancel', '1', 'false');
  assert.equal(r.run('set', '1', 'status', 'ready').status, 0);
  assert.strictEqual(r.fm(path.join('speck', 'tickets', path.basename(p))).cancel_reason, 'false');
  assert.equal(r.run('cancel', '1', 'Later # maybe').status, 0);
  const text = r.read(r.filed(p));
  assert.equal(text.match(/^cancel_reason:/gm).length, 1, 'one reason line');
  assert.strictEqual(r.fm(r.filed(p)).cancel_reason, 'Later # maybe');
});

test('AC1: cancelling leaves a "cancel_reason:" line in the ticket body byte for byte', () => {
  const r = cancelRepo();
  const p = r.add('Export bookings');
  const body = 'cancel_reason: an example field in the documentation\n';
  fs.writeFileSync(path.join(r.dir, p), `${r.read(p).trimEnd()}\n\n## Notes\n${body}`);
  assert.equal(r.run('cancel', '1', 'Not needed').status, 0);
  assert.ok(r.read(r.filed(p)).includes(`## Notes\n${body}`), 'the body line survives');
  assert.strictEqual(r.fm(r.filed(p)).cancel_reason, 'Not needed');
  assert.equal(r.run('set', '1', 'status', 'ready').status, 0);
  assert.equal(r.run('cancel', '1', 'Again').status, 0);
  assert.ok(r.read(r.filed(p)).includes(`## Notes\n${body}`), 'and survives a second cancel');
});

test('AC3: a reason on the last frontmatter line, with a "#" in it, is replaced rather than duplicated', () => {
  for (const old of ['Old#maybe', 'Old # maybe']) {
    const r = cancelRepo();
    const p = r.add('Export bookings');
    assert.equal(r.run('cancel', '1', old).status, 0);
    // Put the reason on the last frontmatter line, directly before the closing fence.
    const f = r.filed(p);
    const text = r.read(f).replace(/^cancel_reason:.*\n/m, '').replace(/\n+---\n/, `\ncancel_reason: ${JSON.stringify(old)}\n---\n`);
    fs.writeFileSync(path.join(r.dir, f), text);
    assert.equal(r.run('set', '1', 'status', 'ready').status, 0);
    assert.equal(r.run('cancel', '1', 'New').status, 0);
    const after = r.read(f);
    assert.equal(after.match(/^cancel_reason:/gm).length, 1, 'exactly one reason field');
    assert.strictEqual(r.fm(f).cancel_reason, 'New');
    assert.ok(!after.includes('maybe'), 'no stale reason text');
    assert.ok(after.includes('## Problem'), 'body kept');
  }
});

test('setField keeps a trailing comment and the space before it, including on empty fields', () => {
  const doc = '---\nid: "0001"\nstatus: draft            # draft | ready\nsource: ""               # e.g. speck/ideas/x.md\nreviewer_effort:      # blank: use config\nlast:\n---\nbody\n';
  let t = setField(doc, 'source', 'speck/ideas/example.md');
  assert.match(t, /^source: speck\/ideas\/example\.md {15}# e\.g\. speck\/ideas\/x\.md$/m);
  t = setField(t, 'reviewer_effort', 'high');
  assert.match(t, /^reviewer_effort: high {6}# blank: use config$/m);
  t = setField(t, 'status', 'ready');
  assert.match(t, /^status: ready {12}# draft \| ready$/m);
  t = setField(t, 'last', 'x');
  assert.match(t, /^last: x\n---\nbody\n$/m);
  const parsed = parseTicket(t).fm;
  assert.deepEqual([parsed.source, parsed.reviewer_effort, parsed.status, parsed.last], ['speck/ideas/example.md', 'high', 'ready', 'x']);
  assert.equal(setField(doc, 'last', 'x').match(/^last:/gm).length, 1);
});

// Ticket 0010: the overlap check is skill text only, so these tests read the skills.
const skillText = n => fs.readFileSync(path.join(ROOT, 'skills', n, 'SKILL.md'), 'utf8');
const overlapCheck = md => (md.split('## Check for overlap first')[1] || '').split('\n## ')[0];

test('0010 AC1: /speck-capture checks ideas, every ticket (in full) and product.md before writing a note', () => {
  const md = skillText('speck-capture');
  const check = overlapCheck(md);
  assert.ok(check, 'capture skill has a "Check for overlap first" section');
  assert.ok(md.indexOf('## Check for overlap first') < md.indexOf('speck/ideas/<YYYY-MM-DD>'), 'the check comes before the note is written');
  assert.match(check, /every note in `speck\/ideas\/`/);
  assert.match(check, /every ticket in `speck\/tickets\/` and `speck\/tickets\/done\/`/);
  assert.match(check, /problem, outcome and acceptance criteria, not only/i);
  assert.match(check, /`speck\/product\.md`/);
  assert.match(check, /same, or largely the same, outcome/i, 'overlap is a judgement, not a text match');
});

test('0010 AC2: /speck-ticket runs the same check before speck new', () => {
  const md = skillText('speck-ticket');
  const ref = md.search(/overlap check/i);
  assert.ok(ref >= 0, 'ticket skill refers to the overlap check');
  assert.match(md, /`speck-capture` skill/);
  assert.ok(ref < md.indexOf('speck new "<title>"'), 'the check comes before speck new');
  assert.doesNotMatch(md, /`speck status` to avoid duplicating/, 'the title-only check is replaced');
});

test('0010 AC3: on overlap the agent names each match and waits for an answer before writing', () => {
  const check = overlapCheck(skillText('speck-capture'));
  assert.match(check, /idea[^\n]*path[^\n]*`Status:`/i, 'ideas: path and status');
  assert.match(check, /ticket[^\n]*id[^\n]*status[^\n]*cancel_reason|ticket[^\n]*id[^\n]*status[^\n]*reason/i, 'tickets: id, status and cancel reason');
  assert.match(check, /product\.md`[^\n]*line/i, 'product.md: the covering line');
  assert.match(check, /add to the existing item, go ahead anyway or stop/);
  assert.match(check, /write nothing until the user answers/i);
});

test('0010 AC4: with no overlap the skill carries on and says so in one line', () => {
  const check = overlapCheck(skillText('speck-capture'));
  assert.match(check, /no overlap/i);
  assert.match(check, /one line/i);
  assert.match(check, /carry on|continue/i);
  assert.match(skillText('speck-capture'), /Reply with the file path, the overlap check's one-line result/, 'capture reports it in its reply');
  assert.match(skillText('speck-ticket'), /If nothing overlaps, say so in one line and carry on/);
  assert.match(skillText('speck-ticket'), /Present the tickets\*\* to the user: the overlap check's one-line result/, 'ticket reports it when presenting');
});

// ---------- 0003: the claude-subagent reviewer end to end ----------
// The live run with a real Claude subagent is described in ticket 0003's Notes. These tests replay that
// loop through the CLI, with each reply saved the way the subagent actually sent it: inside a ```json fence.

const fenced = v => '```json\n' + JSON.stringify(v, null, 2) + '\n```\n';
const subagentVerdict = (verdict, state) => ({
  round: 1, verdict, escalation_question: '', summary: `Round: ${verdict}`, product_md: { accurate: true, note: '' },
  criteria: [{ id: 1, status: verdict === 'approve' ? 'pass' : 'fail', evidence: 'a.txt' }],
  findings: [{ id: 'F1', severity: 'blocking', file: 'a.txt', issue: 'Deliberate bug.', suggested_fix: 'Fix it.', state }],
});
const subagentRepo = () => reviewRepo({ config: 'allow_same_model_review: true\n', ticketFields: 'reviewer: claude-subagent' });

test('0003 AC1: a claude-subagent round 1 records changes_requested from the reply as sent', () => {
  const r = subagentRepo();
  assert.equal(r.run('lint', '1').status, 0);
  assert.match(r.run('review', '1').stderr, /speck record 1/, 'speck review points a claude-subagent ticket at speck record');
  const tests = path.join(r.dir, 'tests.txt');
  fs.writeFileSync(tests, '# pass 1\n');
  const prompt = r.run('prompt', '1', `--tests=${tests}`).stdout;
  assert.match(prompt, /Export bookings/);
  assert.match(prompt, /# pass 1/);
  assert.match(prompt, /Return ONLY a JSON object/);
  assert.match(r.run('reviewer-settings', '1').stdout, /model: default\neffort: default/);
  const v = path.join(r.dir, 'v.json');
  fs.writeFileSync(v, fenced(subagentVerdict('changes_requested', 'open')));
  const rec = r.run('record', '1', v, '--reviewer=claude-subagent');
  assert.equal(rec.status, 10, rec.stderr);
  assert.match(rec.stdout, /NEXT: fix/);
  // The same reply with Windows line endings, or with no fence at all, records just the same.
  for (const reply of [fenced(subagentVerdict('changes_requested', 'open')).replace(/\n/g, '\r\n'), JSON.stringify(subagentVerdict('changes_requested', 'open'))]) {
    const other = subagentRepo(), w = path.join(other.dir, 'w.json');
    fs.writeFileSync(w, reply);
    assert.equal(other.run('record', '1', w, '--reviewer=claude-subagent').status, 10);
  }
  const r1 = r.roundFile(1);
  assert.equal(r1.meta.reviewer, 'claude-subagent');
  assert.equal(r1.verdict.verdict, 'changes_requested');
  assert.equal(r1.meta.reviewed_sha, r.git('rev-parse', 'HEAD').stdout.trim());
  assert.equal(r.run('next', '1').stdout.trim(), 'fix');
});

test('0003 AC2: round 2 sees only the fix, and an approval from the same reviewer ends the loop at ship', () => {
  const r = subagentRepo();
  r.run('reviewer-settings', '1');
  const v = path.join(r.dir, 'v.json');
  fs.writeFileSync(v, fenced(subagentVerdict('changes_requested', 'open')));
  assert.equal(r.run('record', '1', v, '--reviewer=claude-subagent').status, 10);
  fs.writeFileSync(path.join(r.dir, 'a.txt'), 'fixed\n');
  r.git('add', '-A'); r.git('commit', '-qm', 'review round 1 fixes');
  const diff = r.run('diff', '1').stdout;
  assert.match(diff, /^\+fixed$/m, 'speck diff shows the fix');
  assert.doesNotMatch(diff, /Review rounds/, 'and leaves out the recorded round');
  fs.writeFileSync(v, fenced(subagentVerdict('approve', 'resolved')));
  const rec = r.run('record', '1', v, '--reviewer=claude-subagent');
  assert.equal(rec.status, 0, rec.stderr);
  assert.equal(r.run('next', '1').stdout.trim(), 'ship');
  assert.equal(r.roundFile(2).meta.reviewed_sha, r.git('rev-parse', 'HEAD').stdout.trim());
  assert.match(r.run('pack', '1').stdout, /Round 2 \(claude-subagent, model default, effort default\): \*\*approve\*\*/);
});

test('0003 AC1: a reply that is not a verdict gets a plain error, and no round is recorded', () => {
  const r = subagentRepo();
  const v = path.join(r.dir, 'v.json');
  for (const reply of ['Looks good to me!', '```json\n{"verdict": \n```\n', '', 'null', '[1]']) {
    fs.writeFileSync(v, reply);
    const rec = r.run('record', '1', v, '--reviewer=claude-subagent');
    assert.equal(rec.status, 1, JSON.stringify(reply));
    assert.match(rec.stderr, /isn't a JSON verdict/, JSON.stringify(reply));
    assert.doesNotMatch(rec.stderr, /at JSON\.parse|SyntaxError/, 'no stack trace');
    assert.equal(r.roundFile(1), undefined);
  }
  // A JSON object with a broken entry in criteria or findings is refused plainly too (round 1 F1).
  for (const broken of [{ criteria: [null] }, { findings: [null] }, { criteria: ['pass'] }, { findings: [[]] }]) {
    fs.writeFileSync(v, JSON.stringify({ ...subagentVerdict('changes_requested', 'open'), ...broken }));
    const rec = r.run('record', '1', v, '--reviewer=claude-subagent');
    assert.equal(rec.status, 1, JSON.stringify(broken));
    assert.match(rec.stderr, /Reviewer output is missing or invalid/, JSON.stringify(broken));
    assert.doesNotMatch(rec.stderr, /TypeError|    at /, 'no stack trace');
    assert.equal(r.roundFile(1), undefined);
  }
});

test('0003 AC3: the review skill says how to save a fenced subagent reply and how to resume it for round 2', () => {
  const md = fs.readFileSync(path.join(ROOT, 'skills', 'speck-review', 'SKILL.md'), 'utf8');
  const sub = md.split('**`claude-subagent`**')[1].split('## Your turn')[0];
  assert.match(sub, /```json[` ]*fence, and `speck record` accepts that/, 'round 1: a fenced reply can be saved as it is');
  assert.match(sub, /SendMessage/, 'round 1: says the agent id is for SendMessage in round 2');
  const r2 = md.split('**claude-subagent:**')[1].split('## Ending the loop')[0];
  assert.match(r2, /agent id/);
  assert.match(r2, /speck record <id> \/tmp\/speck-<id>-verdict\.json --reviewer=claude-subagent/);
});

// ---------- 0009: record which tickets an idea became ----------

function ideaRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8' });
  gitIn(dir, 'init', '-q', '-b', 'main');
  assert.equal(run('init', '--skip-checks').status, 0);
  const ideas = path.join(dir, 'speck', 'ideas');
  fs.mkdirSync(ideas, { recursive: true });
  const write = (name, text) => { fs.writeFileSync(path.join(ideas, name), text); return `speck/ideas/${name}`; };
  const read = name => fs.readFileSync(path.join(ideas, name), 'utf8');
  const tickets = () => fs.readdirSync(path.join(dir, 'speck', 'tickets')).filter(f => f.endsWith('.md'));
  return { dir, run, write, read, tickets };
}
const ideaNote = status => `# CSV export\n\nCaptured: 2026-10-08 · Status: ${status}\n\n## What\nExport bookings. Status: not a status line.\n`;

test('0009 AC1: speck new --source marks the idea ticketed with the new id and changes nothing else', () => {
  const r = ideaRepo();
  const src = r.write('csv.md', ideaNote('idea'));
  const out = r.run('new', 'Export bookings as CSV', `--source=${src}`);
  assert.equal(out.status, 0, out.stderr);
  assert.equal(out.stdout.trim(), path.join('speck', 'tickets', '0001-export-bookings-as-csv.md'), 'stdout is still just the ticket path');
  assert.equal(r.read('csv.md'), ideaNote('ticketed (0001)'));
  // Any earlier value is replaced, and Windows line endings are kept.
  const crlf = r.write('crlf.md', ideaNote('idea (after v0.1)').replace(/\n/g, '\r\n'));
  assert.equal(r.run('new', 'Another', `--source=${crlf}`).status, 0);
  assert.equal(r.read('crlf.md'), ideaNote('ticketed (0002)').replace(/\n/g, '\r\n'));
});

test('0009 AC2: a second ticket from the same idea is added to the list, never twice', () => {
  const r = ideaRepo();
  const src = r.write('csv.md', ideaNote('idea'));
  r.run('new', 'First', `--source=${src}`);
  r.run('new', 'Second', `--source=${src}`);
  assert.equal(r.read('csv.md'), ideaNote('ticketed (0001, 0002)'));
  // An id that's already listed isn't added again.
  r.write('again.md', ideaNote('ticketed (0002, 0003)'));
  assert.equal(r.run('new', 'Third', '--source=speck/ideas/again.md').status, 0);
  assert.equal(r.read('again.md'), ideaNote('ticketed (0002, 0003)'));
});

test('0009 AC3: a missing source is refused with no ticket, and a note with no Status line only warns', () => {
  const r = ideaRepo();
  const out = r.run('new', 'Ghost', '--source=speck/ideas/nope.md');
  assert.notEqual(out.status, 0);
  assert.match(out.stderr, /speck\/ideas\/nope\.md/);
  assert.doesNotMatch(out.stderr, /    at /, 'no stack trace');
  assert.deepEqual(r.tickets(), [], 'no ticket created');
  const plain = '# Loose note\n\nNo status here.\n';
  const src = r.write('plain.md', plain);
  const warned = r.run('new', 'Loose', `--source=${src}`);
  assert.equal(warned.status, 0, warned.stderr);
  assert.match(warned.stderr, /Status:/);
  assert.match(warned.stderr, /plain\.md/);
  assert.deepEqual(r.tickets(), ['0001-loose.md'], 'ticket still created, with the next number');
  assert.equal(r.read('plain.md'), plain, 'note unchanged');
  // With no --source, nothing about ideas is printed.
  assert.equal(r.run('new', 'No source').stderr, '');
});

test('0009 AC4: speck status shows ideas as waiting or ticketed', () => {
  const r = ideaRepo();
  r.write('a.md', ideaNote('idea'));
  r.write('b.md', ideaNote('idea (separate project)'));
  r.write('c.md', '# No status line\n');
  r.write('d.md', ideaNote('ticketed (0006)'));
  r.run('new', 'Something');
  assert.match(r.run('status').stdout, /^IDEAS \(4: 3 waiting, 1 ticketed\) in speck\/ideas\/$/m);
});

test('0009 AC1/AC2: ticketedStatus replaces other values, extends the list and keeps any note after it', () => {
  assert.equal(ticketedStatus('idea', '0011'), 'ticketed (0011)');
  assert.equal(ticketedStatus('', '0011'), 'ticketed (0011)');
  assert.equal(ticketedStatus('ticketedfoo', '0011'), 'ticketed (0011)', 'a different word is replaced, not extended');
  assert.equal(ticketedStatus('ticketed', '0011'), 'ticketed (0011)');
  assert.equal(ticketedStatus('ticketed (0011)', '0012'), 'ticketed (0011, 0012)');
  assert.equal(ticketedStatus('ticketed (0011, 0012)', '0011'), 'ticketed (0011, 0012)');
  assert.equal(ticketedStatus('ticketed (0006) and split later', '0013'), 'ticketed (0006, 0013) and split later');
});

// ---------- auto-ship: ship as soon as the reviewer approves, when config allows it ----------

function autoShipRepo({ config = '', risk = 'low', sandboxFailed = false } = {}) {
  const r = shipRepo({ approve: false });
  const cfgFile = path.join(r.dir, 'speck', 'config.yml');
  let c = fs.readFileSync(cfgFile, 'utf8');
  for (const line of config.split('\n').filter(Boolean)) {
    const key = line.split(':')[0];
    c = new RegExp(`^${key}:`, 'm').test(c) ? c.replace(new RegExp(`^${key}:.*$`, 'm'), line) : c + line + '\n';
  }
  fs.writeFileSync(cfgFile, c);
  const file = path.join(r.dir, 'speck', 'tickets', '0001-export-bookings.md');
  fs.writeFileSync(file, setField(fs.readFileSync(file, 'utf8'), 'risk', risk));
  const v = path.join(os.tmpdir(), `verdict-${path.basename(r.dir)}.json`);
  fs.writeFileSync(v, JSON.stringify(approveVerdict));
  r.run('record', '1', v);
  if (sandboxFailed) {
    const t = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, t.replace('"reviewer": "claude-subagent"', '"reviewer": "codex",\n    "sandbox_ok": false'));
    assert.match(fs.readFileSync(file, 'utf8'), /"sandbox_ok": false/);
  }
  r.run('set', '1', 'status', 'approved');
  r.g('add', '-A'); r.g('commit', '-qm', 'approved');
  return r;
}

test('auto-ship: config templates default to off and low risk only', () => {
  const tpl = fs.readFileSync(path.join(ROOT, 'templates', 'config.yml'), 'utf8');
  const y = parseYaml(tpl);
  assert.equal(y.auto_ship, false);
  assert.deepEqual(y.auto_ship_risk, ['low']);
});

test('auto-ship: speck ship --auto refuses, changing nothing, while auto_ship is off', () => {
  const r = autoShipRepo();
  const before = r.state();
  const res = r.run('ship', '1', '--auto');
  assert.equal(res.status, 12, res.stderr);
  assert.match(res.stderr, /auto_ship is off/);
  assert.match(res.stderr, /\/speck-ship 0001/);
  assert.deepEqual(r.state(), before);
  assert.equal(r.status(), 'approved');
});

test('auto-ship: speck ship --auto ships an approved ticket whose risk is allowed', () => {
  const r = autoShipRepo({ config: 'auto_ship: true' });
  const res = r.run('ship', '1', '--auto');
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /Shipped 0001/);
  assert.equal(r.status(), 'done');
  assert.equal(r.state().feature, '');
});

test('auto-ship: the risk filter decides which tickets ship on their own', () => {
  const high = autoShipRepo({ config: 'auto_ship: true', risk: 'high' });
  const before = high.state();
  const res = high.run('ship', '1', '--auto');
  assert.equal(res.status, 12, res.stderr);
  assert.match(res.stderr, /risk "high"/);
  assert.match(res.stderr, /auto_ship_risk/);
  assert.deepEqual(high.state(), before);

  const all = autoShipRepo({ config: 'auto_ship: true\nauto_ship_risk: [low, high]', risk: 'high' });
  assert.equal(all.run('ship', '1', '--auto').status, 0);
  assert.equal(all.status(), 'done');
});

test('auto-ship: never when the reviewer could not inspect the repo', () => {
  const r = autoShipRepo({ config: 'auto_ship: true\nauto_ship_risk: [low, high]', sandboxFailed: true });
  const before = r.state();
  const res = r.run('ship', '1', '--auto');
  assert.equal(res.status, 12, res.stderr);
  assert.match(res.stderr, /couldn't inspect the repo/);
  assert.deepEqual(r.state(), before);
  // The user can still ship it themselves.
  assert.equal(r.run('ship', '1').status, 0);
});

test('auto-ship: plain speck ship ignores the auto-ship settings', () => {
  const r = autoShipRepo({ risk: 'high' });
  assert.equal(r.run('ship', '1').status, 0);
});

test('auto-ship: the build skill runs speck ship --auto after approval, and the rules allow only that', () => {
  const build = fs.readFileSync(path.join(ROOT, 'skills', 'speck-build', 'SKILL.md'), 'utf8');
  const approved = build.split('## 5. Approved')[1].split('\n## ')[0];
  assert.match(approved, /speck ship <id> --auto/);
  assert.ok(approved.indexOf('status approved') < approved.indexOf('--auto'), 'auto-ship comes after the approval is committed');
  assert.match(approved, /exit code 12|exits with 12|exits 12/);
  for (const n of ['speck-build', 'speck-review'])
    assert.match(fs.readFileSync(path.join(ROOT, 'skills', n, 'SKILL.md'), 'utf8'), /auto_ship/, n);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  spawnSync(process.execPath, [CLI, 'init', '--skip-checks'], { cwd: dir });
  assert.match(fs.readFileSync(path.join(dir, 'AGENTS.md'), 'utf8'), /auto_ship/);
});

// ---------- 0012: run a reviewer from a command set in config ----------

const changesVerdict = { verdict: 'changes_requested', criteria: [{ id: 1, status: 'fail', evidence: 'a.txt' }], findings: [{ id: 'F1', severity: 'blocking', file: 'a.txt', issue: 'First problem.', suggested_fix: 'Fix it.', state: 'open' }], product_md: { accurate: true, note: '' }, summary: 'Round one summary.', escalation_question: '' };

// A repo whose ticket uses reviewer "fake", run by a command in config. The fake logs its arguments,
// working folder and stdin, then answers in the format FAKE_MODE asks for.
function commandRepo({ command = '{bin} --model {model} --effort {effort} --flag "two words"', ticketFields = '', limits = '' } = {}) {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-fake-'));
  const fake = path.join(bin, 'fake-reviewer');
  const log = path.join(bin, 'calls.log');
  fs.writeFileSync(fake, `#!${process.execPath}
const fs = require('fs');
const stdin = fs.readFileSync(0, 'utf8');
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({ args: process.argv.slice(2), cwd: process.cwd(), stdin }) + '\\n');
const v = process.env.FAKE_VERDICT || ${JSON.stringify(JSON.stringify(changesVerdict))};
const mode = process.env.FAKE_MODE || 'raw';
if (mode === 'raw') console.log(v);
if (mode === 'fenced') console.log('Here is my review.\\n\\n\`\`\`json\\n' + v + '\\n\`\`\`\\nThanks.');
if (mode === 'envelope') console.log(JSON.stringify({ type: 'result', is_error: false, session_id: 'S1', result: 'Done.\\n\`\`\`json\\n' + v + '\\n\`\`\`', usage: { input_tokens: 100, output_tokens: 20 } }));
if (mode === 'garbage') { console.log('I looked at it and it seems fine.'); console.error('note one\\nnote two'); }
if (mode === 'fail') { for (let i = 1; i <= 7; i++) console.error('err line ' + i); process.exit(3); }
`, { mode: 0o755 });
  const r = reviewRepo({ ticketFields: `reviewer: fake\n${ticketFields}` });
  const cfgFile = path.join(r.dir, 'speck', 'config.yml');
  let c = fs.readFileSync(cfgFile, 'utf8').replace('reviewer_options:\n', `reviewer_options:\n  fake:\n    command: ${JSON.stringify(command.replace('{bin}', fake))}\n`);
  if (limits) c = c.replace('limits:\n', `limits:\n${limits}`);
  fs.writeFileSync(cfgFile, c);
  r.git('add', '-A'); r.git('commit', '-qm', 'reviewer command');
  const calls = () => fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').map(l => JSON.parse(l)) : [];
  const runEnv = (env, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: r.dir, encoding: 'utf8', env: { ...process.env, ...env } });
  return { ...r, fake, calls, runEnv };
}

test('0012 AC1: speck review runs the configured command from the repo root, sends the speck prompt text on stdin and records the round', () => {
  const r = commandRepo();
  const tests = path.join(r.dir, '..', `tests-${path.basename(r.dir)}.txt`);
  fs.writeFileSync(tests, '# pass 9\n');
  const sub = path.join(r.dir, 'sub');
  fs.mkdirSync(sub);
  const res = spawnSync(process.execPath, [CLI, 'review', '1', `--tests=${tests}`], { cwd: sub, encoding: 'utf8' });
  assert.equal(res.status, 10, res.stderr);
  assert.match(res.stdout, /NEXT: fix/);
  const [call] = r.calls();
  assert.equal(fs.realpathSync(call.cwd), fs.realpathSync(r.dir), 'runs from the repo root');
  assert.equal(call.stdin.trimEnd(), r.run('prompt', '1', `--tests=${tests}`).stdout.trimEnd(), 'the same text speck prompt prints');
  assert.match(call.stdin, /Return ONLY a JSON object matching this schema/);
  const r1 = r.roundFile(1);
  assert.equal(r1.meta.reviewer, 'fake');
  assert.equal(r1.meta.reviewed_sha, r.git('rev-parse', 'HEAD').stdout.trim());
  assert.equal(r1.verdict.verdict, 'changes_requested');
  assert.equal(r.calls().length, 1);
  assert.equal(fs.existsSync(path.join(r.dir, 'speck', 'reviews')), false);
});

test('0012 AC2: {model} and {effort} are filled in, and a blank one goes with the flag before it', () => {
  const set = commandRepo({ ticketFields: 'reviewer_model: m-1\nreviewer_effort: high' });
  assert.equal(set.run('review', '1').status, 10);
  assert.deepEqual(set.calls()[0].args, ['--model', 'm-1', '--effort', 'high', '--flag', 'two words']);
  assert.equal(set.roundFile(1).meta.reviewer_model, 'm-1');

  const blank = commandRepo();
  assert.equal(blank.run('review', '1').status, 10);
  assert.deepEqual(blank.calls()[0].args, ['--flag', 'two words']);

  const one = commandRepo({ ticketFields: 'reviewer_model: m-2' });
  assert.equal(one.run('review', '1').status, 10);
  assert.deepEqual(one.calls()[0].args, ['--model', 'm-2', '--flag', 'two words']);

  const joined = commandRepo({ command: '{bin} --model={model} -x' });
  assert.equal(joined.run('review', '1').status, 10);
  assert.deepEqual(joined.calls()[0].args, ['-x'], 'a blank --model={model} disappears');

  // Values are passed as arguments, never through a shell.
  const odd = commandRepo({ ticketFields: 'reviewer_model: "a b;echo hi"' });
  assert.equal(odd.run('review', '1').status, 10);
  assert.deepEqual(odd.calls()[0].args.slice(0, 2), ['--model', 'a b;echo hi']);
});

test('0012 AC3: the verdict is read from raw JSON, a fenced block or a result envelope', () => {
  for (const mode of ['raw', 'fenced', 'envelope']) {
    const r = commandRepo();
    const res = r.runEnv({ FAKE_MODE: mode }, 'review', '1');
    assert.equal(res.status, 10, `${mode}: ${res.stderr}`);
    assert.equal(r.roundFile(1).verdict.findings[0].id, 'F1', mode);
  }
  const env = commandRepo();
  env.runEnv({ FAKE_MODE: 'envelope' }, 'review', '1');
  assert.deepEqual(env.roundFile(1).meta.usage, { input_tokens: 100, output_tokens: 20 }, 'token use from the envelope is kept');
});

test('0012 AC3: anything else, or a non-zero exit, is a plain error quoting the last five lines of stderr, and records nothing', () => {
  const junk = commandRepo();
  let res = junk.runEnv({ FAKE_MODE: 'garbage' }, 'review', '1');
  assert.equal(res.status, 1);
  assert.match(res.stderr, /didn't return a verdict/);
  assert.match(res.stderr, /note one\nnote two/);
  assert.equal(junk.roundFile(1), undefined);

  const fail = commandRepo();
  res = fail.runEnv({ FAKE_MODE: 'fail' }, 'review', '1');
  assert.equal(res.status, 1);
  assert.match(res.stderr, /exited 3/);
  assert.match(res.stderr, /err line 3\nerr line 4\nerr line 5\nerr line 6\nerr line 7/);
  assert.doesNotMatch(res.stderr, /err line 2/);
  assert.equal(fail.roundFile(1), undefined);

  const shape = commandRepo();
  res = shape.runEnv({ FAKE_VERDICT: JSON.stringify({ verdict: 'approve' }) }, 'review', '1');
  assert.equal(res.status, 1);
  assert.match(res.stderr, /Reviewer output is missing or invalid/);
  assert.equal(shape.roundFile(1), undefined);

  const missing = commandRepo({ command: 'speck-no-such-reviewer-cmd -p' });
  res = missing.run('review', '1');
  assert.equal(res.status, 1);
  assert.match(res.stderr, /speck-no-such-reviewer-cmd/);
  assert.doesNotMatch(res.stderr, /    at /);
  assert.equal(missing.roundFile(1), undefined);
});

test('0012 AC4: later rounds resend the round-1 prompt, then every earlier verdict and builder response in order, then the new diff', () => {
  const r = commandRepo();
  const resp = n => { const f = path.join(r.dir, '..', `resp-${n}-${path.basename(r.dir)}.md`); fs.writeFileSync(f, `- F1: fixed in round ${n} response.\n`); return f; };
  assert.equal(r.run('review', '1').status, 10);
  fs.writeFileSync(path.join(r.dir, 'a.txt'), 'second\n');
  r.git('add', '-A'); r.git('commit', '-qm', 'fix 1');
  const v2 = { ...changesVerdict, summary: 'Round two summary.' };
  assert.equal(r.runEnv({ FAKE_VERDICT: JSON.stringify(v2) }, 'review', '1', `--response=${resp(2)}`).status, 10);
  const sha2 = r.git('rev-parse', 'HEAD').stdout.trim();
  fs.writeFileSync(path.join(r.dir, 'a.txt'), 'third-line-marker\n');
  r.git('add', '-A'); r.git('commit', '-qm', 'fix 2');
  assert.equal(r.run('review', '1', `--response=${resp(3)}`).status, 11, 'third round hits the default limit and blocks');
  const third = r.calls()[2].stdin;
  const round1Now = r.run('prompt', '1').stdout.trimEnd();
  assert.ok(third.startsWith(round1Now), 'starts with the full round-1 prompt');
  const order = ['Round one summary.', 'fixed in round 2 response', 'Round two summary.', 'fixed in round 3 response', `${sha2.slice(0, 8)}..HEAD`, '+third-line-marker'];
  const at = order.map(s => third.indexOf(s, round1Now.length));
  assert.ok(at.every(i => i > 0), JSON.stringify(at));
  assert.deepEqual([...at].sort((a, b) => a - b), at, 'in order');
  assert.ok(third.indexOf('"F1"', round1Now.length) > 0, 'earlier verdicts are sent in full, with finding ids');
  assert.equal(r.roundFile(2).meta.builder_response, '- F1: fixed in round 2 response.\n');
});

test('0012 AC5: codex without a command and reviewers with no command behave as before', () => {
  const codex = reviewRepo();
  assert.equal(codex.run('review', '1').status, 10);
  assert.equal(codex.calls().length, 1, 'the codex adapter ran');
  assert.equal(codex.roundFile(1).meta.reviewer, 'codex');
  assert.equal(codex.roundFile(1).meta.builder_response, undefined);
  const other = reviewRepo({ ticketFields: 'reviewer: someone' });
  const res = other.run('review', '1');
  assert.equal(res.status, 1);
  assert.match(res.stderr, /speck record 1/);
  assert.equal(other.calls().length, 0);
});
