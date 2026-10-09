---
id: "0056"
title: "Hide ticketed ideas from the panel's Ideas list"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T19:06:38.670Z"

---
# 0056 · Hide ticketed ideas from the panel's Ideas list

**Status:** 🔨 building

## Problem
The panel's Ideas list shows ideas that have already become tickets, after the ones still waiting. Once ticketed, the work lives in the tickets, so these rows are clutter that hides the ideas still to shape.

## Outcome
The panel's Ideas list shows only ideas that haven't become tickets yet.

## Acceptance criteria
1. The Ideas list leaves out every idea whose status starts with `ticketed`, as well as `inbox` and `dropped` ones as today, and shows the rest in the JSON's order.
2. The Ideas toggle's count is the number of ideas in that list, for example `Ideas · 3` with three unticketed ideas, whatever number are ticketed.
3. With no ideas left to show, the list says "No ideas waiting."
4. An idea open in the list that becomes ticketed leaves the list on the next refresh, and the other open ideas stay open.

## Out of scope
- Moving ticketed notes out of `speck/ideas/` (0057).
- `speck status` and `speck status --json`: both still list ticketed ideas.
- The Inbox list.

## Notes
- The filter is in `templates/panel.html` (the `ideas:` line that orders unticketed ideas first). Nothing in the JSON changes.
- product.md's Ideas description ("those whose status doesn't start with `ticketed` first") needs updating.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
