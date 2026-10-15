// Runs a reviewer with a time limit (0180): `node limit.mjs <ms> <cmd> [<arg>…]`. The reviewer runs in its own process
// group, so ending it ends every process it started. Its stdin, stdout and stderr pass through, and this exits with its
// exit code. If it's still running after <ms>, this ends the whole group. It writes to fd 3 `timeout` if it ended the
// reviewer that way, or `error <code> <message>` if the reviewer couldn't start.

import fs from 'node:fs';
import { spawn } from 'node:child_process';

const [ms, cmd, ...args] = process.argv.slice(2);
const GRACE_MS = 2000; // how long the reviewer gets to end after being asked, before it's killed
const report = text => { try { fs.writeSync(3, text); } catch { /* nobody is reading */ } };
const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'], detached: true });

// The reviewer may stop reading its prompt, and whoever reads this process's output may stop reading.
for (const stream of [child.stdin, process.stdout, process.stderr]) stream.on('error', () => {});
process.stdin.pipe(child.stdin);
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

let ending = false;
const group = signal => { try { process.kill(-child.pid, signal); return true; } catch { return false; } };
// Asks the reviewer and everything it started to end, kills whatever is left after the grace time, then exits.
function end(signal, code) {
  if (ending) return;
  ending = true;
  clearTimeout(timer);
  group(signal);
  const until = Date.now() + GRACE_MS;
  const check = setInterval(() => {
    if (group(0) && Date.now() < until) return;
    clearInterval(check);
    group('SIGKILL');
    process.exit(code);
  }, 50);
}

const timer = setTimeout(() => { report('timeout'); end('SIGTERM', 1); }, Number(ms));

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
