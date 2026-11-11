// 0630: the full suite, commands.test_full, which speck run runs on the base branch after ships, so commands.test can be
// the quick tests ships wait for. It runs in a checkout of its own, beside the main checkout, taking a test turn of its
// own beside max_parallel_tests's, so no ship's or build's tests wait for it, and its result is recorded as `speck test`
// records one. speck ship and builds never run it.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SpeckError, sh, git, loadConfig, worktreeList, worktreePath } from './core.mjs';
import { testRun, recordedAt } from './results.mjs';
import { sharedCacheDir } from './turns.mjs';
import { failingTestFiles } from './tap.mjs';

const SCRIPT = fileURLToPath(import.meta.url);

// commands.test_full, or '' when it's blank or missing, which turns the full suite off.
export const fullCommand = cfg => String(cfg?.commands?.test_full ?? '').trim();

// The folder full runs keep their files in: running.json (the run going now), latest.json (the last run's result), told
// (the failing commit speck run's log last named) and run.log (the last run's output).
export const fullDir = repo => sharedCacheDir(repo, 'full');
// Where a full run checks out the base branch: beside the main checkout, as a ticket's worktree is, under a name no
// branch can have.
export const fullCheckout = repo => worktreePath(worktreeList(repo)[0].path, '.full-suite');

