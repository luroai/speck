---
id: "0559"
title: "Steady the other speck run switch tests under load"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
started: "2026-10-29T15:36:43.549Z"

---
# 0559 · Steady the other speck run switch tests under load

**Status:** 🔨 building

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
- Failing before this build: none
- Self-check: the new code in the 0301 AC3 self-check, held until the test lets it fail, now also gives up once its gate's folder is gone, so a test file killed outright leaves no process spinning. The fake builder writes its record whole and then renames it, so a test reading the records while a build starts never reads half of one.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- AC1, the waits changed. Every wait in these tests now goes through `waitFor` (`test/support/run.mjs`), which waits up to `BUSY_MS`, 30 seconds, and fails naming what it waited for; `watching` (`test/support/run-switch.mjs`) defaults to the same limit.
  - `0247 AC1, AC3`, and `0247 AC3` (the panel's off switch), which has the same waits: speck run starting to watch, the switches to v2 and v3, only one speck run left under the one started, speck run stopping and the one on new code stopping, each 8 s before.
  - `0247 AC1, AC2`: the ship starting, speck run saying it waits for it (8 s each) and the switch once it ends (20 s). Its ship's tests ran `sleep 1.5`, so a slow switch could miss the ship. They now wait for a gate the test opens only once speck run has said it waits for the ship, and the test checks it hasn't switched before then.
  - The 0301 tests: builds starting (8 s), switches (8 s), tickets shown as building (8 s), the next build starting (10 s), a build said to have stopped or exited (10 s and 15 s), ships starting (8 s) and ending (20 s). Their builds ran 3, 5 and 8 seconds (`FAKE_MS`), which a slow switch could outlast; they now run until the test opens a gate (`FAKE_GATE`, new in the fake builder), and the ship in `0301 AC1, AC4` waits for one too (it ran `sleep 3`). The self-check test's new code failed after 2.5 seconds on the clock against a 1.2-second build; it now fails only once the test has seen the build end.
  - The 0321 tests: speck run starting to watch, builds starting, switches, the Foreman's status being written, the stand-in's worker starting and the speck run on new code stopping (8 s each), speck run exiting (an 8-second race, now `waitFor`), the second speck run being refused (10 s, now `BUSY_MS`) and the Settings view's off switch (10 s, now `BUSY_MS`, apart from the test of it running out at 300 ms). Their builds ran 20 seconds; they now run until the test ends.
  - `0300 AC5`: the launch and the build's exit, 8 s each.
- AC2: `0559 AC2` checks a wait that runs out fails with `waited <n> s for <what>, and it didn't happen.` and speck run's output. Seen for real in AC3's checks: `waited 30 s for speck run to exit, and it didn't happen.`
- AC3, how it was checked, with the code put back each time:
  - `scripts/run-switch.mjs` broken so the switch doesn't wait for a running ship: `0247 AC1, AC2` and `0301 AC1, AC4` fail.
  - `scripts/run-lock.mjs` broken so speck run never sees it has lost its lock: `0321 AC3, AC5`, both `0321 AC3` tests and `0321 AC4` fail, three of them with "waited 30 s for speck run to exit".
  - `scripts/run.mjs` broken so speck run takes a build it launched for one being built outside it: `0300 AC5` fails.
- AC4, on a machine with a load average of about 1 alone and 7 to 31 beside the suite:
  - Each file alone, 5 runs in a row, all passed: 0247 8 of 8 (7 s each), 0301 6 of 6 (6–7 s), 0321 13 of 13 (5–6 s), 0300 11 of 11 (6 s).
  - Each file while `npm test` ran alongside, 5 runs in a row: 0247, 0301 and 0321 all passed (10–16 s). The 0300 file failed once, in `0300 AC2`, which isn't one of this ticket's tests: it looks for a process by the session `resumed-0002` across the whole machine, and found the stand-in of the copy of the same test the suite was running at that moment. It now names a session no other copy has (`resumed-0002-<pid>`), and 5 more runs alone and 5 beside the suite all passed (11 of 11; 6 s alone, 11–19 s beside the suite).
  - Both suite runs alongside passed (4484 tests, none failing).
- `SWITCH_START_MS` never ran out in these runs.

