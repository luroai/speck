---
id: "0117"
title: "Split the slowest test file so the suite runs in parallel"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-make-the-test-suite-faster.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T10:21:32.012Z"
finished: "2026-10-11T10:35:27.015Z"

---
# 0117 · Split the slowest test file so the suite runs in parallel

**Status:** ✅ done

## Problem
Every build waits on the full test suite several times, and the suite takes about 108 seconds. 89 of those are one file, `test/speck.test.mjs` (171 tests): `node --test` runs files in parallel, but the tests in one file one after another, so everything else finishes while that file is still running.

## Outcome
The tests in `test/speck.test.mjs` are spread over several smaller files, so they run in parallel and the full suite takes about as long as its next slowest file.

## Acceptance criteria
1. `test/speck.test.mjs` is replaced by test files grouped by the area they test, none with more than 30 tests.
2. Every test from `test/speck.test.mjs` is in one of the new files with the same name and the same checks, and the suite has the same number of tests as before.
3. Helpers the new files share are in a module under `test/support/`, not copied into each file.
4. No test that passed before this change fails.
5. The Delivery log gives the full suite's elapsed time before and after the change, each measured with `speck test` on the same machine.

## Out of scope
- Changing what any test checks, or speeding up individual tests.
- The panel tests' port clash (0118) and their fixed waits.

## Notes
- Measured 2026-10-11 on 16 cores: the full suite takes 108 seconds and `test/speck.test.mjs` 89 alone. The next slowest file, `test/run.test.mjs`, takes 27, so expect about 30 seconds afterwards.
- This changes only test files, which don't count towards `max_changed_lines`.
- Failing before this build: none (1000 tests, 997 pass, 3 skipped; `speck test --fresh` took 114 seconds on 16 cores).
- The split was made by a throwaway script that cut the file at each top-level statement (each piece checked to compile) and moved every statement unchanged: tests and helpers used by one area stay in that area's file, and helpers used by more than one go to `test/support/speck.mjs` with `export` added. There `ROOT` goes up two folders instead of one, since the module is a folder deeper. A one-off check confirmed all 224 statements of the old file appear word for word in the new files.
- The checks for AC1–AC3 are in `test/split-0117.check.mjs`, outside the suite (`test/*.test.mjs`), so the suite keeps its 1000 tests as AC2 asks. Run them with `node --test test/split-0117.check.mjs`: on 2026-10-11 all 3 passed.
- AC2's check finds the commit that removed `test/speck.test.mjs` from git history rather than naming it, because 0085's test forbids commit ids in test files. It compares the files as that commit left them, so later edits to the moved tests don't break it, and it skips without the history (a shallow clone).
- AC4 is checked by the full suite passing; AC5 by reading the Delivery log.
- Self-check: AC2's test named a commit id, which 0085's test caught; it now finds the commit from history.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The three new regression tests increase the suite from 1000 to 1003 tests, violating AC2's explicit requirement that the suite retain the same number of tests.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,695,794
- Elapsed since build started: 13 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Full suite, `speck test --fresh` on the same 16-core machine: 114 seconds before the split and 58 seconds after, with 1000 tests both times (997 pass, 3 skipped).
- The ticket expected about 30 seconds. With some 70 test files now running at once on 16 cores, the suite looks bound by the CPU rather than by its slowest file, so splitting further won't help much on its own.
- Follow-ups (known limits, no inbox notes): `test/split-0117.check.mjs` runs only when called by hand, so nothing re-checks the 30-test limit as the area files grow. Getting nearer 30 seconds would mean making the slow tests themselves cheaper, which this ticket left out of scope.

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
    "reviewed_sha": "07454a56e89454351981a089e60713bf4bb0b17c",
    "thread_id": "01a12a84-6f73-7112-9b15-22358b325fb7",
    "seconds": 41,
    "usage": {
      "input_tokens": 649995,
      "cached_input_tokens": 429440,
      "cache_write_input_tokens": 0,
      "output_tokens": 1013,
      "reasoning_output_tokens": 105
    },
    "saved_at": "2026-10-11T10:32:06.061Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/speck.test.mjs is removed. The 12 area files contain between 5 and 27 tests each; test/split-0117.test.mjs AC1 checks the limit."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "Independent comparison against main confirms all 171 original test blocks were moved verbatim, without loss or duplication. However, test/split-0117.test.mjs adds three tests: the full suite now contains 1003 rather than the required 1000."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Shared fixtures and repository helpers are exported from test/support/speck.mjs and imported by the area files. The AC3 structural test checks for duplicated declarations."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Supplied full-suite output reports 1000 passes, zero failures and the same three skips as before the build. Original test checks are unchanged. The read-only review did not rerun tests that create temporary repositories."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The ticket's Delivery log records speck test --fresh on the same 16-core machine: 114 seconds before and 58 seconds after. Supplied suite output reports 58.108 seconds."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/split-0117.test.mjs",
        "issue": "The three new regression tests increase the suite from 1000 to 1003 tests, violating AC2's explicit requirement that the suite retain the same number of tests.",
        "suggested_fix": "Keep these structural verification checks outside the normal suite, as a separately invoked validation script, so the full suite retains its original 1000 tests. Record their validation results in the ticket.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "All 171 original tests were preserved unchanged and grouped into 12 smaller files with shared helpers. The reported suite time fell from 114 to 58 seconds with no failures. One requirement remains unmet: three added checks increase the suite's test count."
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
    "reviewed_sha": "4b99022e8a8a472ba3f8d480712ae798059b36a4",
    "thread_id": "01a12a84-6f73-7112-9b15-22358b325fb7",
    "seconds": 56,
    "usage": {
      "input_tokens": 1043045,
      "cached_input_tokens": 662016,
      "cache_write_input_tokens": 0,
      "output_tokens": 1741,
      "reasoning_output_tokens": 105
    },
    "saved_at": "2026-10-11T10:34:20.430Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/speck.test.mjs is removed. Its 171 tests are split across 12 area files, each containing between 5 and 27 tests, below the 30-test limit."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "All 171 original test blocks are preserved verbatim, without omissions or duplicates. The three structural checks now live outside the suite glob in test/split-0117.check.mjs. The supplied fresh suite reports 1000 tests, matching the baseline."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Shared helpers live in test/support/speck.mjs and are imported by the area files. Helpers used by only one area remain local."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The supplied fresh suite reports 997 passes, zero failures and three skips, matching the baseline outcomes. The original test blocks remain unchanged."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The Delivery log records speck test --fresh on the same 16-core machine: 114 seconds before and 58 seconds after, with 1000 tests in both runs."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/split-0117.check.mjs",
        "issue": "Resolved: the three added structural checks no longer increase the normal suite's test count.",
        "suggested_fix": "No further change required. The standalone command is documented in the check file and ticket Notes.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The previous issue is fixed. All original tests and checks are preserved, the suite retains its original test count, and the recorded run takes about half as long. No blocking concerns remain."
  }
}
```

</details>
