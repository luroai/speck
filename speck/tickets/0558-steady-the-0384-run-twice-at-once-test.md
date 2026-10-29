---
id: "0558"
title: "Steady the 0384 run-twice-at-once test"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-10-28-steady-the-0384-run-twice-at-once-test.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-29
started: "2026-10-29T14:20:12.166Z"

---
# 0558 · Steady the 0384 run-twice-at-once test

**Status:** 🔨 building

## Problem
"0384 AC2: speck review run twice at once starts one reviewer, and its round is recorded once" failed once in a full run of its file with 24 busy CPU loops during 0540's build. A test that fails by chance can stop `speck ship` for a ticket that didn't break it.

## Outcome
That 0384 AC2 test passes however busy the machine is, and still fails if two `speck review` commands at once both start a reviewer.

## Acceptance criteria
1. The cause of the test's chance failure is found and fixed, and the Delivery log says what it was.
2. The test still fails if two `speck review` commands run at once both start a reviewer, or the round is recorded twice: the Delivery log says how this was checked.
3. `test/review-wait-0384.test.mjs` passes five runs in a row with 24 busy CPU loops running, and five runs of the file alone, recorded in the Delivery log.
4. No test that passed before this change fails.

## Out of scope
- 0384 AC3, which 0540 steadied.
- How long `speck review` waits for a reviewer outside tests.

## Notes
- Asked for 2026-10-29 for the 0.21.1 patch release.
- From 0540's build: it didn't fail again in 12 runs alone under the same load, with or without 0540's change, so it may be rare. Its `SPECK_REVIEW_WAIT_MS` of 1.5 s may be too short on a very busy machine. Not checked.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Cause (AC1): the test counted the reviewer's starts the moment both `speck review` commands had exited 12. Each command starts the round in a process of its own, which then starts the reviewer, so the reviewer is two Node processes deep, and on a busy machine it can write its "start" line after both commands have given up their 1.5 s wait. The count then saw no reviewer at all. Timed with a probe: the line came 0.3–1 s before the commands exited when the machine was idle, 0.2–0.7 s before with 24 busy loops, and after them in two of three runs with 64. Fixed by checking the claimed start records first (each is made before its reviewer is started, so they're all there once both commands have exited), then waiting up to 30 s for the reviewer's start line before counting it. The wait for the recorded round went from 10 s to 30 s as well. The test's checks moved to `test/support/review-twice.mjs`, and 0558 AC1 holds the reviewer's start line back until both commands have exited, so that case is now tested every run rather than left to chance.
- How AC2 was checked: four deliberate breakages in `scripts/`, each undone afterwards. (1) Every command starts its own reviewer (no pending check, a fresh start number each time): the test failed 3 runs of 3. (2) The worker records the round twice: failed 2 of 2, on "one round recorded in the ticket". (3) A claim that always succeeds, overwriting the other's: failed 1 run of 3, as the two commands rarely land in the same few milliseconds. (4) Only the pending check removed, claims kept: passed 3 of 3, because the claim alone stops it. 0558 AC2 also checks that the shared checks fail on a second claimed start, a second start line, and a reviewer that starts after the round is recorded.
- AC3: `test/review-wait-0384.test.mjs` passed 5 runs in a row with 24 busy loops (14 of 14 each, 23–26 s) and 5 runs alone (14 of 14 each, 17–19 s). It also passed 3 runs, together with the 0558 file, under 64 busy loops.
- AC4: `speck test --related` ran both files with the repo checks: 125 passed, 0 failed.
