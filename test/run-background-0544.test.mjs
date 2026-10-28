import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CLI, ROOT, env, runRepo, until, alive, killAll } from './support/run.mjs';

// ---------- 0544: speck run --background turns speck run on in the background, as the panel's switch does ----------

const runsOf = dir => path.join(dir, 'speck', '.cache', 'runs');
const logOf = dir => path.join(runsOf(dir), 'run.log');
const lockPid = dir => { try { return Number(fs.readFileSync(path.join(runsOf(dir), 'run.lock'), 'utf8').trim()) || null; } catch { return null; } };
// `speck run --background` from a shell that ends once it has: the shell is this command's parent.
const background = dir => spawnSync('sh', ['-c', `"${process.execPath}" "${CLI}" run --background`], { cwd: dir, encoding: 'utf8', env, timeout: 20000 });
const speckRuns = dir => spawnSync('ps', ['-ww', '-eo', 'pid=,args='], { encoding: 'utf8' }).stdout.split('\n')
  .filter(l => /speck\.mjs run(\s|$)/.test(l) && !/--background/.test(l)).map(l => Number(l.trim().split(/\s+/)[0]))
  .filter(pid => { try { return fs.realpathSync(`/proc/${pid}/cwd`) === fs.realpathSync(dir); } catch { return false; } });

test('0544 AC1 AC2: it starts speck run in its own process, which outlives its shell, says it\'s on and where its log is, and a second one starts nothing', async () => {
  const r = runRepo({ tickets: [] });
  let pid = null;
  try {
    const first = background(r.dir);
    pid = lockPid(r.dir);
    assert.equal(first.status, 0, first.stderr);
    assert.equal(first.stdout.trim().split('\n').length, 1, 'one line');
    assert.match(first.stdout, /speck run: on, in the background/);
    assert.match(first.stdout, /speck\/\.cache\/runs\/run\.log/);
    // The shell and the command have ended; speck run is still watching, in a process group of its own.
    assert.ok(pid && alive(pid), 'speck run holds its lock and is alive');
    assert.equal(spawnSync('ps', ['-o', 'pgid=', '-p', String(pid)], { encoding: 'utf8' }).stdout.trim(), String(pid));
    assert.match(fs.readFileSync(logOf(r.dir), 'utf8'), /speck run: watching for ready tickets/);

    const before = fs.readFileSync(logOf(r.dir), 'utf8');
    const second = background(r.dir);
    assert.equal(second.status, 0, second.stderr);
    assert.match(second.stdout, /speck run: already running in this repo/);
    assert.match(second.stdout, new RegExp(`process ${pid}`));
    assert.equal(lockPid(r.dir), pid, 'the same speck run');
    assert.deepEqual(speckRuns(r.dir), [pid], 'no other speck run started');
    assert.equal(fs.readFileSync(logOf(r.dir), 'utf8'), before, 'nothing new was started to write to the log');
  } finally {
    if (pid) { try { process.kill(pid, 'SIGINT'); } catch {} await until(() => !alive(pid), 5000); killAll([pid]); }
  }
});

test('0544 AC3: when speck run refuses, such as off the base branch, it prints speck run\'s own message, leaves nothing running and fails', () => {
  const r = runRepo({ tickets: [] });
  r.g('checkout', '-q', '-b', 'elsewhere');
  const res = background(r.dir);
  assert.notEqual(res.status, 0);
  assert.equal(res.stderr.trim(), 'This checkout is on "elsewhere", not main. speck run starts builds from main, so switch to it, then run this again.');
  assert.equal(lockPid(r.dir), null);
  assert.deepEqual(speckRuns(r.dir), []);
  assert.deepEqual(fs.readdirSync(runsOf(r.dir)).filter(f => /refusal/.test(f)), [], 'no refusal file left behind');
});

test('0544 AC3: a lock held by a live process that isn\'t speck run is refused with speck run\'s message, not taken as running', () => {
  const r = runRepo({ tickets: [] });
  fs.mkdirSync(runsOf(r.dir), { recursive: true });
  fs.writeFileSync(path.join(runsOf(r.dir), 'run.lock'), String(process.pid));
  const res = background(r.dir);
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, new RegExp(`^speck run is already running in this repo \\(process ${process.pid}\\)`));
  assert.deepEqual(speckRuns(r.dir), []);
});

test('0544 AC4: setup turns speck run on with speck run --background, with no nohup line', () => {
  const skill = fs.readFileSync(path.join(ROOT, 'skills', 'speck-setup', 'SKILL.md'), 'utf8');
  assert.match(skill, /`speck run --background`/);
  assert.doesNotMatch(skill, /nohup/);
});

test('0544 AC4: the brief and speck help list --background for speck run', () => {
  const brief = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8');
  assert.match(brief, /^\| `speck run` \|.*`--background`/m);
  const help = spawnSync(process.execPath, [CLI, 'help'], { encoding: 'utf8' }).stdout;
  assert.match(help, /^ {2}speck run \[--background\] .*--background/m);
});
