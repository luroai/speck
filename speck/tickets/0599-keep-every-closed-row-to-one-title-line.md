---
id: "0599"
title: "Keep every closed row to one title line"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T07:42:07.828Z"

---
# 0599 · Keep every closed row to one title line

**Status:** 🔨 building

## Problem
Since the redesign's compact rows (0585 to 0587), a closed row's title wraps, so rows in the same lane are one or two lines tall depending on how long their titles are. The lanes look uneven, and the user wants every collapsed ticket to look the same.

## Outcome
Every closed row in a lane is the same height: one line of title and one line of details.

## Acceptance criteria
1. In Capture, Plan, Build and Shipped, a closed row's title stays on one line, cut off with an ellipsis when it doesn't fit, and its details line stays on one line, so every closed row in a lane is the same height, at 320 px wide and at 1280 px wide.
2. A cut-off title is shown whole in its tooltip, and a screen reader reads the whole title.
3. An open row, and the ticket's full view, show the whole title, wrapping as needed, as today.
4. The ticket's id stays on the title's line, and each row is still at least 44 px tall.
5. Tests that checked a closed row's title wrapping are changed to check it's cut off on one line instead, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- The bridge's cards and project rows (0596).
- Shortening titles themselves.

## Notes
- Asked for 2026-11-10: "I need the tickets to look more uniform when they're collapsed. Some titles are 1 line and some are 2."
- Decided: one line with an ellipsis, as 0434 first did, rather than keeping room for two lines on every row, which would make short titles leave a gap.
- Today the redesign made closed titles wrap in `templates/panel-cards.css`: `.q.row .top .line .title` (0585) and `.item.row .line .title` (0586), with Shipped's rows from 0587; 0434's rule for closed titles sits just above them.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: clipping Plan's details line sideways cut the left edge off the priority's 44 px tap box, so its clip box now takes in the row's padding (checked in 0599's browser test); the open-row title rule now applies only to closed rows, so an open title has no ellipsis left in its style.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
