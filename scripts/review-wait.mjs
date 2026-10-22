// 0384: a review round runs in a process of its own, so it can outlast the builder's shell, which ends a command after
// 10 minutes. `speck review` starts it and waits up to 9 minutes for it: if it's still running then, it exits 12, and
// `speck review <id> --wait` waits for the same round again. Whichever command sees it end prints what the round
// printed and exits as it did. Its working files are kept with the review's others (cacheDir).
//
// Each start is numbered: review-run-<n>.json, made only if no file of that number exists yet, so two commands that
// start at once can't both start a reviewer. The highest number is the current one, and nothing deletes it: a start
// supersedes it with the next number, and the files of every earlier one are removed then.
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

// The files of start `n`: its record ({ round, pid, started }), its output, its exit code once it has ended, and the
// marker that a command has printed it.
const filesOf = (dir, n) => Object.fromEntries(['json', 'out', 'err', 'done.json', 'read'].map(ext => [ext.split('.')[0], path.join(dir, `review-run-${n}.${ext}`)]));
const startsIn = dir => { try { return fs.readdirSync(dir).map(n => n.match(/^review-run-(\d+)\.json$/)?.[1]).filter(Boolean).map(Number); } catch { return []; } };
const readJson = file => { try { const v = JSON.parse(fs.readFileSync(file, 'utf8')); return v && typeof v === 'object' ? v : null; } catch { return null; } };
const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
// A round's process that is still there. One started longer ago than its reviewer could run (twice the time limit, as a
// resumed session that fails is run again fresh, and two minutes more) has gone, and its pid is another process's now.
const running = (rec, limitMs) => pidAlive(rec.pid) && !(Date.parse(rec.started) < Date.now() - 2 * limitMs - 120000);

// Writes `value` to `file` whole, so a reader never sees it half written: with `create`, only if `file` isn't there yet,
// returning false if it is.
function publish(file, value, create = false) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value) + '\n');
  try {
    if (!create) { fs.renameSync(tmp, file); return true; }
    try { fs.linkSync(tmp, file); return true; } catch (e) { if (e.code === 'EEXIST') return false; throw e; }
  } finally { fs.rmSync(tmp, { force: true }); }
}

// Ticket `id`'s current start, or start `n`, if no command has printed it yet: { n, files, rec, done }, or null.
function current(repo, id, n = Math.max(0, ...startsIn(cacheDir(repo, id)))) {
  const dir = cacheDir(repo, id);
  if (!n) return null;
  const files = filesOf(dir, n);
  if (fs.existsSync(files.read)) return null;
  return { n, files, rec: readJson(files.json), done: readJson(files.done) };
}

// True when ticket `id`'s current start, or start `n`, is a round running, or one that has ended and not been printed.
export function pendingRound(repo, id, limitMs, n) {
  const c = current(repo, id, n);
  return !!c && (!!c.done || (!!c.rec && running(c.rec, limitMs)));
}

// Claims start `n` of ticket `id` for round `round`, recording this process. False if another command claimed it first.
export function claimStart(repo, id, n, round) {
  return publish(filesOf(cacheDir(repo, id), n).json, { round, pid: process.pid, started: new Date().toISOString() }, true);
}

// Starts round `round` of ticket `id` in a process of its own, `speck review <id> <args> --worker=<n>`, that runs it
// as `speck review` always has, its output kept in files. Starts nothing if a round is pending or another command
// starts one first: the caller then waits for that one.
export function startRound(repo, id, round, args, limitMs) {
  // The number to claim comes from the same look as the check, so a command that started one since makes the claim fail.
  const dir = cacheDir(repo, id);
  const last = Math.max(0, ...startsIn(dir));
  if (pendingRound(repo, id, limitMs, last)) return;
  const n = last + 1;
  if (!claimStart(repo, id, n, round)) return;
  for (const old of startsIn(dir).filter(m => m < n)) for (const file of Object.values(filesOf(dir, old))) fs.rmSync(file, { force: true });
  const files = filesOf(dir, n);
  const out = fs.openSync(files.out, 'w'), err = fs.openSync(files.err, 'w');
  try {
    const child = spawn(process.execPath, [CLI, 'review', id, ...args, `--worker=${n}`], { cwd: process.cwd(), env: process.env, detached: true, stdio: ['ignore', out, err] });
    child.on('error', () => {});
    child.unref();
    if (!child.pid) throw new SpeckError(`Couldn't start review round ${round} of ${id}. No round was recorded. Run it again.`);
    publish(files.json, { round, pid: child.pid, started: new Date().toISOString() });
  } finally { fs.closeSync(out); fs.closeSync(err); }
}

// In the round's own process, start `n`: keeps its exit code for the command that prints its output.
export function keepExitCode(repo, id, n) {
  const file = filesOf(cacheDir(repo, id), n).done;
  process.on('exit', code => { try { publish(file, { code }); } catch { /* the waiting command says the round stopped */ } });
}

// Waits until `deadline` (a time in ms) for ticket `id`'s round, whose reviewer has `limitMs` to run. Once it has
// ended, prints what it printed and sets the exit code it ended with. If it's still running then, says so and how to
// wait for it, and sets 12. Only one command prints a round: the one that marks it read first.
export function waitForRound(repo, id, deadline, limitMs) {
  for (;;) {
    const c = current(repo, id);
    if (!c) throw new SpeckError(`No review round of ${id} is running or waiting to be read. Run \`speck next ${id}\` to see what to do next.`);
    const claim = () => publish(c.files.read, {}, true);
    if (c.done) { if (claim()) return deliver(c.files, c.done); continue; }
    if (!c.rec || !running(c.rec, limitMs)) {
      sleep(POLL_MS); // it may have just finished
      if (readJson(c.files.done) || !claim()) continue;
      throw new SpeckError(`Review round ${c.rec?.round ?? '?'} of ${id} stopped before it finished, and no round was recorded. Run \`speck review ${id}\` to run it again.`);
    }
    const left = deadline - Date.now();
    if (left <= 0) {
      console.log(`Round ${c.rec.round} of ${id} is still running. Its reviewer carries on until it finishes or reaches review_timeout_minutes. Wait for it in the foreground with \`speck review ${id} --wait\`, and run that again each time it exits ${STILL_RUNNING}, until it exits with another code.`);
      process.exitCode = STILL_RUNNING;
      return;
    }
    sleep(Math.min(POLL_MS, left));
  }
}

function deliver(files, done) {
  const read = file => { try { return fs.readFileSync(file, 'utf8'); } catch { return ''; } };
  const out = read(files.out), err = read(files.err);
  for (const file of [files.out, files.err]) fs.rmSync(file, { force: true });
  if (out) process.stdout.write(out);
  if (err) process.stderr.write(err);
  process.exitCode = Number.isInteger(done.code) ? done.code : 1;
}
