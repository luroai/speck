import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0619: a build's panels stay out of your project menu, and a build only ever stops the panels it started.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { panelsDir, buildPanelsDir, runningPanels } from '../scripts/panel-projects.mjs';
import { stopBuildPanels } from '../scripts/build-panels.mjs';
import { ROOT, runRepo, startRun, stopRun, waitFor, alive, killAll, ownSession, leftRunning } from './support/run.mjs';
import { keptFile } from './support/copy.mjs';
import { panelLike, recordIn, until } from './support/build-panels.mjs';

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const userDir = () => process.env.SPECK_PANELS_DIR;
const buildRoot = () => process.env.SPECK_BUILD_PANELS_DIR;
// The environment of a build speck run launched, without the tests' own panel folder.
const inBuild = session => { const e = { ...process.env, SPECK_BUILD_SESSION: session }; delete e.SPECK_PANELS_DIR; return e; };

test('0619 AC1: the build skill starts and stops its panel by port, and never stops processes by name', () => {
  const step = read('skills/speck-build/SKILL.md').split('\n').find(l => l.includes('**Pictures of a visual change.**'));
  assert.ok(step, 'the pictures step is there');
  assert.ok(step.includes('`speck panel --port <a free port> --background`'), 'it starts the panel in the background on a free port');
  assert.ok(step.includes('`speck panel --stop --port <that port>`'), 'it stops the panel on that port');
  assert.ok(step.includes('`pkill`') && step.includes('`killall`'), 'it names pkill and killall as what never to use');
});

test('0619 AC2: a panel started inside a build records itself in the build\'s folder, out of your project menu', async () => {
  const session = ownSession('ac2');
  assert.equal(panelsDir(inBuild(session)), path.join(buildRoot(), session));
  assert.equal(panelsDir({ ...inBuild(session), SPECK_PANELS_DIR: userDir() }), userDir(), 'the tests\' own folder still comes first');
  assert.equal(path.dirname(buildPanelsDir('../../etc')), buildRoot(), 'a session that isn\'t a safe name stays inside the folder');
  // A real process with the build's environment, registering as a panel does.
  const p = panelLike(inBuild(session), 41901);
  try {
    await waitFor(() => fs.existsSync(path.join(buildRoot(), session, '41901.json')), 'the panel\'s record in the build\'s folder');
    assert.deepEqual(runningPanels(userDir()).filter(r => r.port === 41901), [], 'it isn\'t in your project menu');
    assert.deepEqual(runningPanels(path.join(buildRoot(), session)).map(r => r.port), [41901]);
  } finally { killAll([p.pid]); }
});

test('0619 AC3: stopping a build\'s panels stops only the ones it recorded, still holding its session', async () => {
  const s = ownSession('ac3'), other = ownSession('ac3-other');
  const mine = panelLike(inBuild(s), 41911);
  const notPanel = panelLike(inBuild(s), 0); // the build's own process, not a panel: not recorded
  const otherBuild = panelLike(inBuild(other), 41912);
  const pids = [mine.pid, notPanel.pid, otherBuild.pid];
  try {
    await waitFor(() => fs.existsSync(path.join(buildRoot(), s, '41911.json')) && fs.existsSync(path.join(buildRoot(), other, '41912.json')), 'both builds\' panel records');
    const stopped = stopBuildPanels(s);
    assert.deepEqual(stopped, [{ port: 41911, pid: mine.pid }]);
    assert.ok(await until(() => !alive(mine.pid)), 'the build\'s panel stopped');
    assert.ok(alive(notPanel.pid), 'the build\'s other process is left alone');
    assert.ok(alive(otherBuild.pid), 'another build\'s panel is left alone');
    assert.ok(!fs.existsSync(path.join(buildRoot(), s)), 'the build\'s panel folder is gone');
    assert.deepEqual(stopBuildPanels(s), [], 'a second clean-up finds nothing');
    assert.deepEqual(stopBuildPanels(''), []);
    assert.deepEqual(stopBuildPanels(undefined), []);
  } finally { killAll(pids); }
});

