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
blocked_at: ""
waited_seconds: 34088

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
- Failing before this build: none
- Tests: no new test file. The change is to the two `0247 AC4` tests themselves, so each criterion is checked by runs recorded in the Delivery log: the file alone, the file while the whole suite runs, and the file with the switch code broken on purpose. A reviewer can check AC1 by reading the two tests: every wait has a time limit (`BUSY_MS`), and each check of which processes are left waits for them.
- Self-check: no changes. `watching(run)` without a limit still waits 8 seconds, as `until` does, so the 0301 tests that share it are unchanged.
- Went with the recommendation: wait for Codex after 3:41 AM (chosen by speck, as watch is fix, 2026-10-28 09:43 UTC).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->
The change is built and its tests pass, but the reviewer (Codex) can't run: its account has hit its usage limit until about 3:41 AM. Should I wait until then and run the review with Codex, or would you rather pick another reviewer for this ticket, such as Cursor? I recommend waiting for Codex, because it's the reviewer you've set and the change is small.
Recommended: wait for Codex after 3:41 AM
Changes what you'd notice: no
Clear winner: yes

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- What 0247 AC4 waited on, before: 8 seconds each (`until`'s default) for speck run to start watching, for the failed switch to be said, for the ticket to launch and for the next switch, while the last check of which processes were left was taken once, straight after a fixed pause (600 ms and 800 ms), so a stopped process not yet gone counted as left over. After: each of those waits up to 30 seconds (`BUSY_MS`), and the check of which processes are left waits, up to the same limit, for the failed one to be gone. The fixed pauses stay only to show nothing happens again (no second launch, no second "couldn't switch").
- AC2, how it was checked: with `scripts/run-switch.mjs` broken on purpose so that new code that can't start stops the old speck run (`process.exit(1)` after it says it couldn't switch), both AC4 tests fail. Broken instead so that, after a switch, the process you started stops when the next new code can't start, the AC4 test that covers a failure after a switch fails. The code was put back each time.
- AC3: `test/run-0247.test.mjs` alone, 5 runs in a row: all passed (8 of 8 each, 14–21 s), on a machine at a load average of about 75 on 16 cores from another session's CPU-burning tests. While the whole suite (`npm test`) ran at the same time: 5 runs in a row, all passed (8 of 8 each, 22–33 s). In that suite run, `0232 AC3` (a CPU-cost check) and `0384 AC3` (0540) failed under the load; neither uses anything this ticket changed.
- In an earlier run through `speck test --files`, the out-of-scope `0247 AC1, AC2` test in the same file failed once: its ship took 16 s under the load, past its 20-second wait for the switch.

