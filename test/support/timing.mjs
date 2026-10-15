// 0207: timing checks that give the same result however busy the machine is, because each compares against a
// measurement made in the same test under the same conditions rather than a fixed number of milliseconds.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

// True when an answer that took `ms` waited for a board reading going on at the same time, which took `reading` ms. It
// waited when it took at least half the reading longer than the same ask took with nothing reading (`base`), both
// measured in the same test: an answer that waits for the reading takes the rest of the reading longer, while a busy
// machine slows the ask alike with and without the reading.
export const waitedForReading = ({ ms, base, reading }) => ms >= base + reading / 2;

// The CPU time, in ms, that this process's finished children have used so far, from /proc on Linux. CPU time counts
// only the work a process does, not the time it waits for other processes' work, so other builds' test runs on the
// same machine barely change it. Elsewhere, null.
const TICKS_PER_SECOND = process.platform === 'linux' ? Number(spawnSync('getconf', ['CLK_TCK'], { encoding: 'utf8' }).stdout.trim()) || 100 : 100;
export function childCpuMs() {
  if (process.platform !== 'linux') return null;
  const [cutime, cstime] = fs.readFileSync('/proc/self/stat', 'utf8').replace(/^.*\) /, '').split(' ').slice(13, 15).map(Number);
  return ((cutime + cstime) * 1000) / TICKS_PER_SECOND;
}

// How long `f`, which runs a child process to its end, takes in ms: the CPU time the child used on Linux (childCpuMs),
// otherwise the wall-clock time.
export function costMs(f) {
  const cpu = childCpuMs(), t = process.hrtime.bigint();
  f();
  return cpu === null ? Number(process.hrtime.bigint() - t) / 1e6 : childCpuMs() - cpu;
}
