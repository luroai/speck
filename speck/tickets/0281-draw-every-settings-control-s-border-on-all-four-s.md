---
id: "0281"
title: "Draw every Settings control's border on all four sides"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T19:17:47.054Z"

---
# 0281 · Draw every Settings control's border on all four sides

**Status:** 🔨 building

## Problem
On an iPhone, some of the Settings view's info buttons and controls are drawn without their left border. Their borders are half a pixel wide, and they sit half a pixel off a whole pixel (at 390 px wide, every info button's left edge is at 173.5 px and every list's at 199.5 px), so the phone can drop that edge when it draws them. The view's group boxes, with their own half-pixel borders, are the likely cause of the half-pixel shift.

## Outcome
Every info button and control in the Settings view is drawn with its border on all four sides, on a phone as on a computer.

## Acceptance criteria
1. At widths of 320, 390, 400 and 1280 px, the left and right edges of every info button, list, text box and number box in the Settings view fall on a whole CSS pixel.
2. At those widths, every border of those elements is drawn at least one device pixel wide at a device pixel ratio of 1, 2 and 3.
3. The rest of the panel looks as it does today: the change is limited to the Settings view.
4. The view keeps the layout 0273 and 0277 gave it: the boxes, the rows, and the info buttons and controls lined up. (checked by review)

## Out of scope
- Borders elsewhere in the panel.

## Notes
- Seen on an iPhone on 2026-10-17, and measured in Chromium at 390 px wide: `button.info` at left 173.5, `select.edit` at left 199.5, with `.5px` borders (`templates/panel.html`, `#settings .setting` rules).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
