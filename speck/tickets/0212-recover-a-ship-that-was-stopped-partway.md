---
id: "0212"
title: "Recover a ship that was stopped partway"                # one outcome, no "and"
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
after: ["0204"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T15:17:36.380Z"

---
# 0212 · Recover a ship that was stopped partway

**Status:** 🔨 building

## Problem
To test a ticket merged with the base branch, `speck ship` moves the ticket's worktree onto the merged result and moves it back afterwards (0192). If the ship is killed in between, the worktree is left there, off the ticket's branch. The next ship then can't find the branch in any worktree, checks the main checkout instead and refuses with "You have uncommitted or untracked changes", and `speck run`'s queue waits for a new commit before trying again. On 2026-10-15 this held 0205 until it was put right by hand.

## Outcome
A ship that was stopped partway leaves nothing that stops the ticket's next ship, and the queue tries it again by itself.

## Acceptance criteria
1. When a ship is killed while the ticket's worktree is on the merged result, the next ship of that ticket, whoever starts it, first puts the worktree back on the ticket's branch, then ships as usual. Nothing committed on the branch is lost.
2. `speck run`'s queue tries a ticket again on its next check when its last ship was killed partway (its ship record has no end), without waiting for a new commit, and at most once per killed ship.
3. When a ticket's branch isn't checked out in its worktree and can't be put back, `speck ship` refuses with a message naming the ticket's worktree and saying how to fix it, never the "uncommitted or untracked changes" message about the main checkout.
4. A ship that isn't killed works as before, and the worktree is on the ticket's branch whenever a ship ends.
5. No test that passed before this change fails.

## Out of scope
- Ending a killed ship's tests (0174, shipped).
- What the panel shows for a failed push (0204).

## Notes
- Asked for 2026-10-15, for release 0.4.0.
- In `scripts/ship.mjs` the merged result is checked out detached in the ticket's worktree (around `git checkout -q --detach`), and `shipFolders()` falls back to the main checkout when no worktree has the branch. The queue's retry rule is in `scripts/ship-queue.mjs` (0193).
- Builds after 0204, which also changes `scripts/ship.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
