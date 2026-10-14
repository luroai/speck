---
id: "0155"
title: "Make each Build queue ticket a clear card"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0151"]                # ticket ids that must be done first
created: 2026-10-13
started: "2026-10-14T06:15:11.954Z"
approved: "2026-10-14T06:26:38.005Z"

---
# 0155 · Make each Build queue ticket a clear card

**Status:** 👍 approved

## Problem
Build queue rows have no coloured edge (only a blocked ticket gets one), only a faint line between them and a wide empty column on their left where the old pause icon sat. Several tickets in the queue are hard to tell apart, and the rows look different from Plan's tickets.

## Outcome
Each ticket in the Build queue is a card laid out like a Plan ticket after 0151, with a coloured left edge that shows its state.

## Acceptance criteria
1. Every row in the Build queue is a separate card with a visible border on all sides and at least 8 px of space between cards, as Plan's cards are after 0151, readable in light and dark mode.
2. Each card has a coloured left edge: the panel's blue (`--run`) while building or reviewing, the purple 0138 uses for a ticket waiting to ship, red for blocked or a build that stopped, and the accent colour for a ready ticket waiting its turn.
3. Inside the card, the layout matches a Plan ticket after 0151: the id (14 px) and title (17 px) on one row, wrapping by the same rules, with the build timer at the right of that row; then the priority, size and risk tags on their own row, all the same height; then the progress bar and anything under it (question, messages, buttons, log). There is no empty column on the left: the id, tags, bar and the rest all start at the card's left padding.
4. Opening and closing a row, the live log, Stop build, Back to Plan, Full ticket, Review pack and Ship work as before, and the timer still counts.
5. No test that passed before this change fails, except checks of the old row layout (the rank column, the line between rows), which are changed to check AC1 to AC3.

## Out of scope
- The Shipped list.
- What the progress bar shows.

## Notes
- Builds on 0151's card styles, so it waits for it.
- Rows are built by `queueItem()` in `templates/panel.html`. The empty column is `.q .top`'s first grid column (26 px, 34 px under 700 px wide, the old `.rank` space) plus the `margin-left` on the bar and the lines under it.
- Reported 2026-10-13 from a phone screenshot in dark mode.
- Failing before this build: none
- Measured 2026-10-14 in headless Chromium: the timer takes about 43 px of the title's row (12 px of space and the time itself), so a ticket in flight with the longest title (68 characters) takes one line more than in Plan: 3 lines at 375 px rather than 2, and 2 at 1,280 px rather than 1. A ready ticket has no timer, so its title wraps exactly as a Plan ticket's does. The tests check both: Plan's limits for a ready ticket, one line more for a ticket in flight.
- The chain or padlock icon ends the row of tags, as in Plan (0151), and the bug or fix tag sits in that row after the risk tag rather than beside the id. 0049's and 0100's checks of a queue type tag right after the id are changed to match, as is 0145's check that the old left-hand space stays empty.
- A ready ticket's card has the class `queued`, not `ready`, since `.ready` is Plan's Set ready section, which has its own phone styles.
- Self-check: the chain or padlock icon a kept row puts right is now added at the end of the row of tags, not before the title.

## In plain words
Each ticket in the Build queue is now a card of its own, with a clear border and a gap before the next one, laid out like the tickets in Plan. The ticket number and a larger title sit on one line with the build timer at the right, the priority, size and risk labels sit in a tidy row underneath, and the progress bar and everything below it now start at the card's left edge, with no empty space on the left.

The card's left edge shows where the ticket is at a glance: blue while it's being built or reviewed, purple when it's waiting for you to ship it, red when it's blocked or its build stopped, and the accent colour when it's ready and waiting its turn. It keeps that colour when you open the card.

To see it, open the panel and look at Build, on a phone or a wide screen, in light or dark mode. Worth keeping an eye on: the timer takes a little room from the title, so a very long title on a ticket being built can take one more line than it would in Plan.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 172,523
- Elapsed since build started: 11 min
- Changed lines: 61 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - Known limit: beside the timer, the longest titles take one more line than in Plan (3 at 375 px, 2 at 1,280 px).
  - Tidy-up: a ticket with no priority, size or risk still gets an empty row of tags, as in Plan (noted in 0151's Delivery log).

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
    "reviewed_sha": "190a03a23f48f3cf61eaf87702586b1bcbf6f230",
    "thread_id": "01a13916-d501-72a2-9aba-98e21fda42c6",
    "seconds": 28,
    "usage": {
      "input_tokens": 171671,
      "cached_input_tokens": 117120,
      "cache_write_input_tokens": 0,
      "output_tokens": 852,
      "reasoning_output_tokens": 21
    },
    "saved_at": "2026-10-14T06:26:27.951Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html gives #queue an 8 px gap and .q solid borders on all sides. Passing panel-0155 AC1 browser tests measure borders, contrast and spacing at phone and desktop widths in light and dark themes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "queueItem() assigns blocked, to-ship and queued classes; CSS applies the required state colours and preserves them when opened. Passing AC2 browser tests check all specified states, open and closed, in both themes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "queueItem() separates the id/title, timer and tag row; queueUpdate() updates the dependency icon in that tag row. Passing AC3 browser tests measure font sizes, wrapping, timer placement, tag heights and left alignment across responsive widths."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 browser tests exercise opening, closing, log loading, timer advancement, Full ticket and Review pack, and verify the Stop, Back to Plan and Ship requests. Existing action handlers remain unchanged."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The full /tmp/speck-0155-tests.txt reports 1,442 passed, zero failed and three skipped, including all 22 ticket tests passing. Existing test changes retain type-tag and pause-icon checks while adapting their layout assertions."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Build queue tickets now appear as clearly separated cards with state-coloured edges and a layout matching Plan. Browser tests cover phone and desktop layouts, both themes and existing controls. The full suite reports no failures. No blocking issues found."
  }
}
```

</details>
