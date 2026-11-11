// The user's private words and home folder's path, which nothing speck commits should publish (0083, 0121, 0506).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SpeckError, sh } from './core.mjs';
import { loginPasswords } from './logins.mjs';

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
// 0635: given `repo`, also `logins`, each test login's password saved for it on this machine (speck logins), lower-cased,
// which count as private words too. Throws a plain error when the logins file can't be read.
export function privateWordList(repo) {
  const logins = repo ? loginPasswords(repo) : [];
  let home = '';
  try { home = os.homedir(); } catch { /* no home folder */ }
  if (!home) return { words: [], logins };
  let list;
  try { list = fs.readFileSync(path.join(home, '.config', 'speck', 'private-words'), 'utf8'); }
  catch (e) {
    if (e.code === 'ENOENT' || e.code === 'ENOTDIR') return { words: [], logins };
    return { words: [], logins, error: e.code || e.message };
  }
  return { words: list.split('\n').map(l => l.trim().toLowerCase()).filter(l => l && !l.startsWith('#')), logins };
}

// 0633: `value` with each of `words` (lower-cased, as privateWordList gives them), in any case, in every string in it
// written as `[private]`, longest word first, after any home folder path in it is written as a `~/` path, so a word in
// the home folder's path doesn't stop that. A string under one of the `keep` keys, keys themselves, numbers and the
// like stay as they are, and `value` isn't changed.
export function redactPrivateWords(value, words, keep = []) {
  if (!words.length) return value;
  const esc = w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp([...words].sort((a, b) => b.length - a.length).map(esc).join('|'), 'giu');
  const walk = v => typeof v === 'string' ? tildePaths(v).replace(re, '[private]')
    : Array.isArray(v) ? v.map(walk)
    : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, keep.includes(k) ? x : walk(x)]))
    : v;
  return walk(value);
}

// 0550: what `line` holds: 'word' for one of `words` (lower-cased) in any case, 'home' for the home folder's path as
// `re` (homePathPattern) finds it, or null for neither. Shared by ship and the commit check, so they agree.
// 0633: speck's own `[private]` markers (redactPrivateWords) aren't searched for words, so a word inside one, such as
// "riv", doesn't count, and the text either side of one isn't read as a single word.
// 0635: 'login' for one of `logins`, a saved test login's password (lower-cased).
export function privateHit(line, words, re, logins = []) {
  const text = line.replaceAll('[private]', '\0').toLowerCase();
  if (words.some(w => text.includes(w))) return 'word';
  if (logins.some(w => text.includes(w))) return 'login';
  return re && re.test(line) ? 'home' : null;
}

// What a refusal says a line holds, for privateHit's answer, without repeating it. Shared by ship and the commit check.
export function privateSaid(what) {
  return what === 'word' ? 'one of your private words (from ~/.config/speck/private-words)'
    : what === 'login' ? "a saved test login's password (from speck logins)"
    : "your home folder's path";
}

// 0506: each line of a file under speck/ that `branch` adds or changes against `base` that holds a private word (in
// any case) or the home folder's path, as { file, line, what }, what being 'word' or 'home'. Deleted files are skipped,
// and a binary one is read as text. Throws a plain error when the private-words file or a file can't be read.
export function privateLinesInSpeck(repo, base, branch) {
  const list = privateWordList(repo);
  if (list.error) throw new SpeckError(`Can't read ~/.config/speck/private-words (${list.error}), so the files under speck/ couldn't be checked for your private words. Make it a readable file, or remove it to skip the check.`);
  const home = homeFolder(), re = home ? homePathPattern(home) : null;
  if (!list.words.length && !list.logins.length && !re) return [];
  const r = sh('git', ['diff', '--no-renames', '--diff-filter=d', '--name-only', '-z', `${base}...${branch}`, '--', 'speck/'], { cwd: repo });
  if (r.status !== 0) throw new SpeckError(`Couldn't list the files under speck/ that ${branch} changes: ${(r.stderr || '').trim()}`);
  const found = [];
  for (const file of r.stdout.split('\0').filter(Boolean)) {
    const show = sh('git', ['show', `${branch}:${file}`], { cwd: repo });
    if (show.status !== 0) throw new SpeckError(`Couldn't read ${file} on ${branch} to check it for your private words: ${(show.stderr || '').trim()}`);
    show.stdout.split('\n').forEach((l, i) => {
      const what = privateHit(l, list.words, re, list.logins);
      if (what) found.push({ file, line: i + 1, what });
    });
  }
  return found;
}
