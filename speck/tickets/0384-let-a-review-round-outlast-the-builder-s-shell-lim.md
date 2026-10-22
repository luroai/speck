---
id: "0384"
title: "Let a review round outlast the builder's shell limit"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-let-a-review-round-outlast-the-builder-s-shell-limit.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0383"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T20:13:36.538Z"

---
# 0384 · Let a review round outlast the builder's shell limit

**Status:** 🔍 reviewing

## Problem
speck lets a reviewer run for `review_timeout_minutes` (30 by default). But a builder waits for `speck review` in one foreground shell command, and Claude Code ends such a command after 10 minutes. `speck run`'s Claude Code builds can't run commands in the background (0245). On 0368, a Grok review was still running at 10 minutes, so the builder's shell ended the round. The builder then improvised a detached run and a polling loop.

## Outcome
A review round that runs longer than 10 minutes still finishes and is recorded. The builder waits for it through speck commands that each return within that limit.

## Acceptance criteria
1. A round's reviewer may be Codex, Claude, Cursor or a command under `reviewer_options`. If it's still running 9 minutes after `speck review` started, `speck review` exits with code 12. It prints that round <n> is still running and the exact command to wait for it. The reviewer carries on, and is still ended `review_timeout_minutes` after it started, as today.
2. The printed command waits up to 9 minutes for that same round. If the reviewer finishes, or had already finished before the command ran, the command records the round, prints and exits exactly as `speck review` would have: 0, 10 or 11, or a failure message with nothing recorded. If the reviewer is still running, it exits 12 again with the same command. No round ever gets a second reviewer: while one is running, `speck review <id>` waits for it rather than starting another.
3. A reviewer that finishes within 9 minutes gives the same output, exit code and recorded round as today. The panel shows the round as running for as long as its reviewer runs, through every exit 12.
4. The review skill and the build skill tell the builder that exit 12 means the round is still running. The builder should run the printed command in the foreground, again each time, until it exits with any other code.
5. No test that passed before this change fails.

## Out of scope
- The `claude-subagent` reviewer, which runs through the Agent tool, not the shell.
- Changing `review_timeout_minutes` or its default.
- Making the 9 minutes a setting.
- 0383, which reads a verdict that comes after prose.

## Notes
- Checked 2026-10-22: Claude Code's Bash tool allows at most 600000 ms (10 minutes) for one foreground command (its tool description). `speck run` sets `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` for its Claude Code builds (0245). 9 minutes leaves a minute to spare.
- Checked 2026-10-22: no exit code 12 is in use. `speck review` exits 0, 10 or 11 (`scripts/review.mjs`).
- Tests may shorten the 9 minutes the way `SPECK_REVIEW_TIMEOUT_MS` shortens the review time limit (`scripts/reviewers.mjs`).
- Related: 0180 (the reviewer's time limit, `scripts/limit.mjs`), 0223 (the running round's record, `<id>.review.json`, in `scripts/review-running.mjs`) and 0227 (foreground test runs and review rounds).
- Waits for 0383: both change `scripts/reviewers.mjs`.
- A priority 0 fix: a slow reviewer stalls every build it reviews.
- Failing before this build: none
- Self-check: a waiting command no longer trusts a round's record forever: one whose process is gone, or that started longer ago than its reviewer could run (so its pid may be another process's now), is reported as stopped and cleared. Also passed `--tests=` and `--response=` through to the round's process as given.

