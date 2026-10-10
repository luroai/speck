import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { osFacts, nodeFacts, suggestCommands } from '../scripts/detect.mjs';

// ---------- 0086: speck detect reports the facts setup needs as JSON ----------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(ROOT, 'scripts', 'speck.mjs');
const GIT = spawnSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).stdout.trim();

const tmp = prefix => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));

// A PATH holding node, git (unless left out) and the named fake tools. Each tool's script is its body, or `exit 0`.
function fakeBin({ git = true, tools = {} } = {}) {
  const bin = tmp('speck-bin-');
  fs.symlinkSync(process.execPath, path.join(bin, 'node'));
  if (git) fs.symlinkSync(GIT, path.join(bin, 'git'));
  for (const [name, body] of Object.entries(tools)) fs.writeFileSync(path.join(bin, name), `#!/bin/sh\n${body || 'exit 0'}\n`, { mode: 0o755 });
  return bin;
}

// No global or system git config, so a name and email come only from the folder.
const home = () => tmp('speck-home-');
const envFor = (bin, h = home()) => ({ ...process.env, PATH: bin, HOME: h, XDG_CONFIG_HOME: h, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: path.join(h, '.gitconfig') });

function detect(dir, { bin = fakeBin(), env } = {}) {
  const r = spawnSync(process.execPath, [CLI, 'detect'], { cwd: dir, encoding: 'utf8', env: env || envFor(bin) });
  return { ...r, json: (() => { try { return JSON.parse(r.stdout); } catch { return undefined; } })() };
}

const gitIn = (dir, ...a) => {
  const r = spawnSync('git', a, { cwd: dir, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' } });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout;
};

// Every file under dir (including .git), with its contents' hash and its modification time.
function snapshot(dir) {
  const out = {};
  const walk = d => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { out[path.relative(dir, p) + '/'] = 'dir'; walk(p); }
      else {
        const st = fs.statSync(p);
        out[path.relative(dir, p)] = crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex') + ' ' + st.mtimeMs;
      }
    }
  };
  walk(dir);
  return out;
}

function repoWithCommit(branch = 'main') {
  const dir = tmp('speck-detect-');
  gitIn(dir, 'init', '-q', '-b', branch);
  fs.writeFileSync(path.join(dir, 'a.txt'), 'one\n');
  gitIn(dir, 'add', 'a.txt');
  gitIn(dir, 'commit', '-q', '-m', 'first');
  return dir;
}

test('0086 AC1: detect prints one JSON object and exits 0 in a folder that is not a git repo', () => {
  const dir = tmp('speck-detect-');
  fs.writeFileSync(path.join(dir, 'notes.txt'), 'hi\n');
  const before = snapshot(dir);
  const r = detect(dir);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stderr, '');
  assert.ok(r.json && typeof r.json === 'object' && !Array.isArray(r.json), r.stdout);
  assert.deepEqual(snapshot(dir), before);
  assert.equal(r.json.repo.is_repo, false);
});

test('0086 AC1: detect changes nothing in a git repo, its index or its refs', () => {
  const dir = repoWithCommit();
  fs.writeFileSync(path.join(dir, 'b.txt'), 'same\n');
  gitIn(dir, 'add', 'b.txt');
  gitIn(dir, 'commit', '-q', '-m', 'second');
  fs.writeFileSync(path.join(dir, 'a.txt'), 'two\n'); // a tracked change, so status has something to look at
  fs.writeFileSync(path.join(dir, 'untracked.txt'), 'u\n');
  // Make the index's stat data for an unchanged file stale, so a status that refreshed the index would rewrite it.
  const t = new Date(Date.now() + 5000);
  fs.utimesSync(path.join(dir, 'b.txt'), t, t);
  const before = snapshot(dir);
  const r = detect(dir);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(r.json);
  assert.deepEqual(snapshot(dir), before);
});

test('0086 AC1: detect exits 0 with git missing from the PATH, and reports git as missing', () => {
  const dir = repoWithCommit();
  const r = detect(dir, { bin: fakeBin({ git: false }) });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.json.git.installed, false);
  assert.equal(r.json.repo.is_repo, false);
  assert.equal(r.json.repo.branch, null);
  assert.equal(r.json.repo.git_name_set, false);
});

