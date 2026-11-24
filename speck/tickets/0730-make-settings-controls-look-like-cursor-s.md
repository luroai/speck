---
id: "0730"
title: "Make Settings' controls look like Cursor's"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: cursor              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0729"]                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T18:50:03.869Z"

---
# 0730 · Make Settings' controls look like Cursor's

**Status:** 🔨 building

## Problem
Settings uses the browser's plain select boxes and text fields and a black-and-white switch, which look unlike the controls beside them in Cursor: green switches, compact borderless menus reading "Default ⌄", and small rounded buttons.

## Outcome
Settings' switches, menus, boxes and buttons look like Cursor's settings controls.

## Acceptance criteria
1. Every on/off setting in Settings, `auto_ship` and the Auto-build switch included, is a switch whose track is green when on and grey when off, with a white knob, as in Cursor's settings.
2. Every list is a compact menu showing its current value and a small chevron ("Default ⌄"), with no box border until it's hovered or focused, and opens the same choices as today.
3. Text and number boxes, Remove and the other small buttons are small rounded controls in the interface font, with a light border, as Cursor's Open button is.
4. Every control keeps a 44 px target, a visible focus ring for the keyboard, and the same values, refusals and saving as today, in both the light and dark looks.
5. No test that passed before this change fails, except tests that pin the old controls' look, which are changed to check the new one.

## Out of scope
- The layout of rows and groups: the ticket before this one.
- The Save button's place and saving model.

## Notes
- Failing before this build: none
- Raised by the user on 2026-11-24 with a screenshot of Cursor's General settings.
- Switches are `[role="switch"]` in `templates/panel-settings.css`; lists are `select` elements built in `templates/panel-settings.js`. Keeping them as native `select` elements, styled, keeps phones' own pickers.
- Green: pick one that meets 3:1 against the track's surroundings in both looks, kept apart from the panel's status green if they would be confused.
- speck (2026-11-24 16:02 UTC) made draft fix ticket 0737: Wait to start dependent builds when approved work conflicts with main. Why: 0730 was launched because 0729 is approved, but its approved branch conflicts with main, so the scheduler needs to wait for that conflict to clear rather than launch a build that cannot start.
- 2026-11-24: its first build stopped before starting, as it began on 0729's approved work while that conflicted with main and the main checkout had been made bare. Set ready again once 0729 shipped.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
