---
id: "0439"
title: "Refuse a status change on a done ticket"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-24T07:32:35.385Z"

---
# 0439 · Refuse a status change on a done ticket

**Status:** 🔨 building

## Problem
`speck set <id> status <value>` accepts a ticket that's already done. Setting it ready moves the shipped ticket out of `speck/tickets/done/` and back into the queue. On 2026-10-23 that reopened 0436 after it had shipped: `speck run` wouldn't build it again, and every ticket waiting on it stalled until the commit was reverted.

## Outcome
A done ticket's status can't be changed by `speck set` or the panel, so shipped work stays shipped.

## Acceptance criteria
1. `speck set <id> status <value>` on a ticket whose status is `done` refuses with a message saying the ticket is done and shipped, so its status can't change, and exits non-zero. Nothing changes: the file stays in `speck/tickets/done/` with `status: done`, and nothing is committed.
2. The panel's Set ready and Back to Plan refuse a done ticket the same way, with the same message, as they share `speck set`'s checks.
3. Status changes on tickets that aren't done work as before, and `speck ship` still sets a ticket done and files it in `speck/tickets/done/`.
4. `docs/brief.md`'s `speck set` row says it refuses to change a done ticket's status.

## Out of scope
- Changing other fields of a done ticket, such as its title or priority.
- Cancelled tickets, which `speck set` treats as today.

## Notes
- The check belongs in `checkSetTicket` in `scripts/speck.mjs`, which `speck set` and the panel (`scripts/panel.mjs`) both call. `speck ship`, PR ship and install file a ticket as done with `placeTicket` directly, so they're unaffected.
- `speck cancel` already refuses a done ticket: "delivered work is part of the record".
- Waits for nothing: no open ticket changes these files.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
