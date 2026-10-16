---
id: "0223"
title: "Say which review round is running"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-14-say-which-review-round-is-running.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0217"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T23:48:31.710Z"
approved: "2026-10-16T02:48:25.584Z"
blocked_at: ""
waited_seconds: 10065

---
# 0223 · Say which review round is running

**Status:** 👍 approved

## Problem
A ticket stays `reviewing` between review rounds, and its card says "<reviewer> is reviewing · round <n>" with the last recorded round. After round 1 asks for changes, the card still says "round 1" while the builder fixes the findings and while the reviewer runs round 2, so someone watching can't tell who is at work.

## Outcome
A ticket under review says whether the reviewer is running a round, and which one, or whether the builder is fixing the last round's findings.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. While the reviewer is running a review round, the ticket's card in the Build queue says "<reviewer> is reviewing · round <n>", where n is the round being run: 1 for the first, otherwise the last recorded round plus one.
2. While a ticket is reviewing but no review round is running, its card says "<builder> is fixing round <n>'s findings", where n is the last recorded round.
3. The card shows the same after a page reload or a panel restart, and a round that ends, fails or times out no longer counts as running.
4. The stage name ("Review <n>") still uses the last recorded round, as today, and no test that passed before this change fails.

## Out of scope
- Showing how long the current round has been running.

## Notes
- The card's words come from `progress()` and `doing()` in `templates/panel.html`. Nothing records today that a review round is running: speck needs to record when a round starts and ends (`reviewRound()` in `scripts/review.mjs`) and the board feed needs to pass it on (`scripts/board-feed.mjs`).
- Failing before this build: none
- Answered 2026-10-16 (blocked question): raise `max_review_rounds` to 4 for one re-review of the rename, then set it back to 3. Round 4 approved it.
- Self-check: a records folder that can't be written no longer stops a review round; the round runs without being recorded as running.
- A board that doesn't say whether a round is running (no `review_running` field, as in older fixtures) keeps the old wording, so the existing card tests still hold (AC4).

## In plain words
A ticket under review in the Build queue now says who is at work. While the reviewer is running a round, its card says "Codex is reviewing · round 2" (with the round actually being run), and between rounds it says "Claude is fixing round 1's findings". To see it, watch a ticket's card during a build that gets changes requested: it switches to the fixing wording as soon as the reviewer's round ends, and back to reviewing when the next round starts. It stays right after a page reload or a panel restart. Worth keeping an eye on: a review run by a Claude helper inside the builder's own session relies on the builder saying when it starts and gives up, so if such a session is closed by hand mid-round, the card can keep saying the reviewer is at work until the next round.

## Blocked question
When speck run tried to ship this, one older panel test failed. That test checks that the page never contains the word "Running", and a name I added to the page contained it. I've renamed it, with no change in behaviour, and the test passes now. But the change needs one more review before it can ship, and this ticket has used all 3 of its review rounds, so speck won't start another. Should I raise the review round limit to 4 just for this re-review and then put it back (my recommendation, since the fix is a three-line rename), or would you rather review the rename yourself, or send the ticket back to be rebuilt?

## Review log
Round 1 (codex): changes requested: F1 Claude subagent reviews are never marked as running.
Round 2 (codex): changes requested.
Round 3 (codex): approve.
Round 4 (codex, merge round): approve.

