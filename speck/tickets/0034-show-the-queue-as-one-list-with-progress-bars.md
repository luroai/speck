---
id: "0034"
title: "Show the queue as one list with progress bars"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0033"]                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T13:12:49.215Z"

---
# 0034 · Show the queue as one list with progress bars

**Status:** 🔨 building

## Problem
The queue splits tickets into Needs you, Running and Up next, so a ticket jumps between groups as it moves, and nothing shows how far a build has got. A progress bar per ticket makes the pipeline readable at a glance.

## Outcome
The queue is one list in which every in-flight ticket has a progress bar, tickets that need you are red, and ready tickets show as queued.

## Acceptance criteria
1. The queue is a single list with no Needs you, Running or Up next headings: in-flight tickets (`building`, `reviewing`, `blocked`, `approved`) first, then `ready` tickets, each group in the JSON's order.
2. Every ticket in the queue has a five-step bar: Build, Self-check, Review, Approve, Ship. Build is done once `self_check` is set or the ticket has a review round. Self-check is done once the ticket has a review round, or `self_check` is set and the status is `reviewing`. Review is done when the status is `approved`. Approve is done when the status is `approved`, and Ship is then the current step. Otherwise the current step is the first one not done. While a ticket has review rounds, the Review step reads "Review <n>", where n is its latest round number.
3. A `blocked` ticket is shown in red (its row's left edge and its current step) with its blocked question under it. No other ticket is red.
4. A `ready` ticket shows "Queued" and its bar with no step done or current, plus "waiting on <ids>" when `waiting_on` isn't empty.
5. Each in-flight ticket shows its worktree path when it has one, and the whole minutes since `started` when that's set.

## Out of scope
- Shaping (0033) and Shipped (0035).
- Any write action, including reordering or answering a blocked question.
- Live agent activity.

## Notes
- Design reference: the progress bars in `docs/panel-mockup.html`.
- Uses `self_check` from 0033, so it builds after 0033.
- Approved tickets aren't red: with `auto_ship` on they ship within seconds. Their bar shows Ship as the current step.
- Self-check: a high-risk tag in the queue now uses the warning colour rather than red, so only a blocked ticket is red there (Shaping is unchanged). Also checked an empty `self_check`, a missing or `null` round number, an invalid or future `started` and a blocked ticket with no question. The 0031 tests that expected the Needs you, Running and Up next groups now expect the single list.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
