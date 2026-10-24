// The tests a branch's change affects (0437), for `speck test --related`: every test file under test/ whose text names
// a file the branch changed since it left the base branch, or that imports a module under test/support/ that names one
// few of those modules name (0447). Files under speck/ don't count.

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

// A test that `text` names `file`, not as part of a longer name, so panel.mjs isn't named by build-panel.mjs (0437):
// its path from the repo root, or its file name on its own or after its own folder's name (`../` for one at the root),
// so `./support/speck.mjs` doesn't name scripts/speck.mjs (0447). A skill's SKILL.md is named by its folder, or by the skill's name on its own
// rather than as the `/speck-build` or `$speck-build` command, so a test naming any SKILL.md doesn't name every one.
const namer = file => {
  const dir = path.posix.dirname(file), base = path.posix.basename(file), parent = path.posix.basename(dir);
  const up = path.posix.dirname(dir), skill = base === 'SKILL.md' && dir !== '.';
  const alts = skill
    ? [`(?<![\\w.-])${escape(dir)}`, ...(up === '.' ? [] : [`(?<![\\w.-])${escape(`${path.posix.basename(up)}/${parent}`)}`]), `(?<![\\w./$-])${escape(parent)}`]
    : dir === '.' ? [`(?<![\\w./-])${escape(base)}`, `(?<![\\w.-])(?:\\.\\.?/)+${escape(base)}`]
    : [`(?<![\\w.-])${escape(file)}`, `(?<![\\w./-])${escape(base)}`, `(?<![\\w.-])${escape(`${parent}/${base}`)}`];
  return { skill, named: new RegExp(`(?:${[...new Set(alts)].join('|')})(?![\\w-])`) };
};

// The support modules `text`, a file at `rel`, imports: paths from the repo root under test/support/.
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
// `because` is the changed file that brought it in, `through` the support module that names it, when it's that. A
// support module names a file when its text does or a support module it imports does. A test comes in through one
// only for a changed file at most a quarter of the support modules name, and never for a SKILL.md (0447): the CLI
// that nearly every one runs would otherwise bring in nearly the whole suite.
export function relatedTests(repo, base) {
  const changed = changedFiles(repo, base).map(f => ({ file: f, ...namer(f) }));
  if (!changed.length) return [];
  const firstNamed = text => changed.find(c => c.named.test(text))?.file;
  const modules = walk(repo, SUPPORT_DIR).filter(f => /\.[cm]?[jt]sx?$/.test(f));
  // Each module's own named files and imports, then what it names with every module it reaches through imports.
  const own = new Map();
  const ownOf = mod => {
    if (!own.has(mod)) {
      const text = read(repo, mod);
      own.set(mod, { files: changed.filter(c => c.named.test(text)).map(c => c.file), deps: supportImports(text, mod) });
    }
    return own.get(mod);
  };
  const names = new Map();
  const namedBy = mod => {
    if (!names.has(mod)) {
      const seen = new Set([mod]), queue = [mod], found = new Set();
      while (queue.length) {
        const { files, deps } = ownOf(queue.shift());
        for (const f of files) found.add(f);
        for (const d of deps) if (!seen.has(d)) { seen.add(d); queue.push(d); }
      }
      names.set(mod, found);
    }
    return names.get(mod);
  };
  const viaSupport = new Set(changed.filter(c => !c.skill && modules.filter(m => namedBy(m).has(c.file)).length <= modules.length / 4).map(c => c.file));
  const tests = walk(repo, TEST_DIR).filter(f => !f.startsWith(`${SUPPORT_DIR}/`) && isTestFile(path.posix.basename(f))).sort();
  const chosen = [];
  for (const test of tests) {
    const text = read(repo, test);
    const because = firstNamed(text);
    if (because) { chosen.push({ test, because }); continue; }
    for (const through of supportImports(text, test)) {
      const via = changed.find(c => viaSupport.has(c.file) && namedBy(through).has(c.file));
      if (via) { chosen.push({ test, because: via.file, through }); break; }
    }
  }
  return chosen;
}

// What `speck test --related` prints before it runs anything.
export function relatedReport(chosen, base) {
  if (!chosen.length) return `No test file under test/ names a file this branch changed since it left ${base}, so no related tests were chosen.`;
  return [`Related tests (${chosen.length}), each with the changed file that brought it in:`,
    ...chosen.map(c => `  ${c.test}: ${c.because}${c.through ? `, through ${c.through}` : ''}`)].join('\n');
}
