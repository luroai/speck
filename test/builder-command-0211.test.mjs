import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, env } from './support/run.mjs';
import { cmdRun } from '../scripts/run.mjs';
import { doctorChecks, installTooling } from '../scripts/install.mjs';

// ---------- 0211: speck run won't start Claude Code's builds when another builder is set ----------

const CLAUDE = 'claude -p "/speck-build {id}" --session-id {session} --output-format stream-json --verbose --dangerously-skip-permissions';
const OTHERS = { codex: 'codex', cursor: 'cursor-agent', gemini: 'gemini' };

// A committed repo whose speck/config.yml has the given builder and build_command, on `branch`.
function repoWith(builder, command, branch = 'main') {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0211-')));
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', env });
  g('init', '-q', '-b', branch);
  fs.mkdirSync(path.join(dir, 'speck', 'tickets'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), `base_branch: main\nbuilder: ${builder}\nreviewer: codex\nbuild_command: ${JSON.stringify(command)}\n`);
  g('add', '-A'); g('commit', '-qm', 'base');
  return { dir, status: () => g('status', '--porcelain', '--ignored').stdout };
}

// Runs cmdRun in `dir` and returns the error it throws.
function runIn(dir) {
  const was = process.cwd();
  process.chdir(dir);
  try { cmdRun(); } catch (e) { return e; } finally { process.chdir(was); }
  assert.fail('speck run started');
}

const mismatch = checks => checks.filter(c => /build_command/.test(c.name));

for (const [builder, cmd] of Object.entries(OTHERS)) {
  test(`0211 AC1: with builder ${builder} and a build_command starting claude, speck run refuses and changes nothing`, () => {
    const r = repoWith(builder, CLAUDE);
    const before = r.status();
    const e = runIn(r.dir);
    assert.match(e.message, new RegExp(`builder in speck/config\\.yml is ${builder}\\b`));
    assert.match(e.message, /build_command starts claude \(Claude Code\)/);
    assert.match(e.message, new RegExp(`set a build_command that starts ${cmd}, or set builder back to claude`));
    assert.doesNotMatch(e.message, /\n\s+at /, 'no stack trace');
    assert.equal(r.status(), before, 'nothing in the repo changed');
  });

  test(`0211 AC2: speck doctor reports builder ${builder} with a claude build_command, with the same advice`, () => {
    const cfg = { builder, build_command: CLAUDE };
    const found = mismatch(doctorChecks(os.tmpdir(), cfg));
    assert.equal(found.length, 1);
    assert.equal(found[0].ok, false);
    const r = repoWith(builder, CLAUDE);
    assert.ok(runIn(r.dir).message.endsWith(found[0].fix), 'speck run gives the same advice as doctor');
  });
}

test('0211 AC1: a claude build_command given as a path counts as starting claude', () => {
  const r = repoWith('codex', '/usr/local/bin/claude -p "/speck-build {id}"');
  assert.match(runIn(r.dir).message, /builder in speck\/config\.yml is codex/);
});

test('0211 AC2: speck doctor says nothing about build_command when it matches the builder, or is blank', () => {
  for (const cfg of [
    { builder: 'claude', build_command: CLAUDE },
    { build_command: CLAUDE },
    { builder: 'codex', build_command: 'codex exec "/speck-build {id}"' },
    { builder: 'cursor', build_command: 'cursor-agent -p "/speck-build {id}"' },
    { builder: 'gemini', build_command: '' },
    { builder: 'gemini' },
    { builder: 'codex', build_command: 'claude "unclosed' },
    { builder: 'constructor', build_command: CLAUDE },
  ]) assert.deepEqual(mismatch(doctorChecks(os.tmpdir(), cfg)), [], JSON.stringify(cfg));
});

test('0211 AC4: with builder claude, or a build_command not starting with claude, speck run gets past the check', () => {
  // On a branch other than main, speck run stops at its next check, which shows the builder check let it through.
  for (const [builder, command] of [['claude', CLAUDE], ['codex', 'codex exec "/speck-build {id}"'], ['gemini', 'claudette {id}']]) {
    const r = repoWith(builder, command, 'other');
    assert.match(runIn(r.dir).message, /^This checkout is on "other", not main\./, `${builder}: ${command}`);
  }
});

test('0211 AC3: setup explains build_command for another builder, asks for it or offers blank, and never keeps the default', () => {
  const skill = fs.readFileSync(path.join(ROOT, 'skills', 'speck-setup', 'SKILL.md'), 'utf8');
  const six = skill.split('\n## ').find(p => p.startsWith('6.'));
  const flat = six.replace(/\s+/g, ' ');
  assert.match(flat, /other than Claude Code/);
  assert.match(flat, /must start that builder without anyone watching/);
  assert.match(flat, /Ask them for the command/);
  assert.match(flat, /speck config set build_command ""/);
  assert.match(flat, /`\/speck-build <id>`/);
  assert.match(flat, /Never leave Claude Code's default in place/);
});

test('0211 AC3: the copies of speck-setup that speck init installs match skills/', () => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0211-init-')));
  installTooling(dir);
  const source = fs.readFileSync(path.join(ROOT, 'skills', 'speck-setup', 'SKILL.md'), 'utf8');
  for (const base of ['.claude/skills', '.agents/skills'])
    assert.equal(fs.readFileSync(path.join(dir, base, 'speck-setup', 'SKILL.md'), 'utf8'), source, base);
});
