---
id: "0425"
title: "Give the lane tabs equal widths"                # one outcome, no "and"
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
after: ["0420"] # ticket ids that must be done first
created: 2026-10-23

---
# 0425 · Give the lane tabs equal widths

**Status:** 📋 ready

## Problem
The Plan, Build and Shipped tabs (0410) are different widths and heights: Build and Shipped show their counts under their names ("1 in flight · 12 queued", "395 in total"), and Plan has none, so the row looks uneven.

## Outcome
The three tabs are the same size and share the row, and each lane's counts are at the top of the lane.

## Acceptance criteria
1. At every window width from 320 px up, the three tabs share the tab row's full width equally: each is a third of it, to within 1 px, and all three are the same height.
2. Each tab shows its name on one line, and nothing else, except Build's needs-you number. While the Foreman's status reads `Needs you <n>` and Plan or Shipped is open, Build shows `<n>` in the panel's crimson after its name, and its accessible name includes `<n> needs you`.
3. The counts that are under Build's and Shipped's names today are the first line of their lane, above its tickets: Build's `<n> in flight · <n> queued` and Shipped's `<n> in total`, with the same wording and numbers as today.
4. The tabs still open with a click, Tab and Enter or Space, and the left and right arrow keys, as 0410 made them.

## Out of scope
- Borders round a lane or its tickets (0418).
- Shipped's stats tiles (0420).

## Notes
- The user asked for this on 2026-10-23.
- Changes 0410's tab row: criterion 2 replaces 0410's `<n> needs you` text on the Build tab with the number alone, so the tabs fit a third of 320 px.
- Today: `.tabs`, `.tab`, `#queue-n`, `#shipped-n` and `#build-needs` in `templates/panel.html`.
- Waits for 0420, which also changes the Shipped count. Builds alongside 0421 to 0424 (the user, 2026-10-23), which change other parts of `templates/panel.html`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
