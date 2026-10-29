---
id: "0559"
title: "Steady the other speck run switch tests under load"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-28-steady-the-other-speck-run-switch-tests-under-load.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0557"]                # ticket ids that must be done first
created: 2026-10-29

---
# 0559 · Steady the other speck run switch tests under load

**Status:** 📋 ready

## Problem
The tests of speck run's switch to new code wait only 8 or 20 seconds for processes to start, ship or switch, so on a busy machine they fail by chance: in 0541's build `0247 AC1, AC2` failed once and eight 0247, 0301 and 0321 tests failed in one related run, all passing on a quiet machine. A test that fails by chance can stop `speck ship` for a ticket that didn't break it.

## Outcome
The other tests of speck run's switch wait with time limits long enough for a busy machine, as 0541 gave 0247 AC4, and still fail if what they check breaks.

## Acceptance criteria
1. `0247 AC1, AC2` and `0247 AC1, AC3` in `test/run-0247.test.mjs`, the 0301 tests in `test/run-switch-0301.test.mjs`, the 0321 tests in `test/run-lock-0321.test.mjs` and `0300 AC5: speck run doesn't take a build it started itself for one started outside it` in `test/seen-builds-0300.test.mjs` wait for each process to start, ship, switch or stop with a time limit long enough for a busy machine, rather than counting on it happening within 8 or 20 seconds. The Delivery log names the waits changed.
2. A wait that runs out still fails its test, saying what it was waiting for.
3. At least one test in each of those files still fails when what it checks is broken on purpose: the Delivery log says how this was checked.
4. Each of those four files passes five runs in a row while the whole suite runs at the same time, and five runs of the file alone, recorded in the Delivery log.
5. No test that passed before this change fails.

## Out of scope
- `SWITCH_START_MS`, the 10 seconds speck run gives new code to get ready. If a test still fails because that runs out, the Delivery log says so and the builder raises it as a follow-up.
- 0247 AC4, which 0541 steadied.

## Notes
- Asked for 2026-10-29 for the 0.21.1 patch release.
- From 0541's build, at load averages of 75 to 106 on 16 cores: `0247 AC1, AC2`'s ship took 16 s against its 20 s wait.
- `watching(run, ms)` in `test/support/run-switch.mjs` already takes a time limit (0541), and `until` in `test/support/run.mjs` waits 8 s by default.
- Waits for 0557: both may change the waits in `test/support/run.mjs` (`until`).
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
