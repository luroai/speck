// 0690: a build outside speck run is said to be so however early speck run first reads its run record.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { runRepo, startRun, until, killAll, stopRun } from './support/run.mjs';

const runs = dir => path.join(dir, 'speck', '.cache', 'runs');
const sleeper = () => { const p = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 60000)'], { detached: true, stdio: 'ignore' }); p.unref(); return p.pid; };
const write = (dir, id, rec) => { fs.mkdirSync(runs(dir), { recursive: true }); fs.writeFileSync(path.join(runs(dir), `${id}.json`), JSON.stringify(rec, null, 2)); };
const rec = (id, pid) => ({ id, session: `s-${id}`, cwd: '/r', started: '2026-10-18T09:00:00.000Z', pid, command: ['claude', '-p', `/speck-build ${id}`] });

// The race 0319's test lost under load: its records were written while speck run was still reading the run records it
// found on starting. Written before speck run starts, they're always read then.
test('0690 AC2: records speck run finds as it starts are labelled as on any later check', async () => {
  const r = runRepo({ tickets: [['0001', { status: 'building' }], ['0002', { status: 'building' }]], max: 5 });
  const own = sleeper(), seen = sleeper();
  write(r.dir, '0001', rec('0001', own));
  write(r.dir, '0002', { ...rec('0002', seen), seen: true });
  const run = startRun(r.dir);
  try {
    assert.ok(await until(() => /0001 is already being built/.test(run.out()) && /0002 is being built outside speck run/.test(run.out())), run.out());
    assert.doesNotMatch(run.out(), /0001 is being built outside speck run/);
    assert.doesNotMatch(run.out(), /0002 is already being built/);
  } finally { await stopRun(run); killAll([own, seen]); }
});
