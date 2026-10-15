// Runs a reviewer with a time limit (0180): `node limit.mjs <ms> <cmd> [<arg>…]`. The reviewer runs in its own process
// group. Its stdin, stdout and stderr pass through, and this exits with its exit code. If it's still running after <ms>,
// this ends its group and every process descended from it, so every process it started, even one in a group of its
// own. It writes to fd 3 `timeout` if it ended the reviewer that way, or `error <code> <message>` if it couldn't start.

import fs from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';

const [ms, cmd, ...args] = process.argv.slice(2);
const GRACE_MS = 2000; // how long the reviewer gets to end after being asked, before it's killed
const report = text => { try { fs.writeSync(3, text); } catch { /* nobody is reading */ } };
const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'], detached: true });

// The reviewer may stop reading its prompt, and whoever reads this process's output may stop reading.
for (const stream of [child.stdin, process.stdout, process.stderr]) stream.on('error', () => {});
process.stdin.pipe(child.stdin);
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

// Every process descended from `pid`, from ps. One that started a process group of its own isn't in the reviewer's.
function descendants(pid) {
  const kids = new Map();
  for (const line of (spawnSync('ps', ['-A', '-o', 'pid=,ppid='], { encoding: 'utf8' }).stdout || '').split('\n')) {
    const [p, parent] = line.trim().split(/\s+/).map(Number);
    if (p && parent) kids.set(parent, [...(kids.get(parent) || []), p]);
  }
  const out = new Set(), todo = [pid];
  while (todo.length) for (const k of kids.get(todo.pop()) || []) if (!out.has(k)) { out.add(k); todo.push(k); }
  return [...out];
}

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
  const pids = descendants(child.pid);
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
