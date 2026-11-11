// Shared by the speck run tests: a repo with speck installed and a fake builder, and helpers to run speck run in it.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { copied, keptFile } from './copy.mjs';
import { speck } from './cli.mjs';
import { sessionProcess } from '../../scripts/seen-builds.mjs';
import { sessionInUse } from '../../scripts/build-procs.mjs';
import { CURSOR_CLIS } from '../../scripts/install.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CLI = path.join(ROOT, 'scripts', 'speck.mjs');
export const gitEnv = { GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };

// 0654: speck run's tests run it as on a machine with no agents of its own, so they give the same result on any machine:
// each folder on this machine's PATH that holds Claude Code's, Codex's or Cursor's CLI is swapped for a copy without
// them, the home folder is an empty one, and the environment has none of the agents' settings or keys. A folder, home
// folder or setting a test gives speck run itself is kept, so a test's own fake agents are found.
export const AGENT_CLIS = Object.freeze(['claude', 'codex', ...CURSOR_CLIS]);
const AGENT_VARS = /^(ANTHROPIC_|OPENAI_|CLAUDE|CODEX_|CURSOR_|XDG_(CONFIG|DATA|STATE|CACHE)_HOME$)/;
const MACHINE = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-keep-machine-')); // speck-keep-*: kept until the file's tests end
export const HOME = path.join(MACHINE, 'home');
fs.mkdirSync(HOME);
const MACHINE_PATH = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
const agentFreeDirs = new Map();
// `PATH` with each of `machinePath`'s folders that holds an agent's CLI swapped for one linking to everything else in it.
export function agentFreePath(PATH, machinePath = MACHINE_PATH) {
  return String(PATH ?? '').split(path.delimiter).filter(Boolean).map(dir => {
    if (!machinePath.includes(dir) || !AGENT_CLIS.some(c => fs.existsSync(path.join(dir, c)))) return dir;
    if (!agentFreeDirs.has(dir)) {
      const copy = fs.mkdtempSync(path.join(MACHINE, 'bin-'));
      let names = [];
      try { names = fs.readdirSync(dir); } catch { /* unreadable: nothing in it is found */ }
      for (const n of names) if (!AGENT_CLIS.includes(n)) try { fs.symlinkSync(path.join(dir, n), path.join(copy, n)); } catch { /* left out */ }
      agentFreeDirs.set(dir, copy);
    }
    return agentFreeDirs.get(dir);
  }).join(path.delimiter);
}
// The environment speck run starts with: `env` with `extra`, a test's own, over it, and the machine's agents left out.
export const runEnv = (extra = {}) => { const e = { ...env, ...extra }; e.PATH = agentFreePath(e.PATH); return e; };
const machineFree = Object.fromEntries(Object.entries(process.env).filter(([k]) => !AGENT_VARS.test(k)));
// SPECK_RUN_POLL_MS shortens the 5-second wait between checks, so the tests run quickly.
export const env = { ...machineFree, PATH: agentFreePath(process.env.PATH), HOME, ...gitEnv, SPECK_RUN_POLL_MS: '100' };
export const good = `## Problem\nUsers cannot export.\n## Outcome\nUsers can export CSV.\n## Acceptance criteria\n1. Export button downloads a CSV.\n## Out of scope\n- PDF export\n`;
export const fm = (o = {}) => Object.entries({ id: '"0001"', title: 'Export bookings as CSV', status: 'ready', size: 'S', risk: 'low', builder: 'claude', reviewer: 'codex', ...o }).map(([k, v]) => `${k}: ${v}`).join('\n');
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// A fake builder: records its arguments, folder and pid in <out>/<id>.<n>.json, prints a line to stdout and one to
// stderr, then stays alive for FAKE_MS (default 0) and exits with FAKE_EXIT (default 0), or is stopped by the signal FAKE_SIGNAL.
// An <out> of @repo is the fake-out folder in the .git folder of the repo it's building in, so that every copy of a repo
// whose config names the fake records its builds apart (0230).
export const FAKE = `
const fs = require('fs'), path = require('path');
const [outArg, ...args] = process.argv.slice(2);
const out = outArg !== '@repo' ? outArg
  : path.join(require('child_process').execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { encoding: 'utf8' }).trim(), 'fake-out');
const id = args[0];
let n = 0; while (fs.existsSync(path.join(out, id + '.' + n + '.json'))) n++;
// Written whole and then renamed, so a test reading the records while it writes never sees half of one (0559).
const rec = path.join(out, id + '.' + n + '.json');
fs.writeFileSync(rec + '.tmp', JSON.stringify({ at: Date.now(), args, cwd: process.cwd(), pid: process.pid, stdin: (() => { try { return fs.readFileSync(0, 'utf8'); } catch (e) { return 'ERR ' + e.code; } })() }));
fs.renameSync(rec + '.tmp', rec);
console.log('building ' + id);
for (let i = 1; i <= 7; i++) console.error('stderr line ' + i);
// FAKE_BLOCK: start the ticket in its own worktree with speck, as /speck-build does, and block it there.
if (process.env.FAKE_BLOCK) {
  const { spawnSync } = require('child_process');
  const started = spawnSync(process.execPath, [process.env.FAKE_BLOCK, 'start', id], { encoding: 'utf8' });
  const wt = started.stdout.trim().split('\\n').pop();
  spawnSync(process.execPath, [process.env.FAKE_BLOCK, 'set', id, 'status', 'blocked'], { cwd: wt, encoding: 'utf8' });
  spawnSync('git', ['commit', '-qam', 'blocked'], { cwd: wt });
}
const end = () => setTimeout(() => process.env.FAKE_SIGNAL ? process.kill(process.pid, process.env.FAKE_SIGNAL) : process.exit(+(process.env.FAKE_EXIT || 0)), +(process.env.FAKE_MS || 0));
// FAKE_GATE (0559): first stay alive until that file exists, however long that takes. Exits with 1 once its folder is gone.
const gate = process.env.FAKE_GATE;
if (!gate) end();
else { const t = setInterval(() => { if (fs.existsSync(gate)) { clearInterval(t); end(); } else if (!fs.existsSync(path.dirname(gate))) process.exit(1); }, 50); }
`;

