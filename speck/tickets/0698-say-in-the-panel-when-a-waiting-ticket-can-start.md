---
id: "0698"
title: "Say in the panel when a waiting ticket can start"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-15-say-in-the-panel-when-a-waiting-ticket-can-start.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15

---
# 0698 · Say in the panel when a waiting ticket can start

**Status:** 📋 ready

## Problem
Since 1.4.0, speck run starts a ready ticket on the approved work of the ticket it waits for (0675), and ships the two in order. The panel still shows such a ticket as waiting, and an approved one as an ordinary approved ticket, so the board reads as stuck while speck is getting on with it.

## Outcome
The panel says when a waiting ticket can start on another's approved work, and when an approved ticket waits to ship after the one it was built on.

## Acceptance criteria
1. A ready ticket that `speck status --json` gives a `starts_on` shows, wherever the panel says it's waiting for an `after:` ticket, that it can start on that ticket's approved work, naming it, instead of that it's waiting.
2. An approved ticket with `ships_after` says, on its card and in its full view, that it ships after the ticket it was built on, naming it.
3. A ticket with neither field reads as today.
4. No test that passed before this change fails.

## Out of scope
- Changing when speck run starts or ships such tickets.

## Notes
- From 0675's own note. The fields are `starts_on` and `ships_after` (`scripts/built-on.mjs`, `afterWait`).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
