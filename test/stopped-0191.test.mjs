import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// ---------- 0191: the 0177 test that stops speck run waits for it to go, so 0173's check passes ----------

const TEST = path.dirname(fileURLToPath(import.meta.url));
const src = f => fs.readFileSync(path.join(TEST, f), 'utf8');
// The body of the test named `name` in `file`: from its name to the next test.
function body(file, name) {
  const s = src(file);
  const at = s.indexOf(`test('${name}'`);
  assert.ok(at >= 0, `${file} has the test "${name}"`);
  const next = s.indexOf('\ntest(', at + 1);
  return s.slice(at, next < 0 ? s.length : next);
}
// Without NODE_TEST_CONTEXT, the child reports to its own stdout rather than to this test run.
function childEnv() {
  const { NODE_TEST_CONTEXT, ...rest } = process.env;
  return rest;
}
const RUN_SWITCH = '0177 AC3: while one reading takes 5 seconds, the speck run switch turns it on and off within 1 second each';

test('0191 AC1: "0173 AC2: no test in test/ checks once that a process it stopped has gone" passes', () => {
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap',
    '--test-name-pattern=^0173 AC2: no test in test/ checks once that a process it stopped has gone$',
    path.join(TEST, 'stopped-0173.test.mjs')], { encoding: 'utf8', env: childEnv() });
  assert.match(r.stdout, /^ok \d+ - 0173 AC2: no test in test\/ checks once/m, r.stdout);
  assert.match(r.stdout, /^# fail 0$/m, r.stdout);
  assert.equal(r.status, 0, r.stdout);
});

test('0191 AC2: the 0177 speck run switch test waits up to the time limit for speck run to stop', () => {
  const b = body('panel-0177.test.mjs', RUN_SWITCH);
  assert.match(b, /assert\.ok\(await hasStopped\(\(\) => !alive\(pid\)\), 'speck run has stopped'\)/);
  assert.doesNotMatch(b, /assert\.ok\(!alive\(/);
  assert.match(src('panel-0177.test.mjs'), /^import \{ hasStopped \} from '\.\/support\/stopped\.mjs';$/m);
});
