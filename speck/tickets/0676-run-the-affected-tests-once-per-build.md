---
id: "0676"
title: Re-run only the failing files after a related test run fails                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T13:36:04.862Z"

---
# 0676 · Re-run only the failing files after a related test run fails

**Status:** 🔨 building

## Problem
Before its first review round a build runs `speck test --related`: its own test files and every existing test file that names a file it changed. The build skill says to run it once, but the 41 builds here since 11 Nov ran it 125 times, about 3 each, 3.1 hours in all (a median 53 seconds a run, 225 at the 90th percentile). After a failing run, builds run the whole set again rather than the files that failed, and each run holds a test turn other builds wait for.

## Outcome
After a failing `--related` run, a build re-runs only the files that failed and its own.

## Acceptance criteria
1. A `speck test --related` run that fails ends its output with one line giving the command to run next: `speck test --files` followed by the files it was given and the file of each failing test, each once.
2. A passing `--related` run, any `--files` run, and a failing `--related` run whose failing tests' files can't be read from its output print no such line.
3. The build skill's step for the test run before the first review round (section 3 step 5) says that after a failing `--related` run the build fixes the failure and runs the command on that line, and that `--related` runs once per build and never in a later round. (checked by review)
4. The brief's `speck test` row describes the line.
5. No test that passed before this change fails.

## Out of scope
- Which test files `--related` picks (0447).
- Reusing a result when nothing has changed: 0677.

## Notes
- Measured 2026-11-15 from this repo's build logs.
- A full run already reads each failing test's file from `location:` in TAP output for its second try. The same reading serves here.
- Builds keep the run's output with `tee` for the review round, so the line comes last and mustn't read as a test's own output.
- Failing before this build: none
- Decision: the reminder sits in the command's output, where the build reads it at the moment the run fails. If builds still run the whole set again, a later ticket can make a second `--related` run narrow itself.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
