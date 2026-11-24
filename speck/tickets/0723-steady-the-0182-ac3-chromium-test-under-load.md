---
id: "0723"
title: "Steady the 0182 AC3 Chromium test under load"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-12-fix-0182-ac3-failing-in-the-full-suite.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T11:55:06.030Z"

---
# 0723 · Steady the 0182 AC3 Chromium test under load

**Status:** 🔍 reviewing

## Problem
The 0182 AC3 test ("Chromium has closed within 10 s of a test file finishing that ran out of time") fails now and then in the full suite on a busy machine, then passes on retry. Each failure turns main red, so speck run raises fix tickets and builds can't trust the baseline.

## Outcome
The 0182 AC3 test passes on a busy machine and still catches Chromium left running.

## Acceptance criteria
1. The 0182 AC3 test passes 10 runs out of 10 while the machine is under the load speck's own steadying tests use (as in 0689).
2. It still fails when Chromium really is left running after a test file runs out of time.
3. No test that passed before this change fails.

## Out of scope
- Other timing tests.

## Notes
- The test is `test/panel-0182.test.mjs`. Seen failing in full-suite records from 2026-10-23 to 2026-11-11, and twice in `speck/.cache/flaky/flaky.log` (2026-11-12 and 2026-11-15); the latest full suite on main (2c2af9f) passed. The failure is "Chromium still running 10 s after the test file finished": the cleanup is late, not missing. 0689 replaced fixed bounds with ones measured in the test.
- Failing before this build: none
- Checked under load before changing anything (2026-11-24, 16 cores): the four 0182 AC3 tests passed 10 runs out of 10 with one busy loop per core beside them (load average up to 37), and 54 runs of the timed-out case alone, six to eight at a time and starved with `nice` under two busy loops per core (load up to 65), all had Chromium gone by the time the file finished. The failure didn't reproduce here, so the change takes out the two ways it can happen rather than one seen cause.
- Cause found: the test runner stops a file that runs out of time with SIGTERM and doesn't wait for it. browserPage's clean-up then ended Chromium from the process's exit handler, which can't wait, so a Chromium slow to die (as under heavy load or swapping) could outlive the file. And the 10 s check could fail on a single `ps` listing that began before the 10 s were up: under load one listing took up to 7 s here.
- A second way it failed, seen in this build's related run at a load average of 125: Chromium hadn't opened its page within the file's 1.5 s time limit, so the test failed on `0 !== 1` pids logged.
- What changed: a file stopped with a signal now ends its Chromium and waits for it to have exited, up to 5 s, before it exits (`test/support/panel.mjs`); the 10 s check fails only on a listing that began once the 10 s were up; and a run in which Chromium hadn't started within the time limit checks it left nothing running and runs again with twice the limit, from 1.5 s up to 12 s (`runOutOfTime`). The 0182 helpers moved to `test/support/chromium-file.mjs` so the 0723 tests share them.
- AC1 under load, after the change (2026-11-24): the four 0182 AC3 tests passed 10 runs out of 10 with two busy loops per core beside them, at load averages of 55 to 88; the 0723 tests passed 3 runs out of 3 at 94 to 97. After adding the longer time limits: 30 runs out of 30, three at a time beside two busy loops per core and other builds' tests, at load averages of 86 to 102.
- AC3: the related run (439 files, as the shared browser helper changed) ran at a load average of up to 125 with other builds' tests beside it, and 69 tests failed on time limits (panels not starting within 10 s, Chromium not answering within 15 s). Run again, those 26 files passed apart from 0067 AC3 ("not within 5000 ms"), and 0067 and 0476 then passed on their own. None of them reaches the changed code: files that import tmp.mjs exit through its signal handler first, as before.
- AC2 checked by breaking it: with browserPage's clean-up not ending Chromium, the 0182 AC3 --test-timeout test fails with "Chromium still running 10 s after the test file finished". The 0723 AC2 test checks the same with a file that drops the clean-up.
- Self-check: no changes (a second signal during the wait only skips the wait, as Chromium has already been sent SIGKILL; files that import tmp.mjs exit through its handler first, as before).
- Pictures: none, because nothing anyone sees changes.
- speck (2026-11-24 12:26 UTC) told you: The build is slow because of its own checks, not a fault: it ran the Chromium test ten times with busy loops on every core, as its first criterion asks, then ran about 2,800 related tests on a machine with a load average above 100. That related run hit the builder's 10-minute command limit, so it has started it again in the background and is waiting for it; the test output shows it still passing. Why: The log shows the 0182 test passing 10 of 10 under load and the work since then spent on the timed-out related run, the newest test output has no failures, and load averages of about 60 to 160 explain the slowness without anything broken on main.

