---
id: "0109"
title: "Take turns running the test suite across builds"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T21:55:36.531Z"

---
# 0109 · Take turns running the test suite across builds

**Status:** 🔨 building

## Problem
Builds run in parallel, and each one runs the project's whole test suite several times: before changing anything, after building and when shipping. Speck's own suite opens about 15 headless browsers at once and uses about 1.9 GB. On 2026-10-10, five builds reached their tests at the same moment and the machine ran out of memory, which killed every build and `speck run`. A project with a heavy suite will hit the same wall.

## Outcome
Builds keep working in parallel, but take turns running the full test suite, as many at a time as `max_parallel_tests` allows.

## Acceptance criteria
1. `speck test` runs the test command from `speck/config.yml` and exits with its exit code. When `max_parallel_tests` runs (default 1) are already going in this repo, from any of its worktrees, it waits, saying once what it's waiting for, and starts when one ends.
2. The test run in `speck ship` takes a turn in the same way.
3. The build and review skills run the tests with `speck test`, not the test command directly.
4. A turn held by a process that has died is freed, so a killed build can't hold up the others.
5. `max_parallel_tests` is in the config template, and `speck config set` accepts a whole number of 1 or more for it.

## Out of scope
- Running fewer test files at once inside speck's own suite.

## Notes
- Measured 2026-10-10: one run of speck's suite peaked at about 1.9 GB more memory, 123 Chromium processes and 99 Node processes, on a 16-core VM with 14 GB.
- No test that passed before this change should fail.
- Failing before this build: none

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
