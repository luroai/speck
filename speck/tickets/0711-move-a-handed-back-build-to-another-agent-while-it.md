---
id: "0711"
title: "Move a handed-back build to another agent while its limit holds"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "deep"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-15-move-a-handed-back-build-to-another-agent-while-its-limit-holds.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T12:57:07.169Z"

---
# 0711 · Move a handed-back build to another agent while its limit holds

**Status:** 🔨 building

## Problem
When an approved ticket's handed-back build stops on its agent's usage limit, speck run only waits for the reset, which can be five hours or more. The ticket can't ship meanwhile, even when another agent on the bench is free.

## Outcome
A handed-back build that stops on a limit moves to a free agent on `builder_bench`, as a building ticket's build does.

## Acceptance criteria
1. When an approved ticket's handed-back build stops on its agent's usage limit with the reset more than an hour away, and an agent on `builder_bench` is free, speck run carries the build on on that agent, and the ticket's Notes gain the take-over line, as for a building ticket.
2. The new agent's message says what the hand-back was for, with the reason and steps speck gave the first build, and for a merge clash tells it to check for an unfinished merge first.
3. While the moved build runs, the ship queue still holds the ticket, and the hand-back count isn't reset or spent again: a third clash still blocks the ticket, as today.
4. With no free agent on the bench, or the reset within an hour, the build waits for the reset, as today.
5. No test that passed before this change fails.

## Out of scope
- Moving review rounds (0692, 0693).

## Notes
- In `scripts/usage-limit.mjs`, `moveOn` filters on `IN_HAND = ['ready','building','reviewing']`, while the resume path uses `inHand()`, which also accepts approved tickets with `handed_back`. `resumeHandBack` (`scripts/hand-back.mjs`) drops `hand_back` from the record, so its kind and reason need keeping for the message. Take-over is `scripts/build-take-over.mjs` (0648).
- Failing before this build: none
- Self-check: added tests for a ticket the build had edited but not committed during the unfinished merge, and for git's index being locked once the branch has moved (the branch is put back). git's errors under a merge now give their first line, which names the problem, not their last.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
