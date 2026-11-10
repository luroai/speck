---
id: "0608"
title: Show speck asleep in every empty lane                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-09-show-speck-asleep-in-an-empty-build-and-shipped.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0606"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T10:47:25.480Z"

---
# 0608 · Show speck asleep in every empty lane

**Status:** 🔨 building

## Problem
Since 0586, an empty Capture or Plan shows speck asleep with a line saying what lands there, but an empty Build keeps its older "Nothing building" message and an empty Shipped a plain line, so the four lanes don't look alike when empty.

## Outcome
Every empty lane shows speck asleep with one line saying what lands there.

## Acceptance criteria
1. An empty Build shows speck asleep and "Nothing building" with a line saying ready tickets land there, keeping its line about what shipped last and its button to Plan under them.
2. An empty Shipped shows speck asleep and "Nothing shipped yet" with a line saying approved tickets land there once they ship.
3. Speck, the heading and the line sit and look exactly as they do in an empty Capture or Plan, in both looks and at 320 px wide.
4. Tests that checked the old behaviour are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Capture's and Plan's empty states, which 0586 set.

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- Decided: Build keeps its last-shipped line and its Go to Plan button, under speck.
- Today: the empty states are built in `render()` in `templates/panel.js`. Waits for 0606, which changes the Shipped part of the same function.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes (checked a lane emptied, filled and emptied again keeps one set of lines under speck, and the page without the face script still shows the line)

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
