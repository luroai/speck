import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { suggestCommands } from '../scripts/detect.mjs';

// ---------- 0322: speck detect suggests the test command for the project's package manager ----------

const CLI = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), 'scripts', 'speck.mjs');

// A project folder with a package.json (an object, or raw text) and the named lockfiles.
function project({ pkg = { scripts: { test: 'vitest run' } }, locks = [] } = {}) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-detect-')));
  if (pkg !== null) fs.writeFileSync(path.join(dir, 'package.json'), typeof pkg === 'string' ? pkg : JSON.stringify(pkg));
  for (const lock of locks) fs.writeFileSync(path.join(dir, lock), '');
  return dir;
}

const withManager = (packageManager, scripts = { test: 'vitest run' }) => ({ name: 'x', packageManager, scripts });

// The package manager a suggested command names, by its first word.
const managerOf = cmd => cmd.split(' ')[0];

test('0322 AC1: a real test script gets the test command of the lockfile\'s package manager', () => {
  const cases = [
    [['pnpm-lock.yaml'], 'pnpm test'],
    [['yarn.lock'], 'yarn test'],
    [['bun.lockb'], 'bun run test'],
    [['bun.lock'], 'bun run test'],
    [['package-lock.json'], 'npm test'],
    [['npm-shrinkwrap.json'], 'npm test'],
    [[], 'npm test'],
  ];
  for (const [locks, cmd] of cases) assert.equal(suggestCommands(project({ locks })).test_command, cmd, locks.join() || 'no lockfile');
});

test('0322 AC1: speck detect itself suggests pnpm test for a pnpm project', () => {
  const dir = project({ locks: ['pnpm-lock.yaml'] });
  const r = spawnSync(process.execPath, [CLI, 'detect'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout).suggestions, { test_command: 'pnpm test', worktree_setup: 'pnpm install --frozen-lockfile' });
});

test('0322 AC2: packageManager names the package manager, and wins over the lockfile', () => {
  const cases = [
    ['pnpm@9.1.0', [], 'pnpm test'],
    ['yarn@4.2.2', ['package-lock.json'], 'yarn test'],
    ['bun@1.1.0', ['pnpm-lock.yaml'], 'bun run test'],
    ['npm@10.8.1', ['yarn.lock'], 'npm test'],
    ['pnpm@9.1.0+sha512.abc', ['package-lock.json'], 'pnpm test'],
    ['pnpm', ['package-lock.json'], 'pnpm test'],
  ];
  for (const [pm, locks, cmd] of cases) assert.equal(suggestCommands(project({ pkg: withManager(pm), locks })).test_command, cmd, `${pm} ${locks}`);
});

test('0322 AC2: without a usable packageManager, the first lockfile in the install command\'s order decides', () => {
  // Two lockfiles: the same one the install command is chosen from.
  let s = suggestCommands(project({ locks: ['yarn.lock', 'pnpm-lock.yaml'] }));
  assert.deepEqual(s, { test_command: 'pnpm test', worktree_setup: 'pnpm install --frozen-lockfile' });
  // A packageManager speck doesn't know, or one that isn't a string, is ignored.
  for (const pm of ['deno@2.0.0', 'pnpmx@1', '', 7, null, ['pnpm@9'], { name: 'pnpm' }]) {
    s = suggestCommands(project({ pkg: withManager(pm), locks: ['yarn.lock'] }));
    assert.deepEqual(s, { test_command: 'yarn test', worktree_setup: 'yarn install --frozen-lockfile' }, JSON.stringify(pm));
  }
  // A packageManager tucked under __proto__ isn't the project's own field.
  s = suggestCommands(project({ pkg: '{"__proto__": {"packageManager": "pnpm@9"}, "scripts": {"test": "x"}}', locks: ['yarn.lock'] }));
  assert.equal(s.test_command, 'yarn test');
});

test('0322 AC3: the install command and the test command always name the same package manager', () => {
  const managers = ['npm@10.8.1', 'pnpm@9.1.0', 'yarn@1.22.22', 'bun@1.1.0', undefined];
  const lockSets = [[], ['pnpm-lock.yaml'], ['yarn.lock'], ['bun.lockb'], ['bun.lock'], ['package-lock.json'], ['npm-shrinkwrap.json'], ['yarn.lock', 'package-lock.json']];
  for (const pm of managers) {
    for (const locks of lockSets) {
      const { test_command, worktree_setup } = suggestCommands(project({ pkg: withManager(pm), locks }));
      if (worktree_setup) assert.equal(managerOf(worktree_setup), managerOf(test_command), `${pm} ${locks}`);
    }
  }
  // packageManager wins for the install command too: its own lockfile when there is one, a plain install otherwise.
  assert.equal(suggestCommands(project({ pkg: withManager('pnpm@9.1.0'), locks: ['package-lock.json'] })).worktree_setup, 'pnpm install');
  assert.equal(suggestCommands(project({ pkg: withManager('pnpm@9.1.0'), locks: ['package-lock.json', 'pnpm-lock.yaml'] })).worktree_setup, 'pnpm install --frozen-lockfile');
  assert.equal(suggestCommands(project({ pkg: withManager('npm@10.8.1'), locks: ['yarn.lock'] })).worktree_setup, 'npm install');
  assert.equal(suggestCommands(project({ pkg: withManager('npm@10.8.1'), locks: [] })).worktree_setup, null);
});

test('0322 AC4: without a real test script, the test suggestion is the same as before', () => {
  const noScript = [{ name: 'x' }, { scripts: { test: 'echo "Error: no test specified" && exit 1' } }, { scripts: { test: '' } }, { scripts: { build: 'tsc' } }];
  for (const pkg of noScript) {
    for (const locks of [[], ['pnpm-lock.yaml'], ['bun.lock']]) {
      assert.equal(suggestCommands(project({ pkg: { ...pkg, packageManager: 'pnpm@9.1.0' }, locks })).test_command, null, JSON.stringify(pkg));
      assert.equal(suggestCommands(project({ pkg, locks })).test_command, null, JSON.stringify(pkg));
    }
  }
  let dir = project({ pkg: withManager('pnpm@9.1.0', {}), locks: ['pnpm-lock.yaml'] });
  fs.writeFileSync(path.join(dir, 'pytest.ini'), '[pytest]\n');
  assert.equal(suggestCommands(dir).test_command, 'pytest');
  dir = project({ pkg: withManager('yarn@4.2.2', {}), locks: ['yarn.lock'] });
  fs.writeFileSync(path.join(dir, 'Makefile'), 'test:\n\techo ok\n');
  assert.equal(suggestCommands(dir).test_command, 'make test');
  assert.deepEqual(suggestCommands(project({ pkg: null })), { test_command: null, worktree_setup: null });
});