## In plain words
One of speck's own tests, which checks that a test's browser is shut down when the test runs out of time, used to fail now and then when the machine was busy, turning main red and raising fix tickets for nothing. It now waits for the browser to be really gone before the test ends, gives a slow browser more time to start, and no longer trusts a slow check of what's running. It still fails when a browser really is left running. Nothing changes in speck itself: you'd notice it only as fewer red full-suite runs and fewer fix tickets about this test. Worth watching: a fix ticket already waiting (0733) lists this test among main's failures, so that ticket may find it passing.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up (inbox): `speck/ideas/2026-11-24-steady-the-0182-ac3-per-test-time-limit-test.md`: the sibling 0182 AC3 test with a per-test 1.5 s time limit also counts Chromium's start-up in it.
- Known limit: test files that import tmp.mjs still end everything they started synchronously on SIGTERM (its reaper), without waiting for it to have exited. Not seen causing a failure.
- Note: fix ticket 0733 lists this test among main's failures at 487ca18.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "7002340e3b2c26dadf242f839842b1b02701f4a5",
    "session": "fresh",
    "thread_id": "01a20d9d-c92c-7b13-82a0-5f6474c572dd",
    "builder_response": "- Tests run: `speck test --related test/chromium-0723.test.mjs test/panel-0182.test.mjs` (439 files, since test/support/panel.mjs changed; full output in /tmp/speck-0723/related-run1.txt). It ran at a load average of up to 125 beside other builds' test runs, and 69 tests failed on time limits (\"panel didn't start\", \"Chrome didn't answer Runtime.evaluate within 15 s\"), one of them the 0182 AC3 --test-timeout test with `0 !== 1` pids, which this build then fixed (runOutOfTime).\n- Then: `speck test --files` with the 26 files that failed plus this ticket's own (output /tmp/speck-0723/rerun2.txt): 460 passed, 1 failed (0067 AC3, \"not within 5000 ms: the last version\"). An earlier try of the same files was stopped by a SIGTERM from outside this build (/tmp/speck-0723/rerun1.txt).\n- The output attached: `speck test --files test/panel-0067.test.mjs test/panel-0476.test.mjs test/chromium-0723.test.mjs test/panel-0182.test.mjs`: 176 passed, 0 failed.\n- None of the failing files reaches the changed signal path: they import tmp.mjs first, whose SIGTERM/SIGINT/SIGHUP handler calls process.exit synchronously before browserPage's.\n- AC1 under load was checked by hand (see the ticket's Notes): 30 runs of the four 0182 AC3 tests, three at a time beside two busy loops per core, at load averages 86 to 102, all passed. AC2 was checked by hand by removing the SIGKILLs in browserPage's clean-up: the 0182 --test-timeout test failed with \"Chromium still running 10 s after the test file finished\".\n",
    "seconds": 32,
    "usage": {
      "input_tokens": 139227,
      "cached_input_tokens": 98816,
      "cache_write_input_tokens": 0,
      "output_tokens": 898,
      "reasoning_output_tokens": 219
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 40411,
      "cached": 98816,
      "write": 0,
      "output": 898
    },
    "cost_usd": 0.0996836,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T12:53:25.589Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/support/panel.mjs endRunning waits for Chromium after a signal; chromium-file.mjs handles slow process listings and retries when startup exceeds the file timeout. The five 0723 tests and four 0182 AC3 tests passed in /tmp/speck-0723-tests.txt. Ticket Notes record 30 successful runs under two busy loops per core."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing test '0723 AC2: the 0182 AC3 check still fails when Chromium is left running after a test file runs out of time' removes cleanup handlers, verifies real Chromium remains running, and verifies goneWithin10s rejects. A separate test checks the deadline boundary."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The related-run failures were rerun; rerun2.txt leaves only 0067 AC3 failing. The final recorded run includes 0067, 0476 and both ticket test files: 176 passed, zero failed, three skipped. The changed signal path is bypassed by tmp.mjs's earlier synchronous exit handler in ordinary test files."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The change makes Chromium cleanup wait for shutdown and prevents slow startup or process checks from causing false failures. Tests still catch a real Chromium leak. Recorded load checks passed, and the final regression checks found no failures."
  }
}
```

</details>
