---
id: "0509"
title: "Start the panel in the background with speck panel --background"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-20-start-and-open-the-panel-when-setup-finishes.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-25
started: "2026-10-25T22:08:49.534Z"

---
# 0509 · Start the panel in the background with speck panel --background

**Status:** 🔨 building

## Problem
`speck panel` runs in the foreground until Ctrl+C. An agent that starts it at the end of setup has to hold a terminal open or run it in the background by its own means, which some agents end along with their session, and nothing says how to stop a panel started that way.

## Outcome
`speck panel --background` starts the panel so it keeps running on its own, and `speck panel --stop` stops it.

## Acceptance criteria
1. `speck panel --background`, with any of `--port` and `--url`, starts the panel as `speck panel` would, detached from the terminal and from the command that started it, prints the address or addresses it serves, and exits 0 once the panel answers there. The panel keeps running after the shell that ran the command has ended, checked with a real panel.
2. When this repo's panel is already answering on that port, `--background` starts nothing, prints the same address and exits 0. When something else holds the port, it refuses as `speck panel` does today.
3. `speck panel --stop` stops this repo's panel started with `--background`, saying so, or says that none is running. A panel in the foreground still stops with Ctrl+C as today.
4. A panel started with `--background` writes what it would print to `speck/.cache/panel.log`. `speck help` and the brief's `speck panel` row name `--background` and `--stop`. No test that passed before this change fails.

## Out of scope
- Setup starting and opening it (0510).
- Starting the panel when the machine starts.

## Notes
- From the idea, ticketed with the user on 2026-10-25.
- Today: `speck panel` in `scripts/panel.mjs`, which already hands over to a new server process when its code changes (`startPanelServer`) and refuses a port in use; the usage line in `scripts/speck.mjs`. `speck run`'s switch in the panel starts `speck run` in the background, writing to `speck/.cache/runs/run.log` (0128), which this can follow.
- Failing before this build: none
- Self-check: no changes. Kept scripts/panel.mjs and scripts/speck.mjs at the 600-line limit by condensing two comments.
- Pictures: none, because nothing anyone sees in the panel changes.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
