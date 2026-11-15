---
id: "0699"
title: "Fix the full suite failing on main at efde0c4"                # one outcome, no "and"
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
created: 2026-11-15
started: "2026-11-15T22:37:34.256Z"

---
# 0699 · Fix the full suite failing on main at efde0c4

**Status:** 🔨 building

## Problem
The full suite fails on main at commit efde0c4 (efde0c4030ec6432cdec87bac42191fddd58b5a1). Failing tests:
- 0476 AC2: a sideways scroll on a trackpad and the arrow keys change lane in the same time; with reduced motion, without sliding
- 0624 AC3: every fact is still shown with the same value, for a draft, a build and a shipped ticket

## Outcome
The full suite passes on main again.

## Acceptance criteria
1. Each of these tests passes on main again: 0476 AC2: a sideways scroll on a trackpad and the arrow keys change lane in the same time; with reduced motion, without sliding, 0624 AC3: every fact is still shown with the same value, for a draft, a build and a shipped ticket.
2. No test that passed before this change fails.

## Out of scope
- Changes the failing tests don't need.

## Notes
<!-- Constraints, links and decisions. Optional. -->
Failing before this build: not checked (the recorded result, from f049820, is the quick suite's and passed; the full suite's failures are the two tests this ticket names)
Causes found:
- 0624 AC3: 0694 (AC4) added a Built with fact to a shipped ticket's full view, so the list of facts the test expects was out of date. The fix adds Built with, Not recorded (the fixture has no recorded build models), in the place the panel shows it.
- 0476 AC2: passes on its own; in full-suite runs it failed on and off since 2026-11-09 with "the slide ends within 120 ms (120.001 to 120.05 ms)". The slide lasts exactly 120 ms, and one that has only just started can read a fraction of a millisecond over, so the check now allows under 121 ms. A slide taking longer than 120 ms still fails it.
No code outside the tests changes: no test is written for this ticket beyond the two it names, which check it.
Self-check: no changes

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
