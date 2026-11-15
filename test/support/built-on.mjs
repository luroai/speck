// 0674: a repo where ticket 0002 is built and approved in its own worktree, and ticket 0001 waits for it in after:.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { env, runRepo } from './run.mjs';
import { speck } from './cli.mjs';
import { approveVerdict } from './speck.mjs';
import { keepLatestReceipt } from './receipts.mjs';

export const speckIn = (dir, ...a) => speck(dir, env, ...a);
export const gitIn = (dir, ...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', env }).stdout.trim();
// The folder `speck start` printed on its last line.
export const startedAt = res => res.stdout.trim().split('\n').pop();

// Commits `file` with `lines` lines in `dir`.
export function commitFile(dir, file, lines) {
  fs.writeFileSync(path.join(dir, file), Array.from({ length: lines }, (_, i) => `${file} ${i}`).join('\n') + '\n');
  gitIn(dir, 'add', file);
  gitIn(dir, 'commit', '-qm', `add ${file}`);
}

// Records an approving round for `id` in `dir` and sets it approved, as speck close leaves it.
export function approve(dir, id) {
  const v = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-verdict-')), 'v.json');
  fs.writeFileSync(v, JSON.stringify(approveVerdict));
  assert.equal(speckIn(dir, 'record', id, v).status, 0);
  keepLatestReceipt(dir, id);
  assert.equal(speckIn(dir, 'set', id, 'status', 'approved').status, 0);
  gitIn(dir, 'add', '-A', '--', 'speck/tickets');
  gitIn(dir, 'commit', '-qm', `speck(${id}): approved`);
}

// 0002 started in its worktree with a.txt (`aLines` lines) and z.txt committed and approved, unless `status` says otherwise.
// `tickets` replaces the default 0001 (after 0002) and 0002 pair. 0001 starts as a draft, and is set ready with a
// new outcome on the base branch only once 0002 has started, so 0002's branch has an older copy of it.
export const READY_OUTCOME = 'Users can export CSV, as set ready.';
export function builtOnRepo({ status = 'approved', tickets, aLines = 3 } = {}) {
  const r = runRepo({ tickets: tickets ?? [['0001', { after: '["0002"]', status: 'draft' }], ['0002', {}]], worktrees: 'true' });
  const cfg = fs.readFileSync(r.cfgFile, 'utf8').replace(/^  test: .*$/m, '  test: "true"');
  fs.writeFileSync(r.cfgFile, cfg);
  gitIn(r.dir, 'commit', '-qam', 'tests pass');
  const res = speckIn(r.dir, 'start', '0002');
  assert.equal(res.status, 0, res.stderr);
  const second = startedAt(res);
  const first = path.join(r.dir, 'speck', 'tickets', '0001-t.md');
  if (fs.existsSync(first)) {
    fs.writeFileSync(first, fs.readFileSync(first, 'utf8').replace(/^status: draft/m, 'status: ready').replace('Users can export CSV.', READY_OUTCOME));
    gitIn(r.dir, 'commit', '-qam', 'speck(0001): ready');
  }
  commitFile(second, 'a.txt', aLines);
  commitFile(second, 'z.txt', 3);
  if (status === 'approved') approve(second, '0002');
  else if (status !== 'building') {
    assert.equal(speckIn(second, 'set', '0002', 'status', status).status, 0);
    gitIn(second, 'commit', '-qam', `speck(0002): ${status}`);
  }
  return { ...r, second };
}
