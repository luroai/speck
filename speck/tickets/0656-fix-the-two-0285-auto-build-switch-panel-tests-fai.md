---
id: "0656"
title: "Fix the two 0285 Auto-build switch panel tests failing on main"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-11

---
# 0656 · Fix the two 0285 Auto-build switch panel tests failing on main

**Status:** 📝 draft

## Problem
Two Auto-build switch tests in Settings fail on main itself since 0646 added a usage request the fake page answers out of turn, and 0652's build spent part of its 22 minutes proving they weren't its own; the rest went on updating about ten older Settings layout tests, taking pictures and running wide test sweeps on a machine with a load average near 70.

## Outcome
<!-- What is true when this ships. One outcome. -->

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. `speck check <id>` runs the ready check on the ticket. -->
1.

## Out of scope
-

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
