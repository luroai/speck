---
id: "0069"
title: "Drop the status word under an in-flight queue ticket's bar"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0069 · Drop the status word under an in-flight queue ticket's bar

**Status:** 📝 draft

## Problem
Each in-flight ticket in the queue repeats its status in a line under its bar (for example **building**), though the bar's current step already shows it. The extra line makes every row taller for nothing.

## Outcome
An in-flight queue ticket no longer has a line under its bar repeating its status.

## Acceptance criteria
1. A `building`, `reviewing` or `approved` ticket in the queue has no line under its bar giving its status, whether its row is open or closed. Everything else in the row (its bar, counter, build exit message, worktree path and log) shows as today.
2. A `blocked` ticket in the queue shows `Answer the question, then run /speck-build <id>` (with its id) under its blocked question and resume command, in place of today's `blocked · answer the question, then run /speck-build <id>` line, and nothing else under its bar changes.
3. `ready` tickets' "Queued" line is unchanged.

## Out of scope
- Pause, play and stop controls (0071, 0073).

## Notes
- The line is the `act` line built at the end of the in-flight branch of `queueItem` in `templates/panel.html`.
- product.md's Queue description needs updating.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
