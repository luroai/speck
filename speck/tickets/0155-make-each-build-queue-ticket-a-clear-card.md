---
id: "0155"
title: "Make each Build queue ticket a clear card"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0155 · Make each Build queue ticket a clear card

**Status:** 🔨 building

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

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
