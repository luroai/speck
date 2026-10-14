---
id: "0173"
title: "Stop tests checking speck run has stopped too soon"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-13-stop-tests-checking-speck-run-stopped-too-soon.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T20:36:47.075Z"

---
# 0173 · Stop tests checking speck run has stopped too soon

**Status:** 🔨 building

## Problem
Some tests turn speck run off and then check once, straight away, that its process has gone. On a busy machine the process can take a moment to exit, so the full suite fails now and then (0128 AC3 or 0148 AC2) when nothing is wrong. That stops auto-ship: on 2026-10-14 it held up 0164's ship even though the same failure happened on `main`.

## Outcome
Tests that check a stopped process has gone give it a moment to exit, so a busy machine no longer fails the full suite when nothing is wrong.

## Acceptance criteria
1. "0128 AC3: a speck run started from the panel can be turned off from it, and turned on again" and "0148 AC2: the Auto-build switch turns speck run on and off from the --url page" each wait up to 10 seconds for the stopped speck run process to exit before failing, rather than checking once.
2. Every other test in `test/` that checks a process it stopped has gone, by checking once straight after stopping it or after a fixed pause, waits up to 10 seconds in the same way. The ticket's Notes list the tests changed.
3. If a process is still running when the 10 seconds are up, the test fails, and its failure message still says which process didn't stop (for example "speck run has stopped").
4. Run 20 times in a row while the full suite runs alongside them, `test/panel-0128.test.mjs` and `test/panel-0148.test.mjs` pass every time.
5. No test that passed before this change fails.

## Out of scope
- Changing how speck run, the panel or `speck ship` stop or wait for processes. This ticket changes tests only.
- Ship blaming a ticket for a failure that also happens on the base branch, because it compared against a passing base-branch result saved earlier.
- The suite hanging under load (0159).

## Notes
- Seen while building 0159 (both tests failed once with two suites running side by side) and again while building 0164 (load average around 50; one of the two failed in every full run, on `main` too).
- `panelRunOff()` in `scripts/panel.mjs` returns 200 once the process has gone or the run lock no longer names it, so the lock can be gone a moment before the process has exited.
- Also seen on 2026-10-14 in a full run on a quiet machine: "0067 AC5: if speck panel is killed outright, its server stops too" failed once with "Missing expected rejection" (the server still answered), and passed 3 times out of 3 on its own. It's the same kind of check, so AC2 covers it.
- The waits use a time limit so a process that really doesn't stop still fails the test rather than hanging the suite (see 0159).
- Tests changed: 0128 AC3 (a speck run started from the panel can be turned off from it, and turned on again); 0148 AC2 (the Auto-build switch turns speck run on and off from the --url page); 0148 AC2 (Stop build works from the --url page, which checked after a fixed 200 ms pause); 0067 AC5 (all three: Ctrl+C, killed outright, and Ctrl+C while new code is starting, from 3 to 10 seconds for the children, and the port now waited for); 0073 AC2 (stop from the panel, and a paused build stops from the panel too); 0072 AC1 (stop ends the build and every process it started; stop ends a paused build too; a process that ignores SIGTERM is still ended) and 0072 AC3 (a build an earlier speck run launched); 0152 AC1 (three tests: speck test, uncommitted changes, speck test --files) and 0152 AC3 (speck ship whose tests stall). Each now waits up to 10 seconds through `hasStopped` in `test/support/stopped.mjs`.
- AC4 checked by hand on 2026-10-14: `test/panel-0128.test.mjs` and `test/panel-0148.test.mjs` run 20 times in a row (`node --test` on the two files) while the full suite ran over and over alongside: 20 passed, 0 failed, with the load average between 13 and 53. A test inside the suite can't run the suite alongside itself, so this is checked by running the same loop again.
- Self-check: exempted one check in `test/run-0047.test.mjs` from the AC2 scan (it looks at a process `spawnSync` has already waited for, not one the test stopped), and corrected the Notes, which named the 0148 Stop build test as AC1.
- Failing before this build: 0165 AC1: at 375 px, every tag in Plan, the Build queue and the full ticket pane has the same visible size and even gaps, with a 44 by 44 px tap area each

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
