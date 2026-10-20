---
id: "0349"
title: "Don't restart a ticket's build while a Foreman question on it is waiting"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-20

---
# 0349 · Don't restart a ticket's build while a Foreman question on it is waiting

**Status:** 📝 draft

## Problem
speck run has now restarted 0344's build four times, because each note the Foreman adds while asking counts as setting the ticket ready again, even though the user still hasn't answered the macOS question; that needs its own fix, and asking the same question a fourth time wouldn't stop it.

## Outcome
<!-- What is true when this ships. One outcome. -->

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
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
