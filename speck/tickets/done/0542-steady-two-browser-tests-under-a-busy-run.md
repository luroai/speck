---
id: "0542"
title: "Steady two browser tests under a busy run"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-26-steady-two-browser-tests-under-a-busy-run.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-27T23:40:38.315Z"
approved: "2026-10-28T09:57:11.055Z"
finished: "2026-10-28T10:24:38.901Z"

---
# 0542 · Steady two browser tests under a busy run

**Status:** ✅ done

## Problem
Two browser tests fail when nearly the whole suite runs at once, as `speck test --related` does after a change to a shared test helper: 0372 AC2 (the dark look is kept after a reload) failed with "Inspected target navigated or closed" while reloading, and 0476 AC2 (the trackpad and arrow keys change lane in the same time) got `plan` where it expected `build`. Both pass on their own. A failure like this at `speck ship` hands a ticket back for nothing.

## Outcome
0372 AC2 and 0476 AC2 pass whether their files run alone or alongside the rest of the suite, and still fail if the behaviour they check breaks.

## Acceptance criteria
1. 0372 AC2 waits for the reloaded page to be ready before it reads the look, with a time limit, so a slow reload doesn't fail it.
2. 0476 AC2 waits for each lane change to finish, with a time limit, before it checks which lane is open or starts the next change, so a slow frame doesn't fail it.
3. Each still fails if the behaviour it checks breaks (the look isn't kept after a reload; the trackpad and arrow keys don't change lane): the Delivery log says how this was checked.
4. Each changed test file passes five runs in a row while the whole suite runs at the same time, and five runs of its file alone, recorded in the Delivery log.
5. No test that passed before this change fails.

## Out of scope
- Running tests one at a time, or other ways of changing how the suite schedules browser tests.
- 0540 and 0541.

## Notes
- From 0516's build: both failed under that load and passed alone every time; 0476 AC2 also failed on the base code alone once.
- Decided 2026-10-27: wait with a time limit rather than run these tests one at a time, as 0207 did for other chance failures.
- Failing before this build: none
- Neither failure came back on the base code: 30 runs of both tests while the whole suite ran, and runs with 40 busy CPU loops, all passed. The fixes go after the two ways each can fail under load. 0372 reloaded from the page's own script and then checked it with calls that fail while the page is changing over ("Inspected target navigated or closed"). It now marks the page, reloads through DevTools, and waits up to 10 s for the reloaded panel to be ready (test/support/reload.mjs), retrying only the errors a page gives while it changes over. 0476 read the lane as soon as it had sent the finger, scroll or key, so a page that hadn't taken it yet read as the lane before. It now waits up to 3 s for the expected lane's tab to open before it checks the slide and the card.
- Self-check: the quick tests of reload() first gave themselves 2 s, which a busy run can overrun, so they now allow 10 s and keep 300 ms only where the time limit itself is the check.

