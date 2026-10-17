import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// ---------- 0121: speck lint refuses a ticket that contains one of your private words ----------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(ROOT, 'scripts', 'speck.mjs');
const body = `## Problem\nUsers cannot export.\n## Outcome\nUsers can export CSV.\n## Acceptance criteria\n1. Export button downloads a CSV.\n## Out of scope\n- PDF export\n## Notes\n`;

// A fresh repo with one lint-clean ticket, and a fake home folder whose private-words file holds `words` (no file
// when null). Every command runs with HOME set to that folder.
function repo(words = null) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0121-')));
  const home = path.join(dir, 'home');
  fs.mkdirSync(home);
  const wordsFile = path.join(home, '.config', 'speck', 'private-words');
  if (words !== null) {
    fs.mkdirSync(path.dirname(wordsFile), { recursive: true });
    fs.writeFileSync(wordsFile, words);
  }
  const env = { ...process.env, HOME: home, USERPROFILE: home, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
  const run = args => spawnSync(process.execPath, [CLI, ...args], { cwd: dir, encoding: 'utf8', env });
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  assert.equal(run(['init', '--skip-checks']).status, 0);
  const file = path.join(dir, run(['new', 'Placeholder']).stdout.trim());
  const head = fs.readFileSync(file, 'utf8').split('## Problem')[0];
  const notes = text => fs.writeFileSync(file, head + body + text + '\n');
  const lineOf = needle => fs.readFileSync(file, 'utf8').split('\n').findIndex(l => l.includes(needle)) + 1;
  spawnSync('git', ['add', '-A'], { cwd: dir });
  spawnSync('git', ['commit', '-qm', 'init'], { cwd: dir, env });
  return { dir, file, wordsFile, run, notes, lineOf };
}
const wordErrors = out => out.split('\n').filter(l => l.startsWith('✗ ') && /private word/.test(l));
const wordMentions = out => out.split('\n').filter(l => /private.words?/i.test(l));

test('0121 AC1: words come from ~/.config/speck/private-words, one per line, skipping blank lines and # lines', () => {
  const r = repo('# my old names\n\n  zorblax  \nquuxly\n');
  r.notes('- Written by quuxly.');
  const out = r.run(['lint', '1']);
  const e = wordErrors(out.stdout);
  assert.equal(e.length, 1, out.stdout);
  assert.match(e[0], new RegExp(`[Ll]ine ${r.lineOf('quuxly')}\\b`));
  assert.notEqual(out.status, 0);
});

test('0121 AC1: a word with spaces around it in the file still matches', () => {
  const r = repo('  zorblax  \n');
  r.notes('- Ask zorblax.');
  assert.equal(wordErrors(r.run(['lint', '1']).stdout).length, 1);
});

test('0121 AC1: a # line and a blank line are not words', () => {
  const r = repo('# my old names\n\n   \nzorblax\n');
  r.notes('- See my old names.');
  const out = r.run(['lint', '1']);
  assert.deepEqual(wordErrors(out.stdout), [], out.stdout);
  assert.equal(out.status, 0, out.stdout);
});

test('0121 AC1: Windows line endings in the file still match', () => {
  const r = repo('zorblax\r\nquuxly\r\n');
  r.notes('- Ask zorblax.');
  assert.equal(wordErrors(r.run(['lint', '1']).stdout).length, 1);
});

test('0121 AC2: a word in any case gets a ✗ naming the line but not the word, and lint exits non-zero', () => {
  const r = repo('Zorblax\n');
  r.notes('- Ask zORBLAX about it.');
  const out = r.run(['lint', '1']);
  const e = wordErrors(out.stdout);
  assert.equal(e.length, 1, out.stdout);
  assert.match(e[0], new RegExp(`[Ll]ine ${r.lineOf('zORBLAX')}\\b`));
  assert.doesNotMatch(out.stdout + out.stderr, /zorblax/i);
  assert.notEqual(out.status, 0);
});

test('0121 AC2: each line holding a word gets its own ✗, once however many words it holds', () => {
  const r = repo('zorblax\nquuxly\n');
  r.notes('- zorblax and quuxly.\n- Then zorblax again.');
  const e = wordErrors(r.run(['lint', '1']).stdout);
  assert.equal(e.length, 2, e.join('\n'));
  assert.match(e[0], new RegExp(`[Ll]ine ${r.lineOf('quuxly')}\\b`));
  assert.match(e[1], new RegExp(`[Ll]ine ${r.lineOf('Then zorblax')}\\b`));
});

