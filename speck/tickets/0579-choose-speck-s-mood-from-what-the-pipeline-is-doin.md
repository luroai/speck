---
id: "0579"
title: "Choose speck's mood from what the pipeline is doing"                # one outcome, no "and"
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
after: ["0578"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T18:54:00.698Z"

---
# 0579 · Choose speck's mood from what the pipeline is doing

**Status:** 🔨 building

## Problem
speck's face should say what the pipeline is doing at a glance, as the LCD's speck did, but with the new character's six moods.

## Outcome
speck's mood follows the pipeline wherever its face appears for the whole pipeline.

## Acceptance criteria
1. A function gives speck's mood from the board: asleep while speck run is off, asking while anything needs you, focused while a build is building, reviewing or shipping, and watching while it's idle or waiting.
2. For 10 seconds after speck takes a recommendation or a ticket ships, the mood is pleased, then returns to the one above.
3. Wherever speck's face is shown beside one ticket whose criteria changed (0565), that face is sheepish.
4. When the mood changes, the visor eases from one shape to the next rather than jumping.
5. No test that passed before this change fails.

## Out of scope
- Where the faces are shown, which the tickets for the bar, Decided for you and the log decide.

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today the status word comes from `foremanView` in `scripts/foreman.mjs` and `foremanOf` in `templates/panel.js`.
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
