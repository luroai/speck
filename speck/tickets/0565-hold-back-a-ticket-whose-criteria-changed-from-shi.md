---
id: "0565"
title: "Hold back a ticket whose criteria changed from shipping by itself"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-08
started: "2026-11-08T23:01:57.301Z"

---
# 0565 · Hold back a ticket whose criteria changed from shipping by itself

**Status:** 🔨 building

## Problem
A build can change its ticket's acceptance criteria, as 0529's did when a criterion turned out wrong, and nothing records it: no copy of the criteria is kept from when the ticket was set ready, and nothing compares them. Once speck decides questions itself, a ticket could ship by itself with criteria you never agreed to.

## Outcome
A ticket whose acceptance criteria differ from the ones it was set ready with waits for you at Ship, and its review pack shows what changed.

## Acceptance criteria
1. A ticket's criteria count as changed when the Acceptance criteria section in its branch's copy of the ticket differs from the one in the base branch's copy where its branch started, apart from spaces at the ends of lines.
2. `auto_ship` never ships a ticket whose criteria changed: `speck run`'s ship queue leaves it approved, and `speck ship <id> --auto` refuses, saying its acceptance criteria changed since it was set ready. `speck ship <id>` run by you, and the panel's Ship button, ship it as before.
3. Its review pack has a "Criteria changed" part above the criteria, giving for each criterion changed, added or removed the text it was set ready with and the text now.
4. `speck status --json` gives each open ticket `criteria_changed`, true or false, and the Build card of an approved ticket whose criteria changed says it waits for you because a criterion changed.
5. No test that passed before this change fails.

## Out of scope
- Stopping a build from changing its criteria.
- Pull request mode's own merge rules beyond `auto_ship`.

## Notes
- Asked for 2026-11-08: the user goes with speck's recommendation almost every time, so speck should decide and tell them rather than ask ("ticket up 1": the watcher deciding). In this repo 15 of 17 recommendations taken were picked by hand in the panel, and 10 of the watch agent's 13 actions were questions.
- Decided with the user on 2026-11-08: when speck changes a criterion, the ticket waits at Ship rather than the build stopping to ask.
- Today: `autoShipWhyNot` in `scripts/ship.mjs` (about lines 406 to 416) decides what ships by itself; the review pack is in `scripts/pack.mjs` (about lines 95 to 108); the board is `statusData` in `scripts/speck.mjs` (about lines 428 to 460).
- Relies on nothing outside this repo.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
