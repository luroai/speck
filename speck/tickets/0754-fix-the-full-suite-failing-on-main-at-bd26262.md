---
id: "0754"
title: "Fix the full suite failing on main at bd26262"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-25
started: "2026-11-25T01:07:30.804Z"
approved: "2026-11-25T01:31:28.523Z"

---
# 0754 · Fix the full suite failing on main at bd26262

**Status:** 👍 approved

## Problem
The full suite fails on main at commit bd26262 (bd26262f02cf4a7a8d1b96dd8e47822d9d5edd83). Failing tests:
- 0476 AC2: a swipe moves the card with the finger and comes to rest on one whole card within 120 ms (0517); a flick changes lane however short, a slow drag past a quarter

## Outcome
The full suite passes on main again.

## Acceptance criteria
1. Each of these tests passes on main again: 0476 AC2: a swipe moves the card with the finger and comes to rest on one whole card within 120 ms (0517); a flick changes lane however short, a slow drag past a quarter.
2. No test that passed before this change fails.

## Out of scope
- Changes the failing tests don't need.

## Notes
<!-- Constraints, links and decisions. Optional. -->
Failing before this build: 0476 AC2: a swipe moves the card with the finger and comes to rest on one whole card within 120 ms (0517); a flick changes lane however short, a slow drag past a quarter (the recorded full-suite result at bd26262 keeps only its tail, which names no other failure)

Cause, from the failed full run's output at bd26262: in both the first run and its retry, 0476 AC2 failed at its slow drag past a quarter (and AC3, in the first run, at its quick scroll), because the browser dropped the gesture's touchend on all 3 of 0738's tries. Each time it was the first lifted gesture after a drag held down and lifted by hand, whose end nothing checked. Couldn't reproduce it here: not with Chromium's CPU throttling at 20-80x, 32-40 busy processes, or every browser test file at once. CDP refuses a touchCancel when it holds no touch and accepted every touchEnd sent, so the drop is past CDP and a cancel can't reset it. Fix, in the test helpers only: each try waits for the page to draw two frames (caught up) before it starts, each retry pauses 1 s longer first, and every drag held down and lifted by hand in 0476 has its end checked and retried, as 0738 did for two of them.
Self-check: found a fifth hand-lifted drag (0476 AC3, during a drag) whose end wasn't checked, and checked it too; a page that draws no frame within 30 s fails plainly with Chrome's own time-out message.
Pictures: none, because the ticket changes only tests.

## In plain words
Nothing changes in speck itself. One of the panel's swipe tests kept failing in the nightly full test run, because the test browser lost the moment a finger lifted when the machine was very busy. The test now waits for the page to catch up before each swipe, waits a little longer before trying again, and checks every swipe it makes, not just some. You'll see it once the next full run on main passes. If this test fails again in a full run, it means the browser is still losing touches under load, and it's worth looking at how busy the machine is during those runs.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 138,850
- Elapsed since build started: 24 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (Delivery log only):
- The dropped touchend wasn't reproduced here, so the cause is still unproven. If 0476 fails the same way again, record which events the page got (touchcancel as well as touchend) when a try is dropped, to tell Chromium's touch ack time-out apart from other causes.

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
    "reviewed_sha": "65c1d5c2530e96c9b5e3940c25695e7bc29ee89c",
    "session": "fresh",
    "thread_id": "01a21053-b972-7e12-ad53-ab7dfc0c4131",
    "builder_response": "- Tests run: test/touch-ends-0754.test.mjs test/touch-ends-0738.test.mjs test/panel-0476.test.mjs (with --related, which brought in nothing more; plus the commands.checks files)\n- Changes only test code: test/support/touch-ends.mjs, test/panel-0476.test.mjs and the new test/touch-ends-0754.test.mjs.\n- Cause, from the failed full run at bd26262 (speck/.cache/full/run.log): 0476 AC2 failed in the first run and in its retry at line 147, the slow drag past a quarter. The browser dropped the touchend on all 3 of 0738's tries. Every failure so far came right after a drag held down and lifted by hand. I couldn't reproduce it here with CPU throttling (20-80x), 32-40 busy processes or every browser test file at once, so the fix makes the recovery stronger rather than claiming a root cause. CDP refuses a touchCancel when it holds no touch and accepted every touchEnd we sent, so the drop happens past CDP, and cancelling first wouldn't reset anything.\n- Fix: delivered() takes a `ready(b, n)` hook, a no-op by default so 0738's stand-in tests are unchanged. 0476 passes steady(), which waits for the page to draw two frames before every try, and pauses 1 s, then 2 s, before the 2nd and 3rd tries. Every hand-lifted held drag in 0476 (5 of them, 3 of which nothing checked before) now runs inside delivered(), so a dropped end is retried there and not passed on to the next gesture.\n- AC1: 0476 AC2 passes, alone and under heavy CPU load (all of panel-0476 passed with 32 busy processes). AC2: the related run passes: 158 tests, none failing.\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 138325,
      "cached_input_tokens": 96000,
      "cache_write_input_tokens": 0,
      "output_tokens": 525,
      "reasoning_output_tokens": 23
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 42325,
      "cached": 96000,
      "write": 0,
      "output": 525
    },
    "cost_usd": 0.0995,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-25T01:31:18.243Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The named 0476 AC2 browser test passed without being skipped in /tmp/speck-0754-tests.txt. test/panel-0476.test.mjs retains its movement, distance, flick and settling assertions; steady() adds frame waits and retry pauses, while delivered() checks previously unchecked touch endings."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The recorded run reports 158 passed, 0 failed and 3 skipped, including panel-0476 and the existing 0738 retry tests. Changes are confined to gesture test helpers, their tests and the ticket record. The whole-suite regression check remains required at ship."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The change strengthens browser gesture tests by waiting for drawing to catch up and checking that held gestures end. Existing behaviour assertions remain intact, and the affected tests pass. The original intermittent failure was not reproduced, so the full-suite check before shipping remains important."
  }
}
```

</details>
