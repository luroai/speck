// 0726: machine_parallel_builds, saved in your home folder, caps how many builds speck run starts across every
// project of yours on this machine.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { speck } from './support/cli.mjs';
import { gitEnv, runRepo, startRun, waitFor, stopRun, killAll } from './support/run.mjs';
import { blockedRepo } from './support/blocked.mjs';
import { goWithQueue, goWith } from '../scripts/go-with.mjs';
import { statusData } from '../scripts/speck.mjs';
import { keptFile } from './support/copy.mjs';
import { usageLimitQueue, readLimit, GRACE_MS } from '../scripts/usage-limit.mjs';
import { reviewerLimitQueue, readLimits } from '../scripts/reviewer-limit.mjs';
import { saveRecord } from '../scripts/build-records.mjs';
import { T } from './support/panel.mjs';

const tmp = name => fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), `speck-0726-${name}-`)));

// The environment speck runs with in these tests: your home settings in `home`, and no turn on this machine held.
function envWith(home, extra = {}) {
  const { NODE_TEST_CONTEXT, SPECK_MACHINE_TURN, ...rest } = process.env;
  return { ...rest, ...gitEnv, SPECK_HOME_SETTINGS_DIR: home, SPECK_RUN_POLL_MS: '100', ...extra };
}

const setLimit = (home, n) => {
  fs.mkdirSync(home, { recursive: true });
  fs.writeFileSync(path.join(home, 'config.yml'), `machine_parallel_builds: ${n}\n`);
};

// A committed git repo with speck set up (for config set / show).
function speckRepo(env) {
  const dir = tmp('repo');
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir, env });
  const r = speck(dir, env, 'init', '--skip-checks');
  assert.equal(r.status, 0, r.stderr);
  spawnSync('git', ['add', '-A'], { cwd: dir, env });
  spawnSync('git', ['commit', '-qm', 'base'], { cwd: dir, env });
  return dir;
}

const buildingKeys = shown => {
  const g = JSON.parse(shown).groups.find(x => x.title === 'Building and reviewing');
  return (g?.settings || []).map(s => s.key);
};

test('0726 AC1: speck config set machine_parallel_builds saves it in the home folder, every project shows it after max_parallel_builds, and "" removes it', () => {
  const home = tmp('home');
  const { SPECK_HOME_SETTINGS_DIR, ...rest } = envWith('');
  const env = { ...rest, HOME: home }; // the real home folder's place for it, in a stand-in home folder
  const a = speckRepo(env), b = speckRepo(env);
  const set = speck(a, env, 'config', 'set', 'machine_parallel_builds', '3');
  assert.equal(set.status, 0, set.stderr);
  const file = path.join(home, '.config', 'speck', 'config.yml');
  assert.match(fs.readFileSync(file, 'utf8'), /^machine_parallel_builds: 3$/m);
  assert.equal(spawnSync('git', ['status', '--porcelain', '--ignored'], { cwd: a, encoding: 'utf8' }).stdout.split('\n').filter(l => l && !l.includes('speck/.cache/')).join('\n'), '');
  assert.equal(fs.existsSync(path.join(a, 'speck', '.cache', 'machine', 'config.yml')), false);
  for (const dir of [a, b]) {
    const shown = speck(dir, env, 'config', 'show', '--json');
    assert.equal(shown.status, 0, shown.stderr);
    const keys = buildingKeys(shown.stdout);
    const atBuilds = keys.indexOf('max_parallel_builds'), atMachine = keys.indexOf('machine_parallel_builds');
    assert.ok(atBuilds >= 0, 'max_parallel_builds is shown');
    assert.equal(atMachine, atBuilds + 1, 'machine_parallel_builds follows max_parallel_builds');
    const row = JSON.parse(shown.stdout).groups.flatMap(g => g.settings).find(s => s.key === 'machine_parallel_builds');
    assert.equal(row?.value, 3, `config show in ${dir} gives it`);
    assert.match(speck(dir, env, 'config', 'show').stdout, /^ {2}machine_parallel_builds: 3 /m);
  }
  const removed = speck(b, env, 'config', 'set', 'machine_parallel_builds', '');
  assert.equal(removed.status, 0, removed.stderr);
  assert.equal(fs.existsSync(file), false, 'with nothing else in it, the file goes');
  const row = JSON.parse(speck(a, env, 'config', 'show', '--json').stdout).groups.flatMap(g => g.settings).find(s => s.key === 'machine_parallel_builds');
  assert.equal(row.value, '');
  assert.equal(row.is_default, true);
});

