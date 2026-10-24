// Throwaway git repos for the tests of `speck test --related` (0437, 0447).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gIn } from './ship.mjs';

export const write = (dir, rel, text) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), text); };

// A committed repo on main with these files, then a branch `feature`.
export function repo(files) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-related-')));
  gIn(dir, 'init', '-q', '-b', 'main');
  for (const [rel, text] of Object.entries(files)) write(dir, rel, text);
  gIn(dir, 'add', '-A'); gIn(dir, 'commit', '-qm', 'base');
  gIn(dir, 'checkout', '-qb', 'feature');
  return dir;
}
