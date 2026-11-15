---
id: "0677"
title: "Reuse a build's test result when nothing has changed"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
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
after: ["0676"]                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T14:01:02.658Z"

---
# 0677 · Reuse a build's test result when nothing has changed

**Status:** 🔨 building

## Problem
A full `speck test` reuses a recorded result for the same code (0112), but `--files` and `--related` runs record nothing. A build that runs the same files twice with nothing changed between, for instance once to see them pass and again to keep the output for the review round, runs them twice. Of 803 such runs here since 29 Oct (10.9 hours), about 180 (2.8 hours) repeated a passing run with no change to the code.

## Outcome
A `--files` or `--related` run with the same code, test command and test files as an earlier passing one prints that run's result without running.

## Acceptance criteria
1. A passing `speck test --files <file>…` or `speck test --related` run records its output against the code as it stands in the checkout (uncommitted changes and new files that git doesn't ignore included), the test command and the test files it ran. The brief's `speck test` row says so.
2. A later `--files` or `--related` run, in any worktree of the repo, that would run the same test files with the same command on the same code prints the recorded output and a line saying it's reused and when it ran, and exits 0 without running the tests or waiting for a turn.
3. It runs the tests when any file outside `speck/` differs, when the test files differ, and after a failing run: a failure is never reused.
4. `speck test --fresh` with `--files` or `--related` always runs the tests.
5. No test that passed before this change fails.

## Out of scope
- Full runs, which already reuse results (0112, 0237).
- `speck ship`'s own test runs.
- Reusing a failing result.

## Notes
- Measured 2026-11-15 from this repo's build logs, and approximate: a run counts as a repeat when the build changed no file between it and the passing run before it. A further 148 runs (1.4 hours) repeated a failing run with no change, to see whether it failed by chance. Those still run.
- A full run records only when nothing outside `speck/` is uncommitted. Builds test before they commit, so this record has to take uncommitted changes into account.
- `cmdTest` in `scripts/turns.mjs` runs the tests and `scripts/results.mjs` keeps the recorded results.
- Failing before this build: none
- Self-check: added a test that `--fresh` just after `--files` runs the tests and that `--fresh` with anything else gives the usage message without a stack trace; checked that the reviewer's summary still reads a reused run's output. Running the tests in parallel showed the key could change between runs: the copied index got a newer time, so git took a file edited in the same second as unchanged. The copy now keeps the index's own time.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
