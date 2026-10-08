---
id: "0008"
title: "Cancel a ticket with a recorded reason"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | done
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-08

---
# 0008 · Cancel a ticket with a recorded reason

**Status:** 📋 ready

## Problem
Once you decide not to build a ticket, the only options are to delete it or leave it as a draft. Either way, there's no lasting record that the idea was considered and turned down, or why, so it can come back later as new work.

## Outcome
A ticket you decide against can be cancelled with a reason. It's filed away with finished work and stays visible as cancelled, with that reason, so later ideas and tickets can be checked against it.

## Acceptance criteria
1. `speck cancel <id> "<reason>"` sets the ticket's status to `cancelled`, stores the reason and the date it was cancelled in the ticket, moves the file into `speck/tickets/done/` and rewrites the header as `**Status:** ❌ cancelled`. It works from any status except `done`.
2. `speck cancel` refuses and changes nothing when the reason is missing or blank, when the ticket is already `done` (delivered work can't be cancelled) or when it's already `cancelled`.
3. `speck set <id> status cancelled` refuses and points to `speck cancel`. Setting a cancelled ticket to any other status moves it back to `speck/tickets/` and keeps the recorded reason.
4. `speck status` lists cancelled tickets in a `CANCELLED` group after `DONE`, with each ticket's reason on the line below it. `speck new` never reuses a cancelled ticket's number.

## Out of scope
- Updating the source idea when its tickets are cancelled (0009 records which tickets an idea became).
- Checking new ideas or tickets against cancelled ones (0010).
- Cleaning up branches or review rounds for a ticket cancelled mid-build.

## Notes
- Cancelled tickets sit in `speck/tickets/done/` with finished ones, so `speck/tickets/` holds only live work. That folder now means "closed" rather than strictly "delivered".
- `speck ship` already refuses anything that isn't `approved`, so it needs no change.
- Update `speck/product.md`, `docs/brief.md`, the status comment in `templates/ticket.md` and the `/speck-status` skill to cover the new status.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
