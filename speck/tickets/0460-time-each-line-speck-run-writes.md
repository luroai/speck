---
id: "0460"
title: "Time each line speck run writes"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T09:21:18.556Z"

---
# 0460 · Time each line speck run writes

**Status:** 🔨 building

## Problem
speck run's output, which the panel shows as the pipeline log from `speck/.cache/runs/run.log`, has no times, so you can't tell when anything in the pipeline happened.

## Outcome
Each line speck run writes says when it was written.

## Acceptance criteria
1. Each line speck run writes to its output, and so to `run.log` when the panel's switch started it, starts with the local time as `HH:MM:SS` and a space, as a build log's lines do (0422).
2. When one message runs over several lines, only its first line has the time. The lines after it start with nothing added.
3. Lines already in `run.log` stay as they are. No test that passed before this change fails.

## Out of scope
- How the panel shows the log (0459).
- Dates, or times in build or ship logs.

## Notes
- Asked for by the user on 2026-10-24: the pipeline log "with timestamps … just like all the individual ticket build logs."
- `run.log` is speck run's own output, sent to the file by `panelRunOn` in `scripts/panel-run.mjs` (0128), so started from a terminal, speck run's output is timed too.
- The build log's time form is matched by `logParts` in `templates/panel.js`: `^(\d\d:\d\d:\d\d )`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
