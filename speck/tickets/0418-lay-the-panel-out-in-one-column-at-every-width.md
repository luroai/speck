---
id: "0418"
title: "Lay the panel out in one column at every width"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
started: "2026-10-23T16:07:18.865Z"

---
# 0418 · Lay the panel out in one column at every width

**Status:** 🔨 building

## Problem
The panel keeps a separate layout for wide windows, with its own rules, but it's used mostly in a narrow side pane, and since 0410 the lanes are tabs showing one list at a time. Each lane also has a border of its own round its tickets' boxes, which takes width in a narrow pane and makes the tickets harder to pick out.

## Outcome
The panel has one layout, a single column, at every width, and a lane has no border of its own round its tickets.

## Acceptance criteria
1. At every window width from 320 px up, the panel shows one column: the screen at the top, the tabs, then the open lane's list. Nothing moves into a second column on a wide window.
2. On a window wider than 720 px, the column is 720 px wide and centred. At 720 px or less, it fills the width.
3. A lane has no border round it: its tickets sit directly under the tabs. Each ticket keeps its own full border, as today, and its tint or edge for its state (needs you, waiting for you, being built) still shows as today.

## Out of scope
- How tall each ticket is (0419, 0420).
- Settings, the full ticket and other pop-ups.

## Notes
- Asked for by the user on 2026-10-23: the panel is used mostly in a thin side pane, and its tickets are too tall there. A separate desktop layout isn't needed any more. Each ticket keeps its full box (the user, 2026-10-23).
- Waits for 0417: both change `templates/panel.html`.
- Failing before this build: none
- Self-check: Settings and the full ticket share the class names `.sh`, `.detail`, `.ready` and `.resume` with the lanes, so the one-column rules for those apply only inside the lanes (`main …`), and their rules for narrow windows stay as they were for Settings and the full ticket.
- Older tests changed to match: 0060, 0135, 0157, 0160, 0161, 0167, 0281 and 0417 checked the separate wide layout or the lane's border, which this ticket removes.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