test('0086 AC1: the package runs detect through its speck bin, as npx does before speck is installed', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.bin.speck, 'scripts/speck.mjs');
  assert.ok(pkg.files.includes('scripts/'));
  // A folder with no speck in it, and the bin run through a symlink, as npm links it.
  const dir = tmp('speck-detect-');
  const bin = fakeBin();
  fs.symlinkSync(CLI, path.join(bin, 'speck'));
  const r = spawnSync(path.join(bin, 'speck'), ['detect'], { cwd: dir, encoding: 'utf8', env: envFor(bin) });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(r.stdout).speck.installed, false);
});

test('0086 AC1: detect is listed in the help', () => {
  const r = spawnSync(process.execPath, [CLI, 'help'], { encoding: 'utf8' });
  assert.match(r.stdout, /speck detect\s+\S/);
});

test('0086 AC2: the operating system, and whether speck supports it', () => {
  assert.deepEqual(osFacts('darwin'), { platform: 'darwin', name: 'macOS', supported: true });
  assert.deepEqual(osFacts('linux'), { platform: 'linux', name: 'Linux', supported: true });
  assert.deepEqual(osFacts('win32'), { platform: 'win32', name: 'Windows', supported: false });
  assert.deepEqual(osFacts('freebsd'), { platform: 'freebsd', name: 'freebsd', supported: false });
  const r = detect(tmp('speck-detect-'));
  assert.deepEqual(r.json.os, osFacts(process.platform));
});

test('0086 AC2: the Node.js version, and whether it is 20 or newer', () => {
  assert.deepEqual(nodeFacts('20.0.0'), { version: '20.0.0', supported: true });
  assert.deepEqual(nodeFacts('22.11.1'), { version: '22.11.1', supported: true });
  assert.deepEqual(nodeFacts('18.20.4'), { version: '18.20.4', supported: false });
  const r = detect(tmp('speck-detect-'));
  assert.deepEqual(r.json.node, nodeFacts(process.versions.node));
  assert.equal(r.json.git.installed, true);
});

test('0086 AC2: a repo with commits, a clean tree, its branch, main, and a git name and email', () => {
  const dir = repoWithCommit('main');
  gitIn(dir, 'config', 'user.name', 'Someone');
  gitIn(dir, 'config', 'user.email', 'someone@example.com');
  fs.writeFileSync(path.join(dir, 'untracked.txt'), 'u\n'); // untracked files don't count as uncommitted changes
  const r = detect(dir);
  assert.deepEqual(r.json.repo, {
    is_repo: true, has_commits: true, uncommitted_changes: false, branch: 'main',
    main_exists: true, master_exists: false, git_name_set: true, git_email_set: true,
  });
});

test('0086 AC2: uncommitted changes to tracked files, staged or not, and master instead of main', () => {
  const dir = repoWithCommit('master');
  fs.writeFileSync(path.join(dir, 'a.txt'), 'changed\n');
  let r = detect(dir);
  assert.equal(r.json.repo.uncommitted_changes, true);
  assert.equal(r.json.repo.main_exists, false);
  assert.equal(r.json.repo.master_exists, true);
  assert.equal(r.json.repo.branch, 'master');
  assert.equal(r.json.repo.git_name_set, false);
  assert.equal(r.json.repo.git_email_set, false);
  gitIn(dir, 'add', 'a.txt');
  r = detect(dir);
  assert.equal(r.json.repo.uncommitted_changes, true);
});

test('0086 AC2: a new repo with no commits, and a detached HEAD', () => {
  const dir = tmp('speck-detect-');
  gitIn(dir, 'init', '-q', '-b', 'trunk');
  let r = detect(dir);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(r.json.repo, {
    is_repo: true, has_commits: false, uncommitted_changes: false, branch: 'trunk',
    main_exists: false, master_exists: false, git_name_set: false, git_email_set: false,
  });
  const repo = repoWithCommit('main');
  gitIn(repo, 'checkout', '-q', '--detach');
  r = detect(repo);
  assert.equal(r.json.repo.branch, null);
  assert.equal(r.json.repo.has_commits, true);
});