// A repo with speck installed, the given tickets committed and build_command pointing at the fake builder, unless
// `command` is given. Each kind is built once per test file and copied (copy.mjs).
export function runRepo({ tickets = [['0001', {}]], max, command, worktrees = 'false' } = {}) {
  const cmd = command !== undefined ? command : `"${process.execPath}" "${keptFile('fake-build.cjs', FAKE)}" @repo {id} {session}`;
  const dir = copied('run', [tickets, max, worktrees, cmd], 'speck-', d => buildRunRepo(d, { tickets, max, worktrees, cmd }));
  const out = path.join(dir, '.git', 'fake-out');
  fs.mkdirSync(out);
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', env }).stdout.trim();
  const cfgFile = path.join(dir, 'speck', 'config.yml');
  const calls = () => fs.readdirSync(out).filter(f => f.endsWith('.json')).map(f => ({ file: f, ...JSON.parse(fs.readFileSync(path.join(out, f), 'utf8')) })).sort((a, b) => a.at - b.at || (a.file < b.file ? -1 : 1)); // in launch order (builds launched together, by id)
  return { dir, out, g, calls, cfgFile };
}
function buildRunRepo(dir, { tickets, max, worktrees, cmd }) {
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', env }).stdout.trim();
  g('init', '-q', '-b', 'main');
  assert.equal(speck(dir, env, 'init', '--skip-checks').status, 0);
  const cfgFile = path.join(dir, 'speck', 'config.yml');
  let cfg = fs.readFileSync(cfgFile, 'utf8').replace(/^worktrees:.*$/m, `worktrees: ${worktrees}`);
  cfg = cfg.replace(/^build_command:.*$/m, '');
  if (cmd !== null) cfg += `\nbuild_command: ${JSON.stringify(cmd)}\n`;
  cfg = cfg.replace(/^max_parallel_builds:.*$/m, '');
  if (max !== undefined) cfg += `max_parallel_builds: ${max}\n`;
  fs.writeFileSync(cfgFile, cfg);
  fs.mkdirSync(path.join(dir, 'speck', 'tickets'), { recursive: true });
  for (const [id, o] of tickets) fs.writeFileSync(path.join(dir, 'speck', 'tickets', `${id}-t.md`), `---\n${fm({ id: `"${id}"`, ...o })}\n---\n${good}`);
  g('add', '-A'); g('commit', '-qm', 'base');
}

// Starts `speck run` in the background, collecting its output. `cli` is the CLI to run it with.
export function startRun(dir, extraEnv = {}, cli = CLI) {
  const child = spawn(process.execPath, [cli, 'run'], { cwd: dir, env: runEnv(extraEnv) });
  let out = '';
  child.stdout.on('data', d => { out += d; });
  child.stderr.on('data', d => { out += d; });
  const exited = new Promise(res => child.on('exit', code => res(code)));
  return { child, out: () => out, exited };
}
export const until = async (cond, ms = 8000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (await cond()) return true; await new Promise(r => setTimeout(r, 50)); }
  return false;
};
// 0559: how long a test of speck run's switch waits for a process to start, ship, switch or stop. On a busy machine,
// loading speck's code takes seconds and a ship took 16 (0541), so it counts on none of them happening quickly.
export const BUSY_MS = 30000;
// Waits up to `ms` for `cond`, and fails the test saying what it waited for, with `out()`'s output, if it never holds.
export const waitFor = async (cond, what, out = () => '', ms = BUSY_MS) => {
  if (!(await until(cond, ms))) assert.fail(`waited ${ms / 1000} s for ${what}, and it didn't happen.\n${out()}`);
};
export const alive = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
// 0572: speck finds a build by its session name across every process on the machine, so a stand-in agent's name must be
// its own test run's, or a copy of the same test running at the same time is found in its place (0559).
export const ownSession = name => `${name}-${process.pid}`;
// Fails unless speck finds process `pid` by the session name it runs under.
export const assertFoundBySession = (session, pid) => {
  assert.equal(sessionProcess(session), pid, `process ${pid} is found by its session ${session}`);
  assert.ok(sessionInUse(session), `session ${session} is in use`);
};
export const killAll = pids => { for (const p of pids) try { process.kill(p, 'SIGKILL'); } catch {} };
export const stopRun = async r => { if (r.child.exitCode === null) { r.child.kill('SIGINT'); await r.exited; } };
export const record = (dir, id) => JSON.parse(fs.readFileSync(path.join(dir, 'speck', '.cache', 'runs', `${id}.json`), 'utf8'));
export const runOnce = (dir, extraEnv = {}) => spawnSync(process.execPath, [CLI, 'run'], { cwd: dir, encoding: 'utf8', env: runEnv(extraEnv), timeout: 10000 });

// A build left running by an earlier speck run: a process that isn't speck run's child, and its run file (0047).
export function leftRunning(dir, id, rec = {}) {
  const p = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 60000)'], { detached: true, stdio: 'ignore' });
  p.unref();
  const runs = path.join(dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  const full = { id, session: `old-${id}`, cwd: dir, started: '2026-10-09T10:00:00.000Z', pid: p.pid, command: ['claude', id], ...rec };
  fs.writeFileSync(path.join(runs, `${id}.json`), JSON.stringify(full, null, 2));
  return { pid: p.pid, rec: full };
}
