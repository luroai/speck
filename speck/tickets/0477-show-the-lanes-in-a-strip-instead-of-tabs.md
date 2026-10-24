---
id: "0477"
title: "Show the lanes in a strip instead of tabs"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0476"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T15:30:02.992Z"

---
# 0477 · Show the lanes in a strip instead of tabs

**Status:** 🔨 building

## Problem
Once the lanes slide as cards (0476), each card names its own lane at its top, so the row of three tabs above them repeats the names and takes room. But you still need to see at a glance which lane you're on, which others there are, and whether Build needs you.

## Outcome
A thin strip under speck's screen shows every lane and which is in view, in place of the tabs.

## Acceptance criteria
1. The Plan, Build and Shipped tabs are gone. In their place, a strip at most 32 px tall under speck's screen shows each lane in order, as its name or a dot for each, with the lane in view marked in the text colour and the others muted.
2. Build's place in the strip shows how many tickets need you, in the colour the tab's number has today, whichever lane is in view, and hides it at none.
3. Pressing a lane in the strip slides to it, as a swipe does. Each is reachable with Tab and pressed with Enter or Space, at least 44 × 44 px to tap, and a screen reader hears it as a tab of the lanes, with the one in view selected.
4. The strip keeps to one row at every width from 320 px, and adding a fourth lane to the row needs no change to the strip's styles, checked in a real browser. No test that passed before this change fails.

## Out of scope
- How the lanes slide (0476).
- More lanes.

## Notes
- Asked for by the user on 2026-10-24: "that also means that the tabs at the top need to be different … the whole pane would be a card, and at the top of the card would be the title."
- Mock-up the user approved on 2026-10-24, with 0476 to 0478 together: https://claude.ai/artifact/3sE9DU2PdnsvR6p1tLNw8j.
- Earlier: 0066 (cancelled: "Changed my mind: keeping the current panel layout") would have swiped between Shaping and Queue, before the tabs. `speck/ideas/done/2026-10-08-speck-board.md` decided the panel isn't a kanban board, as only the two ends of the pipeline are human. This keeps that: one lane in view at a time, a view of the same pipeline, with no dragging cards between lanes.
- Decided by the user on 2026-10-24: the panel stays thin, a phone screen or a side panel beside an agent chat, "a bolt-on thing to the side, not an actual product on its own". A wider window doesn't show more lanes.
- 0457 joined the open tab to the lane under it like a folder's tab; this replaces the tabs, so that look goes too.
- Waits for 0476: both change the header's and the lanes' script and styles. Built for release 0.15.0.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
