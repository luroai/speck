// The panel's writes that start or stop speck itself: the Ship and Ask for changes buttons and the speck run switch.

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SpeckError, findTicket, padId, runsOf } from './speck.mjs';
import { runState, runsDir, pidAlive, refusalFile, takeRefusal } from './run.mjs';
import { isSpeckRun, runProcesses } from './run-lock.mjs';
export { runLogPart, runLogAnswer } from './run-log.mjs'; // 0415: speck run's output, for the Pipeline pop-up

// 0133: the Ship button in an approved ticket's review pack. It's the user shipping (Gate 2), so it runs `speck ship <id>`
// as /speck-ship does, in its own process, since a ship runs the tests and can take minutes. Resolves with { status,
// body }: 200 and what it printed when it shipped, or 409 and its message when it refused, having changed nothing.
export async function panelShip(repo, id) {
  try { findTicket(repo, id); } catch (e) { if (e instanceof SpeckError) return { status: 404, body: { error: e.message } }; throw e; }
  const cli = path.join(path.dirname(fileURLToPath(import.meta.url)), 'speck.mjs');
  return new Promise(resolve => {
    const child = spawn(process.execPath, [cli, 'ship', padId(id)], { cwd: repo, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    child.stdout.setEncoding('utf8').on('data', d => { out += d; });
    child.stderr.setEncoding('utf8').on('data', d => { err += d; });
    child.on('error', e => resolve({ status: 500, body: { error: `Couldn't run speck ship: ${e.message}` } }));
    child.on('close', code => resolve(code === 0
      ? { status: 200, body: { ok: true, message: out.trim() } }
      : { status: 409, body: { error: err.trim() || `speck ship stopped with exit code ${code}.` } }));
  });
}

// 0357: an approved ticket's Ask for changes button runs `speck changes <id> "<note>"` (0356), as the Ship button runs
// speck ship. `body` is the request's, {"note": "<note>"}. Resolves with { status, body }: 200 and what speck changes
// said, or 409 and why it refused, which changes nothing.
export async function panelChanges(repo, id, body) {
  let v = null;
  try { v = JSON.parse(body || ''); } catch { /* refused below */ }
  if (!v || typeof v !== 'object' || Array.isArray(v) || typeof v.note !== 'string') return { status: 400, body: { error: 'The note didn\'t arrive as the panel sends it. Reload the page and try again.' } };
  try { findTicket(repo, id); } catch (e) { if (e instanceof SpeckError) return { status: 404, body: { error: e.message } }; throw e; }
  const cli = path.join(path.dirname(fileURLToPath(import.meta.url)), 'speck.mjs');
  return new Promise(resolve => {
    const child = spawn(process.execPath, [cli, 'changes', padId(id), v.note], { cwd: repo, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    child.stdout.setEncoding('utf8').on('data', d => { out += d; });
    child.stderr.setEncoding('utf8').on('data', d => { err += d; });
    child.on('error', e => resolve({ status: 500, body: { error: `Couldn't run speck changes: ${e.message}` } }));
    child.on('close', code => resolve(code === 0
      ? { status: 200, body: { ok: true, message: out.trim() } }
      : { status: 409, body: { error: err.trim() || `speck changes stopped with exit code ${code}.` } }));
  });
}

// A request's body as text, or null once it's over 64 KB.
export function requestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', c => { size += c.length; if (size <= 65536) chunks.push(c); });
    req.on('end', () => resolve(size > 65536 ? null : Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// 0128: the panel's speck run switch. Turning it on starts `speck run` for this repo in its own process group, with its
// output going to speck/.cache/runs/run.log, so it keeps running after the page is closed and after `speck panel` stops,
// Ctrl+C included. Resolves with { status, body }: 200 and the run once it holds the lock and has said so (0207, so its first
// line isn't read as part of a refusal from the next one), or 409 and its refusal, from a file of its own (0220), not run.log.
const RUN_SWITCH_MS = 10000, RUN_SWITCH_POLL_MS = 50;

export function panelRunOn(repo) {
  const still = stillStopping(repo);
  if (still) return Promise.resolve({ status: 409, body: { error: stillSays(still) } });
  const cli = path.join(path.dirname(fileURLToPath(import.meta.url)), 'speck.mjs');
  const log = path.join(runsDir(repo), 'run.log'), refusal = refusalFile(repo);
  let from = 0, fd, child;
  try { from = fs.statSync(log).size; } catch { /* no output yet */ }
  try {
    fd = fs.openSync(log, 'a');
    child = spawn(process.execPath, [cli, 'run'], { cwd: repo, detached: true, stdio: ['ignore', fd, fd], env: { ...process.env, SPECK_RUN_REFUSAL: refusal } });
  } catch (e) { return Promise.resolve({ status: 500, body: { error: `Couldn't start speck run: ${e.message}` } }); }
  finally { if (fd !== undefined) fs.closeSync(fd); }
  child.unref();
  // What this speck run has written to the log so far.
  const said = () => { try { return fs.readFileSync(log).subarray(from).toString('utf8').trim(); } catch { return ''; } };
  return new Promise(resolve => {
    let check, timer;
    const finish = out => { clearInterval(check); clearTimeout(timer); resolve(out); };
    child.on('error', e => finish({ status: 500, body: { error: `Couldn't start speck run: ${e.message}` } }));
    child.on('exit', code => finish({ status: 409, body: { error: takeRefusal(refusal) || `speck run stopped with exit code ${code} before it was on. Its output is in ${path.relative(repo, log)}.` } }));
    check = setInterval(() => {
      const run = runState(runsOf(repo));
      if (run.on && run.pid === child.pid && said()) finish({ status: 200, body: { ok: true, run } });
    }, RUN_SWITCH_POLL_MS);
    timer = setTimeout(() => finish({ status: 500, body: { error: `speck run (process ${child.pid}) started but didn't take its lock and say it's watching within ${RUN_SWITCH_MS / 1000} seconds. Its output is in ${path.relative(repo, log)}.` } }), RUN_SWITCH_MS);
  });
}

// 0321: each speck run being turned off, by repo: { pid, left }, the pid its lock held and its processes still to stop.
// While any of them is alive the panel shows speck run on, with or without its lock, so no page shows it off before
// all of it has stopped, even once the wait for it has run out. Kept by this panel server, so a restart forgets it.
const stopping = new Map();
function stillStopping(repo) {
  const s = stopping.get(repo);
  if (!s) return null;
  s.left = s.left.filter(pidAlive);
  if (s.left.length) return s;
  stopping.delete(repo);
  return null;
}
const stillSays = s => `speck run (process${s.left.length === 1 ? '' : 'es'} ${s.left.join(', ')}) is still stopping. Wait for it to stop, or turn it off again.`;

// speck run's state as the panel shows it: on while its lock names a live process, or while one being turned off is
// still stopping, with the pid it's known by.
export function panelRunState(repo, runs = runsOf(repo)) {
  const run = runState(runs);
  if (run.on) return run;
  const s = stillStopping(repo);
  return s ? { on: true, pid: s.left.includes(s.pid) ? s.pid : s.left[0] } : run;
}

// Turning it off stops the running `speck run`, from the panel or a terminal, as Ctrl+C does: SIGINT, which it answers by
// stopping and leaving its builds running. Resolves once it has stopped, with each speck run on new code it hosts (0321),
// or with an error after `ms`. isSpeckRun keeps a lock left with a pid since reused by another program from getting that
// program stopped. Turned off again while still stopping, it asks whatever is left to stop.
export function panelRunOff(repo, { ms = RUN_SWITCH_MS } = {}) {
  const run = runState(runsOf(repo)), was = stillStopping(repo);
  if (!run.on && !was) return Promise.resolve({ status: 409, body: { error: 'speck run is off already.' } });
  if (run.on && !isSpeckRun(run.pid))
    return Promise.resolve({ status: 409, body: { error: `speck run's lock names process ${run.pid}, which isn't speck run, so it wasn't stopped. If no speck run is running, delete ${path.relative(repo, path.join(runsOf(repo), 'run.lock'))}.` } });
  // Its processes, listed before it's asked to stop and again on each check while it's there, as it may be switching.
  const pid = run.on ? run.pid : was.pid;
  const listed = () => { try { return runProcesses(pid); } catch { return [pid]; } };
  const s = { pid, left: [...new Set([...(was ? was.left : []), ...(pidAlive(pid) ? listed() : [])])] };
  stopping.set(repo, s);
  for (const p of pidAlive(pid) ? [pid] : s.left) {
    try { process.kill(p, 'SIGINT'); } catch (e) { if (p === pid) return Promise.resolve({ status: 500, body: { error: `Couldn't stop speck run (process ${pid}): ${e.message}` } }); }
  }
  const end = Date.now() + ms;
  return new Promise(resolve => {
    const check = setInterval(() => {
      s.left = [...new Set([...s.left, ...(pidAlive(pid) ? listed() : [])])].filter(pidAlive);
      if (!s.left.length) { clearInterval(check); stopping.delete(repo); resolve({ status: 200, body: { ok: true, run: { on: false, pid: null } } }); }
      else if (Date.now() > end) { clearInterval(check); resolve({ status: 500, body: { error: `${stillSays(s)} It was asked to stop ${ms / 1000} seconds ago. Try again, or stop it from its terminal.` } }); }
    }, RUN_SWITCH_POLL_MS);
  });
}
