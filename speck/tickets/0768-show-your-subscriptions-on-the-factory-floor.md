---
id: "0768"
title: "Show your subscriptions on the factory floor"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0764","0765","0766"]                # ticket ids that must be done first
created: 2026-11-26

---
# 0768 · Show your subscriptions on the factory floor

**Status:** 📝 draft

## Problem
Usage limits decide where work can go, and Settings is the only place that shows them. On the factory floor, the user wants to see each subscription's use next to the work drawing on it.

## Outcome
Under the line, the factory floor shows each of your subscriptions' use, when it resets and how many stations it's feeding now.

## Acceptance criteria
1. For each agent with a usage reading, the floor shows its name, the share used of its tightest window as a number and a segmented gauge in its agent colour, and when that window resets.
2. Each says how many stations across all projects are running on it now, from the projects' summaries.
3. At 90% or more, or limited, its gauge and number turn orange and it says so; an agent with no reading shows none.
4. No test that passed before this change fails.

## Out of scope
- Moving work between agents.

## Notes
- Design: mockup D, "Stations, instrument panel", on the user's private design canvas (2026-11-25/26): near-black ground with faint grid lines, one signal orange (#FF6A1F) for anything moving or needing you, green for shipped, small spaced-out monospace capitals for labels, big thin numbers, panels with corner-bracket marks. Use the fonts the panel already ships and no fonts from the network.
- Readings come from `GET /api/usage` (`scripts/subscriptions.mjs`), as Settings and the bridge's warning (0720) use them.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
