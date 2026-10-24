import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { speck } from './support/cli.mjs';
import { loadConfig } from '../scripts/core.mjs';
import { MACHINE_SETTINGS, machineConfig, machineConfigFile } from '../scripts/machine.mjs';
import { ownBuildCommand } from '../scripts/builder-switch.mjs';
import { DEFAULT_BUILD_COMMAND } from '../scripts/build-model.mjs';

// ---------- 0386: your own settings are kept for this machine, out of git ----------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OWN = ['builder', 'builder_model', 'build_command', 'resume_command', 'reviewer', 'reviewer_model', 'reviewer_effort',
  'allow_same_model_review', 'auto_ship', 'auto_ship_risk', 'watch_agent', 'watch_model', 'watch_effort', 'watch',
  'max_parallel_builds', 'max_parallel_tests', 'builder_effort']; // 0402: and the builder's effort
const CONFIG = `base_branch: main
builder: claude
build_command: '${DEFAULT_BUILD_COMMAND}'
reviewer: codex
reviewer_effort: high   # the project's default
auto_ship: false
auto_ship_risk: [low]
watch: tell
max_parallel_builds: 1
ship_mode: local
commands:
  test: npm test
limits:
  max_review_rounds: 3
`;
const git = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8' });

// A git repo with CONFIG committed as speck/config.yml, and a worktree of it.
function repo() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-own-')));
  git(dir, 'init', '-q', '-b', 'main');
  fs.mkdirSync(path.join(dir, 'speck'));
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), CONFIG);
  fs.writeFileSync(path.join(dir, '.gitignore'), 'speck/.cache/\n');
  git(dir, 'add', '.');
  git(dir, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'init');
  const wt = path.join(dir + '.worktrees', 'side');
  git(dir, 'worktree', 'add', '-q', '-b', 'side', wt);
  return {
    dir, wt,
    set: (cwd, ...a) => speck(cwd, process.env, 'config', 'set', ...a),
    show: (...a) => speck(dir, process.env, 'config', 'show', ...a),
    file: () => fs.readFileSync(path.join(dir, 'speck', 'config.yml'), 'utf8'),
    head: () => git(dir, 'rev-parse', 'HEAD').stdout.trim(),
    status: () => git(dir, 'status', '--porcelain').stdout,
  };
}

const VALUES = {
  builder: 'cursor', builder_model: 'gpt-5', build_command: 'my-agent "/speck-build {id}" --id {session}', resume_command: "my-agent --resume '{session}'",
  reviewer: 'claude', reviewer_model: 'opus', reviewer_effort: 'max', allow_same_model_review: 'true', auto_ship: 'true', auto_ship_risk: 'low,high',
  watch_agent: 'codex', watch_model: 'gpt-5.5', watch_effort: 'low', watch: 'fix', max_parallel_builds: '3', max_parallel_tests: '4',
  builder_effort: 'high', // 0402
};

test('0386 AC1: your own settings are the sixteen the ticket lists, and 0402\'s builder_effort', () => {
  assert.deepEqual([...MACHINE_SETTINGS].sort(), [...OWN].sort());
});

test('0386 AC1: speck config set saves each of your own settings for this machine, leaving speck/config.yml alone and committing nothing', () => {
  const r = repo(), head = r.head();
  for (const key of OWN) {
    const out = r.set(r.dir, key, VALUES[key]);
    assert.equal(out.status, 0, `${key}: ${out.stderr}`);
    assert.match(out.stdout, new RegExp(`^${key} \\(this machine\\): `), key);
  }
  assert.equal(r.file(), CONFIG, 'speck/config.yml is unchanged');
  assert.equal(r.status(), '', 'nothing to commit');
  assert.equal(r.head(), head, 'nothing committed');
  assert.deepEqual(Object.keys(machineConfig(r.dir)).sort(), [...OWN].sort());
});

test('0386 AC1: switching the builder saves the new build_command for this machine too', () => {
  const r = repo(), head = r.head();
  const out = r.set(r.dir, 'builder', 'codex');
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /^builder \(this machine\): claude → codex$/m);
  assert.match(out.stdout, /^build_command \(this machine\): /m);
  assert.deepEqual(machineConfig(r.dir), { builder: 'codex', build_command: ownBuildCommand('codex') });
  assert.equal(r.file(), CONFIG);
  assert.equal(r.head(), head);
  // A build_command set by hand for this machine is replaced only with --replace, as in speck/config.yml (0293).
  assert.equal(r.set(r.dir, 'build_command', 'mine {id}').status, 0);
  const refused = r.set(r.dir, 'builder', 'claude');
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /--replace/);
  assert.equal(machineConfig(r.dir).builder, 'codex', 'nothing saved when refused');
  assert.equal(r.set(r.dir, 'builder', 'claude', '--replace').status, 0);
  assert.deepEqual(machineConfig(r.dir), { builder: 'claude', build_command: DEFAULT_BUILD_COMMAND });
});

