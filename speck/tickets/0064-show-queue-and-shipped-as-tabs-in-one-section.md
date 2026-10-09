---
id: "0064"
title: "Show Queue and Shipped as tabs in one section"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0052", "0053"]               # ticket ids that must be done first
created: 2026-10-09

---
# 0064 · Show Queue and Shipped as tabs in one section

**Status:** 📝 draft

## Problem
Shipped is a full-width section under Shaping and Queue, so the page is taller than the window and the user scrolls to see what has shipped. Shaping already shows one list at a time behind a toggle, and the Queue and Shipped lists could share a section the same way.

## Outcome
The Queue section has a Queue / Shipped toggle like Shaping's, and there's no separate Shipped section.

## Acceptance criteria
1. The Queue section has a Queue / Shipped toggle in the same style as Shaping's, each with its count (`Queue · <n>` for the tickets in the queue, `Shipped · <n>` for the `done` tickets), showing one list at a time, with Queue showing when the page loads. The separate Shipped section is gone.
2. The Shipped list shows its stats row and its latest 5 tickets exactly as today.
3. While any ticket in the queue is red (needs you), the Queue toggle is red and reads `Queue · <n> · <r> needs you`, with `<r>` the number of red tickets, whichever list is showing.
4. Which list is showing survives the 2-second refresh and is never sent to the server. Text selected in a queue or Shipped row, and a build log's scroll position, stay put through the refresh as today.

## Out of scope
- Fitting the page to the window (0065) and narrow screens (0066).
- Changing what the queue or Shipped rows show.

## Notes
- After 0052 and 0053, which change the queue rows in `templates/panel.html`.
- Uses the same colour for the Queue toggle and edges as the queue has today; Shipped keeps its own.
- product.md's Queue and Shipped descriptions need updating.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
