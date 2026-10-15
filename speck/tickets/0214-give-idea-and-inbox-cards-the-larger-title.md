---
id: "0214"
title: "Give Plan's note cards a ticket card's larger title"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-14-give-idea-and-inbox-cards-the-larger-title.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0213"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T23:27:49.181Z"

---
# 0214 · Give Plan's note cards a ticket card's larger title

**Status:** 🔨 building

## Problem
Since 0151, ticket cards in Plan have a larger id and title, but idea and inbox cards still use the old small sizes. Switching between Plan's three lists looks uneven, and idea and inbox titles are harder to read on a phone.

## Outcome
Idea and inbox cards in Plan show their label and title at the same sizes as a ticket card's id and title.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. In Plan's Ideas and Inbox lists, each card's label ("idea" or "inbox") is 14 px and its title 17 px, the same as a ticket's id and title in the Tickets list.
2. The label stays on the same line as the title, before it, as a ticket's id does.
3. A title is never cut off. When a title wraps, its next lines start under the title's first letter, not under the label, at viewports 375, 700 and 1,280 px wide.
4. Opening and closing a card, and the row under the title (the status or `from` ticket, and the note's path), work and look as before, and no test that passed before this change fails, except checks of the old idea and inbox title sizes, which are changed to check AC1 to AC3.

## Out of scope
- Moving the label to a row of its own under the title, as a ticket's tags did in 0151.
- The cards in the Build queue and Shipped, which 0155 and 0157 already changed.

## Notes
- The cards are drawn by `ideaItem()` and `inboxItem()` in `templates/panel.html`; ticket cards get their sizes from `.item.ticket .line .id` and `.item.ticket .line .title`.
- The note left open whether the label stays beside the title or moves under it. This ticket keeps it beside the title (AC2), as it is today.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
