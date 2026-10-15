---
id: "0178"
title: "Keep the panel's full board small as tickets ship"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0188"]                # ticket ids that must be done first
created: 2026-10-14

---
# 0178 · Keep the panel's full board small as tickets ship

**Status:** 📋 ready

## Problem
Each full board the panel sends a page is 1.19 MB (measured 2026-10-14), sent each time a page opens or reconnects (0187). 154 finished tickets make up 1.08 MB of it, including 515 KB of each finished build's log ending, which the panel never shows for a finished ticket. Through a tunnel to a phone that's a slow first load and reconnect, and it grows with every ticket shipped.

## Outcome
The full board stays small however many tickets have shipped, and the panel shows the same as before.

## Acceptance criteria
1. In the full board the panel sends a page, each finished ticket other than the latest five takes up no more than 500 bytes, however long its text and build log are.
2. For the same tickets, the full board is less than a third of the size it was before this change.
3. The panel shows the same as before for the same tickets: the queue, Plan, the Shipped list and its figures, and each ticket's full text when it's opened, finished ones included.
4. `speck status --json` prints the same as before.
5. No test that passed before this change fails.

## Out of scope
- How long the board takes to read (0176).
- Sending only what changed (0188).

## Notes
- Measured on 2026-10-14: `build_exit` 515 KB, acceptance criteria 156 KB, notes 147 KB, problem 49 KB across all tickets. Gzipped, the answer is 312 KB. The panel itself sends it uncompressed.
- The panel uses `build_exit.message` only for tickets in the queue. The Shipped list shows the latest five finished tickets in full, and figures over all of them.
- The field names of `speck status --json` are a contract (0030).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
