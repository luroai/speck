// Turns at running the test suite (0109). Builds work in parallel, but no more than max_parallel_tests full test runs
// go at once in a repo, from any of its worktrees, so a heavy suite can't run the machine out of memory.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { SpeckError, sh, findRepoRoot, loadConfig, worktreeList } from './core.mjs';

const POLL_MS = 500;
const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const pidAlive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };

export function maxParallelTests(cfg) {
  const max = cfg.max_parallel_tests ?? 1;
  if (!Number.isInteger(max) || max < 1)
    throw new SpeckError(`max_parallel_tests in speck/config.yml must be a whole number of 1 or more (got ${JSON.stringify(max)}). Fix it with \`speck config set max_parallel_tests 1\`, then run this again.`);
  return max;
}

// The queue's folder, in the main checkout's speck/.cache/ (which git ignores), so every worktree shares it.
function turnsDir(repo) {
  let main = repo;
  try { main = worktreeList(repo)[0]?.path || repo; } catch { /* not a git checkout: this one */ }
  const root = path.join(main, 'speck', '.cache');
  const dir = path.join(root, 'tests');
  fs.mkdirSync(dir, { recursive: true });
  const ignore = path.join(root, '.gitignore');
  if (!fs.existsSync(ignore)) fs.writeFileSync(ignore, '# Working files for reviews in progress. Review history is in each ticket.\n*\n');
  return dir;
}

const read = f => { try { return fs.readFileSync(f, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } };
const parse = text => { try { const v = JSON.parse(text); return v && typeof v === 'object' ? v : {}; } catch { return {}; } };
// A turn file whose process is alive. One that can't be read as a turn, or whose process has gone, is free to take.
const busy = text => { const { pid } = parse(text); return Number.isInteger(pid) && pid > 0 && pidAlive(pid); };

// Takes turn `n` if it's free: true when it's ours. A turn is the file slot-<n>.lock, holding the pid and folder of the
// process that took it. Our file is made complete and then linked into place, which is atomic, so nobody sees half of
// it. A turn whose process has gone is taken over, but only while holding slot-<n>.recover, so two waiters can't both
// take over the same one.
function takeTurn(dir, n, mine) {
  const lock = path.join(dir, `slot-${n}.lock`), recover = path.join(dir, `slot-${n}.recover`);
  const link = to => { try { fs.linkSync(mine, to); return true; } catch (e) { if (e.code === 'EEXIST') return false; throw e; } };
  if (link(lock)) return true;
  const held = read(lock);
  if (held === null) return link(lock); // freed just now
  if (busy(held)) return false;
  if (!link(recover)) {
    // A waiter that died while taking over leaves its recovery file behind: clear it so the next try can go ahead.
    const other = read(recover);
    if (other !== null && !busy(other) && read(recover) === other) fs.rmSync(recover, { force: true });
    return false;
  }
  try {
    if (read(lock) === held) fs.rmSync(lock, { force: true });
    return link(lock);
  } finally { fs.rmSync(recover, { force: true }); }
}

// The turns being held, for the message saying what a run waits for.
function holders(dir, max) {
  const out = [];
  for (let n = 0; n < max; n++) {
    const text = read(path.join(dir, `slot-${n}.lock`));
    if (text !== null && busy(text)) { const { pid, cwd } = parse(text); out.push(`process ${pid}${typeof cwd === 'string' ? ` in ${cwd}` : ''}`); }
  }
  return out;
}

// Runs fn once this process has a turn, waiting for one if max_parallel_tests runs are already going, and frees the
// turn afterwards. A turn left by a process that was killed is freed when someone next needs it.
export function withTestTurn(repo, cfg, fn) {
  const max = maxParallelTests(cfg);
  const dir = turnsDir(repo);
  const text = JSON.stringify({ pid: process.pid, cwd: repo });
  const mine = path.join(dir, `turn.${process.pid}.${crypto.randomUUID()}.tmp`);
  fs.writeFileSync(mine, text);
  let lock = null, said = false;
  try {
    for (;;) {
      for (let n = 0; n < max && !lock; n++) if (takeTurn(dir, n, mine)) lock = path.join(dir, `slot-${n}.lock`);
      if (lock) break;
      if (!said) {
        const going = holders(dir, max);
        console.log(`Waiting for a turn to run the tests: max_parallel_tests is ${max}, and ${going.length === 1 ? 'a run is' : `${going.length || max} runs are`} already going${going.length ? ` (${going.join('; ')})` : ''}. This run starts when one ends.`);
        said = true;
      }
      sleep(POLL_MS);
    }
  } finally { fs.rmSync(mine, { force: true }); }
  try { return fn(); } finally { if (read(lock) === text) fs.rmSync(lock, { force: true }); }
}

// `speck test`: runs commands.test in this checkout when it has a turn, and exits with its exit code.
export function cmdTest(args) {
  if (args.length) throw new SpeckError('Usage: speck test');
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const cmd = (cfg.commands?.test || '').trim();
  if (!cmd) throw new SpeckError('No test command is set. Set commands.test in speck/config.yml (for example `speck config set commands.test "npm test"`), then run this again.');
  const r = withTestTurn(repo, cfg, () => sh('sh', ['-c', cmd], { cwd: repo, stdio: 'inherit' }));
  if (r.status !== 0) throw new SpeckError(r.signal ? `The tests were stopped by ${r.signal}.` : '', r.status ?? 1);
}
