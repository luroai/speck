---
id: "0457"
title: "Join the open tab to the lane under it"                # one outcome, no "and"
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
after: ["0455"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T10:08:21.543Z"

---
# 0457 · Join the open tab to the lane under it

**Status:** 🔨 building

## Problem
The open tab (Plan, Build or Shipped) has a line along its bottom, from its own border and from the line under the tab row, so it looks like a separate button sitting above its lane. It should look like the tab of a file folder: one piece with the page under it.

## Outcome
The open tab and its lane read as one sheet of paper, with no line between them, while the other tabs sit behind it.

## Acceptance criteria
1. Under the open tab, whichever of Plan, Build and Shipped it is, there's no line: neither the tab's own bottom edge nor the line under the tab row shows across its width.
2. The open tab's background is the same colour as the lane directly under it, in the light and dark looks, so the two read as one piece.
3. The open tab keeps its top, left and right edges in the text colour and its rounded top corners. The other tabs keep all four edges, and the line under the tab row still shows under them. Choosing another tab moves the gap to it.
4. On a phone-sized page at a device pixel ratio of 3, in a real browser, no line shows under the open tab and the line under the other tabs shows, for each of the three tabs open in turn. No test that passed before this change fails.

## Out of scope
- The Tickets, Ideas and Inbox tabs inside Plan.

## Notes
- Asked for by the user on 2026-10-24, from a phone screenshot of the Build tab: "that tab to almost look like a filing piece of paper … that line shouldn't be underneath or at the bottom of the open tab."
- Today: `.tabs` has `border-bottom: .5px solid var(--line)`, and `.tab[aria-selected="true"]` has a full border in `var(--text)` on a `var(--panel)` background, in `templates/panel.css`. Tabs get their top corners from `.tab { border-radius: 8px 8px 0 0; }` further down the file.
- The tabs are `<button>`s, so 0453 (every button drawn on all four sides) covers them. The open tab's missing bottom edge is this ticket's deliberate exception to 0453.
- Waits for 0455, which waits for 0454 and 0453: all change `templates/panel.css`.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
