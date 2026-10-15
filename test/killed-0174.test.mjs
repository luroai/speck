// 0174: killing a ship, a test run or a build ends its test command, and every process that started, too.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { CLI, env, gIn, shipRepo } from './support/ship.mjs';
import { runRepo, startRun, stopRun, gitEnv } from './support/run.mjs';
import { hasStopped } from './support/stopped.mjs';
import { held, marked, newMark, MARK } from './support/held.mjs';
import { stopBuild } from '../scripts/run.mjs';

const speck = (cwd, e, ...a) => spawnSync(process.execPath, [CLI, ...a], { cwd, encoding: 'utf8', env: { ...env, ...e }, timeout: 60000 });

// A committed repo with speck set up and the given test command.
function testRepo(cmd) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-killed-')));
  gIn(dir, 'init', '-q', '-b', 'main');
  assert.equal(speck(dir, {}, 'init', '--skip-checks').status, 0);
  assert.equal(speck(dir, {}, 'config', 'set', 'commands.test', cmd).status, 0);
  fs.writeFileSync(path.join(dir, 'app.txt'), 'one\n');
  gIn(dir, 'add', '-A'); gIn(dir, 'commit', '-qm', 'base');
  return dir;
}

// speck with `args` in its own process group, marked so every process it starts can be found.
const started = [];
afterEach(() => { for (const c of started.splice(0)) try { process.kill(-c.pid, 'SIGKILL'); } catch { /* gone */ } });
function launch(cwd, ...args) {
  const mark = newMark();
  const child = spawn(process.execPath, [CLI, ...args], { cwd, env: { ...env, [MARK]: mark }, detached: true, stdio: 'ignore' });
  started.push(child);
  return { child, mark };
}

// Kills speck with SIGKILL once its test command is running, `how`: just speck's own process, or its whole group, as a
// tool's time limit or a test does. Then checks that nothing it started is still running 10 seconds later.
async function killedWhileTesting(cwd, h, args, how) {
  const { child, mark } = launch(cwd, ...args);
  assert.ok(await hasStopped(h.started, 30000), 'the test command started');
  assert.ok(marked(mark).length > 1, 'speck and its tests are running');
  process.kill(how === 'group' ? -child.pid : child.pid, 'SIGKILL');
  assert.ok(await hasStopped(() => marked(mark).length === 0), `every process speck started has ended (still running: ${marked(mark).join(', ')})`);
  assert.ok(await hasStopped(() => h.running().length === 0, 1000), `the test command's processes have ended (still running: ${h.running().join(', ')})`);
}

for (const how of ['process', 'group']) {
  test(`0174 AC1: speck test killed with SIGKILL (its ${how}) ends its test command and everything that started`, async () => {
    const h = held();
    await killedWhileTesting(testRepo(h.test), h, ['test', '--fresh'], how);
  });

  test(`0174 AC1: speck ship killed with SIGKILL (its ${how}) ends its test command and everything that started`, async () => {
    const h = held();
    const r = shipRepo({ test: h.test });
    await killedWhileTesting(r.dir, h, ['ship', '1'], how);
  });
}

test('0174 AC1: speck test --files killed with SIGKILL ends its test command and everything that started', async () => {
  const h = held();
  const dir = testRepo('true');
  assert.equal(speck(dir, {}, 'config', 'set', 'commands.test_files', `${h.test} {files}`).status, 0);
  await killedWhileTesting(dir, h, ['test', '--files', 'app.txt'], 'process');
});

// A build launched by speck run that runs `speck test`, marked so every process that starts can be found.
const BUILD = `
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const [cli, out, id, mark, markName] = process.argv.slice(2);
fs.writeFileSync(path.join(out, id + '.build.json'), JSON.stringify({ pid: process.pid }));
spawnSync(process.execPath, [cli, 'test', '--fresh'], { stdio: 'inherit', env: { ...process.env, [markName]: mark } });
setInterval(() => { if (!fs.existsSync(out)) process.exit(0); }, 50);
`;
async function buildTesting() {
  const h = held();
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'build-'));
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'build-out-'));
  fs.writeFileSync(path.join(bin, 'build.cjs'), BUILD);
  const mark = newMark();
  const r = runRepo({ command: `"${process.execPath}" "${path.join(bin, 'build.cjs')}" "${CLI}" "${out}" {id} ${mark} ${MARK}` });
  assert.equal(speck(r.dir, {}, 'config', 'set', 'commands.test', h.test).status, 0);
  r.g('commit', '-qam', 'test command');
  const run = startRun(r.dir);
  assert.ok(await hasStopped(h.started, 30000), `the build's test command started\n${run.out()}`);
  assert.ok(marked(mark).length > 1, 'speck test and its tests are running');
  return { h, r, run, mark };
}
async function stoppedWhileTesting(stop) {
  const { h, r, run, mark } = await buildTesting();
  try {
    stop(r.dir);
    assert.ok(await hasStopped(() => marked(mark).length === 0), `every process speck test started has ended (still running: ${marked(mark).join(', ')})`);
    assert.ok(await hasStopped(() => h.running().length === 0, 1000), `the test command's processes have ended (still running: ${h.running().join(', ')})`);
  } finally { await stopRun(run); }
}

test('0174 AC2: speck stop ends a build\'s test command and everything that started', async () => {
  await stoppedWhileTesting(dir => {
    const res = speck(dir, {}, 'stop', '0001');
    assert.equal(res.status, 0, res.stderr);
  });
});

test('0174 AC2: the panel\'s Stop build ends a build\'s test command and everything that started', async () => {
  // The panel's Stop build button calls stopBuild, in the panel's own process, which commits the blocked ticket.
  const was = { ...process.env };
  Object.assign(process.env, gitEnv);
  try { await stoppedWhileTesting(dir => stopBuild(dir, ['0001'], () => {})); } finally {
    for (const k of Object.keys(gitEnv)) if (was[k] === undefined) delete process.env[k]; else process.env[k] = was[k];
  }
});

test('0174 AC3: a test command that isn\'t killed runs to the end, with its own exit code and output', () => {
  const dir = testRepo('sleep 1.5; echo all done; exit 3');
  const res = speck(dir, {}, 'test', '--fresh');
  assert.equal(res.status, 3, res.stdout + res.stderr);
  assert.match(res.stdout, /all done/);
});

test('0174 AC3: speck test --files runs its command to the end too', () => {
  const dir = testRepo('true');
  assert.equal(speck(dir, {}, 'config', 'set', 'commands.test_files', 'sleep 1.5; echo files {files}').status, 0);
  const res = speck(dir, {}, 'test', '--files', 'app.txt');
  assert.equal(res.status, 0, res.stdout + res.stderr);
  assert.match(res.stdout, /files app\.txt/);
});

test('0174 AC3: the stall limit still ends a test command that stops writing output, and everything it started', async () => {
  const h = held();
  const dir = testRepo(h.test);
  const mark = newMark();
  const res = spawnSync(process.execPath, [CLI, 'test', '--fresh'], { cwd: dir, encoding: 'utf8', env: { ...env, SPECK_STALL_MS: '1500', [MARK]: mark }, timeout: 60000 });
  assert.notEqual(res.status, 0);
  assert.match(res.stdout + res.stderr, /The tests stalled: no output for 1\.5 seconds/);
  assert.ok(await hasStopped(() => marked(mark).length === 0), `every process it started has ended (still running: ${marked(mark).join(', ')})`);
  assert.ok(await hasStopped(() => h.running().length === 0, 1000), `the test command's processes have ended (still running: ${h.running().join(', ')})`);
});
