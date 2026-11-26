// Shared helpers for speck serve's tests (0756): a machine of the test's own, projects whose own speck is a stand-in
// panel (stand-in-panel.mjs) or a real older speck, and speck serve started as a process.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { speck } from './cli.mjs';
import { copied } from './copy.mjs';
import { gitEnv } from './speck.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '..', '..');
export const CLI = path.join(ROOT, 'scripts', 'speck.mjs');
const STAND_IN = path.join(HERE, 'stand-in-panel.mjs');
const tmp = prefix => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
const sleep = ms => new Promise(r => setTimeout(r, ms));

// A machine of the test's own: the home folder's speck files (SPECK_HOME_SETTINGS_DIR: the list of projects, and speck
// serve's record and log) and the records of running panels (SPECK_PANELS_DIR), so it never sees yours or another test's.
export function machine() {
  const home = tmp('speck-serve-home-');
  const settings = path.join(home, 'speck'), panels = path.join(home, 'panels');
  const env = { ...process.env, ...gitEnv, SPECK_HOME_SETTINGS_DIR: settings, SPECK_PANELS_DIR: panels };
  return { home, env, settings, panels, record: path.join(settings, 'serve.json'), log: path.join(settings, 'serve.log') };
}

// A git repo called `name` with speck set up, whose own speck (.speck/scripts/speck.mjs) is the stand-in panel.
export function standInProject(name) {
  const dir = path.join(tmp('speck-serve-'), name);
  fs.mkdirSync(path.join(dir, 'speck'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.speck', 'scripts'), { recursive: true });
  assert.equal(spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir }).status, 0);
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), 'base_branch: main\n');
  fs.writeFileSync(path.join(dir, '.speck', 'VERSION'), '1.7.0\n');
  fs.copyFileSync(STAND_IN, path.join(dir, '.speck', 'scripts', 'speck.mjs'));
  return dir;
}

// A speck project set up by speck `version`'s own init, taken from its tag in this repo, and committed. Each version
// is set up once per test file, and each call gets a copy of its own.
export function oldProject(version) {
  return fs.realpathSync(copied('old-speck', [version], 'speck-old-', dir => {
    const src = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-keep-old-src-'));
    const got = spawnSync('sh', ['-c', 'git -C "$1" archive "v$2" scripts templates skills package.json | tar -x -C "$3"', 'sh', ROOT, version, src], { encoding: 'utf8' });
    assert.equal(got.status, 0, `speck ${version} couldn't be read from its tag, v${version}: ${got.stderr}`);
    const git = (...a) => assert.equal(spawnSync('git', a, { cwd: dir, env: { ...process.env, ...gitEnv } }).status, 0, `git ${a.join(' ')}`);
    git('init', '-q', '-b', 'main');
    const init = spawnSync(process.execPath, [path.join(src, 'scripts', 'speck.mjs'), 'init', '--skip-checks'], { cwd: dir, encoding: 'utf8', env: { ...process.env, ...gitEnv } });
    assert.equal(init.status, 0, init.stderr);
    git('add', '-A');
    git('commit', '-qm', 'speck set up');
  }));
}

// Puts a project on the machine's list, or takes it off, with speck projects.
export function addProject(m, dir) {
  const r = speck(dir, m.env, 'projects', 'add', dir);
  assert.equal(r.status, 0, r.stderr);
}
export function removeProject(m, dir) {
  const r = speck(os.tmpdir(), m.env, 'projects', 'remove', dir);
  assert.equal(r.status, 0, r.stderr);
}

// speck serve on the machine, as a process in the foreground, with all it prints.
export function startServe(m, args = []) {
  const child = spawn(process.execPath, [CLI, 'serve', ...args], { cwd: os.tmpdir(), env: m.env });
  let out = '';
  child.stdout.on('data', d => { out += d; });
  child.stderr.on('data', d => { out += d; });
  return { child, out: () => out };
}

// speck serve run to its end, as `speck serve --stop` or `--background` is, with what it printed.
export const serveOnce = (m, ...args) => spawnSync(process.execPath, [CLI, 'serve', ...args], { cwd: os.tmpdir(), env: m.env, encoding: 'utf8', timeout: 60000 });

// Waits for check() to give something truthy, and gives it, or fails naming `what` after `ms`.
export async function until(what, check, ms = 10000) {
  const end = Date.now() + ms;
  for (;;) {
    const v = await check();
    if (v) return v;
    if (Date.now() > end) assert.fail(`${what} didn't happen within ${ms / 1000} seconds`);
    await sleep(50);
  }
}

// The port of the last address speck serve printed for the project called `name`, or null.
export function portOf(out, name) {
  const all = [...out.matchAll(new RegExp(`speck serve: ${name}: http://127\\.0\\.0\\.1:(\\d+)/`, 'g'))];
  return all.length ? Number(all[all.length - 1][1]) : null;
}

// A GET to 127.0.0.1:<port>, its body read as JSON, or null when nothing answers there.
export function getJson(port, pathName) {
  return new Promise(resolve => {
    const req = http.get({ host: '127.0.0.1', port, path: pathName, headers: { Host: `127.0.0.1:${port}` }, timeout: 2000 }, res => {
      let body = '';
      res.setEncoding('utf8').on('data', d => { body += d; });
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve(null); } });
      res.on('error', () => resolve(null));
    });
    req.on('timeout', () => req.destroy());
    req.on('error', () => resolve(null));
  });
}

export const pidAlive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
export const readJson = file => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } };

// The records of the panels running on the machine for `dir`, as speck projects reads them.
export const panelRecords = (m, dir) => {
  let names = [];
  try { names = fs.readdirSync(m.panels).filter(n => /^\d+\.json$/.test(n)); } catch { return []; }
  return names.map(n => readJson(path.join(m.panels, n))).filter(r => r && r.repo === dir && pidAlive(r.pid));
};

// The project's stand-in panel, started by hand on a free port, once it's serving: { child, port }.
export async function panelByHand(m, dir) {
  for (let tries = 0; tries < 5; tries++) {
    const port = await new Promise(resolve => { const s = http.createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); });
    const child = spawn(process.execPath, [path.join(dir, '.speck', 'scripts', 'speck.mjs'), 'panel', '--port', String(port)], { cwd: dir, env: m.env, stdio: 'ignore' });
    const served = await until('the panel started by hand', async () => (child.exitCode !== null ? 'exited' : (await getJson(port, '/api/panel'))?.repo === dir && 'serving'));
    if (served === 'serving') return { child, port };
  }
  assert.fail('the panel started by hand found no free port');
}

// Stops a speck serve started with startServe, as Ctrl+C does, and waits for it to end.
export async function endServe(s) {
  if (s.child.exitCode !== null || s.child.signalCode !== null) return;
  let timer;
  const gone = new Promise(r => { s.child.once('exit', r); timer = setTimeout(r, 20000); });
  s.child.kill('SIGINT');
  await gone;
  clearTimeout(timer);
  if (s.child.exitCode === null && s.child.signalCode === null) s.child.kill('SIGKILL');
}

// The command line a process runs, or '' when it has gone.
export const argsOf = pid => spawnSync('ps', ['-ww', '-o', 'args=', '-p', String(pid)], { encoding: 'utf8' }).stdout.trim();
// The process group a process is in, or null when it has gone.
export const groupOf = pid => { const g = spawnSync('ps', ['-o', 'pgid=', '-p', String(pid)], { encoding: 'utf8' }).stdout.trim(); return g ? Number(g) : null; };