test('0121 AC2: a word inside a longer word still counts', () => {
  const r = repo('zorblax\n');
  r.notes('- The zorblaxes.');
  assert.equal(wordErrors(r.run(['lint', '1']).stdout).length, 1);
});

test('0121 AC2: words are matched literally, not as patterns', () => {
  const r = repo('z.rb(ax\na*\n');
  r.notes('- zorb(ax and aaa.');
  const out = r.run(['lint', '1']);
  assert.deepEqual(wordErrors(out.stdout), [], out.stdout);
  r.notes('- The z.rb(ax.');
  assert.equal(wordErrors(r.run(['lint', '1']).stdout).length, 1);
});

test('0121 AC2: a word in the frontmatter counts too', () => {
  const r = repo('zorblax\n');
  r.notes('');
  fs.writeFileSync(r.file, fs.readFileSync(r.file, 'utf8').replace(/^source: .*$/m, 'source: "zorblax.md"'));
  assert.equal(wordErrors(r.run(['lint', '1']).stdout).length, 1);
});

test('0121 AC2: speck set <id> status ready refuses the ticket and leaves it draft', () => {
  const r = repo('zorblax\n');
  r.notes('- Ask zorblax.');
  const out = r.run(['set', '1', 'status', 'ready']);
  assert.notEqual(out.status, 0, out.stdout);
  assert.match(fs.readFileSync(r.file, 'utf8'), /^status: draft\b/m);
  assert.doesNotMatch(out.stdout + out.stderr, /zorblax/i);
});

test('0121 AC3: a missing file checks nothing and prints nothing about it', () => {
  const r = repo(null);
  r.notes('- Ask zorblax.');
  const out = r.run(['lint', '1']);
  assert.equal(out.status, 0, out.stdout);
  assert.deepEqual(wordMentions(out.stdout + out.stderr), [], out.stdout);
  assert.match(out.stdout, /^✓ /m);
});

test('0121 AC3: a file that can\'t be read gets a ! warning saying so and how to fix it, and lint carries on', () => {
  const r = repo(null);
  fs.mkdirSync(r.wordsFile, { recursive: true }); // a folder where the file should be can't be read as one
  r.notes('- Ask zorblax.');
  const out = r.run(['lint', '1']);
  assert.equal(out.status, 0, out.stdout + out.stderr);
  const w = out.stdout.split('\n').filter(l => l.startsWith('! ') && /private-words/.test(l));
  assert.equal(w.length, 1, out.stdout);
  assert.match(w[0], /can't read/i);
  assert.match(w[0], /readable file|remove it/i);
  assert.match(out.stdout, /^✓ /m);
  assert.doesNotMatch(out.stderr, /\n\s+at /, 'no stack trace');
});

test('0121 AC3: an unreadable file still lets the rest of lint report its errors', () => {
  const r = repo(null);
  fs.mkdirSync(r.wordsFile, { recursive: true });
  fs.writeFileSync(r.file, fs.readFileSync(r.file, 'utf8').replace(/^size: \S+/m, 'size: L'));
  const out = r.run(['lint', '1']);
  assert.notEqual(out.status, 0);
  assert.match(out.stdout, /^✗ size L can never be ready/m);
  assert.equal(out.stdout.split('\n').filter(l => l.startsWith('! ') && /private-words/.test(l)).length, 1);
});

test('0121 AC4: a ticket with none of the words gets no such error', () => {
  const r = repo('zorblax\nquuxly\n');
  r.notes('- Nothing private here.');
  const out = r.run(['lint', '1']);
  assert.equal(out.status, 0, out.stdout);
  assert.deepEqual(wordMentions(out.stdout), [], out.stdout);
  assert.match(out.stdout, /^✓ /m);
});

test('0121 AC4: an empty file, or one with only comments, checks nothing', () => {
  for (const words of ['', '# none yet\n\n']) {
    const r = repo(words);
    r.notes('- Ask zorblax.');
    const out = r.run(['lint', '1']);
    assert.equal(out.status, 0, out.stdout);
    assert.deepEqual(wordMentions(out.stdout), [], out.stdout);
  }
});

test('0121 AC5: the README or the brief names the private words file', () => {
  const docs = ['README.md', 'docs/brief.md'].map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
  assert.ok(docs.includes('~/.config/speck/private-words'));
});