test('0619 AC3: when a build speck run launched ends, speck run stops the panel it left running', async () => {
  const user = panelLike({ ...process.env }, 41921); // your own panel, in your menu's folder
  // A build that starts a panel on its own and ends, leaving it running.
  const build = keptFile('build-0619.mjs', `
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const env = { ...process.env }; delete env.SPECK_PANELS_DIR;
const code = "const { registerPanel } = await import(" + JSON.stringify(${JSON.stringify(pathToFileURL(path.join(ROOT, 'scripts', 'panel-projects.mjs')).href)}) + "); registerPanel({ port: 41922, name: 'demo', repo: '/' }); setInterval(() => {}, 1000);";
const p = spawn(process.execPath, ['--input-type=module', '-e', code], { env, detached: true, stdio: 'ignore' });
p.unref();
const file = path.join(process.env.SPECK_BUILD_PANELS_DIR, process.env.SPECK_BUILD_SESSION, '41922.json');
for (let i = 0; i < 200 && !fs.existsSync(file); i++) await new Promise(r => setTimeout(r, 50));
fs.writeFileSync(path.join(process.env.SPECK_BUILD_PANELS_DIR, 'panel-0619.pid'), String(p.pid));
`);
  const r = runRepo({ command: `"${process.execPath}" "${build}" {id}` });
  const run = startRun(r.dir);
  const pidFile = path.join(buildRoot(), 'panel-0619.pid');
  let panel = null;
  try {
    await waitFor(() => fs.existsSync(pidFile), 'the build to start its panel', run.out);
    panel = Number(fs.readFileSync(pidFile, 'utf8'));
    await waitFor(() => run.out().includes('0001 build exited'), 'the build to end', run.out);
    await waitFor(() => !alive(panel), 'speck run to stop the build\'s panel', run.out);
    assert.match(run.out(), /0001: stopped the panel its build left running at http:\/\/127\.0\.0\.1:41922\//);
    assert.ok(alive(user.pid), 'your own panel is still running');
  } finally { await stopRun(run); killAll([user.pid, ...(panel ? [panel] : [])]); }
});

test('0619 AC3: a build that ended while speck run was off has its panel stopped when speck run starts again', async () => {
  const s = ownSession('ac3-off');
  const r = runRepo();
  const build = leftRunning(r.dir, '0001', { session: s }); // an earlier speck run's build
  const panel = panelLike(inBuild(s), 41941), other = panelLike(inBuild(ownSession('ac3-on')), 41942);
  const user = panelLike({ ...process.env }, 41943);
  let run = null;
  try {
    await waitFor(() => [`${s}/41941.json`, `${ownSession('ac3-on')}/41942.json`].every(f => fs.existsSync(path.join(buildRoot(), f))) && fs.existsSync(path.join(userDir(), '41943.json')), 'the panels\' records');
    killAll([build.pid]); // the build ends while speck run is off
    await waitFor(() => !alive(build.pid), 'the build to end');
    run = startRun(r.dir);
    await waitFor(() => !alive(panel.pid), 'speck run to stop the ended build\'s panel', run.out);
    assert.match(run.out(), /0001: stopped the panel its build left running at http:\/\/127\.0\.0\.1:41941\//);
    assert.ok(alive(other.pid), 'another build\'s panel is still running');
    assert.ok(alive(user.pid), 'your own panel is still running');
  } finally { if (run) await stopRun(run); killAll([build.pid, panel.pid, other.pid, user.pid]); }
});

test('0619 AC4: a panel you started is never stopped by a build\'s clean-up, even with its record in the build\'s folder', async () => {
  const s = ownSession('ac4');
  const user = panelLike({ ...process.env }, 41931); // started from the command line: no build session
  try {
    await waitFor(() => fs.existsSync(path.join(userDir(), '41931.json')), 'your panel\'s record');
    // A record in the build's folder naming your panel's process, as a reused pid or a copied record would.
    recordIn(path.join(buildRoot(), s), 41931, user.pid);
    assert.deepEqual(stopBuildPanels(s), []);
    await new Promise(r => setTimeout(r, 200));
    assert.ok(alive(user.pid), 'your panel is still running');
    assert.deepEqual(runningPanels(userDir()).filter(p => p.port === 41931).map(p => p.port), [41931], 'and still in your menu');
  } finally { killAll([user.pid]); }
});
