---
id: "0454"
title: "Keep the Settings button clear of speck's screen"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0453"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T09:34:10.913Z"

---
# 0454 · Keep the Settings button clear of speck's screen

**Status:** 🔨 building

## Problem
On a phone, the Settings button in the screen frame's title row touches the top of speck's screen. On a touch screen the button grows to 44 px and is pulled out of the row with negative margins, so its bottom edge sits on the screen.

## Outcome
The Settings button sits inside the frame's title row with a clear gap above speck's screen, on a phone as well as with a mouse.

## Acceptance criteria
1. At every window width, on a touch screen as well as with a mouse, there's a gap of at least 4 px between the bottom of the Settings button and the top of speck's screen, and the button doesn't overlap the screen.
2. On a touch screen the button is still at least 44 × 44 px, with the title row tall enough to hold it. With a mouse it stays its current size.
3. Pressing anywhere on the screen still opens the pipeline log, and pressing the button still opens Settings.

## Out of scope
- The frame's corners and alignment (0438).

## Notes
- From the user's phone screenshot on 2026-10-24.
- Today: `.bezel .settings-open` in `templates/panel.css`, with `width: 44px; height: 44px; margin: -4px -2px -4px 0` on a touch screen.
- Waits for 0453: both change `templates/panel.css`.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
