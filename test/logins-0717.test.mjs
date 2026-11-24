// 0717: saving a test password that is short or already in a tracked file warns, without showing it.
import './support/tmp.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { savedLogins } from '../scripts/logins.mjs';
import { gitEnv } from './support/speck.mjs';

const CLI = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'speck.mjs');
const git = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8', env: { ...process.env, ...gitEnv } });

function repo() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-weak-')));
  git(dir, 'init', '-q', '-b', 'main');
  fs.mkdirSync(path.join(dir, 'speck'));
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), 'base_branch: main\n');
  fs.writeFileSync(path.join(dir, '.gitignore'), 'speck/.cache/\n');
  fs.writeFileSync(path.join(dir, 'notes.txt'), 'The Marmalade-Sandwich-77 recipe\n');
  git(dir, 'add', '.');
  git(dir, 'commit', '-qm', 'init');
  return dir;
}
const set = (cwd, pw) => spawnSync(process.execPath, [CLI, 'logins', 'set', 'admin'], { cwd, input: `ann\n${pw}\n`, encoding: 'utf8' });

test('0717 AC1: a short password warns, naming the removal command', () => {
  const dir = repo(), r = set(dir, 'abc');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Warning/);
  assert.match(r.stdout, /any case/);
  assert.match(r.stdout, /speck logins remove admin/);
});

test('0717 AC1: a long password found in a tracked file, in another case, warns', () => {
  const dir = repo(), r = set(dir, 'marmalade-SANDWICH-77');
  assert.match(r.stdout, /Warning/);
  assert.match(r.stdout, /speck logins remove admin/);
});

test('0717 AC2: the warning never shows the password', () => {
  const dir = repo();
  for (const pw of ['abc', 'marmalade-SANDWICH-77']) {
    const r = set(dir, pw);
    assert.match(r.stdout, /Warning/);
    assert.ok(!(r.stdout + r.stderr).toLowerCase().includes(pw.toLowerCase()));
  }
});

test('0717 AC3: a warned login is still saved, with no question', () => {
  const dir = repo(), r = set(dir, 'abc');
  assert.equal(r.status, 0);
  assert.equal(savedLogins(dir).admin.password, 'abc');
});

test('0717 AC4: a long unusual password is saved without a warning', () => {
  const dir = repo(), r = set(dir, 'Zq-Plover-4821');
  assert.equal(r.status, 0, r.stderr);
  assert.doesNotMatch(r.stdout, /Warning/);
  assert.equal(savedLogins(dir).admin.password, 'Zq-Plover-4821');
});

test('0717 AC2: the password is never on a git command line', () => {
  const dir = repo(), bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-fakegit-')), log = path.join(bin, 'args.log');
  const real = spawnSync('which', ['git'], { encoding: 'utf8' }).stdout.trim();
  fs.writeFileSync(path.join(bin, 'git'), `#!/bin/sh\necho "$@" >> '${log}'\nexec '${real}' "$@"\n`, { mode: 0o755 });
  const r = spawnSync(process.execPath, [CLI, 'logins', 'set', 'admin'], { cwd: dir, input: 'ann\nmarmalade-SANDWICH-77\n', encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}` } });
  assert.match(r.stdout, /Warning/, 'still finds it in a tracked file');
  assert.ok(fs.existsSync(log) && !fs.readFileSync(log, 'utf8').toLowerCase().includes('marmalade'));
});
