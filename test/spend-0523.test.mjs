import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CLI, env, runRepo, startRun, until, stopRun, record } from './support/run.mjs';
import { builderSpent, earlierBuilds } from '../scripts/core.mjs';

// ---------- 0523: count every build of a ticket in its builder spend ----------

const runsPath = (dir, f) => path.join(dir, 'speck', '.cache', 'runs', f);
const statusOf = (dir, id) => JSON.parse(spawnSync(process.execPath, [CLI, 'status', '--json'], { cwd: dir, encoding: 'utf8', env }).stdout).tickets.find(t => t.id === id);
const result = (tokens, cost) => JSON.stringify({ type: 'result', subtype: 'success', session_id: 's', usage: { input_tokens: tokens, output_tokens: 0 }, ...(cost === undefined ? {} : { total_cost_usd: cost }) });
const runsDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'runs-'));
const save = (dir, id, rec, log) => {
  fs.writeFileSync(path.join(dir, `${id}.json`), `${JSON.stringify({ id, ...rec }, null, 2)}\n`);
  if (log !== undefined) fs.writeFileSync(path.join(dir, `${id}.log`), log);
};
const close = (a, b) => Math.abs(a - b) < 1e-9;

test('0523 AC1: a new build that speck run starts adds its spend to the earlier build\'s', async () => {
  const fake = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fake-')), 'fake-build.cjs');
  fs.writeFileSync(fake, `process.stdout.write(${JSON.stringify(`${result(300, 2.25)}\n`)});`);
  const r = runRepo({ command: `"${process.execPath}" "${fake}" {id} {session}` });
  fs.mkdirSync(runsPath(r.dir, ''), { recursive: true });
  fs.writeFileSync(runsPath(r.dir, '0001.json'), `${JSON.stringify({ id: '0001', session: 'old', started: '2026-10-01T10:00:00.000Z', pid: 1, exited: '2026-10-01T11:00:00.000Z', exit_code: 0, builder: { tokens: 1000, cost_usd: 1.5 } }, null, 2)}\n`);
  fs.writeFileSync(runsPath(r.dir, '0001.log'), `${result(1000, 1.5)}\n`);
  const run = startRun(r.dir);
  try {
    assert.ok(await until(() => { try { const rec = record(r.dir, '0001'); return rec.session !== 'old' && Object.hasOwn(rec, 'exited'); } catch { return false; } }), run.out());
  } finally { await stopRun(run); }
  const rec = record(r.dir, '0001');
  assert.deepEqual(rec.builder, { tokens: 300, cost_usd: 2.25 }, 'the new build\'s own spend');
  assert.deepEqual(rec.earlier_builds, [{ ended: '2026-10-01T11:00:00.000Z', tokens: 1000, cost_usd: 1.5, session: 'old' }]);
  const s = statusOf(r.dir, '0001');
  assert.equal(s.builder_tokens, 1300);
  assert.ok(close(s.builder_cost_usd, 3.75), s.builder_cost_usd);
});

test('0523 AC1: a third build adds its figures the same way, each kept with the time it ended', () => {
  const dir = runsDir();
  save(dir, '0001', { exited: '2026-10-01T11:00:00.000Z', builder: { tokens: 1000, cost_usd: 1.5 } });
  const second = earlierBuilds(dir, '0001');
  assert.deepEqual(second, [{ ended: '2026-10-01T11:00:00.000Z', tokens: 1000, cost_usd: 1.5 }]);
  save(dir, '0001', { exited: '2026-10-02T11:00:00.000Z', earlier_builds: second, builder: { tokens: 200, cost_usd: 0.5 } });
  const third = earlierBuilds(dir, '0001');
  assert.deepEqual(third, [...second, { ended: '2026-10-02T11:00:00.000Z', tokens: 200, cost_usd: 0.5 }]);
  save(dir, '0001', { exited: '2026-10-03T11:00:00.000Z', earlier_builds: third, builder: { tokens: 30, cost_usd: 0.25 } });
  assert.deepEqual(builderSpent(dir, '0001'), { tokens: 1230, cost_usd: 2.25 });
});

test('0523 AC1: an earlier build that stopped without its exit recorded still counts, from its log', () => {
  const dir = runsDir();
  save(dir, '0001', { started: '2026-10-01T10:00:00.000Z' }, `${result(700, 0.75)}\n`);
  assert.deepEqual(earlierBuilds(dir, '0001'), [{ ended: null, tokens: 700, cost_usd: 0.75 }]);
});

