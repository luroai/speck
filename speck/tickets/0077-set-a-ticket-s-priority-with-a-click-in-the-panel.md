---
id: "0077"
title: "Set a ticket's priority with a click in the panel"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

**Status:** 🔨 building

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

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
