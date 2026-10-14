// 0175: a test file leaves nothing running once it's done, and the helpers that wait on a file end by themselves.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { TICKER, HELPER } from './support/ticker.mjs';
import { gated, gateDir, waitFor } from './support/gate.mjs';

const TMP_MJS = pathToFileURL(fileURLToPath(new URL('./support/tmp.mjs', import.meta.url))).href;
const wait = ms => new Promise(res => setTimeout(res, ms));
const alive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
const until = async (cond, ms = 10000) => {
  const end = Date.now() + ms;
  for (;;) { if (cond()) return true; if (Date.now() > end) return false; await wait(50); }
};
// The environment for a fake test file, without this run's own test runner settings, so node --test runs it afresh.
const fakeEnv = extra => { const e = { ...process.env, ...extra }; delete e.NODE_TEST_CONTEXT; return e; };
const killAll = pids => { for (const p of pids) try { process.kill(p, 'SIGKILL'); } catch { /* gone */ } };

// A test file that starts a process of each kind a test can leave behind, saves their pids in $PIDS (one per line)
// and then ends its tests the way $MODE says: pass, fail, timeout or hang.
const FAKE = `
import { RUN_TMP } from ${JSON.stringify(TMP_MJS)};
import { test } from 'node:test';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
const forever = 'setInterval(() => {}, 1000)';
const save = pid => fs.appendFileSync(process.env.PIDS, pid + '\\n');
const saved = () => fs.readFileSync(process.env.PIDS, 'utf8').trim().split('\\n').length;
const gone = pid => { try { process.kill(pid, 0); return false; } catch { return true; } };
const mode = process.env.MODE;
test('leaves processes running', mode === 'timeout' ? { timeout: 300 } : {}, async t => {
  // A plain child, one with an empty environment, and one in a session and process group of its own.
  const plain = spawn(process.execPath, ['-e', forever], { stdio: 'ignore' }); plain.unref(); save(plain.pid);
  const bare = spawn(process.execPath, ['-e', forever], { stdio: 'ignore', env: {} }); bare.unref(); save(bare.pid);
  const own = spawn(process.execPath, ['-e', forever], { detached: true, stdio: 'ignore' }); own.unref(); save(own.pid);
  // One that starts a grandchild in a session of its own with an empty environment that ignores SIGTERM, and stays.
  const grand = "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)";
  const starts = (then, cwd = RUN_TMP) => \`const c = require('child_process').spawn(process.execPath, ['-e', \${JSON.stringify(grand)}], { detached: true, stdio: 'ignore', env: {}, cwd: \${JSON.stringify(cwd)} }); c.unref(); require('fs').appendFileSync(\${JSON.stringify(process.env.PIDS)}, c.pid + '\\\\n'); \${then}\`;
  const parent = spawn(process.execPath, ['-e', starts(forever)], { detached: true, stdio: 'ignore' }); parent.unref(); save(parent.pid);
  // One that does the same in the test's folder, then exits, leaving the grandchild with no parent from the test.
  const quitter = spawn(process.execPath, ['-e', starts('')], { detached: true, stdio: 'ignore' }); quitter.unref();
  // And one whose grandchild has no tie to the test at all, working in /, and that exits a second later.
  const late = spawn(process.execPath, ['-e', starts('setTimeout(() => {}, 1000)', '/')], { detached: true, stdio: 'ignore' }); late.unref();
  while (saved() < 7 || !gone(quitter.pid) || !gone(late.pid)) await new Promise(r => setTimeout(r, 20));
  fs.writeFileSync(process.env.PIDS + '.ready', '');
  if (mode === 'fail') throw new Error('failed on purpose');
  // Waits until the test's timeout ends it, then lets the file finish.
  if (mode === 'timeout') await new Promise(r => { const h = setTimeout(r, 60000); t.signal.addEventListener('abort', () => { clearTimeout(h); r(); }); });
  if (mode === 'hang') await new Promise(r => setTimeout(r, 60000));
});
`;
const fake = mode => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fake-'));
  const file = path.join(dir, 'fake.test.mjs');
  fs.writeFileSync(file, FAKE);
  return { file, pidsFile: path.join(dir, 'pids'), pids: () => { try { return fs.readFileSync(path.join(dir, 'pids'), 'utf8').trim().split('\n').filter(Boolean).map(Number); } catch { return []; } } };
};

