---
id: "0047"
title: "Don't relaunch a build that's still running when speck run restarts"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
type: bug                # blank, or bug
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09

---
# 0047 · Don't relaunch a build that's still running when speck run restarts

**Status:** 📝 draft

## Problem
`speck run` only knows about the builds it launched itself. If it's restarted while a build it launched seconds earlier hasn't yet set its ticket to `building`, the new `speck run` sees the ticket as `ready` and launches it again, so two agents build the same ticket. That happened to 0040 on 9 October. A build left running across a restart also never gets its exit recorded, so the panel can't flag it if it finishes without shipping (0045).

## Outcome
A restarted `speck run` leaves builds that are still running alone, keeps track of them, and records when they stop.

## Acceptance criteria
1. `speck run` doesn't launch a ticket whose `speck/.cache/runs/<id>.json` has a `pid` that's still running and no `exited`, even while the ticket is still `ready`. It prints once that the ticket is already being built, with the session and pid.
2. Such a build counts towards `max_parallel_builds` while it runs.
3. `speck run` checks such a build on every poll. When its process has gone, it adds `exited` (the time it noticed) and `exit_code: null` to the run file, keeping the other fields, and prints a line saying the build stopped.
4. If that build left its ticket `ready`, `speck run` reports it as it does for its own builds, with the last five lines of the log, and doesn't launch it again.
5. A run file whose `pid` isn't running and has no `exited` gets `exited` and `exit_code: null` added when `speck run` starts, and then the ticket is treated as it is now.

## Out of scope
- Telling apart a reused process id from the original build.
- The panel (0045 already reads `exited`).

## Notes
- `exit_code` is `null` here because a process that isn't a child can't be waited on for its code.
- No external facts: everything is in this repo.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
