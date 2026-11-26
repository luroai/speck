// 0756: `speck serve` starts and looks after a panel for every project on `speck projects`' list, each on its own copy
// of speck. These tests run each project's own speck as a stand-in panel (support/stand-in-panel.mjs), which serves
// what speck serve asks a panel for, so they don't wait for real panels to start: serve-0756-old.test.mjs runs real ones.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { speck } from './support/cli.mjs';
import { ROOT, CLI, machine, standInProject, addProject, removeProject, startServe, serveOnce, until, portOf, getJson, pidAlive, readJson, panelRecords, panelByHand, endServe, groupOf, freePortNow } from './support/serve.mjs';

const nameOf = dir => path.basename(dir);
const sleep = ms => new Promise(r => setTimeout(r, ms));
// The pid of the panel serving `dir` on `port`, once it does.
const panelPid = (port, dir) => until(`${nameOf(dir)}'s panel answering on ${port}`, async () => (await getJson(port, '/api/panel'))?.repo === dir && (await getJson(port, '/copy'))?.pid);
const gone = (pid, port, dir) => until(`${nameOf(dir)}'s panel stopping`, async () => !pidAlive(pid) && (await getJson(port, '/api/panel'))?.repo !== dir);

test('0756 AC1: speck serve starts a panel for each listed project, each on its own copy of speck and its own free port on 127.0.0.1, and prints each address', async () => {
  const m = machine(), a = standInProject('alpha'), b = standInProject('bravo');
  addProject(m, a); addProject(m, b);
  const s = startServe(m);
  try {
    const [pa, pb] = await until('both addresses printed', () => { const x = portOf(s.out(), 'alpha'), y = portOf(s.out(), 'bravo'); return x && y && [x, y]; });
    assert.notEqual(pa, pb, 'each on a port of its own');
    for (const [port, dir] of [[pa, a], [pb, b]]) {
      assert.deepEqual(await getJson(port, '/api/panel'), { repo: dir, url: null }, `${nameOf(dir)}'s panel answers at http://127.0.0.1:${port}/`);
      assert.equal((await getJson(port, '/copy')).script, path.join(dir, '.speck', 'scripts', 'speck.mjs'), 'on the project\'s own copy');
      assert.equal(panelRecords(m, dir).length, 1, 'one panel for the project');
      assert.match(fs.readFileSync(path.join(dir, 'speck', '.cache', 'panel.log'), 'utf8'), new RegExp(`speck panel: http://127\\.0\\.0\\.1:${port}/`), 'its output in its speck/.cache/panel.log');
    }
  } finally { await endServe(s); }
});

test('0756 AC1: a project whose panel is already running is left as it is, with its address printed', async () => {
  const m = machine(), a = standInProject('alpha'), b = standInProject('bravo');
  addProject(m, a); addProject(m, b);
  const hand = await panelByHand(m, a);
  const s = startServe(m);
  try {
    await until('bravo started', () => portOf(s.out(), 'bravo'));
    await until('alpha\'s address printed', () => portOf(s.out(), 'alpha'));
    assert.equal(portOf(s.out(), 'alpha'), hand.port, 'the running panel\'s address');
    assert.match(s.out(), /alpha: http:\/\/127\.0\.0\.1:\d+\/ \(already running, so left as it is\)/);
    assert.equal(hand.child.exitCode, null, 'the panel started by hand is still running');
    assert.equal((await getJson(hand.port, '/copy')).pid, hand.child.pid, 'and still the one serving');
    assert.equal(panelRecords(m, a).length, 1, 'no second panel for alpha');
  } finally { await endServe(s); hand.child.kill(); }
});

test('0756 AC1: a second speck serve says where the first one is and exits, starting nothing', async () => {
  const m = machine(), a = standInProject('alpha');
  addProject(m, a);
  const s = startServe(m);
  try {
    await until('alpha started', () => portOf(s.out(), 'alpha'));
    const second = serveOnce(m);
    assert.equal(second.status, 1, second.stdout + second.stderr);
    assert.match(second.stderr, new RegExp(`speck serve is already running on this machine \\(process ${s.child.pid}\\)`));
    assert.equal(panelRecords(m, a).length, 1, 'no second panel for alpha');
    assert.equal(readJson(m.record).pid, s.child.pid, 'the first one\'s record is kept');
  } finally { await endServe(s); }
});