test('0726 AC4: a value that isn\'t a whole number of 1 or more, or --repo, is refused and changes nothing', () => {
  const home = tmp('home');
  const env = envWith(home);
  const dir = speckRepo(env);
  for (const bad of [['0'], ['-1'], ['two'], ['1.5'], ['--repo', '2'], ['--machine', '2']]) {
    const args = bad[0].startsWith('--') ? ['config', 'set', bad[0], 'machine_parallel_builds', bad[1]] : ['config', 'set', 'machine_parallel_builds', bad[0]];
    const r = speck(dir, env, ...args);
    assert.notEqual(r.status, 0, `refused: ${bad.join(' ')}`);
    assert.match(r.stderr, /machine_parallel_builds/);
    assert.doesNotMatch(r.stderr, /\n\s+at /, 'no stack trace');
  }
  assert.equal(fs.existsSync(path.join(home, 'config.yml')), false);
  assert.doesNotMatch(fs.readFileSync(path.join(dir, 'speck', 'config.yml'), 'utf8'), /machine_parallel_builds/);
});

test('0726 AC4: without it, each project\'s max_parallel_builds alone applies and no build turns are kept in the home folder', async () => {
  const home = tmp('home'), env = envWith(home);
  const a = runRepo({ tickets: [['0001', {}]], max: 1 });
  const b = runRepo({ tickets: [['0001', {}]], max: 1 });
  const runA = startRun(a.dir, env);
  const runB = startRun(b.dir, env);
  try {
    await waitFor(() => a.calls().length >= 1 && b.calls().length >= 1, 'both projects to launch a build', () => `${runA.out()}\n${runB.out()}`);
    assert.ok(a.calls().every(c => c.pid) && b.calls().every(c => c.pid));
    assert.equal(fs.existsSync(path.join(home, 'build-turns')), false);
  } finally {
    await stopRun(runA); await stopRun(runB);
    killAll([...a.calls(), ...b.calls()].map(c => c.pid));
  }
});

const foremanReady = dir => {
  try {
    const f = JSON.parse(fs.readFileSync(path.join(dir, 'speck', '.cache', 'runs', 'run.foreman.json'), 'utf8'));
    return Array.isArray(f.ready) ? f.ready : [];
  } catch { return []; }
};
const waitsOnMachine = dir => foremanReady(dir).some(r => /machine_parallel_builds/.test(r.why || ''));

test('0726 AC2: with it set to 1, a second project\'s speck run starts no build while the first\'s is running, then starts once it ends', async () => {
  const home = tmp('home'), env = envWith(home), gate = path.join(tmp('gate'), 'go');
  setLimit(home, 1);
  const a = runRepo({ tickets: [['0001', {}]], max: 2 });
  const b = runRepo({ tickets: [['0001', {}]], max: 2 });
  const runA = startRun(a.dir, { ...env, FAKE_GATE: gate, FAKE_MS: '50' });
  try {
    await waitFor(() => a.calls().length >= 1, 'project A to launch', runA.out);
    const runB = startRun(b.dir, env);
    try {
      await waitFor(() => waitsOnMachine(b.dir), 'project B to record waiting for a machine slot', runB.out);
      assert.equal(b.calls().length, 0, `B launched nothing while A held the slot:\n${runB.out()}`);
      fs.writeFileSync(gate, '');
      await waitFor(() => b.calls().length >= 1, 'project B to launch once A ends', () => `${runA.out()}\n${runB.out()}`);
    } finally { await stopRun(runB); killAll(b.calls().map(c => c.pid)); }
  } finally { await stopRun(runA); killAll(a.calls().map(c => c.pid)); }
});

