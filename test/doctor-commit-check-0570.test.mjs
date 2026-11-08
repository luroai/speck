import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { doctorChecks } from '../scripts/install.mjs';
import { HOOK, installCommitHook } from '../scripts/commit-check.mjs';
import { speck } from './support/cli.mjs';

// ---------- 0570: speck doctor says whether the commit check is on ----------

// A git repository with no pre-commit hook.
function repo() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0570-')));
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8' });
  g('init', '-q', '-b', 'main');
  return { dir, g, hook: path.join(dir, '.git', 'hooks', 'pre-commit') };
}

function ownHook(r) {
  fs.mkdirSync(path.dirname(r.hook), { recursive: true });
  fs.writeFileSync(r.hook, '#!/bin/sh\nexit 0\n', { mode: 0o755 });
}

const line = dir => {
  const found = doctorChecks(dir, {}).filter(c => /commit check/i.test(c.name));
  assert.equal(found.length, 1, 'one line about the commit check');
  return found[0];
};

// The commit check's line as `speck doctor` prints it, with its exit code.
function printed(dir) {
  const r = speck(dir, process.env, 'doctor');
  const shown = r.stdout.split('\n').filter(l => /commit check/i.test(l));
  assert.equal(shown.length, 1, r.stdout + r.stderr);
  return { shown: shown[0], status: r.status };
}

const off = c => {
  assert.match(c.name, /commit check is off/i);
  assert.equal(c.ok, false);
  assert.equal(c.warn, true);
};

test("0570 AC1: the line says the check is on when the pre-commit hook is speck's", () => {
  const r = repo();
  assert.equal(installCommitHook(r.dir).action, 'installed');
  const c = line(r.dir);
  assert.match(c.name, /commit check is on/i);
  assert.equal(c.ok, true);
});

test('0570 AC1: an older copy of the hook speck wrote still counts as on', () => {
  const r = repo();
  installCommitHook(r.dir);
  fs.writeFileSync(r.hook, HOOK + '# from an older speck\n');
  assert.match(line(r.dir).name, /commit check is on/i);
});

test('0570 AC1: the line is right from a worktree, whose hooks are in the main git folder', () => {
  const r = repo();
  installCommitHook(r.dir);
  r.g('-c', 'user.name=a', '-c', 'user.email=a@b.c', 'commit', '-q', '--allow-empty', '--no-verify', '-m', 'first');
  const tree = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0570-tree-')) + '/t';
  assert.equal(r.g('worktree', 'add', '-q', '-b', 'side', tree).status, 0);
  assert.match(line(tree).name, /commit check is on/i);
});

test('0570 AC2: with no pre-commit hook, the line says off and to run speck init again', () => {
  const c = line(repo().dir);
  off(c);
  assert.match(c.name, /no pre-commit hook/i);
  assert.match(c.name, /speck init/);
});

test("0570 AC3: with someone else's pre-commit hook, the line says off and why, and leaves it alone", () => {
  const r = repo();
  ownHook(r);
  const c = line(r.dir);
  off(c);
  assert.match(c.name, /its own pre-commit hook/i);
  assert.doesNotMatch(`${c.name} ${c.fix || ''}`, /replac|overwrit|remov|delet|speck init/i);
  assert.equal(fs.readFileSync(r.hook, 'utf8'), '#!/bin/sh\nexit 0\n');
});

test('0570 AC3: with core.hooksPath set, the line says off, names the folder and leaves it alone', () => {
  const r = repo();
  r.g('config', 'core.hooksPath', '.githooks');
  const c = line(r.dir);
  off(c);
  assert.match(c.name, /core\.hooksPath/);
  assert.match(c.name, /\.githooks/);
  assert.doesNotMatch(`${c.name} ${c.fix || ''}`, /replac|overwrit|remov|delet|speck init/i);
  assert.equal(fs.existsSync(path.join(r.dir, '.githooks')), false);
});

test("0570 AC3: core.hooksPath wins over speck's hook in the repository's own folder, which git no longer runs", () => {
  const r = repo();
  installCommitHook(r.dir);
  r.g('config', 'core.hooksPath', '.githooks');
  const c = line(r.dir);
  off(c);
  assert.match(c.name, /core\.hooksPath/);
});

test("0570: speck's hook that git can't run isn't reported as on", { skip: process.platform === 'win32' }, () => {
  const r = repo();
  installCommitHook(r.dir);
  fs.chmodSync(r.hook, 0o644);
  const c = line(r.dir);
  off(c);
  assert.match(c.name, /executable/i);
  assert.match(c.name, /chmod \+x/);
});

test('0570: a pre-commit path that can\'t be read says off, without a stack trace', () => {
  const r = repo();
  fs.mkdirSync(r.hook, { recursive: true });
  const c = line(r.dir);
  off(c);
  assert.match(c.name, /can't be read/);
});

test('0570: outside a git repository there is no line, as the repository check already fails', () => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0570-none-')));
  assert.equal(doctorChecks(dir, {}).filter(c => /commit check/i.test(c.name)).length, 0);
});

test('0570 AC4: each off line is printed with !, never ✗, and leaves the exit code alone', () => {
  const none = repo(), own = repo(), hooksPath = repo(), on = repo();
  ownHook(own);
  hooksPath.g('config', 'core.hooksPath', '.githooks');
  installCommitHook(on.dir);
  const base = printed(on.dir);
  assert.match(base.shown, /^\s*✓ /);
  for (const r of [none, own, hooksPath]) {
    const p = printed(r.dir);
    assert.match(p.shown, /^\s*! /);
    assert.doesNotMatch(p.shown, /✗/);
    assert.equal(p.status, base.status, 'the same exit code as when the check is on');
  }
});
