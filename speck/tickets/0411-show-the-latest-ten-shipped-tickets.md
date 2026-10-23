---
id: "0411"
title: "Show the latest ten shipped tickets"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0410"]         # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T13:59:01.373Z"

---
# 0411 · Show the latest ten shipped tickets

**Status:** 🔨 building

## Problem
Shipped lists only the latest five tickets, which is less than a day's work on a busy day, so you can't look back over what shipped without opening the tickets' files.

## Outcome
Shipped lists the latest ten finished tickets.

## Acceptance criteria
1. Shipped lists the latest ten finished tickets, newest first, plus any whose ship didn't push, as it does for five today. With fewer than ten finished tickets, it lists them all.
2. Each of the ten opens its Details, full ticket and Review pack with their whole text, as the latest five do today.
3. On the board the panel's server sends, every finished ticket outside the ten Shipped lists is still cut down to 500 bytes or less, as 0178 set for those outside the five.

## Out of scope
- The tabs (0410).
- Paging or searching older shipped tickets.

## Notes
- Five is set in two places that must agree: `SHIPPED_SHOWN` in `scripts/board-feed.mjs` and the `i < 5` filter on `shipped:` in `templates/panel.html`.
- Waits for 0410: both change `templates/panel.html`.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
