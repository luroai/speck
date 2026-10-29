---
id: "0551"
title: "Stop speck run when the panel's switch times out"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-28-stop-speck-run-when-the-panel-switch-times-out.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-29
started: "2026-10-29T14:13:40.713Z"

---
# 0551 · Stop speck run when the panel's switch times out

**Status:** 🔨 building

## Problem
When the panel's speck run switch is turned on and speck run doesn't take its lock and say it's watching within 10 seconds, the panel shows an error but leaves the speck run it started running. That speck run can start watching and launch builds a moment later, while the switch shows it off and failed.

## Outcome
A speck run the panel's switch started that didn't say it was watching in time is stopped before the switch reports the time-out, so nothing the switch started is left running.

## Acceptance criteria
1. When the panel's switch is turned on and the speck run it started hasn't taken its lock and said it's watching within the time limit, that speck run and its process group are stopped before the panel answers, and the switch then shows speck run off.
2. The error the panel shows after that time-out says speck run didn't say it was watching in time, that it was stopped, and where its output is.
3. If that speck run is still there after it has been sent SIGTERM and then SIGKILL and waited for, the panel's error names its process id and says to stop that process yourself.
4. `speck run --background` still stops a speck run that didn't say it was watching in time, and exits non-zero with the time-out's message, as it does today.
5. No test that passed before this change fails.

## Out of scope
- The switch's own 10-second limit, and turning speck run off.
- What happens when speck run refuses to start (exit before it's on), which already leaves nothing running.

## Notes
- Asked for 2026-10-29 for the 0.21.1 patch release.
- From 0544's build: `speck run --background` stops the process it started on a time-out (`stopStarted` in `scripts/run-background.mjs`), while the panel's `panelRunOn` in `scripts/panel-run.mjs` only reports it, as a 500 with the child's `pid` in its body. `scripts/run-background.mjs` imports `panel-run.mjs`, so moving or sharing `stopStarted` mustn't make a loop.
- Quick test: call `panelRunOn` directly with a short `ms` and a speck run that never says it's watching, as 0544's tests do for `startBackground`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes
- Pictures: none, because nothing anyone sees changes apart from the wording of the switch's time-out error

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
