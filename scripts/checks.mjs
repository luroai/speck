// The files commands.checks lists (0272): `speck test --files` runs them with the files it's given, and speck's own
// quick test run runs them too (0657).

import fs from 'node:fs';
import path from 'node:path';
import { SpeckError } from './core.mjs';

// The test files commands.checks lists (0272), relative to the repo root: quick checks of rules for the whole repo that
// `speck test --files` runs with the files it's given. A SpeckError naming any that isn't a file, before anything runs.
export function checkFiles(repo, cfg) {
  const v = cfg.commands?.checks;
  const list = (Array.isArray(v) ? v.map(String) : v == null ? [] : String(v).split(/[\s,]+/)).filter(Boolean);
  const rels = [...new Set(list.map(f => path.relative(repo, path.resolve(repo, f)) || '.'))];
  const missing = rels.filter(f => !fs.statSync(path.join(repo, f), { throwIfNoEntry: false })?.isFile());
  if (missing.length) throw new SpeckError(`commands.checks in speck/config.yml lists ${missing.length === 1 ? 'a test file' : 'test files'} that ${missing.length === 1 ? "doesn't" : "don't"} exist: ${missing.join(', ')}. Fix the list with \`speck config set commands.checks "<file> …"\` (blank for none), then run this again. No tests were run.`);
  return rels;
}
