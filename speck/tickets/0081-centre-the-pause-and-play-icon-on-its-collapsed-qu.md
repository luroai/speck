---
id: "0081"
title: "Centre a build's pause icon on its collapsed queue row"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T12:00:13.924Z"

---
# 0081 · Centre a build's pause icon on its collapsed queue row

**Status:** 🔨 building

## Problem
In a collapsed queue row, a running build's pause icon, or a paused build's play icon, lines up with the title line, so it sits near the top of the row, above the progress bar. It looks out of place next to the two lines it controls.

## Outcome
The pause and play icon sits vertically centred on its collapsed queue row.

## Acceptance criteria
1. In a collapsed queue row for a running build, the pause icon's vertical centre is within 1px of the midpoint between the top of the title line and the bottom of the progress bar's stage labels.
2. The same holds for the play icon of a paused build.
3. Opening the row leaves the icon where it was when the row was collapsed. It doesn't move to the middle of the open row.
4. Clicking the icon still pauses or plays the build without opening or closing the row, and its clickable area is no smaller than today's 16 × 14px.
5. Rows without the icon look as they do today: the title, tags, counter and progress bar are where they were.

## Out of scope
- The icon's shape, size or colour.

## Notes
- Measured 2026-10-10 in the running panel: the row's title line spans 119–139px, the stage labels end at 170px (midpoint 144.5px), and the icon spans 120–134px (centre 127px), so it's about 17px high.
- The panel tests already drive a headless browser (`test/support/panel.mjs`), so positions can be measured.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
