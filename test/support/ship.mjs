// Repos with an approved ticket ready to ship, for the ship tests that live in their own files.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'scripts', 'speck.mjs');
export const env = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
const approveVerdict = { verdict: 'approve', criteria: [{ id: 1, status: 'pass', evidence: 'ok' }], findings: [], product_md: { accurate: true, note: '' }, summary: 's', escalation_question: '' };
const body = `## Problem\nUsers cannot export.\n## Outcome\nUsers can export CSV.\n## Acceptance criteria\n1. Export button downloads a CSV.\n## Out of scope\n- PDF export\n`;
export const BRANCH = 'speck/0001-export-bookings';

export const gIn = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8', env });
export const runIn = (cwd, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd, encoding: 'utf8', env });

// An approved ticket on its branch, which changes shared.txt. Tracked files notes.txt and other.txt are on both branches.
// `test` is the test command, with {main} standing for the main checkout's path. With `worktree`, the branch is checked
// out in its own worktree and main in the main checkout; without it, the main checkout stays on the branch.
export function shipRepo({ test = 'true', worktree = true } = {}) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-ship-')));
  const g = (...a) => gIn(dir, ...a).stdout.trim();
  const run = (...a) => runIn(dir, ...a);
  g('init', '-q', '-b', 'main');
  assert.equal(run('init', '--skip-checks').status, 0);
  const cfgFile = path.join(dir, 'speck', 'config.yml');
  fs.writeFileSync(cfgFile, fs.readFileSync(cfgFile, 'utf8').replace(/^  test: .*$/m, `  test: ${JSON.stringify(test.replaceAll('{main}', dir))}`));
  const file = path.join(dir, run('new', 'Export bookings').stdout.trim());
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').split('## Problem')[0] + body);
  for (const f of ['shared.txt', 'notes.txt', 'other.txt']) fs.writeFileSync(path.join(dir, f), 'base\n');
  g('add', '-A'); g('commit', '-qm', 'base');
  g('checkout', '-qb', BRANCH);
  fs.writeFileSync(path.join(dir, 'shared.txt'), 'feature\n');
  g('add', '-A'); g('commit', '-qm', 'work');
  const v = path.join(os.tmpdir(), `verdict-${path.basename(dir)}.json`);
  fs.writeFileSync(v, JSON.stringify(approveVerdict));
  assert.equal(run('record', '1', v).status, 0);
  assert.equal(run('set', '1', 'status', 'approved').status, 0);
  g('add', '-A'); g('commit', '-qm', 'approved');
  let wt = dir;
  if (worktree) {
    g('checkout', '-q', 'main');
    wt = path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-wt-'))), 'wt');
    assert.equal(gIn(dir, 'worktree', 'add', '-q', wt, BRANCH).status, 0);
  }
  const sha = ref => g('rev-parse', '--verify', '-q', ref);
  const ticketIn = cwd => ['speck/tickets/0001-export-bookings.md', 'speck/tickets/done/0001-export-bookings.md']
    .map(p => path.join(cwd, p)).find(p => fs.existsSync(p));
  const statusIn = cwd => fs.readFileSync(ticketIn(cwd), 'utf8').match(/^status: (\S+)/m)[1];
  // Everything a refused ship must leave alone: both branches, what each folder has checked out, and every
  // uncommitted change, staged and not, with each changed file's content.
  const folder = cwd => {
    const status = gIn(cwd, 'status', '--porcelain', '--untracked-files=no').stdout;
    const files = {};
    for (const f of ['shared.txt', 'notes.txt', 'other.txt', 'remote.txt']) if (fs.existsSync(path.join(cwd, f))) files[f] = fs.readFileSync(path.join(cwd, f), 'utf8');
    return { head: gIn(cwd, 'rev-parse', 'HEAD').stdout.trim(), branch: gIn(cwd, 'branch', '--show-current').stdout.trim(), status,
      staged: gIn(cwd, 'diff', '--cached').stdout, unstaged: gIn(cwd, 'diff').stdout, files };
  };
  const snapshot = () => ({ main: sha('main'), branch: sha(BRANCH), dir: folder(dir), wt: folder(wt) });
  // A post-commit hook runs right after ship's own commit, so a change it makes lands after ship's last check and before the merge.
  // A post-merge hook runs after a merge that succeeds, such as ship catching up with the remote.
  const hook = (script, name = 'post-commit') => {
    const hooks = path.join(dir, '.git', 'hooks');
    fs.mkdirSync(hooks, { recursive: true });
    fs.writeFileSync(path.join(hooks, name), `#!/bin/sh\nunset GIT_DIR GIT_INDEX_FILE GIT_WORK_TREE\n${script.replaceAll('{main}', dir).replaceAll('{wt}', wt)}\n`, { mode: 0o755 });
  };
  return { dir, wt, g, run, sha, statusIn, snapshot, folder, hook };
}

// Gives main a bare remote, then pushes a commit to it from elsewhere that writes `file`.
export function remoteMoves(r, file, content) {
  const bare = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-remote-'));
  gIn(bare, 'init', '-q', '--bare', '-b', 'main');
  r.g('remote', 'add', 'origin', bare);
  r.g('push', '-q', '-u', 'origin', 'main');
  const other = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-other-'));
  gIn(other, 'clone', '-q', bare, '.');
  fs.writeFileSync(path.join(other, file), content);
  gIn(other, 'add', '-A'); gIn(other, 'commit', '-qm', 'someone else'); gIn(other, 'push', '-q', 'origin', 'main');
  return bare;
}
