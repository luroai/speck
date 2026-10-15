---
id: "0223"
title: "Say which review round is running"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0223 · Say which review round is running

**Status:** 🔍 reviewing

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
- Self-check: a records folder that can't be written no longer stops a review round; the round runs without being recorded as running.
- A board that doesn't say whether a round is running (no `review_running` field, as in older fixtures) keeps the old wording, so the existing card tests still hold (AC4).

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
