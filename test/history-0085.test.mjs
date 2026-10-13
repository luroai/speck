import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { ROOT, env } from './support/panel.mjs';

// ---------- 0085: every test keeps running after the history rewrite ----------

// Runs one test file on its own, keeping only the tests whose names match `pattern`, and returns its TAP output.
// Without NODE_TEST_CONTEXT, the child reports to its own stdout rather than to this test run.
const runOnly = (file, pattern, extraEnv = {}) => {
  const { NODE_TEST_CONTEXT, ...rest } = env;
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', `--test-name-pattern=${pattern}`, file], {
    cwd: ROOT, encoding: 'utf8', env: { ...rest, ...extraEnv },
  });
  return r.stdout;
};
const line = (out, name) => out.split('\n').find(l => /^\s*(not )?ok \d+ - /.test(l) && l.includes(name)) ?? '';

const home = (list) => {
  const h = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0085-home-'));
  if (list !== undefined) {
    fs.mkdirSync(path.join(h, '.config', 'speck'), { recursive: true });
    fs.writeFileSync(path.join(h, '.config', 'speck', 'private-words'), list);
  }
  return h;
};

test('AC1: the panel before 0081 is found from the commit whose message is speck(0081): ready', async () => {
  const { commitBySubject } = await import('./support/commits.mjs');
  const c = commitBySubject('speck(0081): ready');
  assert.ok(c, 'found the commit');
  const subject = spawnSync('git', ['log', '-1', '--format=%s', c], { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
  assert.equal(subject, 'speck(0081): ready');
  assert.equal(spawnSync('git', ['cat-file', '-e', `${c}:templates/panel.html`], { cwd: ROOT }).status, 0, 'the commit has the panel');
  assert.equal(commitBySubject(`speck(0081): ready ${crypto.randomUUID()}`), null, 'no commit has that message');
  assert.equal(commitBySubject('speck(0081): rea'), null, 'only the whole message matches');
});

test('AC2: 0084\'s AC4 is skipped when the owner\'s list is missing or empty', () => {
  for (const list of [undefined, '', '# only a comment\n\n']) {
    const h = home(list);
    const l = line(runOnly('test/private-words-0084.test.mjs', '^AC4', { HOME: h, USERPROFILE: h }), 'AC4');
    assert.match(l, /^\s*ok \d+ - AC4.*# SKIP/, `list ${JSON.stringify(list)}: ${l}`);
  }
});

test('AC2: 0084\'s AC4 checks the words in the owner\'s list', () => {
  const h = home('qxjzvwqxjzvw\n'); // letters no string in 0082's file is made of
  const pass = line(runOnly('test/private-words-0084.test.mjs', '^AC4', { HOME: h, USERPROFILE: h }), 'AC4');
  assert.match(pass, /^\s*ok \d+ - AC4/);
  assert.doesNotMatch(pass, /# SKIP/);
  // A word that 0082's test file does hold makes it fail.
  const h2 = home('readPrivateWords\n');
  const fail = line(runOnly('test/private-words-0084.test.mjs', '^AC4', { HOME: h2, USERPROFILE: h2 }), 'AC4');
  assert.match(fail, /^\s*not ok \d+ - AC4/);
});

test('AC2: 0084\'s test file no longer reads 0082\'s ticket', () => {
  const src = fs.readFileSync(path.join(ROOT, 'test/private-words-0084.test.mjs'), 'utf8');
  assert.doesNotMatch(src, /join\(ROOT, 'speck\/tickets/, 'it reads no ticket in this repo');
});

test('AC3: no test or file under scripts/, skills/ or templates/ refers to a commit by its id', () => {
  const files = spawnSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', 'test', 'scripts', 'skills', 'templates'],
    { cwd: ROOT, encoding: 'utf8' }).stdout.split('\0').filter(Boolean);
  const found = [];
  for (const f of files) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue;
    for (const m of fs.readFileSync(p, 'utf8').matchAll(/\b[0-9a-f]{7,40}\b/g)) found.push([f, m[0]]);
  }
  // Ask git which of those hex strings name a commit in this repo.
  const r = spawnSync('git', ['cat-file', '--batch-check=%(objecttype)'], {
    cwd: ROOT, encoding: 'utf8', input: found.map(([, h]) => `${h}\n`).join(''),
  });
  const types = r.stdout.split('\n');
  const commits = found.filter((_, i) => types[i] === 'commit').map(([f, h]) => `${f}: ${h}`);
  assert.deepEqual(commits, []);
});
