// 0550: refuse a commit that adds a private word or the home folder's path to a file under speck/. speck init installs
// a pre-commit hook that runs this file, so it covers every commit, however it's made, in every worktree.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SpeckError, sh } from './core.mjs';
import { homeFolder, homePathPattern, privateHit, privateWordList } from './private-words.mjs';

// The first lines of the hook. A pre-commit hook without the marker isn't speck's, so init leaves it alone.
const MARKER = "# speck: refuses a commit that adds a private word or your home folder's path under speck/ (0550)";
export const HOOK = `#!/bin/sh
${MARKER}
# speck init writes this file. Skip it for one commit with \`git commit --no-verify\`.
# It runs the worktree's own copy of the check, or the main checkout's when the worktree's branch has none.
script="$(git rev-parse --show-toplevel)/.speck/scripts/commit-check.mjs"
[ -f "$script" ] || script="$(git rev-parse --path-format=absolute --git-common-dir)/../.speck/scripts/commit-check.mjs"
if [ ! -f "$script" ]; then
  echo "speck: .speck/scripts/commit-check.mjs isn't here or in the main checkout, so this commit wasn't checked for your private words. Run speck init again to bring it back." >&2
  exit 0
fi
if ! command -v node >/dev/null 2>&1; then
  echo "speck: node isn't on the PATH, so this commit wasn't checked for your private words." >&2
  exit 0
fi
exec node "$script"
`;

// The diff of the staged `file` against HEAD, as git shows it whatever the user's settings.
function stagedDiff(repo, file) {
  const r = sh('git', ['diff', '--cached', '--no-color', '--no-ext-diff', '--no-textconv', '--text', '--no-renames', '-U0', '--inter-hunk-context=0', '--', `:(literal)${file}`], { cwd: repo });
  if (r.status !== 0) throw new SpeckError(`Couldn't read the staged changes to ${file}: ${(r.stderr || '').trim()}`);
  return r.stdout;
}

// Each line the staged commit adds to a file under speck/ that holds a private word (in any case) or the home folder's
// path, as { file, line, what }, matched as speck ship matches them. Lines it only keeps or removes don't count.
export function stagedPrivateLines(repo) {
  const r = sh('git', ['diff', '--cached', '--no-renames', '--diff-filter=d', '--name-only', '-z', '--', 'speck/'], { cwd: repo });
  if (r.status !== 0) throw new SpeckError(`Couldn't list the staged files under speck/: ${(r.stderr || '').trim()}`);
  const files = r.stdout.split('\0').filter(Boolean);
  if (!files.length) return [];
  const list = privateWordList();
  if (list.error) throw new SpeckError(`Can't read ~/.config/speck/private-words (${list.error}), so the files under speck/ couldn't be checked for your private words. Make it a readable file, or remove it to skip the check.`);
  const home = homeFolder(), re = home ? homePathPattern(home) : null;
  if (!list.words.length && !re) return [];
  const found = [];
  for (const file of files) {
    let at = 0;
    for (const l of stagedDiff(repo, file).split('\n')) {
      const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(l);
      if (hunk) { at = Number(hunk[1]); continue; }
      if (!at) continue;
      if (l.startsWith(' ')) { at++; continue; } // a line it keeps, should git show one
      if (!l.startsWith('+')) continue;
      const what = privateHit(l.slice(1), list.words, re);
      if (what) found.push({ file, line: at, what });
      at++;
    }
  }
  return found;
}

// What the hook prints when it refuses a commit.
export function refusal(found) {
  return `speck refused this commit: lines it adds under speck/ hold your private words or your home folder's path. Nothing was committed.
${found.map(f => `  ${f.file} line ${f.line}: ${f.what === 'word' ? 'one of your private words (from ~/.config/speck/private-words)' : "your home folder's path"}`).join('\n')}
Take each one out (write a path under your home folder as a \`~/\` path), stage the file again, then commit.`;
}

// Installs the hook in the repository at `repo`, shared by all its worktrees, or says why not:
// { action: 'installed' | 'updated' | 'current' | 'skipped', why }.
export function installCommitHook(repo) {
  const hooksPath = sh('git', ['config', '--get', 'core.hooksPath'], { cwd: repo });
  if (hooksPath.status === 0 && hooksPath.stdout.trim()) return { action: 'skipped', why: `git's core.hooksPath is set (${hooksPath.stdout.trim()}), so git doesn't run hooks from the repository's own folder` };
  const r = sh('git', ['rev-parse', '--git-path', 'hooks/pre-commit'], { cwd: repo });
  if (r.status !== 0) return { action: 'skipped', why: "this folder isn't a git repository" };
  const file = path.resolve(repo, r.stdout.trim());
  let old = null;
  try { old = fs.readFileSync(file, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') return { action: 'skipped', why: `its pre-commit hook can't be read (${e.code || e.message})` }; }
  if (old !== null && !old.includes(MARKER)) return { action: 'skipped', why: 'the repository already has its own pre-commit hook' };
  if (old === HOOK) return { action: 'current' };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, HOOK);
  fs.chmodSync(file, 0o755);
  return { action: old === null ? 'installed' : 'updated' };
}

// Run by the hook, from the top of the worktree being committed in.
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  try {
    const found = stagedPrivateLines(process.cwd());
    if (found.length) { console.error(refusal(found)); process.exit(1); }
  } catch (e) {
    console.error(`speck couldn't check this commit for your private words, so nothing was committed: ${e.message}`);
    process.exit(1);
  }
}
