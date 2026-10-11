---
id: "0105"
title: "Show the ship queue in the panel"                # one outcome, no "and"
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
# 0105 · Show the ship queue in the panel

**Status:** ❌ cancelled

## Problem
Once ships go through a queue, a non-technical user needs to see where each approved ticket is without reading logs: waiting its turn, being helped through, waiting for a decision, or held because `main` is failing.

## Outcome
The panel shows each approved ticket's place in the ship queue, and when shipping is on hold, in plain words.

## Acceptance criteria
1. An approved ticket waiting to ship shows "In the ship queue" with its position.
2. While the shipping agent works on a ticket, it shows "Catching up with main".
3. A ticket the queue set aside shows "Needs your decision" with its question.
4. When the queue is on hold because `main` is failing, the panel shows one line saying shipping is on hold until `main` passes, naming the fix ticket if there is one.

## Out of scope
- Buttons to reorder or retry the queue.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
