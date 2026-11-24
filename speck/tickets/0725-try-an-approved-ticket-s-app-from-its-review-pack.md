---
id: "0725"
title: "Try an approved ticket's app from its review pack"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-10-more-human-gate-actions-in-the-panel.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24

---
# 0725 · Try an approved ticket's app from its review pack

**Status:** 📋 ready

## Problem
`speck app <id>` starts a ticket's copy of the app (0634), but only from a terminal. Using the change before shipping is stronger evidence than the review pack, and the panel is where you decide to ship.

## Outcome
An approved code ticket's review pack has a Try it button that starts its app and gives you the address.

## Acceptance criteria
1. An approved code ticket's review pack in the panel has a Try it button that starts the app from that ticket's copy of the code, as `speck app <id>` does, then shows the app's address as a link.
2. While that app is running, the button offers Stop, which stops that app only, as `speck app <id> --stop` does. Opening the review pack again while it runs shows the address and Stop.
3. When the app can't start, the panel says why, in `speck app`'s words.
4. Task tickets, and tickets that aren't approved, show no Try it button.
5. No test that passed before this change fails.

## Out of scope
- Reaching the app from a phone through the private tunnel: the address is on this machine.
- Undo a ship and notifications, which stay in the idea.

## Notes
- `speck app` is `scripts/app.mjs` (0634); it reads `commands.start` or works one out (0638). Panel actions run through `scripts/panel-run.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
