---
id: "0152"
title: "End a test run that stalls"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-13
started: "2026-10-13T21:54:47.263Z"

---
# 0152 · End a test run that stalls

**Status:** 🔍 reviewing

## Problem
When a test hangs, speck waits for it forever. On 2026-10-13 the test run in 0149's auto-ship stopped making progress after 714 of about 1,310 tests and sat silent for nine minutes, until the build tool's 10-minute limit killed the ship. Nothing told the user; the ticket just looked approved. The next run of the same suite passed in about a minute.

## Outcome
A test run that stops making progress is ended after a set time, and speck reports it as a failed run that says the tests stalled, so a ship or build never hangs on a stuck test.

## Acceptance criteria
1. When the test command run by `speck test`, by a build or by `speck ship` writes no output for `test_stall_minutes` (in `speck/config.yml`, default 5), speck ends it and every process it started, and treats the run as failed.
2. The failure says in plain words that the tests stalled, for how long, and the last line of output before they did, and is recorded as a failed result, never reused as a pass.
3. `speck ship` stopped this way merges nothing, leaves the ticket approved and says to ship again, as it does for any test failure.
4. `test_stall_minutes` must be a whole number of 1 or more; any other value is refused with a message saying how to fix it. A test run that keeps writing output is never ended, however long it takes.
5. No test that passed before this change fails.

## Out of scope
- Finding or fixing the test that hung on 2026-10-13.
- A total time limit on a test run.

## Notes
- Tests run through `runTestsInTurn` in `scripts/turns.mjs`, used by `speck test`, builds and `runTests` in `scripts/ship.mjs`.
- Evidence: `speck/.cache/results/run.85b8dba7-….out` stops at test 714 at 20:42:05; the build log shows `speck ship 0149 --auto` killed at 20:51:20 with exit 143.
- No output for minutes is a better sign of a hang than total time: a slow suite still writes a line per test.
- Failing before this build: none
- Self-check: the stall watcher drops its output instead of crashing if whoever reads it stops reading, so the tests are never left running unwatched.
- Seen while building: the full suite sometimes hangs in `test/panel-0149.test.mjs` (a headless Chrome call with no time limit), through `speck test` and when run directly with its output piped alike. With this change, `speck test` ended those runs after 5 minutes, with every process they started, and said they stalled.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "85188113f060321a7c29657742b3b3079cce01a7",
    "thread_id": "01a1376e-a58c-7060-8ac3-9c8cd5c50c98",
    "seconds": 38,
    "usage": {
      "input_tokens": 112713,
      "cached_input_tokens": 67584,
      "cache_write_input_tokens": 0,
      "output_tokens": 1211,
      "reasoning_output_tokens": 235
    },
    "saved_at": "2026-10-13T22:43:18.575Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/turns.mjs runTestsInTurn watches full runs, and the passing AC1 tests exercise those runs. However, cmdTest runs commands.test_files directly through sh, without the watcher. These speck test --files runs, also used during builds, can still hang indefinitely."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/stall.mjs reports the silence duration and last output line; scripts/results.mjs testRun records stalled runs with status 1. Both AC2 tests passed in /tmp/speck-0152-tests.txt and exercise reporting and cached failure reuse."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/ship.mjs runTests throws on r.stalled before shipping or checking base tests. The passing AC3 integration test checks unchanged repository state, approved ticket status and instructions to ship again."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "testStallMs validates configuration and the passing AC4 tests cover fresh runs and continuing output. However, scripts/results.mjs testRun returns cached results before calling this validation, so an invalid setting can be accepted by speck test or speck ship."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The full /tmp/speck-0152-tests.txt log reports 1341 tests, 1338 passed, 3 skipped and zero failures or cancellations. No pre-existing failures were listed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/turns.mjs",
        "issue": "cmdTest's --files path bypasses stall.mjs entirely. A hanging commands.test_files command still blocks speck test and the build's targeted testing indefinitely. The ticket excludes total time limits, but does not exclude targeted runs from stall protection.",
        "suggested_fix": "Apply the stall watcher to targeted test commands while preserving their existing lack of a turn and cached result. Add an integration test that hangs through speck test --files and checks failure reporting and descendant cleanup.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/results.mjs",
        "issue": "testRun validates test_stall_minutes only when runTestsInTurn is reached. After recording a pass, changing speck/config.yml to test_stall_minutes: 0 leaves the cache key unchanged and permits speck test, or ship's passing-result reuse, to succeed without refusing the invalid configuration. The current validation test always uses --fresh, masking this path.",
        "suggested_fix": "Validate test_stall_minutes before any cached-result return. Add a regression test that records a pass, sets an invalid value in config, then invokes testing without --fresh and checks the corrective error.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Full test runs now stop when silent, explain the stall and prevent shipping. The recorded suite passes. Two gaps need fixing: targeted tests can still hang, and cached results bypass validation of the stall setting."
  }
}
```

</details>
