---
id: "0744"
title: "Let a test run hand back before the builder's shell limit while it waits"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
source: "speck/ideas/done/2026-11-24-let-a-test-run-outlast-the-builder-s-shell-limit-while-it-waits.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24

---
# 0744 · Let a test run hand back before the builder's shell limit while it waits

**Status:** 📋 ready

## Problem
When `speck test` waits for a turn behind other builds' runs (`max_parallel_tests`), it can wait past the builder's 10-minute shell limit and be killed before running a test. In 0711's build a run did exactly that, so a busy machine stops a build partway for no reason of its own.

## Outcome
A `speck test` run that would wait past the shell limit hands back in time and tells the builder how to carry on.

## Acceptance criteria
1. When `speck test` has waited for a turn for 8 minutes without starting, it exits with a distinct exit code and a line saying it gave up its place in the queue and to run the same command again, as `speck review` does at its limit (0384).
2. Run again with the same arguments, it takes its turn as soon as one is free; a run that gets a turn within 8 minutes behaves as today.
3. The speck-build skill tells the builder what that exit code means and to run the command again. (checked by review)
4. No test that passed before this change fails.

## Out of scope
- Changing `max_parallel_tests` or how turns are shared.

## Notes
- From 0711's build: "Waiting for a turn to run the tests: max_parallel_tests is 2, and 2 runs are already going", then killed at 10 minutes.
- `speck review` hands back with exit 12 and `--wait` (0384), which this can follow.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
