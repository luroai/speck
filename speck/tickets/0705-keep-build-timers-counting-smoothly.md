---
id: "0705"
title: "Keep build timers counting smoothly"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "quick"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-keep-build-timers-counting-smoothly.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T12:18:40.929Z"
approved: "2026-11-24T12:48:27.236Z"

---
# 0705 · Keep build timers counting smoothly

**Status:** 👍 approved

## Problem
The panel's build timers sometimes skip a second (12, 14) or show one twice (13, 13), right where you look to see a build is alive. The ticks run on a plain one-second interval that lands a few milliseconds early or late.

## Outcome
Every build timer counts up one second at a time, every time.

## Acceptance criteria
1. Over 120 seconds of a running build, its timer shows every whole second once and in order, never skipping one or showing one twice, even when the browser's timer callbacks arrive up to 50 ms early or late.
2. Two builds started at different fractions of a second both count this way at the same time.
3. For a given start time, each timer shows the same elapsed time as today (whole seconds, rounded down).
4. No test that passed before this change fails.

## Out of scope
- Real-time updates of the board itself.

## Notes
- Self-check: no changes
- Failing before this build: none
- `startCounters` and `tickCounters` in `templates/panel.js` use `setInterval(tickCounters, COUNTER_MS)` with `COUNTER_MS = 1000`. Each counter has its own start, so one timer lined up with one build's seconds still drifts against the others.

## In plain words
Build timers now count one second at a time without skipping or repeating a number. To see it, watch a running build's timer in the panel. Nothing else changed.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The simultaneous-build tests observe the same timer twice.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 250,902
- Elapsed since build started: 30 min
- Changed lines: 4 (limit 5000)
- Follow-ups: none. The full view holds one second counter at a time, so two builds never count side by side on screen.
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
    "reviewed_sha": "92ec5bc9cddc16c77a1720fdd70886b22c5911ea",
    "session": "fresh",
    "thread_id": "01a20d90-15ea-7763-9790-56a6bc5a0cb8",
    "builder_response": "- Tests run: test/panel-0705.test.mjs test/panel-0058.test.mjs test/panel-0153.test.mjs test/panel-0201.test.mjs test/panel-0434.test.mjs test/panel-0462.test.mjs test/panel-0584.test.mjs test/panel-0585.test.mjs test/panel-0615.test.mjs\n\nRound 1: the page's counter timer now ticks every 250 ms (was 1000), so a callback arriving 50 ms early or late can't skip or repeat a whole second; the shown time is still computed from the clock, rounded down.\nTest files run: test/panel-0705, panel-0058, panel-0153, panel-0201, panel-0434, panel-0462, panel-0584, panel-0585, panel-0615 (all that find the counter's interval; seven older ones had their `ms === 1000` lookup changed to 250). `--related` picked 438 files and timed out in this shell, so I ran the files that touch the timer instead; the full suite runs in ship.\n",
    "seconds": 32,
    "usage": {
      "input_tokens": 162594,
      "cached_input_tokens": 124288,
      "cache_write_input_tokens": 0,
      "output_tokens": 825,
      "reasoning_output_tokens": 33
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 38306,
      "cached": 124288,
      "write": 0,
      "output": 825
    },
    "cost_usd": 0.0972908,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T12:38:28.263Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js startCounters ticks every 250 ms; tickCounters retains clock-based elapsed time. The three passing 0705 jitter tests exercise 120 seconds with early, late and alternating callbacks."
      },
      {
        "id": 2,
        "status": "unclear",
        "evidence": "test/panel-0705.test.mjs run() stores fullViewOf() results for both tickets, but test/support/panel.mjs fullViewOf() always returns the same #full-ticket element. Both observations therefore read the second build's timer. Two different start fractions are not actually checked simultaneously."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing '0705 AC3' checks 5.3, 5.999 and 6 seconds yield 00:05, 00:05 and 00:06. tickCounters leaves the elapsed-time calculation unchanged."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Reported targeted run: 231 passed, 0 failed, 3 skipped. Existing timer tests retain their behaviour assertions and update their interval lookup."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0705.test.mjs",
        "issue": "The simultaneous-build tests observe the same timer twice. fullViewOf() returns the shared #full-ticket pane, whose contents are replaced when the second ticket opens, so views['0901'] and views['0902'] reference the same element. AC2 lacks a test that exercises its claimed behaviour.",
        "suggested_fix": "Exercise two distinct counter nodes with different start fractions simultaneously, asserting their identities and respective elapsed values, or add an appropriate test harness that registers two independent second counters with the real counter implementation.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The faster timer appears to prevent skipped seconds while preserving elapsed-time rounding. The tests pass, but the test claiming to check two builds actually watches one build twice. Fix that coverage before approval."
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
    "reviewed_sha": "a45fcccbbe0c6bc670ef7fd7f01417736285b660",
    "session": "continued",
    "thread_id": "01a20d90-15ea-7763-9790-56a6bc5a0cb8",
    "builder_response": "- Tests run: test/panel-0705.test.mjs\n\nF1: fixed. The full view has one shared pane, so two builds can't be on screen at once. The test now opens each build in its own page (asserting the two counter nodes differ), runs both over the same clock with early, late and mixed 50 ms jitter for 120 s, and checks each shows every second once in order and that the build 5.85 s in changes before the one 5.3 s in, each time. The source change is unchanged.\n",
    "seconds": 19,
    "usage": {
      "input_tokens": 249577,
      "cached_input_tokens": 204672,
      "cache_write_input_tokens": 0,
      "output_tokens": 1325,
      "reasoning_output_tokens": 33
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 6599,
      "cached": 80384,
      "write": 0,
      "output": 500
    },
    "cost_usd": 0.0262364,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T12:48:23.185Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js startCounters uses a 250 ms interval and tickCounters computes elapsed time from the clock. The three passing 0705 jitter tests exercise 120 seconds with callbacks 50 ms early, late and alternating, checking consecutive displayed seconds."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "test/panel-0705.test.mjs run() now creates separate pages for the two builds and advances both against the same clock. The passing tests check both sequences and verify that their different start fractions produce different transition times."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing '0705 AC3' test checks that elapsed times of 5.3, 5.999 and 6 seconds display 5, 5 and 6 seconds. The production elapsed-time calculation is unchanged."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Round 1's affected tests passed with no failures. This round changes only the ticket's test file; the reported run has 147 passed, 0 failed and 3 skipped. Whole-suite verification remains the ship gate."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0705.test.mjs",
        "issue": "The original simultaneous-build tests observed the shared full-view pane twice. The revised tests create independent pages and observe each build separately against a shared clock.",
        "suggested_fix": "Addressed by the separate-page test setup and checks that the two start fractions produce different transition times.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Build timers now update frequently enough to count smoothly under the specified callback timing variation, while preserving whole-second rounding. The revised tests independently check both builds, and all reported checks pass. Ready for the owner's merge decision."
  }
}
```

</details>
