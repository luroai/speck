// 0773: speck reads Node's spec reporter as well as TAP, since Node 24's `node --test` prints spec by default, so a
// failing run's summary, its failing files and the command to run next work from either output.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CLI, env as shipEnv, gIn } from './support/ship.mjs';
import { repo, write } from './support/related.mjs';
import { failingTestFiles, failingTests, nextRunFiles, passingTests, summariseTap, tapCounts, RETRY_NOTE } from '../scripts/tap.mjs';
import { NEXT_RUN } from '../scripts/turns.mjs';

// Without node --test's own marker, so the runs below print the reporter they're asked for.
const env = Object.fromEntries(Object.entries(shipEnv).filter(([k]) => k !== 'NODE_TEST_CONTEXT'));

const MIXED = `import test from 'node:test';
import assert from 'node:assert';
test('top passes', () => {});
test('0773 AC1: fails', () => { assert.equal(1, 2); });
test.describe('group', () => {
  test('inner ok', () => {});
  test('inner bad', () => { throw new Error('boom'); });
  test('skipped one', { skip: true }, () => {});
  test('todo one', { todo: true }, () => { throw new Error('x'); });
});
test('parent', async t => { await t.test('child ok', () => {}); await t.test('child bad', () => { throw new Error('cb'); }); });
test('same name', () => { throw new Error('one'); });
test.describe('d', () => { test('same name', () => { throw new Error('two'); }); });
`;
const OTHER = `import test from 'node:test';
test('b passes', () => { console.log('ok 1 - printed by a test'); });
test.describe('hk', () => { test.before(() => { throw new Error('hookfail'); }); test('in hk', () => {}); });
`;
const PASSING = `import test from 'node:test';
test('0773 AC3: fine', () => {});
test.describe('g', () => { test('also fine', () => {}); test('skipped', { skip: true }, () => {}); });
`;

// A folder with the given test files, and the output of running them with each reporter from there.
function both(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0773-'));
  for (const [f, body] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), body); }
  const run = reporter => spawnSync(process.execPath, ['--test', `--test-reporter=${reporter}`, ...Object.keys(files)], { cwd: dir, encoding: 'utf8', env });
  const tap = run('tap'), spec = run('spec');
  assert.ok(/^TAP version/m.test(tap.stdout));
  assert.ok(!/^TAP version/m.test(spec.stdout));
  return { dir, tap: tap.stdout, spec: spec.stdout, status: spec.status };
}

const failing = both({ 'test/a.test.mjs': MIXED, 'test/b.test.mjs': OTHER });
const passing = both({ 'test/p.test.mjs': PASSING });

// The failing tests a summary lists, each by its `not ok - ` line.
const listed = summary => summary.split('\n').filter(l => l.startsWith('not ok - '));
const files = (out, dir) => failingTestFiles(out).map(t => ({ name: t.name, file: path.resolve(dir, t.file) }));

// Node 24's own spec output, which marks a todo test with ⚠ rather than ✖.
const NODE24 = [
  '✔ top passes (0.6ms)', '✖ 0773 AC1: fails (0.5ms)', '▶ group', '  ✔ inner ok (1.0ms)', '  ✖ inner bad (0.1ms)',
  '  ﹣ skipped one (0.08ms) # SKIP', '  ⚠ todo one (0.09ms) # TODO', '✖ group (1.8ms)',
  'ℹ tests 5', 'ℹ pass 2', 'ℹ fail 2', 'ℹ skipped 1', 'ℹ todo 1', 'ℹ duration_ms 63.0', '', '✖ failing tests:', '',
  'test at test/a.test.mjs:4:1', '✖ 0773 AC1: fails (0.5ms)', '  AssertionError [ERR_ASSERTION]: 1 == 2', '      at TestContext.<anonymous> (file:///x/test/a.test.mjs:4:40)', '',
  'test at test/a.test.mjs:7:3', '✖ inner bad (0.1ms)', '  Error: boom', '',
  'test at test/a.test.mjs:9:3', '⚠ todo one (0.09ms) # TODO', '  Error: x', '',
].join('\n');

test('0773 AC1: the files to run next come from spec output as they do from TAP', () => {
  const { dir, tap, spec } = failing;
  const expected = ['test/a.test.mjs', 'test/b.test.mjs'];
  assert.deepEqual(nextRunFiles(tap, [], dir, dir), expected);
  assert.deepEqual(nextRunFiles(spec, [], dir, dir), expected);
  assert.deepEqual(nextRunFiles(spec, [path.join(dir, 'test/c.test.mjs')], dir, path.join(dir, 'test')), ['c.test.mjs', 'a.test.mjs', 'b.test.mjs']);
  fs.mkdirSync(path.join(dir, 'x/test'), { recursive: true }); fs.writeFileSync(path.join(dir, 'x/test/a.test.mjs'), '');
  assert.deepEqual(nextRunFiles(NODE24, [], path.join(dir, 'x'), dir), ['x/test/a.test.mjs']);
});

