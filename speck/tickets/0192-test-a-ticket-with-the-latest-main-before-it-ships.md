---
id: "0192"
title: "Test a ticket with the latest main before it ships"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-ship-a-simple-merge-without-another-review.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T23:06:04.002Z"

---
# 0192 · Test a ticket with the latest main before it ships

**Status:** 🔨 building

## Problem
`speck ship` runs the tests on the ticket's branch alone, not on what will actually land: the ticket together with the base branch as it is now. Two tickets that each pass on their own can break the base branch together, and then every ship stops until someone fixes it. That happened twice on 2026-10-14 (0164 with 0165, fixed by 0190; 0177 with 0173, fixed by 0191). And an approved ticket whose base branch has moved on can't ship until a builder merges the base branch in and gets a merge review round, even when the merge is clean, which held up 0175, 0182 and 0183 for most of an evening.

## Outcome
What `speck ship` tests is exactly what lands on the base branch, and an approved ticket ships without another review when it merges into the newer base branch cleanly and its tests pass.

## Acceptance criteria
1. `speck ship` runs the tests on the commit it would put on the base branch (the ticket merged with the base branch as it is now), not on the ticket's branch alone. The commit that lands is the one whose tests passed.
2. If that commit fails tests that pass on the base branch alone, nothing ships, and `speck ship` says the ticket and the base branch's newer changes fail together, naming the failing tests.
3. When the base branch has moved on since the reviewer approved, and the ticket merges into it with no conflicts, `speck ship` ships it without another review round, provided the tests in criterion 1 pass.
4. When the merge has conflicts, `speck ship` refuses and changes nothing, as it does today, so the conflicts go to a merge round.
5. No test that passed before this change fails.

## Out of scope
- Shipping a merge that had conflicts without another review, even simple ones such as added lines or lockfiles (the rest of the idea note).
- A setting to require a review for every clean merge.

## Notes
- `scripts/ship.mjs` runs the tests in the ticket's worktree (`runTests(work, cfg)`), and `shipChecks` refuses a ticket whose files outside `speck/` changed after approval, which any merge of the base branch does.
- Related: 0048 (update a conflicting branch and re-review it), 0101 (the skill for ships that need a merge), 0116 (a ship that needs help inside the build).
- High risk: it changes what guards the base branch. A clean merge is safe to ship unreviewed only because criterion 1 tests the combined result.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
