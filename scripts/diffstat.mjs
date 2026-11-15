// `speck diffstat`: the branch's changed lines against the size limit. Moved out of speck.mjs (0352).

import { SpeckError, findRepoRoot, loadConfig, changedLines, findTicket } from './core.mjs';
import { ownBase, branchTicket } from './built-on.mjs';

export function cmdDiffstat() {
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const { total, counted } = changedLines(repo, cfg.base_branch, ownStart(repo, cfg));
  for (const r of counted) console.log(`  ${String(r.lines).padStart(5)}  ${r.file}`);
  console.log(`${total} changed lines (limit ${cfg.limits.max_changed_lines}, excluding tests, lockfiles and speck/)`);
  if (total > cfg.limits.max_changed_lines) throw new SpeckError('Over the size limit: stop and propose a split.', 2);
}

// 0674: on the branch of a ticket built on another, where its own change starts. null otherwise, for where it left the
// base branch.
function ownStart(repo, cfg) {
  const id = branchTicket(repo, cfg);
  try { return id ? ownBase(repo, cfg, findTicket(repo, id).fm) : null; } catch { return null; } // no ticket file here
}
