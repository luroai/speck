import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { installTooling } from '../scripts/install.mjs';
import { HOOK, installCommitHook } from '../scripts/commit-check.mjs';
import { speck } from './support/cli.mjs';
import { gitEnv } from './support/speck.mjs';

// ---------- 0550: refuse a commit that adds a private word or the home folder's path under speck/ ----------

// A fake home folder, with a private-words file holding `words` (none when null), and the env that uses it.
function fakeHome(words = 'Hushword\n# a comment\n') {
  const home = path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0550-'))), 'home', 'ann');
  fs.mkdirSync(home, { recursive: true });
  if (words !== null) {
    fs.mkdirSync(path.join(home, '.config', 'speck'), { recursive: true });
    fs.writeFileSync(path.join(home, '.config', 'speck', 'private-words'), words);
  }
  return { home, env: { ...process.env, ...gitEnv, HOME: home, USERPROFILE: home, GIT_CONFIG_NOSYSTEM: '1' } };
}

// A git repository with speck's command in .speck/ and the hook installed, with one committed note under speck/.
function hookedRepo(words) {
  const h = fakeHome(words);
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0550-repo-')));
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', env: h.env });
  g('init', '-q', '-b', 'main');
  installTooling(dir);
  assert.equal(installCommitHook(dir).action, 'installed');
  write(dir, 'speck/ideas/old.md', '# Old\n\nMentions hushword already.\n');
  g('add', '.');
  assert.equal(g('commit', '-q', '--no-verify', '-m', 'first').status, 0);
  return { ...h, dir, g, commits: () => Number(g('rev-list', '--count', 'HEAD').stdout.trim()) };
}

function write(dir, file, text) {
  fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  fs.writeFileSync(path.join(dir, file), text);
}

// Stages `file` with `text` and commits it.
function commitFile(r, file, text, cwd = r.dir) {
  write(cwd, file, text);
  spawnSync('git', ['add', '--', file], { cwd, env: r.env });
  return spawnSync('git', ['commit', '-q', '-m', 'note'], { cwd, encoding: 'utf8', env: r.env });
}

test('0550 AC1: a commit adding a private word, in any case, under speck/ is refused, naming the file and line without the word', () => {
  const r = hookedRepo();
  const c = commitFile(r, 'speck/ideas/new.md', '# New\n\nCaptured: today\nSee HUSHWORD.example\n');
  assert.notEqual(c.status, 0);
  assert.match(c.stderr, /speck\/ideas\/new\.md line 4: one of your private words/);
  assert.match(c.stderr, /Take each one out/);
  assert.doesNotMatch(c.stderr, /hushword/i);
  assert.equal(r.commits(), 1, 'nothing was committed');
});

