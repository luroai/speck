---
id: "0500"
title: "Keep the 0484 copy test passing when the machine is busy"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-24-fix-the-0484-copy-test-that-fails-under-load.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-25

---
# 0500 · Keep the 0484 copy test passing when the machine is busy

**Status:** 📝 draft

## Problem
A test in `test/panel-0484.test.mjs` expects a blocked bug ticket's line to read `speck will answer · Review 2 · 99:5x · bug`, but the ticket starts 5,990 seconds before the file loads, so the time only reads 99:5x for 10 seconds. When several test files run at once, the real panel takes longer than that to start, the time reads 100:00 and the test fails though nothing is wrong. `speck ship` runs the whole suite, so it can hand a ticket back for no reason, the 0.15.0 release included.

## Outcome
The 0484 checks of a closed card's line pass however long the panel takes to start, and still catch a real change to the line.

## Acceptance criteria
1. The checks in `test/panel-0484.test.mjs` that read a blocked ticket's time pass when the panel takes 60 seconds longer to start than it does on its own, checked by delaying the start that much.
2. They still fail if the line's words, its stage, the form of its time (minutes and seconds past an hour, such as `99:59`) or its tag change from what 0484 left, checked by changing each in turn.
3. No test that passed before this change fails.

## Out of scope
- How the panel shows the time, and any other test.

## Notes
- From the inbox note, raised while building 0485: seen twice in 0485's related test run (`speck will answer · Review 2 · 100:00 · bug`), while the file passed on its own.
- Today: tickets 0901 and 0905 in the file's board start `ago(5990)`, and the checks match `99:5\d` (lines 131 and 191).
- Asked for by the user on 2026-10-25, before releasing 0.15.0.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