const readJson = file => { try { const v = JSON.parse(fs.readFileSync(file, 'utf8')); return v && typeof v === 'object' ? v : null; } catch { return null; } };
const writeJson = (file, v) => { const tmp = `${file}.${process.pid}.tmp`; fs.writeFileSync(tmp, JSON.stringify(v)); fs.renameSync(tmp, file); };
const pidAlive = pid => { if (!Number.isInteger(pid) || pid <= 0) return false; try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
const headOf = (repo, branch) => { const r = sh('git', ['rev-parse', '--verify', '-q', `refs/heads/${branch}^{commit}`], { cwd: repo }); return r.status === 0 ? r.stdout.trim() : ''; };
const names = output => [...new Set(failingTestFiles(output).map(t => t.name).filter(Boolean))];

// The latest full run's result on the base branch: the one recorded for the code its newest commit holds, or else the
// last one found or run (latest.json). { commit, status, tests }, commit being the one it ran on (tests: the failing tests' names, when its output is TAP), or null for none.
export function latestFull(repo, cfg) {
  const cmd = fullCommand(cfg), base = String(cfg.base_branch || '').trim();
  const head = cmd && base ? headOf(repo, base) : '';
  if (!head) return null;
  const kept = recordedAt(repo, cmd, head);
  const file = path.join(fullDir(repo), 'latest.json');
  if (kept) {
    // Kept as the last run's, for a newer commit that has no result yet.
    const r = { commit: kept.commit, status: kept.status, tests: kept.status ? names(kept.output) : [] }, last = readJson(file);
    if (!last || last.cmd !== cmd || last.commit !== r.commit || last.status !== r.status) writeJson(file, { cmd, ...r, at: kept.at });
    return r;
  }
  const last = readJson(file);
  const ok = last && last.cmd === cmd && typeof last.commit === 'string' && Number.isInteger(last.status) && Array.isArray(last.tests);
  return ok ? { commit: last.commit, status: last.status, tests: last.tests.map(String) } : null;
}

// What speck run says of a failing full run: on which commit, and the failing tests or its exit code.
export const failingSays = (base, f) => `The full suite (commands.test_full) failed on ${base} at ${f.commit.slice(0, 7)}: ${f.tests.length ? f.tests.join('; ') : `exit code ${f.status}, and its output names no failing tests`}.`;

// Starts the full run of `commit` from the repo in its own process group, so stopping speck run leaves it running,
// writing to `log`. done(code) is called once as it ends, with its exit code (null for a signal or when it couldn't
// start). Returns its pid, or null.
export function launchFull(repo, commit, log, done) {
  let fd = null, over = false;
  const end = code => { if (!over) { over = true; done(code); } };
  try {
    fd = fs.openSync(log, 'w');
    const child = spawn(process.execPath, [SCRIPT, commit], { cwd: repo, detached: true, stdio: ['ignore', fd, fd] });
    child.on('error', () => end(null));
    child.on('exit', code => end(code));
    child.unref();
    return child.pid ?? null;
  } catch { end(null); return null; } finally { if (fd !== null) fs.closeSync(fd); }
}

// How long speck run waits before running a commit again whose run ended without a result.
export const RETRY_MS = 10 * 60 * 1000;

// speck run's full runs. check(), on each of its checks, starts a full run of the base branch's newest commit when it
// has no recorded result, none is running and this speck run hasn't started one of it in the last retryMs, and says
// once in the log per failing commit that the latest full run failed. view() is what speck run adds to its record for speck status and the
// panel: { full } while the latest full run on the base branch failed, until a run on a newer commit passes.
export function fullSuiteQueue({ repo, readConfig, say = console.log, launch = launchFull, retryMs = RETRY_MS, now = Date.now }) {
  const tried = new Map(); // each commit this speck run started a run of, and when
  let failing = null;
  const check = () => {
    let cfg;
    try { cfg = readConfig(); } catch { return; }
    const cmd = fullCommand(cfg), base = String(cfg.base_branch || '').trim();
    if (!cmd || !base) { failing = null; return; }
    const dir = fullDir(repo), latest = latestFull(repo, cfg);
    failing = latest && latest.status !== 0 ? { base, ...latest } : null;
    const told = path.join(dir, 'told');
    if (failing && (() => { try { return fs.readFileSync(told, 'utf8').trim(); } catch { return ''; } })() !== failing.commit) {
      say(failingSays(base, failing));
      fs.writeFileSync(told, failing.commit);
    }
    const head = headOf(repo, base);
    if (!head || recordedAt(repo, cmd, head) || now() - (tried.get(head) ?? -Infinity) < retryMs) return;
    const running = path.join(dir, 'running.json'), going = readJson(running);
    if (going && pidAlive(going.pid)) return;
    tried.set(head, now());
    const log = path.join(dir, 'run.log');
    say(`Running the full suite (commands.test_full) on ${base} at ${head.slice(0, 7)}, in a checkout of its own. Log: ${path.relative(repo, log)}`);
    let pid = null; // a launch that fails to start ends before it's known
    pid = launch(repo, head, log, code => {
      try { // it ends outside any check, where a throw would stop speck run
        if (pid !== null && readJson(running)?.pid === pid) fs.rmSync(running, { force: true });
        if (code !== 0 && code !== 1 && !recordedAt(repo, cmd, head)) {
          let tail = '';
          try { tail = fs.readFileSync(log, 'utf8').trim().split('\n').pop(); } catch { /* nothing written */ }
          say(`The full suite on ${base} at ${head.slice(0, 7)} ended without a result${tail ? `: ${tail}` : ''}. speck run tries it again in ${Math.round(retryMs / 60000)} minutes, or sooner on a newer commit.`);
        }
      } catch (e) { say(`speck run couldn't check how the full suite on ${base} at ${head.slice(0, 7)} ended (${e.message}).`); }
    });
    if (pid) writeJson(running, { pid, commit: head, started: new Date().toISOString() });
  };
  return { check, view: () => (failing ? { full: failing } : {}) };
}

// Runs commands.test_full on `commit` in the full run's own checkout, made afresh there, after worktree_setup, and
// records the result as `speck test` does, in latest.json too. Exits 0 when it passed and 1 when it failed.
export function runFull(repo, commit) {
  const cfg = loadConfig(repo), cmd = fullCommand(cfg);
  if (!cmd) throw new SpeckError('commands.test_full is blank in speck/config.yml, so there is no full suite to run.');
  const at = fullCheckout(repo);
  git(['worktree', 'prune'], repo); // one whose folder has gone
  const ours = worktreeList(repo).some(w => w.path === at);
  if (ours) git(['worktree', 'remove', '--force', at], repo);
  else if (fs.existsSync(at)) throw new SpeckError(`There's a folder at ${at} that isn't speck's full-suite checkout. Move or remove it, and speck run runs the full suite there on its next try.`);
  fs.mkdirSync(path.dirname(at), { recursive: true });
  git(['worktree', 'add', '-q', '--detach', at, commit], repo);
  try {
    const setup = String(cfg.worktree_setup || '').trim();
    if (setup) {
      console.log(`Running worktree_setup in the full suite's checkout: ${setup}`);
      const r = sh('sh', ['-c', setup], { cwd: at, stdio: 'inherit' });
      if (r.status !== 0) throw new SpeckError(`worktree_setup (${setup}) failed with exit ${r.status}, so the full suite didn't run.`);
    }
    const r = testRun(at, cfg, cmd, { reuse: 'any', branch: `${cfg.base_branch} (full suite)`, lane: 'full' });
    if (r.signal || !Number.isInteger(r.status)) throw new SpeckError(`The full suite was stopped${r.signal ? ` by ${r.signal}` : ''}, so it has no result.`);
    writeJson(path.join(fullDir(repo), 'latest.json'), { cmd, commit, status: r.status, tests: r.status ? names(r.output) : [], at: new Date().toISOString() });
    return r.status === 0 ? 0 : 1;
  } finally { sh('git', ['worktree', 'remove', '--force', at], { cwd: repo }); }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try { process.exitCode = runFull(process.cwd(), process.argv[2]); } catch (e) {
    console.error(e instanceof SpeckError ? e.message : String(e?.stack || e));
    process.exitCode = 2;
  }
}
