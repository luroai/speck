---
id: "0032"
title: "Document that builds can run in parallel"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T10:52:06.864Z"

---
# 0032 · Document that builds can run in parallel

**Status:** 🔨 building

## Problem
`product.md` says builds run one ticket at a time and the brief lists parallel builds as out of scope, but with one worktree per build, running tickets in parallel is now how speck is used, and it's much faster. Nothing yet proves that tickets built side by side both ship cleanly.

## Outcome
The docs say several tickets can be built at once, and the tests show that parallel builds ship one after the other, with a conflict refused cleanly.

## Acceptance criteria
1. A test starts two tickets with `speck start`, each in its own worktree, gets both to `approved` with changes to different files, then ships the first and then the second. Both end up `done` and merged on the base branch, and both worktrees and branches are removed.
2. A test does the same with two tickets that change the same lines of one file. The second ship refuses with the existing "hit a conflict" error, and its ticket stays `approved`, with its branch, its worktree and the base branch exactly as they were before that ship.
3. `speck/product.md` no longer says builds run one ticket at a time. Its Known limits say several tickets can be built at once, each in its own worktree, that there's still no dependency scheduling, and that a ticket whose changes conflict with one shipped before it is refused at ship and must be rebuilt on the latest base branch.
4. `docs/brief.md` no longer lists running several tickets in parallel as out of scope. Dependency graphs stay out of scope.

## Out of scope
- Scheduling or starting builds automatically, or stopping two tickets that touch the same files from running together (planned for the panel's queue).
- Any change to how `speck ship` behaves. If either test shows parallel ships don't work, block with the failure rather than redesigning shipping here.

## Notes
- The conflict error's current text starts "Merging <branch> into <base> hit a conflict, so nothing was shipped".
- Independent of 0030 and 0031, so it can be built alongside 0030.
- No external facts beyond git, which the ship tests already use.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
