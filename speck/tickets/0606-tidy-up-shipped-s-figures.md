---
id: "0606"
title: "Tidy up Shipped's figures"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T09:51:33.342Z"

---
# 0606 · Tidy up Shipped's figures

**Status:** 🔨 building

## Problem
Shipped's figures look messy on a phone: the first three tiles have square corners at the top and rounded ones at the bottom, a large bordered More stats or Fewer stats button sits between them and the other figures, the other figures fill three columns with a gap left in the last row, labels wrap onto two lines so tiles differ in height, every tile repeats "588 tickets", and a "588 in total" line above them repeats the tab's own count.

## Outcome
Shipped's figures are one tidy grid of even tiles, with a quiet link to show the rest.

## Acceptance criteria
1. Every figure is a tile of one style: the surface colour, no border, all four corners rounded alike, the same gap between tiles; its number in the panel's font and its label in the muted colour on one line, so tiles in a row are the same height.
2. The figures are a grid of two columns below 480 px wide and four from 480 px: shipped today, median build time, median review rounds and approved first round always show; median builder cost, total cost, median reviewer tokens and median builder tokens show when the rest are open, so every row is full.
3. A tile says how many tickets its figure comes from only when that's fewer than all those shipped, for example "from 476 tickets"; the others say nothing, and the "588 in total" line is gone, as the tab gives the count.
4. Showing and hiding the other figures is a text link in the accent colour under the grid, "All figures" or "Fewer figures", with a 44 px tall tap area, instead of the bordered button, and the other tiles join the same grid.
5. Tests that checked the old tiles, the toggle or the totals line are changed to check the new ones, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- How the figures are worked out.
- The shipped tickets' rows under the figures.

## Notes
- Asked for 2026-11-10, with a phone screenshot: "Some of the corners on the bottom are rounded, the corners at the top are not. There's a button in the middle of them. Just looks really messy. Can we clean this up, please?"
- Decided: shipped today moves up from the other figures so the four that always show fill two rows of two on a phone, and the four others fill two more; at 480 px and wider, each group is one row of four.
- Today: the figures are built in `templates/panel.js` (`tiles('shipped-stats', …)` and `tiles('shipped-more', …)`, with `#more-stats`, from about line 1297), styled in `templates/panel-cards.css` (from about line 181, 0157's tiles and 0587's toggle).
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: total cost with no known total said "over 0 tickets" in its tooltip, now "No shipped ticket has a known total cost"; the link fits its text rather than the row's width. Also: the brief's Shipped sentence matched to the new figures, "median reviewer tokens" shown as "median review tokens" so every label is whole at 375 px (tooltip keeps "reviewer"), and labels kept at 14 px as 0427 forbids 13 px.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
