---
id: "0463"
title: "Lay out an open ticket that hasn't started like one in flight"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0462"]                # ticket ids that must be done first
created: 2026-10-24

---
# 0463 · Lay out an open ticket that hasn't started like one in flight

**Status:** 📝 draft

## Problem
After 0461 and 0462, an open ticket in flight shows a step track and an even table of facts, but an open ticket in Plan, or one queued in Build, still lists its facts in a line joined by dots that wraps on a phone. The cards don't look like one family.

## Outcome
An open ticket that hasn't started shows the same step track and table as one in flight.

## Acceptance criteria
1. An open ticket in Plan's Tickets list, and an open ticket queued in Build, shows under its title the same step track as 0461 and the same table as 0462: the same bars, colours, cell sizes, lines, label and value places, one line per value with `…` and the full text as its tooltip. All five bars and names are grey, as no step has started.
2. Its table's six cells are `After` (the tickets it waits on, as links, or `unlocks` and the tickets it unlocks when it starts a chain, or `—`), `Criteria` (how many), `Lint` (`passes`, or its errors and warnings in their colours), `Priority`, `Size · risk` and `Type`, in that order. In Build, the `After` cell is labelled `Waiting on`.
3. The line joined by dots is gone from these open tickets, and what's under it (the criteria, the priority control, Set ready, Full ticket and so on) stays as it is. A closed ticket keeps its one short line. Checked in a real browser at 320 px and 390 px, with a value longer than its cell.
4. A screen reader reads each cell as its label and value. No test that passed before this change fails.

## Out of scope
- Ideas and Inbox items.
- Shipped tickets (0464) and the full ticket (0465).

## Notes
- Asked for by the user on 2026-10-24, after choosing the step track and facts grid for open build tickets (0461, 0462; mock-ups at https://claude.ai/artifact/BANvGzKKYy1p4AjBipypTb): "that layout should just be the template for all tickets in plan and ship. And also when you open a ticket in the full screen mode, like that table should be there as well."
- Today: `ticketHead` draws a Plan ticket's line (priority, size, risk, criteria, lint, after or unlocks), and `queuedLine` a queued one's, both in `templates/panel.js`.
- Waits for 0462, whose table this reuses.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
