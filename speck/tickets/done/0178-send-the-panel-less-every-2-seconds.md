---
id: "0178"
title: "Keep the panel's full board small as tickets ship"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0188"]                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-15T11:50:15.782Z"
approved: "2026-10-15T12:02:50.816Z"
finished: "2026-10-15T12:05:44.759Z"

---
# 0178 · Keep the panel's full board small as tickets ship

**Status:** ✅ done

## Problem
Each full board the panel sends a page is 1.19 MB (measured 2026-10-14), sent each time a page opens or reconnects (0187). 154 finished tickets make up 1.08 MB of it, including 515 KB of each finished build's log ending, which the panel never shows for a finished ticket. Through a tunnel to a phone that's a slow first load and reconnect, and it grows with every ticket shipped.

## Outcome
The full board stays small however many tickets have shipped, and the panel shows the same as before.

## Acceptance criteria
1. In the full board the panel sends a page, each finished ticket other than the latest five takes up no more than 500 bytes, however long its text and build log are.
2. For the same tickets, the full board is less than a third of the size it was before this change.
3. The panel shows the same as before for the same tickets: the queue, Plan, the Shipped list and its figures, and each ticket's full text when it's opened, finished ones included.
4. `speck status --json` prints the same as before.
5. No test that passed before this change fails.

## Out of scope
- How long the board takes to read (0176).
- Sending only what changed (0188).

## Notes
- Measured on 2026-10-14: `build_exit` 515 KB, acceptance criteria 156 KB, notes 147 KB, problem 49 KB across all tickets. Gzipped, the answer is 312 KB. The panel itself sends it uncompressed.
- The panel uses `build_exit.message` only for tickets in the queue. The Shipped list shows the latest five finished tickets in full, and figures over all of them.
- The field names of `speck status --json` are a contract (0030).
- Failing before this build: none
- Self-check: no changes

## In plain words
The panel now sends much less when a page opens or reconnects. Tickets that shipped a while ago, beyond the five shown in the Shipped list, are sent as just the few figures the Shipped stats need, rather than their whole text and build log. On this repo that takes the first load from about 1.36 MB to about 170 KB, and it barely grows as more tickets ship. The panel looks exactly the same: the queue, Plan, the Shipped list and its figures don't change, and `speck status --json` still gives every ticket in full. To see it, open the panel on a phone through the tunnel: the first load and each reconnect should be noticeably quicker.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 panelBoard's rounds.map retains an unbounded array, so older finished tickets are not guaranteed to fit within 500 bytes.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 487,704
- Elapsed since build started: 13 min
- Changed lines: 39 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none new. Skipped: the unrelated 0153 AC2 test that failed once on timing in round 2's run (matches speck/ideas/2026-10-15-fix-the-race-in-the-0153-second-ship-test.md).

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
    "reviewed_sha": "9ac93a2b6c32a9fd087332381b06c0e19972e275",
    "thread_id": "01a13f6a-e872-76b0-95eb-8d5c18044fba",
    "seconds": 55,
    "usage": {
      "input_tokens": 199159,
      "cached_input_tokens": 160256,
      "cache_write_input_tokens": 0,
      "output_tokens": 1477,
      "reasoning_output_tokens": 109
    },
    "saved_at": "2026-10-15T11:56:28.596Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/board-feed.mjs panelBoard retains one rounds array entry per review round. A direct check with six finished tickets and 100 rounds on the oldest produces a 533-byte summary, exceeding 500 bytes. The AC1 tests use only two rounds."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing AC2 test compares identical boards with 30 and 150 finished tickets and verifies that the compact board is less than one third of the original size."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing AC3 tests exercise the actual panelModel from templates/panel.html, comparing queue, Plan, Shipped and figures, including timestamp edge cases and shipping tickets. The latest five retain their full text."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Compaction is applied only in panel.mjs stateOf. The passing AC4 test checks CLI output against statusData and verifies full fields remain present on finished tickets."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The full output in /tmp/speck-0178-tests.txt records 1805 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/board-feed.mjs",
        "issue": "panelBoard's rounds.map retains an unbounded array, so older finished tickets are not guaranteed to fit within 500 bytes. A ticket with ordinary timestamps, spend fields and 100 review rounds serialises to 533 bytes.",
        "suggested_fix": "Represent the review-round count and total tokens with fixed-size summary fields, update the panel model to consume them while preserving its figures, and add a regression test with a long review history.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change substantially reduces the board payload and preserves the panel's display and command-line output. All recorded tests pass. One fix is needed: older tickets still grow with their review history and can exceed the promised 500-byte limit."
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
    "reviewed_sha": "843df2db328a8923889462c86d810f7c604323cc",
    "thread_id": "01a13f6a-e872-76b0-95eb-8d5c18044fba",
    "seconds": 25,
    "usage": {
      "input_tokens": 284926,
      "cached_input_tokens": 239872,
      "cache_write_input_tokens": 0,
      "output_tokens": 2142,
      "reasoning_output_tokens": 109
    },
    "saved_at": "2026-10-15T12:02:39.246Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/board-feed.mjs panelBoard now uses fixed-size review_total fields. The passing AC1 test checks the 500-byte limit with long text, logs and 100 review rounds; the integration test verifies the panel sends compact tickets."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing AC2 test verifies that compact boards containing 30 and 150 finished tickets are less than one third of their original size."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html panelModel consumes review_total while retaining support for full rounds. Passing AC3 tests compare the actual model's queue, Plan, Shipped list and figures before and after compaction, and verify full text for displayed finished tickets."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Compaction remains confined to the panel response. The passing AC4 test verifies unchanged CLI output against statusData and checks that finished tickets retain their full fields."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The full log records 1808 tests with one timing failure and three skips. The runner reran the failing file: all 15 tests passed, including the original failure, satisfying the repository's documented flaky-test policy."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/board-feed.mjs",
        "issue": "Older finished tickets previously retained an array entry for every review round, allowing their summaries to exceed 500 bytes.",
        "suggested_fix": "Implemented: fixed-size review totals replace the array, the panel reads those totals, and the size regression test covers 100 rounds.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The size-limit issue is fixed. Older finished tickets now carry compact summaries while the panel preserves its display and figures, and command-line output stays unchanged. All acceptance criteria pass; one unrelated timing failure passed on the runner's retry."
  }
}
```

</details>
