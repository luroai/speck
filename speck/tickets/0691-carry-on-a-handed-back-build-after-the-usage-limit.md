---
id: "0691"
title: "Carry on a handed-back build after the usage limit"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-10-carry-on-a-handed-back-build-after-the-usage-limit.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T21:05:12.659Z"

---
# 0691 · Carry on a handed-back build after the usage limit

**Status:** 🔨 building

## Problem
When a build that was handed back on an approved ticket, for example to resolve a merge, stops on an agent's usage limit before it sets the ticket reviewing, speck run doesn't carry it on after the reset, as it does for a ticket that's ready, building or reviewing. The ticket then moves only when its next ship is refused, which spends another of its hand-backs, and while you're away it can sit for days.

## Outcome
A handed-back build that stopped on a usage limit is carried on after the reset, like any other build.

## Acceptance criteria
1. An approved ticket whose handed-back build stopped on a usage limit before setting it reviewing is resumed by speck run once the limit has reset, in the same session, as a ready, building or reviewing ticket's build is.
2. Resuming it doesn't count as another hand-back, and the ticket keeps the hand-backs it had left.
3. While the build waits for the reset, the ship queue doesn't ship or hand back the ticket again.
4. No test that passed before this change fails.

## Out of scope
- Moving the handed-back build to another agent on the bench while the limit holds.

## Notes
- Failing before this build: none
- From 0622, which leaves approved tickets alone so a ship can't race a resumed build. Whether the hand-back stays in the run record until the session has got past the limit is the builder's choice.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
