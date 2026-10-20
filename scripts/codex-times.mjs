// 0342: runs a Codex build so its log shows when each line was written: `node codex-times.mjs <cmd> [<arg>…]`. speck
// run starts it in place of the build's command (timedArgv), detached and writing to the build's log as the build did,
// so it outlives speck run as the build does. The command runs in this process's group, with its stderr passed straight
// through, and each line of its output is written as it comes, a JSON object given its time as speck_at (stampLine).
// This exits as the command did. speck pause, play and stop signal every process of the build, the command too, so
// this ignores the signals that end a build and waits for the command's last lines.

import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { stampLine } from './codex-build.mjs';

const [cmd, ...args] = process.argv.slice(2);
const ENDS = ['SIGINT', 'SIGTERM', 'SIGHUP'];
for (const signal of ENDS) process.on(signal, () => {});
const write = (fd, text) => { try { fs.writeSync(fd, text); } catch { /* the log can't be written: nothing to tell */ } };

let rest = '';
const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'inherit'] });
child.stdout.setEncoding('utf8');
child.stdout.on('data', chunk => {
  const at = new Date().toISOString();
  const lines = (rest + chunk).split('\n');
  rest = lines.pop();
  if (lines.length) write(1, `${lines.map(l => stampLine(l, at)).join('\n')}\n`);
});

// Exits as the command did: with its exit code, or ended by the same signal.
let ended = false;
const end = (code, signal) => {
  if (ended) return;
  ended = true;
  if (rest) write(1, stampLine(rest, new Date().toISOString()));
  if (signal) { process.removeAllListeners(signal); process.kill(process.pid, signal); return; }
  process.exit(code ?? 1);
};
child.on('error', e => { write(2, `speck couldn't start ${cmd}: ${e.message}\n`); ended = true; process.exit(127); });
// Its output ends once every process holding it has. One it left running that still holds it gets a moment, not forever.
child.on('exit', (code, signal) => setTimeout(() => end(code, signal), 2000).unref());
child.on('close', (code, signal) => end(code, signal));
