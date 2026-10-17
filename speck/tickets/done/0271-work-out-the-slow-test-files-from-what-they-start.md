---
id: "0271"
title: "Work out the slow test files from what they start"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T10:57:50.396Z"
approved: "2026-10-17T11:00:16.676Z"
finished: "2026-10-17T11:02:16.159Z"

---
# 0271 · Work out the slow test files from what they start

**Status:** ✅ done

## Problem
Test files that start a real panel, a browser or `speck run` must be listed by hand in `test/support/heavy.mjs`, and a test (0233 AC1) fails when one isn't. Builders don't run that test, so they forget, and the ticket is handed back at ship time. Every such ticket also adds to the same list, so tickets built side by side conflict there. On 2026-10-17 this handed back 0258, 0261 and 0268, and caused 0268's merge conflict.

## Outcome
The test runner works out which test files are heavy from what they start, so there's no list to keep up to date and nothing to forget.

## Acceptance criteria
1. `npm test` treats as heavy every test file that starts a real panel, a browser or `speck run`, found from the file's own code the way 0233 AC1's check finds them today, and only those files.
2. A new test file that starts a real panel is treated as heavy without any other file being changed.
3. On a machine with 8 cores or fewer, the heavy files still run at most 2 at a time beside the others, and with more cores they run with no limit of their own, as today.
4. No hand-kept list of heavy test files is left, and no test checks one.
5. No test that passed before this change fails, apart from those that checked the hand-kept list.

## Out of scope
- Changing which helpers count as starting a real panel, browser or `speck run`.
- Changing how many heavy files run at once.

## Notes
- Today's list is `HEAVY` in `test/support/heavy.mjs`, used by `runSuite` in `test/support/suite.mjs`. The check is the 0233 AC1 test in `test/suite-0233.test.mjs`, which finds the files with a pattern of helper names.
- Failing before this build: none
- Self-check: no changes. Compared the files found from their code with the old list on this repo: the same 94, apart from `test/build-log-0176.test.mjs` and `test/panel-0190.test.mjs`, which the old list named by hand. They start `speck run` or a panel only through other support helpers (`idleCpu`, `onPhone`), which the pattern doesn't name, so they're no longer heavy. Naming more helpers is out of scope; saved as a follow-up.

## In plain words
speck's own tests no longer need a hand-kept list of the slow tests that open a panel, a browser or `speck run`. The test runner now spots them by reading each test, so a new slow test is handled without anyone adding it to a list, and tickets built side by side no longer clash over that list or get handed back for forgetting it.

To see it, add a test that opens a panel and run the tests on a machine with 8 cores or fewer: it runs with the other slow tests, at most 2 at a time, with no other change.

Worth keeping an eye on: two existing slow tests open a panel or `speck run` in a roundabout way that isn't spotted, so they now run as ordinary tests. A follow-up to catch them is in the inbox.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 108,416
- Elapsed since build started: 2 min
- Changed lines: 0 (limit 5000)
- Follow-ups:
  - Inbox: speck/ideas/2026-10-17-count-tests-that-start-a-panel-through-another-helper-as-heavy.md (`test/panel-0190.test.mjs` and `test/build-log-0176.test.mjs` start a panel or `speck run` through `onPhone` or `idleCpu`, so they're no longer heavy).

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
    "reviewed_sha": "aebe960c43bfa02b5a7092e50019cd92df1e3bf9",
    "thread_id": "01a14984-7a92-7e83-bf8d-3d1dbcdba88a",
    "seconds": 20,
    "usage": {
      "input_tokens": 107667,
      "cached_input_tokens": 74624,
      "cache_write_input_tokens": 0,
      "output_tokens": 749,
      "reasoning_output_tokens": 15
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T11:00:00.885Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/support/heavy.mjs heavyFiles uses the exact former 0233 helper pattern. runSuite uses it by default. Passing 0271 AC1 tests cover every helper, exclusions and repository examples."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0271 AC2 AC3 test creates new fixture files calling startPanel and runs the real runner without supplying a heavy list; automatic classification limits their concurrency."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "heavyLimit and scheduling remain unchanged. Passing 0233 tests cover core-count boundaries; passing 0271 integration tests verify automatic detection, two heavy files alongside other files at 8 cores, and ordinary concurrency at 16 cores."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The HEAVY list and its two checking tests are removed. docs-0267 uses STARTS instead. Passing 0271 AC4 test checks exports and remaining test references."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0271-tests.txt: all 13 tests across the three required files passed. Existing scheduling, failure reporting and document tests remain covered; no unrelated changes found."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The runner now identifies heavy test files automatically using the existing helper pattern, removing the manual list while preserving concurrency limits. All 13 targeted tests passed. Two files lose their previous manual classification because they use indirect helpers outside the ticket’s detection rule; this matches the agreed scope."
  }
}
```

</details>
