---
id: "0114"
title: "Refuse edits to a ticket that's being built"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-one-build-at-a-time.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T10:42:56.503Z"

---
# 0114 · Refuse edits to a ticket that's being built

**Status:** 🔨 building

## Problem
With one build at a time, the user keeps editing tickets on the base branch while a build runs. If they change the ticket being built, its file differs on both sides and the ship's merge conflicts, stopping a build that had nothing wrong with it.

## Outcome
speck refuses to change a ticket from the base branch's checkout while it's being built, and the ticket skill tells the agent not to edit one.

## Acceptance criteria
1. `speck set <id> <field> <value>`, run in a checkout other than the one where the ticket's branch is checked out, refuses when the ticket's branch is checked out in a worktree and its status there is `building`, `reviewing`, `blocked` or `approved`. It says the ticket is being built in that folder, to wait until it ships or to change it there, and changes nothing.
2. `speck set` run in the ticket's own worktree works as it does today, so builds can still set their own status.
3. `speck cancel <id>` refuses in the same case, with the same kind of message.
4. The `speck-ticket` skill says never to edit a ticket that's being built (any status from `building` to `approved`), and to put changes in a new ticket or wait until it ships.
5. A ticket whose branch isn't checked out anywhere can be changed as it is today.

## Out of scope
- Stopping someone editing a ticket's file by hand.
- Shipping around staged changes (0115).

## Notes
- The panel's writes only touch drafts, so they don't need changing.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
