---
id: "0112"
title: "Reuse a test run's result when the code hasn't changed"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-one-build-at-a-time.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T09:59:34.988Z"

---
# 0112 · Reuse a test run's result when the code hasn't changed

**Status:** 🔍 reviewing

## Problem
A build runs the whole test suite (about 100 seconds here) six or seven times, including its ship, which is 10–12 minutes of a 15–20 minute build. Some of those runs test code that has already been tested unchanged: with one build at a time, the last ship has just run the suite on the base branch the build starts from, and a ship often re-tests exactly what the builder's last run tested.

## Outcome
`speck test` and `speck ship` reuse a passing or failing result for code that has already been tested, instead of running the suite again.

## Acceptance criteria
1. When `speck test` or `speck ship` runs the suite with no uncommitted changes outside `speck/`, speck records the result: pass or fail, the failing tests' output, and the test command, against the commit's files outside `speck/`. No result is recorded when there are uncommitted changes outside `speck/`.
2. `speck test` with no uncommitted changes outside `speck/`, whose files outside `speck/` match a recorded result for the same test command, prints that result and exits with its exit code without running the suite. It says in one line that the result is reused, and from which commit and when.
3. `speck ship`'s test run reuses a recorded passing result the same way, saying so in one line. A recorded failure is never reused by ship: it runs the suite.
4. `speck test --fresh` always runs the suite, and records its result as in AC1.
5. A change to any file outside `speck/`, or to `commands.test`, means no result is reused.

## Out of scope
- Running only some tests (0113).
- Reusing results across machines or clones.

## Notes
- Excluding `speck/` matters because ticket commits change only `speck/`, so a ship's merge after the user has committed tickets still matches the builder's last run.
- Known risk: a test that reads files under `speck/` (as some tests in this repo do) could reuse a result that would now differ. `--fresh` is the way out; the builder should list any such tests it finds as a follow-up.
- Failing before this build: none
- Self-check: no changes. Checked repeated and unknown flags, unreadable or partial recorded results, files changing during a run, a run stopped before the tests end (nothing recorded), and that every claim added to the brief has a test.
- Tests here that read files under `speck/` (and so could reuse a stale result): test/luro-0082.test.mjs (speck/tickets/done), test/product-0068.test.mjs (speck/product.md), test/speck.test.mjs (speck/config.yml). Listed as a follow-up.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Follow-ups:
- Tests that read files under `speck/` could reuse a stale result: saved to the inbox as speck/ideas/2026-10-11-stop-tests-depending-on-files-under-speck.md.
- Known limit: when a result can be recorded, the test command's output is copied through `tee`, so its stderr comes out on stdout and it no longer writes to a terminal (a test runner may switch to plainer output, such as node's TAP rather than its spec reporter). Runs with uncommitted changes outside `speck/` are unchanged.
- Known limit: changes to git-ignored files (such as installed dependencies) don't count as changes, so they can reuse a result; `speck test --fresh` runs the suite.

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
    "reviewed_sha": "6a03add72b685b2cd146a1cc61ee8432e8c6673d",
    "thread_id": "01a12a6e-879d-78b3-83f2-d6ac075b284f",
    "seconds": 41,
    "usage": {
      "input_tokens": 435986,
      "cached_input_tokens": 321920,
      "cache_write_input_tokens": 0,
      "output_tokens": 1072,
      "reasoning_output_tokens": 122
    },
    "saved_at": "2026-10-11T10:08:10.093Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/results.mjs:testRun records only statuses <=128. A normally completed command such as `exit 200` therefore records nothing. The AC1 tests cover exit codes 0 and 3, but miss this case."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "test/results-0112.test.mjs exercises reuse of recorded passes and failures, output and exit-code replay, commit/time reporting, and sharing between worktrees. Builder output reports these tests passing."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/ship.mjs:runTests requests reuse:'pass'. The two AC3 integration tests verify passing-result reuse and rerunning after a recorded failure; both passed in the supplied output."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/turns.mjs:cmdTest maps --fresh to reuse:'none'. The AC4 integration test verifies forced execution and subsequent reuse of its recorded result; it passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "scripts/results.mjs:testedCode hashes the test command and Git tree entries outside speck/, and rejects dirty checkouts. AC5 tests exercise committed file changes, nested additions and command changes; AC1 tests exercise tracked and untracked edits. All passed in the supplied output."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/results.mjs:77",
        "issue": "Exit codes above 128 do not necessarily indicate a signal. A test command can finish normally with `exit 200`, but testRun's status<=128 condition prevents recording that failure, violating AC1 and causing unchanged subsequent runs to execute again.",
        "suggested_fix": "Distinguish actual signal termination from normal completion rather than inferring it from the numeric exit code. Add an integration test showing that a normally completed failure above 128 is recorded and reused with its output and exit code, while interrupted runs remain unrecorded.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change reuses test results for unchanged code, and the main behaviour has meaningful passing tests. One edge case needs fixing: some normally completed failures are mistaken for interrupted runs and never saved. No unrelated changes or weakened tests were found. Verification was read-only; the suite results are from the supplied builder output."
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
    "reviewed_sha": "dabe9cd8488b43ccee9d203581aede4de56f6802",
    "thread_id": "01a12a6e-879d-78b3-83f2-d6ac075b284f",
    "seconds": 26,
    "usage": {
      "input_tokens": 819955,
      "cached_input_tokens": 625408,
      "cache_write_input_tokens": 0,
      "output_tokens": 1819,
      "reasoning_output_tokens": 158
    },
    "saved_at": "2026-10-11T10:11:27.829Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/results.mjs:testedCode and testRun record completed results only when files outside speck/ are clean and unchanged. scripts/turns.mjs now distinguishes numeric exit codes from signals. AC1 integration tests cover passes, failures, dirty files, changes during execution, ship recording, exit 200 and SIGTERM; all passed in the supplied output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/results.mjs:testRun replays recorded output and status and prints one reuse line naming the commit and time. Integration tests verify passes, failures including exit 200, and reuse across worktrees without another suite execution; all passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/ship.mjs:runTests uses reuse:'pass'. AC3 integration tests verify passing-result reuse with one announcement and execution after a recorded failure; both passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/turns.mjs:cmdTest uses reuse:'none' for --fresh. The AC4 integration test verifies forced execution and recording for subsequent reuse; it passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "scripts/results.mjs:testedCode includes the test command and all Git tree entries outside speck/ in the cache key, and rejects dirty checkouts. Integration tests cover file changes, nested additions, command changes and tracked/untracked edits; all passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/results.mjs:testRun",
        "issue": "Resolved: normally completed failures above exit code 128 are now recorded, while actual signal termination is handled separately.",
        "suggested_fix": "Implemented and covered by integration tests for exit 200 reuse and SIGTERM without recording.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The change meets all five criteria and is ready for merge consideration. The previous exit-code issue is fixed with meaningful regression tests. The supplied suite reports 982 passes, no failures and three skips. I verified the current code read-only; I did not rerun the suite. The ticket's acknowledged risk remains: tests reading files under speck/ may need --fresh."
  }
}
```

</details>
