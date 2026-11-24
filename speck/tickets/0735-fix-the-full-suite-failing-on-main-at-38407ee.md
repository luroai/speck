---
id: "0735"
title: "Fix the full suite failing on main at 38407ee"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24

---
# 0735 · Fix the full suite failing on main at 38407ee

**Status:** 📋 ready

## Problem
The full suite fails on main at commit 38407ee (38407eea5126d9502f5230cf95f96f320efed8c7). Failing tests:
- 0469 AC1, AC2: at 390 px, the header, tabs and every card and row, closed and open, are laid out the same with a mouse as on a touch screen, in the same font sizes
- 0469 AC1, AC2: at 600 px, the header, tabs and every card and row, closed and open, are laid out the same with a mouse as on a touch screen, in the same font sizes

## Outcome
The full suite passes on main again.

## Acceptance criteria
1. Each of these tests passes on main again: 0469 AC1, AC2: at 390 px, the header, tabs and every card and row, closed and open, are laid out the same with a mouse as on a touch screen, in the same font sizes, 0469 AC1, AC2: at 600 px, the header, tabs and every card and row, closed and open, are laid out the same with a mouse as on a touch screen, in the same font sizes.
2. No test that passed before this change fails.

## Out of scope
- Changes the failing tests don't need.

## Notes
<!-- Constraints, links and decisions. Optional. -->

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