test('0726 AC2: with it set to 2, two projects build at once and a third waits', async () => {
  const home = tmp('home'), env = envWith(home), gate = path.join(tmp('gate'), 'go');
  setLimit(home, 2);
  const a = runRepo({ tickets: [['0001', {}]], max: 2 });
  const b = runRepo({ tickets: [['0001', {}]], max: 2 });
  const c = runRepo({ tickets: [['0001', {}]], max: 2 });
  const runA = startRun(a.dir, { ...env, FAKE_GATE: gate, FAKE_MS: '50' });
  const runB = startRun(b.dir, { ...env, FAKE_GATE: gate, FAKE_MS: '50' });
  try {
    await waitFor(() => a.calls().length >= 1 && b.calls().length >= 1, 'A and B to launch', () => `${runA.out()}\n${runB.out()}`);
    const runC = startRun(c.dir, env);
    try {
      await waitFor(() => waitsOnMachine(c.dir), 'C to record waiting for a machine slot', runC.out);
      assert.equal(c.calls().length, 0, `C launched nothing:\n${runC.out()}`);
      fs.writeFileSync(gate, '');
      await waitFor(() => c.calls().length >= 1, 'C to launch once a slot frees', () => `${runA.out()}\n${runB.out()}\n${runC.out()}`);
    } finally { await stopRun(runC); killAll(c.calls().map(x => x.pid)); }
  } finally {
    await stopRun(runA); await stopRun(runB);
    killAll([...a.calls(), ...b.calls()].map(x => x.pid));
  }
});

test('0726 AC3: each project\'s max_parallel_builds still applies within that project', async () => {
  const home = tmp('home'), env = envWith(home), gate = path.join(tmp('gate'), 'go');
  setLimit(home, 5);
  const r = runRepo({ tickets: [['0001', {}], ['0002', {}], ['0003', {}]], max: 1 });
  const run = startRun(r.dir, { ...env, FAKE_GATE: gate, FAKE_MS: '50' });
  try {
    await waitFor(() => r.calls().length >= 1, 'the first build to launch', run.out);
    await new Promise(res => setTimeout(res, 400));
    assert.equal(r.calls().length, 1, `only one in the project while max_parallel_builds is 1:\n${run.out()}`);
    fs.writeFileSync(gate, '');
    await waitFor(() => r.calls().length >= 2, 'the next once the first ends', run.out);
  } finally { await stopRun(run); killAll(r.calls().map(c => c.pid)); }
});

test('0726: the tests\' own runs never use the real home folder\'s settings', () => {
  assert.ok(process.env.SPECK_HOME_SETTINGS_DIR, 'support/tmp.mjs points them elsewhere');
  assert.ok(!process.env.SPECK_HOME_SETTINGS_DIR.startsWith(path.join(os.homedir(), '.config')));
});

test('0726 AC1: machine_parallel_tests still shows after max_parallel_tests when both home settings exist', () => {
  const home = tmp('home'), env = envWith(home);
  const dir = speckRepo(env);
  assert.equal(speck(dir, env, 'config', 'set', 'machine_parallel_builds', '2').status, 0);
  assert.equal(speck(dir, env, 'config', 'set', 'machine_parallel_tests', '3').status, 0);
  const keys = buildingKeys(speck(dir, env, 'config', 'show', '--json').stdout);
  assert.deepEqual(
    keys.filter(k => k === 'max_parallel_builds' || k === 'machine_parallel_builds' || k === 'max_parallel_tests' || k === 'machine_parallel_tests'),
    ['max_parallel_builds', 'machine_parallel_builds', 'max_parallel_tests', 'machine_parallel_tests'],
  );
});


const deadPid = () => spawnSync(process.execPath, ['-e', 'process.pid'], { stdio: 'ignore' }).pid;
const runsFile = (dir, id) => path.join(dir, 'speck', '.cache', 'runs', `${id}.json`);
const BUILD_TURNS = pathToFileURL(fileURLToPath(new URL('../scripts/build-turns.mjs', import.meta.url))).href;