test('0756 AC2: a panel speck serve started that exits is started again within 10 seconds', async () => {
  const m = machine(), a = standInProject('alpha');
  addProject(m, a);
  const s = startServe(m);
  try {
    const port = await until('alpha started', () => portOf(s.out(), 'alpha'));
    const first = await panelPid(port, a);
    process.kill(first, 'SIGKILL');
    const killed = Date.now();
    const again = await until('alpha\'s panel started again', async () => {
      const p = portOf(s.out(), 'alpha'), copy = await getJson(p, '/copy');
      return copy && copy.pid !== first && (await getJson(p, '/api/panel'))?.repo === a && copy.pid;
    });
    assert.ok(Date.now() - killed < 10000, `started again after ${Date.now() - killed} ms`);
    assert.ok(pidAlive(again));
    assert.equal(portOf(s.out(), 'alpha'), port, 'on the same port, which was free again');
    assert.match(s.out(), /alpha's panel stopped/);
  } finally { await endServe(s); }
});

test('0756 AC2: a panel that won\'t start is tried again, saying why once, until it starts', async () => {
  const m = machine(), a = standInProject('alpha'), b = standInProject('bravo');
  const own = dir => path.join(dir, '.speck', 'scripts', 'speck.mjs'), working = fs.readFileSync(own(a), 'utf8');
  for (const dir of [a, b]) { fs.writeFileSync(own(dir), 'console.error("This copy of speck is broken."); process.exit(3);\n'); addProject(m, dir); }
  const tries = dir => (fs.readFileSync(path.join(dir, 'speck', '.cache', 'panel.log'), 'utf8').match(/This copy of speck is broken/g) || []).length;
  const s = startServe(m);
  try {
    await until('the failures said', () => ['alpha', 'bravo'].every(n => new RegExp(`${n}'s panel didn't start: it stopped \\(exit code 3\\), saying: This copy of speck is broken\\. speck serve tries again in 2 seconds`).test(s.out())));
    fs.writeFileSync(own(a), working); // alpha's speck works from its next try; bravo's stays broken
    const port = await until('alpha started on its next try', () => portOf(s.out(), 'alpha'));
    assert.equal((await getJson(port, '/api/panel'))?.repo, a);
    await until('bravo tried again', () => tries(b) >= 2);
    assert.equal(s.out().match(/bravo's panel didn't start/g).length, 1, 'why is said once, not on each try');
  } finally { await endServe(s); }
});

test('0756 AC2: a start that failed changes nothing once a later one has worked, even after its own time to answer has passed', async () => {
  const m = machine(), a = standInProject('alpha'), own = path.join(a, '.speck', 'scripts', 'speck.mjs'), working = fs.readFileSync(own, 'utf8');
  fs.writeFileSync(own, 'console.error("This copy of speck is broken."); process.exit(3);\n');
  addProject(m, a);
  const began = Date.now();
  const s = startServe(m, [], { SPECK_SERVE_START_MS: '1000' }); // each start has a second to answer
  try {
    await until('the failure said', () => /alpha's panel didn't start/.test(s.out()));
    fs.writeFileSync(own, working);
    const port = await until('alpha started on its next try', () => portOf(s.out(), 'alpha'));
    const pid = await panelPid(port, a);
    await sleep(Math.max(0, began + 3000 - Date.now())); // past the failed start's second to answer, with room to spare
    assert.doesNotMatch(s.out(), /didn't answer/, 'the failed start says nothing more');
    assert.equal(s.out().match(/alpha's panel didn't start/g).length, 1);
    assert.equal((await getJson(port, '/copy'))?.pid, pid, 'the panel that started is still the one serving');
    assert.deepEqual(readJson(m.record).panels.map(p => p.pid), [pid], 'and the one its record names');
  } finally { await endServe(s); }
});

test('0756 AC2: a project added to the list is started, and one taken off it is stopped, within 10 seconds', async () => {
  const m = machine(), a = standInProject('alpha'), b = standInProject('bravo');
  addProject(m, a);
  const s = startServe(m);
  try {
    const pa = await until('alpha started', () => portOf(s.out(), 'alpha'));
    const alpha = await panelPid(pa, a);
    addProject(m, b);
    const added = Date.now();
    const pb = await until('bravo started', () => portOf(s.out(), 'bravo'));
    await panelPid(pb, b);
    assert.ok(Date.now() - added < 10000, `bravo started after ${Date.now() - added} ms`);
    removeProject(m, a);
    const removed = Date.now();
    await gone(alpha, pa, a);
    assert.ok(Date.now() - removed < 10000, `alpha stopped after ${Date.now() - removed} ms`);
    assert.equal((await getJson(pb, '/api/panel'))?.repo, b, 'bravo carries on');
    assert.ok(fs.existsSync(path.join(a, 'speck', 'config.yml')), 'nothing in alpha is changed');
  } finally { await endServe(s); }
});

test('0756 AC3: speck serve --background keeps running after the shell that started it ends, writing its output to a log in the home folder', async () => {
  const m = machine(), a = standInProject('alpha');
  addProject(m, a);
  // From a shell that has ended by the time it returns, as the terminal's would.
  const r = spawnSync('sh', ['-c', `"${process.execPath}" "${CLI}" serve --background --port ${freePortNow()}`], { cwd: os.tmpdir(), env: m.env, encoding: 'utf8', timeout: 60000 }); // 0757: a port of its own
  try {
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const port = portOf(r.stdout, 'alpha');
    assert.ok(port, `it says alpha's address: ${r.stdout}`);
    assert.ok(r.stdout.includes(m.log), `it says where its output is: ${r.stdout}`);
    const { pid } = readJson(m.record);
    assert.ok(pidAlive(pid), 'speck serve is still running');
    assert.equal(groupOf(pid), pid, 'in a process group of its own, away from the shell\'s');
    assert.equal((await getJson(port, '/api/panel'))?.repo, a, 'and alpha\'s panel is serving');
    assert.equal(portOf(fs.readFileSync(m.log, 'utf8'), 'alpha'), port, 'its output is in the log');
    // It's still looking after the panels: one that exits is started again, and the log says so.
    process.kill(await panelPid(port, a), 'SIGKILL');
    await until('the log saying alpha\'s panel stopped', () => /alpha's panel stopped/.test(fs.readFileSync(m.log, 'utf8')));
    const again = serveOnce(m, '--background');
    assert.equal(again.status, 0, again.stderr);
    assert.match(again.stdout, new RegExp(`already running on this machine \\(process ${pid}\\)`));
  } finally { serveOnce(m, '--stop'); }
});

test('0756 AC3: speck serve --stop stops it and every panel it started, and nothing else', async () => {
  const m = machine(), a = standInProject('alpha'), b = standInProject('bravo'), c = standInProject('charlie');
  addProject(m, a); addProject(m, b); addProject(m, c);
  const hand = await panelByHand(m, a);
  const other = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
  try {
    const r = serveOnce(m, '--background');
    assert.equal(r.status, 0, r.stderr);
    const { pid } = readJson(m.record);
    const pb = portOf(r.stdout, 'bravo'), pc = portOf(r.stdout, 'charlie');
    const bravo = await panelPid(pb, b), charlie = await panelPid(pc, c);
    const stop = serveOnce(m, '--stop');
    assert.equal(stop.status, 0, stop.stdout + stop.stderr);
    assert.match(stop.stdout, new RegExp(`speck serve: stopped \\(process ${pid}\\) and the 2 panels it started: bravo, charlie`));
    assert.ok(!pidAlive(pid), 'speck serve has stopped');
    await gone(bravo, pb, b);
    await gone(charlie, pc, c);
    assert.equal(hand.child.exitCode, null, 'the panel started by hand is still running');
    assert.equal((await getJson(hand.port, '/api/panel'))?.repo, a);
    assert.equal(other.exitCode, null, 'another process is left alone');
    assert.equal(fs.existsSync(m.record), false, 'its record is gone');
    assert.match(serveOnce(m, '--stop').stdout, /speck serve isn't running on this machine/);
  } finally { hand.child.kill(); other.kill(); }
});

test('0756 AC3: after a speck serve is killed, the next one looks after the panels it started, and --stop stops them', async () => {
  const m = machine(), a = standInProject('alpha');
  addProject(m, a);
  const s = startServe(m);
  const port = await until('alpha started', () => portOf(s.out(), 'alpha'));
  const alpha = await panelPid(port, a);
  s.child.kill('SIGKILL');
  await until('the first speck serve ending', () => s.child.exitCode !== null || s.child.signalCode !== null);
  assert.ok(pidAlive(alpha), 'its panel carries on');
  const next = startServe(m);
  try {
    await until('the next one taking alpha\'s panel over', () => /alpha: http:\/\/127\.0\.0\.1:\d+\/ \(started by the last speck serve, looked after again\)/.test(next.out()));
    assert.equal(portOf(next.out(), 'alpha'), port);
    assert.equal((await getJson(port, '/copy')).pid, alpha, 'the same panel, not a second one');
    await endServe(next);
    await gone(alpha, port, a);
  } finally { await endServe(next); }
});

test('0756 AC3: a panel taken over from a killed speck serve is never signalled once its pid is another program\'s', async () => {
  const m = machine(), a = standInProject('alpha');
  addProject(m, a);
  const first = startServe(m);
  const port = await until('alpha started', () => portOf(first.out(), 'alpha'));
  const pid = await panelPid(port, a);
  first.child.kill('SIGKILL');
  await until('the first speck serve ending', () => first.child.exitCode !== null || first.child.signalCode !== null);
  const s = startServe(m);
  try {
    await until('alpha\'s panel taken over', () => /alpha: http:\/\/127\.0\.0\.1:\d+\/ \(started by the last speck serve, looked after again\)/.test(s.out()));
    process.kill(pid, 'SIGUSR2'); // the panel stops, and its pid is another program's
    await until('alpha given a panel again', async () => { const c = await getJson(portOf(s.out(), 'alpha'), '/copy'); return c && c.pid !== pid; });
    removeProject(m, a);
    await until('alpha\'s new panel stopped', () => /alpha was taken off your list/.test(s.out()));
    await endServe(s);
    assert.ok(pidAlive(pid), 'the program with the old panel\'s pid is still running');
  } finally { await endServe(s); try { process.kill(pid, 'SIGKILL'); } catch { /* gone */ } }
});

test('0756 AC3: --stop stops the panels of a speck serve that was killed, and only those', async () => {
  const m = machine(), a = standInProject('alpha'), b = standInProject('bravo');
  addProject(m, a); addProject(m, b);
  const hand = await panelByHand(m, b);
  const s = startServe(m);
  try {
    const port = await until('alpha started', () => portOf(s.out(), 'alpha'));
    const alpha = await panelPid(port, a);
    s.child.kill('SIGKILL');
    await until('speck serve ending', () => s.child.exitCode !== null || s.child.signalCode !== null);
    const stop = serveOnce(m, '--stop');
    assert.equal(stop.status, 0, stop.stderr);
    assert.match(stop.stdout, /speck serve isn't running on this machine, but 1 panel it started was: stopped alpha/);
    await gone(alpha, port, a);
    assert.equal(hand.child.exitCode, null, 'the panel started by hand is still running');
    assert.equal(fs.existsSync(m.record), false);
  } finally { hand.child.kill(); await endServe(s); }
});

test('0756 AC3: --background and --stop together, or an option it doesn\'t know, are refused, starting nothing', () => {
  const m = machine();
  const both = serveOnce(m, '--background', '--stop');
  assert.equal(both.status, 1);
  assert.match(both.stderr, /Give --background or --stop, not both/);
  const odd = serveOnce(m, '--bogus');
  assert.equal(odd.status, 1);
  assert.match(odd.stderr, /speck serve doesn't take --bogus/);
  assert.equal(fs.existsSync(m.record), false, 'nothing started');
});

test('0756 AC5: the brief\'s command table and speck help describe speck serve, --background and --stop', () => {
  const row = fs.readFileSync(path.join(ROOT, 'docs', 'brief.md'), 'utf8').split('\n').find(l => l.startsWith('| `speck serve'));
  assert.ok(row, 'the command table has a row for speck serve');
  for (const option of ['--background', '--stop']) assert.ok(row.includes(option), `its row names ${option}`);
  const help = speck(os.tmpdir(), process.env, 'help').stdout.split('\n').find(l => l.startsWith('  speck serve'));
  assert.ok(help && help.includes('--background') && help.includes('--stop'), `speck help names them: ${help}`);
});