## In plain words
A slow reviewer no longer gets cut off when a review takes more than about ten minutes. speck now waits up to nine minutes for the reviewer; if it's still working then, speck says so and gives the builder a command to keep waiting for the same round, which it can run as many times as needed. The reviewer keeps going in the meantime, still stopped after the usual review time limit, and the panel shows the round as running throughout. Short reviews look and behave exactly as before. To see it, watch a ticket with a slow reviewer: its build log shows "still running" messages and the round is recorded once the reviewer finishes. Keep an eye on one thing: pressing Ctrl-C during a review, or stopping a build mid-review, no longer stops the reviewer straight away; it runs on until it finishes or hits the time limit.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Ctrl-C on `speck review`, or stopping the build, no longer ends a running round's reviewer, as the round runs detached: saved to the inbox as speck/ideas/2026-10-22-end-a-review-round-s-reviewer-when-its-build-is-stopped.md.
- Known limit: each review start leaves a small record file in the ticket's `speck/.cache/<id>/` (kept so no start number is ever claimed twice). Only their output files are removed. The cache is git-ignored and per ticket.
- Known limit: the round's own process calls `noteThisBuild` like any `speck review`, so outside `speck run` it looks up the build's process once more; harmless.

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
    "reviewed_sha": "b02eb5ef33b8a1b3dc04d790b389d8cd2f656662",
    "thread_id": "01a16547-0321-7da2-a780-1ebad34e32b2",
    "seconds": 26,
    "usage": {
      "input_tokens": 145740,
      "cached_input_tokens": 101888,
      "cache_write_input_tokens": 0,
      "output_tokens": 1094,
      "reasoning_output_tokens": 166
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T20:22:20.951Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "review-wait.mjs implements the nine-minute wait and exit 12. Passing AC1 tests exercise command and Codex reviewers, continued execution and timeout. Claude and Cursor use the same command-reviewer path."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "Passing AC2 tests cover sequential waits, completed rounds and failures, but startRound() in scripts/review-wait.mjs:45–57 permits overlapping commands to start duplicate reviewers (F1)."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 tests verify unchanged short-review output and round recording, and roundRunning() remaining visible through repeated exits 12."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Both skills explicitly instruct builders to run the printed --wait command in the foreground repeatedly until the exit code differs from 12. The passing AC4 test checks the exit code and command as document facts."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Supplied test results report 174 passes, zero failures and three skips across the selected files and required checks. No existing tests were weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/review-wait.mjs:45",
        "issue": "Startup is not mutually exclusive. Two commands can both read no running record at line 47. After the first creates its exclusive record and launches its worker, the second can execute clear(f), deleting that record and the output files, then successfully create its own record and launch another worker. The exclusive write therefore does not guarantee one reviewer per round. Both workers can write the same round and completion files.",
        "suggested_fix": "Protect startup and stale-record cleanup with an atomic ownership mechanism that competing starters cannot delete. Publish record updates atomically, and add a deterministic concurrent-start regression test proving that only one reviewer launches and its result remains deliverable.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Long reviews can continue across repeated foreground waits, and the supplied tests pass. One concurrency bug needs fixing: overlapping review commands can launch two reviewers for the same round and overwrite their shared results."
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
    "reviewed_sha": "7bdeeee8c1c27b56ba0f285f9ce7bc48ee31ed7f",
    "thread_id": "01a16547-0321-7da2-a780-1ebad34e32b2",
    "seconds": 26,
    "usage": {
      "input_tokens": 251689,
      "cached_input_tokens": 195968,
      "cache_write_input_tokens": 0,
      "output_tokens": 2212,
      "reasoning_output_tokens": 433
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T20:25:48.252Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "reviewWaitMs(), waitForRound() and the detached worker implement exit 12 after nine minutes while retaining the reviewer timeout. Both AC1 tests passed."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The sequential wait and concurrent-start tests passed, but deleting earlier start files permits a delayed starter to reclaim an old number (F1). Marking output read before consuming it also allows another starter to delete it (F2)."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Both AC3 tests passed: short reviews retain their output, exit code and recorded round; roundRunning() remains visible through repeated exits 12."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Both skills instruct builders to repeat the printed --wait command in the foreground until its exit code differs from 12. The AC4 document-fact test passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied selected-file run reports 176 passes, zero failures and three skips. Existing tests were not weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/review-wait.mjs: startRound",
        "issue": "The original race is narrowed but not fully resolved because earlier claim files are deleted. Command A can read last=0 and pause before claiming 1. Other commands can complete start 1 and launch start 2, deleting start 1's files. A can then successfully claim 1 and launch another reviewer while start 2 is running. Its completion is also hidden because current() selects the highest number. The new tests do not exercise a delayed claim after cleanup.",
        "suggested_fix": "Keep claim identities permanently reserved, or use an ownership mechanism that prevents stale starters from reclaiming deleted numbers. Add a deterministic regression test that pauses a starter between reading the current number and claiming it, advances subsequent starts through cleanup, then resumes it.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/review-wait.mjs: waitForRound and deliver",
        "issue": "A waiter publishes the .read marker before deliver() reads stdout and stderr. Another plain review command can observe that marker, start the next round and delete the previous start's output files during cleanup. The first waiter then silently prints empty output while returning the previous round's exit code. This violates the requirement to deliver the completed round's output.",
        "suggested_fix": "Read the completed output into memory before publishing the marker that allows another start to clean it up, then let only the winning claimant print that captured output. Add a regression test interleaving delivery with the next start's cleanup.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The usual long-review workflow works and all supplied tests pass. The concurrency fix still leaves two races: a delayed command can launch an extra reviewer, and starting the next round can erase the previous round’s output before it is printed."
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
    "reviewed_sha": "9919ca6aba0a331f2c9e465eb5c86fa7e59a8d9c",
    "thread_id": "01a16547-0321-7da2-a780-1ebad34e32b2",
    "seconds": 16,
    "usage": {
      "input_tokens": 373442,
      "cached_input_tokens": 310016,
      "cache_write_input_tokens": 0,
      "output_tokens": 2945,
      "reasoning_output_tokens": 433
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T20:27:35.243Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "reviewWaitMs() defaults to nine minutes; waitForRound() prints the round and exact --wait command with exit 12. The detached worker retains the existing reviewer timeout. Both AC1 tests passed; Claude and Cursor share the command-reviewer path."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing AC2 tests cover repeated waits, completion before waiting, failure without recording, concurrent commands and delayed claims. Permanent start records prevent duplicate claims. waitForRound() captures output before marking it read, resolving the cleanup race."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Both AC3 tests passed, checking unchanged short-review output, exit code and recorded round, and panel running status through repeated exits 12."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Both skills explicitly require repeating the printed --wait command in the foreground until it exits with another code. The AC4 test checks the documented exit code and command."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied selected-file run reports 178 passes, zero failures and three skips. No existing tests were weakened or unrelated fixes introduced."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/review-wait.mjs: startRound",
        "issue": "Earlier start numbers could previously be reclaimed after their records were deleted.",
        "suggested_fix": "Implemented: start records remain permanently reserved; cleanup removes only output files. The passing delayed-claim regression test verifies old claims fail while a later round runs.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/review-wait.mjs: waitForRound and deliver",
        "issue": "Starting another round could previously delete completed output before its waiter read it.",
        "suggested_fix": "Implemented: output is captured before publishing the read marker, and only the winning claimant prints its captured output. The output-delivery and cleanup test passed.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Long reviews now continue across repeated foreground waits while retaining their timeout and panel status. Both concurrency findings are fixed, and all supplied tests pass. The change is ready for the owner’s merge decision."
  }
}
```

</details>
