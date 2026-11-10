import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { doctorChecks } from '../scripts/install.mjs';
import { COPIED_FILES, MESSAGE_HOOK, installCommitHook } from '../scripts/commit-check.mjs';
import { speck } from './support/cli.mjs';
import { commitFile, fakeHome, hookedRepo, write } from './support/commit-check.mjs';

// ---------- 0627: check every committed file, and the commit message, for private words ----------

test('0627 AC1: a commit adding a private word or the home folder\'s path to a file outside speck/ is refused, naming the file and line', () => {
  const r = hookedRepo();
  for (const file of ['scripts/app.mjs', 'test/app.test.mjs', 'docs/guide.md', 'NOTES.md']) {
    const c = commitFile(r, file, `one\ntwo HushWord three\n`);
    assert.notEqual(c.status, 0, file);
    assert.match(c.stderr, new RegExp(`${file.replace(/\./g, '\\.')} line 2: one of your private words`));
    assert.doesNotMatch(c.stderr, /hushword/i);
    r.g('reset', '-q');
  }
  const h = commitFile(r, 'src/paths.txt', `a\nb\nsee ${r.home}/notes\n`);
  assert.notEqual(h.status, 0);
  assert.match(h.stderr, /src\/paths\.txt line 3: your home folder's path/);
  assert.doesNotMatch(h.stderr, new RegExp(r.home));
  assert.equal(r.commits(), 1, 'nothing was committed');
});

test('0627 AC1: clean lines anywhere, and lines it only keeps or removes, still commit', () => {
  const r = hookedRepo();
  assert.equal(commitFile(r, 'src/a.txt', 'clean\nsee ~/notes\n').status, 0);
  assert.equal(r.g('commit', '-q', '--no-verify', '-m', 'x', '--allow-empty').status, 0);
  write(r.dir, 'src/b.txt', 'hushword\n');
  r.g('add', 'src/b.txt');
  assert.equal(r.g('commit', '-q', '--no-verify', '-m', 'old').status, 0);
  assert.equal(commitFile(r, 'src/b.txt', 'hushword\nclean\n').status, 0, 'a kept line');
  assert.equal(commitFile(r, 'src/b.txt', 'clean\n').status, 0, 'a removed line');
});

test('0627 AC2: the price list copied from LiteLLM is left out, in speck itself and in a project\'s .speck/', () => {
  assert.deepEqual(COPIED_FILES, ['scripts/prices.json', '.speck/scripts/prices.json']);
  const r = hookedRepo();
  for (const file of COPIED_FILES) assert.equal(commitFile(r, file, '{"hushword-1": {}}\n').status, 0, file);
  const c = commitFile(r, 'scripts/other.json', '{"hushword-1": {}}\n');
  assert.notEqual(c.status, 0, 'only those files are left out');
  assert.match(c.stderr, /scripts\/other\.json line 1/);
});

test('0627 AC2: the brief says which files are left out and why', () => {
  const brief = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8');
  assert.ok(brief.includes('scripts/prices.json'));
  assert.ok(brief.includes('LiteLLM'));
  assert.ok(brief.includes('commit-msg'));
});

test('0627 AC3: a commit message holding a private word or the home folder\'s path is refused, saying so', () => {
  const r = hookedRepo();
  const w = commitFile(r, 'src/a.txt', 'clean\n', r.dir, 'Fix it\n\nAs HUSHWORD asked');
  assert.notEqual(w.status, 0);
  assert.match(w.stderr, /its message holds your private words/);
  assert.match(w.stderr, /commit message line 3: one of your private words/);
  assert.doesNotMatch(w.stderr, /hushword/i);
  const h = spawnSync('git', ['commit', '-q', '-m', `See ${r.home}/x`], { cwd: r.dir, encoding: 'utf8', env: r.env });
  assert.notEqual(h.status, 0);
  assert.match(h.stderr, /commit message line 1: your home folder's path/);
  assert.equal(r.commits(), 1);
  assert.equal(spawnSync('git', ['commit', '-q', '-m', 'Fix it'], { cwd: r.dir, env: r.env }).status, 0, 'a clean message commits');
});

test('0627 AC3 F1: a message with a private word or the home folder\'s path below a scissors line is refused, as git keeps it', () => {
  const r = hookedRepo();
  const scissors = '# ------------------------ >8 ------------------------';
  for (const [rest, what] of [['hushword', 'one of your private words'], [`${r.home}/x`, "your home folder's path"]]) {
    const c = commitFile(r, 'src/a.txt', 'clean\n', r.dir, `Fix it\n${scissors}\n${rest}`);
    assert.notEqual(c.status, 0);
    assert.match(c.stderr, new RegExp(`commit message line 3: ${what}`));
  }
  assert.equal(r.commits(), 1);
});

test('0627 AC3: speck init installs the commit-msg hook beside the pre-commit one, and leaves a hook that isn\'t speck\'s', () => {
  const h = fakeHome();
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0627-init-')));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir, env: h.env });
  const msg = path.join(dir, '.git', 'hooks', 'commit-msg');
  const first = speck(dir, h.env, 'init');
  assert.match(first.stdout, /updated the git pre-commit hook/);
  assert.match(first.stdout, /updated the git commit-msg hook/);
  assert.equal(fs.readFileSync(msg, 'utf8'), MESSAGE_HOOK);
  assert.ok(fs.statSync(msg).mode & 0o100, 'executable');
  assert.doesNotMatch(speck(dir, h.env, 'init').stdout, /commit-msg|commit messages/, 'nothing to say on a re-run');
  fs.writeFileSync(msg, '#!/bin/sh\nexit 0\n');
  const kept = speck(dir, h.env, 'init');
  const lines = kept.stdout.split('\n').filter(l => /private-words check for commit messages/.test(l));
  assert.equal(lines.length, 1);
  assert.match(lines[0], /isn't installed, because the repository already has its own commit-msg hook/);
  assert.equal(fs.readFileSync(msg, 'utf8'), '#!/bin/sh\nexit 0\n');
  assert.doesNotMatch(kept.stdout, /pre-commit/, "speck's own pre-commit hook is kept as it is");
});

test('0627 AC3: with its own pre-commit hook, the commit-msg hook is still installed', () => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0627-own-')));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const pre = path.join(dir, '.git', 'hooks', 'pre-commit');
  fs.mkdirSync(path.dirname(pre), { recursive: true });
  fs.writeFileSync(pre, '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  const r = installCommitHook(dir);
  assert.equal(r.action, 'skipped');
  assert.equal(r.message.action, 'installed');
  assert.equal(fs.readFileSync(pre, 'utf8'), '#!/bin/sh\nexit 0\n');
});

test('0627 AC4: git commit --no-verify skips both checks', () => {
  const r = hookedRepo();
  write(r.dir, 'src/a.txt', `hushword ${r.home}\n`);
  r.g('add', 'src/a.txt');
  assert.equal(r.g('commit', '-q', '--no-verify', '-m', `hushword ${r.home}`).status, 0);
  assert.equal(r.commits(), 2);
});

test('0627 AC4: speck doctor reports both checks, as on or off with why', () => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0627-doc-')));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const lines = () => doctorChecks(dir, {}).filter(c => /commit (message )?check/i.test(c.name));
  let [pre, msg] = lines();
  assert.match(pre.name, /^Commit check is off: the repository has no pre-commit hook/);
  assert.match(msg.name, /^Commit message check is off: the repository has no commit-msg hook\. Run `speck init` again/);
  assert.equal(msg.warn, true);
  installCommitHook(dir);
  [pre, msg] = lines();
  assert.match(pre.name, /^Commit check is on: .*any file/);
  assert.match(msg.name, /^Commit message check is on/);
  assert.equal(msg.ok, true);
  fs.writeFileSync(path.join(dir, '.git', 'hooks', 'commit-msg'), '#!/bin/sh\nexit 0\n');
  [, msg] = lines();
  assert.match(msg.name, /its own commit-msg hook/);
  assert.match(msg.name, /commit-check\.mjs --message/);
});

test('0627 AC3 self-check: a commit message file that can\'t be read refuses the commit with a plain error', () => {
  const r = hookedRepo();
  const c = spawnSync('node', [path.join(r.dir, '.speck', 'scripts', 'commit-check.mjs'), '--message', path.join(r.dir, 'missing')], { cwd: r.dir, encoding: 'utf8', env: r.env });
  assert.equal(c.status, 1);
  assert.match(c.stderr, /Couldn't read the commit message \(ENOENT\)/);
  assert.doesNotMatch(c.stderr, /\n\s+at /, 'no stack trace');
});
