---
id: "0469"
title: "Give the panel its touch-screen layout with a mouse too"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0468"]                # ticket ids that must be done first
created: 2026-10-24

---
# 0469 · Give the panel its touch-screen layout with a mouse too

**Status:** 📝 draft

## Problem
In Cursor's browser pane with a mouse, the panel's cards are squashed: the title and details rows sit tight together and the text looks big for the card. In Cursor's mobile view, and on a phone, the same cards are taller and better spaced, because the panel only gives a touch screen its roomier layout. The user prefers that layout everywhere.

## Outcome
The panel looks the same with a mouse as it does on a touch screen at the same width.

## Acceptance criteria
1. At the same window width, the header, the tabs and every card in Plan, Build and Shipped, closed and open, have the same heights, padding, line heights and gaps with a mouse as with a touch screen today, including the 44 px Settings button, tabs, title rows and details lines, and the wide gaps either side of each ` · `. Checked in a real browser at 390 px and 600 px, comparing each element's size and place with `pointer: fine` and `pointer: coarse`.
2. Font sizes don't change, with either kind of pointer.
3. With a mouse, hovering still highlights a card as it does today, and a tap area that doesn't change the layout may stay touch-only.
4. No test that passed before this change fails.

## Out of scope
- Text sizes: the smaller text in Cursor's mobile view comes from Cursor scaling the page to fit its pane, not from the panel.
- The full ticket, Settings and the Pipeline pop-up, beyond the header and tabs behind them.

## Notes
- Asked for by the user on 2026-10-24, from two photos of the panel in Cursor's browser pane: with a mouse "the tickets look really small and like squished, and the text is almost bigger", and in Cursor's mobile view "the tickets are a bit taller, there's a bit more spacing … I prefer the mobile view. Can you make the Cursor desktop view look like the mobile view?"
- Today: `@media (pointer: coarse)` in `templates/panel.css` (0151, 0162, 0164, 0165, 0419, 0441, 0443, 0454) holds the touch layout's sizes.
- Waits for 0468, the last queued ticket that changes the cards' layout in `templates/panel.css`, so this applies to the step track, facts table, dependency box and chip they add, and its check covers them.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
