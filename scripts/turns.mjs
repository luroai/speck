// Turns at running the test suite (0109). Builds work in parallel, but no more than max_parallel_tests full test runs
// go at once in a repo, from any of its worktrees, so a heavy suite can't run the machine out of memory.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { SpeckError, sh, findRepoRoot, loadConfig, worktreeList } from './core.mjs';
import { testRun } from './results.mjs';

const POLL_MS = 500;
const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const pidAlive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };

export function maxParallelTests(cfg) {
  const max = cfg.max_parallel_tests ?? 1;
  if (!Number.isInteger(max) || max < 1)
    throw new SpeckError(`max_parallel_tests in speck/config.yml must be a whole number of 1 or more (got ${JSON.stringify(max)}). Fix it with \`speck config set max_parallel_tests 1\`, then run this again.`);
  return max;
}

// A folder `name` in the main checkout's speck/.cache/ (which git ignores), so every worktree shares it.
export function sharedCacheDir(repo, name) {
  let main = repo;
  try { main = worktreeList(repo)[0]?.path || repo; } catch { /* not a git checkout: this one */ }
  const root = path.join(main, 'speck', '.cache');
  const dir = path.join(root, name);
  fs.mkdirSync(dir, { recursive: true });
  const ignore = path.join(root, '.gitignore');
  if (!fs.existsSync(ignore)) fs.writeFileSync(ignore, '# Working files for reviews in progress. Review history is in each ticket.\n*\n');
  return dir;
}

// The queue's folder.
const turnsDir = repo => sharedCacheDir(repo, 'tests');

