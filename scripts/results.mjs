// Test results kept for code that has already been tested (0112). A run of the suite in a checkout with no uncommitted
// changes outside speck/ is recorded against the commit's files outside speck/ and the test command, so a later run on
// the same code, in any worktree of the repo, can reuse it rather than run the suite again. speck/ is left out because
// ticket commits change only speck/.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { sh } from './core.mjs';
import { runTestsInTurn, sharedCacheDir, testStallMs, shellWord } from './turns.mjs';
import { failingTestFiles, passingTests, RETRY_NOTE, FLAKY } from './tap.mjs';

const MAX_OUTPUT = 1024 * 1024; // the most of a failing run's output kept, from its end
const KEEP_MS = 30 * 24 * 60 * 60 * 1000; // results older than this are cleared when a new one is recorded

const resultsDir = repo => sharedCacheDir(repo, 'results');

// The code a run in `repo` would test: { key, commit }, where key stands for HEAD's files outside speck/ and the test
// command. Null when there are uncommitted changes outside speck/, tracked or untracked, or no commit yet, so nothing
// can be recorded or reused.
export function testedCode(repo, cmd) {
  const status = sh('git', ['status', '--porcelain', '--', ':(top)', ':(top,exclude)speck'], { cwd: repo });
  if (status.status !== 0 || status.stdout.trim()) return null;
  return codeAt(repo, cmd, 'HEAD');
}

// The code `rev` (a commit) holds, as testedCode gives it, or null when there's no such commit.
function codeAt(repo, cmd, rev) {
  const head = sh('git', ['rev-parse', '--verify', '-q', `${rev}^{commit}`], { cwd: repo });
  if (head.status !== 0) return null;
  const commit = head.stdout.trim();
  const tree = sh('git', ['ls-tree', '-z', commit], { cwd: repo });
  if (tree.status !== 0) return null;
  const entries = tree.stdout.split('\0').filter(e => e && e.slice(e.indexOf('\t') + 1) !== 'speck');
  return { key: crypto.createHash('sha256').update(JSON.stringify([cmd, entries])).digest('hex'), commit };
}

// The result recorded for `code`, or null if there's none or it can't be read as one.
function recorded(repo, code, cmd) {
  let r;
  try { r = JSON.parse(fs.readFileSync(path.join(resultsDir(repo), `${code.key}.json`), 'utf8')); } catch { return null; }
  const ok = r && typeof r === 'object' && r.cmd === cmd && Number.isInteger(r.status) && r.status >= 0 && r.status <= 255
    && typeof r.commit === 'string' && typeof r.at === 'string' && !Number.isNaN(Date.parse(r.at)) && typeof r.output === 'string';
  return ok ? r : null;
}

function record(repo, code, cmd, status, output) {
  const dir = resultsDir(repo);
  const now = Date.now();
  for (const f of fs.readdirSync(dir)) {
    const file = path.join(dir, f);
    try { if (now - fs.statSync(file).mtimeMs > KEEP_MS) fs.rmSync(file, { force: true }); } catch { /* gone already */ }
  }
  const kept = status === 0 ? '' : output.length > MAX_OUTPUT ? output.slice(-MAX_OUTPUT) : output;
  const text = JSON.stringify({ cmd, status, commit: code.commit, at: new Date(now).toISOString(), output: kept });
  const tmp = path.join(dir, `${code.key}.${process.pid}.${crypto.randomUUID()}.tmp`);
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, path.join(dir, `${code.key}.json`)); // whole, so a reader never sees half a result
}

const pad = n => String(n).padStart(2, '0');
const when = iso => { const d = new Date(iso); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };

// A run's result as testRun gives it, from runTestsInTurn's. With `fail`, a run that ended without an exit code fails.
const result = (r, fail = false) => ({ status: fail && r.status === 0 ? 1 : r.status,
  signal: r.signal || r.ended.match(/^signal (\w+)$/)?.[1] || null, stalled: r.ended === 'stalled' });

