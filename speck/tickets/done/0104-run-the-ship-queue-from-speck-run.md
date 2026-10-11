---
id: "0104"
title: "Run the ship queue from speck run"                # one outcome, no "and"
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
# 0104 · Run the ship queue from speck run

**Status:** ❌ cancelled

## Problem
With builds ending at approved (0103), `speck run` needs to keep the ship queue moving, so approved tickets ship without anyone running a command.

## Outcome
`speck run` runs the ship queue whenever an approved ticket is eligible, alongside its builds.

## Acceptance criteria
1. While it runs, `speck run` starts `speck ship-queue` whenever an eligible approved ticket is waiting and no queue is running. The queue doesn't count towards `max_parallel_builds`.
2. When the queue is on hold because `main` is failing, `speck run` says so once and runs the queue again after the base branch changes.
3. Ctrl+C stops the queue between tickets. A shipping agent at work is stopped as builds are.
4. A ticket that becomes ready because what it waited on has shipped (`after:`) is launched as before.

## Out of scope
- The panel (0105).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
