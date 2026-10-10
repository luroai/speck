---
id: "0099"
title: "Tell a failing main apart from a failing ticket when shipping"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-a-shipping-agent-that-heals-the-build.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T18:38:10.812Z"

---
# 0099 · Tell a failing main apart from a failing ticket when shipping

**Status:** 🔨 building

## Problem
`speck ship` runs the tests on the ticket's branch. When they fail because `main` itself is broken, it gives the same refusal as a broken ticket, so every waiting ship fails with a message that blames the ticket. On 2026-10-10 that's what stopped 0087, 0090 and 0091.

## Outcome
When a ship's tests fail, `speck ship` checks the base branch too, and says plainly when it's `main` that's failing, with an exit code of its own.

## Acceptance criteria
1. When the tests fail on the ticket's branch, `speck ship` runs the test command on the base branch as it is, in a temporary worktree, then removes that worktree.
2. If the base branch fails too, it refuses with exit code 14 and says the base branch's own tests are failing, so this isn't the ticket's fault and nothing was shipped.
3. If the base branch passes, it refuses as it does today, adding that the base branch's tests pass.
4. Either way, nothing else changes, as with every other refusal.

## Out of scope
- What happens next when `main` is failing (0101, 0102).

## Notes
- Today a test failure in `speck ship` exits 1.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
