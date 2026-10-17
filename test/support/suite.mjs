// speck's own `npm test` (0229): runs every test/*.test.mjs file under the folder it's started in, as `node --test` would,
// but starts the slowest files first. Each full run records how long each file took in speck/.cache/test-times.json,
// which git ignores, and the next run starts the files longest first, then any with no recorded time alphabetically.
// `node --test` sorts the files it's given, so the order is set here, through run() from node:test.
// On a machine with 8 cores or fewer, the heavy files run at most 2 at a time beside the others (0233): those whose
// code starts a real panel, browser or `speck run` (heavy.mjs, 0271).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { run } from 'node:test';
import { spec, tap } from 'node:test/reporters';
import { fileURLToPath } from 'node:url';
import { heavyFiles } from './heavy.mjs';

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

// How many heavy files run at once on a machine with `cores` cores: 2 with 8 or fewer, otherwise null, for no limit of
// their own.
export const heavyLimit = cores => (cores <= 8 ? 2 : null);

const ROOT_TOTAL = /^([a-z_]+) (\d+(?:\.\d+)?)$/;
const endsTopLevelTest = e => e.data?.nesting === 0 && (e.type === 'test:pass' || e.type === 'test:fail');
// The run's own plan, totals and summary, rather than a file's.
const runLevel = e => e.data?.nesting === 0 && e.data.file === undefined
  && (e.type === 'test:plan' || e.type === 'test:summary' || (e.type === 'test:diagnostic' && ROOT_TOTAL.test(e.data.message)));

// The events of several runs as one run's: each top-level test's events kept together, the top-level tests numbered
// in turn, and one plan, one set of totals and one summary at the end, adding up the runs'.
async function* merged(streams) {
  const startedAt = performance.now();
  const queue = [];
  let open = streams.length, wake = null, error = null, planned = 0, number = 0;
  const totals = new Map();
  const summary = { success: true, counts: {} };
  const ready = () => { const w = wake; wake = null; w?.(); };
  for (const s of streams) {
    let held = [];
    s.on('data', e => { held.push(e); if (endsTopLevelTest(e)) { queue.push(...held); held = []; ready(); } });
    s.on('end', () => { queue.push(...held); held = []; open--; ready(); });
    s.on('error', e => { error = e; ready(); });
  }
  while (open || queue.length) {
    if (error) throw error;
    if (!queue.length) { await new Promise(resolve => { wake = resolve; }); continue; }
    const e = queue.shift();
    if (runLevel(e)) {
      if (e.type === 'test:plan') planned += e.data.count;
      else if (e.type === 'test:summary') {
        summary.success &&= e.data.success;
        for (const [k, n] of Object.entries(e.data.counts || {})) summary.counts[k] = (summary.counts[k] || 0) + n;
      } else {
        const [, name, n] = ROOT_TOTAL.exec(e.data.message);
        totals.set(name, (totals.get(name) || 0) + Number(n));
      }
      continue;
    }
    yield endsTopLevelTest(e) ? { ...e, data: { ...e.data, testNumber: ++number } } : e;
  }
  if (error) throw error;
  const ms = performance.now() - startedAt;
  yield { type: 'test:plan', data: { nesting: 0, count: planned } };
  for (const [name, n] of totals) yield { type: 'test:diagnostic', data: { nesting: 0, message: `${name} ${name === 'duration_ms' ? ms : n}` } };
  if (Object.keys(summary.counts).length) yield { type: 'test:summary', data: { ...summary, duration_ms: ms } };
}

// Runs every test/*.test.mjs file under `root`, writing the report to `out` (TAP, as `node --test` writes when it isn't
// to a terminal), and records each file's time once the run has ended. Resolves to the exit code: 1 when any test failed.
// With `cores` at 8 or fewer, the files in `heavy` run at most heavyLimit(cores) at a time, beside the other files. By
// default, `heavy` is the files whose own code starts a real panel, browser or `speck run` (heavyFiles).
export async function runSuite(root, { cores = os.availableParallelism(), concurrency = Math.max(cores - 1, 1), heavy, out = process.stdout } = {}) {
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
  const limit = heavyLimit(cores);
  const isHeavy = new Set(limit ? heavy ?? heavyFiles(root, files) : []);
  const groups = [[files.filter(f => !isHeavy.has(f)), concurrency], [files.filter(f => isHeavy.has(f)), limit]].filter(([g]) => g.length);
  const streams = groups.map(([g, n]) => run({ files: g.map(f => path.join(root, f)), concurrency: n }));
  for (const stream of streams) {
    // A file's own entry, named with its path as given, ends once its process has.
    stream.on('test:complete', d => { if (d.nesting === 0 && given.has(d.name)) times.set(given.get(d.name), d.details.duration_ms); });
    // As with `node --test`, any failing test fails the run, a file that couldn't run included, but not a todo test.
    // Node 20 has no test:summary, so this is worked out from each test that fails.
    stream.on('test:fail', d => { if (!d.todo) failed = true; });
  }
  const events = streams.length === 1 ? streams[0] : Readable.from(merged(streams));
  const reporter = out.isTTY ? events.compose(new spec()) : events.compose(tap);
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
