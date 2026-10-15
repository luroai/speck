---
id: "0178"
title: "Keep the panel's full board small as tickets ship"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0178 · Keep the panel's full board small as tickets ship

**Status:** 🔍 reviewing

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
