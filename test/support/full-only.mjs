// Which test files run only in the full suite (0631): those marked with a line of their own starting
// `// Full suite only:`, followed by why. `node test/support/suite.mjs --quick`, the run each ship of speck waits for,
// leaves them out with the heavy files (heavy.mjs), and `npm test` runs them. A new test file is full-suite only by
// that mark, without being listed anywhere else.

import fs from 'node:fs';
import path from 'node:path';

export const FULL_ONLY = /^\/\/ Full suite only:/m;

// The files from `files`, paths below `root`, marked as full-suite only. A file that can't be read isn't: the run
// reports it as it would any file that can't run.
export function fullOnlyFiles(root, files) {
  return files.filter(f => {
    try { return FULL_ONLY.test(fs.readFileSync(path.join(root, f), 'utf8')); } catch { return false; }
  });
}
