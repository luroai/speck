import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../scripts/core.mjs';

// ---------- 0087: speck config set changes one setting safely ----------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(ROOT, 'scripts', 'speck.mjs');
const TEMPLATE = fs.readFileSync(path.join(ROOT, 'templates', 'config.yml'), 'utf8');

// A fresh folder with speck/config.yml holding the given text (the template by default), in a git repo.
function repo(text = TEMPLATE) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-config-')));
  spawnSync('git', ['init', '-q'], { cwd: dir });
  if (text !== null) { fs.mkdirSync(path.join(dir, 'speck')); fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), text); }
  const file = path.join(dir, 'speck', 'config.yml');
  return {
    dir, file,
    run: (...a) => spawnSync(process.execPath, [CLI, 'config', 'set', '--repo', ...a], { cwd: dir, encoding: 'utf8' }),
    read: () => fs.readFileSync(file, 'utf8'),
    cfg: () => loadConfig(dir),
  };
}

// The lines of `after` that differ from `before`, which must have the same number of lines.
function changed(before, after) {
  const a = before.split('\n'), b = after.split('\n');
  assert.equal(b.length, a.length, 'no line is added or removed');
  return b.map((l, i) => [a[i], l]).filter(([x, y]) => x !== y);
}

test('0087 AC1: a top-level setting changes on its own line, keeping its comment, and prints old → new', () => {
  const r = repo();
  const out = r.run('reviewer_effort', 'high');
  assert.equal(out.status, 0, out.stderr);
  assert.equal(out.stdout.trim(), 'reviewer_effort: "" → high');
  const diff = changed(TEMPLATE, r.read());
  assert.equal(diff.length, 1);
  assert.match(diff[0][1], /^reviewer_effort: high\s+# blank: the reviewer's own default\. Otherwise low \| medium/);
  assert.equal(diff[0][1].indexOf('#'), diff[0][0].indexOf('#'), 'the comment stays in its column');
  assert.equal(r.cfg().reviewer_effort, 'high');
});

test('0087 AC1: nested settings named with dots change in their section only', () => {
  const r = repo();
  let out = r.run('limits.max_review_rounds', '5');
  assert.equal(out.status, 0, out.stderr);
  assert.equal(out.stdout.trim(), 'limits.max_review_rounds: 3 → 5');
  out = r.run('commands.test', 'npm test');
  assert.equal(out.stdout.trim(), 'commands.test: "" → npm test');
  const diff = changed(TEMPLATE, r.read());
  assert.deepEqual(diff.map(d => d[1].replace(/\s+#.*$/, '')), ['  test: npm test', '  max_review_rounds: 5']);
  assert.match(diff[0][1], /# e\.g\. npm test, pytest$/);
  const cfg = r.cfg();
  assert.equal(cfg.limits.max_review_rounds, 5);
  assert.equal(cfg.commands.test, 'npm test');
  assert.equal(cfg.max_review_rounds, undefined, 'no top-level key is made');
});

test('0087 AC1: true/false, list and string settings print and read back', () => {
  const r = repo();
  assert.equal(r.run('auto_ship', 'true').stdout.trim(), 'auto_ship: false → true');
  assert.equal(r.run('auto_ship_risk', 'low,high').stdout.trim(), 'auto_ship_risk: [low] → [low, high]');
  assert.equal(r.run('base_branch', 'trunk').stdout.trim(), 'base_branch: main → trunk');
  assert.equal(r.run('github.status_check', 'ci/speck').status, 0);
  const cfg = r.cfg();
  assert.equal(cfg.auto_ship, true);
  assert.deepEqual(cfg.auto_ship_risk, ['low', 'high']);
  assert.equal(cfg.base_branch, 'trunk');
  assert.equal(cfg.github.status_check, 'ci/speck');
  assert.equal(changed(TEMPLATE, r.read()).length, 4);
});

const TRICKY = [
  'claude -p "/speck-build {id}" --session-id {session} --dangerously-skip-permissions',
  'npm test # with a comment',
  'a: b',
  'it\'s "both" # kinds',
  '\'quoted\'',
  '"double"',
  ' padded ',
  'back\\slash "q"',
  'true',
  '42',
  '[low]',
  '{}',
  '',
  '#start',
  'two\nlines',
];

for (const v of TRICKY) {
  test(`0087 AC2: ${JSON.stringify(v)} reads back exactly`, () => {
    const r = repo();
    for (const key of ['build_command', 'commands.test', 'reviewer_model']) {
      const out = r.run(key, v);
      assert.equal(out.status, 0, out.stderr);
    }
    const cfg = r.cfg();
    assert.equal(cfg.build_command, v);
    assert.equal(cfg.commands.test, v);
    assert.equal(cfg.reviewer_model, v);
    assert.equal(changed(TEMPLATE, r.read()).length, 3, 'only those three lines change');
    assert.match(r.read(), /^ {2}test: .*# e\.g\. npm test, pytest$/m, 'the comment is still a comment');
  });
}

const REFUSED = [
  ['nope', 'x', /unknown setting "nope"/i],
  ['__proto__', 'x', /unknown setting "__proto__"/i],
  ['constructor', 'x', /unknown setting "constructor"/i],
  ['limits.toString', '1', /unknown setting/i],
  ['reviewer_options.codex.sandbox', 'none', /unknown setting/i],
  ['limits', '1', /unknown setting/i],
  ['reviewer_effort', 'huge', /reviewer_effort must be blank or one of low, medium, high, xhigh, max/],
  ['reviewer_effort', 'HIGH', /reviewer_effort must be/],
  ['auto_ship', 'yes', /auto_ship must be true or false/],
  ['worktrees', '1', /worktrees must be true or false/],
  ['allow_same_model_review', '', /allow_same_model_review must be true or false/],
  ['limits.max_review_rounds', '0', /limits\.max_review_rounds must be a whole number of 1 or more/],
  ['limits.max_changed_lines', '-5', /whole number of 1 or more/],
  ['limits.max_acceptance_criteria', '2.5', /whole number of 1 or more/],
  ['limits.escalate_after_repeat_disputes', 'two', /whole number of 1 or more/],
  ['max_parallel_builds', '', /max_parallel_builds must be a whole number of 1 or more/],
  ['max_parallel_builds', '99999999999999999999', /whole number of 1 or more/],
  ['auto_ship_risk', 'medium', /auto_ship_risk must be low, high or both/],
  ['auto_ship_risk', 'low,', /auto_ship_risk must be/],
  ['auto_ship_risk', '', /auto_ship_risk must be/],
];

for (const [key, value, message] of REFUSED) {
  test(`0087 AC3: ${key} ${JSON.stringify(value)} is refused and the file is unchanged`, () => {
    const r = repo();
    const out = r.run(key, value);
    assert.equal(out.status, 1);
    assert.match(out.stderr, message);
    assert.doesNotMatch(out.stderr, /\n\s+at /, 'no stack trace');
    assert.equal(r.read(), TEMPLATE);
  });
}

test('0087 AC3: every accepted form of auto_ship_risk and effort is taken', () => {
  const r = repo();
  for (const [v, want] of [['high', ['high']], ['[low, high]', ['low', 'high']], ['high low', ['high', 'low']], ['low,low', ['low']]]) {
    assert.equal(r.run('auto_ship_risk', v).status, 0, v);
    assert.deepEqual(r.cfg().auto_ship_risk, want, v);
  }
  for (const v of ['', 'low', 'medium', 'high', 'xhigh', 'max']) {
    assert.equal(r.run('reviewer_effort', v).status, 0, v);
    assert.equal(r.cfg().reviewer_effort, v);
  }
  assert.equal(r.run('limits.max_ticket_body_lines', '60').status, 0);
  assert.equal(r.cfg().limits.max_ticket_body_lines, 60);
});

test('0087 AC3: the usage is shown when the key or value is missing', () => {
  const r = repo();
  for (const args of [[], ['auto_ship']]) {
    const out = r.run(...args);
    assert.equal(out.status, 1);
    assert.match(out.stderr, /Usage: speck config set <key> <value>/);
  }
  const other = spawnSync(process.execPath, [CLI, 'config', 'get', 'auto_ship'], { cwd: r.dir, encoding: 'utf8' });
  assert.equal(other.status, 1);
  assert.match(other.stderr, /Usage: speck config set <key> <value>/);
  assert.equal(r.read(), TEMPLATE);
});

const OLD = `# an older config
base_branch: main
reviewer: codex

limits:
  max_acceptance_criteria: 5   # a comment
  max_changed_lines: 300

# github settings
github:
  status_check: speck/review
`;

test('0087 AC4: a known key missing from an older config is added under its section', () => {
  const r = repo(OLD);
  let out = r.run('limits.max_review_rounds', '4');
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /^limits\.max_review_rounds: \(not set\) → 4$/m);
  assert.equal(r.read(), OLD.replace('max_changed_lines: 300\n', 'max_changed_lines: 300\n  max_review_rounds: 4\n'));
  assert.equal(r.cfg().limits.max_review_rounds, 4);
  assert.equal(r.cfg().limits.max_acceptance_criteria, 5);
});

test('0087 AC4: a missing top-level key or a missing section is added and the file still loads', () => {
  const r = repo(OLD);
  assert.equal(r.run('auto_ship', 'true').status, 0);
  assert.equal(r.run('commands.test', 'npm test').status, 0);
  assert.equal(r.run('worktree_setup', 'npm ci # setup').status, 0);
  const text = r.read();
  assert.ok(text.startsWith(OLD), 'the old lines stay as they were');
  const cfg = r.cfg();
  assert.equal(cfg.auto_ship, true);
  assert.equal(cfg.commands.test, 'npm test');
  assert.equal(cfg.worktree_setup, 'npm ci # setup');
  assert.equal(cfg.github.status_check, 'speck/review');
  assert.equal(cfg.limits.max_changed_lines, 300);
});

test('0087 AC4: a section written as {} gets the key under it', () => {
  const r = repo('base_branch: main\ncommands: {}   # none yet\nreviewer: codex\n');
  assert.equal(r.run('commands.test', 'npm test').status, 0);
  assert.equal(r.read(), 'base_branch: main\ncommands:      # none yet\n  test: npm test\nreviewer: codex\n');
  assert.equal(r.cfg().commands.test, 'npm test');
  assert.equal(r.cfg().reviewer, 'codex');
});

test('0087 AC4: a file without a final newline gets the key on a line of its own', () => {
  const r = repo('base_branch: main');
  assert.equal(r.run('auto_ship', 'true').status, 0);
  assert.equal(r.read(), 'base_branch: main\nauto_ship: true\n');
});

test('0087 AC1: the setting speck reads is the one changed when a key appears twice', () => {
  const r = repo('auto_ship: true\nauto_ship: false\n');
  assert.equal(r.run('auto_ship', 'true').stdout.trim(), 'auto_ship: false → true');
  assert.equal(r.read(), 'auto_ship: true\nauto_ship: true\n');
});

test('0087 AC1: Windows line endings are kept', () => {
  const r = repo('base_branch: main\r\nlimits:\r\n  max_review_rounds: 3\r\n');
  assert.equal(r.run('limits.max_review_rounds', '4').status, 0);
  assert.equal(r.read(), 'base_branch: main\r\nlimits:\r\n  max_review_rounds: 4\r\n');
});

test('0087 AC5: it does not commit', () => {
  const r = repo();
  spawnSync('git', ['add', 'speck/config.yml'], { cwd: r.dir });
  spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'init'], { cwd: r.dir });
  assert.equal(r.run('auto_ship', 'true').status, 0);
  const log = spawnSync('git', ['log', '--oneline'], { cwd: r.dir, encoding: 'utf8' }).stdout.trim().split('\n');
  assert.equal(log.length, 1);
  const status = spawnSync('git', ['status', '--porcelain'], { cwd: r.dir, encoding: 'utf8' }).stdout;
  assert.equal(status.trim(), 'M speck/config.yml');
});

test('0087 AC5: without speck/config.yml it says to run speck init and changes nothing', () => {
  const r = repo(null);
  const out = r.run('auto_ship', 'true');
  assert.equal(out.status, 1);
  assert.match(out.stderr, /speck init/);
  assert.equal(fs.existsSync(path.join(r.dir, 'speck')), false);
});

test('0087: speck help lists config set', () => {
  const out = spawnSync(process.execPath, [CLI, 'help'], { encoding: 'utf8' });
  assert.match(out.stdout, /speck config set <key> <value>/);
});

test('0087 AC4: a key only in an earlier copy of a section is added to the copy speck reads (review F1)', () => {
  const r = repo('commands:\n  test: old\ncommands:\n  other: keep\n');
  const out = r.run('commands.test', 'npm test');
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /^commands\.test: \(not set\) → npm test$/m);
  assert.equal(r.read(), 'commands:\n  test: old\ncommands:\n  other: keep\n  test: npm test\n');
  assert.equal(r.cfg().commands.test, 'npm test');
});
