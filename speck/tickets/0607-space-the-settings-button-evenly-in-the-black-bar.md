---
id: "0607"
title: "Space the Settings button evenly in the black bar"                # one outcome, no "and"
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
started: "2026-11-10T09:51:32.944Z"

---
# 0607 · Space the Settings button evenly in the black bar

**Status:** 🔨 building

## Problem
Since the black bar grew taller (0604), the Settings button sits tight against the bar's right edge, with only a few pixels of black beside it, while it has plenty above and below. The face on the left has more room on its side. The bar looks lopsided.

## Outcome
The Settings button, and speck's face, sit in the black bar with the same space on every side.

## Acceptance criteria
1. The space between the Settings button and the bar's right edge equals the space above and below the button, to within 1 px, at 320 px and 1280 px wide.
2. The space between speck's face and the bar's left edge equals the space above and below the face, to within 1 px, at the same widths.
3. The button stays at least 44 px square, the face 56 px, and the bar's text keeps its three lines, without the bar growing taller.
4. A test checks both spacings in a real browser; no other test that passed before this change fails.

## Out of scope
- The bar's content and colours.

## Notes
- Asked for 2026-11-10: "the larger panel at the top has now meant that the border between the settings button and the right-hand side of the black panel is really thin. Can you just make it more equal?"
- Today in `templates/panel-header.css`: `.bezel` has `padding: 4px` and a 2 px border in the bar's colour, and `.bezel .settings-open` is 44 px with `margin: 0 -2px 0 0` (about line 64), so the button sits about 4 px from the right edge while the 56 px face makes the bar about 68 px tall, leaving about 12 px above and below the button.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
