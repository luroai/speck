---
id: "0745"
title: "Name only the tests that still fail after a full-suite retry"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-24-name-only-the-tests-that-still-fail-after-a-full-suite-retry.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T23:16:24.266Z"
approved: "2026-11-24T23:40:10.826Z"
finished: "2026-11-24T23:58:16.961Z"

---
# 0745 · Name only the tests that still fail after a full-suite retry

**Status:** ✅ done

## Problem
When the full suite's retry clears some of the first run's failures, `latest.json` and the fix ticket still name every first-run failure. On a busy machine that makes oversized fix tickets: 0736 named 22 tests when only 0159 AC3 still failed.

## Outcome
The full suite's result and its fix ticket name only the tests that failed again on the retry.

## Acceptance criteria
1. When the retry passes some first-run failures and fails others, `latest.json` and the fix ticket speck run writes name only those that failed on the retry.
2. When the retry fails everything that failed first, they name all of them, as today.
3. No test that passed before this change fails.

## Out of scope
- When the full suite retries.

## Notes
- `full-suite.mjs` builds `tests` with `failingTestFiles`, which doesn't drop first-run failures that passed on the retry, as `failingTests` does since 0377.
- Failing before this build: none
- Self-check: no changes. A test whose file was left out of the retry because it already fails on the base branch has no pass on the retry, so it is still named; a test that failed only on the retry is named too.

## In plain words
When the full suite fails on the main branch and some of its failing tests pass when they're run once more, speck now treats those as chance failures: the panel's note about the failing suite and the fix ticket speck writes name only the tests that failed again. A busy machine no longer turns one real failure into a fix ticket listing twenty. You'll see it the next time the full suite fails: the fix ticket's list should be short. If every failing test fails again, they're all named, as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 89,916
- Elapsed since build started: 24 min
- Changed lines: 5 (limit 5000)
Follow-ups: none.

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
    "reviewed_sha": "c3ddd447f221bb571e10f7d876347be5a7e61804",
    "session": "fresh",
    "thread_id": "01a20fed-f7f1-7310-b89b-9e6591abc127",
    "builder_response": "- Tests run: test/full-suite-0745.test.mjs (with --related: test/full-fix-0658.test.mjs, test/full-suite-0630.test.mjs, test/full-suite-panel-0655.test.mjs, and the commands.checks files)\n- The fix: full-suite.mjs's names() now uses tap.mjs's failingTests, which already leaves out a first-run failure that passed on the retry (0377), in place of failingTestFiles. Both latest.json writes (runFull and latestFull's kept path) and the fix ticket (which reads latestFull's tests) go through names().\n",
    "seconds": 20,
    "usage": {
      "input_tokens": 89348,
      "cached_input_tokens": 30976,
      "cache_write_input_tokens": 0,
      "output_tokens": 568,
      "reasoning_output_tokens": 59
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 58372,
      "cached": 30976,
      "write": 0,
      "output": 568
    },
    "cost_usd": 0.1255216,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T23:40:03.403Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/full-suite.mjs names() now uses failingTests(), which removes first-run failures that pass on retry. Both runFull() and latestFull() use it. The two passing 0745 AC1 tests check latest.json and the fix ticket."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing 0745 AC2 tests verify that latest.json and the fix ticket retain both names when both tests fail again, and that results without a retry retain all failures."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The saved related test run reports 184 passed, 0 failed and 3 skipped. The branch change is limited to the failure-name helper, its tests and the ticket; retry scheduling is unchanged."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The full-suite result and automatic fix ticket now omit tests that pass on retry while keeping tests that still fail. The targeted and related tests pass, and I found no blocking concerns."
  }
}
```

</details>