## In plain words
Nothing changes in speck itself. Two of speck's own checks on the panel, one that the dark look stays after reloading the page and one that the trackpad and arrow keys change lane, now wait for the page to catch up before they look, instead of failing when the computer is busy. That means fewer finished tickets sent back for nothing when they're tested before shipping. To see it, run those two checks while the rest of the tests run: they pass. Worth keeping an eye on: a few other timing checks still fail now and then on a busy machine, and those are listed as follow-ups.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 AC4 requires five concurrent passes for each changed test file, but the new reload test file has only standalone repeated-run evidence.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 417,986
- Elapsed since build started: 617 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- AC3, checked by breaking the panel for a moment and running each test (then putting it back). 0372 AC2 failed when the page no longer read the stored look on load (expected 'dark', got 'light'). The trackpad and arrow-key test failed when a sideways scroll changed no lane ("timed out waiting for a sideways scroll right changes lane once: shipped's tab to open"), when the arrow keys changed no lane ("… ← with the focus on nothing: plan's tab to open") and when a scroll changed two lanes at once ("… and back: build's tab to open"). Both 0476 AC2 tests failed when a swipe changed no lane.
- AC4, 2026-10-28: test/panel-0372.test.mjs (11 tests) and test/panel-0476.test.mjs (8 tests) each passed 5 runs out of 5 while `npm test` ran the whole suite at the same time, and 5 runs out of 5 alone. test/reload-0542.test.mjs passed 5 runs out of 5 alone.
- AC4, round 1 (F1), 2026-10-28: a second whole-suite run with all three files run 5 times each alongside it. test/reload-0542.test.mjs (3 tests), test/panel-0372.test.mjs and test/panel-0476.test.mjs each passed 5 runs out of 5. That whole-suite run had 3 failures in files this change doesn't touch: 0109 AC1, 0232 AC3 and 0384 AC3, the last two also failing on the base code under load.
- Follow-ups: 0232 AC3 and 0472 AC3 failed in busy whole-suite runs, both before and after this change: speck/ideas/2026-10-28-steady-0232-ac3-and-0472-ac3-under-a-busy-run.md. Skipped 0384 AC3, which ticket 0540 covers. The other one-off failures (0043 AC5, 0072, 0300, 0109 AC1, 0517 AC3, 0264 AC3, 0202) failed once each under extra load and aren't followed up.
- AC5: the whole-suite run that ran alongside them had 6 failures, all timing tests in files this change doesn't touch: 0472 AC3, 0043 AC5, 0072, 0300 AC1/AC3, 0232 AC3 and 0384 AC3. A whole-suite run on the base code under the same extra load had 6 too, three of them the same (0472 AC3, 0232 AC3, 0384 AC3), with 0517 AC3, 0264 AC3 and 0202 in place of the others. `speck test --related` for this change passed (130 tests, 0 failures).

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
    "reviewed_sha": "b43f71bfa9c5f5c60911d2a32e9a731f29409977",
    "session": "fresh",
    "thread_id": "01a181e9-d531-70a0-ae60-0df29d0ec017",
    "builder_response": "- Tests run: test/reload-0542.test.mjs test/panel-0372.test.mjs test/panel-0476.test.mjs, with `speck test --related` (which also ran the repo's quick checks).\n- Neither failure came back on the base code, so the fixes go after the ways each can fail under load. 0372: the reload came from the page's own script, and the calls after it could fail while the page changed over. It now reloads through DevTools and waits, up to 10 s, for the reloaded page (marked beforehand, so the old page never counts) to be ready, retrying only page-changing-over errors (test/support/reload.mjs, with quick fake-browser tests in test/reload-0542.test.mjs). 0476: settles() now waits up to 3 s for the expected lane's tab to open before the 120 ms slide check and the at-rest check, and the two reduced-motion checks do the same before atRest.\n- AC3 and AC4: how they were checked, and the results, are in the ticket's Delivery log. AC5: no file outside test/ changed. The whole-suite run that ran alongside had 6 timing failures in files this change doesn't touch, and the base code had a similar set under the same extra load (Delivery log).\n",
    "seconds": 48,
    "usage": {
      "input_tokens": 138035,
      "cached_input_tokens": 95744,
      "cache_write_input_tokens": 0,
      "output_tokens": 1132,
      "reasoning_output_tokens": 78
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 42291,
      "cached": 95744,
      "write": 0,
      "output": 1132
    },
    "cost_usd": 0.1054764,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-28T09:49:55.648Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/support/reload.mjs marks the old page, reloads through DevTools and polls for the new page's readiness with a deadline. test/reload-0542.test.mjs covers readiness, navigation errors and timeout; 0372 AC2 passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "test/panel-0476.test.mjs: settles() waits for the expected tab through opens(), then waits for the slide to end before atRest(). Reduced-motion changes also call opens(). Both AC2 browser tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The Delivery log records failures after deliberately breaking theme restoration, wheel navigation, arrow-key navigation and swipes. The tests retain assertions for the expected theme, lane and card position."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "The Delivery log and /tmp/speck-0542-alone.txt record five standalone passes for all three test files. /tmp/speck-0542-busy.txt records five concurrent passes for the two browser files only. The new test/reload-0542.test.mjs has only one evidenced whole-suite run."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The related run passed 130 tests with no failures. The branch changes only the intended tests, reload helper and ticket. Reported whole-suite failures concern untouched timing tests, with comparable failures under load on the base code; final whole-suite verification remains the ship gate."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0542-steady-two-browser-tests-under-a-busy-run.md",
        "issue": "AC4 requires five concurrent passes for each changed test file, but the new reload test file has only standalone repeated-run evidence.",
        "suggested_fix": "Run test/reload-0542.test.mjs five consecutive times while the whole suite runs concurrently, and record the results in the Delivery log.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The waits handle slow browser updates while retaining checks that catch broken behaviour. The two browser files passed the required repeated runs. One validation step remains: repeat the new reload helper tests five times while the whole suite is running and record the results."
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
    "reviewed_sha": "98bad1af1cd8e4aa30c34d9a7ea9e726afb18d0a",
    "session": "continued",
    "thread_id": "01a181e9-d531-70a0-ae60-0df29d0ec017",
    "builder_response": "- Tests run: test/reload-0542.test.mjs test/panel-0372.test.mjs test/panel-0476.test.mjs (with the repo's quick checks).\n- F1: fixed. Ran test/reload-0542.test.mjs, test/panel-0372.test.mjs and test/panel-0476.test.mjs 5 times each while a second whole-suite `npm test` ran alongside: 15 of 15 passed, each with the suite still running. Recorded in the ticket's Delivery log, with the 3 failures of that whole-suite run in untouched files (0109 AC1, 0232 AC3, 0384 AC3). No code changed this round.\n",
    "seconds": 28,
    "usage": {
      "input_tokens": 276930,
      "cached_input_tokens": 228608,
      "cache_write_input_tokens": 0,
      "output_tokens": 1889,
      "reasoning_output_tokens": 78
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 6031,
      "cached": 132864,
      "write": 0,
      "output": 757
    },
    "cost_usd": 0.0329184,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-28T09:56:50.907Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/support/reload.mjs waits for the new page to load and satisfy the readiness check, with a deadline and retries for navigation errors. Passing tests in test/reload-0542.test.mjs cover readiness, retries and timeout; 0372 AC2 checks dark after reload."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "test/panel-0476.test.mjs: settles() waits for the expected tab through opens(), then for the slide to end before checking the card. Reduced-motion changes also use opens(). Both AC2 browser tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The Delivery log records deliberate failures when theme restoration, wheel navigation, arrow-key navigation and swipes were broken. The corresponding assertions remain unchanged this round."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The Delivery log records five standalone and five concurrent passes for all three changed test files. /tmp/speck-0542-busy2.txt confirms all 15 concurrent runs passed while the whole suite was still running."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The fresh review run passed 130 tests with zero failures and three skips. No test code changed this round. Concurrent whole-suite failures concern untouched files; final whole-suite verification remains the ship gate."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0542-steady-two-browser-tests-under-a-busy-run.md",
        "issue": "The new reload test file previously lacked five concurrent-run results required by AC4.",
        "suggested_fix": "Completed: five concurrent passes are now recorded in the Delivery log and supported by /tmp/speck-0542-busy2.txt.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The browser tests now wait for slow reloads and lane changes while retaining checks that catch broken behaviour. All three changed test files passed the required repeated runs, including under concurrent suite load. The missing validation is complete; no blocking findings remain."
  }
}
```

</details>
