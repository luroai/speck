---
id: "0420"
title: "Fit each shipped ticket on two lines"                # one outcome, no "and"
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
after: ["0419"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T17:34:40.875Z"

---
# 0420 · Fit each shipped ticket on two lines

**Status:** 🔨 building

## Problem
A shipped ticket takes five rows: its title, its bug tag, when it shipped, its figures, then a Details button. Above the list, three stat tiles and a More stats button take another 150 px. With ten shipped tickets (0411), Shipped is mostly empty space.

## Outcome
Each shipped ticket is two lines, and the stats above the list are one line.

## Acceptance criteria
1. Each shipped ticket shows its id and title, with its bug or fix tag after the title, then one line in smaller type: when it shipped, then its figures as the figures line shows them today (minutes, rounds and cost), separated by ` · `.
2. A small Details button at the end of the second line opens and closes the ticket's details as the Details button does today, and the title still opens the full ticket.
3. The stats above the list are one line, such as `24 shipped today · median 10 min · $1.77 median builder cost`, followed by More stats, which opens the other figures as today.
4. A ship that didn't push still shows its warning under its ticket, as today.
5. At 420 px wide, with a mouse as the main pointer, a shipped ticket whose title fits on one line is no more than 56 px tall.

## Out of scope
- How many shipped tickets show (0411).

## Notes
- Asked for by the user on 2026-10-23: the panel is used mostly in a thin side pane, and its tickets are too tall there.
- Today's layout is 0157 and 0162 (`#shipped` in `templates/panel.html`).
- Waits for 0419: both change `templates/panel.html`.
- Failing before this build: none
- Stats line wording: the example in AC3 ("24 shipped today · median 10 min · $1.77 median builder cost") measures about 406 px of 12 px text, and only about 300 px is free beside More stats in a 420 px pane. The line is `24 today · median 10 min, $1.77`, the same three figures, with each one's tooltip saying what it is ("Tickets shipped today", "Median builder cost, over 2 tickets"). "Shipped today" was cut to "today" as it didn't fit beside Fewer stats, which More stats becomes when pressed, with real figures such as 34 tickets.
- Ship time in a card's line: the time alone today, as before, but the day alone ("20 Oct") for an earlier day, without "Shipped" or the time, so a line with every figure fits beside Details at 420 px with a scroll bar. The line's tooltip gives "Shipped 20 Oct, 17:42 · …". On a phone (375 px), a line that still doesn't fit wraps between its parts rather than being cut off (0157 AC5).
- Older tests changed to the new layout: 0035 (panel.test.mjs), 0050, 0058, 0120, 0157, 0161 (the shipped tag is a small box in the title's line, exempted as 0419's in-line tags are) and 0162.
- Self-check: no changes

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
