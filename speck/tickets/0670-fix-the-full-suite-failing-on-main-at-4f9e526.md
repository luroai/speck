---
id: "0670"
title: "Fix the full suite failing on main at 4f9e526"                # one outcome, no "and"
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
created: 2026-11-12
started: "2026-11-12T21:32:13.757Z"

---
# 0670 · Fix the full suite failing on main at 4f9e526

**Status:** 🔨 building

## Problem
The full suite fails on main at commit 4f9e526 (4f9e526d61d67540d1c62dc7bb304411ba88a8ba). Failing tests:
- 0517 AC3: in a real browser with 500 shipped tickets, a slide's first frame comes within 50 ms of the lane change, with no redraw in it
- 0110 AC4: a resumed build that exits by itself gets its exit recorded and is not resumed again
- 0043 AC4 (round 1 F1): a build that moved its ticket on in its own worktree is not reported as never started
- 0043 AC5 (round 1 F2): of several speck runs started at once, exactly one keeps running and launches
- 0043 AC5 (round 1 F2): several speck runs taking over the same stale lock at once leave exactly one running
- 0202 AC3: a run that does not stall ends as before, with its own exit code
- 0072: stop a running build from the CLI > 0072: the other tests > 0072 AC3 (round 1 F2, round 2): a stopped build whose ticket could not be blocked is not launched again when speck run restarts, until its ticket is committed again, whatever the commit dates

## Outcome
The full suite passes on main again.

## Acceptance criteria
1. Each of these tests passes on main again: 0517 AC3: in a real browser with 500 shipped tickets, a slide's first frame comes within 50 ms of the lane change, with no redraw in it, 0110 AC4: a resumed build that exits by itself gets its exit recorded and is not resumed again, 0043 AC4 (round 1 F1): a build that moved its ticket on in its own worktree is not reported as never started, 0043 AC5 (round 1 F2): of several speck runs started at once, exactly one keeps running and launches, 0043 AC5 (round 1 F2): several speck runs taking over the same stale lock at once leave exactly one running, 0202 AC3: a run that does not stall ends as before, with its own exit code, 0072: stop a running build from the CLI > 0072: the other tests > 0072 AC3 (round 1 F2, round 2): a stopped build whose ticket could not be blocked is not launched again when speck run restarts, until its ticket is committed again, whatever the commit dates.
2. No test that passed before this change fails.

## Out of scope
- Changes the failing tests don't need.

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
