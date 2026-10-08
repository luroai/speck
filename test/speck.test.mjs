import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseYaml, parseTicket, setField, lintTicket, nextAction, validateVerdict, reviewerSettings } from '../scripts/speck.mjs';

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

test('titles joining outcomes get a warning', () => {
  assert.equal(lintTicket(ticket(fm({ title: 'Add search and add filters' }), good), cfg).warnings.length, 1);
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
function reviewRepo({ config = '', ticketFields = '' } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-bin-'));
  const log = path.join(bin, 'calls.log');
  fs.writeFileSync(path.join(bin, 'codex'), `#!${process.execPath}
const fs = require('fs');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify(args) + '\\n');
const out = args[args.indexOf('-o') + 1];
fs.writeFileSync(out, JSON.stringify({ verdict: 'changes_requested', criteria: [{ id: 1, status: 'pass', evidence: 'ok' }], findings: [], product_md: { accurate: true, note: '' }, summary: 'fine', escalation_question: '' }));
console.log(JSON.stringify({ type: 'thread.started', thread_id: 'T1' }));
`, { mode: 0o755 });
  const env = { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}` };
  const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env });
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
  const roundFile = n => JSON.parse(fs.readFileSync(path.join(dir, 'speck', 'reviews', '0001', `round-${n}.json`), 'utf8'));
  return { dir, run, calls, roundFile, ticketFile: file };
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
  assert.match(approvedStep, /commit the ticket and `speck\/reviews\/<id>\/` \(`speck\(<id>\): approved`\)/);
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
