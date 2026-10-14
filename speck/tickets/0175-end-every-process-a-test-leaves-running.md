---
id: "0175"
title: "End every process a test leaves running"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-13-stop-the-pause-and-stop-tests-leaving-processes-running.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T19:37:04.183Z"

---
# 0175 · End every process a test leaves running

**Status:** 🔍 reviewing

## Problem
Every full test run leaves processes running for good. The test setup deletes each test file's temporary folder afterwards, but never ends what the tests started, and some test helpers wait for ever for a file in that folder. On 2026-10-14, 474 leftovers held about 13 GB of the machine's 15 GB of memory (7.5 GB of processes, and 5.8 GB of deleted logs they kept writing to in `/tmp`, which is held in memory here). The load average reached about 118, the panel stopped answering, the full suite went from 64 to 262 seconds, and builds took twice as long.

## Outcome
When a test file finishes, nothing it started is still running, however its tests ended.

## Acceptance criteria
1. Within 10 seconds of a test file finishing, whether its tests passed, failed or timed out, no process it started, directly or indirectly, is still running. That includes processes in a session or process group of their own.
2. If a test file's own process is stopped with SIGINT, SIGTERM or SIGHUP, the same holds within 10 seconds.
3. A test helper that loops waiting for a file in the test's temporary folder ends by itself within 10 seconds of that folder being removed, so one left behind by a test file killed with SIGKILL doesn't run for ever. This covers the ticker build and its helper in `test/support/ticker.mjs` and the gated test command in `test/ship-0153.test.mjs`.
4. Five full `npm test` runs in a row, each with a second full run going alongside it, leave no process from either run still running 10 seconds after they finish.
5. No test that passed before this change fails.

## Out of scope
- speck itself leaving a killed ship's tests running (0174).
- Processes left by earlier test runs. They were ended by hand on 2026-10-14.
- Making tests faster.

## Notes
- `test/support/tmp.mjs` gives each test file its own folder and sets `TMPDIR`, `TMP` and `TEMP` to it, and every process a test starts inherits them. `processesWithEnv()` in `scripts/run.mjs` already finds processes by an environment entry, on Linux and macOS.
- Run one file at a time, only `test/ship-0153.test.mjs` leaves processes (two wait loops each run). The ticker leaks (pause, stop and waiting tests) show up only when the full suite runs under load, so they depend on timing: fix them by cleaning up, not by chasing each race.
- Moved here from 0174, which had this as its AC3.
- Supersedes the inbox note from 0152 (about 17 leftover tickers on 2026-10-13).
- Failing before this build: 0165 AC1: at 375 px, every tag in Plan, the Build queue and the full ticket pane has the same visible size and even gaps, with a 44 by 44 px tap area each
- AC4 isn't an automated test: it takes ten full runs. Checked by hand on 2026-10-14 with a script that ran five rounds of two full `npm test` runs side by side, then, 10 seconds after each round, listed every process whose TMPDIR is a test run's folder (none in any round) and every process of the user's that wasn't there before the round (only the checking session's own shell and `sleep`). In round 4, under the double load, 0128 AC3 and 0148 AC2 each failed once on a 2-second "speck run has stopped" timing check; both passed in the other nine runs and in the plain full run.
- Self-check: no changes

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
    "reviewed_sha": "7028b2a911ef919cee47729408169699c4268276",
    "thread_id": "01a13c05-29b1-7b82-b257-53f8e443340d",
    "seconds": 57,
    "usage": {
      "input_tokens": 182696,
      "cached_input_tokens": 138368,
      "cache_write_input_tokens": 0,
      "output_tokens": 1432,
      "reasoning_output_tokens": 248
    },
    "saved_at": "2026-10-14T20:06:30.557Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "test/support/reap.mjs:reap misses direct children started with an empty environment and orphaned descendants without markers. The timeout test also exercises cancellation rather than timeout."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The three signal tests pass for their fixtures, but the signal exit handler calls the same reap function, which misses unmarked direct children and orphaned descendants."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "ticker.mjs and gate.mjs check whether the folder still exists. The passing AC3 tests exercise folder removal for the ticker, standalone helper, gated command and push hook."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "/tmp/speck-0175-ac4.sh and its output document five paired full runs, with zero test-marker processes remaining after each 10-second wait."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The fresh full-suite output reports only the explicitly exempted 0165 AC1 failure. Two timing checks failed intermittently during paired load runs but passed in the plain full run."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/support/reap.mjs:43",
        "issue": "Cleanup does not cover every descendant. A direct child spawned with env: {} has no marker, and its parent (the test process) is excluded from the discovery seeds, so it is never found. An unmarked detached grandchild is likewise invisible once its marked parent exits. The existing fixture keeps that parent alive, hiding this gap.",
        "suggested_fix": "Include the test process's descendants in discovery without signalling the test process itself, and preserve ownership information for descendants whose parents exit. Add regression cases for an unmarked direct child and an unmarked detached grandchild whose parent exits before cleanup, including signal termination.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/reap-0175.test.mjs:45",
        "issue": "The timeout fixture unreferences its only remaining timer. Node cancels the test because its event loop has finished, before the 300 ms timeout occurs. I reproduced this with a read-only inline test: failureType was cancelledByParent after about 4 ms. Checking only exit status 1 accepts this wrong failure mode.",
        "suggested_fix": "Keep the event loop alive until the test timeout fires, clear the timer afterwards, and assert that the nested test output reports testTimeoutFailure before checking process cleanup.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The helper loops now stop when their folders disappear, and the repeated full runs left no observed processes behind. Two fixes remain: cleanup misses processes without inherited environment markers in some cases, and the timeout test does not actually reach a timeout."
  }
}
```

</details>
