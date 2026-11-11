---
id: "0646"
title: "Show your subscriptions' usage in Settings"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0643"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T15:17:00.249Z"

---
# 0646 · Show your subscriptions' usage in Settings

**Status:** 🔨 building

## Problem
Once speck keeps each agent's usage (0642, 0643), you still can't see it unless you run `speck agents`, so you find out an agent is nearly used up when work stops.

## Outcome
The panel's Settings view shows each of your subscriptions with how much it has left and when it resets.

## Acceptance criteria
1. Settings has a Your subscriptions group listing each of your agents with a reading: its plan when known, then a bar and a figure for each window speck read (for example 5 hours 40% and Week 34% for Claude, Month 1% for Cursor), with when each resets.
2. A window at 90% or more shows its bar in the needs-you colour, and one that's refused says Limited with when it resets.
3. A model provider on an API key shows this week's spend from what speck recorded, and says it has no limit to show.
4. Each agent says how long ago it was read, and one with no reading says so in one line.
5. It reads afresh each time Settings opens, works in the light and the dark look, and fits a phone-width panel.

## Out of scope
- The team cards: 0652.

## Notes
- Mockup: the Your subscriptions shelf on the team page, https://claude.ai/artifact/2F85xNeCwn9KGxRn3ZbYZQ.
- Readings from 0642 and 0643. Keep the panel thin: one column at phone width.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
