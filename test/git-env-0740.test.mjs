// 0740: a test's git commands go to the temporary folder the test made, whatever git variables the environment holds,
// so running the tests can't change the main checkout's .git/config, as a `git init` under `git bisect run` once did.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { initBare } from './support/git-env.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SUITE = path.join(HERE, 'support', 'suite.mjs');
const support = name => JSON.stringify(pathToFileURL(path.join(HERE, 'support', name)).href);
const ID = { GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
const git = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8', env: { ...process.env, ...ID } });
const NAMED = ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE'];

// A test file that makes its repos as the quick tests do: panelRepo(), whose `git init` made the main checkout bare,
// a bare remote from remoteMoves(), and the plain git commands those helpers run, with no folder named. The fixture
// runs a bare `git init` with no folder on purpose, to show it can't reach the main checkout either.
const HELPERS = `import ${support('tmp.mjs')};
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { panelRepo } from ${support('panel.mjs')};
import { shipRepo, remoteMoves } from ${support('ship.mjs')};
const temp = prefix => fs.mkdtempSync(path.join(os.tmpdir(), prefix));
test('makes its repos as the quick tests do', () => {
  panelRepo();
  remoteMoves(shipRepo(), 'remote.txt', 'from the remote\\n');
  const dir = temp('speck-');
  assert.equal(spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir }).status, 0);
  assert.equal(spawnSync('git', ['config', 'user.name', 'someone'], { cwd: dir }).status, 0);
  assert.equal(spawnSync('git', ['init', '-q', '--bare'], { cwd: temp('speck-remote-') }).status, 0);
});
`;
// A test file that loads no support module, so only the runner can have taken git's variables out of its environment.
const RUNNER = `import { test } from 'node:test';
import assert from 'node:assert/strict';
test('is given none of git\\'s repository variables', () => {
  for (const name of ${JSON.stringify(NAMED)}) assert.equal(process.env[name], undefined, name);
});
`;

// A main checkout with the two test files committed, and a worktree of it beside it.
function checkout() {
  const main = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-main-')));
  assert.equal(git(main, 'init', '-q', '-b', 'main').status, 0);
  fs.mkdirSync(path.join(main, 'test'));
  fs.writeFileSync(path.join(main, 'test', 'helpers.test.mjs'), HELPERS);
  fs.writeFileSync(path.join(main, 'test', 'runner.test.mjs'), RUNNER);
  assert.equal(git(main, 'add', '-A').status, 0);
  assert.equal(git(main, 'commit', '-qm', 'base').status, 0);
  const wt = path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-wt-'))), 'wt');
  assert.equal(git(main, 'worktree', 'add', '-q', '--detach', wt).status, 0);
  return {
    main, wt,
    wtGitDir: git(wt, 'rev-parse', '--absolute-git-dir').stdout.trim(), // .git/worktrees/wt in the main checkout
    config: () => fs.readFileSync(path.join(main, '.git', 'config')),
    head: () => git(main, 'rev-parse', 'HEAD').stdout.trim(),
  };
}

// Runs the quick tests' runner from `cwd`, as speck ship runs commands.test, with `vars` added to the environment.
function quickRun(cwd, vars) {
  const env = { ...process.env, ...vars };
  delete env.NODE_TEST_CONTEXT; // run the fixture as its own test run, not as part of this one
  return spawnSync(process.execPath, [SUITE, '--quick'], { cwd, env, encoding: 'utf8', timeout: 90_000 });
}

const bothPassed = r => {
  assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
  assert.match(r.stdout, /^# pass 2$/m, r.stdout);
};

test('0740 AC2: the quick tests, run from the main checkout with GIT_DIR, GIT_WORK_TREE and GIT_INDEX_FILE set to its own, leave its .git/config byte for byte as it was', () => {
  const c = checkout();
  const before = c.config(), head = c.head();
  const r = quickRun(c.main, { GIT_DIR: path.join(c.main, '.git'), GIT_WORK_TREE: c.main, GIT_INDEX_FILE: path.join(c.main, '.git', 'index') });
  bothPassed(r);
  assert.deepEqual(c.config(), before);
  assert.equal(c.head(), head, 'nothing was committed in the main checkout');
});

test('0740 AC2: the quick tests, run in a worktree with GIT_DIR naming its folder in the main checkout\'s .git, as `git bisect run` sets it, leave the main checkout\'s .git/config as it was', () => {
  const c = checkout();
  const before = c.config();
  bothPassed(quickRun(c.wt, { GIT_DIR: c.wtGitDir }));
  assert.deepEqual(c.config(), before);
  assert.equal(git(c.main, 'rev-parse', '--is-bare-repository').stdout.trim(), 'false');
});

// Runs fn with `vars` set in this process's environment, then puts it back as it was.
function withEnv(vars, fn) {
  const saved = Object.fromEntries(Object.keys(vars).map(k => [k, process.env[k]]));
  Object.assign(process.env, vars);
  try { return fn(); } finally {
    for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
}

test('0740 AC3: initBare makes the bare repository in the folder it is given, whatever git variables the environment holds', () => {
  const c = checkout();
  const before = c.config();
  const dotGit = path.join(c.main, '.git');
  // With all three, git won't make a bare repository even in a folder it's given, and with GIT_COMMON_DIR it sets
  // core.bare in the main checkout's .git/config instead.
  for (const vars of [
    { GIT_DIR: dotGit, GIT_WORK_TREE: c.main, GIT_INDEX_FILE: path.join(dotGit, 'index') },
    { GIT_DIR: c.wtGitDir },
    { GIT_DIR: dotGit },
    { GIT_COMMON_DIR: dotGit, GIT_OBJECT_DIRECTORY: path.join(dotGit, 'objects') },
  ]) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-remote-'));
    assert.equal(withEnv(vars, () => initBare(dir)), dir);
    const label = JSON.stringify(vars);
    assert.equal(git(dir, 'rev-parse', '--is-bare-repository').stdout.trim(), 'true', label);
    assert.equal(git(dir, 'rev-parse', '--absolute-git-dir').stdout.trim(), fs.realpathSync(dir), label);
    assert.equal(git(dir, 'symbolic-ref', 'HEAD').stdout.trim(), 'refs/heads/main', label);
    assert.deepEqual(c.config(), before, label);
  }
});

test('0740 AC3: initBare says why when git can\'t make the repository, rather than going on without one', () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-')), 'a-file');
  fs.writeFileSync(file, 'not a folder\n');
  assert.throws(() => initBare(file), err => err.message.includes(file) && /bare repository/.test(err.message));
});

// Every line of the code under test/ that runs git's own `init --bare`, `clone --bare` or `clone --mirror`, apart from
// git-env.mjs, which holds initBare, and this file's fixture, which runs one on purpose.
function ownBareRepos() {
  const skip = new Set([path.join(HERE, 'support', 'git-env.mjs'), fileURLToPath(import.meta.url)]);
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : /\.(m?js|cjs|sh)$/.test(e.name) && !skip.has(p) ? [p] : [];
  });
  return walk(HERE).flatMap(file => fs.readFileSync(file, 'utf8').split('\n').flatMap((line, i) =>
    !/^\s*\/\//.test(line) && /--(bare|mirror)\b/.test(line) && /\b(init|clone)\b/.test(line) ? [`${path.relative(HERE, file)}:${i + 1}`] : []));
}

test('0740 AC3: every test and test helper that makes a bare repository makes it with initBare', () => {
  assert.deepEqual(ownBareRepos(), []);
});
