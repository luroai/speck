// Shared by the tests of speck run's switch to new code (0247, 0301): speck run from a copy of the CLI, and edits to
// that copy's code.
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { env, until } from './run.mjs';

// speck run from a copy of the CLI, in a process group of its own, as a terminal starts it, so Ctrl+C can be sent to
// the whole group.
export function startRun(dir, cli, extraEnv = {}) {
  const child = spawn(process.execPath, [cli, 'run'], { cwd: dir, detached: true, env: { ...env, ...extraEnv } });
  let out = '';
  child.stdout.on('data', d => { out += d; });
  child.stderr.on('data', d => { out += d; });
  const exited = new Promise(res => child.on('exit', code => res(code)));
  return { child, out: () => out, exited };
}
export const stop = async run => { if (run.child.exitCode === null) { try { process.kill(-run.child.pid, 'SIGINT'); } catch { /* gone */ } await run.exited; } };
export const lockPid = dir => { try { return Number(fs.readFileSync(path.join(dir, 'speck', '.cache', 'runs', 'run.lock'), 'utf8')); } catch { return null; } };
export const childrenOf = pid => spawnSync('ps', ['-o', 'pid=', '--ppid', String(pid)], { encoding: 'utf8' }).stdout.trim().split('\n').filter(Boolean).map(Number);
export const count = (text, part) => text.split(part).length - 1;
// Changes a file of the copied CLI's code. Marked in run-switch.mjs, where the line is.
export const edit = (cli, file, fn) => { const f = path.join(path.dirname(cli), file); fs.writeFileSync(f, fn(fs.readFileSync(f, 'utf8'))); };
// The line speck run on new code says as it takes over, marked so the test knows which code said it.
export const SWITCHED = 'speck run switched to the new code.';
export const mark = tag => src => src.replace(/'speck run switched to the new code\.[^']*'/, `'${SWITCHED} ${tag}'`);
export const watching = (run, ms) => until(() => run.out().includes('speck run: watching for ready tickets'), ms);

// Sets a draft ticket ready and commits it, for speck run to launch.
export const setReady = (r, id) => {
  const t = path.join(r.dir, 'speck', 'tickets', `${id}-t.md`);
  fs.writeFileSync(t, fs.readFileSync(t, 'utf8').replace('status: draft', 'status: ready'));
  r.g('commit', '-qam', `ready ${id}`);
};
