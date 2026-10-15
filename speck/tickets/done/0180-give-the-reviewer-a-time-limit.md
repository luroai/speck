---
id: "0180"
title: "Give the reviewer a time limit"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-15T11:11:39.043Z"
approved: "2026-10-15T11:34:32.380Z"
finished: "2026-10-15T11:39:11.728Z"

---
# 0180 · Give the reviewer a time limit

**Status:** ✅ done

## Problem
speck runs the Codex reviewer, and any reviewer set up as a command, with no time limit. If one hangs, the review waits for ever, and so does its build, which keeps holding one of `max_parallel_builds`.

## Outcome
A reviewer that runs too long is ended, and the review round fails with a message that says so.

## Acceptance criteria
1. A reviewer run by speck (Codex, or a reviewer command under `reviewer_options`) that hasn't finished after `review_timeout_minutes` (in `speck/config.yml`, default 30) is ended, with every process it started. The round fails with a message saying the reviewer took longer than that many minutes and nothing was recorded.
2. Nothing from the ended attempt is recorded as a round, and the round can be run again as normal.
3. `review_timeout_minutes` must be a whole number of 1 or more. Any other value is refused with a message saying how to fix it.
4. A reviewer that finishes within the limit works exactly as before.
5. No test that passed before this change fails.

## Out of scope
- The claude-subagent reviewer, which runs inside the builder's own session rather than as a process speck starts.
- A time limit on whole builds (`speck/ideas/2026-10-13-look-into-a-build-that-runs-long.md`).

## Notes
- `scripts/review.mjs` runs `codex` through `sh()` (spawnSync, no timeout), and `runReviewer()` in `scripts/reviewers.mjs` likewise.
- Follows `test_stall_minutes` (0152) for the setting's checks and wording.
- Codex rounds took 29 to 44 seconds on 2026-10-14 (0164), so 30 minutes is generous.
- Failing before this build: none
- Self-check: no changes to the code; the bad-value test now reuses one repo per reviewer, to keep it quick.

## In plain words
A review no longer waits for ever if the reviewer gets stuck. If Codex, or another reviewer speck runs for you, is still going after 30 minutes, speck stops it, along with anything it started, and says the reviewer took too long and nothing was recorded. The ticket stays as it was, so you can simply run the review again. You can change the 30 minutes with the `review_timeout_minutes` setting; it must be a whole number of minutes, and a wrong value is refused with a note on how to fix it. To see it, set the limit to 1 minute and point a reviewer at something that hangs. Worth knowing: the Claude reviewer that runs inside a build's own session has no such limit.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Killing only -child.pid does not end every process the reviewer started.; F2 Valid large settings cause immediate timeouts.
Round 2 (codex): changes requested.
Round 3 (codex): approve.

