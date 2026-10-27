---
id: "0541"
title: "Steady the 0247 AC4 test under load"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-27-fix-the-0247-ac4-test-that-fails-under-load.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-27T23:40:38.350Z"

---
# 0541 · Steady the 0247 AC4 test under load

**Status:** 🔨 building

## Problem
The `0247 AC4` test in `test/run-0247.test.mjs` (new code that can't start leaves the old one running) failed once in a large parallel `speck test --related` run and passes when its file runs alone. A test that fails by chance can stop `speck ship` for a ticket that didn't break it.

## Outcome
0247 AC4 passes whether its file runs alone or alongside the rest of the suite, and still fails if the behaviour it checks breaks.

## Acceptance criteria
1. 0247 AC4 waits for each thing it checks with a time limit, rather than counting on how quickly processes start, stop or write, and the Delivery log names what it waited on before and after.
2. The test still fails if new code that can't start stops the old `speck run`: the Delivery log says how this was checked, for example by breaking that code on purpose and running the test.
3. `test/run-0247.test.mjs` passes five runs in a row while the whole suite runs at the same time, and five runs of its file alone, recorded in the Delivery log.
4. No test that passed before this change fails.

## Out of scope
- Changing how `speck run` switches to new code (0247).
- 0540 (0384 AC3) and 0542 (two browser tests).

## Notes
- Seen in 0524's build: one failure in a run of 1,704 tests, none in two runs of its file alone.
- Checked 2026-10-27: passes when run alone on `main` (2 tests, 0 failing).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
