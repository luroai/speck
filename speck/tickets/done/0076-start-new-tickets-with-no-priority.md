---
id: "0076"
title: "Start new tickets with no priority"                # one outcome, no "and"
status: cancelled            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-set-a-ticket-s-priority-with-a-click.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0075"]                # ticket ids that must be done first
created: 2026-10-09
cancel_reason: "Changed my mind: new tickets keep starting at P3, and priority is changed from the panel (0077)."
cancelled: 2026-10-09

---
# 0076 · Start new tickets with no priority

**Status:** ❌ cancelled

## Problem
Every new ticket gets priority 3 from the template, and `/speck-ticket` sets 3 when the user gives none. A 3 the user never chose looks the same as one they did, so there's no telling which tickets have been triaged.

## Outcome
A new ticket has no priority until someone sets one.

## Acceptance criteria
1. `speck new` makes a ticket with no priority (`priority: ""`, keeping the line's comment), and `speck status` shows it as `P-`.
2. `templates/ticket.md` has no priority set, so a project set up or refreshed with `speck init` makes tickets with no priority too. `speck init` leaves the priority of existing tickets as it is.
3. `/speck-ticket` sets a priority only when the user gives one, and otherwise leaves it blank, for tickets made from triage too. No skill or doc says a new ticket gets priority 3.
4. A ticket with no priority passes `speck lint` and can be set ready with `speck set <id> status ready` (it's the ready ticket `speck run` builds last, as in 0075).

## Out of scope
- Existing tickets: they keep the priority they have.
- Setting priority from the panel (0077).

## Notes
- After 0075, which makes a blank priority work everywhere.
- Without the panel, priority is set with `speck set <id> priority <1-5>` or by asking the agent; nothing requires it.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
