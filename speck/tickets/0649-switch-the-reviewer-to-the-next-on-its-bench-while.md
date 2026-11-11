---
id: "0649"
title: "Switch the reviewer to the next on its bench while it's limited"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0645"]                # ticket ids that must be done first
created: 2026-11-11

---
# 0649 · Switch the reviewer to the next on its bench while it's limited

**Status:** 📋 ready

## Problem
When the reviewer's agent is limited, every build waits at its next review round until the reset (0623), even with another reviewer on its bench ready.

## Outcome
While the reviewer's agent is limited, review rounds run on the first reviewer on its bench that's ready, not limited and not the builder's own family.

## Acceptance criteria
1. When `speck review` finds the reviewer's agent held by a recorded usage limit, it runs the round on the first agent on `reviewer_bench` that's installed, signed in, not limited and allowed to review this build under the same-model rule, in a fresh session with the full history, and records which reviewer ran it.
2. The review pack and the round's summary line say the round ran on a stand-in and why.
3. With no such agent free, it ends as 0623 does, and the build waits for the reset.
4. Once the limit has reset, rounds go back to the reviewer's own agent, in a fresh session with the full history.
5. No test that passed before this change fails.

## Out of scope
- Changing the reviewer setting itself.

## Notes
- Reviewer limits: `scripts/reviewer-limit.mjs` (0623); same-model rule: `scripts/same-model.mjs`; a round whose reviewer differs from the last already starts a fresh session with the full history.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
