---
id: "0569"
title: "Look into a build that runs long"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-10-13-look-into-a-build-that-runs-long.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0567"]                # ticket ids that must be done first
created: 2026-11-08

---
# 0569 · Look into a build that runs long

**Status:** 📝 draft

## Problem
When a build runs far longer than usual, nobody notices until you ask why. On 2026-10-13 a test added by 0149 hung about half of all full test runs, builds went from 6 to 9 minutes to 26 and 45+, and spotting it and raising the fix (0159) took a human, though speck already knows its usual build time.

## Outcome
When a build runs well past the usual time, speck looks into why and tells you what it found, raising a draft fix ticket when the base branch itself is broken.

## Acceptance criteria
1. With `watch: fix` or `watch: decide`, when a build has been running for more than twice the median build time of the last 20 shipped tickets, and for at least 20 minutes, `speck run` starts its watch agent for it once per build. The agent's brief names the ticket, how long the build has run, the median, the last lines of its log and the machine's load average. A paused build doesn't count.
2. With `watch: tell`, `speck run` says once in its log that the build is running long, with the same figures, and starts no agent. With `watch: off`, it does neither.
3. `speck watch` has a `tell` action that writes what the agent found in the ticket's Notes and in `speck run`'s log, needs no answer, and doesn't count under Needs you.
4. The `speck-watch` skill tells the agent, for a build that runs long, to read its log, its test runs in `speck/.cache/results/` and the machine's load, then to make a draft fix ticket with `fix` when the base branch is broken (such as a test that hangs), and otherwise to `tell` what it found, even when the slowness was harmless (checked by review).
5. No test that passed before this change fails.

## Out of scope
- Stopping or restarting the slow build.
- Setting a fix ticket ready: it stays a draft for you, as `speck watch fix` makes it today.

## Notes
- Asked for 2026-11-08 for release 0.22.0, alongside 0563 to 0568 (speck decides and tells you): "Agree to all of that including 4. Set it all ready and get a release out".
- Decided with the user: the fix ticket is raised as a draft and you're told; Gate 1 stays yours.
- Today: `speck run` starts the agent for ended builds (`lookInto` in `scripts/run.mjs`, `buildStuck` and `stuck` in `scripts/foreman-agent.mjs`); `speck watch fix` already makes a draft fix ticket (`makeFixTicket`). The panel works out the median build time in `templates/panel-model.js`.
- Waits for 0567, which adds `decide` to `speck watch`'s actions in `scripts/foreman-agent.mjs`, after 0564 and 0566.
- Relies on nothing outside this repo; the load average is Node's `os.loadavg()`, which is all zeros on Windows.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
