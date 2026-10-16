---
id: "0220"
title: "Show only the refusing speck run's words when Turn on fails"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-keep-another-speck-run-s-lines-out-of-a-turn-on-refusal.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0219"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-16T03:01:39.573Z"

---
# 0220 · Show only the refusing speck run's words when Turn on fails

**Status:** 🔨 building

## Problem
When the panel turns speck run on and speck run refuses to start, the panel shows everything written to the shared `run.log` since the click. If another speck run writes a line in that moment (for example "Launched 0012"), that line shows up in the refusal, which mixes another run's news with the reason this one didn't start.

## Outcome
A refusal to turn speck run on shows only what the refusing speck run said.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. When a speck run started from the panel refuses to start, the refusal shown in the panel contains only what that speck run printed, even when another speck run writes to `run.log` in the same moment.
2. The refusal's own wording is as today (for example "speck run is already running …").
3. Turning speck run on when it can start works as today, and the started speck run still writes its lines to `run.log`.
4. No test that passed before this change fails.

## Out of scope
- The first-line mix-up after a successful Turn on, which 0207 fixed.

## Notes
- `panelRunOn()` in `scripts/panel.mjs` reads `run.log` from where it ended at the click.
- speck run must keep running after the panel exits, so its output can't simply be piped to the panel: the pipe would break when the panel exits.
- Failing before this build: none
- Self-check: no changes

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