for (const mode of ['pass', 'fail', 'timeout']) {
  test(`0175 AC1: within 10 seconds of a test file finishing (${mode}), nothing it started is still running`, async () => {
    const f = fake(mode);
    let pids = [];
    try {
      const r = spawnSync(process.execPath, ['--test', f.file], { encoding: 'utf8', env: fakeEnv({ PIDS: f.pidsFile, MODE: mode }), timeout: 60000 });
      assert.equal(r.status, mode === 'pass' ? 0 : 1, r.stdout + r.stderr);
      if (mode === 'timeout') assert.match(r.stdout, /failureType: 'testTimeoutFailure'/, r.stdout);
      if (mode === 'fail') assert.match(r.stdout, /failed on purpose/, r.stdout);
      pids = f.pids();
      assert.equal(pids.length, 7, r.stdout + r.stderr);
      assert.ok(await until(() => pids.every(p => !alive(p))), `still running: ${pids.filter(alive).join(' ')}`);
    } finally { killAll(pids); }
  });
}

for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  test(`0175 AC2: within 10 seconds of a test file's process being stopped with ${sig}, nothing it started is still running`, async () => {
    const f = fake('hang');
    const child = spawn(process.execPath, [f.file], { env: fakeEnv({ PIDS: f.pidsFile, MODE: 'hang' }), stdio: 'ignore' });
    const exited = new Promise(res => child.on('exit', (code, signal) => res({ code, signal })));
    let pids = [];
    try {
      assert.ok(await until(() => fs.existsSync(f.pidsFile + '.ready'), 15000), 'the fake test file to start its processes');
      pids = f.pids();
      assert.equal(pids.length, 7);
      assert.ok(pids.every(alive));
      child.kill(sig);
      await exited;
      assert.ok(await until(() => pids.every(p => !alive(p))), `still running: ${pids.filter(alive).join(' ')}`);
    } finally { killAll([child.pid, ...pids]); }
  });
}

// Runs a helper and checks it ends by itself within 10 seconds of `dir` being removed.
const endsWhenRemoved = async (dir, child, ready) => {
  const exited = new Promise(res => child.on('exit', code => res(code)));
  try {
    assert.ok(await until(ready, 15000), 'the helper to start');
    assert.equal(child.exitCode, null, 'still waiting while its folder is there');
    fs.rmSync(dir, { recursive: true, force: true });
    const code = await Promise.race([exited, wait(10000).then(() => 'still running')]);
    assert.notEqual(code, 'still running');
    return code;
  } finally { killAll([child.pid]); }
};

test('0175 AC3: the ticker build and its helper end by themselves once their folder is removed', async () => {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'ticker-'));
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'ticker-out-'));
  fs.writeFileSync(path.join(bin, 'ticker.cjs'), TICKER);
  fs.writeFileSync(path.join(bin, 'helper.cjs'), HELPER);
  const env = { ...process.env };
  delete env.START; delete env.ORPHAN; delete env.STUBBORN; delete env.SELF_PAUSE; delete env.EXIT_ON_CONT;
  const build = spawn(process.execPath, [path.join(bin, 'ticker.cjs'), path.join(bin, 'helper.cjs'), out, '0001', 's'], { env, stdio: 'ignore' });
  let helper = null;
  try {
    await endsWhenRemoved(out, build, () => {
      try { helper = Number(fs.readFileSync(path.join(out, 'helper.pid'), 'utf8')); } catch { return false; }
      return helper > 0 && fs.existsSync(path.join(out, 'helper.txt'));
    });
    assert.ok(await until(() => !alive(helper)), 'the helper to end');
  } finally { killAll([helper].filter(Boolean)); }
});

test('0175 AC3: the helper on its own ends by itself once its folder is removed', async () => {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'ticker-'));
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'ticker-out-'));
  fs.writeFileSync(path.join(bin, 'helper.cjs'), HELPER);
  const helper = spawn(process.execPath, [path.join(bin, 'helper.cjs'), out], { stdio: 'ignore' });
  await endsWhenRemoved(out, helper, () => fs.existsSync(path.join(out, 'helper.txt')));
});

test('0175 AC3: the gated test command ends by itself once its folder is removed', async () => {
  const g = gated();
  const sh = spawn('sh', ['-c', g.test.replace(/^sh -c '(.*)'$/, '$1')], { stdio: 'ignore' });
  assert.equal(await endsWhenRemoved(path.dirname(g.gate), sh, () => fs.existsSync(g.reached)), 1);
});

test('0175 AC3: the gated push hook ends by itself once its folder is removed', async () => {
  const dir = gateDir();
  const hook = spawn('sh', ['-c', `touch ${dir}/reached; ${waitFor(path.join(dir, 'go'))}`], { stdio: 'ignore' });
  assert.equal(await endsWhenRemoved(dir, hook, () => fs.existsSync(path.join(dir, 'reached'))), 1);
});

test('0175 AC3: the gated test command still finishes once its gate is there', async () => {
  const g = gated();
  const r = spawn('sh', ['-c', g.test.replace(/^sh -c '(.*)'$/, '$1')], { stdio: 'ignore' });
  const exited = new Promise(res => r.on('exit', code => res(code)));
  assert.ok(await until(() => fs.existsSync(g.reached), 15000));
  fs.writeFileSync(g.gate, '');
  assert.equal(await exited, 0);
});
