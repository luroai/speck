---
id: "0230"
title: "Make each test repo from a copy built once per test file"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T21:23:50.566Z"
approved: "2026-10-15T22:09:46.807Z"
finished: "2026-10-15T22:13:22.092Z"

---
# 0230 · Make each test repo from a copy built once per test file

**Status:** ✅ done

## Problem
Most of speck's tests make a fresh temporary git repo with speck set up in it, running `git init` and several commits each time. On an 8 GB MacBook Air, 507 tests took 1 to 3 s each, 43% of the suite's test time, and setting up their repos is a large part of that.

## Outcome
Tests get their temporary repos by copying one made earlier in the same test file, not by setting each one up from scratch.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. The shared helpers that make a temporary speck repo (`reviewRepo()` and the others in `test/support/`) set up the first repo of each kind in a test file as today, and make each later one by copying it, running no `git init` or setup commits.
2. Each copy is its own repo: a change in one test's repo never shows in another's, and each is removed when its test ends, as today.
3. No test that passed before this change fails.

## Out of scope
- Starting the speck CLI inside the test process (0231).
- Test files that set up their repos by hand, without the shared helpers.

## Notes
- The helpers are in `test/support/speck.mjs`; `test/support/tmp.mjs` cleans up temporary folders and leaves `speck-keep-*` ones alone between tests.
- Write the suite's total test time before and after, on the same machine, in the Delivery log.
- Failing before this build: none
- Self-check: no changes. The first whole-suite run found that the fake reviewer's log can't come from an environment variable, as one test runs speck review itself, so each copy's fake reviewer and fake builder log into that repo's own .git folder.

## In plain words
speck's own test suite now sets up each kind of practice project once per test file and hands every test a fresh copy of it, instead of building a new one from scratch for each test. Nothing changes for people using speck: this only affects how quickly speck's own tests run. To see it, run the test suite and compare its time with an earlier run on the same machine. On a busy machine the saving measured so far is small, a few per cent, so the bigger wins are expected from later tickets.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Two shared-helper paths bypass copying entirely: runRepo({ command: ...
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 323,056
- Elapsed since build started: 46 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Suite time, whole suite with `speck test` on the same Linux box (other builds were running on it each time, so the numbers are noisy). Before: 1,982 tests, 128.7 s for the run, 1,661 s summed over the test files. After round 1's fixes: 1,999 tests, 124.8 s for the run, 1,608 s summed over the test files. An earlier run of the first version took 113.4 s and 1,442 s.
- Follow-ups:
  - Copy the repos that test files set up by hand (inbox: speck/ideas/2026-10-15-copy-test-repos-that-test-files-set-up-by-hand.md).
  - Skipped: running the speck CLI inside the test process for a bigger saving, which 0231 covers.
  - Known limit: a runRepo() or shipRepo() kind whose command names a folder made for one call (as tickerRepo() does) can never be reused, so each such call sets up a template that stays until its test file ends, then copies it. Such calls cost a copy more than before.
  - Known limit: each fake builder and fake reviewer run now asks git for its repo's .git folder, to keep its log there.

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
    "reviewed_sha": "d1fe143bb0437a47d60493a8d69790a45e12150c",
    "thread_id": "01a1418c-e991-7d12-90b7-ab2c3b1b1fc9",
    "seconds": 28,
    "usage": {
      "input_tokens": 110065,
      "cached_input_tokens": 66176,
      "cache_write_input_tokens": 0,
      "output_tokens": 818,
      "reasoning_output_tokens": 44
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T21:52:24.107Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "Default helper variants are covered by the passing 0230 AC1 tests. However, runRepo() in test/support/run.mjs rebuilds whenever command is supplied, and shipRepo() in test/support/ship.mjs rebuilds whenever test contains {main}. Repeated calls with identical options still run git init and setup commits; the new tests omit these paths."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "copied() uses recursive filesystem copies. Passing 0230 AC2 tests exercise independent commits, reviewer and builder logs, removal after a test, and successful later copies. test/support/tmp.mjs preserves templates while removing test copies."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The full output at /tmp/speck-0230-tests.txt reports 1,996 tests, 1,993 passed, three skipped and zero failures. Existing tests were not modified."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/support/run.mjs; test/support/ship.mjs; test/repo-copy-0230.test.mjs",
        "issue": "Two shared-helper paths bypass copying entirely: runRepo({ command: ... }) and shipRepo({ test: ... }) containing {main}. This contradicts criterion 1, which makes no exception for these options. Identical repeated requests still initialise and commit repositories from scratch.",
        "suggested_fix": "Cache reusable setup for these paths too, preserving per-copy command paths and existing helper behaviour. Add tests requesting each variant twice and checking that the second request runs no git init or setup commits.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "minor",
        "file": "speck/tickets/0230-make-each-test-repo-from-a-copy-built-once-per-tes.md",
        "issue": "The Delivery log is empty, so the required before-and-after suite timing comparison is missing. The supplied after-run duration alone does not establish the performance improvement.",
        "suggested_fix": "Record the baseline and final whole-suite times measured on the same machine in the Delivery log.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The common helper paths now copy reusable repositories, and the suite passes with isolation and cleanup tests. Two supported helper variants still rebuild every time and need coverage and implementation before approval. The requested performance comparison is also missing."
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
    "reviewed_sha": "227ef60def851b8d7eeea625f988177a5ea2f35b",
    "thread_id": "01a1418c-e991-7d12-90b7-ab2c3b1b1fc9",
    "seconds": 16,
    "usage": {
      "input_tokens": 210818,
      "cached_input_tokens": 158592,
      "cache_write_input_tokens": 0,
      "output_tokens": 1355,
      "reasoning_output_tokens": 44
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T22:09:29.454Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "All shared repo helpers now use copied() in test/support/copy.mjs, including custom-command runRepo() and shipRepo() with {main}. Passing 0230 AC1 tests verify that repeated requests run no git init or setup commits and preserve repository contents."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0230 AC2 tests exercise independent commits, reviewer and builder logs, cleanup between tests, and subsequent copies. The new {main} test executes the configured command from a worktree and verifies that it writes only into that copy's main checkout."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0230-tests.txt: 1,999 tests, 1,996 passed, three skipped, zero failures. Existing tests were not weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/support/run.mjs; test/support/ship.mjs; test/repo-copy-0230.test.mjs",
        "issue": "Custom-command and {main} helper variants previously bypassed copying.",
        "suggested_fix": "Implemented: both variants now use cached templates, with passing tests covering repeated requests and per-copy main-checkout resolution.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "minor",
        "file": "speck/tickets/0230-make-each-test-repo-from-a-copy-built-once-per-tes.md",
        "issue": "The required before-and-after suite timing comparison was missing.",
        "suggested_fix": "Implemented: the Delivery log records same-machine baseline and final timings, including the concurrent-load limitation.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "All shared repository helpers now reuse templates while keeping test repositories independent and cleaning them up. Both earlier findings are resolved, and the full suite passes. Recorded timings show a modest improvement, though concurrent builds make the comparison noisy."
  }
}
```

</details>
