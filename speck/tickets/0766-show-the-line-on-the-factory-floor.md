---
id: "0766"
title: "Show the line on the factory floor"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
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
after: ["0764","0765"]                # ticket ids that must be done first
created: 2026-11-26
built_on: "0765"
started: "2026-11-26T20:14:29.144Z"

---
# 0766 · Show the line on the factory floor

**Status:** 🔨 building

## Problem
The user wants to see, across every project at once, who is working on what and on which model. The factory floor shows projects and boards, but not the work at each station.

## Outcome
Above the stations, the factory floor shows the line: a row per project through Queue, Builder, Reviewer, QA and Ship, each lit station naming its ticket, agent, model and effort.

## Acceptance criteria
1. The line has a row for each project on the list that isn't off, and columns Queue, Builder, Reviewer, QA and Ship; the Builder, Reviewer and QA headings show that member's character as the panel draws it (`SpeckFace` roles).
2. A station with a ticket on it is lit and shows the ticket's id, title and time there, its agent (as a stripe in that agent's colour), model and effort, and why it's on them, as the project's summary gives them.
3. An idle station shows, dimmed, the agent and model it would use; a QA station in a project with no QA set up says so; Queue shows the ready count and next ids, and Ship the tickets waiting there, marking those that wait for you.
4. A project that is idle has a faint line and one whose `speck run` is off is dimmed; at window widths under 1024 px the line scrolls sideways inside its own box, and the page doesn't.
5. No test that passed before this change fails.

## Out of scope
- Changing a station's model from the floor.

## Notes
- Design: mockup D, "Stations, instrument panel", on the user's private design canvas (2026-11-25/26): near-black ground with faint grid lines, one signal orange (#FF6A1F) for anything moving or needing you, green for shipped, small spaced-out monospace capitals for labels, big thin numbers, panels with corner-bracket marks. Use the fonts the panel already ships and no fonts from the network.
- Agent colours on the mockup: Claude Code sand, Codex blue, Cursor silver; keep them apart from the status colours.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
