---
id: "0049"
title: "Mark bug tickets in the ticket list"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T17:03:46.145Z"

---
# 0049 · Mark bug tickets in the ticket list

**Status:** 🔨 building

## Problem
Bugs and features look the same in the ticket list, so a bug that loses work (such as 0046) doesn't stand out from routine features when you choose what to set ready or build next.

## Outcome
A ticket can be marked as a bug, and bug tickets have a visible bug tag wherever tickets are listed.

## Acceptance criteria
1. A ticket's frontmatter can have `type: bug`. `speck lint` accepts a missing or blank `type` or `bug`, and gives an error naming the field for any other value. The ticket template has the field, blank, with a comment listing the values.
2. `speck new "<title>" --type=bug` creates the ticket with `type: bug`. Any other `--type` value is refused with a plain message, creating nothing.
3. `speck status` shows `bug` after the id of each bug ticket, and `speck status --json` has `type` for every ticket (`"bug"`, or `null` when missing or blank).
4. In the panel, a bug ticket shows a "bug" tag beside its id in Shaping, the queue and Shipped, in a colour of its own: not the tickets blue, the ideas purple, the blocked red (`--bad`) or the warning orange (`--warn`). Other tickets show no tag.
5. `/speck-ticket` says to create a ticket that fixes a defect with `--type=bug`.

## Out of scope
- Other types, such as chore or feature.
- Sorting or filtering by type.

## Notes
- 0046 and 0047 already have `type: bug` in their frontmatter, ahead of this ticket.
- No external facts: everything is in this repo.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