test('0726 F1: concurrent waits and PID updates never drop a live claim or let a second claim through', async () => {
  const home = tmp('home');
  setLimit(home, 1);
  const prev = process.env.SPECK_HOME_SETTINGS_DIR;
  process.env.SPECK_HOME_SETTINGS_DIR = home;
  const { takeBuildTurn, pointBuildTurn, freeBuildTurn, machineBuildWait } = await import(`${BUILD_TURNS}?f1=${Date.now()}`);
  const holder = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
  const repo = tmp('claim-repo'), id = '0001';
  let claim;
  try {
    claim = takeBuildTurn(repo, id, holder.pid);
    assert.ok(claim, 'first claim taken');
    assert.match(machineBuildWait() || '', /all 1 build slot/);
    const script = `
import { takeBuildTurn, pointBuildTurn, machineBuildWait } from ${JSON.stringify(BUILD_TURNS)};
import path from 'node:path';
import os from 'node:os';
const repo = ${JSON.stringify(repo)};
const file = ${JSON.stringify(claim.file)};
const text = ${JSON.stringify(claim.text)};
const pid = ${holder.pid};
const n = Number(process.argv[2]);
let claim = { file, text };
for (let i = 0; i < 50; i++) {
  if (machineBuildWait() === null) { console.error('SLOT FREE'); process.exit(2); }
  const otherRepo = path.join(os.tmpdir(), 'speck-0726-race-' + process.pid + '-' + n + '-' + i);
  const other = takeBuildTurn(otherRepo, String(9000 + i), process.pid);
  if (other) { console.error('EXTRA CLAIM ' + other.file); process.exit(3); }
  claim = pointBuildTurn(claim, pid) || claim;
}
console.log('ok');
`;
    const workers = Array.from({ length: 8 }, (_, i) => {
      const child = spawn(process.execPath, ['--input-type=module', '-e', script, String(i)], {
        env: { ...process.env, SPECK_HOME_SETTINGS_DIR: home }, stdio: ['ignore', 'pipe', 'pipe'],
      });
      return new Promise(res => {
        let out = '', err = '';
        child.stdout.on('data', d => { out += d; });
        child.stderr.on('data', d => { err += d; });
        child.on('exit', code => res({ code, out, err }));
      });
    });
    for (const r of await Promise.all(workers)) assert.equal(r.code, 0, `worker failed: ${r.err || r.out}`);
    assert.match(machineBuildWait() || '', /all 1 build slot/);
    assert.ok(fs.existsSync(claim.file), 'live claim still on disk');
  } finally {
    freeBuildTurn(claim);
    try { holder.kill('SIGKILL'); } catch { /* gone */ }
    if (prev === undefined) delete process.env.SPECK_HOME_SETTINGS_DIR; else process.env.SPECK_HOME_SETTINGS_DIR = prev;
  }
});

