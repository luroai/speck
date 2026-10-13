---
id: "0144"
title: Call the speck run switch Auto-build                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-13
started: "2026-10-13T08:18:10.904Z"

---
# 0144 · Call the speck run switch Auto-build

**Status:** 🔨 building

## Problem
The panel header shows "speck run on" or "speck run off", with a blue or grey square and a "Turn on" or "Turn off" button. "speck run" is a command name, so it means nothing to someone who doesn't know it, the grey square reads as faded rather than off, and the button makes the user work out the state before they know what it will do.

## Outcome
The header's switch is called Auto-build: its state is plain at a glance, in green or red, and its button says what it will do.

## Acceptance criteria
1. While speck run is on, the header indicator reads "Auto-build on" with a square in the panel's green (the colour used for "lint passes"), and the button beside it reads "Pause".
2. While speck run is off, the indicator reads "Auto-build off" with a square in the panel's red (the colour used for a blocked ticket), followed by "ready tickets wait" in smaller, muted text, and the button reads "Start".
3. Hovering over the indicator shows a tooltip naming the command: "speck run". While the button's request is being answered, it reads "Starting…" or "Pausing…" and can't be clicked again.
4. The button does exactly what it does today: Start starts `speck run`, and Pause stops it the way Ctrl-C does, leaving builds already running to carry on. The connection indicator ("live · Ns ago", "disconnected") keeps its text and colours.
5. No test that passed before this change fails, except checks of the old labels ("speck run on/off", "Turn on/off", "Turning on/off…") or the old blue and grey square, which are changed to the new ones.

## Out of scope
- Renaming the `speck run` command, or its name in the docs and CLI.
- Moving the switch out of the header.
- Changing what starting or pausing does.

## Notes
- Labels are set in `templates/panel.html` (the `run` and `run-switch` elements). The speck run square and the connection square share the `.live` class: `.live` is `--run` (blue) and `.live.idle` is `--faint` (grey). The panel's green is `--ok` and its red is `--bad`.
- The phone layout (0140) keeps header labels on one line at 375 px; the new labels must too.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
