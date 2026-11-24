---
id: "0738"
title: "Fix the full suite failing on main at d076997"                # one outcome, no "and"
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
created: 2026-11-24
started: "2026-11-24T17:20:01.222Z"

---
# 0738 · Fix the full suite failing on main at d076997

**Status:** 🔨 building

## Problem
The full suite fails on main at commit d076997 (d0769975d1b676fbe16dd34f129c4d283d9cf059). Failing tests:
- 0058 AC3 and AC4: in a real browser the counter ticks between polls, and a selection in or across it stays
- 0476 AC2: a sideways scroll on a trackpad and the arrow keys change lane in the same time; with reduced motion, without sliding
- 0476 AC4: at 390 px the column is at most 720 px wide, centred, with one lane in view, and a swipe slides between them

## Outcome
The full suite passes on main again.

## Acceptance criteria
1. Each of these tests passes on main again: 0058 AC3 and AC4: in a real browser the counter ticks between polls, and a selection in or across it stays, 0476 AC2: a sideways scroll on a trackpad and the arrow keys change lane in the same time; with reduced motion, without sliding, 0476 AC4: at 390 px the column is at most 720 px wide, centred, with one lane in view, and a swipe slides between them.
2. No test that passed before this change fails.

## Out of scope
- Changes the failing tests don't need.

## Notes
<!-- Constraints, links and decisions. Optional. -->
Failing before this build: none (the recorded quick-suite result at 5378f9e passed; the full suite's failures are the ones this ticket names)
Causes, from the failed full run's output at d076997: 0058 AC3/AC4 selected `9 ` where it expected two digits, as two ticks of the counter reach 10 min only when the real clock had already passed the 8th minute; 0476 AC2 and AC4 timed out waiting for a lane to open after a swipe. Reproduced the 0476 ones with Chromium's CPU throttling (30-60x): Chromium drops the last moves and the touchend of a gesture altogether (none arrive 20 s later), so the page never sees the finger lift. That's the browser giving up on a starved page, not the panel, so the touch helpers now check the page got each gesture's touchend and do the gesture again when it didn't (up to 3 tries, then a plain failure). Pacing each event to the page didn't help.
Self-check: bounded the 0058 loop to 3 more ticks, so a counter that never reaches two digits fails at the assertion rather than looping; the touchend counter is added for every page loaded in the tab too, so 0476's refresh test keeps it.
Pictures: none, because the ticket changes only tests.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
