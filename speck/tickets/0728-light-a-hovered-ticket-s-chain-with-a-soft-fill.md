---
id: "0728"
title: "Light a hovered ticket's chain with a soft fill"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: cursor              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0701"]                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T15:21:58.663Z"

---
# 0728 · Light a hovered ticket's chain with a soft fill

**Status:** 🔨 building

## Problem
Hovering a ticket lights it and every ticket chained to it with a ring and border in the text colour, which reads as a stack of heavy black boxes. It looks out of place in Cursor's browser pane, whose own lists show hover with a soft fill.

## Outcome
A hovered ticket and the tickets chained to it are lit with the same soft raised fill a hovered row has, with no dark ring or border.

## Acceptance criteria
1. On a device with hover, when a ticket in Plan or Build is hovered, it and every ticket linked to it show the raised fill a hovered row has (`--raise`), reaching 12 px past their text as an open row's fill does, and none gets a border or ring in the text colour.
2. Lit rows don't move or change size, and keep their text colours, and a row with a state colour (in trouble, waiting to ship, being worked on) keeps its border and fill as today.
3. When a tapped ticket id scrolls its ticket into view and lights it for 1.5 seconds, it is lit with the same fill, fading out, rather than a dark ring; with reduced motion it shows the fill without the fade.
4. An open row, already filled, looks as it does today when lit, with no ring.
5. No test that passed before this change fails, except tests that check for the ring (from 0185, 0154 and 0614), which are changed to check the fill.

## Out of scope
- Which tickets count as linked.
- Touch screens, where nothing is lit on hover.

## Notes
- Raised by the user on 2026-11-24 from a screenshot of the panel in Cursor's browser pane: three chained drafts lit as black boxes. It must keep looking like part of Cursor.
- The ring is `.item.hl, .q.hl` and `.item.row.open.hl::after` in `templates/panel-cards.css`, set by `lightUp` in `templates/panel.js`; the tap flash is `.item.flash`, `.q.flash` and `@keyframes flash`, with reduced-motion rules near the end of the file.
- Waits for 0701, which gives a hovered closed row its 12 px of fill.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
