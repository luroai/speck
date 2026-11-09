---
id: "0582"
title: "Show the lanes as tabs with their counts"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0580"]                # ticket ids that must be done first
created: 2026-11-09

---
# 0582 · Show the lanes as tabs with their counts

**Status:** 📋 ready

## Problem
The lane strip is a row of small marks that the user has found hard to read (an inbox note asked to mark the lane in view more clearly). The redesign shows the four lanes as clear tabs with their counts.

## Outcome
The lanes are shown as four tabs with their counts, and the open one is plain to see.

## Acceptance criteria
1. Under the bar, four tabs, Capture, Plan, Build and Shipped, each show their lane's name and how many it holds; the open lane's tab is underlined in the accent colour and its name is in the text colour, the others muted. Each tab is at least 44 px tall.
2. Pressing a tab opens its lane, and swiping, the trackpad and the arrow keys still change lane as they do today, moving the underline with them.
3. The tabs are a tab list to a screen reader, with the open one marked as selected.
4. The counts change as the board does.
5. Tests that checked the old look of what this changes are updated to the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- What each lane's rows look like (0585, 0586, 0587).

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today: `nav.tabs#tabs` in `templates/panel.html`, drawn by `openTab` and `drawTabs` in `templates/panel-header.js`, with the swipe code beside them (`placeLanes`, `slideFrom`, `stepLane`), styled in `templates/panel-header.css`.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
