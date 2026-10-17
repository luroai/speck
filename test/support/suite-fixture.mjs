// Stand-in test suites for the runner's tests (0233, 0271), and what their runs logged.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SUITE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'suite.mjs');

// A folder with a test/ folder of test files, each named as given, that logs when it starts and ends its wait of `ms`
// milliseconds to runs.log, then has a test that fails when `fail` is set. `code` is added at the top of the file.
export function fixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'suite-0233-'));
  fs.mkdirSync(path.join(dir, 'test'));
  const log = JSON.stringify(path.join(dir, 'runs.log'));
  for (const [name, { ms = 0, fail = false, code = '' } = {}] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, 'test', name), [
      "import { test } from 'node:test';",
      "import fs from 'node:fs';",
      code,
      `test(${JSON.stringify(`${name} waits`)}, async () => {`,
      `  fs.appendFileSync(${log}, ${JSON.stringify(`start ${name}\n`)});`,
      `  await new Promise(r => setTimeout(r, ${ms}));`,
      `  fs.appendFileSync(${log}, ${JSON.stringify(`end ${name}\n`)});`,
      '});',
      `test(${JSON.stringify(`${name} checks`)}, () => { if (${fail}) throw new Error('it failed'); });`,
    ].join('\n'));
  }
  return dir;
}

const env = () => { const e = { ...process.env }; delete e.NODE_TEST_CONTEXT; return e; };

// Runs the suite in `dir` with runSuite's options as given, from a script file rather than with `node -e`, since run()
// hands the -e code on to each test file's process.
export function runWith(dir, options) {
  const script = path.join(dir, 'run-with.mjs');
  fs.writeFileSync(script, `import { runSuite } from ${JSON.stringify(pathToFileURL(SUITE).href)};\nprocess.exitCode = await runSuite(process.cwd(), ${JSON.stringify(options)});\n`);
  return spawnSync(process.execPath, [script], { cwd: dir, env: env(), encoding: 'utf8', timeout: 90000 });
}

// The most files from `names` that were waiting at the same moment, from runs.log.
export function mostAtOnce(dir, names) {
  let now = 0, most = 0;
  for (const line of fs.readFileSync(path.join(dir, 'runs.log'), 'utf8').trim().split('\n')) {
    const [what, name] = line.split(' ');
    if (!names.includes(name)) continue;
    now += what === 'start' ? 1 : -1;
    most = Math.max(most, now);
  }
  return most;
}

// Whether a file from `a` and one from `b` were waiting at the same moment.
export function overlapped(dir, a, b) {
  const open = new Set();
  for (const line of fs.readFileSync(path.join(dir, 'runs.log'), 'utf8').trim().split('\n')) {
    const [what, name] = line.split(' ');
    if (what === 'end') { open.delete(name); continue; }
    open.add(name);
    const mine = a.includes(name) ? b : b.includes(name) ? a : [];
    if ([...open].some(o => mine.includes(o))) return true;
  }
  return false;
}

export const names = (prefix, n) => Array.from({ length: n }, (_, i) => `${prefix}${i + 1}.test.mjs`);
export const waiting = (list, o) => Object.fromEntries(list.map(n => [n, o]));
