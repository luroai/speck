---
id: "0689"
title: "Steady speck run's timing tests under load"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-08-steady-six-speck-run-timing-tests-under-load.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T20:50:21.021Z"

---
# 0689 · Steady speck run's timing tests under load

**Status:** 🔍 reviewing

## Problem
Several tests of speck run fail by chance at load averages of 20 to 60, so builds have to show their reviewers failures that aren't real, and one can fail the full suite on main: 0549 AC1, AC3, AC5 and AC4 in `test/run-settings-0549.test.mjs`, 0622 AC1–AC3 in `test/usage-limit-0622.test.mjs` (its limit resets three seconds ahead), the two 0166 AC2 tests in `test/waiting-0166.test.mjs` (a ±5 s tolerance), 0217 AC3, 0109 AC1 and 0300 AC1, AC3.

## Outcome
Each of these tests waits for what it checks, so they pass on a busy machine.

## Acceptance criteria
1. Each test file named in the Problem passes 5 runs out of 5, run on its own with one busy process per core running beside it (a loop that never sleeps), as on a machine running several builds.
2. None of the named tests waits a fixed time, or asserts a duration with a tolerance under 30 seconds, where it can wait with a time limit for what it checks, or set times that don't depend on how fast speck run starts (such as a limit that resets well after the test's speck run has started) (checked by review).
3. Each named test still fails when the behaviour it checks is broken (checked by review, by breaking one behaviour in each file and running it).
4. No test that passed before this change fails.

## Out of scope
- The 0264 and 0630 tests: 0688. The 0319 test: 0690.
- Changing speck run's behaviour.

## Notes
- From `speck/ideas/2026-11-08-steady-six-speck-run-timing-tests-under-load.md` and `speck/ideas/done/2026-11-10-steady-the-0622-and-0549-ac1-run-tests-under-load.md`. 0670 raised `until`'s default to 30 s, which steadied some of them; the ones left all passed in main's latest full run, so check each under load before changing it, and leave alone any that already holds up, saying so in Notes.
- Failing before this build: none
- Checked under load before changing anything (2026-11-15, 16 cores, one busy loop per core beside them, load averages 7 to 67): all six files passed 5 runs out of 5. Each named test was still changed where it waited a fixed time, had a limit shorter than 30 s, or checked a time against a tolerance, as AC2 asks.
- What changed: the 0622 limits reset an hour ahead, and the test moves speck run's record of the wait to now once it has seen the wait; the 0166 AC2 and 0217 AC3 counts and times are checked between bounds measured in the test (`assertCounted` and `assertWrittenSince` in `test/support/timing.mjs`) rather than within ±5 s or 10 s; the 0549 AC4 builds run until the test opens a gate rather than for 4 s, with the default wait in place of 2 s and 8 s limits; the 0109 AC1 first run waits for a gate until the second has said it's waiting, rather than sleeping 1 s, and its waits are 30 s rather than 15 s or 10 s; the 0300 stand-in agent's wait is the default 30 s rather than 15 s.
- Left as they are: 0549 AC1, AC3, AC5's 400 ms pause, and the 300 ms and 400 ms pauses in 0549 AC4, which show a build doesn't start, so there's nothing to wait for; the 0622 tests add a 500 ms pause of the same kind. 0300 AC1 and AC3's tests already waited for what they check, apart from the 15 s limit.
- After the change, 2026-11-15: each file passed 5 runs out of 5 under the same load, at load averages of 66 to 96. Breaking one behaviour per file failed its tests: waited time counted 8 s high (0166 AC2, 0217 AC3), the usage limit never held and held for ever (0622), max_parallel_tests ignored (0109 AC1), max_parallel_builds never lowered below 3 (0549 AC4), builds outside speck run never noted (0300 AC1, AC3).
- Self-check: the second 0622 test now waits for speck run's record of the wait before moving it, since speck run says the limit is reached just before it saves that record.
- Pictures: none, because nothing anyone sees changes.
- speck (2026-11-15 21:25 UTC) told you: The build is slow on purpose: this ticket steadies timing tests under load, so it has been running each test file several times with a busy loop on every core beside it to prove they hold up. That load test is also why the machine's load is so high. Its related tests pass (277 of 280, 3 skipped, none failing) and it is committing and moving on to review, so nothing is stuck. Why: The build's log shows repeated runs of its own load script, which starts one busy loop per core, and its latest test run passed with no hangs or failures.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
