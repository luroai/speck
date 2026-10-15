---
id: "0229"
title: "Start the slowest test files first"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
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
started: "2026-10-15T21:38:12.714Z"

---
# 0229 · Start the slowest test files first

**Status:** 🔍 reviewing

## Problem
`npm test` hands Node the test files in alphabetical order, so a slow file near the end can run on its own while the other workers sit idle. On an 8 GB MacBook Air the suite took 483 s of wall time for 2,132 s of test time across about 7 workers, so roughly three minutes went on uneven packing and contention.

## Outcome
speck's own test suite starts its slowest test files first.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. `npm test` starts the test files in order of how long each took in the last full run in this checkout, longest first, then any files with no recorded time in alphabetical order.
2. With no recorded times (for example a fresh clone), it starts every file in alphabetical order, as today.
3. It runs every file in `test/` once, its output is read by speck's test summary and retry as today, and it exits with a failure when any test fails.
4. No test that passed before this change fails.

## Out of scope
- Running some files fewer at a time (0233).
- Ordering a user's own test suite: this is speck's own `npm test` only.

## Notes
- The times need keeping somewhere git ignores, such as under `speck/.cache/`.
- Checked 2026-10-15: Node 25.9's test runner has `--test-reporter` and `--test-reporter-destination` (`node --help`), so a second reporter could record each file's time.
- Checked 2026-10-15 by this ticket's first build: `node --test` sorts the files it's given, so the order can't be set on the command line.
- Decided 2026-10-15: `npm test` runs a small runner script that orders the files by their last recorded times and starts them with `run()` from `node:test`, recording each file's time under `speck/.cache/`. Criterion 3 then rests on that script: its output must be what speck's test summary and retry read from `npm test` today, and it must fail when any test fails.
- Measured 2026-10-15 on an 8 GB MacBook Air, from 0215's full run.
- Failing before this build: none
- Self-check: a times file that can't be written (speck/.cache/ not a folder, a read-only disk) no longer ends the run in a stack trace with the wrong exit code: it says so on stderr and the run keeps its tests' result. Added a test for it.

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
    "reviewed_sha": "f923928237da942262313f8caafb3087c2b58db3",
    "thread_id": "01a14189-2c8d-7de1-bed2-972f6a2ac105",
    "seconds": 48,
    "usage": {
      "input_tokens": 307030,
      "cached_input_tokens": 255744,
      "cache_write_input_tokens": 0,
      "output_tokens": 1414,
      "reasoning_output_tokens": 120
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T21:48:38.587Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "orderFiles() and runSuite() in test/support/suite.mjs implement duration ordering and recording. Passing AC1 integration tests exercise two successive runs."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing AC2 integration test verifies alphabetical starts without a cache; readTimes() handles missing and invalid records."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "File coverage, TAP summary and retry parsing are exercised by passing AC3 tests. However, runSuite() depends on test:summary for a successful exit, which is unavailable on supported Node 20."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "Verified /tmp/speck-0229-tests.txt reports 1,989 passed, zero failed and three skipped on the builder's runtime. On supported Node 20, the new runner returns failure even when all tests pass; the successful-exit tests consequently fail."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/support/suite.mjs:54",
        "issue": "success starts false and becomes true only through test:summary. Node 20, supported by package.json and README.md, does not emit that event, so a completely passing npm test exits 1. The Node 20 event list documents test:complete but no test:summary: [Node 20 documentation](https://nodejs.org/download/release/v20.19.0/docs/api/test.html#class-testsstream). The current tests cover only the builder's newer runtime.",
        "suggested_fix": "Determine the exit result using events available on Node 20, accounting for failures and cancellations, and verify passing and failing fixtures on the minimum supported runtime.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The runner orders files by their previous durations, and the reported full suite passes. One compatibility bug blocks approval: on supported Node 20, even a passing suite reports failure. Fix the exit-result handling and check it on Node 20."
  }
}
```

</details>