test('0086 AC2: a git name and email from the global config count as set', () => {
  const dir = tmp('speck-detect-');
  const h = home();
  fs.writeFileSync(path.join(h, '.gitconfig'), '[user]\n\tname = Someone\n\temail = someone@example.com\n');
  const r = detect(dir, { env: envFor(fakeBin(), h) });
  assert.equal(r.json.repo.git_name_set, true);
  assert.equal(r.json.repo.git_email_set, true);
});

test('0086 AC3: speck is not installed in a folder without speck/config.yml', () => {
  const r = detect(tmp('speck-detect-'));
  assert.deepEqual(r.json.speck, { installed: false, version: null });
});

test('0086 AC3: an installed speck reports the version in .speck/VERSION', () => {
  const dir = tmp('speck-detect-');
  fs.mkdirSync(path.join(dir, 'speck'));
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), 'base_branch: main\n');
  let r = detect(dir);
  assert.deepEqual(r.json.speck, { installed: true, version: null });
  fs.mkdirSync(path.join(dir, '.speck'));
  fs.writeFileSync(path.join(dir, '.speck', 'VERSION'), '0.1.0\n');
  r = detect(dir);
  assert.deepEqual(r.json.speck, { installed: true, version: '0.1.0' });
});

test('0086 AC4: which coding agents are on the PATH, and none when none are', () => {
  let r = detect(tmp('speck-detect-'));
  assert.deepEqual(r.json.agents, {
    claude: { on_path: false }, codex: { on_path: false, signed_in: false },
    'cursor-agent': { on_path: false }, gemini: { on_path: false },
  });
  r = detect(tmp('speck-detect-'), { bin: fakeBin({ tools: { claude: '', 'cursor-agent': '', gemini: '' } }) });
  assert.deepEqual(r.json.agents, {
    claude: { on_path: true }, codex: { on_path: false, signed_in: false },
    'cursor-agent': { on_path: true }, gemini: { on_path: true },
  });
});

test('0086 AC4: codex is signed in when `codex login status` succeeds, as doctor checks it', () => {
  const log = path.join(tmp('speck-log-'), 'calls');
  const signedIn = fakeBin({ tools: { codex: `echo "$@" >> ${log}; exit 0` } });
  let r = detect(tmp('speck-detect-'), { bin: signedIn });
  assert.deepEqual(r.json.agents.codex, { on_path: true, signed_in: true });
  assert.match(fs.readFileSync(log, 'utf8'), /^login status$/m);
  const signedOut = fakeBin({ tools: { codex: 'if [ "$1" = login ]; then echo "Not logged in" >&2; exit 1; fi; exit 0' } });
  r = detect(tmp('speck-detect-'), { bin: signedOut });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(r.json.agents.codex, { on_path: true, signed_in: false });
});

test('0086 AC5: npm test for a real test script, and null for npm\'s default one or none', () => {
  const dir = tmp('speck-detect-');
  const pkg = scripts => fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'x', scripts }));
  assert.deepEqual(suggestCommands(dir), { test_command: null, worktree_setup: null });
  pkg({ test: 'echo "Error: no test specified" && exit 1' });
  assert.equal(suggestCommands(dir).test_command, null);
  pkg({ test: '' });
  assert.equal(suggestCommands(dir).test_command, null);
  pkg({ build: 'tsc' });
  assert.equal(suggestCommands(dir).test_command, null);
  pkg({ test: 'vitest run' });
  assert.equal(suggestCommands(dir).test_command, 'npm test');
  const r = detect(dir);
  assert.deepEqual(r.json.suggestions, { test_command: 'npm test', worktree_setup: null });
});

test('0086 AC5: a malformed or odd package.json suggests nothing and is not an error', () => {
  const dir = tmp('speck-detect-');
  for (const text of ['{ not json', '[]', 'null', '"x"', '{"scripts": "npm test"}', '{"scripts": {"test": 1}}', '{"scripts": {"__proto__": {"test": "x"}}}']) {
    fs.writeFileSync(path.join(dir, 'package.json'), text);
    assert.equal(suggestCommands(dir).test_command, null, text);
    const r = detect(dir);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.json.suggestions.test_command, null, text);
  }
  fs.rmSync(path.join(dir, 'package.json'));
  fs.mkdirSync(path.join(dir, 'package.json'));
  assert.equal(suggestCommands(dir).test_command, null);
  assert.equal(detect(dir).status, 0);
});

