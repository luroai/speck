---
id: "0075"
title: "Treat a ticket with no priority the same everywhere"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T22:28:44.275Z"

---
# 0075 · Treat a ticket with no priority the same everywhere

**Status:** 🔨 building

## Problem
speck doesn't handle a ticket with no priority consistently. `speck status` lists `priority: ""` as `P` above P1 tickets and a bare `priority:` as `P[object Object]`, while `status --json` (and so `speck run` and the panel) puts both last. Nothing checks the value either: `speck set <id> priority high` is accepted, and there's no way to clear a priority with `speck set`. It still matters for tickets edited by hand.

## Outcome
A ticket's priority is always a whole number from 1 to 5 or none, and a ticket with none is shown and ordered the same way everywhere.

## Acceptance criteria
1. A ticket whose `priority` line is missing, `priority:` with nothing after it, or `priority: ""` has no priority. `speck status` shows it as `P-` and lists it after every ticket in its status group that has one, then by id. `speck status --json` gives it `priority: null` and lists it after every ticket with one, so `speck run` launches it after ready tickets with a priority.
2. `speck lint` gives an error (✗) for a priority that is neither none nor a whole number from 1 to 5, such as `0`, `6`, `2.5` or `high`, and `speck set <id> priority <value>` refuses such a value with a plain message and a non-zero exit, changing nothing.
3. `speck set <id> priority ""` clears the priority, leaving `priority: ""` with the line's trailing comment kept, and the ticket then has no priority as in criterion 1.
4. The panel shows no priority tag for a ticket with no priority, in each of the three forms in criterion 1.

## Out of scope
- Changing what priority new tickets get: they start at P3.
- Setting priority from the panel (0077).

## Notes
- Reproduced 2026-10-09 in a fresh `speck init` repo: `speck status` printed `0002  P  S/low  b` above a P1 ticket for `priority: ""`, and `P[object Object]` for a bare `priority:`, while `status --json` gave `""` and `{}` and put both last.
- `speck set` refuses every blank value today (`Usage: speck set <id> <field> <value>`); only `priority` changes here.
- The text sort is in `cmdStatus` (`a.fm.priority ?? 9`), and the JSON sort is `rank` in `statusData`.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