test('0726 F2: a killed build is not marked resumed while every machine slot is held, then resumes once one frees', async () => {
  const home = tmp('home'), env = envWith(home), gate = path.join(tmp('gate'), 'go');
  setLimit(home, 1);
  const resumeOut = tmp('resume-out');
  const fake = keptFile('0726-resume-fake.cjs', `const fs = require('fs'), path = require('path');
const [out, ...args] = process.argv.slice(2);
let n = 0; while (fs.existsSync(path.join(out, n + '.json'))) n++;
const call = path.join(out, n + '.json');
fs.writeFileSync(call + '.part', JSON.stringify({ at: Date.now(), args, cwd: process.cwd(), pid: process.pid, build: process.env.SPECK_BUILD_SESSION }));
fs.renameSync(call + '.part', call); // whole or not there: the test reads while this runs (0774)
console.log('fake build ' + n);
const gate = process.env.FAKE_GATE;
const end = () => setTimeout(() => process.exit(+(process.env.FAKE_EXIT || 0)), +(process.env.FAKE_MS || 0));
if (!gate) end();
else { const t = setInterval(() => { if (fs.existsSync(gate)) { clearInterval(t); end(); } else if (!fs.existsSync(path.dirname(gate))) process.exit(1); }, 50); }
`);
  const cmd = `"${process.execPath}" "${fake}" "${resumeOut}" "/speck-build {id}" --session-id {session}`;
  const a = runRepo({ tickets: [['0001', {}]], max: 2 });
  const b = runRepo({ tickets: [['0001', { status: 'building' }]], max: 2, command: cmd });
  const session = crypto.randomUUID();
  fs.mkdirSync(path.dirname(runsFile(b.dir, '0001')), { recursive: true });
  fs.writeFileSync(runsFile(b.dir, '0001'), JSON.stringify({
    id: '0001', session, cwd: b.dir, started: '2026-10-10T10:00:00.000Z', pid: deadPid(),
    command: ['claude', '-p', '/speck-build 0001', '--session-id', session],
  }, null, 2));
  fs.writeFileSync(path.join(path.dirname(runsFile(b.dir, '0001')), '0001.log'), 'first build\n');
  const bCalls = () => fs.readdirSync(resumeOut).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(resumeOut, f), 'utf8'))).sort((x, y) => x.at - y.at);
  const runA = startRun(a.dir, { ...env, FAKE_GATE: gate, FAKE_MS: '50' });
  try {
    await waitFor(() => a.calls().length >= 1, 'project A to hold the slot', runA.out);
    const runB = startRun(b.dir, { ...env, FAKE_MS: '2000' });
    try {
      await new Promise(r => setTimeout(r, 800));
      assert.equal(bCalls().length, 0, `B must not resume while A holds the slot:\n${runB.out()}`);
      assert.equal(JSON.parse(fs.readFileSync(runsFile(b.dir, '0001'), 'utf8')).resumed, undefined, 'must not consume the one-shot resume');
      fs.writeFileSync(gate, '');
      await waitFor(() => bCalls().length >= 1, 'B to resume once a slot frees', () => `${runA.out()}\n${runB.out()}`);
      assert.ok(JSON.parse(fs.readFileSync(runsFile(b.dir, '0001'), 'utf8')).resumed, 'resumed once the slot was free');
    } finally { await stopRun(runB); killAll(bCalls().map(c => c.pid)); }
  } finally { await stopRun(runA); killAll(a.calls().map(c => c.pid)); }
});

