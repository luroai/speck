---
id: "0471"
title: "Make the header's speck word fill its row"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0470"]                # ticket ids that must be done first
created: 2026-10-24

---
# 0471 · Make the header's speck word fill its row

**Status:** 📋 ready

## Problem
The word "speck" in dot-matrix letters at the top of the panel is 20 px, small for the dark frame's title row it sits in, which is as tall as the 44 px Settings button beside it. It leaves the row looking empty.

## Outcome
The header's "speck" is bigger and fills its row better, without making the dark frame any bigger.

## Acceptance criteria
1. The word "speck" in the header is at least 28 px, in the same Doto lettering and weight, and its red dot grows with it, both centred in the title row.
2. The dark frame and its title row are exactly as tall and as wide as before this change, at every width from 320 px, with a mouse and with a touch screen, checked in a real browser by comparing their sizes with and without the change.
3. The word doesn't overlap the project and base branch or the Settings button: at 320 px the base branch still gives way first, cut short with `…`, as today.
4. No test that passed before this change fails.

## Out of scope
- The LCD screen under the title row, and its words.
- The Pipeline log's title (0470).

## Notes
- Asked for by the user on 2026-10-24, from a phone screenshot: "the title speck in the dot matrix font, I think it could be bigger. Make it bigger so that it doesn't expand the actual black border of the LCD screen, but … fit the space a little bit better."
- Today: `.bezel .name` in `templates/panel.css` is `Doto` at weight 900 and 20 px with `line-height: 1`, and its `::before` dot is 8 px.
- Waits for 0470, which waits for 0469: all three change `templates/panel.css`, and 0469 sets the title row's height with a mouse.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
