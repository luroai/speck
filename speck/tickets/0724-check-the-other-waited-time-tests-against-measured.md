---
id: "0724"
title: "Check the other waited-time tests against measured bounds"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "quick"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-15-check-the-other-waited-time-tests-against-measured-bounds.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24

---
# 0724 · Check the other waited-time tests against measured bounds

**Status:** 📋 ready

## Problem
The 0166 AC1 tests and the 0217 AC2 test check a waited time against a fixed ±5 s tolerance. Each runs a speck command in between that can take over 5 s on a very busy machine, so a build could see a failure that isn't real.

## Outcome
These tests check waited times against bounds measured in the test.

## Acceptance criteria
1. The 0166 AC1 tests and the 0217 AC2 test check waited times against bounds measured in the test, as the 0166 AC2 and 0217 AC3 tests do, with no fixed ±5 s tolerance and no fixed 10 s limit left.
2. Each still fails when speck counts a wrong wait, such as one a minute out.
3. Each passes when a speck command it runs takes more than 5 s.
4. No test that passed before this change fails.

## Out of scope
- The 0182 AC3 Chromium test, which has a ticket of its own.

## Notes
- `near` is in `test/waiting-0166.test.mjs` and `test/stopped-wait-0217.test.mjs`; `assertCounted` and `assertWrittenSince` are in `test/support/timing.mjs`. 0217 AC2 reads back a backdated time, so an exact check or `assertWrittenSince`-style bounds may fit better than `assertCounted`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
