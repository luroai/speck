import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { ROOT, env } from './support/panel.mjs';
import { readPrivateWords, filesNaming } from './support/private-words.mjs';

// ---------- 0084: 0082's check reads the owner's private words from outside the repo ----------

const home = (list) => {
  const h = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0084-home-'));
  if (list !== undefined) {
    fs.mkdirSync(path.join(h, '.config', 'speck'), { recursive: true });
    fs.writeFileSync(path.join(h, '.config', 'speck', 'private-words'), list);
  }
  return h;
};

const repoWith = (files) => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0084-repo-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: repo });
  for (const [f, body] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(repo, f)), { recursive: true });
    fs.writeFileSync(path.join(repo, f), body);
  }
  spawnSync('git', ['add', '-A'], { cwd: repo });
  return repo;
};

// Runs 0082's test file on its own, with HOME pointing at the given folder. Without
// NODE_TEST_CONTEXT, the child reports to its own stdout rather than to this test run.
const run0082 = (h) => {
  const { NODE_TEST_CONTEXT, ...rest } = env;
  return spawnSync(process.execPath, ['--test', '--test-reporter=tap', 'test/luro-0082.test.mjs'], {
    cwd: ROOT, encoding: 'utf8', env: { ...rest, HOME: h, USERPROFILE: h },
  });
};
const ac2Line = (out) => out.split('\n').find(l => /^\s*(not )?ok \d+ - AC2/.test(l)) ?? '';

test('AC1: words come from ~/.config/speck/private-words, one per line, skipping blanks and # lines', () => {
  const h = home('# my words\n\nAlpha\n  beta  \r\n#gamma\n\n');
  assert.deepEqual(readPrivateWords(h), ['Alpha', 'beta']);
});

test('AC1: matching is case-insensitive, finds a word anywhere and treats it literally', () => {
  const repo = repoWith({ 'a.md': 'xxALPHAxx\n', 'b.md': 'nothing here\n', 'c.md': 'a.b\n', 'd.md': 'axb\n' });
  assert.deepEqual(filesNaming(['alpha'], repo), ['a.md']);
  assert.deepEqual(filesNaming(['a.b'], repo), ['c.md'], 'a dot is a dot, not any character');
});

test('AC2: a tracked file naming a listed word is reported by name; 0082\'s ticket file is not', () => {
  const repo = repoWith({
    'docs/x.md': 'hello Zorblat\n', 'y.md': 'zorblat too\n', 'clean.md': 'fine\n',
    'speck/tickets/0082-name.md': 'zorblat\n', 'speck/tickets/done/0082-name.md': 'zorblat\n',
  });
  assert.deepEqual(filesNaming(['zorblat'], repo).sort(), ['docs/x.md', 'y.md']);
  assert.deepEqual(filesNaming(['nowhere'], repo), []);
});

test('AC2: 0082\'s check fails naming each file when a listed word is in a tracked file', () => {
  const r = run0082(home('# list\nLUROAI\n'));
  assert.match(ac2Line(r.stdout), /^\s*not ok/, r.stdout);
  for (const f of ['README.md', 'test/luro-0082.test.mjs']) assert.ok(r.stdout.includes(f), `the message names ${f}`);
});

test('AC2: 0082\'s check passes when no tracked file has any listed word', () => {
  const r = run0082(home(`zz${crypto.randomUUID()}\n`));
  assert.match(ac2Line(r.stdout), /^\s*ok \d+ - AC2/, r.stdout);
  assert.doesNotMatch(ac2Line(r.stdout), /# SKIP/);
  assert.equal(r.status, 0, r.stdout);
});

test('AC3: a missing list or a list with no words skips the check and the rest still runs', () => {
  for (const h of [home(), home('# only comments\n\n   \n')]) {
    assert.deepEqual(readPrivateWords(h), []);
    const r = run0082(h);
    assert.match(ac2Line(r.stdout), /^\s*ok \d+ - AC2.*# SKIP/, r.stdout);
    assert.match(r.stdout, /^# skipped 1$/m);
    assert.match(r.stdout, /^# pass [1-9]/m, 'the other tests ran');
    assert.equal(r.status, 0, r.stdout);
  }
});

test('AC4: 0082\'s test file no longer holds the words, whole or in parts', () => {
  const ticket = fs.readdirSync(path.join(ROOT, 'speck/tickets/done')).find(f => f.startsWith('0082-'));
  const ac2 = fs.readFileSync(path.join(ROOT, 'speck/tickets/done', ticket), 'utf8').split('\n').find(l => l.startsWith('2. '));
  const words = [...ac2.matchAll(/`([^`]+)`/g)].map(m => m[1].toLowerCase()).filter(w => !w.includes(' '));
  assert.ok(words.length >= 3, 'read the words from 0082\'s AC2');
  const src = fs.readFileSync(path.join(ROOT, 'test/luro-0082.test.mjs'), 'utf8');
  for (const w of words) assert.ok(!src.toLowerCase().includes(w), 'a word is in the file whole');
  const literals = [...src.matchAll(/(['"`])((?:(?!\1)[^\\\n]|\\.)*)\1/g)].map(m => m[2].toLowerCase()).filter(s => s.length >= 2);
  const parts = literals.filter(s => words.some(w => w.includes(s)));
  assert.deepEqual(parts, [], 'no string in the file is a piece of a word');
});
