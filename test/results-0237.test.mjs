// 0237: a test run that waited its turn reuses a result recorded for the same code while it waited.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { gIn } from './support/ship.mjs';
import { testRun, testedCode } from '../scripts/results.mjs';
import { sharedCacheDir } from '../scripts/turns.mjs';

const REUSED = /^Reusing the test result/;

// A committed git repo with app.txt, a test command that counts its runs in a file outside it, and a config for
// testRun with one turn.
function testRepo() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0237-')));
  gIn(dir, 'init', '-q', '-b', 'main');
  fs.writeFileSync(path.join(dir, 'app.txt'), 'one\n');
  gIn(dir, 'add', '-A'); gIn(dir, 'commit', '-qm', 'base');
  const log = path.join(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'runs-'))), 'runs.txt');
  const cmd = `echo run >> ${log}`;
  const runs = () => fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').length : 0;
  const cfg = { base_branch: 'main', max_parallel_tests: 1, commands: { test: cmd } };
  return { dir, cmd, cfg, runs, tests: sharedCacheDir(dir, 'tests'), results: sharedCacheDir(dir, 'results') };
}

// A process that holds turn 0 for `ms`, then records `status` as the result for the repo's code and ends, as a run
// that finished while another waited would. It runs in the background of a shell that has ended, so it isn't this
// process's child, which would stay alive as a zombie while testRun blocks this process.
function holder(r, status, ms = 600) {
  const code = testedCode(r.dir, r.cmd);
  const result = JSON.stringify({ cmd: r.cmd, status, commit: code.commit, at: new Date().toISOString(), output: status ? 'not ok 1 - widgets\n' : '', root: r.dir });
  const file = path.join(r.results, `${code.key}.json`);
  const script = `setTimeout(() => require('fs').writeFileSync(${JSON.stringify(file)}, ${JSON.stringify(result)}), ${ms})`;
  const sh = spawnSync('sh', ['-c', '"$0" -e "$1" >/dev/null 2>&1 & echo $!', process.execPath, script], { encoding: 'utf8' });
  const pid = Number(sh.stdout.trim());
  assert.ok(pid > 0, sh.stderr);
  fs.writeFileSync(path.join(r.tests, 'slot-0.g0.lock'), JSON.stringify({ pid, cwd: '/somewhere/else' }));
}

// Runs testRun with console.log caught: { r, lines }.
function caught(fn) {
  const lines = [];
  const log = console.log;
  console.log = (...a) => lines.push(a.join(' '));
  try { return { r: fn(), lines }; } finally { console.log = log; }
}

const slots = r => fs.readdirSync(r.tests).filter(f => /^slot-.*\.lock$/.test(f));

test('0237 AC1: speck test reuses a result recorded while it waited, saying so, without running the suite', () => {
  for (const status of [0, 3]) {
    const r = testRepo();
    holder(r, status);
    const { r: res, lines } = caught(() => testRun(r.dir, r.cfg, r.cmd, { reuse: 'any' }));
    assert.equal(res.status, status, 'exits with the recorded exit code');
    assert.equal(r.runs(), 0, 'the suite did not run');
    assert.ok(lines.some(l => /^Waiting for a turn/.test(l)), 'it waited');
    assert.equal(lines.filter(l => REUSED.test(l)).length, 1, `one line says it is reused: ${lines.join('\n')}`);
    if (status) assert.match(res.output, /not ok 1 - widgets/, 'with the failure\'s output');
  }
});

test('0237 AC1: a result recorded while it waited for other code is not reused', () => {
  const r = testRepo();
  holder(r, 0);
  fs.writeFileSync(path.join(r.dir, 'app.txt'), 'two\n');
  gIn(r.dir, 'commit', '-qam', 'change');
  const { r: res, lines } = caught(() => testRun(r.dir, r.cfg, r.cmd, { reuse: 'any' }));
  assert.equal(res.status, 0);
  assert.equal(r.runs(), 1, 'the suite ran');
  assert.ok(!lines.some(l => REUSED.test(l)));
});

test('0237 AC2: speck ship\'s run reuses a pass recorded while it waited, and runs the suite on a failure', () => {
  const pass = testRepo();
  holder(pass, 0);
  const a = caught(() => testRun(pass.dir, pass.cfg, pass.cmd, { reuse: 'pass' }));
  assert.equal(a.r.status, 0);
  assert.equal(pass.runs(), 0, 'a pass is reused');
  assert.ok(a.lines.some(l => REUSED.test(l)));

  const fail = testRepo();
  holder(fail, 3);
  let started = 0;
  const b = caught(() => testRun(fail.dir, fail.cfg, fail.cmd, { reuse: 'pass', onStart: () => started++ }));
  assert.equal(b.r.status, 0, 'its own run passes');
  assert.equal(fail.runs(), 1, 'a failure is not reused: the suite ran');
  assert.equal(started, 1);
  assert.ok(!b.lines.some(l => REUSED.test(l)));
});

test('0237 AC3: speck test --fresh never reuses a result recorded while it waited', () => {
  const r = testRepo();
  holder(r, 0);
  const { r: res, lines } = caught(() => testRun(r.dir, r.cfg, r.cmd, { reuse: 'none' }));
  assert.equal(res.status, 0);
  assert.equal(r.runs(), 1, 'the suite ran');
  assert.ok(!lines.some(l => REUSED.test(l)));
});

test('0237 AC4: a run that reuses a result frees its turn straight away', () => {
  const r = testRepo();
  holder(r, 0);
  let started = 0;
  caught(() => testRun(r.dir, r.cfg, r.cmd, { reuse: 'any', onStart: () => started++ }));
  assert.equal(started, 0, 'it never started a run');
  assert.deepEqual(slots(r), [], 'no claim on a turn is left');
  const t = Date.now();
  const next = caught(() => testRun(r.dir, r.cfg, r.cmd, { reuse: 'none' }));
  assert.equal(r.runs(), 1, 'the next run ran');
  assert.ok(!next.lines.some(l => /^Waiting for a turn/.test(l)), 'without waiting');
  assert.ok(Date.now() - t < 5000);
});
