---
id: "0418"
title: "Lay the panel out in one column at every width"                # one outcome, no "and"
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
after: ["0417"] # ticket ids that must be done first
created: 2026-10-23

---
# 0418 · Lay the panel out in one column at every width

**Status:** 📋 ready

## Problem
The panel keeps a separate layout for wide windows, with its own rules, but it's used mostly in a narrow side pane, and since 0410 the lanes are tabs showing one list at a time. Each lane is also a box of boxes, with a border round the lane and another round each ticket, which takes width and height in a narrow pane.

## Outcome
The panel has one layout, a single column, at every width, and each lane is a plain list.

## Acceptance criteria
1. At every window width from 320 px up, the panel shows one column: the screen at the top, the tabs, then the open lane's list. Nothing moves into a second column on a wide window.
2. On a window wider than 720 px, the column is 720 px wide and centred. At 720 px or less, it fills the width.
3. Each lane's tickets are one list with a thin line between them, with no border round the lane and none round each ticket. A ticket's tint or edge for its state (needs you, waiting for you, being built) still shows as today.

## Out of scope
- How tall each ticket is (0419, 0420).
- Settings, the full ticket and other pop-ups.

## Notes
- Asked for by the user on 2026-10-23: the panel is used mostly in a thin side pane, and its tickets are too tall there. A separate desktop layout isn't needed any more.
- Waits for 0417: both change `templates/panel.html`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
