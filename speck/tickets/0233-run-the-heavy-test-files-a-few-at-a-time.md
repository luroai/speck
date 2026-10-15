---
id: "0233"
title: "Run the heavy test files a few at a time"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0229"]                # ticket ids that must be done first
created: 2026-10-15

---
# 0233 · Run the heavy test files a few at a time

**Status:** 📋 ready

## Problem
Test files that start real processes, panels or a browser run alongside everything else, so on a small machine they slow each other down and miss their time limits. On an 8 GB MacBook Air, 26 tests failed on `main` that way, and the machine stayed fully loaded throughout the run.

## Outcome
speck's heavy test files run a few at a time while the light ones run as many at once as today.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. `npm test` runs the test files listed as heavy (those that start real processes, a panel or a browser) at most 2 at a time, and the other files as many at a time as today. The list of heavy files is kept in one place.
2. One `npm test` run still runs every file in `test/` once, its output is read by speck's test summary and retry as today, and it exits with a failure when any test fails.
3. No test that passed before this change fails.

## Out of scope
- Making any single test faster.

## Notes
- 135 of the 181 test files use a support module that starts processes, panels or a browser (`test/support/procs.mjs`, `run.mjs`, `panel.mjs`, `fake-chrome.mjs` and others); not all of them are heavy.
- Builds on the test runner 0229 changes.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
