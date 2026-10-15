---
id: "0221"
title: "List a test that failed on both tries once"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
approved: "2026-10-15T23:16:21.158Z"
finished: "2026-10-15T23:18:08.343Z"

---
# 0221 · List a test that failed on both tries once

**Status:** ✅ done

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
When a full test run fails and the failing tests fail again on their second try, the reviewer now sees each failing test once, with the error from the second try, and the totals of the whole run rather than of the few files run again. The count of failing tests in the review pack matches. To see it, look at the Tests part of a review pack for a round whose tests failed twice: the number of failing tests is no longer doubled. Worth knowing: a test that failed first and then passed, while another failed again, is still listed as failing, with its first error.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Retry matching treats distinct tests with the same name path as one test.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 443,995
- Elapsed since build started: 4 min
- Changed lines: 52 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Known limit: after a run that failed on both tries, the "Tests named with" list gives each test's result from the full run only, so one that failed first and passed on the second try still shows as failed.
- Follow-ups: none.

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

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "386fd840fed4c81a6910ee26f39fb044a284b816",
    "thread_id": "01a141d8-2244-7e92-9239-8da8b357089a",
    "seconds": 13,
    "usage": {
      "input_tokens": 266128,
      "cached_input_tokens": 217856,
      "cache_write_input_tokens": 0,
      "output_tokens": 2012,
      "reasoning_output_tokens": 257
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T23:16:13.148Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/tap.mjs readTap() now matches failures by name path and location, retaining second-try details. Passing tests in test/tap-0221.test.mjs cover repeated failures, nested failures, mixed outcomes and same-named tests, including reversed retry order."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "readTap() separates the full run at RETRY_NOTE. The passing 0221 AC2 test asserts the full run's tests, passes, failures and duration."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "tapCounts() uses the merged failure list. Passing AC3 tests cover counts, recording and review-pack display; the F1 regression confirms distinct same-named failures count as two."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "All 48 tests in the supplied five-file run passed. Coverage includes existing Flaky-line behaviour, unchanged first-time summaries, no-retry failures and retry location parsing. No unrelated implementation changes appear in the round's diff."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/tap.mjs:91",
        "issue": "Retry matching previously merged distinct tests sharing a name path, hiding failure details and understating the count.",
        "suggested_fix": "Completed: matching now considers full failure locations, with regressions for same-named tests failing on different tries and on both tries.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The summary now lists repeated failures once, keeps their second-try details and preserves full-run totals. The duplicate-name bug is fixed, and all 48 reported tests pass. Ready for the product owner's merge decision."
  }
}
```

</details>
