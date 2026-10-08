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

test('AC3: the review skill starts a claude-subagent reviewer with the model and effort', () => {
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
