---
id: "0559"
title: "Steady the other speck run switch tests under load"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
approved: "2026-10-29T16:13:52.186Z"

---
# 0559 · Steady the other speck run switch tests under load

**Status:** 👍 approved

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
Nothing changes in how speck itself works. Some of speck's own checks, those on `speck run` picking up new code, used to give up after 8 to 20 seconds, so on a busy machine they could fail by chance and hold up shipping a ticket that broke nothing. They now wait up to 30 seconds, hold builds and ships open until they've seen what they need rather than hoping the timing works out, and say plainly what they were waiting for if it never happens. To see it, ship a ticket while the machine is busy: these checks should no longer be the reason a ship stops. Keep an eye out for any of them still failing now and then, which would point to a cause other than timing.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The final two 0321 AC2 tests still use unbounded `await exited` waits.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 321,201
- Elapsed since build started: 37 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- AC1, the waits changed. Every wait in these tests now goes through `waitFor` (`test/support/run.mjs`), which waits up to `BUSY_MS`, 30 seconds, and fails naming what it waited for; `watching` (`test/support/run-switch.mjs`) defaults to the same limit.
  - `0247 AC1, AC3`, and `0247 AC3` (the panel's off switch), which has the same waits: speck run starting to watch, the switches to v2 and v3, only one speck run left under the one started, speck run stopping and the one on new code stopping, each 8 s before.
  - `0247 AC1, AC2`: the ship starting, speck run saying it waits for it (8 s each) and the switch once it ends (20 s). Its ship's tests ran `sleep 1.5`, so a slow switch could miss the ship. They now wait for a gate the test opens only once speck run has said it waits for the ship, and the test checks it hasn't switched before then.
  - The 0301 tests: builds starting (8 s), switches (8 s), tickets shown as building (8 s), the next build starting (10 s), a build said to have stopped or exited (10 s and 15 s), ships starting (8 s) and ending (20 s). Their builds ran 3, 5 and 8 seconds (`FAKE_MS`), which a slow switch could outlast; they now run until the test opens a gate (`FAKE_GATE`, new in the fake builder), and the ship in `0301 AC1, AC4` waits for one too (it ran `sleep 3`). The self-check test's new code failed after 2.5 seconds on the clock against a 1.2-second build; it now fails only once the test has seen the build end.
  - The 0321 tests: speck run starting to watch, builds starting, switches, the Foreman's status being written, the stand-in's worker starting and the speck run on new code stopping (8 s each), speck run exiting (an 8-second race, now `waitFor`), the second speck run being refused (10 s, now `BUSY_MS`) and the Settings view's off switch (10 s, now `BUSY_MS`, apart from the test of it running out at 300 ms), and speck run or the stand-in exiting after the off switch, which had no limit (review round 1). Their builds ran 20 seconds; they now run until the test ends.
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
- Follow-ups:
  - `speck/ideas/2026-10-29-give-tests-session-names-no-other-run-shares.md`: other tests that start a stand-in agent with a fixed session name, such as `hand-0001`, could clash the way `0300 AC2` did when the same file runs twice at once.
  - Known limit: `0321 AC3, AC5` failed once in a combined run before the fake builder wrote its records whole, and the failure couldn't be reproduced or its message recovered. A half-written record is the likeliest cause, not a proven one.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "2f4f76f6b7efd058e300d45602f6a20986c14fc7",
    "session": "fresh",
    "thread_id": "01a1886e-6a15-7321-8db5-874d27afb9a6",
    "builder_response": "- Tests run: `speck test --related test/steady-0559.test.mjs test/run-0247.test.mjs test/run-switch-0301.test.mjs test/run-lock-0321.test.mjs test/seen-builds-0300.test.mjs` (819 tests, the ticket's own file, the four changed test files and every test file naming a changed support file; none failed).\n- Notes for the reviewer:\n  - Every wait in the named tests now goes through `waitFor(cond, what, out, ms = BUSY_MS)` in `test/support/run.mjs` (30 s), which fails with `waited <n> s for <what>, and it didn't happen.` plus speck run's output (AC2). `0559 AC1` checks statically that the steadied tests call no bare `until(` and name no 8/10/15/20-second limit.\n  - Beyond the time limits, several tests raced fixed durations against the switch (fake builds of 3/5/8/20 s via `FAKE_MS`, ships of `sleep 1.5` and `sleep 3`, and a 2.5-second clock-time failure in the 0301 self-check). Those are the same \"counting on it happening within N seconds\" problem, so they now wait on gates the test opens: `FAKE_GATE` (new option in the fake builder) and `gated()` from `test/support/gate.mjs` for ships. Each gate also lets go once its folder is gone, and the tests kill or stop what they started in `finally`.\n  - `0247 AC3` (the panel's off switch) isn't named in AC1, but has exactly the same waits as `0247 AC1, AC3`, so it was steadied too.\n  - The fake builder now writes its record whole and renames it, so `r.calls()` can't read a half-written file under load. One combined run failed `0321 AC3, AC5` once before this change, and I couldn't capture its message or reproduce it, so this is the likeliest cause rather than a proven one.\n  - `0300 AC2` (not named in the ticket) failed once in AC4's runs beside the suite: it searches every process for the session `resumed-0002`, and found the stand-in of the suite's own copy of the same test. It now uses a session unique to the test process. AC4 then re-ran for that file.\n  - AC3 and AC4 are recorded in the Delivery log: code broken on purpose three ways (each restored), and five runs alone and five beside `npm test` for each file. No `scripts/` file changed.\n",
    "seconds": 42,
    "usage": {
      "input_tokens": 188374,
      "cached_input_tokens": 129792,
      "cache_write_input_tokens": 0,
      "output_tokens": 1125,
      "reasoning_output_tokens": 157
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 58582,
      "cached": 129792,
      "write": 0,
      "output": 1125
    },
    "cost_usd": 0.1413932,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-29T16:12:21.618Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "Most waits now use the 30-second waitFor helper, but both final 0321 AC2 tests in test/run-lock-0321.test.mjs still await the stand-in's exited promise without a time limit."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "0559 AC2 exercises waitFor's informative timeout failure and passes. However, the unbounded exited waits in the final two 0321 AC2 tests can hang instead of failing with an explanation."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The Delivery log records deliberate ship-wait, lock-loss and build-adoption breakages causing tests in all four files to fail. The corresponding behavioural assertions remain present."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The Delivery log and /tmp/speck-0559-ac4/log-round1.txt record five passing runs alone and alongside the suite for 0247, 0301 and 0321. log.txt records five passing runs in both conditions for the corrected 0300 file."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "/tmp/speck-0559-tests.txt confirms 819 tests, 816 passing, three skipped and no failures, including the changed files and related helper consumers."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/run-lock-0321.test.mjs",
        "issue": "The final two 0321 AC2 tests still use unbounded `await exited` waits. In the 'every page shows speck run on' test, if the stand-in fails to exit, panelRunOff can finish its 30-second timeout while the test remains stuck awaiting exited, never reaching its assertions or finally cleanup. This leaves process-stop waits outside the bounded, explanatory failure behaviour required by AC1 and AC2.",
        "suggested_fix": "Replace both unbounded exited waits with waitFor checks of the host's exitCode or signalCode, naming the stand-in process being awaited. Extend the ticket's checks to cover these waits.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change gives most process waits more time and replaces timing races with explicit gates. Recorded repeated runs pass, and deliberate breakages still fail. Two process-stop waits remain unlimited and could hang the tests; bound those before approval."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "5f532e0180878246958de914f591d1b91518c0d5",
    "session": "continued",
    "thread_id": "01a1886e-6a15-7321-8db5-874d27afb9a6",
    "builder_response": "- Tests run: `speck test --files test/steady-0559.test.mjs test/run-0247.test.mjs test/run-switch-0301.test.mjs test/run-lock-0321.test.mjs test/seen-builds-0300.test.mjs` (149 tests with the repo checks, none failed).\n- F1: fixed. In `test/run-lock-0321.test.mjs`, `standIn` now gives `exited()`, a `waitFor` of the host having ended (exit code or signal) named \"the stand-in speck run to exit\", used by both final 0321 AC2 tests. The same unbounded wait was also in `0321 AC2: turning it off from the Settings view…` (`await run.exited`), now `waitFor(() => ended(run.child), 'speck run to exit', run.out)`. `0559 AC1` now also fails on any `await …exited` without a call in the steadied tests; it failed on the file before this fix and passes after. The Delivery log's 0321 line names these waits.\n",
    "seconds": 21,
    "usage": {
      "input_tokens": 319475,
      "cached_input_tokens": 252032,
      "cache_write_input_tokens": 0,
      "output_tokens": 1726,
      "reasoning_output_tokens": 157
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 8861,
      "cached": 122240,
      "write": 0,
      "output": 601
    },
    "cost_usd": 0.035956,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-29T16:13:27.917Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The four named test files use 30-second process waits through waitFor, BUSY_MS or startsWatching. In test/run-lock-0321.test.mjs, standIn.exited() and the Settings off-switch test now also use bounded waitFor checks. The Delivery log names the changed waits; both 0559 AC1 checks pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "test/support/run.mjs waitFor fails with the duration and awaited event. The passing 0559 AC2 test exercises an actual timeout and checks its explanatory failure message. The previously unbounded stand-in exit waits now use this helper."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The Delivery log records deliberate ship-wait, lock-loss and build-adoption breakages causing tests in each of the four files to fail. Those behavioural assertions remain intact."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The Delivery log and previously inspected AC4 run logs record five consecutive passing runs alone and alongside the suite for each file, including the repeated 0300 checks after its session-isolation fix."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The latest /tmp/speck-0559-tests.txt records 149 passes, three skips and no failures across 152 tests. The earlier related-helper run also had no failures. The round-two changes preserve the behavioural assertions."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/run-lock-0321.test.mjs",
        "issue": "The final two 0321 AC2 tests previously awaited process exit without a time limit.",
        "suggested_fix": "Use bounded waitFor checks naming the process being awaited, and extend the ticket's checks to detect unbounded exit waits.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The tests now allow more time on busy machines and use explicit gates to avoid timing races. The remaining unlimited exit waits are fixed, timeout failures explain what was awaited, and the latest checks pass. No blocking concerns remain."
  }
}
```

</details>
