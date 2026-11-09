---
id: "0585"
title: "Show Build as compact rows grouped by what they need"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0584","0582"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T20:35:51.962Z"

---
# 0585 · Show Build as compact rows grouped by what they need

**Status:** 🔨 building

## Problem
Build cards are tall and busy, with progress lights, logs and buttons on each, so on a phone you see two or three tickets at a time. The redesign shows Build as compact rows grouped by what each ticket needs, with the detail one tap away.

## Outcome
Build lists its tickets as compact rows under Needs you, Building and Queued.

## Acceptance criteria
1. Build lists its tickets in three groups, each headed with its count and left out when empty: Needs you (blocked and waiting for you, approved and waiting at Ship, or with an engineering manager's question), Building (building, reviewing or shipping) and Queued (ready).
2. Each ticket is one row: its id in the mono font, its title, and one line saying where it is with a small dot (orange for needs you, blue while it's worked on, grey while it waits), such as "Reviewing · round 2 · 18 min" or "Ready · after 0557".
3. Pressing a row opens the ticket's full view, and its live details are no longer on the row.
4. Each row is at least 44 px tall, and a long title wraps rather than being cut off at 320 px wide.
5. Tests that checked the old look of what this changes are updated to the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Capture, Plan and Shipped (0586, 0587).

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today: `queueItem`, `titleLine`, `queuedLine` in `templates/panel.js`, styled in `templates/panel-cards.css`. Waits for 0584, which puts the live details in the full view first.
- Relies on nothing outside this repo.
Failing before this build: none
- speck (2026-11-09 21:10 UTC) told you: This build is slow because of the size of its test update, and nothing is stuck. Replacing the Build cards with rows broke 449 of the 3353 tests that checked the old look, so the builder split that work between six helper agents, which took about 7 to 19 minutes each, and it is now fixing the last few and re-running every panel test. Why: The build's log shows the 449 failures on its first full test run and later runs with only two failures left, the failures are all about the old cards with no test hanging, and the last full test run saved, on 0584 which this ticket builds on, passed; the high machine load fits the builder re-running the panel tests, though I couldn't list running processes to confirm it.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
