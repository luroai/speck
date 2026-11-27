---
id: "0776"
title: "Steady three browser tests on a busy machine"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-25-steady-the-0160-ac5-jump-to-ticket-test.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-26
started: "2026-11-27T00:11:41.110Z"

---
# 0776 · Steady three browser tests on a busy machine

**Status:** 🔨 building

## Problem
Three real-browser tests fail now and then on a busy machine: "0160 AC5: in the home-screen app, jumping to a ticket shows it below the header", "0723 AC2: the 0182 AC3 check still fails when Chromium is left running" and "0761 AC2: with something in Plan's list wider than it, a sideways swipe on the list changes lane".

## Outcome
The three tests pass on a busy machine and still catch a real fault.

## Acceptance criteria
1. 0160 AC5 passes 10 runs out of 10 while the machine is under heavy load (as 0689 and 0723 measured it), and still fails if jumping to a ticket leaves it under the header.
2. 0723 AC2 passes 10 runs out of 10 while the machine is under heavy load (as 0689 and 0723 measured it), and still fails when the 0182 AC3 check would let Chromium stay running.
3. 0761 AC2 passes 10 runs out of 10 while the machine is under heavy load (as 0689 and 0723 measured it), and still fails if a swipe on a list with something wider than it doesn't change lane.
4. No test that passed before this change fails.

## Out of scope
- Other browser tests.

## Notes
- From the builds of 0751 and 0769.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