// Runs the test command `cmd` in `repo` in a turn, recording the result when the code can be, or reuses the result
// recorded for the same code. reuse is 'any' (a pass or a failure), 'pass' (only a pass) or 'none'. onStart runs when
// the suite starts. Returns { status, signal, stalled, output }, stalled saying whether the run was ended for writing
// nothing for test_stall_minutes (0152), and output what a failing run wrote ('' for a pass): all of it from a run,
// the end kept of a reused one. A run that fails gets one more try at its failing tests' files (see retry), `branch`
// being the branch the flaky log names (blank: the one checked out).
export function testRun(repo, cfg, cmd, { reuse = 'any', onStart = () => {}, hint = '', branch = '' } = {}) {
  testStallMs(cfg); // a bad test_stall_minutes is refused even when a recorded result would do
  const code = testedCode(repo, cmd);
  const kept = code && reuse !== 'none' ? recorded(repo, code, cmd) : null;
  if (kept && (reuse === 'any' || kept.status === 0)) {
    const result = kept.status === 0 ? 'passed' : `failed (exit code ${kept.status})`;
    console.log(`Reusing the test result from commit ${kept.commit.slice(0, 7)} at ${when(kept.at)}: ${result}. No file outside speck/ has changed since, nor has the test command.${hint}`);
    if (kept.output) process.stdout.write(kept.output.endsWith('\n') ? kept.output : `${kept.output}\n`);
    return { status: kept.status, signal: null, stalled: false, output: kept.output };
  }
  const output = path.join(resultsDir(repo), `run.${crypto.randomUUID()}.out`);
  const written = () => { try { return fs.readFileSync(output, 'utf8'); } catch { return ''; } };
  const failed = (res, text) => ({ ...res, output: res.status === 0 ? '' : text });
  try {
    const r = runTestsInTurn(repo, cfg, cmd, onStart, output);
    let text = written();
    // A run that failed with an exit code gets one more try at its failing tests (0195). One that passes it counts as
    // passed, and one that doesn't keeps the first run's result, with both runs' output.
    if (/^\d+$/.test(r.ended) && r.ended !== '0') {
      const again = retry(repo, cfg, cmd, text, branch);
      if (again?.passed) { Object.assign(r, { status: 0, ended: '0' }); text = ''; } else if (again) text += again.output;
    }
    if (!code) return failed(result(r), text);
    const exit = r.ended === 'stalled' ? '1' : r.ended;
    // No exit code means the run was stopped before the tests ended, or a signal stopped them: nothing is recorded.
    // A run ended as stalled is recorded as a failure (0152).
    if (!/^\d+$/.test(exit)) return failed(result(r, true), text);
    const status = Number(exit);
    const after = testedCode(repo, cmd);
    if (after && after.key === code.key) record(repo, code, cmd, status, text);
    return failed({ status, signal: null, stalled: r.ended === 'stalled' }, text);
  } finally {
    fs.rmSync(output, { force: true });
  }
}

// The tests that failed in the result recorded for the base branch's latest commit and the test command `cmd`, as
// failingTestFiles gives them (0228). Empty when there's no such result, it passed, or its output kept names none.
function failingOnBase(repo, cfg, cmd) {
  const base = String(cfg.base_branch || '').trim();
  const code = base ? codeAt(repo, cmd, `refs/heads/${base}`) : null;
  const kept = code ? recorded(repo, code, cmd) : null;
  return kept && kept.status !== 0 ? failingTestFiles(kept.output).filter(t => t.file) : [];
}

