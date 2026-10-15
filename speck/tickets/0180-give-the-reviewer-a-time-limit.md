---
id: "0180"
title: "Give the reviewer a time limit"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0180 · Give the reviewer a time limit

**Status:** 🔍 reviewing

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
