---
id: "0221"
title: "List a test that failed on both tries once"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-list-a-test-that-failed-twice-once.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0236"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T23:12:18.848Z"

---
# 0221 · List a test that failed on both tries once

**Status:** 🔍 reviewing

## Problem
When a full test run fails and its failing tests fail again on the second try, the reviewer's test summary lists each failing test twice, once per run, and its totals are the second try's few files rather than the whole suite's. A reviewer sees double the failures and a suite that looks tiny, which can cost a review round asking about it.

## Outcome
A test that failed on both tries appears once in the reviewer's test summary, with the whole suite's totals.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. When a full test run fails and its failing tests' files are run again and fail again, the reviewer's test summary lists each failing test once, with the error details from the second try.
2. That summary's totals (tests, passes and failures) are the full run's, not the second try's.
3. The failing count saved with the review round, and shown in the review pack, counts each failing test once.
4. A run whose second try passes (with its `Flaky:` line) and a run with no second try are summarised as today, and no test that passed before this change fails, except 0209's check that a test failing on both tries is listed twice, which is changed to check AC1 to AC3.

## Out of scope
- Showing the first try's error details as well.

## Notes
- The two runs' output is joined in `scripts/results.mjs` and summarised by `readTap()` and `summariseTap()` in `scripts/tap.mjs`, which only cut the text at the retry note when a `Flaky:` line follows.
- The note's open question is settled as the second try's details only (AC1).
- Failing before this build: none
- Self-check: added a test that a test failing in the full run but passing on the second try, while another fails again, is still listed once (with the full run's details).

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
    "reviewed_sha": "1094a6af0ccb60f19e493d40714a8bd6a2d89d35",
    "thread_id": "01a141d8-2244-7e92-9239-8da8b357089a",
    "seconds": 39,
    "usage": {
      "input_tokens": 174316,
      "cached_input_tokens": 132608,
      "cache_write_input_tokens": 0,
      "output_tokens": 1539,
      "reasoning_output_tokens": 246
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T23:14:44.634Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/tap.mjs readTap() matches retries by name path alone (line 78). Distinct tests sharing a name can overwrite each other's details. The supplied AC1 tests pass but cover only unique names."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "readTap() cuts the output at RETRY_NOTE; test '0221 AC2: the totals are the full run’s, not the second try’s' checks tests, passes and failures and passed in the supplied run."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The AC3 recording and review-pack tests pass for unique names. A read-only reproduction with two same-named tests at different locations, failing on different tries, returned tapCounts().failing = 1 instead of 2."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Supplied results show all 26 tests passing, including 0209's Flaky-line and exact first-time-summary checks, 0221's no-retry check, and 0119's existing summary tests. Changes remain within ticket scope."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/tap.mjs:78",
        "issue": "Retry matching treats distinct tests with the same name path as one test. Reproduced with two tests named 'repeated' in the same file at lines 1 and 10: the first fails initially and passes on retry; the second passes initially and fails on retry. The summary discards the first failure's details and reports one failing test rather than two. This also understates the review round and pack count.",
        "suggested_fix": "Use failure locations as well as name paths to distinguish tests when matching retries, with appropriate handling for results without locations. Add a regression covering same-named tests at different locations that fail on different tries, asserting both details and a count of two.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change preserves full-run totals and handles the tested retry cases. However, distinct tests with identical names can be merged, hiding a failure and understating the review pack’s count. Fix this before merge."
  }
}
```

</details>
