---
id: "0750"
title: "Hold the pull request queue while the main checkout is bare"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 4              # 1 (highest) to 5, or 0 on a fix ticket
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
source: "speck/ideas/done/2026-11-24-hold-the-pull-request-queue-while-the-main-checkout-is-bare.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T23:49:48.252Z"

---
# 0750 · Hold the pull request queue while the main checkout is bare

**Status:** 🔨 building

## Problem
In pull request mode, a ship refused because the main checkout is bare counts as a try, so once it's set back the ticket waits until its pull request, the base branch or its branch changes, and auto-ship looks stuck. The local ship queue doesn't count it (0740).

## Outcome
The pull request queue holds while the main checkout is bare and tries again once it's set back.

## Acceptance criteria
1. In pull request mode, while the main checkout's `core.bare` is true, speck run's pull request queue merges nothing and doesn't count it as a try for any ticket.
2. Once `core.bare` is false again, the next check carries on merging as if the hold had never happened.
3. No test that passed before this change fails.

## Out of scope
- The local ship queue, which 0740 covers.

## Notes
- `scripts/pr-queue.mjs`; the check is `bareMain()` in `scripts/bare-main.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
