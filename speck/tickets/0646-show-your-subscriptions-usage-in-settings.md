---
id: "0646"
title: "Show your subscriptions' usage in Settings"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0643"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T15:17:00.249Z"

---
# 0646 · Show your subscriptions' usage in Settings

**Status:** 🔍 reviewing

## Problem
Once speck keeps each agent's usage (0642, 0643), you still can't see it unless you run `speck agents`, so you find out an agent is nearly used up when work stops.

## Outcome
The panel's Settings view shows each of your subscriptions with how much it has left and when it resets.

## Acceptance criteria
1. Settings has a Your subscriptions group listing each of your agents with a reading: its plan when known, then a bar and a figure for each window speck read (for example 5 hours 40% and Week 34% for Claude, Month 1% for Cursor), with when each resets.
2. A window at 90% or more shows its bar in the needs-you colour, and one that's refused says Limited with when it resets.
3. A model provider on an API key shows this week's spend from what speck recorded, and says it has no limit to show.
4. Each agent says how long ago it was read, and one with no reading says so in one line.
5. It reads afresh each time Settings opens, works in the light and the dark look, and fits a phone-width panel.

## Out of scope
- The team cards: 0652.

## Notes
- Mockup: the Your subscriptions shelf on the team page, https://claude.ai/artifact/2F85xNeCwn9KGxRn3ZbYZQ.
- Readings from 0642 and 0643. Keep the panel thin: one column at phone width.
- Failing before this build: none
- Self-check: a figure is rounded down, so 89.9% never shows as 90% beside a bar that isn't in the needs-you colour; a plan named like a built-in key (`constructor`) shows as written; a provider's spend that can't be read from speck's records says so rather than showing $0.
- The usage is served at its own address, GET /api/usage, apart from /api/settings, so reading Cursor's usage screen (up to 20 seconds when it's stale) holds up nothing else in Settings.

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
    "reviewed_sha": "8090db9908ff6917f43f0ab280ffd9c7ec6fe105",
    "session": "fresh",
    "thread_id": "01a1cb36-9f3a-7201-8b0e-571a829a091b",
    "builder_response": "- Tests run (speck test --related): test/subscriptions-0646.test.mjs test/support/your-agents.mjs, plus every test file --related brought in for scripts/panel.mjs, scripts/subscriptions.mjs, templates/panel-settings.js, templates/panel-settings.css and test/support/your-agents.mjs (418 tests: 415 pass, 0 fail, 3 skipped).\n- Design: the readings are served at their own address, GET /api/usage (scripts/subscriptions.mjs, subscriptionsAnswer), fetched by the page each time Settings opens, apart from /api/settings, so reading Cursor's usage screen when it's stale (up to 20 s, as `speck agents` does) holds up nothing else in Settings. Two opens at once share one Cursor read.\n- AC5 light/dark and phone width: the styles use only the look's colour variables; pictures of the real panel at 390 px wide in both looks, plus one showing Limited, 92%, no reading and a provider row, are in the review pack.\n- AC3: a provider's week is speck spend's week (from the local Monday), summing `speck spend --by=model` rows whose model is one of the provider's models.\n",
    "seconds": 51,
    "usage": {
      "input_tokens": 223643,
      "cached_input_tokens": 171392,
      "cache_write_input_tokens": 0,
      "output_tokens": 1267,
      "reasoning_output_tokens": 132
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 52251,
      "cached": 171392,
      "write": 0,
      "output": 1267
    },
    "cost_usd": 0.1343112,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T15:26:08.049Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/subscriptions.mjs readingShown and templates/panel-settings.js subRow/windowRow supply plans, windows, bars, figures and resets. Both AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "readingShown marks high and refused windows; windowRow renders Limited and reset times. The passing AC2 test covers refusal, high usage, expired refusal and rounding down."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The passing AC3 test covers recorded spend, but unreadable underlying records are silently treated as absent by spendReport's dependencies. A read-only reproduction forcing EACCES on run-record reads returned cost_usd: 0 and cost_unknown: false, violating the ticket's explicit self-check."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "subRow/readAgo show reading age and the no-reading message. Passing AC4 tests exercise missing readings, Cursor read failures and refreshing Cursor."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "openSettings calls loadSubs independently of loadSettings; the passing AC5 test verifies fetching again after reopening. panel-settings.css uses theme variables and a flexible single-column window layout."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/subscriptions.mjs",
        "issue": "Unreadable spend records can show a reassuring $0. subscriptionsAnswer only detects exceptions from spendReport, but scripts/spend.mjs readRecord/jsonLines swallow read errors and return empty records. providerSpend then converts the missing rows to zero. Forcing EACCES on run-record reads reproduced cost_usd: 0, cost_unknown: false. The current test passes null directly to providerSpend and never exercises this failure path.",
        "suggested_fix": "Preserve a distinction between absent records and records that could not be read through the spend-reading path, and show the existing unavailable-spend message for the latter. Add a test exercising subscriptionsAnswer with an underlying record read failure.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Settings now shows subscription usage, reset times and API spend, with good coverage of the main display paths. One issue needs fixing: unreadable spending records can appear as $0 instead of saying the spend could not be read."
  }
}
```

</details>
