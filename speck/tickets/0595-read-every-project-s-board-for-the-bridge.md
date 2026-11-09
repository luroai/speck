---
id: "0595"
title: "Read every project's board for the bridge"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-09

---
# 0595 · Read every project's board for the bridge

**Status:** 📝 draft

## Problem
The bridge shows what needs you across every project on this machine (0596), but each panel today knows only its own board. The panels already find each other through 0516's records, so one can ask the others for a summary.

## Outcome
A panel can give a summary of every speck panel running on this machine.

## Acceptance criteria
1. The panel serves a summary of each speck panel running on this machine, from 0516's records: its project's name, its status word, how many tickets are building, queued and need you, and how many shipped and what was spent in the last 7 days.
2. Each summary lists what needs you there: the ticket's id, title and why (a question, waiting at Ship, high risk, or the engineering manager's question).
3. A panel that doesn't answer within 2 seconds is listed as not running, without failing the rest.
4. It answers only the panel page it served, as the project menu's requests do (0516).
5. No test that passed before this change fails.

## Out of scope
- Showing it (0596).

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today: `scripts/panel-projects.mjs` (`runningPanels`, `registerPanel`, the pass-through to another panel) and the routes in `scripts/panel.mjs`.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
