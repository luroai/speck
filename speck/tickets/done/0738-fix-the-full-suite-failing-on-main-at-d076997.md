---
id: "0738"
title: "Fix the full suite failing on main at d076997"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
created: 2026-11-24
started: "2026-11-24T17:20:01.222Z"
approved: "2026-11-24T17:54:04.690Z"
finished: "2026-11-24T18:02:36.075Z"

---
# 0738 · Fix the full suite failing on main at d076997

**Status:** ✅ done

## Problem
The full suite fails on main at commit d076997 (d0769975d1b676fbe16dd34f129c4d283d9cf059). Failing tests:
- 0058 AC3 and AC4: in a real browser the counter ticks between polls, and a selection in or across it stays
- 0476 AC2: a sideways scroll on a trackpad and the arrow keys change lane in the same time; with reduced motion, without sliding
- 0476 AC4: at 390 px the column is at most 720 px wide, centred, with one lane in view, and a swipe slides between them

## Outcome
The full suite passes on main again.

## Acceptance criteria
1. Each of these tests passes on main again: 0058 AC3 and AC4: in a real browser the counter ticks between polls, and a selection in or across it stays, 0476 AC2: a sideways scroll on a trackpad and the arrow keys change lane in the same time; with reduced motion, without sliding, 0476 AC4: at 390 px the column is at most 720 px wide, centred, with one lane in view, and a swipe slides between them.
2. No test that passed before this change fails.

## Out of scope
- Changes the failing tests don't need.

## Notes
<!-- Constraints, links and decisions. Optional. -->
Failing before this build: none (the recorded quick-suite result at 5378f9e passed; the full suite's failures are the ones this ticket names)
Causes, from the failed full run's output at d076997: 0058 AC3/AC4 selected `9 ` where it expected two digits, as two ticks of the counter reach 10 min only when the real clock had already passed the 8th minute; 0476 AC2 and AC4 timed out waiting for a lane to open after a swipe. Reproduced the 0476 ones with Chromium's CPU throttling (30-60x): Chromium drops the last moves and the touchend of a gesture altogether (none arrive 20 s later), so the page never sees the finger lift. That's the browser giving up on a starved page, not the panel, so the touch helpers now check the page got each gesture's touchend and do the gesture again when it didn't (up to 3 tries, then a plain failure). Pacing each event to the page didn't help.
Self-check: bounded the 0058 loop to 3 more ticks, so a counter that never reaches two digits fails at the assertion rather than looping; the touchend counter is added for every page loaded in the tab too, so 0476's refresh test keeps it.
Pictures: none, because the ticket changes only tests.

## In plain words
Nothing you use changes: only tests were touched. The full test suite on main was failing by chance on a busy machine. One check assumed a build's minute counter would reach two digits after two ticks, which depends on how quickly it started. Others swiped between lanes in a real browser that, when starved of time, silently threw away the end of the swipe, so the panel never saw the finger lift. Those swipe checks now notice when the browser dropped a swipe and try it again, up to three times. A swipe that reaches the panel and is handled wrongly still fails. To see it, the full suite on main should pass after this lands. Worth watching: on an extremely overloaded machine the browser can drop a swipe three times running, and that check still fails, saying so plainly.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 127,831
- Elapsed since build started: 34 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (known limits, not inbox ideas):
- 0476 AC3's two touch tests and AC2's first slow drag still end some gestures by hand without the touchend check; they weren't failing here, so they're unchanged. Wrap them with delivered() if they start failing the same way.
- A touchend that arrived after the 10 s wait would land after the redone gesture and could change lane twice. In the throttled runs a dropped end never arrived, even 20 s later.

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
    "reviewed_sha": "a784d7cb6cac3b77765d198268f5eb6d5e731991",
    "session": "fresh",
    "thread_id": "01a20eb1-03b8-7ad1-b6dc-8d13f1e2899f",
    "builder_response": "- Tests run: test/touch-ends-0738.test.mjs test/panel-0058.test.mjs test/panel-0476.test.mjs (with --related; the repo's checks ran too)\n- Causes are taken from the failed full run's own output at d076997 (speck/.cache/results). 0476's were reproduced with Chromium's CPU throttling at 30-60x: Chromium drops a gesture's last moves and its touchend outright, so the page never sees the finger lift. The fix redoes a gesture only when the page got no touchend for it. A gesture the page received but handled wrongly still fails as before. Details in the ticket's Notes.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 127184,
      "cached_input_tokens": 101760,
      "cache_write_input_tokens": 0,
      "output_tokens": 647,
      "reasoning_output_tokens": 24
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 25424,
      "cached": 101760,
      "write": 0,
      "output": 647
    },
    "cost_usd": 0.067494,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T17:53:53.523Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The full output in /tmp/speck-0738-tests.txt confirms all three named browser tests passed without skips. panel-0058 retains its selection and incremental-update assertions; panel-0476 retains lane, motion and layout assertions. delivered() retries only when no touchend reached the page."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The recorded run passed 163 tests with zero failures and three skips. Changes are confined to the affected tests, their touch-delivery helper and ticket records. The new helper tests verify successful delivery, retries and failure after three dropped ends; product code is unchanged."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The change fixes unreliable browser test setup while preserving the checks on counter selection, swiping and layout. All three previously failing tests passed, and the recorded run had no failures. Touch retries are bounded and do not retry a swipe whose end reached the page but was handled incorrectly."
  }
}
```

</details>
