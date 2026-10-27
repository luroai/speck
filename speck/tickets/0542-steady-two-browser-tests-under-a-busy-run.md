---
id: "0542"
title: "Steady two browser tests under a busy run"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-10-26-steady-two-browser-tests-under-a-busy-run.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-27T23:40:38.315Z"

---
# 0542 · Steady two browser tests under a busy run

**Status:** 🔨 building

## Problem
Two browser tests fail when nearly the whole suite runs at once, as `speck test --related` does after a change to a shared test helper: 0372 AC2 (the dark look is kept after a reload) failed with "Inspected target navigated or closed" while reloading, and 0476 AC2 (the trackpad and arrow keys change lane in the same time) got `plan` where it expected `build`. Both pass on their own. A failure like this at `speck ship` hands a ticket back for nothing.

## Outcome
0372 AC2 and 0476 AC2 pass whether their files run alone or alongside the rest of the suite, and still fail if the behaviour they check breaks.

## Acceptance criteria
1. 0372 AC2 waits for the reloaded page to be ready before it reads the look, with a time limit, so a slow reload doesn't fail it.
2. 0476 AC2 waits for each lane change to finish, with a time limit, before it checks which lane is open or starts the next change, so a slow frame doesn't fail it.
3. Each still fails if the behaviour it checks breaks (the look isn't kept after a reload; the trackpad and arrow keys don't change lane): the Delivery log says how this was checked.
4. Each changed test file passes five runs in a row while the whole suite runs at the same time, and five runs of its file alone, recorded in the Delivery log.
5. No test that passed before this change fails.

## Out of scope
- Running tests one at a time, or other ways of changing how the suite schedules browser tests.
- 0540 and 0541.

## Notes
- From 0516's build: both failed under that load and passed alone every time; 0476 AC2 also failed on the base code alone once.
- Decided 2026-10-27: wait with a time limit rather than run these tests one at a time, as 0207 did for other chance failures.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