// Runs commands.test_files once more, with just the files of the tests that failed in `text`, a full run's output
// (0195). Null when it can't: commands.test_files is blank or has no {files}, or a failing test has no location in a
// file in `repo`. Tests that already fail on the base branch (see failingOnBase) are left out, along with their files
// unless a test that didn't fail there failed in them too, and said so in a line naming them: null too when that leaves
// nothing to run (0228). Otherwise { passed, output }: passed when nothing was left out, the second run passed and each
// test that failed passed in it (a name that failed twice, twice), which it then says with a line naming them and adds
// to the shared flaky log, with the time and `branch` (blank: the branch checked out).
function retry(repo, cfg, cmd, text, branch) {
  const only = String(cfg.commands?.test_files || '').trim();
  const failing = failingTestFiles(text);
  if (!only.includes('{files}') || !failing.length) return null;
  const inRepo = file => {
    if (!file) return null;
    const rel = path.relative(repo, path.resolve(repo, file));
    let isFile = false;
    try { isFile = fs.statSync(path.join(repo, rel)).isFile(); } catch { /* not there */ }
    return rel && !rel.startsWith('..') && !path.isAbsolute(rel) && isFile ? rel : null;
  };
  const rels = failing.map(t => inRepo(t.file));
  if (rels.includes(null)) return null;
  // A test fails on the base branch too when one of the same name failed there in a file at the same path: the base
  // branch's run may have been in another worktree, so its file is matched by the end of its path.
  const onBase = failingOnBase(repo, cfg, cmd);
  const old = failing.map((t, i) => onBase.some(b => b.name === t.name && `/${b.file.replaceAll('\\', '/')}`.endsWith(`/${rels[i].split(path.sep).join('/')}`)));
  const files = [...new Set(rels.filter((f, i) => !old[i]))];
  const left = [...new Set(failing.filter((t, i) => old[i]).map(t => t.name))];
  const base = cfg.base_branch;
  if (left.length && !files.length) console.log(`The failing tests already fail on ${base}, so they aren't run again: ${left.join('; ')}`);
  else if (left.length) console.log(`Leaving out of the second run the tests that already fail on ${base}: ${left.join('; ')}`);
  if (!files.length) return null;
  const rerun = only.replaceAll('{files}', () => files.map(f => shellWord(f.startsWith('-') ? `./${f}` : f)).join(' '));
  const output = path.join(resultsDir(repo), `run.${crypto.randomUUID()}.out`);
  try {
    const r = runTestsInTurn(repo, cfg, rerun, () => console.log(`${RETRY_NOTE}${rerun}`), output);
    let again = '';
    try { again = fs.readFileSync(output, 'utf8'); } catch { /* it wrote nothing */ }
    // How many times each test name passed in the second run, each failing test using up one. A passing test's TAP
    // has no location, so tests are told apart by name and counted: two failing tests with one name need two passes.
    const passed = new Map();
    for (const name of passingTests(again)) passed.set(name, (passed.get(name) || 0) + 1);
    const all = failing.every(t => { const n = passed.get(t.name) || 0; passed.set(t.name, n - 1); return n > 0; });
    if (r.ended !== '0' || !all || left.length) return { passed: false, output: again };
    const names = [...new Set(failing.map(t => t.name))];
    console.log(`${FLAKY}${names.join('; ')}`);
    flakyLog(repo, names, branch);
    return { passed: true, output: again };
  } finally {
    fs.rmSync(output, { force: true });
  }
}

// The log of tests that failed and then passed on a second try, which every worktree of the repo shares (0195).
export const flakyLogFile = repo => path.join(sharedCacheDir(repo, 'flaky'), 'flaky.log');

function flakyLog(repo, names, branch) {
  let on = branch;
  if (!on) {
    on = sh('git', ['branch', '--show-current'], { cwd: repo }).stdout?.trim() || '';
    if (!on) { const head = sh('git', ['rev-parse', '--short', 'HEAD'], { cwd: repo }); on = head.status === 0 ? `detached at ${head.stdout.trim()}` : '(no branch)'; }
  }
  const at = new Date().toISOString();
  fs.appendFileSync(flakyLogFile(repo), names.map(n => `${at}\t${on}\t${n}\n`).join(''));
}
