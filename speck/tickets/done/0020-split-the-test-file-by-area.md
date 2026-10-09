---
id: "0020"
title: "Split the test file by area"                # one outcome, no "and"
status: cancelled            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0017"]                # ticket ids that must be done first
created: 2026-10-09
cancel_reason: "No longer needed: new builds write their own test files with shared helpers in test/support/, so test/speck.test.mjs no longer grows with every ticket. Not worth the conflict risk of moving 172 tests."
cancelled: 2026-10-09

---
# 0020 · Split the test file by area

**Status:** ❌ cancelled

## Problem
`test/speck.test.mjs` is about 1,900 lines. Builders and reviewers scroll through all of it to find the tests for one area, and appending every ticket's tests to one file makes it longer each time.

## Outcome
Tests are split into files by area, with shared helpers in one place, and the suite covers exactly what it does today.

## Acceptance criteria
1. Tests are split into several files under `test/`, grouped by area (for example tickets, reviews, ship, install and doctor), and no file is over 600 lines.
2. Shared helpers (the fake repos, fake reviewers and verdicts) live in one helper file that the test files import, with no copies.
3. `npm test` runs every test file. The number of tests and their names are the same as before the split, and all pass.

## Out of scope
- Changing what any test checks.
- Splitting the CLI code (0018, 0019).

## Notes
- Pre-check: no ambiguities found, and no external facts.
- After 0017, so the cleanup lands in the helpers once rather than in every copy.
- Test files don't count towards the changed-line limit.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
