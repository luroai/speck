---
id: "0508"
title: "Clear a not-pushed warning once its ticket is on the remote"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
created: 2026-10-25

---
# 0508 · Clear a not-pushed warning once its ticket is on the remote

**Status:** 📋 ready

## Problem
A ship that merged but couldn't push leaves a record naming the commit it merged, and the panel shows that ticket at the top of Shipped as "Merged, but not pushed" until that commit is on the remote's copy of the base branch (0204). If the commit stops existing, because the history was rewritten or the remote squashed it, the warning comes back for good, though the ticket is on the remote. On 2026-10-25 a history rewrite brought back eight warnings from 22 October, for tickets that had been pushed long before.

## Outcome
A not-pushed warning clears once its ticket is on the remote as done, whatever happened to the commit it recorded.

## Acceptance criteria
1. A ticket's not-pushed warning doesn't show, in the panel or in what `speck ship` and `speck run` read of the ship, when the remote's copy of the base branch, as git last fetched it, has that ticket's file in `speck/tickets/done/` with `status: done`, even when the commit its record names no longer exists in the repo or isn't on that branch.
2. When the remote's base branch has neither the recorded commit nor the ticket as done, the warning shows as it does today, including when the recorded commit no longer exists. With no copy of the remote's base branch, it shows as today.
3. A record whose commit has reached the remote clears as it does today. No test that passed before this change fails.

## Out of scope
- Deleting old ship records from `speck/.cache/runs/`.
- Pull request ships' records (`scripts/pr-ship.mjs`) beyond what they share with local ships.

## Notes
- Asked for by the user on 2026-10-25, after the eight warnings for 0262 and 0361 to 0367 reappeared once the history rewrite gave their commits new ids. Their stale records were moved out of `speck/.cache/runs/` by hand that day.
- Today: `shipState` and `notPushed` in `scripts/ship.mjs` (0204), which check `git merge-base --is-ancestor <sha> refs/remotes/<remote>/<base>`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
