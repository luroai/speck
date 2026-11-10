import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, env } from './support/panel.mjs';
import { filesNaming } from './support/private-words.mjs';

// ---------- 0628: 0082's owner-name check skips the price list copied from LiteLLM ----------

const repoWith = (files) => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0628-repo-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: repo });
  for (const [f, body] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(repo, f)), { recursive: true });
    fs.writeFileSync(path.join(repo, f), body);
  }
  spawnSync('git', ['add', '-A'], { cwd: repo });
  return repo;
};

const homeWith = (words) => {
  const h = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0628-home-'));
  fs.mkdirSync(path.join(h, '.config', 'speck'), { recursive: true });
  fs.writeFileSync(path.join(h, '.config', 'speck', 'private-words'), words.join('\n') + '\n');
  return h;
};

test('0628 AC1: filesNaming leaves out scripts/prices.json', () => {
  const repo = repoWith({ 'scripts/prices.json': '{"models":{"vendor/zorblat-pro":[1,2,null,3]}}\n', 'README.md': 'hello\n' });
  assert.deepEqual(filesNaming(['zorblat'], repo), []);
});

test('0628 AC2: a private word in any other tracked file outside speck/ is still found', () => {
  const repo = repoWith({
    'scripts/prices.json': '{"models":{"vendor/zorblat-pro":[1,2,null,3]}}\n',
    'scripts/other.mjs': '// Zorblat wrote this\n',
    'prices.json': 'zorblat\n',
    'docs/scripts/prices.json': 'zorblat\n',
    'scripts/prices.json.bak': 'zorblat\n',
    'speck/tickets/0001-x.md': 'zorblat\n',
  });
  assert.deepEqual(filesNaming(['zorblat'], repo).sort(),
    ['docs/scripts/prices.json', 'prices.json', 'scripts/other.mjs', 'scripts/prices.json.bak']);
});

test('0628 AC2: 0082 AC2 passes when a private word matches a model name only the price list holds', () => {
  // Pick a word from the real price list that no other tracked file outside speck/ holds, so it stands in for a
  // private word that matches a model's name.
  const { models } = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'prices.json'), 'utf8'));
  const only = w => {
    const r = spawnSync('git', ['grep', '-l', '-i', '-F', '-e', w, '--', '.', ':!speck/'], { cwd: ROOT, encoding: 'utf8' });
    return r.stdout.trim() === 'scripts/prices.json';
  };
  const word = Object.keys(models).flatMap(m => m.split(/[^a-z]+/i)).find(w => w.length >= 6 && only(w));
  assert.ok(word, 'a word only the price list holds');
  const childEnv = { ...env, HOME: homeWith([word]) };
  delete childEnv.NODE_TEST_CONTEXT; // so the child prints its own results rather than handing them to this run
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', '--test-name-pattern=AC2', path.join(ROOT, 'test', 'luro-0082.test.mjs')],
    { cwd: ROOT, encoding: 'utf8', env: childEnv });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /# pass 1\b/);
  assert.match(r.stdout, /# skipped 0\b/);
});
