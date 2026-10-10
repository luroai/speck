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
const alive = pid => Number.isInteger(pid) && pid > 0 && pidAlive(pid);
const runFile = (dir, run) => (typeof run === 'string' && /^[0-9a-f-]+$/.test(run) ? path.join(dir, `run.${run}.pid`) : null);

// A claim on a turn is held while the speck process that made it is alive, or the shell running its tests is: that
// shell writes its pid to run.<run>.pid, so tests left running by a speck process that was killed still hold it. A
// claim that can't be read as one, or whose processes have both gone, is free to take over.
function busy(dir, text) {
  const { pid, run } = parse(text);
  if (alive(pid)) return true;
  const file = runFile(dir, run);
  return !!file && alive(Number(read(file)));
}

// The claims on turn `n`, oldest first. Each is a file slot-<n>.g<k>.lock, and the turn belongs to the one with the
// highest k.
function claims(dir, n) {
  const re = new RegExp(`^slot-${n}\\.g(\\d+)\\.lock$`);
  return fs.readdirSync(dir).flatMap(f => { const m = f.match(re); return m ? [{ k: Number(m[1]), file: path.join(dir, f) }] : []; })
    .sort((a, b) => a.k - b.k);
}

// Claims turn `n` if it's free, returning the claim's file, or null. Our claim file is made complete and then linked
// into place as the next claim, which is atomic, so only one process gets each number and nobody sees half a file.
// Nothing ever deletes a claim that's in use: a turn whose processes have gone is taken over by claiming the next
// number. A process that claimed from a listing already out of date finds a later claim afterwards and withdraws.
function takeTurn(dir, n, mine) {
  const all = claims(dir, n);
  const top = all.at(-1);
  if (top) { const text = read(top.file); if (text !== null && busy(dir, text)) return null; }
  const k = top ? top.k + 1 : 0;
  const file = path.join(dir, `slot-${n}.g${k}.lock`);
  try { fs.linkSync(mine, file); } catch (e) { if (e.code === 'EEXIST') return null; throw e; }
  if (claims(dir, n).some(c => c.k > k)) { fs.rmSync(file, { force: true }); return null; }
  // Older claims are of no use now: clear those whose processes have gone.
  for (const c of all) {
    const text = read(c.file);
    if (text === null || busy(dir, text)) continue;
    fs.rmSync(c.file, { force: true });
    const run = runFile(dir, parse(text).run);
    if (run) fs.rmSync(run, { force: true });
  }
  return file;
}

// The runs holding turns, for the message saying what a run waits for.
function holders(dir, max) {
  const out = [];
  for (let n = 0; n < max; n++) {
    const top = claims(dir, n).at(-1);
    const text = top && read(top.file);
    if (text && busy(dir, text)) { const { pid, cwd } = parse(text); out.push(`process ${pid}${typeof cwd === 'string' ? ` in ${cwd}` : ''}`); }
  }
  return out;
}

// Runs the test command `cmd` in `repo` once this process has a turn, waiting for one if max_parallel_tests runs are
// already going, and frees the turn afterwards. A turn left by a run that was killed is freed when someone next needs
// it. onStart runs once the turn is ours. Returns spawnSync's result.
export function runTestsInTurn(repo, cfg, cmd, onStart = () => {}) {
  const max = maxParallelTests(cfg);
  const dir = turnsDir(repo);
  const run = crypto.randomUUID();
  const text = JSON.stringify({ pid: process.pid, cwd: repo, run });
  // Files left by speck processes killed while waiting.
  for (const f of fs.readdirSync(dir)) { const m = f.match(/^turn\.(\d+)\..*\.tmp$/); if (m && !alive(Number(m[1]))) fs.rmSync(path.join(dir, f), { force: true }); }
  const mine = path.join(dir, `turn.${process.pid}.${run}.tmp`);
  fs.writeFileSync(mine, text);
  let lock = null, said = false;
  try {
    for (;;) {
      for (let n = 0; n < max && !lock; n++) lock = takeTurn(dir, n, mine);
      if (lock) break;
      if (!said) {
        const going = holders(dir, max);
        console.log(`Waiting for a turn to run the tests: max_parallel_tests is ${max}, and ${going.length === 1 ? 'a run is' : `${going.length || max} runs are`} already going${going.length ? ` (${going.join('; ')})` : ''}. This run starts when one ends.`);
        said = true;
      }
      sleep(POLL_MS);
    }
  } finally { fs.rmSync(mine, { force: true }); }
  const pids = runFile(dir, run);
  try {
    onStart();
    // The shell records its pid, then becomes the test command's shell, as `sh -c <cmd>` would run it.
    return sh('sh', ['-c', 'printf %s "$$" > "$1" && exec sh -c "$2"', 'sh', pids, cmd], { cwd: repo, stdio: 'inherit' });
  } finally {
    if (read(lock) === text) fs.rmSync(lock, { force: true });
    fs.rmSync(pids, { force: true });
  }
}

// `speck test`: runs commands.test in this checkout when it has a turn, and exits with its exit code.
export function cmdTest(args) {
  if (args.length) throw new SpeckError('Usage: speck test');
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const cmd = (cfg.commands?.test || '').trim();
  if (!cmd) throw new SpeckError('No test command is set. Set commands.test in speck/config.yml (for example `speck config set commands.test "npm test"`), then run this again.');
  const r = runTestsInTurn(repo, cfg, cmd);
  if (r.status !== 0) throw new SpeckError(r.signal ? `The tests were stopped by ${r.signal}.` : '', r.status ?? 1);
}
