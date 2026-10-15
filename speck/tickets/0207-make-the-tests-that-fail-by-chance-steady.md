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
- Failing before this build: none (speck test reused the passing result of commit 315f9e6, with nothing outside speck/ changed since).
- Self-check: the new 0176 check's own busy child spun for 300 ms of wall-clock time, so a busy machine gave it less CPU and it could fail by chance; it now works until it has used 300 ms of CPU.
- Whole-suite run: "0198 AC3: test/panel-0177.test.mjs keeps every test and every assertion it had" compared the file as it is now with 0198's start, so it fails on any later change to those assertions, including AC3's removal of the 1-second limits. It now compares 0198's start with 0198's approved commit, which is the change it guards. panel.mjs also went one line over the 600-line limit (0078 AC2), so its comment was shortened.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- 0128 AC4's cause (AC2): the panel showed speck run as on as soon as it held its lock, but speck run writes its first line ("speck run: watching for ready tickets…") to the shared run.log a moment later. On a busy machine that line landed after the second Turn on click had started reading the log, so the second speck run's refusal began with the first one's line, and the test's anchored match failed. Reproduced 3 times in 15 runs of that test with every core busy. Fixed in the panel: it shows speck run as on only once it holds the lock and has written its first line. 0 failures in 15 runs under the same load afterwards; 0207 AC2 pauses a copy of speck run between the two to check it every time.
- Three runs in a row of each changed file, on 2026-10-15 (AC4): ship-0153 15/15 passed each time; panel-0128 13/13; build-log-0176 4/4; panel-0177 8/8; flaky-0207 5/5. Under every core kept busy as well: flaky-0207 3 runs, panel-0177 and ship-0153 2 runs, all passing; 0176 AC1 measured 440 ms against 440 ms of CPU, where wall-clock time had missed by 13%.