## Delivery log
- Review rounds: 3
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 858,411
- Elapsed since build started: 23 min
- Changed lines: 142 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up (inbox): `speck/ideas/2026-10-15-end-a-stalled-test-run-s-detached-processes-too.md`: test stall handling (0152) still ends only the process group, missing detached or orphaned processes.
- Known limit: a process that clears its own environment and leaves both the reviewer's process group and its ancestry isn't found when the limit ends the reviewer.

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
    "reviewed_sha": "073ba130205d17c941c720de87f8055701b5bfd7",
    "thread_id": "01a13f4d-3d0a-7a10-afc5-732a9055c923",
    "seconds": 47,
    "usage": {
      "input_tokens": 183942,
      "cached_input_tokens": 141824,
      "cache_write_input_tokens": 0,
      "output_tokens": 1431,
      "reasoning_output_tokens": 172
    },
    "saved_at": "2026-10-15T11:23:55.356Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/limit.mjs kills a process group, which excludes descendants that start their own groups. Also, accepted limits of 35792 minutes or more overflow Node's timer and expire immediately."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "reviewRound restores the ticket on failure; runCodexReview removes timed-out verdict files. Both AC2 tests verify no saved round and a successful retry."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "reviewTimeoutMs and config.mjs validate positive whole numbers. AC3 tests cover rejection, corrective wording and preventing reviewer execution."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "AC4 tests cover successful Codex and command reviews, non-zero command exits and missing commands."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "/tmp/speck-0180-tests.txt confirms 1780 tests, 1777 passed, three skipped and zero failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/limit.mjs",
        "issue": "Killing only -child.pid does not end every process the reviewer started. A descendant using detached:true or setsid starts another process group and survives the timeout. The new tests cover only a sleep process that inherits the reviewer's group.",
        "suggested_fix": "Ensure timeout cleanup includes descendants in separate process groups, and test a reviewer that starts such a descendant.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/limit.mjs",
        "issue": "Valid large settings cause immediate timeouts. reviewTimeoutMs accepts 35792 minutes, but setTimeout receives 2147520000 milliseconds, exceeding Node's timer range. A direct check confirmed Node reduces this delay to 1 millisecond.",
        "suggested_fix": "Schedule long deadlines in bounded intervals and add a test covering a valid setting above Node's single-timer range.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The normal timeout and retry paths are covered, and the suite passes. Two gaps remain: detached subprocesses can survive cleanup, and very large valid limits end reviews immediately. Subprocess reproduction was blocked by the read-only environment; the timer overflow was reproduced directly."
  }
}
```

</details>

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "5e7e7d44ce9edf022bdddbf70e41fa61d97ddd64",
    "thread_id": "01a13f4d-3d0a-7a10-afc5-732a9055c923",
    "seconds": 31,
    "usage": {
      "input_tokens": 279204,
      "cached_input_tokens": 228864,
      "cache_write_input_tokens": 0,
      "output_tokens": 2257,
      "reasoning_output_tokens": 242
    },
    "saved_at": "2026-10-15T11:29:00.072Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/limit.mjs now kills descendants in separate groups, covered by the new detached-process test. However, descendants() takes its first ancestry snapshot only at timeout, so detached descendants whose intermediate parent has already exited escape cleanup."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "reviewRound restores the ticket on failure and runCodexReview removes timed-out verdict files. Both AC2 tests verify no recorded round and a successful retry."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "reviewTimeoutMs and config.mjs enforce positive whole numbers. AC3 tests verify invalid values, corrective wording and that no reviewer runs."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "AC4 tests cover successful reviews, command failures and missing commands. The new long-limit test verifies that a quick command finishes normally above Node's single-timer range."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "/tmp/speck-0180-tests.txt reports 1782 tests: 1779 passed, three skipped and zero failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/limit.mjs",
        "issue": "Cleanup remains incomplete for detached descendants that become orphaned before timeout. For example, a hanging reviewer starts a helper which starts a detached background process and exits. At timeout, that background process has been reparented, so descendants(child.pid) cannot find it and the reviewer's process-group signal cannot reach it. Matching the existing test-stall implementation does not satisfy this ticket's explicit requirement.",
        "suggested_fix": "Track or contain subprocesses throughout the attempt so cleanup retains responsibility after intermediate parents exit. Add a regression test where a helper starts a detached process and exits while the reviewer continues hanging.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/limit.mjs",
        "issue": "The timer overflow is fixed: wait() caps each timer and recalculates the remaining deadline. The new regression test exercises the previously failing large-limit case.",
        "suggested_fix": "",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The large-timeout bug is fixed, and all tests pass. Cleanup now reaches detached children whose ancestry remains intact, but background processes can still survive if their intermediate parent exits before timeout. The promise to end every process started by the reviewer remains incomplete."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "6014f86c408201990c72fd4d874f1db55929c92b",
    "thread_id": "01a13f4d-3d0a-7a10-afc5-732a9055c923",
    "seconds": 20,
    "usage": {
      "input_tokens": 388694,
      "cached_input_tokens": 331520,
      "cache_write_input_tokens": 0,
      "output_tokens": 2883,
      "reasoning_output_tokens": 242
    },
    "saved_at": "2026-10-15T11:34:10.954Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/limit.mjs ends the reviewer group, traceable descendants and processes carrying the unique run marker. AC1 tests cover Codex and command timeouts, detached children, orphaned descendants, the default limit and timeout wording."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "reviewRound restores the ticket after failure; runCodexReview removes timed-out output. Both AC2 tests verify no recorded round and a successful retry."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "reviewTimeoutMs and config.mjs validate positive whole numbers. AC3 tests cover refusal, corrective instructions and preventing reviewer execution."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "AC4 tests cover successful reviews, existing command-error behaviour and normal completion with a limit above Node's single-timer range."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "/tmp/speck-0180-tests.txt confirms 1783 tests: 1780 passed, three skipped and zero failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/limit.mjs",
        "issue": "The run marker now lets cleanup identify orphaned processes after their ancestry is lost. The new regression test exercises a helper that starts a detached process and exits before timeout.",
        "suggested_fix": "",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/limit.mjs",
        "issue": "Long deadlines use bounded timer intervals, avoiding immediate expiry from timer overflow. The large-limit regression test remains passing.",
        "suggested_fix": "",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Reviewers now have a configurable time limit, with cleanup covering detached and orphaned subprocesses. Timed-out attempts record no round and can be retried. Both previous findings are resolved, and the full suite reports no failures."
  }
}
```

</details>