test('0726 F2: when startBuild gets no machine slot after the room check, go_with is put back for the next check', () => {
  const home = tmp('home');
  setLimit(home, 2);
  const prev = process.env.SPECK_HOME_SETTINGS_DIR;
  process.env.SPECK_HOME_SETTINGS_DIR = home;
  Object.assign(process.env, gitEnv);
  try {
    const r = blockedRepo();
    assert.equal(goWith(r.dir, '0001').status, 200);
    const before = JSON.parse(fs.readFileSync(r.record, 'utf8')).go_with;
    assert.ok(before?.option);
    let startCalls = 0;
    goWithQueue({
      repo: r.dir,
      cfg: { base_branch: 'main', branch_prefix: 'speck/' },
      words: ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'],
      max: 2,
      settings: () => ({ cfg: { base_branch: 'main', branch_prefix: 'speck/' }, words: ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'], max: 2 }),
      running: new Set(),
      startBuild: () => { startCalls += 1; return false; },
      saveRecord: (file, o) => fs.writeFileSync(file, `${JSON.stringify(o, null, 2)}\n`),
      runs: () => r.runs,
    }).check(statusData(r.dir).tickets);
    assert.equal(startCalls, 1, 'tried to start once');
    const after = JSON.parse(fs.readFileSync(r.record, 'utf8'));
    assert.deepEqual(after.go_with, before, 'go_with restored when startBuild got no slot');
    assert.equal(after.went_with, undefined);
  } finally {
    if (prev === undefined) delete process.env.SPECK_HOME_SETTINGS_DIR; else process.env.SPECK_HOME_SETTINGS_DIR = prev;
  }
});


test('0726 F2: a builder usage-limit wait keeps its run record and queue entry when startBuild gets no slot, then starts once it can', () => {
  const dir = tmp('usage-limit'), clock = { now: Date.parse('2026-11-10T11:57:00Z') };
  const RESET = Date.parse('2026-11-10T12:30:00Z');
  const cfg = { base_branch: 'main', branch_prefix: 'speck/', builder: 'claude' };
  const words = ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'];
  let allow = false, starts = [];
  const running = new Set();
  const q = usageLimitQueue({
    repo: dir, runs: () => dir, settings: () => ({ cfg, words, max: 2 }), running,
    say: () => {}, now: () => clock.now, resumeHint: () => '', statusOf: () => 'building',
    startBuild: (id, argv) => { if (!allow) return false; running.add(id); starts.push(id); return true; },
  });
  const event = (status, resetsAt = RESET / 1000) => ({ type: 'rate_limit_event', rate_limit_info: { status, resetsAt, rateLimitType: 'five_hour' } });
  const REFUSED = [ { type: 'system', subtype: 'init' }, { type: 'assistant', message: { model: 'claude-opus-5-5', content: [{ type: 'text', text: 'Working.' }] } },
    event('allowed_warning'), event('rejected'),
    { type: 'assistant', error: 'rate_limit', api_error: 'usage_limit_reached', message: { model: '<synthetic>', content: [{ type: 'text', text: "You've hit your session limit · resets 12:30pm (UTC)" }] } },
    { type: 'result', subtype: 'success', is_error: true, api_error_status: 429, result: "You've hit your session limit · resets 12:30pm (UTC)" },
  ].map(e => JSON.stringify(e)).join('\n') + '\n';
  fs.writeFileSync(path.join(dir, '0001.log'), REFUSED);
  saveRecord(path.join(dir, '0001.json'), { id: '0001', session: 's-0001', cwd: dir, pid: 1, exited: new Date(clock.now).toISOString(), exit_code: 1 });
  assert.equal(q.ended('0001', path.join(dir, '0001.log'), path.join(dir, '0001.json')), true);
  clock.now = RESET + GRACE_MS;
  q.check([T('0001', 'building')]);
  assert.deepEqual(starts, []);
  assert.ok(Object.hasOwn(JSON.parse(fs.readFileSync(path.join(dir, '0001.json'), 'utf8')), 'exited'), 'run record still has its exit');
  assert.deepEqual(readLimit(dir).builds, ['0001'], 'still on the wait list');
  allow = true;
  q.check([T('0001', 'building')]);
  assert.deepEqual(starts, ['0001']);
  assert.equal(Object.hasOwn(JSON.parse(fs.readFileSync(path.join(dir, '0001.json'), 'utf8')), 'exited'), false);
});

test('0726 F2: a reviewer usage-limit wait keeps its run record and limit file when startBuild gets no slot, then starts once it can', () => {
  const dir = tmp('reviewer-limit'), clock = { now: Date.parse('2026-11-10T11:57:00Z') };
  const RESET = Date.parse('2026-11-10T12:30:00Z');
  const cfg = { base_branch: 'main', branch_prefix: 'speck/', builder: 'claude' };
  const words = ['claude', '-p', '/speck-build {id}', '--session-id', '{session}'];
  let allow = false, starts = [];
  const running = new Set();
  const q = reviewerLimitQueue({
    repo: dir, runs: () => dir, settings: () => ({ cfg, words, max: 2 }), running,
    say: () => {}, now: () => clock.now, resumeHint: () => '',
    startBuild: (id) => { if (!allow) return false; running.add(id); starts.push(id); return true; },
  });
  fs.mkdirSync(path.join(dir, 'reviewer-limits'), { recursive: true });
  saveRecord(path.join(dir, 'reviewer-limits', '0001.json'), {
    reviewer: 'codex', resets: new Date(RESET).toISOString(),
    carry_on: new Date(RESET + GRACE_MS).toISOString(), session: 's-0001',
  });
  saveRecord(path.join(dir, '0001.json'), { id: '0001', session: 's-0001', cwd: dir, pid: 1, exited: new Date(clock.now).toISOString(), exit_code: 0 });
  clock.now = RESET + GRACE_MS;
  q.check([T('0001', 'reviewing')]);
  assert.deepEqual(starts, []);
  assert.ok(Object.hasOwn(JSON.parse(fs.readFileSync(path.join(dir, '0001.json'), 'utf8')), 'exited'), 'run record still has its exit');
  assert.equal(readLimits(dir).length, 1, 'limit file put back');
  allow = true;
  q.check([T('0001', 'reviewing')]);
  assert.deepEqual(starts, ['0001']);
  assert.equal(readLimits(dir).length, 0);
});
