import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, cliCopy, env } from './support/panel.mjs';
import { readPrivateWords, privateWordsFile, filesNaming } from './support/private-words.mjs';

// ---------- 0082: name Luro instead of the owner throughout the repo's files ----------

const INSTALL = 'npx github:luroai/speck init';
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const git = (...a) => spawnSync('git', a, { cwd: ROOT, encoding: 'utf8' });

test('AC1: README and the brief give the install command for luroai/speck', () => {
  for (const f of ['README.md', 'docs/brief.md']) assert.ok(read(f).includes(INSTALL), `${f} gives ${INSTALL}`);
});

test('AC1: a copy of speck that cannot install itself points to luroai/speck', () => {
  const { cli } = cliCopy(); // scripts and templates only, with no skills/ beside them
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0082-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: repo });
  const r = spawnSync(process.execPath, [cli, 'init'], { cwd: repo, encoding: 'utf8', env });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr + r.stdout, /can't install itself\. Run `npx github:luroai\/speck init` instead\./);
  assert.doesNotMatch(r.stderr, /\n\s+at /, 'a plain message, not a stack trace');
});

test('AC2: no tracked file outside speck/ names the owner, their old handle or machine username', (t) => {
  // The words live outside the repo (0084), so no tracked file holds them.
  const words = readPrivateWords();
  if (!words.length) return t.skip(`no words listed in ${privateWordsFile()}`);
  const files = filesNaming(words, ROOT);
  assert.deepEqual(files, [], `files still naming the owner:\n${files.join('\n')}`);
});

test('AC3: the v0.1 handoff note is gone', () => {
  assert.equal(fs.existsSync(path.join(ROOT, 'docs', 'HANDOFF.md')), false);
  assert.equal(git('ls-files', 'docs/HANDOFF.md').stdout, '');
});

test('AC4: the brief\'s sentence that named the owner now says "the maintainer"', () => {
  assert.match(read('docs/brief.md'), /Someone other than the maintainer installs it and ships a ticket\./);
});

test('AC5: the panel mockup is gone', () => {
  // 0126 removed the mockup, so it can no longer name anyone.
  assert.equal(fs.existsSync(path.join(ROOT, 'docs', 'panel-mockup.html')), false);
  assert.equal(git('ls-files', 'docs/panel-mockup.html').stdout, '');
});
