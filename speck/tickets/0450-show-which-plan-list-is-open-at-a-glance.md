---
id: "0450"
title: "Show which Plan list is open at a glance"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0444"]                # ticket ids that must be done first
created: 2026-10-24

---
# 0450 · Show which Plan list is open at a glance

**Status:** 📝 draft

## Problem
In Plan, the selected one of Tickets, Ideas and Inbox differs from the others only by a slightly darker border, so you can't tell which list is open.

## Outcome
The open Plan list's button is clearly selected.

## Acceptance criteria
1. The selected one of Tickets, Ideas and Inbox is filled: its background is the text colour and its text the background colour, in both looks. The other two stay outlined, as today.
2. A screen reader hears which of the three is selected.
3. The selected button's fill meets 3:1 against the background beside it, and its text 4.5:1 against its fill, in both looks.

## Out of scope
- The Plan, Build and Shipped tabs (0425).

## Notes
- For release 0.15.0 (0452). The user asked on 2026-10-24 for everything relevant to the release to be ticketed.
- From the user's phone screenshot on 2026-10-24: "I don't know which item I've selected out of tickets/idea/inbox."
- Today: `.toggle` and `.toggle.on` in `templates/panel.css`.
- Waits for 0444: both change `templates/panel.css`. 0442 waits for this one.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
