---
id: "0693"
title: "Try the next reviewer on the bench when a stand-in is limited too"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-11-try-the-next-on-the-bench-when-a-stand-in-is-limited-too.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0692"]                # ticket ids that must be done first
created: 2026-11-15
built_on: "0692"
started: "2026-11-15T21:37:52.776Z"

---
# 0693 · Try the next reviewer on the bench when a stand-in is limited too

**Status:** 🔨 building

## Problem
A review round gets one stand-in from `reviewer_bench` when the reviewer is limited. If that stand-in is limited too, the round ends and the build waits for the stand-in's reset, even with a third agent free on the bench, and the refusal overwrites the record of the reviewer's limit with the stand-in's.

## Outcome
A round goes to the next agent on the bench that can take it, rather than waiting while one is free.

## Acceptance criteria
1. When the stand-in refuses a round for its own usage limit, the round runs on the next agent on `reviewer_bench` that is ready, free of a usage limit and of another family from the ticket's builder, in bench order.
2. With no agent on the bench able to take it, the build waits and is carried on after the earliest reset among the reviewer and the agents on its bench, as it would be by the one that resets first.
3. A stand-in's limit is recorded as that agent's, and doesn't replace the record of the reviewer's limit.
4. No test that passed before this change fails.

## Out of scope
- The builder's bench.

## Notes
- From 0649. Waits for 0692, which changes how the reviewer's limit is recorded.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
