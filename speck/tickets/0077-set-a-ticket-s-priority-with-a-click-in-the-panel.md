---
id: "0077"
title: "Set a ticket's priority with a click in the panel"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-set-a-ticket-s-priority-with-a-click.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T21:40:27.006Z"

---
# 0077 · Set a ticket's priority with a click in the panel

**Status:** 👍 approved

## Problem
Setting or changing a ticket's priority means editing its file or running `speck set`. When sorting through many tickets in the panel, the user wants to change priorities there, at a click.

## Outcome
The priority tag on a draft ticket in the panel can be clicked to set its priority, which sets its place in the Tickets list.

## Acceptance criteria
1. In Shaping's Tickets list, each draft ticket's priority tag is clickable. A ticket with no priority shows no tag, as today. Everywhere else (the queue, including `ready` tickets, and the Shipped list) the tag shows as today, not clickable.
2. Clicking the tag opens a small menu of P1, P2, P3, P4 and P5, with the current one marked. Choosing one sets the priority exactly as `speck set <id> priority <n>` does and commits only that ticket's file as `speck(<id>): priority <n>`, leaving everything else in the checkout, staged or not, as it was. Clicking outside the menu or pressing Escape closes it and changes nothing. Neither opens nor closes the ticket's row.
3. The server accepts the request only with the same `Origin` and `X-Speck-Token` checks as Set ready; anything else gets 403 and changes nothing. It refuses, changing nothing, a priority that isn't a whole number from 1 to 5, and a ticket that isn't `draft`. When it refuses, the reason shows under the ticket's top row until the next click on its tag.
4. After the change, the next refresh shows the new priority and moves the ticket to its place in the Tickets list by priority. Nothing else about the ticket or the panel changes.

## Out of scope
- Changing priority from the full ticket pane.
- Changing the priority of a ticket that's `ready` or later.
- Clearing a priority, or setting one on a ticket that has none: new tickets start at P3.

## Notes
- Decision (user, 2026-10-09): priority is set only while a ticket is a draft, to order the Tickets list. Once it's ready it isn't changed from the panel. (`speck run` still uses it to order ready tickets.)
- Follows the Set ready path: `POST /api/tickets/<id>/ready` in `panelServer`, and the `readiness` function in `templates/panel.html`. The tag is drawn by `tags()`.
- Self-check: choosing the priority a ticket already has now commits nothing (it used to make a commit that also swept in other edits to the ticket); added tests for that and for a failed commit putting the ticket back. Updated the 0039 AC1 test to skip the priority tag, which now opens its menu instead of the row (AC2).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 383,455
- Elapsed since build started: 9 min
- Changed lines: 124 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (known limits, no inbox notes):
  - The priority tag is a span, so it can't be reached with Tab; like the rest of the panel's rows it's mouse-only.
  - While a menu is open, a click on another ticket's tag only closes the menu, so that ticket needs a second click.

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
    "reviewed_sha": "559adcdc802dc41483ec9d825c829ccf75558942",
    "thread_id": "01a122a3-70a1-7b71-827d-4d1736db1122",
    "seconds": 29,
    "usage": {
      "input_tokens": 382605,
      "cached_input_tokens": 300416,
      "cache_write_input_tokens": 0,
      "output_tokens": 850,
      "reasoning_output_tokens": 93
    },
    "saved_at": "2026-10-09T21:48:48.262Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: ticketHead enables priorityPicker only in the draft Tickets list; other tags remain passive. The 0077 AC1 test exercises drafts, missing priority, queue and Shipped tags; reported passing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "priorityPicker, setPriority and document listeners implement choices, current marking and dismissal without toggling rows. panelSetPriority uses the same writeField as cmdSet and commitTicketOnly isolates the commit. AC2 tests exercise these behaviours, staged/unstaged isolation, unchanged priority and commit failure; reported passing."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/speck.mjs: panelServer applies the same Origin/token checks as Set ready; panelSetPriority rejects non-drafts and invalid priorities before writing. priorityRefused displays errors until the next tag click. AC3 tests exercise authentication, validation, unchanged files and persistent refusal messages; reported passing."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The existing state refresh and keptItems rendering update priority and ordering while retaining unaffected ticket nodes and open state. Both 0077 AC4 tests exercise refreshed ordering and preserved panel state; reported passing."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Draft tickets can now change priority from their tag, with protected requests and commits confined to the selected ticket. The tests meaningfully cover all four criteria, including dismissal, refusal messages and commit failure. No blocking issues found. I inspected the code and tests; I did not rerun tests because this review environment is read-only."
  }
}
```

</details>
