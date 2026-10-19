---
id: "0325"
title: "Leave dropped ideas out of speck status's idea count"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-speck-status-counts-dropped-ideas-as-waiting.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-19
started: "2026-10-19T07:08:30.962Z"

---
# 0325 · Leave dropped ideas out of speck status's idea count

**Status:** 🔨 building

## Problem
`speck status` counts every idea that isn't ticketed as waiting, including ones triage has dropped, so its `IDEAS (…)` line overstates what's left to shape. Triage on 2026-10-19 dropped 18 notes in one go.

## Outcome
`speck status`'s idea count leaves dropped notes out of what's waiting, and shows inbox notes apart.

## Acceptance criteria
1. The `IDEAS` line in `speck status` counts ideas waiting (status `idea`), inbox notes (`inbox`) and ticketed ones separately, and leaves dropped ones out of all of them.
2. `speck status --json` gives the same counts.
3. Notes with no `Status:` line count as waiting, as today.
4. The counts match what the panel's Ideas and Inbox tabs show.

## Out of scope
- The panel's tabs.

## Notes
- From `speck/ideas/2026-10-09-speck-status-counts-dropped-ideas-as-waiting.md`. The line is printed in `scripts/speck.mjs` (search for `IDEAS (`).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
