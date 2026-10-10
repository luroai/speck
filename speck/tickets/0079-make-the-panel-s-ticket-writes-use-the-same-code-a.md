---
id: "0079"
title: "Make the panel's ticket writes use the same code as speck set"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 4              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0018"]                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T12:12:28.556Z"

---
# 0079 · Make the panel's ticket writes use the same code as speck set

**Status:** 🔨 building

## Problem
The panel's Ready and priority buttons (0042, 0077) each have their own copy of the checks and the field write that `speck set` does, while pause, play and stop already call the same code as the CLI. Two copies drift: a rule added to `speck set` wouldn't apply in the panel, and an out-of-range priority already gets different wording in each.

## Outcome
The panel sets a ticket's status and priority through the same code as `speck set`, keeping its own extra rules, so the two can't drift.

## Acceptance criteria
1. The panel's Ready and priority writes use the same code as `speck set` to check the value and write the field. No second copy of those checks or that write is left in the panel's code.
2. A ticket that fails the size rules is refused by the panel's Ready with exactly the `Not ready:` text that `speck set <id> status ready` prints, and nothing is changed or committed.
3. A priority outside 1 to 5 is refused by the panel with exactly the message `speck set <id> priority <value>` prints for that value, and nothing is changed or committed.
4. The panel's own rules are unchanged: only drafts, only on the base branch, only that ticket committed, the same commit messages (`speck(<id>): ready`, `speck(<id>): priority <n>`) and the same responses on success.
5. After a successful panel write, the ticket file is byte for byte what `speck set` writes for the same change.

## Out of scope
- New panel writes.
- Changing `speck set`'s behaviour, messages or the fact that it doesn't commit.

## Notes
- From the rule "the panel writes to the repo only through CLI functions" in `speck/ideas/2026-10-10-more-human-gate-actions-in-the-panel.md`. Pause, play and stop already follow it (`panelPausePlay`, `panelStop` call `pauseBuild`, `playBuild`, `stopBuild`).
- Assumption: AC3 changes the panel's wording to the CLI's. Today the panel says `Priority must be a whole number from 1 to 5, not "<value>".` and `speck set` says `priority must be a whole number from 1 to 5, or "" to clear it (got "<value>").`
- After 0018, so the change lands in the panel's own module.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
