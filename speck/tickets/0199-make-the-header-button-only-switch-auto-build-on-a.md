---
id: "0199"
title: Make the header button just the Auto-build switch                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T13:42:58.248Z"

---
# 0199 · Make the header button just the Auto-build switch

**Status:** 🔨 building

## Problem
Since 0163 the header's Auto-build button names one ticket in flight and where it has got to, or a ticket that needs you. With two builds at once and a ship queue (0193, 0194), one ticket's status there is partial and repeats what the Build list already shows, and its tooltip still says builds go one at a time.

## Outcome
The header button is only the Auto-build switch: it says whether Auto-build is on or off, and switches it.

## Acceptance criteria
1. While `speck run` is on, the button says "Auto-build on", and while it's off, "Auto-build off", whatever tickets are building, shipping, blocked or waiting. While it's switching it says "Starting…" or "Pausing…", as today.
2. The button never names a ticket, a build step or that something needs you, and its colour shows only whether Auto-build is on or off.
3. Its builder figure hops while any build or ship is at work and stands still otherwise.
4. Its tooltip says only what a click does: "Pause Auto-build: ready tickets wait" while on, and "Start Auto-build: build ready tickets" while off. Clicking it switches Auto-build as today, and it stays in place and keeps focus.
5. No test that passed before this change fails, except checks of 0163's ticket and step labels on the button, which change to check AC1 to AC4.

## Out of scope
- The Build list and its cards.
- How `speck run` is started or stopped.

## Notes
- Asked for 2026-10-15: "the status button in the header is redundant now because we're allowing multiple parallel builds, and can ship things in a queue. It just needs to be an auto-build on/off button again."
- `runLabel()` and the button's render in `templates/panel.html` (0163, 0144, 0150).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
