---
id: "0588"
title: "Show what changed in a ticket's criteria in its full view"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0583","0585"]                # ticket ids that must be done first
created: 2026-11-09

---
# 0588 · Show what changed in a ticket's criteria in its full view

**Status:** 📋 ready

## Problem
When a build changes a ticket's acceptance criteria, it waits for you at Ship (0565), and its review pack lists what changed. Its full view and its row don't say so, so you can't see why it's waiting without opening the pack.

## Outcome
A ticket whose criteria changed says so in its row and its full view, with what each was and is now.

## Acceptance criteria
1. `speck status --json` gives each open ticket whose criteria changed, for each changed, added or removed criterion, its text when the ticket was set ready and its text now.
2. Its full view shows, above the facts, a callout with speck's face, sheepish: "I changed criterion 2 while building", each change as Was and Now, and a line saying it won't ship by itself.
3. Each changed criterion in its list is marked "changed".
4. Its Build row reads "Approved · waiting at Ship: a criterion changed".
5. No test that passed before this change fails.

## Out of scope
- Stopping a build from changing its criteria.

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- 0565 added `criteria_changed` to `statusData` in `scripts/speck.mjs` and the "Criteria changed" part of the review pack in `scripts/pack.mjs`.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