test('0773 AC1: a failing --related run printing the spec reporter ends with the command to run only its failing files', () => {
  const dir = repo({
    'scripts/turns.mjs': 'export const a = 1;\n',
    'test/by-import.test.mjs': "import { test } from 'node:test';\ntest('broken', () => { throw new Error('no'); });\n// '../scripts/turns.mjs'\n",
    'test/ticket.test.mjs': "import { test } from 'node:test';\ntest('fine', () => {});\n",
  });
  const speck = (...a) => spawnSync(process.execPath, [CLI, ...a], { cwd: dir, encoding: 'utf8', env });
  assert.equal(speck('init', '--skip-checks').status, 0);
  assert.equal(speck('config', 'set', 'commands.test_files', 'node --test --test-reporter=spec {files}').status, 0);
  gIn(dir, 'add', '-A'); gIn(dir, 'commit', '-qm', 'speck');
  gIn(dir, 'branch', '-qf', 'main', 'HEAD');
  write(dir, 'scripts/turns.mjs', 'export const a = 2;\n');
  const res = speck('test', '--related', 'test/ticket.test.mjs');
  assert.notEqual(res.status, 0, res.stdout);
  assert.match(res.stdout, /^✖ broken/m);
  assert.equal(res.stdout.trimEnd().split('\n').at(-1), `${NEXT_RUN}speck test --files test/ticket.test.mjs test/by-import.test.mjs`);
});

test('0773 AC2: the reviewer\'s summary names the same failing tests from spec output as from TAP', () => {
  const { dir, tap, spec } = failing;
  const fromTap = summariseTap(tap, '0773', '/tmp/out.txt');
  const fromSpec = summariseTap(spec, '0773', '/tmp/out.txt');
  assert.ok(fromSpec, 'spec output is summarised rather than given in full');
  assert.deepEqual(listed(fromSpec), listed(fromTap));
  assert.ok(listed(fromSpec).includes('not ok - group > inner bad'));
  assert.ok(listed(fromSpec).includes('not ok - d > same name'));
  assert.ok(!listed(fromSpec).some(l => /todo one|skipped one|top passes/.test(l)));
  assert.match(fromSpec, /Error: boom/);
  assert.match(fromSpec, /Error: hookfail/);
  assert.match(fromSpec, /^# fail \d+$/m);
  const named = s => s.split('\n').filter(l => /^(passed|failed|skipped|todo): /.test(l));
  assert.deepEqual(named(fromSpec), named(fromTap));
  assert.deepEqual(named(fromSpec), ['failed: 0773 AC1: fails']);
  assert.deepEqual(failingTests(spec), failingTests(tap));
  assert.deepEqual(files(spec, dir), files(tap, dir));
  assert.deepEqual(tapCounts(spec), tapCounts(tap));
  assert.deepEqual(listed(summariseTap(NODE24, '0773', '/tmp/out.txt')), ['not ok - 0773 AC1: fails', 'not ok - group > inner bad', 'not ok - group']);
});

test('0773 AC2: a run whose failing files ran once more reads the same from spec output as from TAP', () => {
  const { tap, spec } = failing;
  const again = both({ 'test/a.test.mjs': MIXED.replace("throw new Error('boom')", '') });
  const join = (first, second) => `${first}\n${RETRY_NOTE}node --test test/a.test.mjs\n${second}`;
  assert.deepEqual(failingTests(join(spec, again.spec)), failingTests(join(tap, again.tap)));
  assert.ok(!failingTests(join(spec, again.spec)).includes('group > inner bad'));
  assert.ok(failingTests(spec).includes('group > inner bad'));
});

test('0773 AC3: a passing run is read as passing from spec output as from TAP', () => {
  const { tap, spec, status } = passing;
  assert.equal(status, 0);
  for (const out of [tap, spec]) {
    assert.deepEqual(failingTests(out), []);
    assert.deepEqual(failingTestFiles(out), []);
    assert.deepEqual(tapCounts(out), { failing: 0, second_try: [] });
    const summary = summariseTap(out, '0773', '/tmp/out.txt');
    assert.match(summary, /Failing tests \(0\):\n\(none\)/);
    assert.match(summary, /passed: 0773 AC3: fine/);
  }
  assert.deepEqual(passingTests(spec).sort(), passingTests(tap).sort());
  assert.deepEqual(passingTests(spec).sort(), ['0773 AC3: fine', 'g', 'g > also fine']);
});

test('0773 AC1: output that is neither TAP nor spec is still given in full', () => {
  assert.equal(summariseTap('npm ERR! something broke\n', '0773', '/tmp/out.txt'), null);
  assert.deepEqual(failingTests('Error: no tests\n'), []);
});

test('0773 AC2: a spec run followed by a TAP run once more reads both', () => {
  const { tap, spec } = failing;
  const again = both({ 'test/a.test.mjs': MIXED.replace("throw new Error('boom')", '') });
  const mixed = `${spec}\n${RETRY_NOTE}node --test test/a.test.mjs\n${again.tap}`;
  assert.deepEqual(failingTests(mixed), failingTests(`${tap}\n${RETRY_NOTE}node --test test/a.test.mjs\n${again.tap}`));
});

test('0773 AC2: coloured spec output reads as plain', () => {
  const coloured = failing.spec.split('\n').map(l => l.replace(/^( *)([✔✖▶ℹ])/, '$1\x1b[31m$2\x1b[39m')).join('\n');
  assert.deepEqual(failingTests(coloured), failingTests(failing.tap));
});
