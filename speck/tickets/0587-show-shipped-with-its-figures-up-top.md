---
id: "0587"
title: "Show Shipped with its figures up top"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0586"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T21:53:18.728Z"
waited_seconds: 4005

---
# 0587 · Show Shipped with its figures up top

**Status:** 🔨 building

## Problem
The Shipped lane opens with a line of figures and long cards. The redesign puts its three key figures up top as tiles and lists shipped tickets as compact rows.

## Outcome
Shipped opens with three figure tiles and lists its tickets as compact rows.

## Acceptance criteria
1. Shipped opens with three tiles: the median build time, the median number of review rounds and the share approved in the first round, worked out as today's figures are.
2. Each shipped ticket is one row: its id, title and a line with when it shipped, its review rounds and how long it took, such as "28 Oct, 13:58 · 1 round · 4 min"; pressing it opens its full view.
3. The other figures, costs included, are still there behind the more-figures toggle.
4. Each row is at least 44 px tall, and long titles wrap at 320 px wide.
5. Tests that checked the old look of what this changes are updated to the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- How the figures are worked out.

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today: the Shipped part of `render()` in `templates/panel.js` (`#shipped-stats`, `#more-stats`, `#shipped-more`), figures from `panelModel()` in `templates/panel-model.js`.
- Relies on nothing outside this repo.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
