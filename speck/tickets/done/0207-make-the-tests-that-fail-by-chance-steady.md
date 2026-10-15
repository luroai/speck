---
id: "0207"
title: "Make the tests that fail by chance steady"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
approved: "2026-10-15T15:51:47.478Z"
finished: "2026-10-15T15:56:20.820Z"

---
# 0207 · Make the tests that fail by chance steady

**Status:** ✅ done

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
Four checks in speck's own test suite that sometimes failed when the computer was busy now give the same answer every time, so builds and ships aren't held up or sent to a second run for no reason. One of them uncovered a small real problem in the panel: with the panel open in two tabs, clicking Auto-build on in both at nearly the same moment could give the second tab a refusal that started with a stray line from the first run ("speck run: watching for ready tickets…"). The panel now waits for that line before showing Auto-build as on, so the second tab shows only its own message, that speck run is already running. Keep an eye on the flaky-test log: these four names shouldn't appear in it any more.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The new check can miss the slowdown it must guard against.; F2 The required three consecutive file runs are not recorded for the changed speed-0198.test.mjs file.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 397,588
- Elapsed since build started: 45 min
- Changed lines: 8 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- 0128 AC4's cause (AC2): the panel showed speck run as on as soon as it held its lock, but speck run writes its first line ("speck run: watching for ready tickets…") to the shared run.log a moment later. On a busy machine that line landed after the second Turn on click had started reading the log, so the second speck run's refusal began with the first one's line, and the test's anchored match failed. Reproduced 3 times in 15 runs of that test with every core busy. Fixed in the panel: it shows speck run as on only once it holds the lock and has written its first line. 0 failures in 15 runs under the same load afterwards; 0207 AC2 pauses a copy of speck run between the two to check it every time.
- Three runs in a row of each changed file, on 2026-10-15 (AC4): ship-0153 15/15 passed each time; panel-0128 13/13; build-log-0176 4/4; panel-0177 8/8; flaky-0207 5/5. Under every core kept busy as well: flaky-0207 3 runs, panel-0177 and ship-0153 2 runs, all passing; 0176 AC1 measured 440 ms against 440 ms of CPU, where wall-clock time had missed by 13%.
- After review round 1's fixes, three more runs in a row (AC4): speed-0198 9/9 passed each time; panel-0177 8/8; flaky-0207 6/6. With every core kept busy, flaky-0207 and panel-0177 together passed 14/14 three times.
- Follow-ups:
  - A speck run that is already on can still write a line to run.log (for example a build launch) while a second Turn on click collects its refusal, so that line would show in the refusal. Inbox: speck/ideas/2026-10-15-keep-another-speck-run-s-lines-out-of-a-turn-on-refusal.md.
  - Tidy-up: the 0177 AC3 tests' names still say "within 1 second", 0177's own criterion, though they now compare with the same ask made with nothing reading. Renaming them would also mean changing 0191's test, which names one of them.
  - Known limit: 0176 AC1 measures CPU time from /proc on Linux only, and falls back to wall-clock time elsewhere.

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
    "reviewed_sha": "6c06631e00abfeb04e671ce84e310447eb94d160",
    "thread_id": "01a14038-f7af-71d0-8302-46541680e69e",
    "seconds": 32,
    "usage": {
      "input_tokens": 146594,
      "cached_input_tokens": 103680,
      "cache_write_input_tokens": 0,
      "output_tokens": 1420,
      "reasoning_output_tokens": 275
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T15:41:08.691Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "ship-0153.test.mjs now waits for the gate's reached file before taking r.snapshot(); 0153 AC2 passed in the supplied whole-suite output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panelRunOn in scripts/panel.mjs waits for both the child's lock and output. The passing 0207 AC2 test deliberately pauses the child between those events and checks the second refusal. The Delivery log records the cause and reproduction."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The timing checks use measured baselines, but panel-0177.test.mjs passes the entire state request duration to waitedForReading. Writes invalidate that request's first reading and cause a second, inflating the threshold enough to miss waiting through the first reading."
      },
      {
        "id": 4,
        "status": "unclear",
        "evidence": "The Delivery log records three consecutive passes for five files, but omits the changed test/speed-0198.test.mjs."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0207-tests.txt totals: 1940 tests, 1937 passed, zero failures, three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0177.test.mjs",
        "issue": "The new check can miss the slowdown it must guard against. In the first AC3 test, subsequent writes invalidate the initial board reading, so read.ms includes two approximately five-second readings. A page response that wrongly waits approximately 4.7 seconds for the first reading still passes against half that approximately ten-second duration. Directly evaluating the helper with base=10, ms=4710 and reading=10000 confirms it reports no waiting.",
        "suggested_fix": "Measure one actual reading independently of the state request's retries, synchronise requests with that reading, and demonstrate that an endpoint deliberately made to wait for it fails the revised check.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "speck/tickets/0207-make-the-tests-that-fail-by-chance-steady.md",
        "issue": "The required three consecutive file runs are not recorded for the changed speed-0198.test.mjs file.",
        "suggested_fix": "Run that file three consecutive times and record the results in the Delivery log.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The ship synchronisation and run-switch race fixes are supported by passing tests, and the full suite passes. However, the revised responsiveness checks can overlook a real delay, and one changed test file lacks the required repeat-run record."
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
    "reviewed_sha": "f3c8b1b0e8697ac9d40d16907c995126072784ac",
    "thread_id": "01a14038-f7af-71d0-8302-46541680e69e",
    "seconds": 15,
    "usage": {
      "input_tokens": 247396,
      "cached_input_tokens": 195072,
      "cache_write_input_tokens": 0,
      "output_tokens": 2178,
      "reasoning_output_tokens": 275
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T15:51:27.325Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "0153 AC2 in test/ship-0153.test.mjs waits for the gate's reached file before taking its snapshot. The test passes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panelRunOn waits for the child's lock and first output. The passing 0207 AC2 test deliberately delays that output and verifies the second refusal contains only its own message. The Delivery log records the cause and reproduction."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "0176 AC1 compares measured child CPU costs for both log sizes. Every 0177 AC3 comparison now uses its measured baseline and s.readingMs(), which measures one reading independently of request retries. The new passing integration test verifies that waiting for a real slowed reading is detected while an independent log response passes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The Delivery log records three consecutive passing runs for all changed test files, including speed-0198, and fresh repeats of panel-0177 and flaky-0207 after the review fixes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified the latest /tmp/speck-0207-tests.txt totals: 1941 tests, 1938 passed, zero failures, three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0177.test.mjs",
        "issue": "The comparison previously included multiple board readings, allowing a response blocked by the first reading to pass.",
        "suggested_fix": "Use one independently measured reading and verify detection against a real waiting response.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "speck/tickets/0207-make-the-tests-that-fail-by-chance-steady.md",
        "issue": "The repeat-run record previously omitted speed-0198.test.mjs.",
        "suggested_fix": "Record three consecutive passing runs for that file.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The race fixes and revised timing checks meet the ticket's requirements. The timing checks now detect waiting without counting repeated board readings twice. Both previous findings are resolved, the required repeat runs are recorded, and the full suite passes."
  }
}
```

</details>
