---
id: "0468"
title: "Mark a closed ticket's dependencies with a chip"                # one outcome, no "and"
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
after: ["0467"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T13:07:10.567Z"

---
# 0468 · Mark a closed ticket's dependencies with a chip

**Status:** 🔨 building

## Problem
A closed ticket in Plan or Build names the tickets it waits on, or unlocks, as text in its second line, which runs long and wraps on a phone when there are many.

## Outcome
A closed ticket shows its dependencies as one small chip at the end of its title row.

## Acceptance criteria
1. A closed ticket in Plan or Build that waits on tickets that haven't shipped shows, at the end of its title row, a chip with a link icon and how many, such as `11`. One that waits on none, but that tickets which haven't shipped wait on, shows a chip with an arrow icon and how many wait on it directly. A ticket with neither shows no chip.
2. The chip's accessible name and tooltip say what it counts, such as `Waits on 11 tickets` or `4 tickets wait on this`. Pressing it opens the card, as pressing its top row does.
3. The `after`, `unlocks` and `waiting on` ids are gone from closed cards' second lines. The title stays on one line with `…`, and the chip never wraps under it, at every width from 320 px, checked in a real browser.
4. No test that passed before this change fails.

## Out of scope
- Open cards and the full ticket (0467).
- Shipped tickets.

## Notes
- Asked for by the user on 2026-10-24, choosing option E in the mock-ups (https://claude.ai/artifact/BANvGzKKYy1p4AjBipypTb): "on the collapsed ticket, there's just a link or just a little icon which kind of shows you where it's the top of the dependency or it is linked to something else."
- Today: `ticketHead` and `queuedLine` in `templates/panel.js` put `after`, `unlocks` or `waiting on` and the ids in the second line.
- Waits for 0467: both change those functions.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
