---
id: "0265"
title: "Merge the remote's base branch in when it has diverged cleanly"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0264"]               # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T09:07:33.967Z"

---
# 0265 · Merge the remote's base branch in when it has diverged cleanly

**Status:** 🔨 building

## Problem
When the remote's base branch has a commit your local base branch doesn't (for example, a README edited on GitHub), and your local base branch has one the remote doesn't, `speck ship` refuses with "each have commits the other doesn't". speck run's ship queue then waits for a new local commit that may never come, so approved tickets sit unshipped with no sign why outside `run.log`. This held up 0257 overnight on 2026-10-16 and 2026-10-17.

## Outcome
`speck ship` combines the two base branches itself when they merge without conflicts, and refuses as today only when they conflict.

## Acceptance criteria
1. When the local base branch and the remote's base branch each have commits the other doesn't, and they merge without conflicts, `speck ship` merges the remote's base branch into the local base branch with a merge commit, says so in one line naming the commits it brought in, then carries on shipping as if they had never diverged.
2. When they would conflict, `speck ship` refuses as today, changing nothing: the local base branch, the working tree and the index are as they were.
3. Uncommitted changes in the checkout the base branch is in, and untracked files, are kept as they were through the merge in criterion 1. When they'd be overwritten by the merge, `speck ship` refuses, changing nothing, and says which files are in the way.
4. When the ship that merged the remote's base branch in then doesn't ship (for example, a test fails), the merge commit stays on the local base branch, so the next ship doesn't need to merge it again.

## Out of scope
- Rebasing or rewriting history on either branch.
- Showing ship refusals in the panel.

## Notes
- The check is `remoteBaseCatchUp` in `scripts/ship.mjs`, which already fetches the remote's base branch and fast-forwards when only the remote is ahead.
- The merge in criterion 1 counts as a new commit on the base branch for speck run's ship queue (`refsOf`), so a ticket refused earlier is tried again.
- `scripts/ship.mjs` is at 579 lines and the limit is 600 (0078 AC2), so code added there may need to move into a module of its own.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
