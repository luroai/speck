---
id: "0421"
title: "Trim an open ticket's card"                # one outcome, no "and"
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
after: [] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T17:53:55.291Z"

---
# 0421 · Trim an open ticket's card

**Status:** 🔨 building

## Problem
An open ticket's card shows its worktree's full path, which nobody uses, and its Full ticket, Review pack and Stop build buttons are big boxed buttons that take a row of their own above the build log.

## Outcome
An open ticket's card has no worktree line, and its buttons are small.

## Acceptance criteria
1. An open ticket's card doesn't show its worktree path.
2. Full ticket, Review pack and Stop build, whichever the card has, are small text buttons on one line, with Stop build last. With a mouse as the main pointer, each is no more than 28 px tall.
3. Stop build still asks first, then stops the build as today, and still shows why if the server refuses.

## Out of scope
- The build log under the buttons (0422).
- Whether Stop build should exist: it stays, as it's the panel's only way to end a build that's going wrong.

## Notes
- The user asked for this on 2026-10-23.
- Today: the `act path` line and the `full-open` and `stop-build` buttons in `templates/panel.html`.
- Builds alongside 0420, 0422 and 0423 (the user, 2026-10-23): each changes a different part of `templates/panel.html`. This one changes the open card's buttons and worktree line.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
