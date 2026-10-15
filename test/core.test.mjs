import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseYaml, parseTicket, setField, lintTicket, nextAction, validateVerdict } from '../scripts/speck.mjs';
import { ROOT, CLI, cfg, ticket, good, fm, round, gitIn, gitEnv } from './support/speck.mjs';

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
  const v = validateVerdict({ verdict: 'approve', criteria: [{ id: 1, status: 'fail', evidence: '' }], findings: [], summary: 's', escalation_question: '' });
  assert.equal(v.verdict, 'changes_requested');
});

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
  // Setting ready commits the ticket (0108), so git needs an identity.
  const run = (...a) => spawnSync('node', [CLI, ...a], { cwd: dir, encoding: 'utf8', env: { ...process.env, ...gitEnv } });
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
  assert.equal(names.length, 7); // 0116: speck-integrate is gone
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

function doctorRepo({ config = {}, tools = [] } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-bin-'));
  fs.symlinkSync(process.execPath, path.join(bin, 'node'));
  const gitPath = spawnSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).stdout.trim();
  fs.symlinkSync(gitPath, path.join(bin, 'git'));
  for (const t of tools) fs.writeFileSync(path.join(bin, t), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  gitIn(dir, 'init', '-q', '-b', 'main');
  assert.equal(spawnSync(process.execPath, [CLI, 'init', '--skip-checks'], { cwd: dir }).status, 0);
  const cfgFile = path.join(dir, 'speck', 'config.yml');
  let c = fs.readFileSync(cfgFile, 'utf8');
  for (const [k, v] of Object.entries(config)) {
    const entry = `  ${config.reviewer}:\n`;
    if (k === 'command') c = c.includes(`\n${entry}`)
      ? c.replace(`\n${entry}`, `\n${entry}    command: ${JSON.stringify(v)}\n`)
      : c.replace('reviewer_options:\n', `reviewer_options:\n${entry}    command: ${JSON.stringify(v)}\n`);
    else c = c.replace(new RegExp(`^${k}:.*$`, 'm'), `${k}: ${v}`);
  }
  fs.writeFileSync(cfgFile, c);
  const res = spawnSync(process.execPath, [CLI, 'doctor'], { cwd: dir, encoding: 'utf8', env: { ...process.env, PATH: bin } });
  return { ...res, out: res.stdout };
}

const BUILDERS = { claude: ['Claude Code', 'claude'], cursor: ['Cursor CLI', 'cursor-agent'], codex: ['Codex CLI', 'codex'], gemini: ['Gemini CLI', 'gemini'] };

test('0014 AC1: doctor checks only the configured builder, by name, with an install link', () => {
  for (const [builder, [label, cmd]] of Object.entries(BUILDERS)) {
    // Claude Code's default build_command with another builder is a ✗ of its own since 0211, so those get a blank one.
    const config = { builder, reviewer: 'claude-subagent', ...(builder === 'claude' ? {} : { build_command: '""' }) };
    const missing = doctorRepo({ config });
    assert.match(missing.out, new RegExp(`✗ ${label} \\(builds tickets\\)\\n\\s+Fix: .*https://`), builder);
    for (const [other, [otherLabel]] of Object.entries(BUILDERS))
      if (other !== builder) assert.doesNotMatch(missing.out, new RegExp(`${otherLabel} \\(builds tickets\\)`), `${builder} checks no other builder`);
    const present = doctorRepo({ config, tools: [cmd] });
    assert.match(present.out, new RegExp(`✓ ${label} \\(builds tickets\\)`), builder);
    assert.equal(present.status, 0, `${builder}: ${present.out}`);
  }
});

test('0014 AC2: an unknown builder gets one information line and is not a failure', () => {
  // Names that are also built-in object properties are unknown builders too (round 1 F1).
  for (const builder of ['aider', 'constructor', 'toString', '__proto__', 'hasOwnProperty']) {
    const r = doctorRepo({ config: { builder, reviewer: 'claude-subagent' } });
    const lines = r.out.split('\n').filter(l => l.includes(`"${builder}"`));
    assert.equal(lines.length, 1, `${builder}: ${r.out}${r.stderr}`);
    assert.match(lines[0], /can't check/i, builder);
    assert.doesNotMatch(r.out, /builds tickets/, builder);
    assert.equal(r.status, 0, `${builder}: ${r.out}${r.stderr}`);
    assert.match(r.out, /All set/, builder);
  }
});

test('0014 AC3: a reviewer command is checked by its first word on the PATH, and codex keeps its checks', () => {
  const cmdCfg = { builder: 'claude', reviewer: 'cursor', command: 'cursor-agent -p --output-format json --model {model}' };
  const missing = doctorRepo({ config: cmdCfg, tools: ['claude'] });
  assert.match(missing.out, /✗ Reviewer command for "cursor" \(cursor-agent\)\n\s+Fix: .*reviewer_options\.cursor\.command/);
  assert.doesNotMatch(missing.out, /Codex CLI|Signed in to Codex/);
  assert.equal(missing.status, 1);
  const present = doctorRepo({ config: cmdCfg, tools: ['claude', 'cursor-agent'] });
  assert.match(present.out, /✓ Reviewer command for "cursor" \(cursor-agent\)/);
  assert.equal(present.status, 0, present.out);
  // A command for codex is checked as a command, not with Codex's own checks.
  const codexCmd = doctorRepo({ config: { builder: 'claude', reviewer: 'codex', command: '/no/such/dir/codex-wrapper exec' }, tools: ['claude'] });
  assert.match(codexCmd.out, /✗ Reviewer command for "codex" \(\/no\/such\/dir\/codex-wrapper\)/);
  assert.doesNotMatch(codexCmd.out, /Signed in to Codex/);
  // reviewer: codex with no command: installed, then signed in, as before.
  const codex = doctorRepo({ config: { builder: 'claude', reviewer: 'codex' }, tools: ['claude', 'codex'] });
  assert.match(codex.out, /✓ Codex CLI \(reviews tickets\)/);
  assert.match(codex.out, /✓ Signed in to Codex/);
  const noCodex = doctorRepo({ config: { builder: 'claude', reviewer: 'codex' }, tools: ['claude'] });
  assert.match(noCodex.out, /✗ Codex CLI \(reviews tickets\)/);
});

test('0014 AC4: the docs describe the builder as any agent that reads speck skills', () => {
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  const req = readme.split('## Requirements')[1].split('\n## ')[0];
  for (const s of ['`.agents/skills/`', '`.claude/skills/`', 'Claude Code', 'Codex', 'Cursor']) assert.ok(req.includes(s), `README Requirements: ${s}`);
});

// ---------- 0023: self-check the build before the first review round ----------
