---
id: "0655"
title: "Say under Needs you when the full suite fails on the base branch"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-11-say-in-the-panel-what-a-failing-full-suite-is.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T15:39:36.068Z"
approved: "2026-11-11T16:05:21.992Z"

---
# 0655 · Say under Needs you when the full suite fails on the base branch

**Status:** 👍 approved

## Problem
When the full suite fails on the base branch, the panel's bar says Needs you and counts it, but nothing in the panel says what it is: Build's Needs you group shows no ticket for it. On 2026-11-11 it looked like a ticket already dealt with was still counted.

## Outcome
When the full suite fails on the base branch, Build's Needs you group shows it as a row of its own saying so.

## Acceptance criteria
1. While the latest full run (`commands.test_full`) on the base branch failed and counts under Needs you, Build's Needs you group has a row for it, with the orange dot, saying the full suite fails on the base branch, the commit's short id and how many tests fail.
2. Pressing the row opens a view naming each failing test, when the output is TAP, the commit, when it ran and where its log is, with a back link.
3. Once a full run on a newer commit passes, the row goes, as the count under Needs you does.
4. The row fits a phone-width panel in the light and the dark look.

## Out of scope
- The bridge's count: `speck/ideas/2026-11-11-count-a-failing-full-suite-on-the-bridge.md`.

## Notes
- From 0630's follow-up note. `speck status` already prints the line; `speck status --json` should give the panel the same.
- Failing before this build: none
- Self-check: no changes. Rows that walk Build's list for tickets (ticketRows, the hover and go-to code) look for a ticket id the full suite's row doesn't have, so they leave it alone.
- `speck test --related` also fails `test/foreman-0285.test.mjs` (two Settings switch tests) and `test/usage-limit-0622.test.mjs` (one test), which fail the same way on main without this change, so they're left as they are.

## In plain words
When the full suite fails on the main branch, the Build lane now lists it under Needs you as a row of its own, with an orange dot, the commit it failed on and how many tests fail, so the Needs you count always matches something you can see. Pressing the row opens a page naming each failing test, the commit, when the run happened and where its log is, with a link back to Build. The row goes by itself once a full run on newer work passes. To see it, set a full suite command, let speck run run it on main while a test fails, and look under Needs you in Build. Worth keeping an eye on: when the full suite's output isn't in the usual test format, the row gives the run's exit code instead of a test count, and the page says to look in the log.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 432,918
- Elapsed since build started: 26 min
- Changed lines: 125 (limit 5000)
- Follow-ups:
  - The two 0285 AC3 Settings switch tests fail on main: `speck/ideas/2026-11-11-fix-the-0285-settings-switch-tests-on-main.md`.
  - Skipped: "0622 AC1 AC2 AC3: a build that hit the limit while speck run was off…" fails on main too, already covered by ticket 0654.
  - "0630 AC3: a full run doesn't wait for the max_parallel_tests turns…" failed once at ship while the whole suite ran, though it takes ~150 ms of its 900 ms limit when run alone: a timing check that can fail under load.
  - The bridge doesn't count a failing full suite yet: out of scope here, already `speck/ideas/2026-11-11-count-a-failing-full-suite-on-the-bridge.md`.

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
    "reviewed_sha": "9312d1e180ed97746545c2d14e96ffdcd6afefbb",
    "session": "fresh",
    "thread_id": "01a1cb4d-0983-7f91-b788-2fb788602217",
    "builder_response": "- Tests run: `speck test --related test/full-suite-panel-0655.test.mjs` (the ticket's own test file, the `commands.checks` files and the 174 related test files it chose).\n- The ticket's own tests all pass, including the two real-browser tests at 320 px (AC4) in the light and the dark look.\n- `test/foreman-0285.test.mjs` (two Settings switch tests) and `test/usage-limit-0622.test.mjs` (one test) fail in this run. They fail the same way on main without this change (checked in a separate checkout of main), so they're not from this build and are left alone; noted in the ticket's Notes.\n- Pictures of the row and its view, in both looks, are kept with the review pack.\n",
    "seconds": 35,
    "usage": {
      "input_tokens": 264085,
      "cached_input_tokens": 215296,
      "cache_write_input_tokens": 0,
      "output_tokens": 724,
      "reasoning_output_tokens": 45
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 48789,
      "cached": 215296,
      "write": 0,
      "output": 724
    },
    "cost_usd": 0.1263476,
    "tests": {
      "failing": 3,
      "second_try": []
    },
    "saved_at": "2026-11-11T15:50:20.407Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel.js adds fullSuiteRow() under Needs you. Passing 0655 AC1 tests cover the orange dot, short commit id, failure count and coexistence with tickets."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "renderFullSuite() shows failing test names, commit, run time, log path and back link. Passing 0655 AC2 tests exercise opening, details, returning and Escape."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0630 AC2 test exercises a newer commit passing and clearing the failure record/count. Passing 0655 AC3 tests cover removing the panel row and closing its view."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Both 0655 AC4 browser tests passed at 320 px in light and dark themes, checking row bounds, orange dot and detail-view overflow."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel now explains the failing full suite under Needs you and opens its details. The row clears when the failure clears, and phone-width checks pass in both themes. The three reported test failures are unrelated to this change."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "910e42a31efca2b6043563a2de9292fad67f8c2b",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1cb4d-0983-7f91-b788-2fb788602217",
    "builder_response": "Merge round after ship exit 16 (\"Tests fail together\").\n- Merged main into the ticket branch (`git merge main`, no conflicts, no files resolved).\n- Failing test at ship: \"0630 AC3: a full run doesn't wait for the max_parallel_tests turns, so it takes none a ship or build waits for\" (test/full-suite-0630.test.mjs:121). It asserts that `runFull` finishes in under 900 ms while a test turn is held. This ticket doesn't change `runFull` or the turns: its only changes to scripts/full-suite.mjs add `at` to `latestFull`'s result and `log` to the queue's view. On the merged branch the test passes alone three times in a row at ~150 ms, and in the full file run below. So I read the ship failure as a timing failure while the ship's whole suite ran at once, not as a failure this change causes. Nothing was changed, and no test was weakened.\n- Tests run: test/full-suite-0630.test.mjs test/full-suite-panel-0655.test.mjs (with the commands.checks files): 133 pass, 0 fail, 3 skipped.\n",
    "seconds": 18,
    "usage": {
      "input_tokens": 431784,
      "cached_input_tokens": 358912,
      "cache_write_input_tokens": 0,
      "output_tokens": 1134,
      "reasoning_output_tokens": 45
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 24083,
      "cached": 143616,
      "write": 0,
      "output": 410
    },
    "cost_usd": 0.0666276,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T16:05:17.886Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel.js inserts fullSuiteRow() under Needs you; passing 0655 AC1 tests verify the orange dot, short commit id, failure count and grouping."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "renderFullSuite() displays failing tests, commit, run time and log path. Passing 0655 AC2 tests exercise opening the view, its details, back link and Escape."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The 0630 AC2 test covers clearing the failure after a newer commit passes; passing 0655 AC3 tests verify removal of the row and count and closure of the view."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Both 0655 AC4 browser tests pass at 320 px in light and dark themes, checking row bounds, dot colour and detail-view overflow."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The merged change still meets all four criteria. All 133 tests run passed, including the previously failing timing test. That test and the execution code it exercises were unchanged; the evidence supports an intermittent timing failure during shipping. No merge regressions or blocking concerns found."
  }
}
```

</details>
