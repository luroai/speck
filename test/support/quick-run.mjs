// 0232: speck run tests that stop as soon as they've seen what they check, rather than waiting for a limit to run out.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CLI, startRun, until, stopRun } from './run.mjs';
import { cliCopy } from './panel.mjs';

// The tickets 0075 AC1 and 0100 AC3 give speck run, one build at a time, and the order it should launch them in.
export const ORDER_CASES = {
  '0075 AC1': { tickets: [['0001', { priority: '""' }], ['0002', {}], ['0003', { priority: 4 }], ['0004', { priority: '' }]], order: ['0003', '0001', '0002', '0004'] },
  '0100 AC3': { tickets: [['0001', { priority: 1 }], ['0002', { type: 'bug', priority: 1 }], ['0003', { type: 'fix', priority: 2 }], ['0004', { type: 'fix', priority: 0 }]], order: ['0004', '0003', '0001', '0002'] },
};

// Runs speck run in `r` (a runRepo) until it has launched `n` builds, or for at most 10 seconds as runOnce does, then
// stops it. Gives its exit code and output, and whether it was stopped because it had launched them all.
export async function runUntilLaunched(r, n, { cli = CLI, env = {} } = {}) {
  const run = startRun(r.dir, env, cli);
  let launched = false;
  try { await until(() => (launched = r.calls().length >= n) || run.child.exitCode !== null, 10000); } finally { await stopRun(run); }
  return { status: run.child.exitCode, out: run.out(), launched };
}

// speck run's real wait between checks, and the share of one core an idle speck run may use over it (0176 AC3).
export const RUN_POLL_MS = 5000;
export const IDLE_SHARE = 0.05;
// The CPU an idle speck run may use for each check, in seconds: 5% of one core over the real wait between checks. A
// check costs the same however long speck run waits between checks, so a test can wait less and count the same.
export const CHECK_BUDGET_S = IDLE_SHARE * RUN_POLL_MS / 1000;

// The CPU time a process has used so far, in clock ticks, with that of its children that have finished.
const cpuTicks = pid => fs.readFileSync(`/proc/${pid}/stat`, 'utf8').replace(/^.*\) /, '').split(' ').slice(11, 15).reduce((a, b) => a + Number(b), 0);
const TICKS_PER_SECOND = Number(spawnSync('getconf', ['CLK_TCK'], { encoding: 'utf8' }).stdout.trim()) || 100;

// Starts speck run in `dir` checking every `pollMs`, and watches it, idle, for `checks` checks. Calls `watching` once
// it has started watching. Gives the CPU it used for each check, in seconds, and what it was measured over. Linux only.
export async function idleCpu(dir, { pollMs, checks, cli = CLI, watching = () => {} }) {
  const run = startRun(dir, { SPECK_RUN_POLL_MS: String(pollMs) }, cli);
  try {
    if (!(await until(() => run.out().includes('speck run: watching for ready tickets every')))) throw new Error(`speck run didn't start watching: ${run.out()}`);
    watching();
    const from = cpuTicks(run.child.pid), t = Date.now();
    await new Promise(res => setTimeout(res, checks * pollMs));
    const used = (cpuTicks(run.child.pid) - from) / TICKS_PER_SECOND, seconds = (Date.now() - t) / 1000;
    const counted = seconds / (pollMs / 1000);
    return { perCheck: used / counted, used, seconds, checks: counted, running: run.child.exitCode === null, out: run.out() };
  } finally { await stopRun(run); }
}
export const idleSays = m => `speck run used ${m.used.toFixed(2)} s of CPU over ${m.checks.toFixed(0)} checks in ${m.seconds.toFixed(0)} s: ${m.perCheck.toFixed(3)} s a check, against ${CHECK_BUDGET_S} s (${IDLE_SHARE * 100}% of one core over ${RUN_POLL_MS / 1000} s)`;

// A copy of the CLI with `from` in scripts/<file> replaced by `to`, to break it on purpose.
export function brokenCli(file, from, to) {
  const { cli } = cliCopy();
  const f = path.join(path.dirname(cli), file);
  const src = fs.readFileSync(f, 'utf8');
  if (!src.includes(from)) throw new Error(`${file} has no ${from}`);
  fs.writeFileSync(f, src.replace(from, to));
  return cli;
}