test('0386 AC3: removing this machine\'s builder removes the build_command switching to it saved, but not one set by hand', () => {
  const r = repo();
  assert.equal(r.set(r.dir, 'builder', 'codex').status, 0);
  assert.equal(r.set(r.dir, '--machine', 'builder', '').status, 0);
  assert.ok(!fs.existsSync(machineConfigFile(r.dir)), 'speck/config.yml\'s builder and build_command apply again');
  assert.equal(r.set(r.dir, 'builder', 'codex').status, 0);
  assert.equal(r.set(r.dir, 'build_command', 'mine {id}').status, 0);
  assert.equal(r.set(r.dir, '--machine', 'builder', '').status, 0);
  assert.deepEqual(machineConfig(r.dir), { build_command: 'mine {id}' });
});

test('0386 AC2: every speck command, in the main checkout and a worktree, uses this machine\'s value, from the next time it reads its settings', () => {
  const r = repo();
  assert.equal(loadConfig(r.wt).reviewer, 'codex', 'before: speck/config.yml\'s');
  assert.equal(r.set(r.wt, 'reviewer', 'claude').status, 0);
  assert.equal(r.set(r.dir, 'auto_ship', 'true').status, 0);
  for (const at of [r.dir, r.wt]) {
    const cfg = loadConfig(at);
    assert.equal(cfg.reviewer, 'claude', at);
    assert.equal(cfg.auto_ship, true, at);
    assert.equal(cfg.reviewer_effort, 'high', 'no value for this machine: speck/config.yml\'s');
    assert.equal(cfg.builder, 'claude');
  }
  // A worktree's own speck/config.yml (as a running build has) is still overridden.
  fs.writeFileSync(path.join(r.wt, 'speck', 'config.yml'), CONFIG.replace('reviewer: codex', 'reviewer: cursor'));
  assert.equal(loadConfig(r.wt).reviewer, 'claude');
  assert.equal(r.set(r.dir, 'reviewer', 'codex').status, 0);
  assert.equal(loadConfig(r.wt).reviewer, 'codex', 'a change is read the next time');
});

test('0386 AC3: each value is refused with the same message speck config set --repo gives', () => {
  const r = repo();
  const bad = [['auto_ship', 'yes'], ['allow_same_model_review', 'maybe'], ['auto_ship_risk', 'medium'], ['reviewer_effort', 'huge'],
    ['watch_agent', 'gemini'], ['watch', 'always'], ['watch_effort', 'huge'], ['max_parallel_builds', '0'], ['max_parallel_tests', 'two']];
  for (const [key, value] of bad) {
    const own = r.set(r.dir, key, value), shared = r.set(r.dir, '--repo', key, value);
    assert.notEqual(own.status, 0, key);
    assert.equal(own.stderr, shared.stderr, key);
    assert.doesNotMatch(own.stderr, /at .*\.mjs:\d+/, 'no stack trace');
  }
  assert.ok(!fs.existsSync(machineConfigFile(r.dir)), 'nothing saved');
  assert.equal(r.file(), CONFIG);
});

test('0386 AC3: each value reads back exactly as given, including spaces, quotes and lists', () => {
  const r = repo();
  const cases = [
    ['reviewer_model', 'a model "with" quotes and \'both\' # kinds', 'a model "with" quotes and \'both\' # kinds'],
    ['build_command', 'claude -p "/speck-build {id}" --session-id {session}', 'claude -p "/speck-build {id}" --session-id {session}'],
    ['resume_command', ' padded ', ' padded '], ['builder_model', '42', '42'], ['watch_model', 'true', 'true'],
    ['auto_ship_risk', '[low, high]', ['low', 'high']], ['auto_ship_risk', 'high', ['high']], ['auto_ship', 'false', false],
    ['max_parallel_tests', '7', 7], ['reviewer_effort', '', ''],
  ];
  for (const [key, given, read] of cases) {
    const out = r.set(r.dir, key, given);
    assert.equal(out.status, 0, `${key}: ${out.stderr}`);
    assert.deepEqual(machineConfig(r.dir)[key], read, key);
    assert.deepEqual(loadConfig(r.wt)[key], read, key);
  }
  assert.equal(r.file(), CONFIG);
});

