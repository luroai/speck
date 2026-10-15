---
id: "0230"
title: "Make each test repo from a copy built once per test file"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0230 · Make each test repo from a copy built once per test file

**Status:** 🔍 reviewing

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
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Suite time, whole suite with `speck test` on the same Linux box (other builds were running on it each time, so the numbers are noisy). Before: 1,982 tests, 128.7 s for the run, 1,661 s summed over the test files. After round 1's fixes: 1,999 tests, 124.8 s for the run, 1,608 s summed over the test files. An earlier run of the first version took 113.4 s and 1,442 s.

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
