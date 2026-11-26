---
id: "0767"
title: "Show Virgil on the factory floor"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0765","0766"]                # ticket ids that must be done first
created: 2026-11-26
built_on: "0766"
started: "2026-11-26T20:32:22.248Z"

---
# 0767 · Show Virgil on the factory floor

**Status:** 🔨 building

## Problem
The factory floor needs one place that says what needs you across every project. Virgil, the engineering manager, is the panel's character for that.

## Outcome
The factory floor has Virgil's dial: the manager drawn large in the pipeline's mood, how many things need you across all projects, and what each one is.

## Acceptance criteria
1. Beside the line, the floor shows Virgil drawn with `SpeckFace` as the manager, at 120 px or more, in the busiest mood among all projects, the same way All projects works it out, inside a dial of rings.
2. Under it, a large count of everything that needs you across all projects, and one line for each (its project, id and a few words on why), each opening that ticket in its project's panel at the same address.
3. With nothing needing you, the count is 0 and a line says nothing needs you.
4. No test that passed before this change fails.

## Out of scope
- Answering or shipping from the floor.

## Notes
- Design: mockup D, "Stations, instrument panel", on the user's private design canvas (2026-11-25/26): near-black ground with faint grid lines, one signal orange (#FF6A1F) for anything moving or needing you, green for shipped, small spaced-out monospace capitals for labels, big thin numbers, panels with corner-bracket marks. Use the fonts the panel already ships and no fonts from the network.
- Virgil's look is the panel's own drawing (`templates/speck-face.js`): the half-shine glass, the red visor, its moods; the floor uses it rather than a copy.
- Failing before this build: not checked
- Self-check: a line's focus key now includes why it needs you, so two needs on one ticket keep focus apart; dial errors clear on the next press.
- Pictures: the floor is dark only, so there's no light look to picture.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
