// `speck diffstat`: the branch's changed lines against the size limit. Moved out of speck.mjs (0352).

import { SpeckError, findRepoRoot, loadConfig, changedLines } from './core.mjs';

export function cmdDiffstat() {
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const { total, counted } = changedLines(repo, cfg.base_branch);
  for (const r of counted) console.log(`  ${String(r.lines).padStart(5)}  ${r.file}`);
  console.log(`${total} changed lines (limit ${cfg.limits.max_changed_lines}, excluding tests, lockfiles and speck/)`);
  if (total > cfg.limits.max_changed_lines) throw new SpeckError('Over the size limit: stop and propose a split.', 2);
}
