---
id: "0540"
title: "Steady the 0384 running-round test"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0540 · Steady the 0384 running-round test

**Status:** 📝 draft

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

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
