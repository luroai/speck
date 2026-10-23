---
id: "0411"
title: "Show the latest ten shipped tickets"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0410"]         # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T13:59:01.373Z"
approved: "2026-10-23T14:03:13.779Z"

---
# 0411 · Show the latest ten shipped tickets

**Status:** 👍 approved

## Problem
Shipped lists only the latest five tickets, which is less than a day's work on a busy day, so you can't look back over what shipped without opening the tickets' files.

## Outcome
Shipped lists the latest ten finished tickets.

## Acceptance criteria
1. Shipped lists the latest ten finished tickets, newest first, plus any whose ship didn't push, as it does for five today. With fewer than ten finished tickets, it lists them all.
2. Each of the ten opens its Details, full ticket and Review pack with their whole text, as the latest five do today.
3. On the board the panel's server sends, every finished ticket outside the ten Shipped lists is still cut down to 500 bytes or less, as 0178 set for those outside the five.

## Out of scope
- The tabs (0410).
- Paging or searching older shipped tickets.

## Notes
- Five is set in two places that must agree: `SHIPPED_SHOWN` in `scripts/board-feed.mjs` and the `i < 5` filter on `shipped:` in `templates/panel.html`.
- Waits for 0410: both change `templates/panel.html`.
- Failing before this build: none
- Existing tests that pinned five now pin ten: `test/panel.test.mjs` (0031 AC3), `test/panel-0178.test.mjs` (AC1, AC2 at 60 finished rather than 30, AC3) and `test/ship-0204.test.mjs` (AC1 with ten newer tickets).
- Self-check: no changes

## In plain words
The Shipped tab now lists the last ten tickets that shipped, not five, so a busy day's work fits in one place. Each of the ten opens its details, full ticket and review pack as before. To see it, open the panel's Shipped tab and count the cards. Older shipped tickets still count towards the figures at the top but aren't listed, as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 134,359
- Elapsed since build started: 4 min
- Changed lines: 12 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none.

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
    "reviewed_sha": "a768ca9c7b8d9bb89eece79b8c0078ff65ebab23",
    "session": "fresh",
    "thread_id": "01a16912-3625-79a0-824f-a88b6e71eb5c",
    "builder_response": "- Tests run: test/panel-0411.test.mjs test/panel-0178.test.mjs test/panel.test.mjs test/ship-0204.test.mjs\n- Change: five becomes ten in both places that must agree, `SHIPPED_SHOWN` in scripts/board-feed.mjs and the `shipped:` filter in templates/panel.html, with their comments.\n- Existing tests that pinned five now pin ten, keeping what they check: test/panel.test.mjs (0031 AC3: all 8 done tickets now show), test/panel-0178.test.mjs (AC1 keeps the latest ten whole; the real-panel test writes 13 tickets so 3 are cut; AC2's \"under a third\" now uses 60 finished rather than 30, since ten whole of 30 can't be under a third; AC3 expects 10), test/ship-0204.test.mjs (AC1 puts the unpushed ticket behind ten newer ones).\n- Pictures of the Shipped tab, light and dark, are with the review pack.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 133824,
      "cached_input_tokens": 93824,
      "cache_write_input_tokens": 0,
      "output_tokens": 535,
      "reasoning_output_tokens": 14
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T14:03:06.083Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panelModel in templates/panel.html selects ten newest done tickets plus older unpushed tickets; panelBoard retains matching tickets whole. Passing 0411 AC1 tests cover ordering, rendered cards, unpushed tickets and fewer than ten."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0411 AC2 tests verify all ten retain their full text, open their full tickets with complete notes and problem text, expand Details and request each ticket's Review pack. Existing packButton/loadPack code fetches the pack independently of board trimming."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/board-feed.mjs panelBoard keeps ten whole and trims older finished tickets. Passing 0411 AC3 checks every older ticket is at most 500 bytes; updated 0178 integration test verifies the server sends ten whole tickets and three trimmed tickets."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Shipped now shows the latest ten tickets, newest first, while still showing older tickets whose push failed. All ten retain their full content and opening controls. Older tickets remain compact in the server response. The relevant tests passed, and no blocking issues were found."
  }
}
```

</details>
