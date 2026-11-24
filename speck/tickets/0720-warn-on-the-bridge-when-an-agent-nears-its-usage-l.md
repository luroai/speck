---
id: "0720"
title: "Warn on the bridge when an agent nears its usage limit"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-10-show-each-agent-s-usage-in-the-panel.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T14:33:58.528Z"

---
# 0720 · Warn on the bridge when an agent nears its usage limit

**Status:** 🔨 building

## Problem
Settings shows each subscription's usage since 1.2 (0646), but you only see it if you open Settings. Usage limits decide whether work moves, so a limit coming should be visible where you look first.

## Outcome
The bridge shows a line for each agent at 90% or more of a usage window, or limited.

## Acceptance criteria
1. When speck's latest reading for an agent shows any usage window at 90% or more, or the agent limited, the bridge shows a line naming the agent, the window (such as five hours or the week) and when it resets.
2. Each agent at or over 90% is named; an agent under 90% in every window, or with no reading, isn't.
3. The line goes once the agent's newest reading is under 90% in every window and not limited.
4. No test that passed before this change fails.

## Out of scope
- Readings themselves, and Settings' Your subscriptions (0642, 0643, 0646).

## Notes
- Readings come from `GET /api/usage` (`scripts/subscriptions.mjs`), which only `templates/panel-settings.js` reads today. 90% is where Settings' bars turn orange.
- Failing before this build: none
- Builder: Cursor took over this build from Claude at 2026-11-24 14:41 UTC, because Claude's usage limit was reached until 2026-11-24 16:10 UTC, more than an hour away.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
