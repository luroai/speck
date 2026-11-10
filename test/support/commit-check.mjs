// Shared by the commit check's tests (0550, 0627): a fake home folder with private words, and a repository with
// speck's hooks installed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { installTooling } from '../../scripts/install.mjs';
import { installCommitHook } from '../../scripts/commit-check.mjs';
import { gitEnv } from './speck.mjs';

// A fake home folder, with a private-words file holding `words` (none when null), and the env that uses it.
export function fakeHome(words = 'Hushword\n# a comment\n') {
  const home = path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0550-'))), 'home', 'ann');
  fs.mkdirSync(home, { recursive: true });
  if (words !== null) {
    fs.mkdirSync(path.join(home, '.config', 'speck'), { recursive: true });
    fs.writeFileSync(path.join(home, '.config', 'speck', 'private-words'), words);
  }
  return { home, env: { ...process.env, ...gitEnv, HOME: home, USERPROFILE: home, GIT_CONFIG_NOSYSTEM: '1' } };
}

// A git repository with speck's command in .speck/ and the hooks installed, with one committed note under speck/.
export function hookedRepo(words) {
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

export function write(dir, file, text) {
  fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  fs.writeFileSync(path.join(dir, file), text);
}

// Stages `file` with `text` and commits it, with the message `message`.
export function commitFile(r, file, text, cwd = r.dir, message = 'note') {
  write(cwd, file, text);
  spawnSync('git', ['add', '--', file], { cwd, env: r.env });
  return spawnSync('git', ['commit', '-q', '-m', message], { cwd, encoding: 'utf8', env: r.env });
}
