---
id: "0632"
title: "Use the full suite's result as a build's baseline"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-11-use-the-full-suite-s-result-as-a-build-s-baseline.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-11

---
# 0632 · Use the full suite's result as a build's baseline

**Status:** 📋 ready

## Problem
A build lists the tests that already fail before it changes anything from `speck test --recorded`, which reads only `commands.test`'s result. Since 0631 that's only the quick tests in this repo, so a slow test already failing on the base branch looks as if the build broke it.

## Outcome
A build's "Failing before this build" list covers the full suite whenever a full run is recorded for its code.

## Acceptance criteria
1. When a result is recorded for the same code with `commands.test_full`, `speck test --recorded` prints that result, saying it's the full suite's, which commit it's from and when, and exits with its exit code.
2. When none is recorded with `commands.test_full`, or `commands.test_full` is blank, `speck test --recorded` prints `commands.test`'s recorded result as it does today, and with neither recorded it says so in one line and exits with 0.
3. `speck test` without `--recorded`, `speck ship` and the full run `speck run` starts each still reuse only a result recorded with their own test command.
4. No test that passed before this change fails.

## Out of scope
- Running the full suite before a build starts.

## Notes
- `speck test --recorded` is `cmdTest` in `scripts/turns.mjs` with `showRecordedRun` in `scripts/results.mjs`; results are keyed by the code and the test command.
- The full suite's command is `fullCommand` in `scripts/full-suite.mjs` (0630).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
