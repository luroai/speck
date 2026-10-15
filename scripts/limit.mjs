// Runs a reviewer with a time limit (0180): `node limit.mjs <ms> <cmd> [<arg>…]`. The reviewer runs in its own process
// group, with SPECK_REVIEW_RUN set to a value of its own in its environment. Its stdin, stdout and stderr pass through,
// and this exits with its exit code. If it's still running after <ms>, this ends its group, every process descended
// from it and every process whose environment holds that SPECK_REVIEW_RUN (procs.mjs), so every process it started,
// even one in a group of its own or one whose parent has gone. It writes to fd 3 `timeout` if it ended the reviewer
// that way, or `error <code> <message>` if it couldn't start.

import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { markRun, runProcesses } from './procs.mjs';

const [ms, cmd, ...args] = process.argv.slice(2);
const GRACE_MS = 2000; // how long the reviewer gets to end after being asked, before it's killed
const report = text => { try { fs.writeSync(3, text); } catch { /* nobody is reading */ } };
const { run, env } = markRun('SPECK_REVIEW_RUN');
const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'], detached: true, env });

// The reviewer may stop reading its prompt, and whoever reads this process's output may stop reading.
for (const stream of [child.stdin, process.stdout, process.stderr]) stream.on('error', () => {});
process.stdin.pipe(child.stdin);
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

let ending = false, timer = null;
const signalAll = (pids, signal) => {
  let any = false;
  for (const p of [-child.pid, ...pids]) { try { process.kill(p, signal); any = true; } catch { /* already gone */ } }
  return any;
};
// Asks the reviewer and everything it started to end, kills whatever is left after the grace time, then exits.
function end(signal, code) {
  if (ending) return;
  ending = true;
  clearTimeout(timer);
  const pids = runProcesses(child.pid, 'SPECK_REVIEW_RUN', run);
  signalAll(pids, signal);
  const until = Date.now() + GRACE_MS;
  const check = setInterval(() => {
    if (signalAll(pids, 0) && Date.now() < until) return;
    clearInterval(check);
    signalAll(pids, 'SIGKILL');
    process.exit(code);
  }, 50);
}

// A timer can wait at most about 24.8 days, so a longer limit is waited for in steps.
const deadline = Date.now() + Number(ms);
const wait = () => {
  const left = deadline - Date.now();
  if (left <= 0) { report('timeout'); end('SIGTERM', 1); } else timer = setTimeout(wait, Math.min(left, 2 ** 31 - 1));
};
wait();

// The reviewer is in its own group, so a signal sent to this process's group (Ctrl-C) is passed on to it.
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, () => end(signal, 1));

child.on('error', e => { clearTimeout(timer); report(`error ${e.code || ''} ${e.message}`); process.exit(127); });
// Its output ends once every process holding it has, so a process it leaves holding its output still counts.
child.on('close', (code, signal) => {
  if (ending) return;
  clearTimeout(timer);
  if (signal) { process.removeAllListeners(signal); process.kill(process.pid, signal); return; }
  process.exitCode = code;
});