test("0550 AC1: a commit adding the home folder's path under speck/ is refused, also when made with paths or from a worktree", () => {
  const r = hookedRepo();
  const c = commitFile(r, 'speck/tickets/0001-a.md', `# A\nLook in ${r.home}/projects/app\n`);
  assert.notEqual(c.status, 0);
  assert.match(c.stderr, /speck\/tickets\/0001-a\.md line 2: your home folder's path/);
  assert.doesNotMatch(c.stderr, new RegExp(r.home));
  // git commit <path> commits through a temporary index.
  const p = spawnSync('git', ['commit', '-q', '-m', 'x', '--', 'speck/tickets/0001-a.md'], { cwd: r.dir, encoding: 'utf8', env: r.env });
  assert.notEqual(p.status, 0);
  assert.match(p.stderr, /line 2: your home folder's path/);
  assert.equal(r.commits(), 1);
  // A worktree shares the repository's hooks.
  spawnSync('git', ['reset', '-q'], { cwd: r.dir, env: r.env });
  const wt = path.join(path.dirname(r.dir), `${path.basename(r.dir)}-wt`);
  assert.equal(r.g('worktree', 'add', '-q', '-b', 'side', wt).status, 0);
  const w = commitFile(r, 'speck/ideas/side.md', 'a hushword here\n', wt);
  assert.notEqual(w.status, 0);
  assert.match(w.stderr, /speck\/ideas\/side\.md line 1: one of your private words/);
  assert.equal(spawnSync('git', ['rev-list', '--count', 'HEAD'], { cwd: wt, encoding: 'utf8' }).stdout.trim(), '1');
});

test('0550 AC2: a commit commits when its added lines under speck/ are clean, the word is outside speck/, or only on lines it keeps or removes', () => {
  const r = hookedRepo();
  assert.equal(commitFile(r, 'speck/ideas/clean.md', `# Clean\nSee ~/projects/app\n`).status, 0);
  assert.equal(commitFile(r, 'LICENCE', `Hushword, ${r.home}\n`).status, 0, 'outside speck/');
  // old.md already holds the word: adding a clean line, then removing the word's line, both commit.
  assert.equal(commitFile(r, 'speck/ideas/old.md', '# Old\n\nMentions hushword already.\nA clean line.\n').status, 0);
  assert.equal(commitFile(r, 'speck/ideas/old.md', '# Old\n\nA clean line.\n').status, 0);
  assert.equal(r.commits(), 5);
});

test("0550 AC1 F1: a worktree whose branch has no copy of the check is still checked, wherever init ran", () => {
  const h = fakeHome();
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0550-repo-')));
  const g = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8', env: h.env });
  g(dir, 'init', '-q', '-b', 'main');
  write(dir, 'README', 'x\n');
  g(dir, 'add', '.');
  assert.equal(g(dir, 'commit', '-q', '-m', 'first').status, 0);
  // speck is installed in a linked worktree only; neither the main checkout nor another worktree's branch has .speck/.
  const a = `${dir}-a`, b = `${dir}-b`;
  assert.equal(g(dir, 'worktree', 'add', '-q', '-b', 'a', a).status, 0);
  assert.equal(g(dir, 'worktree', 'add', '-q', '-b', 'b', b).status, 0);
  installTooling(a);
  assert.equal(installCommitHook(a).action, 'installed');
  for (const cwd of [b, dir]) {
    const c = commitFile({ env: h.env }, 'speck/ideas/x.md', 'a hushword here\n', cwd);
    assert.notEqual(c.status, 0, cwd);
    assert.match(c.stderr, /speck\/ideas\/x\.md line 1: one of your private words/);
  }
  // Removing the worktree speck was installed in keeps the check.
  fs.rmSync(a, { recursive: true, force: true });
  g(dir, 'worktree', 'prune');
  assert.notEqual(spawnSync('git', ['commit', '-q', '-m', 'x'], { cwd: b, encoding: 'utf8', env: h.env }).status, 0);
});

test('0550 AC1 F2: line numbers stay right when git is set to join nearby changes', () => {
  const r = hookedRepo();
  r.g('config', 'diff.interHunkContext', '10');
  r.g('config', 'diff.context', '5');
  const lines = ['a', 'b', 'c', 'd', 'e', 'f'];
  assert.equal(commitFile(r, 'speck/ideas/n.md', lines.join('\n') + '\n').status, 0);
  const next = ['a', 'hushword one', 'b', 'c', 'd', 'hushword two', 'e', 'f'];
  const c = commitFile(r, 'speck/ideas/n.md', next.join('\n') + '\n');
  assert.notEqual(c.status, 0);
  assert.match(c.stderr, /n\.md line 2: /);
  assert.match(c.stderr, /n\.md line 6: /);
  assert.doesNotMatch(c.stderr, /line [^26]\b/);
});

test("0550 AC2: without a private-words file only the home folder's path is checked", () => {
  const r = hookedRepo(null);
  assert.equal(commitFile(r, 'speck/ideas/a.md', 'a hushword here\n').status, 0);
  const c = commitFile(r, 'speck/ideas/b.md', `in ${r.home}/x\n`);
  assert.notEqual(c.status, 0);
  assert.match(c.stderr, /speck\/ideas\/b\.md line 1: your home folder's path/);
});

test("0550 AC1 self-check: a private-words file that can't be read refuses the commit, saying why", { skip: process.getuid?.() === 0 && 'root reads any file' }, () => {
  const r = hookedRepo();
  fs.chmodSync(path.join(r.home, '.config', 'speck', 'private-words'), 0);
  const c = commitFile(r, 'speck/ideas/a.md', 'clean\n');
  assert.notEqual(c.status, 0);
  assert.match(c.stderr, /Can't read ~\/\.config\/speck\/private-words \(EACCES\)/);
  assert.doesNotMatch(c.stderr, /\n\s+at /, 'no stack trace');
  r.g('reset', '-q');
  assert.equal(commitFile(r, 'outside.txt', 'x\n').status, 0, 'a commit with nothing under speck/ still commits');
});

test('0550 AC3: an existing pre-commit hook or core.hooksPath is left unchanged, and installing again neither doubles nor removes it', () => {
  const r = hookedRepo();
  const file = path.join(r.dir, '.git', 'hooks', 'pre-commit');
  assert.equal(fs.readFileSync(file, 'utf8'), HOOK);
  assert.equal(installCommitHook(r.dir).action, 'current');
  assert.equal(fs.readFileSync(file, 'utf8'), HOOK);
  fs.writeFileSync(file, '#!/bin/sh\nexit 0\n');
  const own = installCommitHook(r.dir);
  assert.equal(own.action, 'skipped');
  assert.match(own.why, /already has its own pre-commit hook/);
  assert.equal(fs.readFileSync(file, 'utf8'), '#!/bin/sh\nexit 0\n');
  fs.rmSync(file);
  r.g('config', 'core.hooksPath', '.githooks');
  const set = installCommitHook(r.dir);
  assert.equal(set.action, 'skipped');
  assert.match(set.why, /core\.hooksPath is set \(\.githooks\)/);
  assert.equal(fs.existsSync(file), false);
  assert.equal(fs.existsSync(path.join(r.dir, '.githooks')), false);
});

test('0550 AC1, AC3: speck init installs the check once, keeps it on re-runs and says in one line when it leaves a hook alone', () => {
  const h = fakeHome();
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0550-init-')));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir, env: h.env });
  const file = path.join(dir, '.git', 'hooks', 'pre-commit');
  const first = speck(dir, h.env, 'init');
  assert.match(first.stdout, /updated the git pre-commit hook/);
  assert.equal(fs.readFileSync(file, 'utf8'), HOOK);
  assert.ok(fs.statSync(file).mode & 0o100, 'executable');
  const again = speck(dir, h.env, 'init');
  assert.doesNotMatch(again.stdout, /pre-commit|private-words check/);
  assert.equal(fs.readFileSync(file, 'utf8'), HOOK);
  fs.writeFileSync(file, '#!/bin/sh\nexit 0\n');
  const kept = speck(dir, h.env, 'init');
  const lines = kept.stdout.split('\n').filter(l => /private-words check for commits/.test(l));
  assert.equal(lines.length, 1);
  assert.match(lines[0], /isn't installed, because the repository already has its own pre-commit hook/);
  assert.equal(fs.readFileSync(file, 'utf8'), '#!/bin/sh\nexit 0\n');
});

test('0550 AC4: the brief says commits adding a private word are refused and that --no-verify skips the check', () => {
  const brief = fs.readFileSync(new URL('../docs/brief.md', import.meta.url), 'utf8');
  assert.ok(brief.includes('pre-commit'));
  assert.ok(brief.includes('git commit --no-verify'));
});
