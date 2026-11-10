---
id: "0626"
title: "Use made-up project names in the project menu's tests"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-10

---
# 0626 · Use made-up project names in the project menu's tests

**Status:** 📝 draft

## Problem
The project menu's tests (0516) use real project names from the user's machine as their sample projects, so a private name sits in the public repo's test code.

## Outcome
The project menu's tests use made-up project names.

## Acceptance criteria
1. `test/panel-0516.test.mjs` uses made-up names, such as `alpha` and `beta`, for every sample project other than `speck`, and contains no name from the user's private words.
2. Each test still checks what it checked before, with the same results.
3. No test that passed before this change fails.

## Out of scope
- The project menu's behaviour.

## Notes
- Asked for 2026-11-10: remove a private name from everything and "make sure it doesn't happen again … I don't even want a mention of the user's other projects." The name itself is in the user's private words, so it isn't written here.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
