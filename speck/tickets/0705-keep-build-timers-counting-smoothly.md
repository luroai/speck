---
id: "0705"
title: "Keep build timers counting smoothly"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "quick"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-keep-build-timers-counting-smoothly.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T12:18:40.929Z"

---
# 0705 · Keep build timers counting smoothly

**Status:** 🔨 building

## Problem
The panel's build timers sometimes skip a second (12, 14) or show one twice (13, 13), right where you look to see a build is alive. The ticks run on a plain one-second interval that lands a few milliseconds early or late.

## Outcome
Every build timer counts up one second at a time, every time.

## Acceptance criteria
1. Over 120 seconds of a running build, its timer shows every whole second once and in order, never skipping one or showing one twice, even when the browser's timer callbacks arrive up to 50 ms early or late.
2. Two builds started at different fractions of a second both count this way at the same time.
3. For a given start time, each timer shows the same elapsed time as today (whole seconds, rounded down).
4. No test that passed before this change fails.

## Out of scope
- Real-time updates of the board itself.

## Notes
- `startCounters` and `tickCounters` in `templates/panel.js` use `setInterval(tickCounters, COUNTER_MS)` with `COUNTER_MS = 1000`. Each counter has its own start, so one timer lined up with one build's seconds still drifts against the others.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
