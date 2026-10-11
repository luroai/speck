// Test results kept for code that has already been tested (0112). A run of the suite in a checkout with no uncommitted
// changes outside speck/ is recorded against the commit's files outside speck/ and the test command, so a later run on
// the same code, in any worktree of the repo, can reuse it rather than run the suite again. speck/ is left out because
// ticket commits change only speck/.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { sh } from './core.mjs';
import { runTestsInTurn, sharedCacheDir } from './turns.mjs';

const MAX_OUTPUT = 1024 * 1024; // the most of a failing run's output kept, from its end
const KEEP_MS = 30 * 24 * 60 * 60 * 1000; // results older than this are cleared when a new one is recorded

const resultsDir = repo => sharedCacheDir(repo, 'results');

// The code a run in `repo` would test: { key, commit }, where key stands for HEAD's files outside speck/ and the test
// command. Null when there are uncommitted changes outside speck/, tracked or untracked, or no commit yet, so nothing
// can be recorded or reused.
export function testedCode(repo, cmd) {
  const status = sh('git', ['status', '--porcelain', '--', ':(top)', ':(top,exclude)speck'], { cwd: repo });
  if (status.status !== 0 || status.stdout.trim()) return null;
  const head = sh('git', ['rev-parse', '--verify', '-q', 'HEAD'], { cwd: repo });
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

// Runs the test command `cmd` in `repo` in a turn, recording the result when the code can be, or reuses the result
// recorded for the same code. reuse is 'any' (a pass or a failure), 'pass' (only a pass) or 'none'. onStart runs when
// the suite starts. Returns { status, signal }.
export function testRun(repo, cfg, cmd, { reuse = 'any', onStart = () => {}, hint = '' } = {}) {
  const code = testedCode(repo, cmd);
  const kept = code && reuse !== 'none' ? recorded(repo, code, cmd) : null;
  if (kept && (reuse === 'any' || kept.status === 0)) {
    const result = kept.status === 0 ? 'passed' : `failed (exit code ${kept.status})`;
    console.log(`Reusing the test result from commit ${kept.commit.slice(0, 7)} at ${when(kept.at)}: ${result}. No file outside speck/ has changed since, nor has the test command.${hint}`);
    if (kept.output) process.stdout.write(kept.output.endsWith('\n') ? kept.output : `${kept.output}\n`);
    return { status: kept.status, signal: null };
  }
  if (!code) return runTestsInTurn(repo, cfg, cmd, onStart);
  const dir = resultsDir(repo);
  const run = crypto.randomUUID();
  const keep = { output: path.join(dir, `run.${run}.out`), exit: path.join(dir, `run.${run}.exit`) };
  try {
    const r = runTestsInTurn(repo, cfg, cmd, onStart, keep);
    const exit = (() => { try { return fs.readFileSync(keep.exit, 'utf8').trim(); } catch { return ''; } })();
    // No exit code means the run was stopped before the tests ended. Codes over 128 are tests killed by a signal.
    if (!/^\d+$/.test(exit)) return { status: r.status === 0 ? 1 : r.status, signal: r.signal };
    const status = Number(exit);
    const after = testedCode(repo, cmd);
    if (status <= 128 && after && after.key === code.key) {
      let output = '';
      try { output = fs.readFileSync(keep.output, 'utf8'); } catch { /* no output */ }
      record(repo, code, cmd, status, output);
    }
    return { status, signal: null };
  } finally {
    fs.rmSync(keep.output, { force: true });
    fs.rmSync(keep.exit, { force: true });
  }
}
