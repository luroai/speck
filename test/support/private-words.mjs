// The owner's private words, for 0082's check that no tracked file names them.
// They live on the owner's machine, outside the repo, so no tracked file holds them.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export const privateWordsFile = (home = os.homedir()) => path.join(home, '.config', 'speck', 'private-words');

// One word per line. Blank lines and lines starting with # are skipped. A missing file lists no words.
export function readPrivateWords(home = os.homedir()) {
  let text;
  try { text = fs.readFileSync(privateWordsFile(home), 'utf8'); }
  catch (e) {
    if (e.code === 'ENOENT' || e.code === 'ENOTDIR') return [];
    throw new Error(`Can't read ${privateWordsFile(home)} (${e.code}). Make it a readable file, or remove it to skip the check.`);
  }
  return text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
}

// Tracked files, apart from 0082's ticket file, that contain any of the words (case-insensitive, literal).
export function filesNaming(words, cwd) {
  const r = spawnSync('git', ['grep', '-l', '-i', '-F', ...words.flatMap(w => ['-e', w]), '--', '.',
    ':!speck/tickets/0082-*', ':!speck/tickets/done/0082-*'], { cwd, encoding: 'utf8' });
  if (r.status > 1 || r.error) throw new Error(`git grep failed: ${r.stderr || r.error?.message}`);
  return r.stdout.split('\n').filter(Boolean);
}