const read = f => { try { return fs.readFileSync(f, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } };
const parse = text => { try { const v = JSON.parse(text); return v && typeof v === 'object' ? v : {}; } catch { return {}; } };
const alive = pid => Number.isInteger(pid) && pid > 0 && pidAlive(pid);
// A run's files beside its claim: the pid of the shell running its tests, and the folder that shell makes just before
// starting them.
const runFiles = (dir, run) => (typeof run === 'string' && /^[0-9a-f-]+$/.test(run)
  ? { pid: path.join(dir, `run.${run}.pid`), started: path.join(dir, `run.${run}.started`) } : null);

// The shell that runs the tests: it records its pid, makes the started folder, then becomes the test command's shell,
// as `sh -c <cmd>` would run it. If the started folder is already there, a waiter has taken the turn over from this run,
// so it stops without running anything.
export const TEST_SHELL = 'printf %s "$$" > "$1" && mkdir "$2" 2>/dev/null && exec sh -c "$3"';
// The same, keeping a copy of the output in file $4 (0112). Node ($6) runs the test command and writes how it ended to
// file $5: its exit code, or `signal <name>` if a signal stopped it, which a shell's $? can't tell from an exit code.
// The shell whose pid it records waits for the tests, so it's alive while they run.
const ENDED = 'const r = require("child_process").spawnSync("sh", ["-c", process.argv[1]], { stdio: "inherit" });'
  + ' require("fs").writeFileSync(process.argv[2], r.signal ? `signal ${r.signal}` : String(r.status)); process.exit(r.status ?? 1);';
export const TEST_SHELL_KEPT = `printf %s "$$" > "$1" && mkdir "$2" 2>/dev/null && "$6" -e '${ENDED}' "$3" "$5" 2>&1 | tee "$4"`;

// Whether a claim on a turn is held: while the speck process that made it is alive, or the shell running its tests
// is, so tests left running by a speck process that was killed still hold it. A claim that can't be read as one is
// free. When the speck process has gone and its tests haven't started, this makes the started folder itself, so they
// never can: either that or the shell's mkdir comes first, never both.
function held(dir, text) {
  const { pid, run } = parse(text);
  if (alive(pid)) return true;
  const files = runFiles(dir, run);
  if (!files) return false;
  try { fs.mkdirSync(files.started); return false; } catch (e) { if (e.code !== 'EEXIST') throw e; }
  return alive(Number(read(files.pid)));
}

// Removes a claim. Our own run's files go with it, once its shell has ended. Another run's started folder stays, as
// its shell might still be about to make it: run files no claim names are cleared once they're a day old.
const forget = (file, text, own = false) => {
  fs.rmSync(file, { force: true });
  const files = own && runFiles(path.dirname(file), parse(text).run);
  if (files) { fs.rmSync(files.pid, { force: true }); fs.rmSync(files.started, { recursive: true, force: true }); }
};
const DAY_MS = 24 * 60 * 60 * 1000;

// The claims on turn `n`, oldest first. Each is a file slot-<n>.g<k>.lock, numbered so that two runs taking over the
// same turn at once can't both link the same claim.
function claims(dir, n) {
  const re = new RegExp(`^slot-${n}\\.g(\\d+)\\.lock$`);
  return fs.readdirSync(dir).flatMap(f => { const m = f.match(re); return m ? [{ k: Number(m[1]), file: path.join(dir, f) }] : []; })
    .sort((a, b) => a.k - b.k);
}

// Links our claim file `mine` as claim number k on turn n, which is atomic, so nobody sees half a file. The claim is
// kept only if no other claim on the turn is held, however it's numbered, so a run that claimed from a listing already
// out of date backs off. Two runs that claim at once may both back off, but never both keep their claims. Returns the
// claim's file, or null.
export function claimTurn(dir, n, k, mine) {
  const file = path.join(dir, `slot-${n}.g${k}.lock`);
  try { fs.linkSync(mine, file); } catch (e) { if (e.code === 'EEXIST') return null; throw e; }
  const others = claims(dir, n).filter(c => c.file !== file).map(c => ({ ...c, text: read(c.file) })).filter(c => c.text !== null);
  if (others.some(c => held(dir, c.text))) { fs.rmSync(file, { force: true }); return null; }
  // The others are of no use now: clear them.
  for (const c of others) if (read(c.file) === c.text) forget(c.file, c.text);
  return file;
}

// Claims turn `n` if it's free, as the next number after its latest claim.
function takeTurn(dir, n, mine) {
  const top = claims(dir, n).at(-1);
  if (top) { const text = read(top.file); if (text !== null && held(dir, text)) return null; }
  return claimTurn(dir, n, top ? top.k + 1 : 0, mine);
}

// The runs holding turns, for the message saying what a run waits for.
function holders(dir, max) {
  const out = [];
  for (let n = 0; n < max; n++) {
    const top = claims(dir, n).at(-1);
    const text = top && read(top.file);
    if (text && held(dir, text)) { const { pid, cwd } = parse(text); out.push(`process ${pid}${typeof cwd === 'string' ? ` in ${cwd}` : ''}`); }
  }
  return out;
}

// Runs the test command `cmd` in `repo` once this process has a turn, waiting for one if max_parallel_tests runs are
// already going, and frees the turn afterwards. A turn left by a run that was killed is freed when someone next needs
// it. onStart runs once the turn is ours. With `keep` ({ output, exit }: two file paths), the output, stdout and
// stderr together, is copied to keep.output and the exit code written to keep.exit. Returns spawnSync's result.
export function runTestsInTurn(repo, cfg, cmd, onStart = () => {}, keep = null) {
  const max = maxParallelTests(cfg);
  const dir = turnsDir(repo);
  const run = crypto.randomUUID();
  const text = JSON.stringify({ pid: process.pid, cwd: repo, run });
  // Files left by speck processes that were killed: claim files made while waiting, and old files of killed runs.
  const named = new Set(fs.readdirSync(dir).filter(f => f.endsWith('.lock')).map(f => parse(read(path.join(dir, f))).run));
  for (const f of fs.readdirSync(dir)) {
    const m = f.match(/^turn\.(\d+)\..*\.tmp$/), r = f.match(/^run\.([0-9a-f-]+)\.(pid|started)$/);
    const old = () => { try { return Date.now() - fs.statSync(path.join(dir, f)).mtimeMs > DAY_MS; } catch { return false; } };
    if ((m && !alive(Number(m[1]))) || (r && !named.has(r[1]) && old())) fs.rmSync(path.join(dir, f), { recursive: true, force: true });
  }
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
      sleep(POLL_MS * (0.5 + Math.random())); // spread out, so runs that backed off together don't clash again
    }
  } finally { fs.rmSync(mine, { force: true }); }
  const files = runFiles(dir, run);
  try {
    onStart();
    const shell = keep ? [TEST_SHELL_KEPT, 'sh', files.pid, files.started, cmd, keep.output, keep.exit, process.execPath] : [TEST_SHELL, 'sh', files.pid, files.started, cmd];
    return sh('sh', ['-c', ...shell], { cwd: repo, stdio: 'inherit' });
  } finally {
    if (read(lock) === text) forget(lock, text, true);
  }
}

// `speck test`: runs commands.test in this checkout when it has a turn, and exits with its exit code. A result recorded
// for the same code is reused instead, unless --fresh.
export function cmdTest(args) {
  const fresh = args.length === 1 && args[0] === '--fresh';
  if (args.length && !fresh) throw new SpeckError('Usage: speck test [--fresh]');
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const cmd = (cfg.commands?.test || '').trim();
  if (!cmd) throw new SpeckError('No test command is set. Set commands.test in speck/config.yml (for example `speck config set commands.test "npm test"`), then run this again.');
  const r = testRun(repo, cfg, cmd, { reuse: fresh ? 'none' : 'any', hint: ' Run `speck test --fresh` to run the suite anyway.' });
  if (r.status !== 0) throw new SpeckError(r.signal ? `The tests were stopped by ${r.signal}.` : '', r.status ?? 1);
}
