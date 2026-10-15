---
id: "0215"
title: "Stop the review pack's elapsed time at approval"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-12-stop-the-review-packs-elapsed-time-at-approval.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0236"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T23:12:25.775Z"

---
# 0215 · Stop the review pack's elapsed time at approval

**Status:** 🔍 reviewing

## Problem
The review pack's "Elapsed since build started" line counts up to the moment the pack is read. For a ticket that has waited to be shipped, it includes the wait, so it disagrees with the panel (which since 0139 stops at approval) and looks wrong to the person deciding whether to ship.

## Outcome
A review pack read after approval shows the build's time up to its approval, not up to when it's read.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. For a ticket with both `started` and `approved`, the review pack (from `speck pack <id>` and the panel's Review pack button) reads `Elapsed since build started: <n> min`, where `<n>` is the whole minutes from `started` to `approved`, rounded as today, however long after approval the pack is read.
2. For a ticket with `started` but no `approved` (still building or reviewing, or shipped before 0139), the line counts from `started` to now, as it does today.
3. For a ticket with no `started`, the line reads `Elapsed: not recorded`, as it does today.
4. The Delivery log line written when `speck close` approves a ticket still counts from `started` to the moment of that approval, including when the ticket already has an `approved` time from an earlier approval.
5. No test that passed before this change fails.

## Out of scope
- The panel's own times, which 0139 already stops at approval.
- Changing the line's wording.

## Notes
- `reviewTotals()` in `scripts/pack.mjs` works out the line for both the review pack and the Delivery log (`scripts/close.mjs`). `speck close` calls it before it sets `approved`, so on a ticket approved before (AC4), the old `approved` time is still in the frontmatter at that point.
- `approved:` is written in the same format as `started:` (0139).
- Failing before this build: none
- Self-check: an `approved` time that isn't a date counts to now rather than printing NaN; added a test for it.

## In plain words
The review pack's build time now stops when the reviewer approves the ticket, so a ticket that has been waiting to be shipped no longer looks as if it took longer to build. It now agrees with the time the panel shows. To see it, open the review pack of a ticket approved a while ago: the time stays the same however long you wait. Tickets still being built or reviewed count up to now, as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
- Follow-ups: none.

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
    "reviewed_sha": "5f1122f53fc26e4e8a1aeebf9838e7c52e90be55",
    "thread_id": "01a141da-37b4-75b1-b961-144ae33263c6",
    "seconds": 17,
    "usage": {
      "input_tokens": 122885,
      "cached_input_tokens": 84736,
      "cache_write_input_tokens": 0,
      "output_tokens": 585,
      "reasoning_output_tokens": 12
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T23:16:39.668Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/pack.mjs reviewTotals() uses valid approved timestamps and retains Math.round minute rounding. Both AC1 tests in test/pack-0215.test.mjs passed, including the CLI pack integration. scripts/panel.mjs uses the same reviewPack() function."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "reviewTotals() falls back to now when approved is absent, empty or invalid. The AC2 test exercises all three cases and passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "reviewTotals() preserves 'Elapsed: not recorded' without started. The AC3 test covers tickets with and without approved and passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/close.mjs cmdClose() explicitly passes the current time to reviewTotals(), overriding any earlier approval. The AC4 integration test runs close with an old approved timestamp and verifies the Delivery log; it passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The recorded test output confirms all 40 tests passed across the ticket tests and existing close and pack tests. The change is limited to elapsed-time calculation and its close caller; whole-suite verification remains the shipping gate."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The review pack now stops elapsed time at approval, excluding the wait to ship. Tickets without an approval still count to now, and approving a ticket again records the new duration correctly. All 40 selected tests passed; no blocking concerns found."
  }
}
```

</details>
