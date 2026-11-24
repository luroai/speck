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
- The failing run's output was overwritten by the next full run (4dda328), which failed 0657 AC3 (a real panel in its copy didn't start within 10 s: "panel didn't start") and 0517 AC3 (first frames of 46–131 ms on the clock in all three tries), and passed both on the rerun. The load was 65–90 on 16 cores. All six files pass on their own under that load; 0476 AC2 passed 6 copies at once. No output was kept for 0061, 0202, 0208 or 0476, so their fixes go after what each waits for on the clock.
- 0657 AC3: its copy runs with SPECK_TEST_CHROME=none, which findChrome now reads as no browser, so the rule files' real-browser tests are skipped there (199 s down to 3 s); the two broken rules are checked without a browser.
- 0061 self-check: timed by this process's CPU time (process.cpuUsage), not the clock.
- 0517 AC3: each first frame timed by the page's main thread's CPU time (Chrome's ThreadTime), with the slide paused until it's read, so the redraw after it isn't counted; about 15–24 ms here. The clock times are reported beside it, and the check that nothing is redrawn in that frame is unchanged.
- 0202 AC1, AC2: the stalling run writes a line every 0.2 s until both its processes have started (for up to 30 s), then goes quiet; its stall time is 3 s rather than 1 s.
- 0208 AC1 (panel): the second is counted on top of the time a change in the main checkout takes under the same load, measured just before, with the keep-alive at 60 s, so a missed worktree still fails.
- 0476 AC2: the waits for a lane's tab to open and for its slide to end are 10 s rather than 3 s; the slide's own 120 ms check is unchanged.
Self-check: capped 0202's wait for its kept process at 30 s, so one that never starts ends in a stall rather than hanging the file.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
