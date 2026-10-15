// Shared by the pause and stop tests: a repo whose build_command is a fake build that keeps working, with a helper
// process of its own, and helpers to watch it.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CLI, env, runRepo, startRun, until, stopRun, killAll } from './run.mjs';
import { speck as speckIn } from './cli.mjs';

export const wait = ms => new Promise(res => setTimeout(res, ms));
export const runsPath = (dir, f) => path.join(dir, 'speck', '.cache', 'runs', f);
export const speck = (dir, ...a) => speckIn(dir, env, ...a);
export const size = f => { try { return fs.statSync(f).size; } catch { return -1; } };
export const json = dir => JSON.parse(speck(dir, 'status', '--json').stdout);
// A process's state letter from ps: T while it's stopped.
export const state = pid => spawnSync('ps', ['-o', 'stat=', '-p', String(pid)], { encoding: 'utf8' }).stdout.trim();

// A build that keeps working: it writes a line to its log every 20ms, and starts a helper in a session and process
// group of its own (as Claude Code does for each Bash command) that adds a line to <out>/helper.txt every 20ms and
// saves its pid in <out>/helper.pid. It stops when <out>/stop exists, or once <out> is gone, so one left behind by a test
// file that was killed outright doesn't run for ever.
export const TICKER = `
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const [helper, out, id, session] = process.argv.slice(2);
// START: start the ticket in its own worktree with speck first, as /speck-build does, and work there.
let wt = null;
if (process.env.START) wt = require('child_process').spawnSync(process.execPath, [process.env.START, 'start', id], { encoding: 'utf8' }).stdout.trim().split('\\n').pop();
fs.writeFileSync(path.join(out, id + '.build.json'), JSON.stringify({ pid: process.pid, session, cwd: process.cwd(), worktree: wt }));
spawn(process.execPath, [helper, out], { detached: true, stdio: 'ignore' }).unref();
// ORPHAN: a step that starts a writer in a session of its own and exits at once, so the writer leaves the build's tree.
if (process.env.ORPHAN) spawn(process.execPath, ['-e', \`require('child_process').spawn(process.execPath, [\${JSON.stringify(helper)}, \${JSON.stringify(out)}, 'orphan'], { detached: true, stdio: 'ignore' }).unref()\`], { detached: true, stdio: 'ignore' }).unref();
// STUBBORN: a step that starts a writer in a session of its own, with an environment of its own, that ignores SIGTERM.
// Only its parent, which ends on SIGTERM, ties it to the build.
if (process.env.STUBBORN) spawn(process.execPath, ['-e', \`require('child_process').spawn(process.execPath, ['-e', \${JSON.stringify("process.on('SIGTERM', () => {}); require('fs').writeFileSync(" + JSON.stringify(path.join(out, 'stubborn.pid')) + ", String(process.pid)); setInterval(() => {}, 1000)")}], { detached: true, stdio: 'ignore', env: {} }).unref(); setInterval(() => {}, 1000)\`], { detached: true, stdio: 'ignore' }).unref();
// SELF_PAUSE: the build pauses itself with speck, and saves that speck pause's pid in <out>/self.pid.
if (process.env.SELF_PAUSE) setTimeout(() => {
  const c = spawn(process.execPath, [process.env.SELF_PAUSE, 'pause', id], { stdio: 'ignore' });
  fs.writeFileSync(path.join(out, 'self.pid'), String(c.pid));
}, 300);
// EXIT_ON_CONT: the build finishes the moment it's played, with exit code 3.
if (process.env.EXIT_ON_CONT) process.on('SIGCONT', () => process.exit(3));
let n = 0;
setInterval(() => { console.log('tick ' + n++); if (fs.existsSync(path.join(out, 'stop')) || !fs.existsSync(out)) process.exit(0); }, 20);
`;
export const HELPER = `
const fs = require('fs'), path = require('path');
const [out, name = 'helper'] = process.argv.slice(2);
fs.writeFileSync(path.join(out, name + '.pid'), String(process.pid));
setInterval(() => { if (fs.existsSync(path.join(out, 'stop')) || !fs.existsSync(out)) process.exit(0); fs.appendFileSync(path.join(out, name + '.txt'), 'h\\n'); }, 20);
`;

export function tickerRepo(opts = {}) {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'ticker-'));
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'ticker-out-'));
  const ticker = path.join(bin, 'ticker.cjs');
  const helperJs = path.join(bin, 'helper.cjs');
  fs.writeFileSync(ticker, TICKER);
  fs.writeFileSync(helperJs, HELPER);
  const r = runRepo({ ...opts, command: `"${process.execPath}" "${ticker}" "${helperJs}" "${out}" {id} {session}` });
  const build = id => { try { return JSON.parse(fs.readFileSync(path.join(out, `${id}.build.json`), 'utf8')); } catch { return null; } };
  const helper = () => { try { return Number(fs.readFileSync(path.join(out, 'helper.pid'), 'utf8')); } catch { return null; } };
  const orphan = () => { try { return Number(fs.readFileSync(path.join(out, 'orphan.pid'), 'utf8')); } catch { return null; } };
  const finish = () => fs.writeFileSync(path.join(out, 'stop'), '');
  return { ...r, out, build, helper, orphan, finish, orphanFile: path.join(out, 'orphan.txt'), helperFile: path.join(out, 'helper.txt'), log: id => runsPath(r.dir, `${id}.log`) };
}

// Launches 0001 with speck run and waits until the build and its helper are both working.
export async function launched(t, extraEnv) {
  const run = startRun(t.dir, extraEnv);
  assert.ok(await until(() => t.build('0001') && t.helper() && size(t.helperFile) > 0 && size(t.log('0001')) > 0), run.out());
  return run;
}

// True if neither the build's log nor the helper's file grows over `ms`.
export async function still(t, id, ms = 400) {
  await wait(100); // anything already on its way lands first
  const a = [size(t.log(id)), size(t.helperFile)];
  await wait(ms);
  return size(t.log(id)) === a[0] && size(t.helperFile) === a[1];
}
export async function growing(t, id) {
  const a = [size(t.log(id)), size(t.helperFile)];
  return until(() => size(t.log(id)) > a[0] && size(t.helperFile) > a[1], 3000);
}

export const cleanup = (t, run) => async () => {
  const pids = [t.build('0001')?.pid, t.helper(), t.orphan()].filter(Boolean);
  for (const p of pids) try { process.kill(p, 'SIGCONT'); } catch {}
  t.finish();
  if (run) await stopRun(run);
  killAll(pids);
};


// A ps that works for its first FAKE_PS_OK runs (counted in FAKE_PS_COUNT), then fails.
export function failingPs() {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'fake-ps-'));
  const real = spawnSync('sh', ['-c', 'command -v ps'], { encoding: 'utf8' }).stdout.trim();
  fs.writeFileSync(path.join(bin, 'ps'), `#!/bin/sh\nn=$(cat "$FAKE_PS_COUNT" 2>/dev/null || echo 0)\necho $((n + 1)) > "$FAKE_PS_COUNT"\nif [ "$n" -lt "$FAKE_PS_OK" ]; then exec ${real} "$@"; fi\necho "ps: broken" >&2\nexit 1\n`, { mode: 0o755 });
  return ok => ({ ...env, PATH: `${bin}${path.delimiter}${env.PATH}`, FAKE_PS_OK: String(ok), FAKE_PS_COUNT: path.join(bin, `count-${Math.random()}`) });
}
export const speckWith = (dir, e, ...a) => speckIn(dir, e, ...a);

