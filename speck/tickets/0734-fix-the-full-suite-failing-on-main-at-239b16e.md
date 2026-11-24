---
id: "0734"
title: "Fix the full suite failing on main at 239b16e"                # one outcome, no "and"
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
started: "2026-11-24T13:27:45.922Z"

---
# 0734 · Fix the full suite failing on main at 239b16e

**Status:** 🔨 building

## Problem
The full suite fails on main at commit 239b16e (239b16e6fde6e470eed2ae32434e151fef98fed1). Failing tests:
- 0657 AC3: 13 px text, or a fill with no text colour of its own, fails speck test --files with another file, and the quick run
- 0061 self-check: odd input shows as written or plainly formatted, quickly, and never breaks the pane
- 0208 AC1: in the panel, a ticket changed as soon as its new worktree is checked out reaches every open page within 1 second
- 0476 AC2: a sideways scroll on a trackpad and the arrow keys change lane in the same time; with reduced motion, without sliding
- 0517 AC3: in a real browser with 500 shipped tickets, a slide's first frame comes within 50 ms of the lane change, with no redraw in it
- 0202 AC1, AC2: a stalled run ends every process it started, in a group of its own or orphaned, and nothing else
- 0476 AC2: a swipe moves the card with the finger and comes to rest on one whole card within 120 ms (0517); a flick changes lane however short, a slow drag past a quarter

## Outcome
The full suite passes on main again.

## Acceptance criteria
1. Each of these tests passes on main again: 0657 AC3: 13 px text, or a fill with no text colour of its own, fails speck test --files with another file, and the quick run, 0061 self-check: odd input shows as written or plainly formatted, quickly, and never breaks the pane, 0208 AC1: in the panel, a ticket changed as soon as its new worktree is checked out reaches every open page within 1 second, 0476 AC2: a sideways scroll on a trackpad and the arrow keys change lane in the same time; with reduced motion, without sliding, 0517 AC3: in a real browser with 500 shipped tickets, a slide's first frame comes within 50 ms of the lane change, with no redraw in it, 0202 AC1, AC2: a stalled run ends every process it started, in a group of its own or orphaned, and nothing else, 0476 AC2: a swipe moves the card with the finger and comes to rest on one whole card within 120 ms (0517); a flick changes lane however short, a slow drag past a quarter.
2. No test that passed before this change fails.

## Out of scope
- Changes the failing tests don't need.

## Notes
<!-- Constraints, links and decisions. Optional. -->
Failing before this build: none (the recorded result for this code, the quick suite at bcf42b1, passed; the full suite at 239b16e failed with the tests in the Problem)

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
