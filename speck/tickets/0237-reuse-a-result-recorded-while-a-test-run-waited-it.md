---
id: "0237"
title: "Reuse a result recorded while a test run waited its turn"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0228"]          # ticket ids that must be done first
created: 2026-10-15

---
# 0237 · Reuse a result recorded while a test run waited its turn

**Status:** 📝 draft

## Problem
`speck test` looks for a recorded result for its code before it waits for a turn, and not again once it gets one. When several builds start together on code with no recorded result, for example after a commit to `main` outside a ship, each waits its turn and then runs the whole suite on the same code, one after another. With 4 builds and an 8-minute suite, the last one waits about half an hour for a result the first one recorded long before.

## Outcome
A test run that waited its turn reuses a result recorded for the same code while it waited, instead of running the suite again.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. When `speck test` waits for a turn, and while it waits a result is recorded for the same code and test command, it prints that result and exits with its exit code once its turn comes, without running the suite, and says in one line that the result is reused, as it does today when one was recorded before it started.
2. `speck ship`'s test run does the same with a passing result recorded while it waited, and still runs the suite when the result recorded while it waited is a failure.
3. `speck test --fresh` never reuses a result, whether it was recorded before it started or while it waited.
4. A run that reuses a result frees its turn straight away, so the next waiting run starts without waiting for a run that never started.
5. No test that passed before this change fails.

## Out of scope
- Changing what counts as the same code, or how long results are kept (0112).
- Sharing results between machines or clones.
- `speck test --files`, which takes no turn and records no result.

## Notes
- Today `testRun()` in `scripts/results.mjs` checks `recorded()` before it calls `runTestsInTurn()` in `scripts/turns.mjs`, which waits for the turn and runs the suite with no look at the results.
- Found 2026-10-15 while deciding 0235: a build's first whole-suite run is usually reused from the ship before it, except after a change to `main` made outside a ship.
- 0228 changes the retry in `testRun()`. Build this after it.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
