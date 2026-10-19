// speck detect: the facts setup needs about this machine and folder, as one JSON object.
// It only reads: no questions, no decisions, and nothing written to the folder or to git.
// Missing tools and unknown values are false or null, never errors.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { onPath, CURSOR_CLIS } from './install.mjs';

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

// The agents setup can use. Codex counts as signed in the way speck doctor checks it. 0310: Cursor's CLI is on the
// PATH by either of its names (CURSOR_CLIS), as speck agents finds it.
function agentFacts() {
  const codex = onPath('codex');
  return {
    claude: { on_path: onPath('claude') },
    codex: { on_path: codex, signed_in: codex && run('codex', ['login', 'status'])?.status === 0 },
    'cursor-agent': { on_path: CURSOR_CLIS.some(onPath) },
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

function packageJson(dir) {
  try { return JSON.parse(read(dir, 'package.json')); } catch { return null; }
}

function npmTest(pkg) {
  const scripts = pkg && typeof pkg === 'object' ? pkg.scripts : null;
  const test = scripts && typeof scripts === 'object' && Object.hasOwn(scripts, 'test') ? scripts.test : null;
  return typeof test === 'string' && test.trim() !== '' && !NPM_DEFAULT_TEST.test(test);
}

// A requirement for pytest itself, such as `pytest`, `pytest>=8` or `pytest[testing] ; python_version >= "3.9"`.
const PYTEST_REQUIREMENT = /^\s*pytest\s*(?:\[[^\]]*\]\s*)?(?:[=<>!~;@(]|$)/;
// Tables such as [project.optional-dependencies], [dependency-groups] or [tool.poetry.group.dev.dependencies].
const DEPENDENCY_TABLE = /(?:^|\.)(?:[\w-]*dependencies|dependency-groups)(?:\.|$)/;
// Keys such as `dependencies`, `dev-dependencies` or `requires`, in any table.
const DEPENDENCY_KEY = /dependencies$|^requires$/;

// Whether a pyproject.toml uses pytest: pytest's own settings table, or pytest declared as a dependency.
// Comments and other strings, such as a description that mentions pytest, don't count.
function pyprojectUsesPytest(text) {
  let table = '', key = '';
  let depth = 0; // open [ and { in the current value
  for (const line of text.split('\n')) {
    if (depth === 0) {
      const header = line.match(/^\s*\[\[?\s*([^\]]+?)\s*\]\]?/);
      if (header) { table = header[1].replace(/["'\s]/g, ''); key = ''; if (/^tool\.pytest(?:\.|$)/.test(table)) return true; continue; }
      const k = line.match(/^\s*([\w."'-]+?)\s*=/);
      if (k) {
        key = k[1].replace(/["']/g, '').split('.').pop();
        if (key === 'pytest' && DEPENDENCY_TABLE.test(table)) return true; // Poetry: pytest = "^8"
      }
    }
    const deps = DEPENDENCY_TABLE.test(table) || DEPENDENCY_KEY.test(key);
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '#') break;
      if (ch === '"' || ch === "'") {
        let s = '', j = i + 1;
        for (; j < line.length && line[j] !== ch; j++) s += ch === '"' && line[j] === '\\' ? line[++j] ?? '' : line[j];
        if (deps && PYTEST_REQUIREMENT.test(s)) return true;
        i = j;
      } else if (ch === '[' || ch === '{') depth++;
      else if ((ch === ']' || ch === '}') && depth > 0) depth--;
    }
  }
  return false;
}

function usesPytest(dir) {
  if (isFile(path.join(dir, 'pytest.ini')) || isFile(path.join(dir, 'conftest.py'))) return true;
  if (pyprojectUsesPytest(read(dir, 'pyproject.toml') || '')) return true;
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

// The first lockfile found decides, in this order, unless package.json's packageManager names a package manager.
const LOCKFILES = [
  ['pnpm-lock.yaml', 'pnpm', 'pnpm install --frozen-lockfile'],
  ['yarn.lock', 'yarn', 'yarn install --frozen-lockfile'],
  ['bun.lockb', 'bun', 'bun install'],
  ['bun.lock', 'bun', 'bun install'],
  ['package-lock.json', 'npm', 'npm ci'],
  ['npm-shrinkwrap.json', 'npm', 'npm ci'],
];

// Each runs package.json's test script. `bun test` would start Bun's own test runner instead.
const TEST_COMMANDS = { npm: 'npm test', pnpm: 'pnpm test', yarn: 'yarn test', bun: 'bun run test' };

// The package manager package.json's packageManager field names, such as `pnpm@9.1.0`, or null.
function namedManager(pkg) {
  const field = pkg && typeof pkg === 'object' && Object.hasOwn(pkg, 'packageManager') ? pkg.packageManager : null;
  const m = typeof field === 'string' && /^(npm|pnpm|yarn|bun)(?:@|$)/.exec(field);
  return m ? m[1] : null;
}

export function suggestCommands(dir) {
  const pkg = packageJson(dir);
  const named = namedManager(pkg);
  const locks = LOCKFILES.filter(([f]) => isFile(path.join(dir, f)));
  const lock = named ? locks.find(([, pm]) => pm === named) : locks[0];
  const manager = named || (lock ? lock[1] : 'npm');
  // A lockfile of another package manager than packageManager names gets a plain install, so both commands name the same one.
  const worktree_setup = lock ? lock[2] : locks.length ? `${named} install` : null;
  const test_command = npmTest(pkg) ? TEST_COMMANDS[manager] : usesPytest(dir) ? 'pytest' : makeTest(dir) ? 'make test' : null;
  return { test_command, worktree_setup };
}

function isDir(f) {
  try { return fs.statSync(f).isDirectory(); } catch { return false; }
}

// The entries of a folder, or none if it can't be read.
function entries(dir) {
  try { return fs.readdirSync(dir, { withFileTypes: true }); } catch { return []; }
}

// The folders in dir whose names match, as paths relative to root, each ending in /.
function foldersIn(root, dir, match) {
  return entries(path.join(root, dir)).filter(e => match(e.name) && isDir(path.join(root, dir, e.name))).map(e => `${dir}/${e.name}/`);
}

// Other spec-driven workflows in the project, each with the paths that show it, so setup can ask what to do.
// OpenSpec also lists its changes still in progress: each folder under openspec/changes/ other than archive.
export function otherWorkflows(dir) {
  const found = [];
  const folder = name => isDir(path.join(dir, name)) ? [`${name}/`] : [];
  const openspec = [
    ...folder('openspec'),
    ...['.claude/skills', '.agents/skills'].flatMap(d => foldersIn(dir, d, n => n.startsWith('openspec-'))),
    ...entries(path.join(dir, '.claude/commands')).filter(e => e.name === 'opsx' ? isDir(path.join(dir, '.claude/commands', e.name)) : /^opsx[-:_.]/.test(e.name))
      .map(e => `.claude/commands/${e.name}${e.name === 'opsx' ? '/' : ''}`),
  ].sort();
  if (openspec.length) found.push({ name: 'OpenSpec', paths: openspec, in_progress: foldersIn(dir, 'openspec/changes', n => n !== 'archive').sort() });
  if (isDir(path.join(dir, '.specify'))) found.push({ name: 'GitHub Spec Kit', paths: ['.specify/'] });
  if (isDir(path.join(dir, '.kiro'))) found.push({ name: 'Kiro', paths: ['.kiro/'] });
  return found;
}

export function detectFacts(dir = process.cwd()) {
  return { os: osFacts(), node: nodeFacts(), ...gitFacts(dir), speck: speckFacts(dir), agents: agentFacts(), suggestions: suggestCommands(dir), other_workflows: otherWorkflows(dir) };
}

export function cmdDetect() {
  console.log(JSON.stringify(detectFacts(process.cwd()), null, 2));
}
