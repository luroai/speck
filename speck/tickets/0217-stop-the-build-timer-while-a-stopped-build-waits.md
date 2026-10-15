---
id: "0217"
title: "Stop the build timer while a stopped build waits"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-14-stop-the-build-timer-while-a-stopped-build-waits.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0214"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T23:34:36.098Z"

---
# 0217 · Stop the build timer while a stopped build waits

**Status:** 🔨 building

## Problem
When a build stops or exits before finishing while its ticket is still building or reviewing, the Build queue says so but the ticket's timer keeps counting, and the wait ends up in its shipped minutes. Nobody is building the ticket then, so this counts time spent waiting for the user, which 0166 removed for blocked and paused tickets.

## Outcome
A stopped build's waiting time is left out of its build time, as blocked and paused time are.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. While the Build queue shows a ticket as "Build stopped before finishing", its timer shows the time up to when the build exited (less waiting time, as today) and doesn't count up.
2. While it shows a ticket as "Build stopped unexpectedly", its timer stops at the time speck first noticed the build had stopped and doesn't count up. That time is recorded, so the timer shows the same after a page reload or a panel restart.
3. When the ticket's build starts again (speck run resuming it, or a new build of it), its timer counts on from where it stopped: the stretch from the stop to the new start is left out of the timer, of the time to approval and of its shipped minutes.
4. A ticket whose build is running, blocked or paused is timed as today, and no test that passed before this change fails.

## Out of scope
- Showing how long a stopped build has been waiting.

## Notes
- The panel's timer stops at `held_at` (`templates/panel.html`), which today covers approved, blocked and paused tickets. Waiting time is added up in `waited_seconds` (0166, `waitFields()` in `scripts/core.mjs`).
- An exited build's run record has its exit time (`exited`, shown as `build_exit.at`). A killed build has no time recorded today, only a dead process (`buildKilled()` in `scripts/run.mjs`), so speck needs to record when it noticed.
- Failing before this build: none
- Resumes happen in `resumeKilled()` in `scripts/run.mjs` (which writes `resumed`), on hand-back, and by hand.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
