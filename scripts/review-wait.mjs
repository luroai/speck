// 0384: a review round runs in a process of its own, so it can outlast the builder's shell, which ends a command after
// 10 minutes. `speck review` starts it and waits up to 9 minutes for it: if it's still running then, it exits 12, and
// `speck review <id> --wait` waits for the same round again. Whichever command sees it end prints what the round
// printed and exits as it did. Its working files are kept with the review's others (cacheDir).
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SpeckError } from './core.mjs';
import { cacheDir } from './review.mjs';
import { pidAlive } from './run-switch.mjs';

const CLI = fileURLToPath(new URL('./speck.mjs', import.meta.url));
export const STILL_RUNNING = 12;
const POLL_MS = 25;

// How long one command waits for a round, in ms: 9 minutes, a minute inside the builder's shell limit.
// SPECK_REVIEW_WAIT_MS sets it directly, for speck's own tests.
export function reviewWaitMs() {
  const ms = Number(process.env.SPECK_REVIEW_WAIT_MS);
  return Number.isSafeInteger(ms) && ms > 0 ? ms : 9 * 60 * 1000;
}

const files = (repo, id) => {
  const dir = cacheDir(repo, id);
  return { run: path.join(dir, 'review-run.json'), out: path.join(dir, 'review-run.out'), err: path.join(dir, 'review-run.err'), done: path.join(dir, 'review-run.done.json') };
};
const readJson = file => { try { const v = JSON.parse(fs.readFileSync(file, 'utf8')); return v && typeof v === 'object' ? v : null; } catch { return null; } };
const clear = f => { for (const file of Object.values(f)) fs.rmSync(file, { force: true }); };
const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
// A round's process that is still there. One started longer ago than its reviewer could run (twice the time limit, as a
// resumed session that fails is run again fresh, and two minutes more) has gone, and its pid is another process's now.
const running = (run, limitMs) => pidAlive(run.pid) && !(Date.parse(run.started) < Date.now() - 2 * limitMs - 120000);

// The round started for ticket `id` and not yet printed: { round, pid }, or null. One whose process has gone without
// finishing counts too, so the waiting command can say so.
export function pendingRound(repo, id) {
  const f = files(repo, id);
  const run = readJson(f.run);
  return run || fs.existsSync(f.done) ? { round: run?.round ?? null, pid: run?.pid ?? null } : null;
}

// Starts round `round` of ticket `id` in a process of its own, `speck review <id> <args> --worker`, that runs it as
// `speck review` always has, its output kept in files. Returns false, starting nothing, if a round is already running.
export function startRound(repo, id, round, args, limitMs) {
  const f = files(repo, id);
  const live = readJson(f.run);
  if (live && (fs.existsSync(f.done) || running(live, limitMs))) return false;
  clear(f);
  try { fs.writeFileSync(f.run, JSON.stringify({ round, pid: process.pid, started: new Date().toISOString() }) + '\n', { flag: 'wx' }); } catch (e) { if (e.code === 'EEXIST') return false; throw e; }
  const out = fs.openSync(f.out, 'w'), err = fs.openSync(f.err, 'w');
  try {
    const child = spawn(process.execPath, [CLI, 'review', id, ...args, '--worker'], { cwd: process.cwd(), env: process.env, detached: true, stdio: ['ignore', out, err] });
    child.on('error', () => {});
    child.unref();
    if (!child.pid) { clear(f); throw new SpeckError(`Couldn't start review round ${round} of ${id}. No round was recorded. Run it again.`); }
    fs.writeFileSync(f.run, JSON.stringify({ round, pid: child.pid, started: new Date().toISOString() }) + '\n');
  } finally { fs.closeSync(out); fs.closeSync(err); }
  return true;
}

// In the round's own process: keeps its exit code for the command that prints its output.
export function keepExitCode(repo, id) {
  const f = files(repo, id);
  process.on('exit', code => { try { fs.writeFileSync(f.done, JSON.stringify({ code }) + '\n'); } catch { /* the waiting command says the round stopped */ } });
}

// Waits until `deadline` (a time in ms) for ticket `id`'s round, whose reviewer has `limitMs` to run. Once it has ended, prints what it printed and sets
// the exit code it ended with. If it's still running then, says so and how to wait for it, and sets 12.
export function waitForRound(repo, id, deadline, limitMs) {
  const f = files(repo, id);
  for (;;) {
    const run = readJson(f.run);
    const done = readJson(f.done);
    if (done) return deliver(f, done);
    if (!run) throw new SpeckError(`No review round of ${id} is running or waiting to be read. Run \`speck next ${id}\` to see what to do next.`);
    if (!running(run, limitMs)) {
      sleep(POLL_MS); // it may have just finished
      const late = readJson(f.done);
      if (late) return deliver(f, late);
      clear(f);
      throw new SpeckError(`Review round ${run.round} of ${id} stopped before it finished, and no round was recorded. Run \`speck review ${id}\` to run it again.`);
    }
    const left = deadline - Date.now();
    if (left <= 0) {
      console.log(`Round ${run.round} of ${id} is still running. Its reviewer carries on until it finishes or reaches review_timeout_minutes. Wait for it in the foreground with \`speck review ${id} --wait\`, and run that again each time it exits ${STILL_RUNNING}, until it exits with another code.`);
      process.exitCode = STILL_RUNNING;
      return;
    }
    sleep(Math.min(POLL_MS, left));
  }
}

function deliver(f, done) {
  const read = file => { try { return fs.readFileSync(file, 'utf8'); } catch { return ''; } };
  const out = read(f.out), err = read(f.err);
  clear(f);
  if (out) process.stdout.write(out);
  if (err) process.stderr.write(err);
  process.exitCode = Number.isInteger(done.code) ? done.code : 1;
}
