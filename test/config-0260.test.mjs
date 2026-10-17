import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../scripts/core.mjs';
import { machineConfigFile, maxParallelBuilds } from '../scripts/machine.mjs';
import { maxParallelTests } from '../scripts/turns.mjs';

// ---------- 0260: a setting for this machine only ----------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(ROOT, 'scripts', 'speck.mjs');
const CONFIG = 'base_branch: main\nmax_parallel_builds: 1   # how many builds at once\nmax_parallel_tests: 2\n';
const git = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8' });

// A git repo with speck/config.yml committed, and a worktree of it.
function repo() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-machine-')));
  git(dir, 'init', '-q', '-b', 'main');
  fs.mkdirSync(path.join(dir, 'speck'));
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), CONFIG);
  git(dir, 'add', 'speck/config.yml');
  git(dir, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'init');
  const wt = path.join(dir + '.worktrees', 'side');
  git(dir, 'worktree', 'add', '-q', '-b', 'side', wt);
  return {
    dir, wt,
    run: (cwd, ...a) => spawnSync(process.execPath, [CLI, 'config', 'set', ...a], { cwd, encoding: 'utf8' }),
    head: () => git(dir, 'rev-parse', 'HEAD').stdout.trim(),
    status: () => git(dir, 'status', '--porcelain').stdout,
  };
}

test('0260 AC1: --machine records the value in a file git ignores, leaves config.yml and git alone, and prints old → new', () => {
  const r = repo(), head = r.head();
  const out = r.run(r.dir, '--machine', 'max_parallel_builds', '3');
  assert.equal(out.status, 0, out.stderr);
  assert.equal(out.stdout.trim(), 'max_parallel_builds (this machine): 1 → 3');
  assert.equal(fs.readFileSync(path.join(r.dir, 'speck', 'config.yml'), 'utf8'), CONFIG);
  const file = machineConfigFile(r.dir);
  assert.ok(fs.existsSync(file));
  assert.equal(git(r.dir, 'check-ignore', '-q', file).status, 0, 'git ignores the machine file');
  assert.equal(r.status(), '', 'nothing to commit');
  assert.equal(r.head(), head, 'nothing committed');
  // Setting it again prints the machine value speck used.
  assert.equal(r.run(r.dir, '--machine', 'max_parallel_builds', '2').stdout.trim(), 'max_parallel_builds (this machine): 3 → 2');
});

test('0260 AC2: a machine value is used over config.yml\'s from the main checkout and every worktree', () => {
  const r = repo();
  assert.equal(r.run(r.wt, '--machine', 'max_parallel_builds', '3').status, 0);
  assert.equal(r.run(r.dir, '--machine', 'max_parallel_tests', '4').status, 0);
  for (const at of [r.dir, r.wt]) {
    const cfg = loadConfig(at);
    assert.equal(maxParallelBuilds(cfg), 3, `speck run keeps up to 3 builds going, read from ${at}`);
    assert.equal(maxParallelTests(cfg), 4);
  }
  assert.equal(machineConfigFile(r.wt), machineConfigFile(r.dir), 'worktrees read the main checkout\'s file');
  assert.equal(loadConfig(r.dir, { machine: false }).max_parallel_builds, 1, 'config.yml\'s own value is unchanged');
  const shared = r.run(r.dir, 'max_parallel_builds', '5');
  assert.match(shared.stdout, /max_parallel_builds: 1 → 5\nThis machine uses its own max_parallel_builds, 3, over it/, 'setting it for every machine says this one keeps its own');
  assert.equal(loadConfig(r.wt).max_parallel_builds, 3);
});

test('0260 AC3: a blank value removes this machine\'s value, so config.yml\'s applies again', () => {
  const r = repo();
  r.run(r.dir, '--machine', 'max_parallel_builds', '3');
  r.run(r.dir, '--machine', 'max_parallel_tests', '4');
  const out = r.run(r.dir, '--machine', 'max_parallel_builds', '');
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /^max_parallel_builds \(this machine\): 3 → 1/);
  assert.equal(loadConfig(r.dir).max_parallel_builds, 1);
  assert.equal(loadConfig(r.wt).max_parallel_tests, 4, 'the other machine value stays');
  r.run(r.dir, '--machine', 'max_parallel_tests', '');
  assert.equal(loadConfig(r.dir).max_parallel_tests, 2);
  assert.ok(!fs.existsSync(machineConfigFile(r.dir)), 'no machine values left: no file');
  const again = r.run(r.dir, '--machine', 'max_parallel_tests', '');
  assert.equal(again.status, 0, again.stderr);
  assert.match(again.stdout, /no value for this machine/);
});

test('0260 AC4: --machine refuses any other setting, naming the ones it can set, and changes nothing', () => {
  const r = repo();
  for (const key of ['reviewer', 'limits.max_review_rounds', 'constructor', '__proto__']) {
    const out = r.run(r.dir, '--machine', key, 'x');
    assert.notEqual(out.status, 0);
    assert.match(out.stderr, /max_parallel_builds, max_parallel_tests/);
    assert.doesNotMatch(out.stderr, /at .*\.mjs:\d+/, 'no stack trace');
  }
  assert.ok(!fs.existsSync(machineConfigFile(r.dir)));
  assert.equal(fs.readFileSync(path.join(r.dir, 'speck', 'config.yml'), 'utf8'), CONFIG);
});

test('0260 AC4: a machine value is checked as speck config set checks the same setting', () => {
  const r = repo();
  r.run(r.dir, '--machine', 'max_parallel_builds', '3');
  const before = fs.readFileSync(machineConfigFile(r.dir), 'utf8');
  for (const bad of ['0', '-1', 'two', '1.5']) {
    const machine = r.run(r.dir, '--machine', 'max_parallel_builds', bad), shared = r.run(r.dir, 'max_parallel_builds', bad);
    assert.notEqual(machine.status, 0);
    assert.equal(machine.stderr, shared.stderr);
  }
  assert.equal(fs.readFileSync(machineConfigFile(r.dir), 'utf8'), before);
  assert.equal(fs.readFileSync(path.join(r.dir, 'speck', 'config.yml'), 'utf8'), CONFIG);
});

test('0260 AC4: a hand-edited bad machine value is refused with how to fix it, and --machine can still fix it', () => {
  const r = repo();
  r.run(r.dir, '--machine', 'max_parallel_builds', '3');
  fs.writeFileSync(machineConfigFile(r.dir), 'max_parallel_builds: lots\n');
  assert.throws(() => loadConfig(r.dir), /max_parallel_builds set for this machine .* must be a whole number of 1 or more.*speck config set --machine max_parallel_builds/);
  const out = r.run(r.dir, '--machine', 'max_parallel_builds', '');
  assert.equal(out.status, 0, out.stderr);
  assert.equal(loadConfig(r.dir).max_parallel_builds, 1);
});
