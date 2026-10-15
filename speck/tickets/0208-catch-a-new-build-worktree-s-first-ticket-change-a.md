---
id: "0208"
title: "Catch a new build worktree's first ticket change at once"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-catch-a-new-build-worktree-s-first-ticket-change-at-once.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0206"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T15:06:31.257Z"

---
# 0208 · Catch a new build worktree's first ticket change at once

**Status:** 🔨 building

## Problem
A ticket changed in a build's worktree straight after the worktree is made doesn't always reach the panel within a second: under load it can take up to 15 seconds. `speck start` writes a build's first status just after making its worktree, so the panel can show a new build late.

## Outcome
A ticket change in a new build's worktree reaches open pages within a second every time.

## Acceptance criteria
1. A ticket changed in a build's worktree within a second of the worktree being made reaches every open page's stream within 1 second, including when the worktree's `speck/tickets` folder appears while the panel is starting its watches.
2. After starting new watches, the panel looks at the board again once, so a change made before they started isn't missed.
3. Changes in worktrees that already existed reach open pages as they do today.
4. No test that passed before this change fails.

## Out of scope
- Sending only what changed (0188, shipped).
- The other tests that fail by chance (0207).

## Notes
- Asked for 2026-10-15, for release 0.4.0.
- Likely cause (from 0187's ship, unconfirmed): the panel watches a folder that doesn't exist yet through its parent. If it appears between the panel's check and the watch starting, its creation is missed until the next look, every 5 seconds, and an edit in that gap shows only at the 15-second re-read.
- `scripts/board-feed.mjs`. Builds after 0206, which builds after 0198: both may change the test helpers in `test/support/panel.mjs` or `test/panel-0187.test.mjs`.
- Failing before this build: none (speck test reused the passing run from commit 315f9e6).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
