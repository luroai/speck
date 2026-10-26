---
id: "0520"
title: Give ideas their own Capture lane                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0519"]                # ticket ids that must be done first
created: 2026-10-26
started: "2026-10-26T22:18:48.074Z"

---
# 0520 · Give ideas their own Capture lane

**Status:** 🔨 building

## Problem
Plan's Tickets, Ideas and Inbox buttons take a whole row at the top of the lane, on a phone where space is short, and show only one of the three lists at a time. Ideas and inbox notes are the roughest stage of the work, and they belong in a lane of their own, to the left of Plan.

## Outcome
The panel has a Capture lane, left of Plan, holding every idea and inbox note, and Plan holds only tickets.

## Acceptance criteria
1. The lanes are Capture, Plan, Build and Shipped, in that order, in the strip and as cards. The panel still opens on Build, and swiping, a sideways trackpad scroll, the arrow keys and the strip move between all four as they do between three today.
2. Capture lists every idea note and inbox note (those whose status is `idea` or `inbox`) in one list, newest captured first, each as a closed card like today's idea cards that opens to the note's whole text. Notes with any other status, such as `ticketed (…)` or `dropped`, aren't listed. With none, the lane says "Nothing captured."
3. Capture changes nothing: it has no buttons, menus or fields, and nothing in it writes to a note or a ticket. Opening and closing a note to read it is all it does.
4. Plan lists only draft tickets, with no Tickets, Ideas or Inbox buttons, and its list starts straight under its title. The brief describes the Capture lane and Plan holding only tickets.
5. No test that passed before this change fails, apart from tests of Plan's Tickets, Ideas and Inbox buttons, which change to check Capture.

## Out of scope
- Labelling ideas an agent raised (0521).
- Any way to ticket, drop or edit a note from the panel: see Notes.
- Card heights (0519).

## Notes
- Asked for and named 2026-10-26: Capture → Plan → Build → Shipped, "clarity is almost less on the left, and it gets sharper as it moves right. A list of ideas that either make it through or get culled."
- Hard rule from the user, 2026-10-26: what's in Capture is managed only in chat ("like having a meeting with my team"), never from the panel. Criterion 3 keeps it so.
- Order decided by the user: newest first, by the `Captured:` date (an idea's status is read from that line, never its body).
- Today: Plan's buttons are `shapingToggle` and `shapingView` in `templates/panel.js`, with `ideaItem`, `inboxItem` and `noteItem`; the lanes are `LANES` and `TAB_ORDER` in `templates/panel-header.js` (0476, 0477); the page is `templates/panel.html`.
- After 0519, which also changes Plan's closed cards in `templates/panel.js` and `templates/panel-cards.css`.
## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
