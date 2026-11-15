---
id: "0682"
title: "Keep an idle speck run from re-reading every ticket"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 4              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0680"]                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T14:50:32.767Z"

---
# 0682 · Keep an idle speck run from re-reading every ticket

**Status:** 🔨 building

## Problem
Every 5 seconds `speck run` reads and checks every ticket in the project again, done ones included (about 680 here), and more than once within a check. Its cost grows with the project's history: this repo's run used 4 minutes 49 seconds of processor time in its first 14 minutes with two builds going, a third of one core, on a machine where tests already fail under load.

## Outcome
A check by `speck run` reads only the tickets that have changed since its last check.

## Acceptance criteria
1. When no ticket file has changed since `speck run`'s last check, the next check reads and parses no ticket file. A ticket file that has changed, appeared or gone, in the main checkout or in a build's worktree, is read on the next check.
2. Within one check, each ticket file is read at most once, however many of the check's steps need the tickets.
3. Everything `speck run` does, it does on the same check as today: a ticket set ready is started, a build that has ended is taken up, an approved ticket is shipped, and a change to `speck/config.yml` or this machine's settings takes effect, each on the first check after it.
4. No test that passed before this change fails.

## Out of scope
- How often `speck run` checks.
- `speck status` and the panel, which keep giving the answers they give today.

## Notes
- Checked 2026-11-15 with `ps` on this repo's `speck run`, 14 minutes after it started.
- `tick` and `readTickets` in `scripts/run.mjs` call `statusData` in `scripts/speck.mjs`, which reads and parses every ticket and runs the ready check on each. Other steps of the same check call it again for one ticket's status.
- Test it by counting reads, not by timing: timing tests in this suite have failed under load before.
- What a ticket's status entry says can also depend on its run record, its branch and the time, which aren't ticket files. Those are still worked out on each check.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
