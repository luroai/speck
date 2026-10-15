import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { CLI, env, startRun, until, alive, stopRun, record } from './support/run.mjs';
import { wait, runsPath, speck, size, json, state, tickerRepo, launched, growing, cleanup, failingPs, speckWith } from './support/ticker.mjs';
import { hasStopped } from './support/stopped.mjs';

// ---------- 0072: stop a running build from the CLI ----------

// Gone for good: no such process, or one that has exited and waits only for its parent to collect it.
const gone = pid => !alive(pid) || state(pid).startsWith('Z') || state(pid) === '';
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const g = (dir, ...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', env }).stdout.trim();

// 0001 launched by speck run, started in its own worktree with speck as /speck-build does, and working there.
async function started(extraEnv = {}) {
  const t = tickerRepo({ worktrees: 'true' });
  const run = await launched(t, { START: CLI, ...extraEnv });
  assert.ok(t.build('0001').worktree && fs.existsSync(t.build('0001').worktree), 'the build has its worktree');
  return { t, run, wt: t.build('0001').worktree };
}
const ticketIn = dir => fs.readFileSync(path.join(dir, 'speck', 'tickets', '0001-t.md'), 'utf8');

// speck, without blocking the file's other tests while it runs.
const speckAsync = (dir, ...a) => new Promise(res => {
  const c = spawn(process.execPath, [CLI, ...a], { cwd: dir, env });
  let stdout = '', stderr = '';
  c.stdout.on('data', d => { stdout += d; });
  c.stderr.on('data', d => { stderr += d; });
  c.on('close', status => res({ status, stdout, stderr }));
});

// The stubborn process's test waits about 10 seconds for speck stop to give up asking it to end, so the other tests run
// meanwhile, one at a time as before (0198).
describe('0072: stop a running build from the CLI', { concurrency: true }, () => {
  test('0072 AC1 (round 1 F1): a process that ignores SIGTERM and leaves the build\'s tree when its parent ends is still ended', async () => {
    const { t, run } = await started({ STUBBORN: '1' });
    const pidFile = path.join(t.out, 'stubborn.pid');
    try {
      assert.ok(await until(() => fs.existsSync(pidFile) && fs.readFileSync(pidFile, 'utf8')), 'the stubborn process is running');
      const pid = Number(fs.readFileSync(pidFile, 'utf8'));
      assert.ok(!fs.readFileSync(`/proc/${pid}/environ`, 'utf8').includes('SPECK_BUILD_SESSION'), 'it has no session in its environment');
      const r = await speckAsync(t.dir, 'stop', '0001');
      assert.equal(r.status, 0, r.stderr);
      assert.ok(await hasStopped(() => gone(pid)), `the stubborn process is no longer running (${state(pid)})`);
    } finally {
      try { process.kill(Number(fs.readFileSync(pidFile, 'utf8')), 'SIGKILL'); } catch {}
      await cleanup(t, run)();
    }
  });

  describe('0072: the other tests', { concurrency: 2 }, () => {
    test('0072 AC1: stop ends the build and every process it started, and says so', async () => {
      const { t, run } = await started({ ORPHAN: '1' });
      try {
        assert.ok(await until(() => t.orphan()), 'the orphaned writer is working');
        const pids = [t.build('0001').pid, t.helper(), t.orphan()];
        const r = speck(t.dir, 'stop', '0001');
        assert.equal(r.status, 0, r.stderr);
        assert.match(r.stdout, /0001[^\n]*stopped/i);
        for (const p of pids) assert.ok(await hasStopped(() => gone(p)), `process ${p} is no longer running (${state(p)})`);
        const n = size(t.helperFile);
        await wait(300);
        assert.equal(size(t.helperFile), n, 'nothing it started still writes');
      } finally { await cleanup(t, run)(); }
    });

    test('0072 AC1: stop ends a paused build too, and it is no longer marked paused', async () => {
      const { t, run } = await started();
      try {
        const pids = [t.build('0001').pid, t.helper()];
        assert.equal(speck(t.dir, 'pause', '0001').status, 0);
        const r = speck(t.dir, 'stop', '0001');
        assert.equal(r.status, 0, r.stderr);
        assert.match(r.stdout, /0001[^\n]*stopped/i);
        for (const p of pids) assert.ok(await hasStopped(() => gone(p)), `process ${p} is no longer running (${state(p)})`);
        assert.ok(!fs.existsSync(runsPath(t.dir, '0001.paused')), 'its paused mark is gone');
        assert.equal(json(t.dir).tickets.find(x => x.id === '0001').paused, false);
      } finally { await cleanup(t, run)(); }
    });

    test('0072 AC2: the ticket is blocked with the question and committed in the build\'s worktree, keeping its branch, worktree and commits', async () => {
      const { t, run, wt } = await started();
      try {
        const branch = g(wt, 'rev-parse', '--abbrev-ref', 'HEAD');
        const head = g(wt, 'rev-parse', 'HEAD');
        const mainHead = t.g('rev-parse', 'HEAD');
        assert.equal(speck(t.dir, 'stop', '0001').status, 0);
        const ticket = ticketIn(wt);
        assert.match(ticket, /^status: blocked\b/m);
        assert.match(ticket, new RegExp(`## Blocked question\\n(?:<!--[^\\n]*-->\\n)?\\s*Stopped by you on ${today()}\\.\\n`));
        assert.equal(g(wt, 'rev-parse', 'HEAD~1'), head, 'one commit on top of the build\'s own');
        assert.equal(g(wt, 'show', '--name-only', '--format=', 'HEAD'), 'speck/tickets/0001-t.md', 'it commits only the ticket');
        assert.equal(g(wt, 'status', '--porcelain'), '', 'nothing is left uncommitted');
        assert.equal(g(wt, 'rev-parse', '--abbrev-ref', 'HEAD'), branch, 'the same branch');
        assert.ok(fs.existsSync(wt), 'the worktree stays');
        assert.equal(t.g('rev-parse', 'HEAD'), mainHead, 'the main checkout is untouched');
        const s = json(t.dir).tickets.find(x => x.id === '0001');
        assert.equal(s.status, 'blocked');
        assert.equal(s.blocked_question, `Stopped by you on ${today()}.`);
        assert.equal(s.session?.id, record(t.dir, '0001').session, 'its session is there for the resume command');
      } finally { await cleanup(t, run)(); }
    });

    test('0072 AC2: a build stopped before it started its ticket leaves the ticket blocked where it is', async () => {
      const t = tickerRepo();
      const run = await launched(t);
      try {
        const head = t.g('rev-parse', 'HEAD');
        assert.equal(speck(t.dir, 'stop', '0001').status, 0);
        assert.match(ticketIn(t.dir), /^status: blocked\b/m);
        assert.equal(t.g('rev-parse', 'HEAD~1'), head);
        assert.equal(t.g('status', '--porcelain'), '');
        assert.equal(json(t.dir).tickets.find(x => x.id === '0001').blocked_question, `Stopped by you on ${today()}.`);
      } finally { await cleanup(t, run)(); }
    });

    test('0072 AC3: speck run does not report the stopped build as stopped or failed, and does not launch it again', async () => {
      const { t, run } = await started();
      try {
        assert.equal(speck(t.dir, 'stop', '0001').status, 0);
        assert.ok(await until(() => Object.hasOwn(record(t.dir, '0001'), 'exited')), run.out());
        await wait(500); // several polls
        assert.doesNotMatch(run.out(), /0001[^\n]*(stopped|exited|failed|couldn't start|still ready)/i, run.out());
        assert.equal((run.out().match(/Launched 0001/g) || []).length, 1, 'not launched again');
        await stopRun(run);
        const again = startRun(t.dir);
        try {
          await wait(800);
          assert.doesNotMatch(again.out(), /0001/, again.out());
        } finally { await stopRun(again); }
      } finally { await cleanup(t, run)(); }
    });

    test('0072 AC3: a build an earlier speck run launched is not reported as stopped by the speck run watching it', async () => {
      const { t, run: first } = await started();
      let run = first;
      try {
        await stopRun(first);
        run = startRun(t.dir);
        assert.ok(await until(() => /0001[^\n]*already being built/i.test(run.out())), run.out());
        const pid = t.build('0001').pid;
        assert.equal(speck(t.dir, 'stop', '0001').status, 0);
        assert.ok(await hasStopped(() => gone(pid)), `process ${pid} is no longer running (${state(pid)})`);
        await wait(800);
        assert.doesNotMatch(run.out(), /0001[^\n]*(stopped|exited|failed|still ready)/i, run.out());
        assert.equal((run.out().match(/Launched 0001/g) || []).length, 0, 'not launched again');
      } finally { await cleanup(t, run)(); }
    });

    test('0072 AC4: stop refuses plainly, exits non-zero and changes nothing without a running or paused build', async () => {
      const t = tickerRepo({ tickets: [['0001', {}], ['0002', {}], ['0003', {}], ['0004', {}]], max: 1 });
      const run = await launched(t);
      try {
        fs.mkdirSync(runsPath(t.dir, ''), { recursive: true });
        const dead = spawnSync(process.execPath, ['-e', '0']).pid;
        fs.writeFileSync(runsPath(t.dir, '0003.json'), JSON.stringify({ id: '0003', session: 's', cwd: t.dir, pid: dead }));
        fs.writeFileSync(runsPath(t.dir, '0004.json'), JSON.stringify({ id: '0004', session: 's', cwd: t.dir, pid: t.build('0001').pid, exited: '2026-10-09T11:00:00.000Z', exit_code: 0 }));
        const files = () => Object.fromEntries(fs.readdirSync(runsPath(t.dir, '')).filter(f => !f.endsWith('.log')).map(f => [f, fs.readFileSync(runsPath(t.dir, f), 'utf8')]));
        const tickets = () => fs.readdirSync(path.join(t.dir, 'speck', 'tickets')).filter(f => f.endsWith('.md')).map(f => fs.readFileSync(path.join(t.dir, 'speck', 'tickets', f), 'utf8'));
        const refused = (args, re) => {
          const before = [files(), tickets(), t.g('rev-parse', 'HEAD')];
          const r = speck(t.dir, ...args);
          assert.notEqual(r.status, 0, `${args.join(' ')} should be refused`);
          assert.match(r.stderr, re, args.join(' '));
          assert.doesNotMatch(r.stderr, /at .*\.mjs:\d+/, 'no stack trace');
          assert.deepEqual([files(), tickets(), t.g('rev-parse', 'HEAD')], before, `${args.join(' ')} changes nothing`);
        };
        refused(['stop'], /usage/i);
        refused(['stop', '0099'], /0099[^\n]*not found/i);
        refused(['stop', '0002'], /0002[^\n]*no running or paused build/i); // no run record
        refused(['stop', '0003'], /0003[^\n]*no running or paused build/i); // its process has gone
        refused(['stop', '0004'], /0004[^\n]*no running or paused build/i); // it has exited
        assert.ok(alive(t.build('0001').pid), '0001 is still running');
      } finally { await cleanup(t, run)(); }
    });

    test('0072 AC4 (self-check): a stop that fails before ending anything leaves the build running, unmarked and its ticket unchanged', async () => {
      const { t, run, wt } = await started();
      const ps = failingPs();
      try {
        for (const ok of [0, 1]) { // fails checking the build, or listing its processes to hold them
          const ticket = ticketIn(wt), head = g(wt, 'rev-parse', 'HEAD');
          const r = speckWith(t.dir, ps(ok), 'stop', '0001');
          assert.notEqual(r.status, 0, `ps failing after ${ok} runs`);
          assert.match(r.stderr, /ps/);
          assert.doesNotMatch(r.stderr, /at .*\.mjs:\d+/, 'no stack trace');
          assert.doesNotMatch(r.stdout, /stopped/i);
          assert.ok(!fs.existsSync(runsPath(t.dir, '0001.stopped')), 'not marked stopped');
          assert.equal(ticketIn(wt), ticket);
          assert.equal(g(wt, 'rev-parse', 'HEAD'), head);
          assert.ok(await growing(t, '0001'), `still running (ps failing after ${ok} runs)`);
        }
      } finally { await cleanup(t, run)(); }
    });

    test('0072 AC2 (self-check): a build stopped once its ticket is approved leaves the ticket approved', async () => {
      const { t, run, wt } = await started();
      try {
        assert.equal(speck(wt, 'set', '0001', 'status', 'approved').status, 0);
        g(wt, 'commit', '-qam', 'approved');
        const head = g(wt, 'rev-parse', 'HEAD');
        const r = speck(t.dir, 'stop', '0001');
        assert.equal(r.status, 0, r.stderr);
        assert.match(r.stdout, /approved/);
        assert.match(ticketIn(wt), /^status: approved\b/m);
        assert.equal(g(wt, 'rev-parse', 'HEAD'), head, 'no commit');
      } finally { await cleanup(t, run)(); }
    });

    test('0072 AC3 (round 1 F2, round 2): a stopped build whose ticket could not be blocked is not launched again when speck run restarts, until its ticket is committed again, whatever the commit dates', async () => {
      const t = tickerRepo();
      // Its ticket's last commit is dated a day ahead, so it's later than the stop by the clock.
      assert.equal(speck(t.dir, 'set', '0001', 'priority', '3').status, 0);
      const future = new Date(Date.now() + 86400000).toISOString();
      spawnSync('git', ['commit', '-qam', 'future'], { cwd: t.dir, env: { ...env, GIT_COMMITTER_DATE: future, GIT_AUTHOR_DATE: future } });
      let run = await launched(t);
      const hook = path.join(t.dir, '.git', 'hooks', 'pre-commit');
      try {
        fs.writeFileSync(hook, '#!/bin/sh\nexit 1\n', { mode: 0o755 });
        const r = speck(t.dir, 'stop', '0001');
        assert.notEqual(r.status, 0, 'the ticket commit fails');
        assert.match(r.stderr, /couldn't be committed/);
        assert.match(ticketIn(t.dir), /^status: ready\b/m, 'the ticket is still ready');
        await stopRun(run);
        run = startRun(t.dir);
        await wait(800);
        assert.doesNotMatch(run.out(), /Launched 0001/, run.out());
        assert.match(run.out(), /0001[^\n]*speck stop[^\n]*won't launch it again/);
        await stopRun(run);
        fs.rmSync(hook);
        // Committed again at once, within the same second as the stop, and dated earlier than the future commit.
        assert.equal(speck(t.dir, 'set', '0001', 'priority', '2').status, 0);
        const second = JSON.parse(fs.readFileSync(runsPath(t.dir, '0001.stopped'), 'utf8')).stopped.replace(/\.\d+Z$/, 'Z');
        spawnSync('git', ['commit', '-qam', 'ready again'], { cwd: t.dir, env: { ...env, GIT_COMMITTER_DATE: second, GIT_AUTHOR_DATE: second } });
        run = startRun(t.dir);
        assert.ok(await until(() => /Launched 0001/.test(run.out())), `launched once its ticket is committed again: ${run.out()}`);
      } finally { await cleanup(t, run)(); }
    });
  });
});
