// The panel's writes that start or stop speck itself: the Ship button and the speck run switch.

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SpeckError, sh, findTicket, padId, runsOf } from './speck.mjs';
import { runState, runsDir, pidAlive, refusalFile, takeRefusal } from './run.mjs';

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

// 0128: the panel's speck run switch. Turning it on starts `speck run` for this repo in its own process group, with its
// output going to speck/.cache/runs/run.log, so it keeps running after the page is closed and after `speck panel` stops,
// Ctrl+C included. Resolves with { status, body }: 200 and the run once it holds the lock and has said so (0207, so its first
// line isn't read as part of a refusal from the next one), or 409 and its refusal, from a file of its own (0220), not run.log.
const RUN_SWITCH_MS = 10000, RUN_SWITCH_POLL_MS = 50;

export function panelRunOn(repo) {
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

// True when the process is `speck run`, from its command line, so a lock left with a pid that has since been reused by
// another program never gets that program stopped.
function isSpeckRun(pid) {
  const r = sh('ps', ['-ww', '-o', 'args=', '-p', String(pid)]);
  return r.status === 0 && /speck(\.mjs)?\s+run(\s|$)/.test(r.stdout.trim());
}

// Turning it off stops the running `speck run`, from the panel or a terminal, as Ctrl+C does: SIGINT, which it answers by
// stopping and leaving its builds running. Resolves once it has stopped.
export function panelRunOff(repo) {
  const run = runState(runsOf(repo));
  if (!run.on) return Promise.resolve({ status: 409, body: { error: 'speck run is off already.' } });
  if (!isSpeckRun(run.pid))
    return Promise.resolve({ status: 409, body: { error: `speck run's lock names process ${run.pid}, which isn't speck run, so it wasn't stopped. If no speck run is running, delete ${path.relative(repo, path.join(runsOf(repo), 'run.lock'))}.` } });
  try { process.kill(run.pid, 'SIGINT'); }
  catch (e) { return Promise.resolve({ status: 500, body: { error: `Couldn't stop speck run (process ${run.pid}): ${e.message}` } }); }
  const end = Date.now() + RUN_SWITCH_MS;
  return new Promise(resolve => {
    const check = setInterval(() => {
      const now = runState(runsOf(repo));
      if (!pidAlive(run.pid) || now.pid !== run.pid) { clearInterval(check); resolve({ status: 200, body: { ok: true, run: { on: false, pid: null } } }); }
      else if (Date.now() > end) { clearInterval(check); resolve({ status: 500, body: { error: `speck run (process ${run.pid}) was asked to stop but is still running after ${RUN_SWITCH_MS / 1000} seconds. Try again, or stop it from its terminal.` } }); }
    }, RUN_SWITCH_POLL_MS);
  });
}
