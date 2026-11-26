---
id: "0764"
title: "Say which model is on each ticket in progress"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "deep"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-26

---
# 0764 · Say which model is on each ticket in progress

**Status:** 📝 draft

## Problem
The factory floor is to show, for every project, which ticket each team member is working on and on which agent, model and effort. A project's summary (`projectSummary`, sent to `speck serve`'s front) gives counts and what needs you, but not who is working on what or on which model.

## Outcome
Each project's summary lists the work at each station, with the agent, model and effort it runs on, and what each station would run on when idle.

## Acceptance criteria
1. A project's summary lists each ticket being built, reviewed or checked in the running app, with its id, title, station (builder, reviewer or QA), agent, model, effort, why it's on them (its level, its own fields, the settings, or a stand-in from a bench) and when it got there.
2. It gives, for each of builder, reviewer and QA, the agent, model and effort that station would use for a new ticket with no level, and whether QA is set up.
3. It gives the queue (how many tickets are ready and the next three ids by priority) and the tickets waiting at Ship, saying which wait for you.
4. A model left blank in the settings is named as the agent's default, in the same words Settings and a ticket's Builder fact use.
5. No test that passed before this change fails.

## Out of scope
- Showing any of it: the factory floor tickets after this.

## Notes
- For the factory floor's line (see the ticket that shows it). A new page at `speck serve`'s address, for a laptop or desktop window. It doesn't replace or change the panel, which stays the phone and side-panel view (decided 2026-11-26).
- `projectSummary` is in `scripts/panel-summary.mjs`; the front asks each panel through `/api/projects/own`. Builder models per ticket come from its level and fields (0662, `level_builds`); review rounds record their reviewer and model; QA has `qa_*` settings (0651).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
