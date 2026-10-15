import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { ROOT, CLI, env, runRepo, until } from './support/run.mjs';
import { ORDER_CASES, runUntilLaunched, idleCpu, idleSays, CHECK_BUDGET_S, RUN_POLL_MS, brokenCli } from './support/quick-run.mjs';
import { testStallMs } from '../scripts/turns.mjs';
import { reviewTimeoutMs } from '../scripts/reviewers.mjs';

// ---------- 0232: let tests shorten the waits behind the slowest tests ----------

const linuxOnly = process.platform !== 'linux' && 'reads /proc';
const src = f => fs.readFileSync(path.join(ROOT, 'test', f), 'utf8');
// The test named `name` in `text`: from its line to the `});` that closes it, at the same indentation.
const body = (text, name) => {
  const lines = text.split('\n'), from = lines.findIndex(l => l.includes(`test('${name}`) || l.includes(`test(\`${name}`));
  assert.ok(from >= 0, `there is a test named ${name}`);
  const indent = lines[from].match(/^\s*/)[0], to = lines.findIndex((l, i) => i > from && l === `${indent}});`);
  return lines.slice(from, to + 1).join('\n');
};
// A copy of the CLI in which every check speck run makes adds a line to `file`.
const countingCli = file => brokenCli('run.mjs', '  function tick() {\n', `  function tick() {\n    fs.appendFileSync(${JSON.stringify(file)}, 'check\\n');\n`);

test('0232 AC1: 0176 AC3 watches speck run with a wait between checks shorter than the real 5 seconds', () => {
  const ac3 = body(src('build-log-0176.test.mjs'), '0176 AC3:');
  const poll = ac3.match(/pollMs: (\d+)/);
  assert.ok(poll && Number(poll[1]) < RUN_POLL_MS, `0176 AC3 sets a shorter wait: ${ac3}`);
  assert.match(ac3, /idleCpu\(/);
  assert.doesNotMatch(ac3, /SPECK_RUN_POLL_MS: ''|60000/, 'no longer the real wait for a minute');
});

test('0232 AC1: speck run really checks at the shorter wait a test sets', { skip: linuxOnly }, async () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0232-')), 'checks.txt');
  const { dir } = runRepo({ tickets: [['0001', { status: 'done' }]] });
  const m = await idleCpu(dir, { pollMs: 200, checks: 5, cli: countingCli(file) });
  assert.ok(m.running, m.out);
  assert.ok(fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).length >= 5, 'it checked at least once for each wait');
});

for (const [name, file] of [['0075 AC1', 'priority-0075.test.mjs'], ['0100 AC3', 'fix-0100.test.mjs']]) {
  test(`0232 AC1: ${name} stops speck run once it has launched every build, rather than after runOnce's 10 seconds`, async () => {
    const t = body(src(file), `${name}: speck run`);
    assert.match(t, /runUntilLaunched\(/);
    assert.doesNotMatch(t, /runOnce\(/);
    const c = ORDER_CASES[name];
    const r = runRepo({ tickets: c.tickets, max: 1 });
    const out = await runUntilLaunched(r, c.order.length, { env: { FAKE_MS: '0' } });
    assert.equal(out.status, 0, out.out);
    assert.ok(out.launched, `stopped once it had launched every build: ${out.out}`);
    assert.deepEqual(r.calls().map(x => x.args[0]), c.order);
  });
}

test('0232 AC2: without SPECK_RUN_POLL_MS, speck run still checks every 5 seconds', async () => {
  const { dir } = runRepo({ tickets: [['0001', { status: 'done' }]] });
  const { SPECK_RUN_POLL_MS, ...rest } = env;
  const child = spawn(process.execPath, [CLI, 'run'], { cwd: dir, env: rest });
  let out = '';
  child.stdout.on('data', d => { out += d; });
  child.stderr.on('data', d => { out += d; });
  const exited = new Promise(res => child.on('exit', res));
  try {
    assert.ok(await until(() => out.includes('speck run: watching')), out);
    assert.match(out, /watching for ready tickets every 5s,/);
  } finally { child.kill('SIGINT'); await exited; }
});

test('0232 AC2: without SPECK_STALL_MS and SPECK_REVIEW_TIMEOUT_MS, the stall and review limits are as long as today', () => {
  const kept = { stall: process.env.SPECK_STALL_MS, review: process.env.SPECK_REVIEW_TIMEOUT_MS };
  delete process.env.SPECK_STALL_MS; delete process.env.SPECK_REVIEW_TIMEOUT_MS;
  try {
    assert.equal(testStallMs({}), 5 * 60 * 1000);
    assert.equal(reviewTimeoutMs({}), 30 * 60 * 1000);
  } finally {
    if (kept.stall !== undefined) process.env.SPECK_STALL_MS = kept.stall;
    if (kept.review !== undefined) process.env.SPECK_REVIEW_TIMEOUT_MS = kept.review;
  }
});

test('0232 AC3: 0176 AC3\'s check fails for a speck run whose checks cost more than 5% of one core over 5 seconds', { skip: linuxOnly }, async () => {
  // Each check spends 400 ms of CPU, more than the 250 ms a check may.
  const cli = brokenCli('run.mjs', '  function tick() {\n', '  function tick() {\n    for (const end = Date.now() + 400; Date.now() < end;);\n');
  const { dir } = runRepo({ tickets: [['0001', { status: 'done' }]] });
  const m = await idleCpu(dir, { pollMs: 500, checks: 4, cli });
  assert.ok(m.running, m.out);
  assert.ok(!(m.perCheck < CHECK_BUDGET_S), `0176 AC3 would pass: ${idleSays(m)}`);
});

for (const name of ['0075 AC1', '0100 AC3']) {
  test(`0232 AC3: ${name}'s check fails for a speck run that launches ready tickets by id alone`, async () => {
    const cli = brokenCli('core.mjs', 'export const byPriority = (a, b) =>', 'export const byPriority = (a, b) => padId(a.id).localeCompare(padId(b.id)) ||');
    const c = ORDER_CASES[name];
    const r = runRepo({ tickets: c.tickets, max: 1 });
    const out = await runUntilLaunched(r, c.order.length, { cli, env: { FAKE_MS: '0' } });
    assert.equal(out.status, 0, out.out);
    const order = r.calls().map(x => x.args[0]);
    assert.deepEqual(order, ['0001', '0002', '0003', '0004'], 'the broken copy launches by id');
    assert.notDeepEqual(order, c.order, `${name} would pass`);
  });
}
