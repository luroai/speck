// Which test files `npm test` counts as heavy (0233, 0271): those that start a real panel, a browser or `speck run`,
// found from each file's own code by its calls to the support helpers that start one. On a machine with 8 cores or
// fewer, the runner (suite.mjs) runs these at most 2 at a time, beside the other files. A new test file that calls one
// of these helpers is heavy without being listed anywhere.

import fs from 'node:fs';
import path from 'node:path';

export const STARTS = /\b(startPanel|browserPage|startRun|buildPanel|slowPanel|readyPanel|launched)\(/;

// The files from `files`, paths below `root`, whose code starts a real panel, browser or `speck run`. A file that can't
// be read isn't heavy: the run reports it as it would any file that can't run.
export function heavyFiles(root, files) {
  return files.filter(f => {
    try { return STARTS.test(fs.readFileSync(path.join(root, f), 'utf8')); } catch { return false; }
  });
}
