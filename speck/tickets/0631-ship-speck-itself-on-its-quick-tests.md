---
id: "0631"
title: "Ship speck itself on its quick tests"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0630"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T10:36:36.782Z"

---
# 0631 · Ship speck itself on its quick tests

**Status:** 🔨 building

## Problem
Every speck ship waits for speck's whole suite, about 560 files, of which about 200 start a real panel, browser or `speck run`. They make each ship take minutes, and the timing tests among them refuse ships that broke nothing when the machine is busy.

## Outcome
speck ships on its quick tests, and its whole suite runs on `main` after ships through `commands.test_full`.

## Acceptance criteria
1. `node test/support/suite.mjs --quick` runs every `test/*.test.mjs` file except the heavy ones (as `test/support/heavy.mjs` finds them) and those marked as full-suite only, and `npm test` still runs every file.
2. These files are marked as full-suite only, so the quick run leaves them out: `test/build-log-0176.test.mjs`, `test/quick-waits-0232.test.mjs`, `test/ship-0264.test.mjs`, `test/review-wait-0384.test.mjs`, `test/run-switch-0301.test.mjs` and `test/stop-0072.test.mjs`. A test file adds itself to the full-suite-only set by the same mark, without being listed anywhere else.
3. In `speck/config.yml`, `commands.test` runs the quick tests and `commands.test_full` runs `npm test`.
4. `speck test --related` and `speck test --files` still run any test file they choose or are given, heavy and full-suite-only files included.
5. No test that passed before this change fails.

## Out of scope
- Deleting or rewriting any test, including the timing and source-text tests: they move out of the ship's way, not out of the suite.
- How `speck run` runs the full suite: 0630.

## Notes
- The six files are the most frequent non-heavy entries in `speck/.cache/flaky/flaky.log` (wall-clock, CPU-cost and real-process tests).
- After 0630, because the full run needs `commands.test_full` to exist.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
