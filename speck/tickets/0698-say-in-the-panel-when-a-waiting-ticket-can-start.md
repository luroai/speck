---
id: "0698"
title: "Say in the panel when a waiting ticket can start"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-15-say-in-the-panel-when-a-waiting-ticket-can-start.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T21:46:13.582Z"
approved: "2026-11-15T21:58:28.145Z"

---
# 0698 · Say in the panel when a waiting ticket can start

**Status:** 👍 approved

## Problem
Since 1.4.0, speck run starts a ready ticket on the approved work of the ticket it waits for (0675), and ships the two in order. The panel still shows such a ticket as waiting, and an approved one as an ordinary approved ticket, so the board reads as stuck while speck is getting on with it.

## Outcome
The panel says when a waiting ticket can start on another's approved work, and when an approved ticket waits to ship after the one it was built on.

## Acceptance criteria
1. A ready ticket that `speck status --json` gives a `starts_on` shows, wherever the panel says it's waiting for an `after:` ticket, that it can start on that ticket's approved work, naming it, instead of that it's waiting.
2. An approved ticket with `ships_after` says, on its card and in its full view, that it ships after the ticket it was built on, naming it.
3. A ticket with neither field reads as today.
4. No test that passed before this change fails.

## Out of scope
- Changing when speck run starts or ships such tickets.

## Notes
- From 0675's own note. The fields are `starts_on` and `ships_after` (`scripts/built-on.mjs`, `afterWait`).
- Failing before this build: none
- Self-check: no changes
- Pictures: the board had no ready ticket with starts_on, so the pictures show the approved one (0693, ships after 0692) on the Build list and in its full view. The ready case is covered by the tests.

## In plain words
When speck can start a ticket on the approved work of the ticket it waits for, the Build list now says "can start on 0801's approved work" instead of "after 0801", and its full view says the same. An approved ticket that was built on another says "ships after 0801, which it was built on" on its row and in its full view, so the board no longer looks stuck while speck works through them in order. To see it, open Build while one ticket is built on another approved one. Tickets without that link read as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 186,180
- Elapsed since build started: 12 min
- Changed lines: 50 (limit 5000)
Follow-ups:
- An approved ticket built on one that hasn't shipped still sits under Needs you as Ready to ship when auto-ship doesn't cover it: speck/ideas/2026-11-15-don-t-say-ready-to-ship-while-the-base-ticket-hasn-t-shipped.md.
- The full view's "Ships after" line sits below the build log rather than near the top; fine for now.

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
    "reviewed_sha": "ed1d7b47970e3a73283be96488f9a8bca60c669d",
    "session": "fresh",
    "thread_id": "01a1e137-5ed4-7682-8d81-19a825f4e5b9",
    "builder_response": "- Tests run: test/panel-0698.test.mjs test/panel-0050.test.mjs test/panel-0062.test.mjs test/panel-0467.test.mjs test/panel-0468.test.mjs test/panel-0613.test.mjs test/panel-0603.test.mjs test/panel-0584.test.mjs test/panel-0585.test.mjs test/panel-0583.test.mjs test/panel-0615.test.mjs test/panel-0463.test.mjs test/panel-0443.test.mjs test/panel-0167.test.mjs test/panel-0151.test.mjs test/panel.test.mjs (all pass). Before this, `speck test --related test/panel-0698.test.mjs` also passed (12 related files, 243 pass, 0 fail); it only brings in files that name a changed file, so I added the panel tests that load the page and cover the Build row, the full view and the dependency facts.\n- Where a ready ticket says it waits for an after: ticket: its Build row (\"after X\"), and its full view's dependency facts (Waits for / Waits on). Plan cards show drafts only, and starts_on is only ever set on a ready ticket, so they're unchanged.\n- Pictures: the real board had 0693 approved with ships_after 0692, so the pictures show that case; the ready case is covered by the tests.\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 185448,
      "cached_input_tokens": 138368,
      "cache_write_input_tokens": 0,
      "output_tokens": 732,
      "reasoning_output_tokens": 29
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 47080,
      "cached": 138368,
      "write": 0,
      "output": 732
    },
    "cost_usd": 0.1153168,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T21:58:10.812Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js: whereLine, waitsFacts and chainFacts replace waiting wording using starts_on; templates/panel-popups.js: liveParts adds the full-view explanation. Three passing AC1 tests exercise the row, full view and multiple dependencies."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.js: whereLine and buildNotes name ships_after and explain the shipping order. Two passing AC2 tests exercise the card row and full view."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "startsOn and shipsAfter return null without the fields, preserving previous rendering branches. The passing AC3 test checks unchanged ready and approved rows and full views."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0698-tests.txt reports 386 passed, 0 failed and 3 skipped across 389 tests. Existing tests are unchanged; the implementation is confined to panel rendering. The whole-suite ship check remains required."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel now names the approved ticket a ready ticket can start on, and explains when an approved ticket must ship after another. Tests cover both cases and unchanged behaviour without these fields. No blocking concerns found; scheduling and shipping logic are unchanged."
  }
}
```

</details>
