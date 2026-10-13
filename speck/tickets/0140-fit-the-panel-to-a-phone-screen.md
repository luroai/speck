---
id: "0140"
title: "Fit the panel to a phone screen"                # one outcome, no "and"
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
after: []                # ticket ids that must be done first
created: 2026-10-13
started: "2026-10-13T06:30:00.309Z"

---
# 0140 · Fit the panel to a phone screen

**Status:** 🔨 building

## Problem
The panel is laid out for a desktop screen only. On a phone, Plan and Build are squeezed into two narrow columns side by side, the header's labels wrap one word per line and some text runs off the edge. The user checks progress and starts builds from their phone on the move, so this is a real, regular use.

## Outcome
On a phone-width screen the panel shows one readable column, with every control easy to tap, and the desktop layout is unchanged.

## Acceptance criteria
1. At a viewport 375 px wide, in light and dark mode, the page never scrolls sideways: no part of the header, the Plan, Build or Shipped sections, or the full ticket and review pack panes reaches past the right edge of the screen.
2. At viewports narrower than 700 px, Plan, Build and Shipped are stacked in one full-width column, in that order. At 700 px and wider, the layout is the same as today.
3. At a viewport 375 px wide, the header shows the speck name, the repo and base branch, speck run's state with its on/off button, the live indicator and the light/dark switch, and none of these labels wraps onto a second line.
4. At viewports narrower than 700 px, every button and clickable control in the panel (for example Set ready, the priority menu, speck run's on/off button, pause, play, Stop build, Full ticket, Review pack, Ship, the Plan tabs and the light/dark switch) has a tap area at least 44 px high and 44 px wide.
5. No test that passed before this change fails.

## Out of scope
- New features or controls for mobile only, such as swiping or a bottom tab bar.
- Changing the desktop layout.
- Installing the panel as a phone app.

## Notes
- `templates/panel.html` has no width-based media queries today: `main` is always two columns (`grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)`) and the header is one flex row. The full ticket pane is already `min(480px, 100vw)` wide.
- The panel's browser tests already run in Chromium through `test/support/panel.mjs`, so these criteria can be checked at a 375 px viewport.
- 44 px follows Apple's minimum recommended tap target (44 × 44 pt, Human Interface Guidelines).
- Reported 2026-10-13 from a screenshot on an iPhone, viewing the panel in the Claude app's browser.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
