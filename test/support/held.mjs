// A test command that keeps running until a test lets it go, and ways to tell whether it and everything it started
// have ended (0174).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

// Set in the environment of a speck process a test starts, so every process it starts inherits it.
export const MARK = 'SPECK_TEST_0174_MARK';
export const newMark = () => crypto.randomUUID();

// The running processes whose environment holds MARK=mark. Linux reads /proc; macOS asks ps. A process that has
// exited and waits only for its parent to collect it has no environment left, so it isn't counted.
export function marked(mark) {
  const entry = `${MARK}=${mark}`;
  if (process.platform === 'linux') {
    const found = [];
    for (const d of fs.readdirSync('/proc').filter(d => /^\d+$/.test(d))) {
      try { if (fs.readFileSync(`/proc/${d}/environ`, 'utf8').split('\0').includes(entry)) found.push(Number(d)); } catch { /* gone */ }
    }
    return found;
  }
  const r = spawnSync('ps', ['-A', '-E', '-ww', '-o', 'pid=,stat=,command='], { encoding: 'utf8' });
  return r.stdout.split('\n').filter(l => l.includes(entry) && !/^\s*\d+\s+Z/.test(l)).map(l => Number(l.trim().split(/\s+/)[0]));
}

const alive = pid => {
  try { process.kill(pid, 0); } catch (e) { if (e.code !== 'EPERM') return false; }
  const s = spawnSync('ps', ['-o', 'stat=', '-p', String(pid)], { encoding: 'utf8' }).stdout.trim();
  return s !== '' && !s.startsWith('Z');
};

// A test command that writes its own pid to <dir>/pids, starts a process in the background that drops its whole
// environment (so only its process group ties it to the run) and writes its pid there too, makes <dir>/reached, then
// waits. Both wait until <dir> is gone, so one left behind by a test file killed outright doesn't run for ever.
export function held() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'held-')));
  const pids = path.join(dir, 'pids'), reached = path.join(dir, 'reached');
  const loop = `while [ -d ${dir} ]; do sleep 0.05; done`;
  const script = path.join(dir, 'hold.sh');
  fs.writeFileSync(script, `echo $$ >> ${pids}\nenv -i /bin/sh -c 'echo $$ >> ${pids}; ${loop}' &\nwhile [ "$(wc -l < ${pids})" -lt 2 ]; do sleep 0.05; done\ntouch ${reached}\n${loop}\n`);
  const started = () => fs.existsSync(reached);
  const listed = () => fs.readFileSync(pids, 'utf8').trim().split('\n').map(Number);
  // The pids it wrote that are still running.
  const running = () => listed().filter(alive);
  return { dir, test: `sh ${script}`, started, running };
}
