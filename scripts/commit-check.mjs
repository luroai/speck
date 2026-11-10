// 0550, 0627: refuse a commit that adds a private word or the home folder's path to any file, or holds one in its
// message. speck init installs a pre-commit hook and a commit-msg hook that run this file, so they cover every commit,
// however it's made, in every worktree.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, SpeckError, sh } from './core.mjs';
import { homeFolder, homePathPattern, privateHit, privateWordList } from './private-words.mjs';

// The first lines of each hook. A hook without its marker isn't speck's, so init leaves it alone. The pre-commit
// marker keeps 0550's wording, so a hook an older speck wrote still counts as speck's.
const MARKER = "# speck: refuses a commit that adds a private word or your home folder's path under speck/ (0550)";
const MESSAGE_MARKER = "# speck: refuses a commit message that holds a private word or your home folder's path (0627)";
const hookText = (marker, run) => `#!/bin/sh
${marker}
# speck init writes this file. Skip it for one commit with \`git commit --no-verify\`.
# It runs the worktree's own copy of the check, or the copy speck init keeps in the repository's git folder when the
# worktree's branch has none.
script="$(git rev-parse --show-toplevel)/.speck/scripts/commit-check.mjs"
[ -f "$script" ] || script="$(git rev-parse --path-format=absolute --git-common-dir)/speck/scripts/commit-check.mjs"
if [ ! -f "$script" ]; then
  echo "speck: commit-check.mjs isn't in .speck/scripts/ or the git folder, so this commit wasn't checked for your private words. Run speck init again to bring it back." >&2
  exit 0
fi
if ! command -v node >/dev/null 2>&1; then
  echo "speck: node isn't on the PATH, so this commit wasn't checked for your private words." >&2
  exit 0
fi
exec node "$script"${run}
`;
export const HOOK = hookText(`${MARKER}\n# Since 0627 it checks the lines added to every file, apart from data copied from outside the project.`, '');
export const MESSAGE_HOOK = hookText(MESSAGE_MARKER, ' --message "$1"');

// 0627: files holding data copied from outside the project, which a private word can happen to match, so the check
// skips them: the price list's model names come from LiteLLM's public price list (0628), in speck's own repository
// and in the copy speck init puts in a project's .speck/.
export const COPIED_FILES = ['scripts/prices.json', '.speck/scripts/prices.json'];

// The diff of the staged `file` against HEAD, as git shows it whatever the user's settings.
function stagedDiff(repo, file) {
  const r = sh('git', ['diff', '--cached', '--no-color', '--no-ext-diff', '--no-textconv', '--text', '--no-renames', '-U0', '--inter-hunk-context=0', '--', `:(literal)${file}`], { cwd: repo });
  if (r.status !== 0) throw new SpeckError(`Couldn't read the staged changes to ${file}: ${(r.stderr || '').trim()}`);
  return r.stdout;
}

// The private words and the home folder's path pattern to check against, or null when there's nothing to check.
function checkList(what) {
  const list = privateWordList();
  if (list.error) throw new SpeckError(`Can't read ~/.config/speck/private-words (${list.error}), so ${what} couldn't be checked for your private words. Make it a readable file, or remove it to skip the check.`);
  const home = homeFolder(), re = home ? homePathPattern(home) : null;
  return list.words.length || re ? { words: list.words, re } : null;
}

// Each line the staged commit adds to any file, apart from COPIED_FILES, that holds a private word (in any case) or
// the home folder's path, as { file, line, what }, matched as speck ship matches them. Lines it only keeps or removes
// don't count.
export function stagedPrivateLines(repo) {
  const r = sh('git', ['diff', '--cached', '--no-renames', '--diff-filter=d', '--name-only', '-z', '--', '.', ...COPIED_FILES.map(f => `:(exclude,literal)${f}`)], { cwd: repo });
  if (r.status !== 0) throw new SpeckError(`Couldn't list the staged files: ${(r.stderr || '').trim()}`);
  const files = r.stdout.split('\0').filter(Boolean);
  if (!files.length) return [];
  const check = checkList('the staged files');
  if (!check) return [];
  const { words, re } = check;
  const found = [];
  for (const file of files) {
    let at = 0;
    for (const l of stagedDiff(repo, file).split('\n')) {
      const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(l);
      if (hunk) { at = Number(hunk[1]); continue; }
      if (!at) continue;
      if (l.startsWith(' ')) { at++; continue; } // a line it keeps, should git show one
      if (!l.startsWith('+')) continue;
      const what = privateHit(l.slice(1), words, re);
      if (what) found.push({ file, line: at, what });
      at++;
    }
  }
  return found;
}

// 0627: each line of the commit message in the file `file` that holds a private word or the home folder's path, as
// { line, what }. Lines below the scissors line `git commit --verbose` adds are left out, as git drops them.
export function messagePrivateLines(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); }
  catch (e) { throw new SpeckError(`Couldn't read the commit message (${e.code || e.message}).`); }
  const check = checkList('the commit message');
  if (!check) return [];
  const found = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/^. -+ >8 -+$/.test(lines[i])) break;
    const what = privateHit(lines[i], check.words, check.re);
    if (what) found.push({ line: i + 1, what });
  }
  return found;
}

const said = what => what === 'word' ? 'one of your private words (from ~/.config/speck/private-words)' : "your home folder's path";

