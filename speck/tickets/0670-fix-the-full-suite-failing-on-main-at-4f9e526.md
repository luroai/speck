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
Failing before this build: the seven tests this ticket names (its own target, so they are the ones fixed here). Eighteen more failed in the full run at 4f9e526 but passed when their files ran again (0232 AC3, 0110 AC2, 0300 AC1 AC3, 0511 AC4, 0153 AC1 AC2, 0202 AC1 AC2, the other 0072 tests, 0217 AC3, 0233 AC1, 0271 AC3, 0109 AC1): chance failures, not changed here.
Cause: the full run was on a machine at a load average of about 50 on 16 cores, and its retry ran all 13 failing files at once. Each of the seven waits a fixed or short time for a speck run to start, settle or exit, or measures a browser frame's timing. Run on their own, even with the load around 45, all seven pass.
Fix: only tests change. The shared `until` in test/support/run.mjs now waits up to BUSY_MS (30 s) by default instead of 8 s; every use waits for something to happen, so it returns as soon as that holds and only a failing wait takes longer. 0043 AC5's `race` waits for the losing runs to exit and the winner to launch instead of a fixed 1.5 s, 0072 AC3 waits for speck run's line instead of a fixed 0.8 s, 0202 AC3's stall limit goes from 0.6 s to 5 s (still far above the 0.2 s between ticks, so a stall would still show), and 0517 AC3's 50 ms limit grows with the load past one process per core (unchanged on a machine with a core to spare). Its check that nothing is redrawn in the slide's first frame is unchanged.
Self-check: the first version changed only the ticket's own `until` calls; the related run showed more tests in the same files failing on the 8 s default under load, so the default was raised instead and those single-call changes reverted.
Pictures: none, because nothing anyone sees changes (only tests changed)

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
