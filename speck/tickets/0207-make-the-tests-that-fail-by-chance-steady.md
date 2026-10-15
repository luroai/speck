---
id: "0207"
title: "Make the tests that fail by chance steady"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-fix-the-race-in-the-0153-second-ship-test.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0206"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T15:06:38.152Z"

---
# 0207 · Make the tests that fail by chance steady

**Status:** 🔨 building

## Problem
Several tests fail now and then in full runs and pass when run again. Since 0195 a chance failure is run again rather than failing the run, but each one still costs a second run of its file, shows in the flaky log and can hide a real failure. Seen on 2026-10-14 and 15: 0153 AC2, 0128 AC4, 0176 AC1 and 0177 AC3.

## Outcome
Those four tests give the same result however busy the machine is.

## Acceptance criteria
1. "0153 AC2" (a second `speck ship` for the same ticket refuses) takes its snapshot only once the first ship has reached its tests (its gate's `reached` file), so the first ship's own checkout isn't counted as a change.
2. "0128 AC4" (off the base branch, or with `speck run` already on, the panel gets `speck run`'s own error): the cause of its chance failures is found and fixed, and recorded in the Delivery log.
3. The timing checks in 0176 AC1 and 0177 AC3 compare against a measurement made in the same test under the same conditions, not a fixed number of milliseconds, so other builds' test runs on the same machine don't change their result. Each still fails if the slowdown it guards against comes back.
4. Each changed test file passes three runs of its own file in a row, recorded in the Delivery log.
5. No test that passed before this change fails.

## Out of scope
- Other tests that fail by chance.
- The test for a new worktree's first ticket change (0208).

## Notes
- Asked for 2026-10-15, for release 0.4.0. Covers four inbox notes: this one, `2026-10-15-fix-the-0128-ac4-test-that-fails-by-chance.md`, `2026-10-14-keep-timing-checks-steady-while-other-builds-test.md` and `2026-10-14-keep-the-0177-one-second-tests-passing-on-a-busy-machine.md`.
- From 0187's build: 0176 AC1 failed at 333 vs 377 ms against a 10% limit, and passed alone. From 0191's: the 0177 AC3 checks failed at 1306 and 1106 ms against 1 second while another suite ran.
- Builds after 0206, which runs after 0198: 0198 may change these same test files.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
