---
id: "0228"
title: "Skip the retry for tests that already fail on the base branch"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T21:23:50.976Z"

---
# 0228 · Skip the retry for tests that already fail on the base branch

**Status:** 🔍 reviewing

## Problem
When a full test run fails, speck runs the failing tests' files once more to catch tests that fail by chance. Tests that already fail on the base branch aren't failing by chance, so retrying them only costs time, and with them in the run the retry can never pass it. On an 8 GB MacBook Air, the 26 tests already failing on `main` cost 316 s of test time per full run, half of it on the retry.

## Outcome
The retry after a failing run leaves out tests that already fail on the base branch.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. When a full test run fails and the result recorded for the base branch's code lists failing tests, the retry leaves those tests' files out, unless one of them also holds a failing test that didn't fail on the base branch.
2. When every failing test also failed on the base branch, there's no retry, and speck says in one line that the failing tests already fail on the base branch.
3. When no result is recorded for the base branch's code, the retry works as today.
4. The run still counts as failed while any test failed, the `Flaky:` line still names only tests that failed and then passed, and no test that passed before this change fails.

## Out of scope
- Changing which tests a build records as failing before it starts.
- Listing a test that failed on both tries once in the summary (0221).

## Notes
- The retry is `retry()` in `scripts/results.mjs`, called from `testRun()`. Results are recorded per code (`recorded()`), so the base branch's result is usually there already: a build's first full run is on the base branch's code.
- Measured 2026-10-15 on an 8 GB MacBook Air: 26 tests failing on `main`, 52 failing rows (each failed twice), 316 s of test time.
- Failing before this build: none
- Self-check: matched base-branch failures by name and the end of their file path, since the base run may have been in another worktree; normalised path separators; described the change in the brief's `speck test` row.

## In plain words
When a test run fails, speck tries the failing tests once more to catch ones that failed by chance. Now it skips that second try for tests that were already failing on the main branch, since they aren't failing by chance. If nothing else failed, there's no second try at all, and speck says in one line that the failing tests already fail on the main branch. Builds and ships spend less time on tests while the main branch has broken tests.

To see it: with a test failing on the main branch, run the tests there once, then run them on a ticket's branch. The output names the tests it left out of the second try.

Worth keeping an eye on: this only works once the main branch's tests have been run on its latest code; until then the second try works as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Inbox: `speck/ideas/2026-10-15-log-flaky-tests-when-base-failures-are-left-out.md` (a new failure that passes on the second try isn't logged as flaky when base branch failures were left out).
- Known limit: a recorded failing output is kept only up to its last 1 MB; when that cuts off the `TAP version` line, the base branch's failing tests can't be read and nothing is left out (the retry works as before).
- Known limit: results recorded before this change don't say which checkout ran them, so they leave nothing out until the base branch's tests run again.

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
    "reviewed_sha": "11b7bb2b1882252efda76e3c85956eb76dda67da",
    "thread_id": "01a1418b-4858-7032-b6b5-c9f3e3b6d667",
    "seconds": 30,
    "usage": {
      "input_tokens": 134590,
      "cached_input_tokens": 96128,
      "cache_write_input_tokens": 0,
      "output_tokens": 749,
      "reasoning_output_tokens": 71
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T21:50:39.178Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/results.mjs:142 matches base files by suffix rather than repository-relative path. Different files with a shared suffix and test name are incorrectly excluded. The AC1 tests cover different filenames but miss this case."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The AC2 test verifies no retry, a failing exit status and exactly one explanatory line when all failures match the base result."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The AC3 tests exercise absent and passing base results, verifying that failing files still run twice."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The AC4 tests verify retained failure status, cached failure and accurate Flaky output. /tmp/speck-0228-tests.txt confirms 1,985 passes, zero failures and three skips."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/results.mjs:142",
        "issue": "Suffix matching confuses different files. A base failure in packages/widget/test/check.test.mjs matches a current failure with the same name in test/check.test.mjs. This incorrectly skips a newly failing file and reports its test as already broken on the base branch. The matching expression was independently checked and returns true for these paths.",
        "suggested_fix": "Compare exact repository-relative paths, retaining enough information about the recorded run's repository root to handle other worktrees reliably. Add a regression test with identical test names in these two suffix-sharing paths and verify the newly failing file is retried.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change skips known failures and preserves failing results, and the full suite passed. One path-matching bug can also skip newly failing tests in a different file. Fix that before merge."
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
    "reviewed_sha": "a9ea9c8d8d984f5eeeb1f35fe827175a2ab725b0",
    "thread_id": "01a1418b-4858-7032-b6b5-c9f3e3b6d667",
    "seconds": 16,
    "usage": {
      "input_tokens": 226461,
      "cached_input_tokens": 177024,
      "cache_write_input_tokens": 0,
      "output_tokens": 1208,
      "reasoning_output_tokens": 71
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T22:00:55.468Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/results.mjs: failingOnBase() resolves recorded locations relative to the recorded checkout root; retry() compares exact relative paths and retains files containing new failures. AC1 tests cover separate files, shared files, identical names and suffix-sharing paths; all passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The AC2 test verifies no retry, a failing exit status and exactly one explanatory line when every failure also occurred on the base branch; passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "AC3 tests verify unchanged retry behaviour with absent or passing base results and older results lacking a checkout root; all passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "AC4 tests verify retained failure status, cached failure and correct Flaky output. The full output in /tmp/speck-0228-tests.txt reports 1,987 passes, zero failures and three skips."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/results.mjs: failingOnBase() and retry()",
        "issue": "Suffix matching previously confused different files with identical test names and shared path endings.",
        "suggested_fix": "Implemented: record the checkout root and compare exact repository-relative paths. The new regression test verifies the newly failing file is retried.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Known base-branch failures now avoid unnecessary retries while newly failing files still run again. The path-matching bug is fixed and covered by a regression test. All acceptance criteria pass, with no failures in the full suite."
  }
}
```

</details>
