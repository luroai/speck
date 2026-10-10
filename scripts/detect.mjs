// speck detect: the facts setup needs about this machine and folder, as one JSON object.
// It only reads: no questions, no decisions, and nothing written to the folder or to git.
// Missing tools and unknown values are false or null, never errors.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { onPath } from './install.mjs';

const OS_NAMES = { darwin: 'macOS', linux: 'Linux', win32: 'Windows' };

export function osFacts(platform = process.platform) {
  return { platform, name: Object.hasOwn(OS_NAMES, platform) ? OS_NAMES[platform] : platform, supported: platform === 'darwin' || platform === 'linux' };
}

export function nodeFacts(version = process.versions.node) {
  return { version, supported: Number(version.split('.')[0]) >= 20 };
}

// Runs a command and returns its result, or null if it couldn't be started.
// GIT_OPTIONAL_LOCKS=0 stops git status from refreshing the index, so nothing in .git is written.
function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' }, timeout: 15000 });
  return r.error ? null : r;
}

function gitFacts(dir) {
  const g = (...args) => run('git', ['-C', dir, ...args], dir);
  const installed = g('--version')?.status === 0;
  const ok = (...args) => installed && g(...args)?.status === 0;
  const out = (...args) => { const r = installed && g(...args); return r && r.status === 0 ? r.stdout.trim() : ''; };
  const isRepo = ok('rev-parse', '--git-dir');
  const hasCommits = isRepo && ok('rev-parse', '--verify', '--quiet', 'HEAD');
  return {
    git: { installed },
    repo: {
      is_repo: isRepo,
      has_commits: hasCommits,
      // Tracked files only, staged or not: untracked files aren't counted.
      uncommitted_changes: isRepo && out('status', '--porcelain', '--untracked-files=no') !== '',
      // Null when HEAD is detached. A new repo reports the branch its first commit will be on.
      branch: (isRepo && out('symbolic-ref', '--quiet', '--short', 'HEAD')) || null,
      main_exists: isRepo && ok('show-ref', '--verify', '--quiet', 'refs/heads/main'),
      master_exists: isRepo && ok('show-ref', '--verify', '--quiet', 'refs/heads/master'),
      git_name_set: out('config', 'user.name') !== '',
      git_email_set: out('config', 'user.email') !== '',
    },
  };
}

function speckFacts(dir) {
  const installed = isFile(path.join(dir, 'speck', 'config.yml'));
  let version = null;
  if (installed) { try { version = fs.readFileSync(path.join(dir, '.speck', 'VERSION'), 'utf8').trim() || null; } catch {} }
  return { installed, version };
}

// The agents setup can use. Codex counts as signed in the way speck doctor checks it.
function agentFacts() {
  const codex = onPath('codex');
  return {
    claude: { on_path: onPath('claude') },
    codex: { on_path: codex, signed_in: codex && run('codex', ['login', 'status'])?.status === 0 },
    'cursor-agent': { on_path: onPath('cursor-agent') },
    gemini: { on_path: onPath('gemini') },
  };
}

function isFile(f) {
  try { return fs.statSync(f).isFile(); } catch { return false; }
}

function read(dir, name) {
  const f = path.join(dir, name);
  try { return isFile(f) ? fs.readFileSync(f, 'utf8') : null; } catch { return null; }
}

// npm writes this test script into a new package.json, so it isn't a real one.
const NPM_DEFAULT_TEST = /no test specified/;

function npmTest(dir) {
  let pkg;
  try { pkg = JSON.parse(read(dir, 'package.json')); } catch { return false; }
  const scripts = pkg && typeof pkg === 'object' ? pkg.scripts : null;
  const test = scripts && typeof scripts === 'object' && Object.hasOwn(scripts, 'test') ? scripts.test : null;
  return typeof test === 'string' && test.trim() !== '' && !NPM_DEFAULT_TEST.test(test);
}

function usesPytest(dir) {
  if (isFile(path.join(dir, 'pytest.ini')) || isFile(path.join(dir, 'conftest.py'))) return true;
  if (/^\s*\[tool\.pytest\b|["'\s[,]pytest\b/m.test(read(dir, 'pyproject.toml') || '')) return true;
  if (/^\s*\[tool:pytest\]/m.test(read(dir, 'setup.cfg') || '')) return true;
  if (/^\s*\[pytest\]/m.test(read(dir, 'tox.ini') || '')) return true;
  let files = [];
  try { files = fs.readdirSync(dir).filter(f => /^requirements.*\.txt$/.test(f)); } catch {}
  return files.some(f => /^\s*pytest\s*(?:[=<>!~;[#]|$)/m.test(read(dir, f) || ''));
}

// A rule whose targets include `test`, such as `test:`, `test::` or `test lint: deps`, but not `test := 1`.
function makeTest(dir) {
  return /^(?:[^\s:#=]+[ \t]+)*test(?:[ \t]+[^\s:#=]+)*[ \t]*::?(?!=)/m.test(read(dir, 'Makefile') || '');
}

// The first lockfile found decides, in this order.
const LOCKFILES = [
  ['pnpm-lock.yaml', 'pnpm install --frozen-lockfile'],
  ['yarn.lock', 'yarn install --frozen-lockfile'],
  ['bun.lockb', 'bun install'],
  ['bun.lock', 'bun install'],
  ['package-lock.json', 'npm ci'],
  ['npm-shrinkwrap.json', 'npm ci'],
];

export function suggestCommands(dir) {
  const test_command = npmTest(dir) ? 'npm test' : usesPytest(dir) ? 'pytest' : makeTest(dir) ? 'make test' : null;
  const lock = LOCKFILES.find(([f]) => isFile(path.join(dir, f)));
  return { test_command, worktree_setup: lock ? lock[1] : null };
}

export function detectFacts(dir = process.cwd()) {
  return { os: osFacts(), node: nodeFacts(), ...gitFacts(dir), speck: speckFacts(dir), agents: agentFacts(), suggestions: suggestCommands(dir) };
}

export function cmdDetect() {
  console.log(JSON.stringify(detectFacts(process.cwd()), null, 2));
}
