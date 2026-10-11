---
id: "0127"
title: "Show in the panel whether speck run is on"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
created: 2026-10-11

---
# 0127 · Show in the panel whether speck run is on

**Status:** 📝 draft

## Problem
Someone watching the panel can't tell whether `speck run` is going. If it isn't, setting a ticket to ready does nothing, and nothing on the page says why.

## Outcome
The panel always shows whether `speck run` is on or off for this repo, and keeps it up to date without a reload.

## Acceptance criteria
1. While a `speck run` process is running in the repo, the panel page shows that speck run is on, and `/api/state` reports it as on.
2. While no `speck run` is running, the panel page shows that speck run is off, and `/api/state` reports it as off.
3. When `speck run` starts or stops while the panel page is open, the page shows the new state at its next refresh of `/api/state`, without reloading the page.
4. A run lock left behind by a `speck run` whose process has gone (for example, killed with SIGKILL) shows as off, not on.
5. No test that passed before this change fails.

## Out of scope
- Starting or stopping `speck run` from the panel: that's 0128.
- Showing what `speck run` is doing beyond on or off (its output, its builds); the queue rows already show builds.

## Notes
- `speck run` keeps one lock per repo, `speck/.cache/runs/run.lock`, holding its process id (`takeRunLock` in `scripts/run.mjs`). Reading it must never take, change or delete it.
- The on/off indicator sits where it's always visible, not inside a ticket row.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
