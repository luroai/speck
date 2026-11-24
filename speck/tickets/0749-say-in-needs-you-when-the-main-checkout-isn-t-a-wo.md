---
id: "0749"
title: "Say in Needs you when the main checkout isn't a work tree"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-24-say-in-needs-you-when-the-main-checkout-isn-t-a-work-tree.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24

---
# 0749 · Say in Needs you when the main checkout isn't a work tree

**Status:** 📋 ready

## Problem
When the main checkout's `core.bare` is true, builds fail before starting and the panel can't load its data, as on 2026-11-24. Since 0740 speck run says so only in its log and as the ship queue's hold, so nothing tells you it needs you.

## Outcome
A bare main checkout shows under Needs you, in the panel and `speck status`, with the command that sets it back.

## Acceptance criteria
1. While the main checkout's `core.bare` is true, `speck status` lists it first under what needs you, with the command that sets it back (`git config core.bare false`).
2. The panel shows it as a Needs you row in Build and counts it in the bar's Needs you, and the bridge counts it for that project.
3. Once `core.bare` is false again, it's gone from all three.
4. No test that passed before this change fails.

## Out of scope
- Setting it back for you.

## Notes
- `bareMain()` in `scripts/bare-main.mjs` (0740).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
