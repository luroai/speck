---
id: "0232"
title: "Let tests shorten the waits behind the slowest tests"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0231"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T22:33:37.045Z"
approved: "2026-10-15T22:52:44.386Z"
finished: "2026-10-15T22:55:03.337Z"

---
# 0232 · Let tests shorten the waits behind the slowest tests

**Status:** ✅ done

## Problem
speck's slowest passing tests spend most of their time waiting for real limits to run out, such as `speck stop`'s 5-second wait or speck run's polling. On an 8 GB MacBook Air, 25 tests took 10 s or more each, 372 s in total.

## Outcome
The slowest tests run against limits they set shorter, while speck itself waits as long as it does today.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. Each passing test listed in Notes that waits for one of speck's own limits to run out can set that limit shorter, as `SPECK_STALL_MS` and `SPECK_REVIEW_TIMEOUT_MS` already allow, and does.
2. Without those settings, speck waits as long as today.
3. Each changed test still checks its criterion: it fails when the behaviour it checks is broken.
4. No test that passed before this change fails.

## Out of scope
- Tests that are slow because they fail on a busy machine.
- Waits in the browser tests' page stubs (0234).

## Notes
- The passing tests at 10 s or more, measured 2026-10-15 on an 8 GB MacBook Air: 0084 private words AC2 and AC3 (13.6 to 18.9 s), 0177 AC3 (17.0 s), 0148 AC3 (15.9 s), 0176 (15.6 s), 0099 AC4 (12.6 s), the cancel reason AC1/AC4 test (11.4 s), 0075 AC1 (10.4 s) and 0100 AC3 (10.3 s). `test/stop-0072.test.mjs` (22.8 s) failed in that run.
- Some of these may be slow for another reason (for example many CLI starts); leave those and say so in the Delivery log.
- 0218 changes `speck stop`'s wait to go by the clock and is planned after this.
- Failing before this build: none
- Self-check: the AC1 tests checked how long speck run took against a fixed 5 seconds, which a busy machine could break; they now check it was stopped because every build had launched, and that it checked once for each shorter wait.

## In plain words
speck itself works exactly as before: it still checks for ready tickets every 5 seconds. What's changed is speck's own test suite. Three of its slowest tests no longer sit waiting for real time limits to run out. One used to watch speck run for a whole minute and now takes about 18 seconds. Two others used to take 10 seconds each and now take under 2. The whole suite finished about 14 seconds sooner on the build machine. To see it, run the tests and compare how long they take. The other slow tests on the list are slow because of the work they do, not because they wait, so they're unchanged. The ticket's notes say why for each one.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Only targeted test results were supplied.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 407,320
- Elapsed since build started: 19 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Changed, measured on this box before and after: 0176 AC3 (61 s, the file 61 s to 18 s) and 0075 AC1 and 0100 AC3 (10 s each, now under 1.5 s).
- Left as they are, slow for another reason than a speck limit:
  - 0084 AC2 and AC3: each runs 0082's test file in its own `node --test`, which searches the tracked files with git grep.
  - 0177 AC3: the 5-second reading is the test's own stand-in for a slow board, which its criterion names, not a limit of speck's.
  - 0148 AC3, 0099 AC4 and the cancel reason AC1/AC4 test: many CLI and git starts, one for each value or case they check.
  - 0176 AC1 and AC2: they time and compare `speck status` on 200 builds' logs, which is the work itself.
- Follow-ups:
  - 0230 AC2 (10.4 s) still waits for runOnce's 10-second time limit and could stop once its builds have launched, as 0075 AC1 and 0100 AC3 now do. It wasn't in this ticket's list. Inbox: speck/ideas/2026-10-15-stop-0230-ac2-once-its-builds-have-launched.md

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
    "reviewed_sha": "442178f6868bafa14d0eec932bbecd74eacc42b8",
    "thread_id": "01a141bc-cb48-7082-b332-002f48a414c0",
    "seconds": 27,
    "usage": {
      "input_tokens": 148689,
      "cached_input_tokens": 99584,
      "cache_write_input_tokens": 0,
      "output_tokens": 942,
      "reasoning_output_tokens": 49
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T22:44:41.002Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "0176 AC3 uses idleCpu with pollMs: 1000; 0075 AC1 and 0100 AC3 use runUntilLaunched. The other listed tests exercise repeated CLI operations or deliberately slow board readings rather than waiting for speck limits."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "No production timing code changes. Passing 0232 AC2 tests check the default polling announcement and existing stall/review timeout values."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0232 AC3 mutation tests exercise excessive CPU consumption and incorrect launch ordering, demonstrating that the retained assertions reject those regressions."
      },
      {
        "id": 4,
        "status": "unclear",
        "evidence": "/tmp/speck-0232-tests.txt contains 52 passing tests from only the four relevant test files, not the whole suite required by the review protocol."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "/tmp/speck-0232-tests.txt",
        "issue": "Only targeted test results were supplied. They cannot establish that no previously passing test fails, especially because the shared startRun helper changed.",
        "suggested_fix": "Run the whole suite through speck test and supply its complete fresh output for the next review.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "minor",
        "file": "speck/tickets/0232-let-tests-shorten-the-waits-behind-the-slowest-tes.md",
        "issue": "The Delivery log does not explain why the other slow tests listed in Notes were left unchanged, as the ticket requests.",
        "suggested_fix": "Record which listed tests spend time on repeated operations or deliberately slow readings rather than speck limits.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Three tests now finish sooner while preserving their ordering and CPU checks. Production waits are unchanged. The targeted tests pass, but approval needs a whole-suite result to confirm that other tests still work."
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
    "reviewed_sha": "c1c58d0d3106390e5a8ea1bfb5f629704c00dffa",
    "thread_id": "01a141bc-cb48-7082-b332-002f48a414c0",
    "seconds": 16,
    "usage": {
      "input_tokens": 256124,
      "cached_input_tokens": 199680,
      "cache_write_input_tokens": 0,
      "output_tokens": 1565,
      "reasoning_output_tokens": 49
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T22:52:25.474Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "0176 AC3 uses a 1000 ms poll; 0075 AC1 and 0100 AC3 stop through runUntilLaunched. Passing 0232 AC1 tests exercise these changes. The Delivery log explains why the other listed tests remain unchanged."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Production timing code is unchanged. Passing 0232 AC2 tests verify default polling configuration and stall/review timeout values."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The changed tests retain CPU-budget and launch-order assertions. All three 0232 AC3 mutation tests pass, showing those assertions reject excessive CPU consumption and incorrect ordering."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0232-tests.txt: whole-suite totals are 2053 passed, zero failed and three skipped; all nine 0232 tests passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "/tmp/speck-0232-tests.txt",
        "issue": "The previous round supplied only targeted test results.",
        "suggested_fix": "Supply fresh whole-suite results.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "minor",
        "file": "speck/tickets/0232-let-tests-shorten-the-waits-behind-the-slowest-tes.md",
        "issue": "The previous Delivery log omitted reasons for leaving other listed slow tests unchanged.",
        "suggested_fix": "Document those reasons in the Delivery log.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Three tests now finish sooner while retaining checks for launch order and excessive CPU use. Production waits remain unchanged. The full suite passed with no failures, and both earlier findings are resolved."
  }
}
```

</details>
