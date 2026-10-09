---
id: "0077"
title: "Set a ticket's priority with a click in the panel"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-set-a-ticket-s-priority-with-a-click.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0075"]                # ticket ids that must be done first
created: 2026-10-09

---
# 0077 · Set a ticket's priority with a click in the panel

**Status:** 📝 draft

## Problem
Setting or changing a ticket's priority means editing its file or running `speck set`. When sorting through many tickets in the panel, the user wants to change priorities there, at a click.

## Outcome
The priority tag on a draft or ready ticket in the panel can be clicked to set its priority.

## Acceptance criteria
1. In Shaping's Tickets list and among the queue's `ready` tickets, each ticket's priority tag is clickable, and one with no priority shows a `P-` tag in a muted style in its place. In-flight tickets and the Shipped list show the tag as today, not clickable.
2. Clicking the tag opens a small menu of P1, P2, P3, P4, P5 and None, with the current one marked. Choosing one sets the priority exactly as `speck set <id> priority <n>` does (None as `speck set <id> priority ""`) and commits only that ticket's file as `speck(<id>): priority <n>` (or `speck(<id>): priority none`), leaving everything else in the checkout, staged or not, as it was. Clicking outside the menu or pressing Escape closes it and changes nothing. Neither opens nor closes the ticket's row.
3. The server accepts the request only with the same `Origin` and `X-Speck-Token` checks as Set ready; anything else gets 403 and changes nothing. When it refuses, the reason shows under the ticket's top row until the next click on its tag.
4. After the change, the next refresh shows the new priority and moves the ticket to its new place in its list.

## Out of scope
- Changing priority from the full ticket pane.
- Changing what priority new tickets get (0076).

## Notes
- After 0075, so None and `P-` behave the same everywhere.
- Changing a ready ticket's priority changes which one `speck run` launches next. That's intended.
- Follows the Set ready path: `POST /api/tickets/<id>/ready` in `panelServer`, and the `readiness` function in `templates/panel.html`. The tag is drawn by `tags()`.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
