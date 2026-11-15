---
id: "0690"
title: "Steady the 0319 outside-speck-run test"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-12-steady-the-0319-outside-speck-run-test.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15

---
# 0690 · Steady the 0319 outside-speck-run test

**Status:** 📝 draft

## Problem
"0319 AC1–AC4" in `test/seen-builds-0319.test.mjs` once saw speck run call build 0002 "already being built" instead of "being built outside speck run", at a load of about 20, then passed alone. A chance failure like this can fail the full suite on main and hold up every ship.

## Outcome
The test gives the same result every time, whether the cause was in the test or in speck run.

## Acceptance criteria
1. The build finds and writes in Notes which of these it was: the test writing 0002's run record after speck run first reads it, or speck run really labelling the build wrongly in a race.
2. If it was the test, the test waits for speck run to have read the records it wrote before checking the label. If it was speck run, speck run gives a build it didn't start the "being built outside speck run" label whenever the record says so, and a test shows the race no longer changes the label.
3. The test file passes 10 runs out of 10, run on its own with one busy process per core running beside it (a loop that never sleeps), as on a machine running several builds.
4. No test that passed before this change fails.

## Out of scope
- Other tests that fail under load: 0688 and 0689.

## Notes
- Seen in 0670's related run.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
