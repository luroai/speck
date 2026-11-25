---
id: "0754"
title: "Fix the full suite failing on main at bd26262"                # one outcome, no "and"
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
created: 2026-11-25
started: "2026-11-25T01:07:30.804Z"

---
# 0754 · Fix the full suite failing on main at bd26262

**Status:** 🔨 building

## Problem
The full suite fails on main at commit bd26262 (bd26262f02cf4a7a8d1b96dd8e47822d9d5edd83). Failing tests:
- 0476 AC2: a swipe moves the card with the finger and comes to rest on one whole card within 120 ms (0517); a flick changes lane however short, a slow drag past a quarter

## Outcome
The full suite passes on main again.

## Acceptance criteria
1. Each of these tests passes on main again: 0476 AC2: a swipe moves the card with the finger and comes to rest on one whole card within 120 ms (0517); a flick changes lane however short, a slow drag past a quarter.
2. No test that passed before this change fails.

## Out of scope
- Changes the failing tests don't need.

## Notes
<!-- Constraints, links and decisions. Optional. -->
Failing before this build: 0476 AC2: a swipe moves the card with the finger and comes to rest on one whole card within 120 ms (0517); a flick changes lane however short, a slow drag past a quarter (the recorded full-suite result at bd26262 keeps only its tail, which names no other failure)

Cause, from the failed full run's output at bd26262: in both the first run and its retry, 0476 AC2 failed at its slow drag past a quarter (and AC3, in the first run, at its quick scroll), because the browser dropped the gesture's touchend on all 3 of 0738's tries. Each time it was the first lifted gesture after a drag held down and lifted by hand, whose end nothing checked. Couldn't reproduce it here: not with Chromium's CPU throttling at 20-80x, 32-40 busy processes, or every browser test file at once. CDP refuses a touchCancel when it holds no touch and accepted every touchEnd sent, so the drop is past CDP and a cancel can't reset it. Fix, in the test helpers only: each try waits for the page to draw two frames (caught up) before it starts, each retry pauses 1 s longer first, and every drag held down and lifted by hand in 0476 has its end checked and retried, as 0738 did for two of them.
Self-check: found a fifth hand-lifted drag (0476 AC3, during a drag) whose end wasn't checked, and checked it too; a page that draws no frame within 30 s fails plainly with Chrome's own time-out message.
Pictures: none, because the ticket changes only tests.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