test('0086 AC5: the install command matches the lockfile', () => {
  const cases = [
    ['package-lock.json', 'npm ci'],
    ['pnpm-lock.yaml', 'pnpm install --frozen-lockfile'],
    ['yarn.lock', 'yarn install --frozen-lockfile'],
    ['bun.lockb', 'bun install'],
    ['bun.lock', 'bun install'],
  ];
  for (const [lock, cmd] of cases) {
    const dir = tmp('speck-detect-');
    fs.writeFileSync(path.join(dir, 'package.json'), '{}');
    fs.writeFileSync(path.join(dir, lock), '');
    assert.equal(suggestCommands(dir).worktree_setup, cmd, lock);
    assert.equal(detect(dir).json.suggestions.worktree_setup, cmd, lock);
  }
});

test('0086 AC5: pytest for a Python project that uses pytest, and nothing for one that doesn\'t', () => {
  const uses = [
    ['pytest.ini', '[pytest]\n'],
    ['conftest.py', ''],
    ['pyproject.toml', '[tool.pytest.ini_options]\naddopts = "-q"\n'],
    ['pyproject.toml', '[project.optional-dependencies]\ntest = ["pytest>=8"]\n'],
    ['pyproject.toml', '[tool.poetry.group.dev.dependencies]\npytest = "^8.0"  # tests\n'],
    ['pyproject.toml', '[project]\ndependencies = [\n  "requests",\n  \'pytest\',\n]\n'],
    ['setup.cfg', '[tool:pytest]\ntestpaths = tests\n'],
    ['tox.ini', '[pytest]\n'],
    ['requirements-dev.txt', 'black\npytest==8.0\n'],
    ['requirements.txt', 'pytest\n'],
  ];
  for (const [file, text] of uses) {
    const dir = tmp('speck-detect-');
    fs.writeFileSync(path.join(dir, file), text);
    assert.equal(suggestCommands(dir).test_command, 'pytest', file);
  }
  // Review round 1 F1: a comment that mentions pytest is not pytest in use.
  const none = [['pyproject.toml', '[project]\nname = "x"\n'], ['pyproject.toml', '# pytest is not used here\n[project]\nname = "x"\n'],
    ['pyproject.toml', '[project]\nname = "x" # we dropped "pytest" and [tool.pytest]\n# pytest = "^8"\n'], ['requirements.txt', '# pytest\nrequests\n'],
    ['setup.cfg', '# [tool:pytest]\n[metadata]\n'], ['tox.ini', '; [pytest]\n# [pytest]\n'],['requirements.txt', 'requests\npytest-is-not-here-but-pytestish\n'], ['setup.cfg', '[metadata]\nname = x\n']];
  for (const [file, text] of none) {
    const dir = tmp('speck-detect-');
    fs.writeFileSync(path.join(dir, file), text);
    assert.equal(suggestCommands(dir).test_command, null, `${file}: ${text}`);
  }
  // F1: with a Makefile test target too, the comment doesn't override it.
  const dir = tmp('speck-detect-');
  fs.writeFileSync(path.join(dir, 'pyproject.toml'), '# pytest is not used here\n[project]\nname = "x"\n');
  fs.writeFileSync(path.join(dir, 'Makefile'), 'test:\n\t./run-tests\n');
  assert.equal(suggestCommands(dir).test_command, 'make test');
  assert.equal(detect(dir).json.suggestions.test_command, 'make test');
});

test('0086 AC5: make test for a Makefile with a test target, and nothing without one', () => {
  const has = ['test:\n\tgo test ./...\n', '.PHONY: test\ntest: build\n\t./run\n', 'all: build\n\ntest lint: deps\n\t./check\n', 'test::\n\t./a\n'];
  for (const text of has) {
    const dir = tmp('speck-detect-');
    fs.writeFileSync(path.join(dir, 'Makefile'), text);
    assert.equal(suggestCommands(dir).test_command, 'make test', text);
  }
  const hasNot = ['build:\n\tgo build\n', 'test := 1\nbuild:\n\techo\n', 'tests:\n\t./a\n', '# test:\nbuild:\n\techo\n', 'TEST:\n\techo\n'];
  for (const text of hasNot) {
    const dir = tmp('speck-detect-');
    fs.writeFileSync(path.join(dir, 'Makefile'), text);
    assert.equal(suggestCommands(dir).test_command, null, text);
  }
});
