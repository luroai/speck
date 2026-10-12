---
id: "0137"
title: "Open a shipped ticket by clicking its title"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-12
started: "2026-10-12T21:21:57.239Z"

---
# 0137 · Open a shipped ticket by clicking its title

**Status:** 🔨 building

## Problem
Each row in the panel's Shipped table has two buttons, Full ticket and Review pack. Two buttons side by side make every row taller than it needs to be, so the table takes more room and is harder to scan.

## Outcome
In the Shipped table, a ticket's title is a link that opens the full ticket. Review pack is the only button left on each row, and the rows are slimmer.

## Acceptance criteria
1. In each Shipped row, the ticket's title is shown as a link: in the accent colour, underlined on hover, with a pointer cursor. Clicking it opens that ticket in the full ticket pane, exactly as the Full ticket button does today.
2. The title link can be reached with Tab and opened with Enter. Screen readers announce it with the ticket's title as its name.
3. Each Shipped row has exactly one button, Review pack, and no Full ticket button. Review pack works as before.
4. In a browser, a Shipped row whose title fits on one line is no taller than the same row with its Review pack cell left out.
5. No test that passed before this change fails, except checks that a Shipped row has a Full ticket button, which are changed to check that its title opens the full ticket.

## Out of scope
- The Full ticket buttons in the Plan list and the Build queue: they stay as they are.
- Anything about the review pack or the full ticket pane itself.
- Putting focus back on the title when the pane closes: that's the inbox idea `speck/ideas/2026-10-09-return-focus-after-the-full-ticket-pane-closes.md`.

## Notes
- The row is made in `templates/panel.html`, where the Shipped table is filled (`fill('shipped', …)`), using `fullButton` and `packButton`.
- The ticket id and any bug or fix tag stay beside the title and don't need to be part of the link.
- The link opens the pane in the page and doesn't go to another address. The builder chooses the element, as long as AC1 and AC2 hold.
- Failing before this build: none

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