// What the pre-commit hook prints when it refuses a commit.
export function refusal(found) {
  return `speck refused this commit: lines it adds hold your private words or your home folder's path. Nothing was committed.
${found.map(f => `  ${f.file} line ${f.line}: ${said(f.what)}`).join('\n')}
Take each one out (write a path under your home folder as a \`~/\` path), stage the file again, then commit.`;
}

// What the commit-msg hook prints when it refuses a commit message.
export function messageRefusal(found) {
  return `speck refused this commit: its message holds your private words or your home folder's path. Nothing was committed.
${found.map(f => `  commit message line ${f.line}: ${said(f.what)}`).join('\n')}
Take each one out of the message (write a path under your home folder as a \`~/\` path), then commit again.`;
}

// speck's two hooks, by the name git runs each under: the commit check (0550) and the commit message check (0627).
const HOOKS = {
  'pre-commit': { marker: MARKER, text: HOOK, run: '`node .speck/scripts/commit-check.mjs`' },
  'commit-msg': { marker: MESSAGE_MARKER, text: MESSAGE_HOOK, run: '`node .speck/scripts/commit-check.mjs --message "$1"`' },
};

// 0570: what to tell someone whose hooks are their own: never to replace them.
const callIt = name => `To check commits too, have your ${name} hook run ${HOOKS[name].run}.`;

// The repository's `name` hook as { file, old }, with `old` null for none, or { why, todo } when speck's hook can't
// go there: why not, and what to do about it. Shared by init and doctor, so they agree.
function findHook(repo, name = 'pre-commit') {
  const hooksPath = sh('git', ['config', '--get', 'core.hooksPath'], { cwd: repo });
  if (hooksPath.status === 0 && hooksPath.stdout.trim()) return { why: `git's core.hooksPath is set (${hooksPath.stdout.trim()}), so git doesn't run hooks from the repository's own folder`, todo: callIt(name) };
  const r = sh('git', ['rev-parse', '--git-path', `hooks/${name}`], { cwd: repo });
  if (r.status !== 0) return { why: "this folder isn't a git repository", todo: 'Run `git init` here, or run speck from inside your project folder.' };
  const file = path.resolve(repo, r.stdout.trim());
  let old = null;
  try { old = fs.readFileSync(file, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') return { why: `the repository's ${name} hook can't be read (${e.code || e.message})`, todo: 'Make it a file speck can read, then run `speck init` again.' }; }
  if (old !== null && !old.includes(HOOKS[name].marker)) return { why: `the repository already has its own ${name} hook`, todo: callIt(name) };
  return { file, old };
}

// 0570: whether git will run speck's `name` hook here, for speck doctor: { on: true }, or { on: false, why, todo }.
export function commitCheckState(repo, name = 'pre-commit') {
  const { file, old, why, todo } = findHook(repo, name);
  if (why) return { on: false, why, todo };
  if (old === null) return { on: false, why: `the repository has no ${name} hook`, todo: 'Run `speck init` again to add it.' };
  try { fs.accessSync(file, fs.constants.X_OK); } catch { return { on: false, why: `speck's ${name} hook isn't executable, so git doesn't run it`, todo: `Run \`chmod +x "${file}"\`.` }; }
  return { on: true };
}

// Writes speck's `name` hook, or says why not. { action: 'installed' | 'updated' | 'current' | 'skipped', why }.
function writeHook(repo, name) {
  const { file, old, why } = findHook(repo, name);
  if (why) return { action: 'skipped', why };
  if (old === HOOKS[name].text) return { action: 'current' };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, HOOKS[name].text);
  fs.chmodSync(file, 0o755);
  return { action: old === null ? 'installed' : 'updated' };
}

// Installs both hooks in the repository at `repo`, shared by all its worktrees, or says why not, each on its own:
// the pre-commit hook's result, with the commit-msg hook's as `message`. It also keeps a copy of speck's scripts in
// the git folder, so a worktree whose branch has no .speck/ is still checked (whichever checkout init ran in).
// Re-running refreshes that copy.
export function installCommitHook(repo) {
  const pre = findHook(repo, 'pre-commit'), msg = findHook(repo, 'commit-msg');
  if (pre.why && msg.why) return { action: 'skipped', why: pre.why, message: { action: 'skipped', why: msg.why } };
  const common = sh('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: repo });
  if (common.status !== 0) {
    const why = `git couldn't say where the repository's git folder is (${(common.stderr || '').trim()})`;
    return { action: 'skipped', why, message: { action: 'skipped', why } };
  }
  const copy = path.join(common.stdout.trim(), 'speck', 'scripts');
  fs.rmSync(copy, { recursive: true, force: true });
  fs.cpSync(path.join(ROOT, 'scripts'), copy, { recursive: true, dereference: true });
  return { ...writeHook(repo, 'pre-commit'), message: writeHook(repo, 'commit-msg') };
}

// Run by the hook, from the top of the worktree being committed in.
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  try {
    if (process.argv[2] === '--message') {
      if (!process.argv[3]) throw new SpeckError('git gave the commit-msg hook no message file.');
      const found = messagePrivateLines(process.argv[3]);
      if (found.length) { console.error(messageRefusal(found)); process.exit(1); }
    } else {
      const found = stagedPrivateLines(process.cwd());
      if (found.length) { console.error(refusal(found)); process.exit(1); }
    }
  } catch (e) {
    console.error(`speck couldn't check this commit for your private words, so nothing was committed: ${e.message}`);
    process.exit(1);
  }
}
