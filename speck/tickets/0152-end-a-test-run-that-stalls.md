---
id: "0152"
title: "End a test run that stalls"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-13

---
# 0152 · End a test run that stalls

**Status:** 📋 ready

## Problem
When a test hangs, speck waits for it forever. On 2026-10-13 the test run in 0149's auto-ship stopped making progress after 714 of about 1,310 tests and sat silent for nine minutes, until the build tool's 10-minute limit killed the ship. Nothing told the user; the ticket just looked approved. The next run of the same suite passed in about a minute.

## Outcome
A test run that stops making progress is ended after a set time, and speck reports it as a failed run that says the tests stalled, so a ship or build never hangs on a stuck test.

## Acceptance criteria
1. When the test command run by `speck test`, by a build or by `speck ship` writes no output for `test_stall_minutes` (in `speck/config.yml`, default 5), speck ends it and every process it started, and treats the run as failed.
2. The failure says in plain words that the tests stalled, for how long, and the last line of output before they did, and is recorded as a failed result, never reused as a pass.
3. `speck ship` stopped this way merges nothing, leaves the ticket approved and says to ship again, as it does for any test failure.
4. `test_stall_minutes` must be a whole number of 1 or more; any other value is refused with a message saying how to fix it. A test run that keeps writing output is never ended, however long it takes.
5. No test that passed before this change fails.

## Out of scope
- Finding or fixing the test that hung on 2026-10-13.
- A total time limit on a test run.

## Notes
- Tests run through `runTestsInTurn` in `scripts/turns.mjs`, used by `speck test`, builds and `runTests` in `scripts/ship.mjs`.
- Evidence: `speck/.cache/results/run.85b8dba7-….out` stops at test 714 at 20:42:05; the build log shows `speck ship 0149 --auto` killed at 20:51:20 with exit 143.
- No output for minutes is a better sign of a hang than total time: a slow suite still writes a line per test.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
