---
id: "0540"
title: "Steady the 0384 running-round test"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-10-24-fix-the-0384-running-round-test.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-27T23:40:38.719Z"

---
# 0540 · Steady the 0384 running-round test

**Status:** 🔨 building

## Problem
The test "0384 AC3: the panel shows the round as running through every exit 12, until it is recorded" fails by chance: in 0439's build it failed in the related run and alone, and in 0524's build it failed in a large parallel run, yet it passes on its own today. A test that fails by chance can stop `speck ship` for a ticket that didn't break it, and costs builders time ruling out their own change.

## Outcome
0384 AC3 passes whether its file runs alone or alongside the rest of the suite, and still fails if the behaviour it checks breaks.

## Acceptance criteria
1. The cause of 0384 AC3's chance failures (just after the first `speck review` exits 12, the round isn't shown as running) is found and fixed, and the Delivery log says what it was.
2. The test still fails if the panel stops showing the round as running between an exit 12 and the round being recorded: the Delivery log says how this was checked, for example by breaking that code on purpose and running the test.
3. `test/review-wait-0384.test.mjs` passes five runs in a row while the whole suite runs at the same time, and five runs of its file alone, recorded in the Delivery log.
4. If the fix is in speck's own code rather than the test, the panel's behaviour that 0384 describes is otherwise unchanged.
5. No test that passed before this change fails.

## Out of scope
- Other tests that fail by chance: 0541 (0247 AC4) and 0542 (0372 AC2 and 0476 AC2).

## Notes
- From 0439's build (2026-10-24): failed in the related run and alone, with 0439's changes stashed; speck's recorded base-branch result passed, so it may depend on where it runs, such as inside a build session. From 0524's build (2026-10-27): failed in the same large parallel run as 0247 AC4.
- Checked 2026-10-27: passes when its file runs alone on `main` (2 tests, 0 failing).
- Earlier steadying of chance failures: 0207, 0377.
- Failing before this build: none
- Self-check: no changes. A record the starting command writes after the round's process has already ended names a process that has gone, so the panel doesn't show it running; a round's process that fails before its reviewer starts ends, with the same result.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
- Cause (AC1): `speck review` starts the round in a process of its own and exits 12 once its wait (300 ms in the test) is up, but only that process recorded the round as running for the panel, after it had loaded speck and run the round's setup. On a busy machine that took longer than the wait, so straight after the first exit 12 the panel had nothing to show. Reproduced with 24 busy CPU loops: the test failed 5 times out of 5 at "running after the first exit 12". Fix: `speck review` now records the round as running, with its process's pid, as soon as it starts that process. The process still records it again and removes it when the round ends, as before.
- How AC2 was checked: with the record broken on purpose (`markRoundRunning` returning before it writes anything), 0384 AC3 and the new 0540 AC1 test both fail at once. With only the new line in `startRound` taken out, 0540 AC1 fails every time, because its wait is 1 ms.
- AC3: `test/review-wait-0384.test.mjs` passed 5 runs in a row alone (14 of 14 each time) and 5 runs in a row while `npm test` ran in the same worktree (14 of 14 each time). With 24 busy CPU loops it also passed 0384 AC3 5 times out of 5.
- Follow-up: once, with 24 busy CPU loops, "0384 AC2: speck review run twice at once starts one reviewer" failed in a full run of the file; it didn't happen again in 12 runs of that test alone, with or without this change, and the test doesn't read the record this ticket changed.
- Suite runs here had other failures (0072, 0150, 0202, 0232 AC3, 0264 AC3) while other sessions kept the machine's load average between 50 and 80; each passed when its file ran on its own afterwards.
