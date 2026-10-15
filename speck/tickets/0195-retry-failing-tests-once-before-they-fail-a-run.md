---
id: "0195"
title: "Retry failing tests once before they fail a run"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
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
started: "2026-10-15T10:34:23.148Z"

---
# 0195 · Retry failing tests once before they fail a run

**Status:** 🔍 reviewing

## Problem
A test that fails once by chance fails the whole run: it cost 0164 a review round and can stop a ship, and then someone has to step in although nothing is wrong with the change.

## Outcome
When a full test run fails, speck runs the failing tests' files once more, and tests that pass the second time don't fail the run but are reported as flaky.

## Acceptance criteria
1. When a full test run through speck fails (`speck test` without `--files`, or the tests `speck ship` runs), speck runs `commands.test_files` once more with only the files that had a failing test, taken from each failing test's `location:` in the output. If every test passes in that second run, the run counts as passed: `speck test` exits 0 and `speck ship` carries on.
2. If any test fails in the second run, the run fails exactly as it does today, and its output is the first run's output followed by the second run's.
3. The output of a run that passed only on the second try ends with a line `Flaky: <test name>; <test name>…` naming each test that failed and then passed, and the same tests are added, with the time and the branch, to one log every worktree of the repo shares.
4. There's no second run, and the run fails as today, when `commands.test_files` is blank, when any failing test has no `location:` in a test file, or when the run stalled.
5. No test that passed before this change fails.

## Out of scope
- Quarantining or skipping flaky tests, or fixing them.
- Showing flaky tests in the panel.
- Retrying `speck test --files` runs.

## Notes
- Asked for 2026-10-15, with 0193 and 0194, to stop chance failures needing the user.
- Checked 2026-10-15: `node --test` with output that isn't a terminal writes TAP, and a failing test's details include `location: '<absolute path>:<line>:<col>'` (Node v22.23.3, tried on a one-test file).
- `scripts/results.mjs` `testRun` is shared by `speck test` and `speck ship`; `scripts/tap.mjs` `failingTests` already reads failing test names from the output.
- A result that passed only on the second try may be recorded as a pass for reuse.
- Failing before this build: none
- The second run counts as passed only if it exits 0 and every test that failed is among the tests that passed in it, so a location in a helper file that runs no tests of its own can't turn a failure into a pass.
- Self-check: a location whose path can't be read (for example through a file) no longer throws; added a test for a commands.test_files with no {files}.

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
    "reviewed_sha": "d4737efab89bc7c5418e4b8ed876c12fe161c2e9",
    "thread_id": "01a13f2a-acf8-7932-a3e5-ce021ca8ff97",
    "seconds": 38,
    "usage": {
      "input_tokens": 149514,
      "cached_input_tokens": 119936,
      "cache_write_input_tokens": 0,
      "output_tokens": 1198,
      "reasoning_output_tokens": 132
    },
    "saved_at": "2026-10-15T10:46:01.561Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "The AC1 tests cover ordinary retries and shipping, but scripts/tap.mjs failingTestFiles deduplicates by test name. Two failing files with the same test name produce only one file, so not every failing file is retried."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The AC2 tests cover persistent failures and absent tests. However, scripts/results.mjs retry matches passing tests by name alone, allowing an omitted failure with the same name to be counted as passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The AC3 worktree test verifies the final Flaky line, timestamps, branch names, shared log location and reuse of the passing result."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "The AC4 tests cover blank commands, missing locations and stalls. A read-only parser reproduction showed that a failure without a location disappears when another failure has the same name and a location, allowing a retry despite this criterion."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The full /tmp/speck-0195-tests.txt records 1750 tests with one initial timing failure; that test passed in the retry. The run ended with the expected Flaky line. Existing tests were not weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/tap.mjs",
        "issue": "failingTestFiles keys failures only by their name path, discarding distinct failures with identical names. I verified that failures named 'same name' in a.test.mjs and b.test.mjs return only a.test.mjs. If that file passes on retry, retry's name-only check declares the whole run passed without rerunning b.test.mjs. A same-named failure without a location is also discarded. This can allow shipping while a real failure remains unchecked.",
        "suggested_fix": "Preserve every failing occurrence and its location, reject retry when any occurrence lacks a valid location, and verify retry success using identities that distinguish files and repeated test occurrences. Add regression tests for identical names across files and for a same-named failure with no location.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The normal retry and shared logging paths work, and the full suite passed after retrying a timing failure. However, tests with identical names can hide an unchecked failure and incorrectly allow shipping. Fix that before merge."
  }
}
```

</details>
