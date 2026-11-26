---
id: "0758"
title: "Keep each project's speck run going under speck serve"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
source: "speck/ideas/2026-11-10-run-a-software-factory-from-one-speck-service.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0756"]                # ticket ids that must be done first
created: 2026-11-25

---
# 0758 · Keep each project's speck run going under speck serve

**Status:** 📋 ready

## Problem
Each project's `speck run` is started by hand or by its panel's Auto-build switch, and stays off after the machine restarts until someone turns it on again. Under one service, work in every project should carry on by itself.

## Outcome
`speck serve` starts each project's `speck run` that was on, and keeps it on.

## Acceptance criteria
1. When `speck serve` starts, it starts `speck run` for each listed project whose run was on when `speck serve` last stopped, or that its Auto-build switch was last turned on in, and leaves the others off.
2. Turning a project's Auto-build off in its panel keeps it off under `speck serve`, including after `speck serve` restarts.
3. A `speck run` that `speck serve` started and that exits without being turned off is started again within 30 seconds, at most 3 times an hour, and the panel's Pipeline log says so.
4. `speck serve --stop` leaves each project's `speck run` running, as the Auto-build switch does today, and says which are still on.
5. No test that passed before this change fails.

## Out of scope
- Changing how `speck run` itself works.

## Notes
- Step 1 of the factory (see the source idea): one speck service per machine runs every project behind one address, so the user can sign in from any device and see every project, instead of starting a panel and a `speck run` in each project.
- `panelRunOn` and `runState` (`scripts/panel-run.mjs`, `scripts/run-switch.mjs`) start a run and tell whether one is on; the run lock is `speck/.cache/runs/run.lock`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
