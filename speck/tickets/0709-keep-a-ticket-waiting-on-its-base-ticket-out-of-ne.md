---
id: "0709"
title: "Keep a ticket waiting on its base ticket out of Needs you"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
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
source: "speck/ideas/done/2026-11-15-don-t-say-ready-to-ship-while-the-base-ticket-hasn-t-shipped.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24

---
# 0709 · Keep a ticket waiting on its base ticket out of Needs you

**Status:** 📋 ready

## Problem
An approved ticket built on another ticket that hasn't shipped has auto-ship turned off until that ticket ships, so the panel puts it under Needs you as Ready to ship. You're asked to act when shipping it now would only have to wait.

## Outcome
Such a ticket stays under Building, saying it ships after its base ticket, and asks you only once it can really ship.

## Acceptance criteria
1. An approved ticket whose `built_on:` ticket hasn't shipped is shown in the panel's Build lane under Building, not under Needs you, and its line says it is approved and ships after that ticket, naming it.
2. It isn't counted in the panel's Needs you count, in the bridge's Needs you, or as waiting for you to ship in `speck status`.
3. Once the base ticket has shipped, the ticket ships by itself when auto-ship covers it, and otherwise shows under Needs you as Ready to ship, as today.
4. An approved ticket with no `built_on:`, or whose `built_on:` ticket has shipped, reads and counts as it does today.
5. No test that passed before this change fails.

## Out of scope
- A `built_on:` ticket that was cancelled: that has a ticket of its own.

## Notes
- `autoShipWhyNot` (`scripts/ship.mjs`) turns auto-ship off while `built_on` hasn't shipped, so the board sets `auto_ship: false` and `ships_after`. `buildGroup` and `doingNow` (`templates/panel-model.js`), `atShip` (`scripts/panel-summary.mjs`) and the status line (`scripts/foreman.mjs`, the speck-status skill) are where it shows. A ticket speck will act on (`foreman_will`) is already grouped under Building, which this follows.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
