import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HELPER = pathToFileURL(path.join(HERE, 'support', 'tmp.mjs')).href;

// A stand-in for the system temporary folder, and a test file that makes repos and fake tool folders in it.
const sandbox = () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sandbox-'));
  const code = fs.mkdtempSync(path.join(os.tmpdir(), 'fixture-'));
  const env = { ...process.env, TMPDIR: tmp, TMP: tmp, TEMP: tmp };
  delete env.NODE_TEST_CONTEXT; // run the fixture as its own test run, not as part of this one
  return { tmp, code, env };
};
const fixtureHead = `import ${JSON.stringify(HELPER)};
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const makeRepo = name => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), name + '-'));
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  fs.mkdtempSync(path.join(os.tmpdir(), 'speck-bin-'));
  fs.writeFileSync(path.join(os.tmpdir(), 'verdict-' + path.basename(dir) + '.json'), '{}');
  return dir;
};
`;

test('AC1 AC2: a run with passing and failing tests leaves nothing in the temporary folder', () => {
  const s = sandbox();
  const file = path.join(s.code, 'fixture.test.mjs');
  fs.writeFileSync(file, fixtureHead + `
test('passes', () => { makeRepo('speck'); });
test('fails', () => { makeRepo('speck-ship'); assert.fail('on purpose'); });
test('throws in a child process', () => { makeRepo('speck-remote'); spawnSync('git', ['init', '-q', '--bare', fs.mkdtempSync(path.join(os.tmpdir(), 'speck-remote-'))]); throw new Error('boom'); });
`);
  const r = spawnSync(process.execPath, ['--test', file], { env: s.env, encoding: 'utf8' });
  assert.equal(r.status, 1, 'the failing tests fail the run');
  assert.match(r.stdout, /# fail 2/);
  assert.deepEqual(fs.readdirSync(s.tmp), [], 'nothing left in the temporary folder');
});

test('AC3: a run killed part-way leaves only the folders of the test that was running', async () => {
  const s = sandbox();
  const file = path.join(s.code, 'fixture.mjs');
  const marker = path.join(s.code, 'running');
  fs.writeFileSync(file, fixtureHead + `
for (const n of [1, 2, 3, 4]) test('done ' + n, () => { makeRepo('speck-done' + n); });
test('hangs', async () => {
  makeRepo('speck-running');
  fs.writeFileSync(${JSON.stringify(marker)}, '');
  await new Promise(r => setTimeout(r, 60_000));
});
`);
  const child = spawn(process.execPath, [file], { env: s.env, stdio: 'ignore' });
  const exited = new Promise(r => child.on('exit', r));
  const start = Date.now();
  while (!fs.existsSync(marker)) {
    assert.ok(Date.now() - start < 20_000, 'the fixture reached its hanging test');
    await new Promise(r => setTimeout(r, 50));
  }
  child.kill('SIGKILL');
  await exited;
  const left = fs.readdirSync(s.tmp);
  assert.equal(left.length, 1, `one run folder is left, got ${left}`);
  const inside = fs.readdirSync(path.join(s.tmp, left[0]));
  assert.ok(inside.length > 0 && inside.every(f => /speck-running|speck-bin-/.test(f)), `only the running test's folders are left, got ${inside}`);
  assert.equal(inside.filter(f => /^speck-running-[^.]*$/.test(f)).length, 1);
});

test('AC1: a run stopped with SIGTERM or SIGINT removes its run folder', async () => {
  for (const sig of ['SIGTERM', 'SIGINT']) {
    const s = sandbox();
    const file = path.join(s.code, 'fixture.mjs');
    const marker = path.join(s.code, 'running');
    fs.writeFileSync(file, fixtureHead + `
test('hangs', async () => { makeRepo('speck'); fs.writeFileSync(${JSON.stringify(marker)}, ''); await new Promise(r => setTimeout(r, 60_000)); });
`);
    const child = spawn(process.execPath, [file], { env: s.env, stdio: 'ignore' });
    const exited = new Promise(r => child.on('exit', r));
    const start = Date.now();
    while (!fs.existsSync(marker)) {
      assert.ok(Date.now() - start < 20_000, 'the fixture reached its hanging test');
      await new Promise(r => setTimeout(r, 50));
    }
    child.kill(sig);
    await exited;
    assert.deepEqual(fs.readdirSync(s.tmp), [], `nothing left after ${sig}`);
  }
});

test('AC1: every test file loads the clean-up helper before anything else', () => {
  const files = fs.readdirSync(HERE).filter(f => f.endsWith('.test.mjs'));
  assert.ok(files.length >= 2);
  for (const f of files) {
    const first = fs.readFileSync(path.join(HERE, f), 'utf8').split('\n').find(l => l.trim() && !l.startsWith('//'));
    assert.match(first, /^import '\.\/support\/tmp\.mjs';/, `${f} must import ./support/tmp.mjs first`);
  }
});
