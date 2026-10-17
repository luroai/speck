---
id: "0264"
title: "Hand a ticket back when it fails tests that pass on a failing base branch"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0263"]               # ticket ids that must be done first
created: 2026-10-17

---
# 0264 · Hand a ticket back when it fails tests that pass on a failing base branch

**Status:** 📝 draft

## Problem
When a ship's tests fail and the base branch's own tests fail too, `speck ship` puts every failure down to the base branch (exit 14, "this isn't the ticket's fault"). That includes tests that pass on the base branch and fail only with the ticket. The ticket's build is then sent back with the "Base branch failing" steps, never hears about its own failures, and has them pointed out only on a later ship, a whole cycle later. 0257 hid three of its own failures this way on 2026-10-17 (0078 AC2, 0233 AC1, 0168 AC4) behind seven README failures on main.

## Outcome
When the base branch is failing, a ship refusal puts only the tests that also fail on the base branch down to the base branch. A ticket that fails tests the base branch passes is handed back to its build, with those tests named.

## Acceptance criteria
1. When tests fail on the ticket as it would land and every one of them also fails on the base branch's own commit, `speck ship` refuses as today: the base branch is blamed, and an auto-ship exits 14.
2. When any test that fails on the ticket as it would land passes on the base branch's own commit, `speck ship` refuses saying the ticket fails tests that pass on the base branch. It names those tests and not the ones that also fail on the base branch. It says the base branch is failing as well. An auto-ship exits 16, so speck run hands the ticket back to its build.
3. In the case in criterion 2, speck run doesn't put shipping on hold.
4. A test counts as failing on the base branch only when a test of the same name fails there. A test that is missing from the base branch, such as one the ticket adds, counts as passing there.

## Out of scope
- Shipping fix tickets during a hold: 0263.
- Running the whole suite during a build.

## Notes
- The refusal is built in `testFailure` in `scripts/ship.mjs`, which already has the failing tests' names (`failingTests` from `scripts/tap.mjs`) for the merged run but only an ok/not-ok result for the base branch's run.
- A test that failed on the merge and then passed on the second, chance-failure run doesn't count as failing (as today).
- `scripts/ship.mjs` is at 579 lines and the limit is 600 (0078 AC2), so code added there may need to move into a module of its own.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
