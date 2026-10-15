// speck's own `npm test` (0229): runs every test/*.test.mjs file under the folder it's started in, as `node --test` would,
// but starts the slowest files first. Each full run records how long each file took in speck/.cache/test-times.json,
// which git ignores, and the next run starts the files longest first, then any with no recorded time alphabetically.
// `node --test` sorts the files it's given, so the order is set here, through run() from node:test.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { run } from 'node:test';
import { spec, tap } from 'node:test/reporters';
import { fileURLToPath } from 'node:url';

export const timesFile = root => path.join(root, 'speck', '.cache', 'test-times.json');

const alphabetical = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// The times recorded in `file`, as a Map from each file to its milliseconds. Empty when there's no file or it can't be
// read as one, and an entry that isn't a time of 0 ms or more is left out.
export function readTimes(file) {
  let data;
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return new Map(); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return new Map();
  return new Map(Object.entries(data).filter(([, ms]) => typeof ms === 'number' && Number.isFinite(ms) && ms >= 0));
}

// `files` in the order to start them: those with a time in `times` longest first, then the rest alphabetically.
export function orderFiles(files, times) {
  const timed = files.filter(f => times.has(f)).sort((a, b) => times.get(b) - times.get(a) || alphabetical(a, b));
  return [...timed, ...files.filter(f => !times.has(f)).sort(alphabetical)];
}

function writeTimes(file, times) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  const ignore = path.join(dir, '.gitignore');
  if (!fs.existsSync(ignore)) fs.writeFileSync(ignore, '# Working files for reviews in progress. Review history is in each ticket.\n*\n');
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(Object.fromEntries(times), null, 2)}\n`);
  fs.renameSync(tmp, file); // whole, so a run never reads half of it
}

// Runs every test/*.test.mjs file under `root`, writing the report to `out` (TAP, as `node --test` writes when it isn't
// to a terminal), and records each file's time once the run has ended. Resolves to the exit code: 1 when any test failed.
export async function runSuite(root, { concurrency = Math.max(os.availableParallelism() - 1, 1), out = process.stdout } = {}) {
  let names = [];
  try { names = fs.readdirSync(path.join(root, 'test')).filter(f => f.endsWith('.test.mjs')); } catch { /* no test folder */ }
  if (!names.length) {
    console.error(`No test files to run: there are no test/*.test.mjs files in ${root}.`);
    return 1;
  }
  const file = timesFile(root);
  const files = orderFiles(names.map(f => `test/${f}`), readTimes(file));
  // run() is given each file's full path, so the files are found wherever the process was started (Node 20's run()
  // has no cwd option), and the times are kept by the paths below root.
  const given = new Map(files.map(f => [path.join(root, f), f]));
  const times = new Map();
  let failed = false;
  const stream = run({ files: [...given.keys()], concurrency });
  // A file's own entry, named with its path as given, ends once its process has.
  stream.on('test:complete', d => { if (d.nesting === 0 && given.has(d.name)) times.set(given.get(d.name), d.details.duration_ms); });
  // As with `node --test`, any failing test fails the run, a file that couldn't run included, but not a todo test.
  // Node 20 has no test:summary, so this is worked out from each test that fails.
  stream.on('test:fail', d => { if (!d.todo) failed = true; });
  const reporter = out.isTTY ? stream.compose(new spec()) : stream.compose(tap);
  await new Promise((resolve, reject) => {
    reporter.on('error', reject);
    reporter.pipe(out, { end: false });
    reporter.on('end', resolve);
  });
  // Not being able to record them changes nothing about this run's result.
  if (times.size) {
    try { writeTimes(file, times); } catch (e) {
      console.error(`Couldn't record the test files' times in ${file} (${e.code || e.message}). The next run starts them alphabetically.`);
    }
  }
  return failed ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await runSuite(process.cwd());
}
