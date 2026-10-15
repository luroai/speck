// 0234: a real-browser test file whose page stub answers every request shares one repo and one panel.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { ROOT } from './support/panel.mjs';
import { hasStopped } from './support/stopped.mjs';

const url = f => JSON.stringify(pathToFileURL(path.join(ROOT, 'test', 'support', f)).href);
const alive = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };

// Runs `body` (test code that has sharedPanel and log(), which records a value) as a test file of its own, in a folder
// of its own, and resolves once its process has exited, with its exit code, its output and what it logged. With `tmp`,
// it imports tmp.mjs first, as the real-browser test files do.
async function runFile(body, { tmp = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0234-file-'));
  const log = path.join(dir, 'log.jsonl');
  const file = path.join(dir, 'shared.test.mjs');
  fs.writeFileSync(file, `${tmp ? `import ${url('tmp.mjs')};\n` : ''}import { test } from 'node:test';\nimport assert from 'node:assert/strict';\n`
    + `import fs from 'node:fs';\nimport { request } from ${url('panel.mjs')};\nimport { sharedPanel } from ${url('shared-panel.mjs')};\n`
    + `const log = v => fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify(v) + '\\n');\n${body}\n`);
  const env = { ...process.env, TMPDIR: dir, TMP: dir, TEMP: dir };
  delete env.NODE_TEST_CONTEXT; // a test file of its own, not one inside this one's run
  const child = spawn(process.execPath, ['--test', file], { cwd: dir, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  child.stdout.on('data', d => { out += d; });
  child.stderr.on('data', d => { out += d; });
  const code = await new Promise((resolve, reject) => {
    const t = setTimeout(() => { child.kill('SIGKILL'); reject(new Error(`the test file didn't finish within 60 s:\n${out}`)); }, 60000);
    child.on('exit', c => { clearTimeout(t); resolve(c); });
  });
  const logged = fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').map(l => JSON.parse(l)) : [];
  return { code, out, logged };
}

// Each test logs the panel's pid, port and repo, whether the repo is still there and whether the panel answers.
const LOG_PANEL = `const p = await sharedPanel();
  const page = await request(p.port);
  log({ pid: p.child.pid, port: p.port, dir: p.dir, repo: fs.existsSync(p.dir + '/speck/config.yml'), status: page.status });`;

test('0234 AC1: the tests of a file share one repo and one panel, which stay from its first test to its last', async () => {
  const f = await runFile(`for (const n of [1, 2, 3]) test('test ' + n, async () => { ${LOG_PANEL} });
test('two at once', async () => { await Promise.all([1, 2].map(async () => { ${LOG_PANEL} })); });`, { tmp: true });
  assert.equal(f.code, 0, f.out);
  assert.equal(f.logged.length, 5, f.out);
  const [first] = f.logged;
  for (const l of f.logged) {
    assert.deepEqual({ pid: l.pid, port: l.port, dir: l.dir }, { pid: first.pid, port: first.port, dir: first.dir }, 'one panel and one repo for the file');
    assert.equal(l.repo, true, 'the repo is still there in each test, though tmp.mjs empties the folder between tests');
    assert.equal(l.status, 200, 'the panel answers in each test');
  }
  assert.match(path.basename(first.dir), /^speck-keep-/);
});

for (const fails of [false, true]) {
  test(`0234 AC2: when the file ends with its tests ${fails ? 'failing' : 'passing'}, the panel is stopped and its repo removed`, async () => {
    // No tmp.mjs, which would remove its folder and end what it started anyway: only sharedPanel's own clean-up can.
    const f = await runFile(`test('uses the panel', async () => { ${LOG_PANEL} });
test('then ${fails ? 'fails' : 'passes'}', async () => { ${LOG_PANEL} ${fails ? `assert.fail('on purpose');` : ''} });`);
    assert.equal(f.code, fails ? 1 : 0, f.out);
    assert.equal(f.logged.length, 2, f.out);
    const { pid, dir } = f.logged[0];
    assert.ok(await hasStopped(() => !alive(pid)), `the panel (pid ${pid}) is still running`);
    assert.equal(fs.existsSync(dir), false, `the repo ${dir} is still there`);
  });
}

test('0234 AC1: the real-browser test files whose page stubs answer every request start the shared panel, not one per test', () => {
  for (const name of ['panel-0155.test.mjs', 'panel-0160.test.mjs']) {
    const src = fs.readFileSync(path.join(ROOT, 'test', name), 'utf8');
    assert.match(src, /await sharedPanel\(\)/, `${name} uses the shared panel`);
    assert.doesNotMatch(src, /\bstartPanel\(|\bpanelRepo\(|\bstop\(panel\)/, `${name} starts no panel or repo of its own`);
  }
});
