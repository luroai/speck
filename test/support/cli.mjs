// Runs a speck command for a test, as `node scripts/speck.mjs <args>` in `dir` with `env` would, and returns what
// spawnSync would: { status, stdout, stderr }. It runs in the test's own process (runCommand, 0231), as starting a
// process for each costs about 0.2 s, except for commands that need one of their own: panel and run keep running, and
// pause, play and stop signal a build's processes but leave out speck's own and its children, which a test's stand-in
// build is when speck runs in the test's process.
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runCommand } from '../../scripts/speck.mjs';

const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'scripts', 'speck.mjs');
const OWN_PROCESS = new Set(['panel', 'run', 'pause', 'play', 'stop']);

// For a test about the command as a process: one that kills it, signals it or looks for it among the processes.
export const speckProcess = (dir, env, ...args) => spawnSync(process.execPath, [CLI, ...args], { cwd: dir, encoding: 'utf8', env });

export function speck(dir, env, ...args) {
  if (OWN_PROCESS.has(args[0])) return speckProcess(dir, env, ...args);
  return runCommand(args, { cwd: dir, env });
}
