---
id: "0697"
title: "Count everything a project's bar counts on the bridge"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-10-count-stopped-builds-on-the-bridge.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15

---
# 0697 · Count everything a project's bar counts on the bridge

**Status:** 📋 ready

## Problem
The bridge (All projects) counts a project's questions, the engineering manager's questions and tickets waiting at Ship under Needs you, but not a build that stopped with nothing to carry it on (0616) or a failing full suite (0630), which a project's own bar counts. So the bar can say "Needs you 1" while the bridge says "Nothing needs you" for the same project, and someone watching every project from the bridge misses it.

## Outcome
The bridge counts and shows everything a project's bar counts under Needs you.

## Acceptance criteria
1. For each project, the bridge's Needs you count is the same number the project's own bar shows, including stopped builds that nothing will carry on and a failing full suite.
2. A stopped build has a card on the bridge naming the project and the ticket and saying its build stopped, and a failing full suite has a card naming the project and the failing tests, or the exit code when no test is named, as the project's Build lane does.
3. With neither, the bridge's count and cards are as today.
4. No test that passed before this change fails.

## Out of scope
- Changing what a project's own bar counts.

## Notes
- From `speck/ideas/done/2026-11-10-count-stopped-builds-on-the-bridge.md` and `speck/ideas/done/2026-11-11-count-a-failing-full-suite-on-the-bridge.md`. The bridge's count comes from `projectSummary` in `scripts/panel-summary.mjs`; the full suite's failure is the foreman view's `full`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
