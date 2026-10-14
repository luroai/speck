---
id: "0151"
title: "Make each Plan ticket a clear card"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-13
started: "2026-10-14T00:08:24.350Z"

---
# 0151 · Make each Plan ticket a clear card

**Status:** 🔍 reviewing

## Problem
In Plan's ticket list the id and title are small and hard to read, the priority, size and risk tags wrap unpredictably beside the title at different heights (the priority tag is much taller, for its tap area), and the faint lines between tickets make it hard to tell where one ticket ends and the next begins.

## Outcome
Each ticket in Plan is its own clearly bounded card: a larger id and title on one line, then the priority, size and risk tags in a row of equal heights, then its criteria count and checks.

## Acceptance criteria
1. In Plan's Tickets list, a ticket's id is 14 px and its title 17 px, and a title is never cut off. At 1,280 px and over every title (up to 68 characters) fits on one line beside the id, and below that a title wraps onto at most one more line (two at most between 700 and 1,280 px), starting under the title, not under the id.
2. Under the id and title, the priority, size and risk tags (and a bug or fix tag) sit on a row of their own, in that order, all the same height. At viewports under 700 px the priority tag keeps a tap area at least 44 × 44 px, without making it look taller than the other tags. A high risk tag is in the panel's red (`--bad`), not amber, in light and dark mode, wherever the panel shows one (Plan, the Build queue and the full ticket pane).
3. Under the tags, the row with the criteria count, lint result and any warnings, chain or waiting-on note, as today.
4. Every ticket in Plan's Tickets, Ideas and Inbox lists is a separate card with a visible border on all sides and at least 8 px of space between cards, readable in light and dark mode. The draft accent stripe on a ticket's left edge stays.
5. Opening a ticket, the priority menu, Set ready and Full ticket work as before, and no test that passed before this change fails, except checks of the old layout (the tags beside the title, the line between items), which are changed to check AC1 to AC4.

## Out of scope
- The Build and Shipped lists.
- What an opened ticket shows (0142 covers its formatting).
- Colours, other than the card borders and the high risk tag.

## Notes
- Today `.id` is 12 px and `.title` 14 px, a ticket's row is built by `tags()` with the title and tags together, and items are divided by `.item { border-bottom: .5px solid var(--line-soft) }` (`templates/panel.html`).
- The tall priority tag comes from 0140's 44 px tap area (`.tag.pick` in the phone media query).
- Reported 2026-10-13 from a phone screenshot in dark mode.
- The high risk tag uses `--warn` today (`.tag.high` and `.q .tag.high`): `#9c6a10` in light mode, which reads as red-brown, and `#d6a24a` in dark mode, which reads as orange.
- Failing before this build: none
- Answered 2026-10-14 (option a): AC1 changed from "at 700 px wide and over, every title fits on one line" to one line at 1,280 px and over, at most one more line below that (two at most between 700 and 1,280 px), starting under the title.
- In AC1, "two at most between 700 and 1,280 px" means at most two more lines there (three in all), as the blocked question meant: measured 2026-10-14, the longest title (492 px) has 223 px of room at 700 px, so it can't fit on two lines there, while at 375 px it has 254 px and fits on two.
- Measured 2026-10-14 in headless Chromium: a 68-character title at 17 px is 492 px wide; Plan's list is 314 px wide at a 700 px window, 464 px at 1000 px and 604 px at 1280 px.
- The chain or padlock icon ends the row of tags rather than sitting beside the id: beside the id it takes 20 px from the title, and at 375 px the longest existing title (251 px needed for two lines, 254 px available) would then take three lines.
- Self-check: no changes
- Measured 2026-10-13 in the live panel: titles are 45 characters at the median, 58 at the 90th percentile and 68 at most. At 375 px a card has about 313 px for text; a 48-character title is 319 px wide at 17 px and a 68-character one 473 px, so a larger title can't stay on one line on a phone, but always fits in two. On desktop the card is wide enough for one line.

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
    "reviewed_sha": "c726f46b0274f57bdbb1ccd02603d92f77e4a2b8",
    "thread_id": "01a13909-798a-7bb1-bbfb-995a87aaaf1f",
    "seconds": 40,
    "usage": {
      "input_tokens": 112038,
      "cached_input_tokens": 69120,
      "cache_write_input_tokens": 0,
      "output_tokens": 787,
      "reasoning_output_tokens": 30
    },
    "saved_at": "2026-10-14T06:12:04.827Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "unclear",
        "evidence": "templates/panel.html sets the correct font sizes and aligns wrapped lines under the title. However, test/panel-0151.test.mjs:88 permits three lines at 699, 700, 1000 and 1279 px, whereas AC1 explicitly requires at most two. The passing tests therefore do not establish the required wrapping limit."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "ticketHead() places fieldTags(), typeTag() and chainIcon() below the title. Passing browser tests verify tag order, equal visible heights, the 44 × 44 px priority hit area including corner clicks, and --bad colours in Plan, queue and pane in both themes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "ticketHead() appends the existing checks after the tag row, retaining criteria, lint, warnings and dependency notes. Passing AC3 browser tests verify placement and waiting-on text; panel-0041 tests cover chain notes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "#shaping uses an 8 px gap and .item has borders on all sides. Passing AC4 browser tests check Tickets, Ideas and Inbox in both themes and phone/desktop widths, including the draft accent stripe."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Passing AC5 browser tests exercise opening, priority selection, Set ready and Full ticket. The full output at /tmp/speck-0151-tests.txt confirms 1399 passed, zero failed and three skipped. Changes to existing assertions correspond to the requested layout and colour changes."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0151.test.mjs:88",
        "issue": "The wrapping tests allow three lines below 1280 px at several tested widths. This relaxes AC1's explicit two-line maximum, so the green suite can conceal a failing layout.",
        "suggested_fix": "Set the maximum to two lines at every tested width below 1280 px, then adjust the layout if those stricter browser assertions fail. Retain the one-line maximum from 1280 px.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The cards, tag layout, red high-risk labels and existing controls are covered by passing tests. Approval is held because the title tests allow three lines where the ticket requires two; that limit must be checked honestly and met before merge."
  }
}
```

</details>
