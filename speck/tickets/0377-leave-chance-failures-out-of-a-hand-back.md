---
id: "0377"
title: "Leave chance failures out of a hand-back"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-17-leave-chance-failures-out-of-a-hand-back.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0375"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T23:50:24.194Z"
approved: "2026-10-22T23:54:51.351Z"

---
# 0377 · Leave chance failures out of a hand-back

**Status:** 👍 approved

## Problem
When a ship's tests fail and some of those tests pass on a second try, the ship still names the ones that passed. With the base branch's own tests failing, that alone can hand the ticket back to its build to fix a test that isn't broken.

## Outcome
A test that fails once and passes on the second try is not named as the ticket's own failure, and is not what hands the ticket back.

## Acceptance criteria
1. When a ship's tests fail, the failing tests' files are run once more, and a test that failed passes on that second try, the ship's refusal does not name that test, and that test is not a reason speck run hands the ticket back to its build.
2. A test that fails on both tries is still named, and still hands the ticket back when the base branch's tests pass, or when that test passes on the base branch, as it does today.
3. When every test that failed the first time passes on the second try, the ship counts the run as passed, as it does today.
4. No test that passed before this change fails.

## Out of scope
- How many times a failing file is retried.
- A test run that isn't a ship's.

## Notes
- Checked 2026-10-22: `testRun` in `scripts/results.mjs` counts a retry that passes altogether as a pass (0195). A retry that doesn't is appended to the first run's output, and `failingTests` in `scripts/tap.mjs` lists every test that isn't ok in that output. `testFailure` in `scripts/ship.mjs` names that list and, with `together`, makes speck run hand the ticket back (0264).
- Waits for 0375 so it ships in 0.13.1, not in 0.13.0. It changes `scripts/ship.mjs`.
- Failing before this build: none
- Self-check: a test command running two suites prints two TAP headers in one run, so the second try is now marked by the line saying it ran the failing files once more, rather than found by its header; added a test that two suites' failures are all still named.

## In plain words
When a ship's tests fail, speck runs the failing ones once more. A test that passes on that second try is now treated as a chance failure: the ship no longer names it, and speck run no longer sends the ticket back to its build to fix it. So when the main branch's own tests are failing, a ticket isn't sent back just because one of its tests stumbled once; the main branch is named as the cause instead. Tests that fail both times are still named and still send the ticket back, as before. To see it, look at a refused ship's message: only tests that failed twice are listed. Worth keeping an eye on: a test that passes on the second try while another test fails both times isn't added to the record of flaky tests, as before, so it can go unnoticed.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 134,033
- Elapsed since build started: 4 min
- Changed lines: 35 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none. Known limit: when a second try leaves some tests failing, the ones that passed on it aren't written to the flaky log (unchanged by this ticket).

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
    "reviewed_sha": "45bfe43d6d1175f830d5a535523b6a74d02661e5",
    "session": "fresh",
    "thread_id": "01a16609-57f6-7db0-8851-913671bbfac8",
    "builder_response": "- Tests run: test/ship-0377.test.mjs test/retry-0195.test.mjs test/retry-0228.test.mjs test/ship-0212.test.mjs test/review-0241.test.mjs test/tap-0209.test.mjs test/tap-0221.test.mjs test/ship-0264.test.mjs (the ticket's own file, plus the existing files about the second try, its summary and 0264's hand-back; none of them changed). The commands.checks files run with every `speck test --files`.\n- Round 1: the full run's output now keeps the second try's output after the line saying the failing files ran once more (RETRY_NOTE), and failingTests leaves out a first-run failure that passed on that second try, counting passes per name. Splitting on that line rather than a second TAP header keeps a test command that runs two suites from being mistaken for a retry (self-check).\n",
    "seconds": 27,
    "usage": {
      "input_tokens": 133151,
      "cached_input_tokens": 92160,
      "cache_write_input_tokens": 0,
      "output_tokens": 882,
      "reasoning_output_tokens": 82
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T23:54:37.905Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/results.mjs marks the retry boundary; scripts/tap.mjs failingTests removes first-run failures covered by retry passes. Passing AC1 tests cover partial recovery, duplicate names, multiple suites and avoiding hand-back when main fails."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "failingTests retains persistent failures. Both passing AC2 ship tests verify exit 16 and naming the persistent test when main passes altogether or passes that particular test."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "testRun preserves the existing successful-retry handling. The passing AC3 test verifies ship exits successfully and the feature reaches the fixture's main branch."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The recorded run reports 178 passed, 3 skipped and no failures across 181 tests. Existing retry, TAP and ship tests were included; inspection found no unrelated changes or weakened tests."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Tests that pass on retry are now left out of shipping failure reports and no longer wrongly send a ticket back for repair. Persistent failures still trigger repair, and a fully successful retry still allows shipping. The targeted tests pass, with no blocking concerns found."
  }
}
```

</details>
