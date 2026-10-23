---
id: "0415"
title: "Open the pipeline log from the screen"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0414"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T15:21:38.601Z"

---
# 0415 · Open the pipeline log from the screen

**Status:** 🔨 building

## Problem
The Foreman's detail says what's waiting and why, but not what speck run has done. To see that, you read `speck/.cache/runs/run.log` by hand.

## Outcome
Pressing speck's screen opens the pipeline log, which takes the place of the Foreman's detail.

## Acceptance criteria
1. Pressing the screen opens a pop-up titled `Pipeline`, and the Foreman's detail is gone. The pop-up starts with a `Right now` section that shows everything the Foreman's detail shows today, in the same order. The Foreman's questions keep their Answer and Dismiss buttons, and a stale page keeps its Reload page button.
2. Under it, a `Log` section shows speck run's output from `speck/.cache/runs/run.log`, newest line first, up to the latest 200 lines. Lines speck run writes while the pop-up is open appear within the panel's 2-second refresh. A reader who has scrolled down the log stays where they are. With no `run.log`, it says speck run hasn't written anything yet.
3. The pop-up closes with its Close button, Escape or a click outside it, and the focus goes back to the screen, as with the Foreman's detail today.
4. The panel's server reads only `speck/.cache/runs/run.log` for the log, and no request can make it read any other file.
5. At 320 px wide, the pop-up fits without the page scrolling sideways, and long log lines wrap.

## Out of scope
- Filters by kind of line, and times on each line (`run.log` has none).
- The screen and its animations (0413, 0414).

## Notes
- Design: the Pipeline sheet in console.html in https://claude.ai/artifact/R5CQDZJfMZ2rYcTmZK1B8z.
- The Foreman's detail is `renderForeman` (0285, 0287, 0317, 0318, 0328, 0366). `run.log` is written by `scripts/panel-run.mjs` (0220).
- Waits for 0414: both change `templates/panel.html`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
