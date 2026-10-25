// The user's private words and home folder's path, which nothing speck commits should publish (0083, 0121, 0506).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SpeckError, sh } from './core.mjs';

// The user's home folder without a trailing slash, or '' when it can't be found, isn't absolute or is the root.
export function homeFolder() {
  let home = '';
  try { home = os.homedir(); } catch { /* no home folder */ }
  home = (home || '').replace(/[\\/]+$/, '');
  return home && path.isAbsolute(home) ? home : '';
}

// The home folder's path standing on its own: not inside a longer path (/mnt/home/ann) or a longer name (/home/ann2).
export function homePathPattern(home, flags = 'u') {
  const esc = home.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const name = '[\\p{L}\\p{N}\\p{M}_-]'; // a character that could continue a folder name, in any script
  return new RegExp(`(?<!${name}|\\.)${esc}(?!${name}|\\.${name})`, flags);
}

// `text` with each path under the home folder written as a `~/` path, and the home folder itself as `~`.
export function tildePaths(text, home = homeFolder()) {
  if (!home || typeof text !== 'string') return text;
  return text.replace(homePathPattern(home, 'gu'), '~');
}

// The words in ~/.config/speck/private-words, lower-cased: one per line, skipping blank lines and # lines.
// { words }, with none when there's no file or home folder, or { error } saying why the file can't be read.
export function privateWordList() {
  let home = '';
  try { home = os.homedir(); } catch { /* no home folder */ }
  if (!home) return { words: [] };
  let list;
  try { list = fs.readFileSync(path.join(home, '.config', 'speck', 'private-words'), 'utf8'); }
  catch (e) {
    if (e.code === 'ENOENT' || e.code === 'ENOTDIR') return { words: [] };
    return { words: [], error: e.code || e.message };
  }
  return { words: list.split('\n').map(l => l.trim().toLowerCase()).filter(l => l && !l.startsWith('#')) };
}

// 0506: each line of a file under speck/ that `branch` adds or changes against `base` that holds a private word (in
// any case) or the home folder's path, as { file, line, what }, what being 'word' or 'home'. Deleted files are skipped,
// and a binary one is read as text. Throws a plain error when the private-words file or a file can't be read.
export function privateLinesInSpeck(repo, base, branch) {
  const list = privateWordList();
  if (list.error) throw new SpeckError(`Can't read ~/.config/speck/private-words (${list.error}), so the files under speck/ couldn't be checked for your private words. Make it a readable file, or remove it to skip the check.`);
  const home = homeFolder(), re = home ? homePathPattern(home) : null;
  if (!list.words.length && !re) return [];
  const r = sh('git', ['diff', '--no-renames', '--diff-filter=d', '--name-only', '-z', `${base}...${branch}`, '--', 'speck/'], { cwd: repo });
  if (r.status !== 0) throw new SpeckError(`Couldn't list the files under speck/ that ${branch} changes: ${(r.stderr || '').trim()}`);
  const found = [];
  for (const file of r.stdout.split('\0').filter(Boolean)) {
    const show = sh('git', ['show', `${branch}:${file}`], { cwd: repo });
    if (show.status !== 0) throw new SpeckError(`Couldn't read ${file} on ${branch} to check it for your private words: ${(show.stderr || '').trim()}`);
    show.stdout.split('\n').forEach((l, i) => {
      if (list.words.some(w => l.toLowerCase().includes(w))) found.push({ file, line: i + 1, what: 'word' });
      else if (re && re.test(l)) found.push({ file, line: i + 1, what: 'home' });
    });
  }
  return found;
}
