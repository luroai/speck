import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseYaml, parseTicket, setField, lintTicket, nextAction, validateVerdict } from '../scripts/speck.mjs';

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