test('0523 AC1: a log older than its record is an earlier build\'s, already counted, so it isn\'t counted again', () => {
  const dir = runsDir();
  save(dir, '0001', { started: '2026-10-02T10:00:00.000Z', earlier_builds: [{ ended: 'a', tokens: 700, cost_usd: 0.75 }] }, `${result(700, 0.75)}\n`);
  fs.utimesSync(path.join(dir, '0001.log'), new Date('2026-10-01T11:00:00Z'), new Date('2026-10-01T11:00:00Z'));
  assert.deepEqual(earlierBuilds(dir, '0001'), [{ ended: 'a', tokens: 700, cost_usd: 0.75 }]);
});

test('0523 AC1: no earlier record, or one with no spend, carries nothing forward', () => {
  const dir = runsDir();
  assert.deepEqual(earlierBuilds(dir, '0001'), []);
  save(dir, '0002', { exited: '2026-10-01T11:00:00.000Z' }, 'no result line\n');
  assert.deepEqual(earlierBuilds(dir, '0002'), []);
  fs.writeFileSync(path.join(dir, '0003.json'), 'not json');
  assert.deepEqual(earlierBuilds(dir, '0003'), []);
  assert.deepEqual(earlierBuilds(dir, '../x'), []);
  assert.deepEqual(earlierBuilds(dir, '__proto__'), []);
  save(dir, '0004', { exited: 'x', earlier_builds: 'lots', builder: { tokens: 5, cost_usd: null } });
  assert.deepEqual(earlierBuilds(dir, '0004'), [{ ended: 'x', tokens: 5, cost_usd: null }], 'a malformed earlier list is dropped');
});

test('0523 AC2: a resumed build counts once, at its session\'s total', () => {
  const dir = runsDir();
  // A build resumed in the same session keeps one record: its last result line covers the whole session.
  save(dir, '0001', { resumed: '2026-10-01T10:30:00.000Z', exited: '2026-10-01T11:00:00.000Z', builder: { tokens: 900, cost_usd: 1.2 } });
  assert.deepEqual(builderSpent(dir, '0001'), { tokens: 900, cost_usd: 1.2 });
  // A new build after it carries that total once.
  assert.deepEqual(earlierBuilds(dir, '0001'), [{ ended: '2026-10-01T11:00:00.000Z', tokens: 900, cost_usd: 1.2 }]);
});

test('0523 AC3: unknown costs and tokens are left out of the sums, and no known cost gives null', () => {
  const dir = runsDir();
  save(dir, '0001', { earlier_builds: [{ ended: 'a', tokens: 100, cost_usd: null }, { ended: 'b', tokens: null, cost_usd: 2 }], builder: { tokens: 50, cost_usd: 0.5 } });
  assert.deepEqual(builderSpent(dir, '0001'), { tokens: 150, cost_usd: 2.5 });
  save(dir, '0002', { earlier_builds: [{ ended: 'a', tokens: 100, cost_usd: null }], builder: { tokens: 50, cost_usd: null } });
  assert.deepEqual(builderSpent(dir, '0002'), { tokens: 150, cost_usd: null });
  save(dir, '0003', { earlier_builds: [{ ended: 'a', tokens: 100, cost_usd: 1 }] });
  assert.deepEqual(builderSpent(dir, '0003'), { tokens: 100, cost_usd: 1 }, 'a new build whose log has no result line');
  save(dir, '0004', { earlier_builds: [{ ended: 'a', tokens: null, cost_usd: null }, 'junk', null] });
  assert.deepEqual(builderSpent(dir, '0004'), { tokens: null, cost_usd: null });
});

test('0523 AC4: a ticket built once, and a record from before this change, read as before', () => {
  const dir = runsDir();
  save(dir, '0001', { exited: 'x', builder: { tokens: 1240, cost_usd: 1.5 } });
  assert.deepEqual(builderSpent(dir, '0001'), { tokens: 1240, cost_usd: 1.5 });
  save(dir, '0002', { exited: 'x', builder: { tokens: 10, cost_usd: null } });
  assert.deepEqual(builderSpent(dir, '0002'), { tokens: 10, cost_usd: null });
  save(dir, '0003', { exited: 'x' });
  assert.deepEqual(builderSpent(dir, '0003'), { tokens: null, cost_usd: null });
  save(dir, '0004', { builder: { tokens: 'many', cost_usd: Infinity } });
  assert.deepEqual(builderSpent(dir, '0004'), { tokens: null, cost_usd: null });
  assert.deepEqual(builderSpent(dir, '0009'), { tokens: null, cost_usd: null });
});
