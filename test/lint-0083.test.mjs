import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// ---------- 0083: speck lint warns when a ticket contains your home folder's path ----------

const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'speck.mjs');
const body = `## Problem\nUsers cannot export.\n## Outcome\nUsers can export CSV.\n## Acceptance criteria\n1. Export button downloads a CSV.\n## Out of scope\n- PDF export\n## Notes\n`;

// A fresh repo with one lint-clean ticket. Every command runs with HOME set to `home` (a fake home folder by default,
// or unset when null, so Node falls back to the system's record of the user's home folder).
function repo() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-lint-')));
  const fakeHome = path.join(dir, 'ann');
  const run = (args, home = fakeHome) => {
    const env = { ...process.env, HOME: home, USERPROFILE: home };
    if (home === null) { delete env.HOME; delete env.USERPROFILE; }
    return spawnSync(process.execPath, [CLI, ...args], { cwd: dir, encoding: 'utf8', env });
  };
  spawnSync('git', ['init', '-q'], { cwd: dir });
  assert.equal(run(['init', '--skip-checks']).status, 0);
  const file = path.join(dir, run(['new', 'Placeholder']).stdout.trim());
  const head = fs.readFileSync(file, 'utf8').split('## Problem')[0];
  const notes = text => fs.writeFileSync(file, head + body + text + '\n');
  const lineOf = needle => fs.readFileSync(file, 'utf8').split('\n').findIndex(l => l.includes(needle)) + 1;
  return { dir, fakeHome, run, notes, lineOf };
}
const homeWarnings = out => out.split('\n').filter(l => l.startsWith('! ') && /home folder/.test(l));

test('0083 AC1: a home folder path followed by / gets a ! warning with its line number and a ~/ suggestion', () => {
  const r = repo();
  r.notes(`- Logs are in ${r.fakeHome}/projects/app/log.txt.`);
  const out = r.run(['lint', '1']);
  const w = homeWarnings(out.stdout);
  assert.equal(w.length, 1, out.stdout);
  assert.match(w[0], new RegExp(`[Ll]ine ${r.lineOf('log.txt')}\\b`));
  assert.match(w[0], /~\//);
});

for (const [name, tail] of [['a space', ' is mine'], ['punctuation', '.'], ['a comma', ', then'], ['the end of the line', ''], ['a closing quote', '`']]) {
  test(`0083 AC1: the home folder path on its own, followed by ${name}, gets a warning`, () => {
    const r = repo();
    r.notes(`- Home is \`${r.fakeHome}${tail}`);
    const out = r.run(['lint', '1']);
    const w = homeWarnings(out.stdout);
    assert.equal(w.length, 1, out.stdout);
    assert.match(w[0], new RegExp(`[Ll]ine ${r.lineOf(r.fakeHome)}\\b`));
  });
}

test('0083 AC1: a home folder given with a trailing / still matches', () => {
  const r = repo();
  r.notes(`- See ${r.fakeHome}/notes.md`);
  const out = r.run(['lint', '1'], r.fakeHome + '/');
  assert.equal(homeWarnings(out.stdout).length, 1, out.stdout);
});

test('0083 AC1: each line with the path gets its own warning', () => {
  const r = repo();
  r.notes(`- One: ${r.fakeHome}/a\n- Two: ${r.fakeHome}/b`);
  const out = r.run(['lint', '1']);
  const w = homeWarnings(out.stdout);
  assert.equal(w.length, 2, out.stdout);
  assert.match(w[0], new RegExp(`[Ll]ine ${r.lineOf('One:')}\\b`));
  assert.match(w[1], new RegExp(`[Ll]ine ${r.lineOf('Two:')}\\b`));
});

test('0083 AC2: a ticket without the path gets no such warning', () => {
  const r = repo();
  r.notes('- Logs are in ~/projects/app/log.txt and /tmp/x.');
  const out = r.run(['lint', '1']);
  assert.equal(out.status, 0, out.stdout + out.stderr);
  assert.deepEqual(homeWarnings(out.stdout), [], out.stdout);
});

for (const other of ['2', '-old', '_x', '.bak']) {
  test(`0083 AC2: a path that only starts like the home folder (${other}) gets no warning`, () => {
    const r = repo();
    r.notes(`- Someone else: ${r.fakeHome}${other}/file.txt and ${r.fakeHome}${other}`);
    const out = r.run(['lint', '1']);
    assert.deepEqual(homeWarnings(out.stdout), [], out.stdout);
  });
}

test('0083 AC2: the home folder inside a longer path (/mnt/home/ann) gets no warning', () => {
  const r = repo();
  r.notes(`- Backup at /mnt${r.fakeHome}/file.txt`);
  const out = r.run(['lint', '1']);
  assert.deepEqual(homeWarnings(out.stdout), [], out.stdout);
});

test('0083 AC3: the warning does not make lint fail or stop speck set status ready', () => {
  const r = repo();
  r.notes(`- Logs are in ${r.fakeHome}/log.txt`);
  const out = r.run(['lint', '1']);
  assert.equal(out.status, 0, out.stdout + out.stderr);
  assert.equal(homeWarnings(out.stdout).length, 1, out.stdout);
  assert.match(out.stdout, /✓ /);
  const set = r.run(['set', '1', 'status', 'ready']);
  assert.equal(set.status, 0, set.stdout + set.stderr);
});

for (const [name, home] of [['/', '/'], ['empty', ''], ['unset', null], ['relative', 'ann']]) {
  test(`0083 AC4: a home folder that is ${name} checks nothing and prints no error`, () => {
    const r = repo();
    r.notes(`- Paths: / and /etc/x and ann/x and ${r.fakeHome}/x`);
    const out = r.run(['lint', '1'], home);
    assert.equal(out.status, 0, out.stdout + out.stderr);
    assert.equal(out.stderr, '');
    assert.deepEqual(homeWarnings(out.stdout), [], out.stdout);
  });
}

test('0083 AC1, AC2: a home folder with regex characters in it is matched literally', () => {
  const r = repo();
  const home = path.join(r.dir, 'a.b+c');
  r.notes(`- Mine: ${home}/x\n- Not mine: ${path.join(r.dir, 'aXbbc')}/x`);
  const out = r.run(['lint', '1'], home);
  const w = homeWarnings(out.stdout);
  assert.equal(w.length, 1, out.stdout);
  assert.match(w[0], new RegExp(`[Ll]ine ${r.lineOf('Mine:')}\\b`));
});