## Delivery log
- Review rounds: 4, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,288,237
- Elapsed since build started: 180 min
- Changed lines: 107 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - The builder badge still shows the review pose while the builder fixes findings: speck/ideas/2026-10-15-show-the-builder-at-work-while-it-fixes-findings.md
- Known limits:
  - A subagent round in a session not started by `speck run` counts as running until `speck record` or `speck review-running <id> --ended`; a session closed by hand mid-round leaves it showing until the ticket leaves building or reviewing, or the next round is recorded.
  - Like `build_running`, a record whose process has gone counts again if the system reuses its pid for another process.

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
    "reviewed_sha": "ffb71fccbb638e5fd4f88dd6cd71196cb7327b14",
    "thread_id": "01a141fb-bcb2-7592-9106-6de0a79104b9",
    "seconds": 24,
    "usage": {
      "input_tokens": 139350,
      "cached_input_tokens": 95360,
      "cache_write_input_tokens": 0,
      "output_tokens": 781,
      "reasoning_output_tokens": 15
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T23:53:22.950Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "The passing 0223 AC1 tests cover command reviews and card rendering. However, scripts/review.mjs only calls reviewRound() for Codex and command reviewers; the supported claude-subagent workflow never records a running round."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html doing() displays the builder and last recorded round when review_running is null. The passing 0223 AC2 test exercises this wording and builder fallback."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The passing 0223 AC3 tests cover persisted records, fresh processes, failures, timeouts and dead processes for command reviews. Claude subagent reviews have no running record to restore after reload or restart."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "progress() remains unchanged; the passing 0223 AC4 test confirms Review 1 remains the stage during round 2. All 78 tests reported in the supplied run passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/review.mjs",
        "issue": "Claude subagent reviews are never marked as running. After round 1 requests changes, the card says the builder is fixing findings throughout the next subagent review. This is a supported reviewer and reproduces the confusion the ticket promises to fix. The acceptance criteria do not exclude it.",
        "suggested_fix": "Record the running lifecycle for the supported subagent workflow, including completion and abandoned reviews, and add tests covering its card wording and persistence. Referencing reviewRound() in the ticket notes does not limit the acceptance criteria to that function's existing callers.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change correctly distinguishes review work from builder fixes for Codex and command reviewers, with passing tests for persistence and cleanup. It still gives misleading information during supported Claude subagent reviews, so it needs another change before approval."
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
    "reviewed_sha": "f9d4f878c2ec1ff0cee74daac48800a37b4bd25d",
    "thread_id": "01a141fb-bcb2-7592-9106-6de0a79104b9",
    "seconds": 18,
    "usage": {
      "input_tokens": 243386,
      "cached_input_tokens": 188672,
      "cache_write_input_tokens": 0,
      "output_tokens": 1424,
      "reasoning_output_tokens": 15
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T23:55:29.010Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "cmdReviewStarted() records activity but leaves a first-round ticket building; doing() only displays reviewer activity for reviewing tickets. Also, roundRunning() hides an active subagent after review_timeout_minutes even though subagent reviews have no enforced timeout."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "doing() displays the builder fixing the last recorded round when review_running is null. The passing AC2 card test exercises this."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "Persistence and command-review cleanup have passing tests. However, a failed subagent leaves its marker running until expiry while the builder remains alive; the skill provides no failure cleanup command."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "progress() remains unchanged and the passing AC4 test preserves the last recorded stage number. The supplied run reports 291 passing tests, three skipped and no failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/review.mjs",
        "issue": "Subagent support remains incomplete. review-started leaves the first round's ticket building, so its card never enters the reviewer wording. Its expiry also mistakes a long-running reviewer for builder work, while a failed reviewer can remain shown as running until expiry. The new tests assert the status field but do not exercise the first-round card through this workflow.",
        "suggested_fix": "Have the subagent start lifecycle enter reviewing, and provide explicit completion/failure cleanup in the skill workflow. Track continued activity without treating elapsed time alone as proof that an unlimited subagent review ended. Add tests for the first-round card, a failed subagent with a surviving builder, and a still-active review beyond the configured command-review timeout.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The new command records subagent activity, but the first review still shows builder work. Failed reviews can remain shown as running, and long reviews can disappear while still active. The command-review path and existing stage labels remain covered by passing tests."
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
    "reviewed_sha": "cf4a40c2ad639ae60d54fbd617eb9d184725e985",
    "thread_id": "01a141fb-bcb2-7592-9106-6de0a79104b9",
    "seconds": 19,
    "usage": {
      "input_tokens": 370026,
      "cached_input_tokens": 304000,
      "cache_write_input_tokens": 0,
      "output_tokens": 1999,
      "reasoning_output_tokens": 15
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T23:57:24.929Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html reviewRunning() and doing() display the active round for building and reviewing tickets. Passing AC1 tests cover successive rounds and the first subagent round using statusData from the real command workflow."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "doing() displays the builder fixing the last recorded round when review_running is null. The passing AC2 test checks round numbers, builder names and fallback wording."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Disk records survive fresh reads; reviewRound() clears command-review records in finally. Subagent records end through record or review-running --ended, with failure cleanup required by the skill. Passing AC3 tests cover persistence, failures, timeouts, dead processes, explicit subagent cleanup and long-running subagents."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "progress() retains the last recorded stage number, verified by the passing AC4 test. The supplied test run reports 305 passed, three skipped and no failures; existing tests were not weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/review.mjs",
        "issue": "The previously incomplete subagent lifecycle is now covered: first-round cards show review activity, failed rounds have explicit cleanup, and active long reviews no longer expire.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The card now shows which review round is running and when the builder is fixing findings, including subagent reviews. Persistence and cleanup are covered by passing tests, and stage labels remain unchanged. The previous blocking issue is resolved."
  }
}
```

</details>

<details><summary>Round 4 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 4,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "b27fd7806a715265c925d3e360fe4beeeb645a3f",
    "merge": true,
    "thread_id": "01a141fb-bcb2-7592-9106-6de0a79104b9",
    "seconds": 24,
    "usage": {
      "input_tokens": 528726,
      "cached_input_tokens": 382592,
      "cache_write_input_tokens": 0,
      "output_tokens": 2545,
      "reasoning_output_tokens": 15
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T02:48:15.483Z"
  },
  "verdict": {
    "round": 4,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html roundUnderReview() and doing() show the active round for building and reviewing tickets. Passing AC1 tests cover first and successive rounds, including the subagent command workflow."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "doing() shows the builder fixing the last recorded round when review_running is null. The passing AC2 test verifies names, round numbers and fallback wording."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Persisted records support fresh reads. reviewRound() clears command-review activity in finally; subagent activity ends through record or explicit --ended cleanup. Passing AC3 tests cover persistence, completion, failure, timeout, dead processes and subagent cleanup."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "progress() remains unchanged and its AC4 test passes. The helper rename changes no behaviour and fixes the older source-text assertion without weakening it. All 59 tests in the supplied run passed. The merged configuration matches main."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/review.mjs",
        "issue": "The subagent lifecycle fixes remain intact: first-round cards show review activity, abandoned rounds have explicit cleanup, and long reviews do not expire prematurely.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The helper rename fixes the shipping test failure without changing behaviour or weakening tests. The merge preserves main's configuration and the previously approved review activity tracking. All criteria pass."
  }
}
```

</details>
