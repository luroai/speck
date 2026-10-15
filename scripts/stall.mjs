// Runs a test command and ends it if it stalls (0152): `node stall.mjs <cmd> <stall ms> <ended file> [<output file>]`.
// The command runs in its own process group, so ending it ends every process it started. If this process goes, or
// whoever started it does, the group is ended too (0174). Its output goes on to this process's own, and to the output
// file too when one is given. If it writes nothing for the stall time, this says so, with the last line it wrote, and
// ends the whole group. The ended file gets how the run ended: the exit code, `signal <name>` if a signal stopped it,
// `parent gone` if whoever started this process went first, or `stalled` and the last line on the next line.

import fs from 'node:fs';
import { spawn } from 'node:child_process';

const [cmd, ms, endedFile, outputFile] = process.argv.slice(2);
const stallMs = Number(ms);
const GRACE_MS = 2000; // how long the tests get to end after being asked, before they're killed
const out = outputFile ? fs.openSync(outputFile, 'w') : null;
// A watch in the tests' group ends the whole group once this process has gone, even if it was killed with SIGKILL
// and had no chance to end them itself (0174). It checks every half second, writes nothing and holds no output.
const WATCH = `(while kill -0 ${process.pid} 2>/dev/null; do sleep 0.5; done; kill -KILL 0) </dev/null >/dev/null 2>&1 &`;
const child = spawn('sh', ['-c', `${WATCH} exec sh -c "$1"`, 'sh', cmd], { stdio: ['ignore', 'pipe', 'pipe'], detached: true });

// If whoever reads this process's output stops reading, the output is dropped rather than leaving the tests unwatched.
for (const stream of [process.stdout, process.stderr]) stream.on('error', () => {});

let lastAt = Date.now(), last = '', done = false, ending = false;
const partial = { stdout: '', stderr: '' };
// eslint-disable-next-line no-control-regex
const plain = s => s.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '').trim();
for (const name of ['stdout', 'stderr']) {
  child[name].on('data', chunk => {
    lastAt = Date.now();
    process[name].write(chunk);
    if (out !== null) fs.writeSync(out, chunk);
    const lines = (partial[name] + chunk.toString('utf8')).split('\n');
    partial[name] = lines.pop().slice(-4000);
    for (const l of [...lines, partial[name]]) if (plain(l)) last = plain(l);
  });
}

const group = signal => { try { process.kill(-child.pid, signal); } catch { /* already gone */ } };
const finish = (ended, code) => {
  if (done) return;
  done = true;
  clearInterval(timer);
  fs.writeFileSync(endedFile, ended);
  if (out !== null) fs.closeSync(out);
  process.exit(code);
};
// Asks the tests and everything they started to end, then kills whatever is left. How the run ended is then `then`'s to
// say, not the command's own exit.
const end = (signal, then) => { ending = true; group(signal); setTimeout(() => { group('SIGKILL'); then(); }, GRACE_MS); };

const duration = n => {
  const unit = (v, word) => `${v} ${word}${v === 1 ? '' : 's'}`;
  return n % 60000 === 0 ? unit(n / 60000, 'minute') : unit(Math.round(n / 100) / 10, 'second');
};
// The process that started this one, so this one can tell when that has gone.
const parent = process.ppid;
const timer = setInterval(() => {
  // Whoever started the tests has gone, perhaps killed with SIGKILL, so nobody is waiting for them: end them (0174).
  if (!done && !ending && process.ppid !== parent) { clearInterval(timer); end('SIGTERM', () => finish('parent gone', 1)); return; }
  if (done || Date.now() - lastAt < stallMs) return;
  clearInterval(timer);
  const said = last.length > 300 ? `${last.slice(0, 300)}…` : last;
  const message = `\nThe tests stalled: no output for ${duration(stallMs)}, so speck ended them and every process they started. ${said ? `The last line of output was: ${said}` : 'They wrote no output before that.'}\n`;
  process.stdout.write(message);
  if (out !== null) fs.writeSync(out, message);
  end('SIGTERM', () => finish(`stalled\n${said}`, 1));
}, Math.min(1000, Math.max(50, stallMs / 10)));

// The tests are in their own group, so a signal sent to this process's group (Ctrl-C, or a tool's time limit) is
// passed on to them.
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, () => end(signal, () => finish(`signal ${signal}`, 1)));

let status = null;
child.on('error', e => { process.stderr.write(`Couldn't run the tests: ${e.message}\n`); finish('127', 127); });
child.on('exit', (code, signal) => {
  if (ending) return;
  status = signal ? [`signal ${signal}`, 1] : [String(code), code];
  // Its output ends once every process holding it has; one left running after the command ends is ended too.
  setTimeout(() => { group('SIGKILL'); finish(...status); }, GRACE_MS);
});
child.on('close', () => { if (status && !ending) finish(...status); });
