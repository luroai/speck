---
id: "0592"
title: "Make the Pipeline log a full view"                # one outcome, no "and"
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
after: ["0591","0590"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T21:56:49.489Z"

---
# 0592 · Make the Pipeline log a full view

**Status:** 🔨 building

## Problem
The Pipeline log is a pop-up of raw lines. In the redesign it's a full view you can filter, where speck's own calls stand out from the tool's routine lines.

## Outcome
The Pipeline log is a full view with filters, and speck's own lines carry its face.

## Acceptance criteria
1. Pressing the bar opens the Pipeline log as a full view: a back link, the heading, and a line with speck in its mood saying whether speck run is on, since when, and how many build slots are in use.
2. Filters, Everything, Decisions, Ships and Builds, show only those lines; Everything is chosen when it opens.
3. Each line is a row: its time in the mono font, its text, and its details, such as its log file or agent, under it in the mono font.
4. The engineering manager's own lines (0591) show speck's face beside them; the rest don't.
5. Tests that checked the old look of what this changes are updated to the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- A ticket's build log, which stays a pop-up (0548).

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today: `#foreman` with `renderForeman`, `drawRunLog`, `fillLog`, `runLogRow` in `templates/panel-popups.js`; lines from `runLogSummary` and `runLogLine` in `templates/panel-model.js`.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
