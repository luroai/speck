---
id: "0688"
title: Steady two ship-side tests that fail under load                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
source: "speck/ideas/done/2026-11-11-steady-the-0264-ac3-ship-queue-test.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T20:50:21.824Z"

---
# 0688 · Steady two ship-side tests that fail under load

**Status:** 🔨 building

## Problem
Two tests fail by chance when the machine is busy, so a build's related run or the full suite on main can fail for a ticket that didn't touch them: "0264 AC3: speck run doesn't put shipping on hold, and hands the ticket back to its build" in `test/ship-0264.test.mjs` reads the ship queue's launch before it has happened, and "0630 AC3: a full run doesn't wait for the max_parallel_tests turns" in `test/full-suite-0630.test.mjs` asserts a fixed timing.

## Outcome
Both tests wait for what they check, so they pass on a busy machine.

## Acceptance criteria
1. Each of the two tests passes 10 runs out of 10, run on its own with one busy process per core running beside it (a loop that never sleeps), as on a machine running several builds.
2. Neither test waits a fixed time or asserts a time limit where it can wait, with a time limit of at least 30 seconds, for what it checks (checked by review).
3. Each test still fails when the behaviour it checks is broken: the 0264 test when the ship queue puts shipping on hold, the 0630 test when a full run waits for a `max_parallel_tests` turn (checked by review, by breaking each and running it).
4. No test that passed before this change fails.

## Out of scope
- Other tests that fail under load: 0689 and 0690.
- Changing speck's behaviour.

## Notes
- From `speck/ideas/2026-11-11-steady-the-0264-ac3-ship-queue-test.md` and `speck/ideas/done/2026-11-11-steady-the-0630-full-run-turn-test-under-load.md`. Seen in 0632, 0640, 0642, 0645, 0649, 0660, 0670 and 0673.
- `until` in the test support (0670 raised its default to 30 s) may be what to wait with.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
