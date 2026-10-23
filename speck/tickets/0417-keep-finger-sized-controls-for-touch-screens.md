---
id: "0417"
title: "Keep finger-sized controls for touch screens"                # one outcome, no "and"
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
after: ["0416"] # ticket ids that must be done first
created: 2026-10-23

---
# 0417 · Keep finger-sized controls for touch screens

**Status:** 📋 ready

## Problem
Below 700 px wide, every tag, toggle and button on the panel is at least 44 × 44 px (0140), a size meant for fingers. The panel is used mostly in a narrow side pane with a mouse, where those sizes make every card much taller than it needs to be.

## Outcome
Controls are finger-sized on touch screens only, so a narrow pane used with a mouse gets compact controls.

## Acceptance criteria
1. Where the main pointer is fine (a mouse or trackpad), no control on the panel has a 44 px minimum width or height at any window width. Each is sized to its text with the panel's normal padding.
2. Where the main pointer is coarse (a touch screen), every control that has a 44 px minimum below 700 px today keeps it, at any window width.
3. The panel's other rules for narrow windows, the ones not about a control's size, still apply below 700 px as today.

## Out of scope
- Laying the panel out in one column (0418) and making the cards shorter (0419, 0420).

## Notes
- Asked for by the user on 2026-10-23: the panel is used mostly in a thin side pane, and its tickets are too tall there.
- The 44 px rules are in the `@media (max-width: 699.98px)` block in `templates/panel.html` (0140, 0161).
- Unverified: Playwright's `hasTouch` makes `(pointer: coarse)` match in Chromium (not checked here; check before relying on it in a test).
- Waits for 0416: both change `templates/panel.html`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
