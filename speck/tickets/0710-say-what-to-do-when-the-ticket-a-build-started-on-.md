---
id: "0710"
title: "Say what to do when the ticket a build started on is cancelled"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-15-say-what-to-do-when-a-ticket-s-base-ticket-is-cancelled.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0709"]                # ticket ids that must be done first
created: 2026-11-24
built_on: "0709"
started: "2026-11-24T12:56:04.886Z"

---
# 0710 · Say what to do when the ticket a build started on is cancelled

**Status:** 🔨 building

## Problem
When a ticket was started on another ticket's approved work and that ticket is then cancelled, `speck ship` tells you to ship the cancelled ticket first, which can never happen. The ticket is stuck, with no way out but editing `built_on:` by hand.

## Outcome
speck says the base ticket was cancelled and names a way on that works.

## Acceptance criteria
1. When a ticket's `built_on:` ticket is cancelled, `speck ship <id>` refuses, saying the ticket it was built on was cancelled, and never tells you to ship the cancelled ticket.
2. The refusal names two ways on, each with the command that does it: rebuild the ticket from the base branch, or keep the cancelled ticket's work in this ticket and have all of it reviewed as this ticket's. Following either leaves the ticket able to be built or reviewed again without editing the ticket file by hand.
3. Auto-ship and speck run's ship queue say the same rather than that the ticket waits for its base ticket to ship, and the panel doesn't show it as shipping after the cancelled ticket.
4. A ticket whose `built_on:` ticket is done or still approved is handled as today.
5. No test that passed before this change fails.

## Out of scope
- Changing `after:` handling of cancelled tickets (0686).

## Notes
- `builtOnWaiting` (`scripts/built-on.mjs`) only checks `status === 'done'`, so a cancelled base reads as waiting; `builtOnCheck`, `autoShipWhyNot` (`scripts/ship.mjs`) and `scripts/ship-queue.mjs` give the "ship it first" wording.
- Refuse and name the ways out, as `after:` does for a cancelled ticket (`goneWhy`), rather than blocking with a question: an approved ticket has no build running to ask.
- Reviews measure only the ticket's own change from the base ticket (`ownBase`), so keeping the cancelled work means reviewing it again as part of this ticket.
- Waits for the ticket that keeps a ticket waiting on its base ticket out of Needs you: both change `built-on.mjs` and `ship.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
