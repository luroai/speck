// The tests a branch's change affects (0437), for `speck test --related`: every test file under test/ whose text names
// a file the branch changed since it left the base branch, or that imports a module under test/support/ whose text
// names one. A file is named by its path from the repo root or by its file name. Files under speck/ don't count.

import fs from 'node:fs';
import path from 'node:path';
import { SpeckError, sh } from './core.mjs';

const TEST_DIR = 'test';
const SUPPORT_DIR = 'test/support';
const isTestFile = name => /\.test\.[cm]?[jt]sx?$/.test(name);
const lines = out => out.split('\0').filter(Boolean);

function gitOut(repo, args, what) {
  const r = sh('git', args, { cwd: repo });
  if (r.status !== 0) throw new SpeckError(`${what}: ${r.stderr.trim() || `git ${args.join(' ')} failed`}. No tests were run.`);
  return r.stdout;
}

// The files this checkout changed since it left `base`, uncommitted and untracked ones included, both sides of a
// rename, and none under speck/. Paths from the repo root.
export function changedFiles(repo, base) {
  const mb = gitOut(repo, ['merge-base', base, 'HEAD'], `Couldn't find where this branch left ${base}`).trim();
  const diffed = lines(gitOut(repo, ['diff', '--name-only', '--no-renames', '-z', mb], "Couldn't list the files this branch changed"));
  const untracked = lines(gitOut(repo, ['ls-files', '--others', '--exclude-standard', '-z'], "Couldn't list the files this branch added"));
  return [...new Set([...diffed, ...untracked])].filter(f => !f.startsWith('speck/')).sort();
}

// Every file under `dir` (relative to `repo`), relative to `repo`, skipping node_modules and dot folders.
function walk(repo, dir) {
  let entries;
  try { entries = fs.readdirSync(path.join(repo, dir), { withFileTypes: true }); } catch { return []; }
  return entries.flatMap(e => {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) return e.name === 'node_modules' || e.name.startsWith('.') ? [] : walk(repo, rel);
    return e.isFile() ? [rel] : [];
  });
}

const read = (repo, rel) => { try { return fs.readFileSync(path.join(repo, rel), 'utf8'); } catch { return ''; } };
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// A test that `text` names `file`: its path from the repo root or its file name, not as part of a longer name, so
// panel.mjs isn't named by build-panel.mjs.
const namer = file => {
  const names = [...new Set([file, path.posix.basename(file)])].map(escape).join('|');
  return new RegExp(`(?<![\\w.-])(?:${names})(?![\\w-])`);
};

// The support modules `text`, a test file at `rel`, imports: paths from the repo root under test/support/.
function supportImports(text, rel) {
  const found = new Set();
  for (const m of text.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)(['"])([^'"\n]+)\1/g)) {
    if (!m[2].startsWith('.')) continue;
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(rel), m[2]));
    if (target.startsWith(`${SUPPORT_DIR}/`)) found.add(target);
  }
  return [...found];
}

// [{ test, because, through }] for each test file the change in `repo` since it left `base` affects, in path order:
// `because` is the changed file that brought it in, `through` the support module that names it, when it's that.
export function relatedTests(repo, base) {
  const changed = changedFiles(repo, base).map(f => ({ file: f, named: namer(f) }));
  if (!changed.length) return [];
  const firstNamed = text => changed.find(c => c.named.test(text))?.file;
  const support = new Map();
  const viaSupport = mod => {
    if (!support.has(mod)) support.set(mod, firstNamed(read(repo, mod)));
    return support.get(mod);
  };
  const tests = walk(repo, TEST_DIR).filter(f => !f.startsWith(`${SUPPORT_DIR}/`) && isTestFile(path.posix.basename(f))).sort();
  const chosen = [];
  for (const test of tests) {
    const text = read(repo, test);
    const because = firstNamed(text);
    if (because) { chosen.push({ test, because }); continue; }
    const through = supportImports(text, test).find(mod => viaSupport(mod));
    if (through) chosen.push({ test, because: viaSupport(through), through });
  }
  return chosen;
}

// What `speck test --related` prints before it runs anything.
export function relatedReport(chosen, base) {
  if (!chosen.length) return `No test file under test/ names a file this branch changed since it left ${base}, so no related tests were chosen.`;
  return [`Related tests (${chosen.length}), each with the changed file that brought it in:`,
    ...chosen.map(c => `  ${c.test}: ${c.because}${c.through ? `, through ${c.through}` : ''}`)].join('\n');
}