test('0386 AC3: --repo changes speck/config.yml\'s value; --machine still works, and --machine "" removes this machine\'s value', () => {
  const r = repo();
  let out = r.set(r.dir, '--repo', 'reviewer_effort', 'low');
  assert.equal(out.status, 0, out.stderr);
  assert.equal(out.stdout.trim(), 'reviewer_effort: high → low');
  assert.match(r.file(), /^reviewer_effort: low +# the project's default$/m);
  assert.ok(!fs.existsSync(machineConfigFile(r.dir)));
  out = r.set(r.dir, '--machine', 'reviewer_effort', 'max');
  assert.equal(out.stdout.trim(), 'reviewer_effort (this machine): low → max');
  assert.equal(loadConfig(r.dir).reviewer_effort, 'max');
  out = r.set(r.dir, '--repo', 'reviewer_effort', 'medium');
  assert.match(out.stdout, /This machine uses its own reviewer_effort, max, over it/);
  out = r.set(r.dir, '--machine', 'reviewer_effort', '');
  assert.equal(out.status, 0, out.stderr);
  assert.equal(out.stdout.trim(), 'reviewer_effort (this machine): max → medium, speck/config.yml\'s value');
  assert.equal(loadConfig(r.dir).reviewer_effort, 'medium');
  assert.ok(!fs.existsSync(machineConfigFile(r.dir)), 'no values left: no file');
  assert.notEqual(r.set(r.dir, '--repo', '--machine', 'reviewer', 'claude').status, 0, 'not both');
});

test('0386 AC4: every other setting is set in speck/config.yml as today, and --machine refuses it', () => {
  const r = repo();
  for (const [key, value, line] of [['base_branch', 'trunk', /^base_branch: trunk$/m], ['ship_mode', 'pr', /^ship_mode: pr$/m],
    ['commands.test', 'npm run test', /^  test: npm run test$/m], ['limits.max_review_rounds', '5', /^  max_review_rounds: 5$/m]]) {
    const out = r.set(r.dir, key, value);
    assert.equal(out.status, 0, `${key}: ${out.stderr}`);
    assert.match(r.file(), line, key);
    const refused = r.set(r.dir, '--machine', key, value);
    assert.notEqual(refused.status, 0, key);
    assert.match(refused.stderr, /--machine can set only builder, /);
  }
  assert.ok(!fs.existsSync(machineConfigFile(r.dir)));
});

test('0386 AC4: speck config show marks each value that comes from this machine', () => {
  const r = repo();
  assert.equal(r.set(r.dir, 'reviewer', 'claude').status, 0);
  assert.equal(r.set(r.dir, 'auto_ship', 'true').status, 0);
  const text = r.show();
  assert.equal(text.status, 0, text.stderr);
  assert.match(text.stdout, /^  reviewer: claude \(this machine's own, over speck\/config\.yml's codex; /m);
  assert.match(text.stdout, /^  auto_ship: true \(this machine's own, over speck\/config\.yml's false; /m);
  assert.doesNotMatch(text.stdout, /^  builder: .*this machine/m, 'speck/config.yml\'s values are not marked');
  const json = JSON.parse(r.show('--json').stdout);
  const all = Object.fromEntries(json.groups.flatMap(g => g.settings.map(s => [s.key, s])));
  assert.equal(all.reviewer.value, 'claude');
  assert.equal(all.reviewer.this_machine, true);
  assert.equal(all.reviewer.repo_value, 'codex');
  assert.equal(all.builder.this_machine, undefined);
  assert.equal(all.build_command, undefined, 'build_command shows only when this machine holds it');
});

test('0386 AC4: speck config show marks every one of your own settings this machine holds, build_command and resume_command included', () => {
  const r = repo();
  for (const key of OWN) assert.equal(r.set(r.dir, key, VALUES[key]).status, 0, key);
  const json = JSON.parse(r.show('--json').stdout);
  const all = Object.fromEntries(json.groups.flatMap(g => g.settings.map(s => [s.key, s])));
  const mine = machineConfig(r.dir);
  for (const key of OWN) {
    assert.equal(all[key]?.this_machine, true, key);
    assert.deepEqual(all[key].value, mine[key], key);
  }
  assert.equal(all.build_command.repo_value, DEFAULT_BUILD_COMMAND);
  assert.equal(all.resume_command.repo_value, '');
  const text = r.show().stdout;
  for (const key of OWN) assert.match(text, new RegExp(`^  ${key}: .*\\(this machine's own, over speck/config\\.yml's `, 'm'), key);
});

test('0386 AC5: the README and the brief name --repo and where your own settings are kept', () => {
  for (const doc of ['README.md', 'docs/brief.md']) {
    const text = fs.readFileSync(path.join(ROOT, doc), 'utf8');
    assert.match(text, /speck config set --repo/, doc);
    assert.match(text, /speck\/\.cache\/machine\/config\.yml/, doc);
  }
});
