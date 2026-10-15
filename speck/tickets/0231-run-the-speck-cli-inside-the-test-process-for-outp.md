---
id: "0231"
title: "Run the speck CLI inside the test process for output checks"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0230"]                # ticket ids that must be done first
created: 2026-10-15

---
# 0231 · Run the speck CLI inside the test process for output checks

**Status:** 📝 draft

## Problem
Tests check speck's commands by starting `node scripts/speck.mjs` as a new process, about 800 times across the suite. Each start takes about 0.2 s on an 8 GB MacBook Air before the command does anything, and most of these tests only check what a command prints or changes.

## Outcome
Tests that only check a command's output or changes run it inside the test process.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. `scripts/speck.mjs` exports a function that runs one speck command with given arguments, folder and environment, and returns its exit code and what it printed, without ending the process.
2. `node scripts/speck.mjs <command>` prints, changes and exits exactly as today.
3. The shared test helpers that run a speck command use that function, except for commands that keep running (such as `panel` and `run`) and tests about the command as a process (signals, being killed or its process tree), which still start a process.
4. No test that passed before this change fails.

## Out of scope
- Changing what any command does.

## Notes
- Commands end today by throwing a `SpeckError` with a code, caught at the bottom of `scripts/speck.mjs`, but some may call `process.exit` or change `process.cwd()` or `process.env` themselves; the function must leave those as they were.
- Write the suite's total test time before and after, on the same machine, in the Delivery log.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
