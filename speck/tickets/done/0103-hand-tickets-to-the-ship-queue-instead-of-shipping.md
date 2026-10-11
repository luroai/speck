---
id: "0103"
title: "Hand tickets to the ship queue instead of shipping from builds"                # one outcome, no "and"
status: cancelled            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-a-shipping-agent-that-heals-the-build.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0102"]                # ticket ids that must be done first
created: 2026-10-10
cancel_reason: "Ship queue no longer needed: speck runs one build at a time (WIP 1), so each build ships its own ticket, in order. See the WIP 1 principle in docs/brief.md."
cancelled: 2026-10-11

---
# 0103 · Hand tickets to the ship queue instead of shipping from builds

**Status:** ❌ cancelled

## Problem
Builds ship their own tickets at the end of `/speck-build` with `speck ship --auto`, and `/speck-ship` merges straight away. With a ship queue (0102), both should hand tickets to the queue instead, so ships happen one at a time and in order.

## Outcome
`/speck-build` ends at approved and hands the ticket to the ship queue, and `/speck-ship` marks the ticket for shipping and runs the queue.

## Acceptance criteria
1. The build skill no longer runs `speck ship` or merges the base branch when shipping fails. After `speck close`, if `auto_ship` covers the ticket, it runs `speck ship-queue` and reports what it says; otherwise it says the ticket waits for `/speck-ship`.
2. `/speck-ship <id>` runs `speck ship-queue --add <id>`, then `speck ship-queue`, and reports in plain words whether the ticket shipped, is waiting its turn, needs a decision (with the question) or is held because `main` is failing.
3. `/speck-ship` is still the user's gate: only the user can start it.

## Out of scope
- `speck run` (0104).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
