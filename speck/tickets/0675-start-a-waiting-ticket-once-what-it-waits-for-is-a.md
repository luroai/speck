---
id: "0675"
title: "Start a waiting ticket once what it waits for is approved"                # one outcome, no "and"
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
after: ["0674"]                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T15:15:19.904Z"

---
# 0675 · Start a waiting ticket once what it waits for is approved

**Status:** 🔨 building

## Problem
Once `speck start` can build on an approved ticket (0674), `speck run` still skips a ready ticket until everything in its `after:` list has shipped, so the early start only happens by hand.

## Outcome
`speck run` starts a waiting ticket as soon as the one ticket it still waits for is approved, and ships the two in order.

## Acceptance criteria
1. `speck run` starts a ready ticket whose `after:` tickets are all done except one that's approved, as `speck start` allows. It still skips one whose `after:` ticket is in any other state, or with more than one not done.
2. With auto-ship on, `speck run` ships a ticket that was approved before the ticket it was built on shipped, on its first check after that ticket is done.
3. Until then, `speck status --json` still names that ticket in its `waiting_on`, and `speck run` says once that the ticket is approved and waits to ship after it.
4. The brief's `speck run` row says a ticket is skipped until its `after:` tickets have shipped, or all but one have and that one is approved.
5. No test that passed before this change fails.

## Out of scope
- The panel's wording for a ticket built on another.
- Starting on a ticket that's still building or reviewing.

## Notes
- `ownWait` in `scripts/run.mjs` holds back a ticket with anything in `waiting_on`, which `statusData` in `scripts/speck.mjs` works out.
- 0193 already has `speck run` ship approved tickets whose auto-ship didn't finish. This follows it.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
