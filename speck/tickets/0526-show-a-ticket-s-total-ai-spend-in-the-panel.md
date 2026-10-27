---
id: "0526"
title: "Show a ticket's total AI spend in the panel"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0525"]                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-27T12:35:45.082Z"

---
# 0526 · Show a ticket's total AI spend in the panel

**Status:** 🔨 building

## Problem
The panel shows a shipped ticket's builder cost and its reviewer and builder tokens, but not what the ticket cost in all. Reviewer and watch agent spend (0529, 0525) never appear, so the figure you look at understates every ticket.

## Outcome
A shipped ticket in the panel shows its total AI cost: builder, reviewer and watch agent together.

## Acceptance criteria
1. `speck status --json` gives each ticket's `total_cost_usd`, the sum of its known `builder_cost_usd`, `reviewer_cost_usd` and `watch_cost_usd`, or null when none is known, and `total_tokens`, the sum of its builder, reviewer and watch agent tokens.
2. A shipped ticket's facts show `Reviewer cost` and `Total cost` beside `Builder cost`. One with no known cost shows "—".
3. When a ticket's total leaves out a part whose cost is unknown but has tokens, its `Total cost` shows the known sum preceded by "at least", and its tooltip names each part left out (for example "Reviewer cost unknown").
4. A shipped ticket's line shows its total cost where it shows its builder cost today.
5. The stats above Shipped add the total cost of the shipped tickets shown that have a known total, saying how many tickets it covers, beside the median builder cost.

## Out of scope
- A per-model or per-day breakdown: `speck spend` (0527).
- A separate `Watch cost` cell: watch runs are rare, so they count only in the total.

## Notes
- Facts are built in `shippedFacts` in `templates/panel.js`, the line near the `builderCost` use around line 1284, the stats in the Shipped header around line 1328, and the figures in `templates/panel-model.js` and `scripts/board-feed.mjs` (the Shipped cut-down keeps only what those use).
- Keep the panel's phone-width layout: the facts grid gains two cells.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
