---
id: "0209"
title: "Show the reviewer which failures passed on a retry"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-show-the-reviewer-which-failures-passed-on-a-retry.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T13:52:18.983Z"

---
# 0209 · Show the reviewer which failures passed on a retry

**Status:** 🔍 reviewing

## Problem
When a full test run passes only on its second try (0195), the summary of the test output the reviewer gets still lists the first try's failures as failing tests, beside a run that passed. A reviewer may then spend a round asking about them.

## Outcome
The reviewer's test summary says which tests failed and then passed on the second try, apart from real failures.

## Acceptance criteria
1. For a run that passed only on its second try, the summary the reviewer gets says the run passed, and lists the tests that failed then passed under "Passed on a second try", not under failing tests.
2. For a run that failed on both tries, the summary lists the failing tests as it does today.
3. A run that passed first time is summarised as it is today.
4. The summary in `speck pack` for the ticket agrees with the reviewer's.
5. No test that passed before this change fails.

## Out of scope
- Fixing the tests that fail by chance (0207).

## Notes
- Asked for 2026-10-15, for release 0.4.0.
- The summary comes from `summariseTap` in `scripts/tap.mjs` (0119); the `Flaky:` line is written by `scripts/results.mjs` (0195) at the end of the output.
- Failing before this build: none
- AC4: `speck pack` had no test summary at all, so each review round now records what the reviewer's summary said (how many failing tests, and which passed on a second try), and the pack shows it for the latest round under "Tests". `speck record` takes `--tests=<file>` for this, and the review skill passes it.
- Self-check: `speck record` and `speck review` given a test output file that can't be read now refuse in plain words rather than with a stack trace.

## In plain words
When a full test run only passes because its failing tests passed on a second try, the reviewer is now told the run passed, and those tests are listed on their own under "Passed on a second try" instead of as failures. A run that passes first time, or fails on both tries, is summarised just as before. The review pack now has a short "Tests" part saying how many failing tests the reviewer was told about and which passed on a second try, so the pack and the reviewer agree. To see it, read the review pack of a ticket reviewed after this change. Worth keeping an eye on: tests that keep turning up as passing on a second try still need fixing.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - Inbox: speck/ideas/2026-10-15-list-a-test-that-failed-twice-once.md (a run that failed on both tries lists each failing test twice, with the second run's totals).
  - The pack's "Tests" part shows only the latest round, and only when that round was given TAP output with `--tests`.
  - The Codex path records the test counts the same way as the command and `speck record` paths, but only those two have their own tests.

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
    "reviewed_sha": "fd6e959b2893141e6f6a4bafb4725d0170ea63c2",
    "thread_id": "01a13fe0-e51a-70b2-ba89-4c15429920bc",
    "seconds": 24,
    "usage": {
      "input_tokens": 145857,
      "cached_input_tokens": 104064,
      "cache_write_input_tokens": 0,
      "output_tokens": 594,
      "reasoning_output_tokens": 44
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T14:04:49.195Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/tap.mjs readTap and summariseTap separate retry passes from failures and explicitly report success. The two AC1 tests cover nested and multiple failures; both passed in the full output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "readTap preserves the previous failure parsing when no successful retry marker follows the retry notice. Both AC2 tests passed, covering repeated failures and an earlier Flaky line."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The AC3 test asserts the complete first-time passing summary remains identical; it passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "tapCounts shares readTap with the reviewer summary. review.mjs and reviewers.mjs save this metadata, and pack.mjs testsLines displays the latest round. Passing AC4 tests exercise record-to-pack agreement and command-review metadata."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0209-tests.txt: 1,878 tests, 1,875 passed, 3 skipped, zero failures or cancellations. All nine new tests passed; existing tests were not modified."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The reviewer now sees retry successes separately from genuine failures, and the review pack records the same result. First-time passes and repeated failures retain their previous summaries. The full suite passed, and I found no blocking issues."
  }
}
```

</details>
