---
id: "0739"
title: "Fix the full suite failing on main at ca0dfcb"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
started: "2026-11-24T17:46:15.632Z"

---
# 0739 · Fix the full suite failing on main at ca0dfcb

**Status:** 🔨 building

## Problem
The full suite fails on main at commit ca0dfcb (ca0dfcb1c1f0915b47bdc98deacf395f57422cfb). Failing tests:
- 0058 AC3 and AC4: in a real browser the counter ticks between polls, and a selection in or across it stays
- 0164 AC3: in a browser whose pointer can't hover, a tapped card keeps its background, and an opened card keeps its opened colour

## Outcome
The full suite passes on main again.

## Acceptance criteria
1. Each of these tests passes on main again: 0058 AC3 and AC4: in a real browser the counter ticks between polls, and a selection in or across it stays, 0164 AC3: in a browser whose pointer can't hover, a tapped card keeps its background, and an opened card keeps its opened colour.
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
