---
id: "0443"
title: "Fit a collapsed Build ticket's status on a phone"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-10-23-fit-a-closed-card-s-stage-and-time-on-a-phone.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T07:32:32.904Z"

---
# 0443 · Fit a collapsed Build ticket's status on a phone

**Status:** 🔨 building

## Problem
Since 0434, a collapsed Build ticket's status line is one line, cut off with an ellipsis. On a phone, a long status such as `Approved · waiting for you to ship it` or `Blocked · the Foreman will take its recommendation` pushes the stage and time out of sight.

## Outcome
A collapsed Build ticket's status uses short words, so its stage and time always show.

## Acceptance criteria
1. On a collapsed Build ticket, each long status shows in short words: `Ready to ship` (approved, waiting for you to ship it), `Shipping next` (approved, waiting to ship), `Has a question` (blocked with a question for you), `Foreman will answer` (blocked, the Foreman will take its recommendation), `Build stopped`, `Turn on Auto-build` (approved, waiting for Auto-build) and `Read the document` (a finished document task). `Paused`, `Shipping` and `Queued · waiting on <ids>` stay as they are.
2. The full sentence is the short words' tooltip and accessible name, and an open ticket shows the full sentence.
3. At 375 px wide, every collapsed Build ticket's status line shows its words, stage and time without cutting any of them off.

## Out of scope
- The grid of lights and the time (0434).

## Notes
- For release 0.15.0 (0452). The user asked on 2026-10-24 for everything relevant to the release to be ticketed.
- From the builder's note on 0434. The sentences come from `doing()` in `templates/panel-model.js`.
- Waits for nothing: no open ticket changes `doing()`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
