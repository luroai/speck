// 0740: the variables that point git at a repository, as git 2.53's `git rev-parse --local-env-vars` lists them: git
// clears them itself before it works in another repository. A test that inherits one sends its git commands there
// rather than to the temporary folder it made. `git bisect run` gives its script GIT_DIR, and under it a test's `git
// init` once reinitialised this repository instead, taking it to be bare and setting core.bare in the main checkout's
// .git/config. Loading this module takes them out of this process's environment, so nothing the process runs inherits
// them. tmp.mjs, which every test file imports first, loads it before anything else, and so does the suite runner.
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export const GIT_REPO_VARS = Object.freeze(['GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_CONFIG', 'GIT_CONFIG_PARAMETERS',
  'GIT_CONFIG_COUNT', 'GIT_OBJECT_DIRECTORY', 'GIT_DIR', 'GIT_WORK_TREE', 'GIT_IMPLICIT_WORK_TREE', 'GIT_GRAFT_FILE',
  'GIT_INDEX_FILE', 'GIT_NO_REPLACE_OBJECTS', 'GIT_REPLACE_REF_BASE', 'GIT_PREFIX', 'GIT_SHALLOW_FILE', 'GIT_COMMON_DIR']);

// A copy of `env` without them.
export function withoutRepoVars(env = process.env) {
  const out = { ...env };
  for (const name of GIT_REPO_VARS) delete out[name];
  return out;
}

for (const name of GIT_REPO_VARS) delete process.env[name];

// Makes a bare repository, with main as its first branch, in `dir`, a folder the caller made for it, and returns `dir`.
// git is given the folder and none of the variables above, so the repository goes there whatever the environment
// holds: with GIT_COMMON_DIR, a bare `git init` sets core.bare in that repository even when it's given a folder.
// Throws, saying why, when git can't make it.
export function initBare(dir) {
  const r = spawnSync('git', ['init', '-q', '--bare', '-b', 'main', path.resolve(dir)], { encoding: 'utf8', env: withoutRepoVars() });
  if (r.status !== 0) throw new Error(`git couldn't make a bare repository in ${dir}: ${(r.stderr || r.error?.message || `exit ${r.status}`).trim()}`);
  return dir;
}
