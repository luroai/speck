---
id: "0446"
title: "Skip speck's events from while the panel was hidden"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-skip-speck-s-events-from-while-the-panel-was-hidden.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24

---
# 0446 · Skip speck's events from while the panel was hidden

**Status:** 📝 draft

## Problem
When the panel's tab has been hidden or the screen asleep, speck plays every pipeline event it missed, one after another, when you come back. After a night's builds that's a long queue of celebrations and question marks about things already past.

## Outcome
Coming back to the panel plays at most the latest event, and only a recent one.

## Acceptance criteria
1. When the panel's page becomes visible again after being hidden, speck plays at most one of the events that happened while it was hidden: the latest, and only if it happened less than 60 seconds before the page became visible. Then speck shows the pipeline's state as 0436 sets.
2. While the page stays visible, every event plays as 0414 sets.

## Out of scope
- Which events play and their animations (0414).

## Notes
- For release 0.15.0 (0452). The user asked on 2026-10-24 for everything relevant to the release to be ticketed.
- From the builder's self-check on 0414. The reviewer held that 0414's criterion 4 asked for every event to play, so this needed a product decision: the latest only, under a minute old.
- speck's screen code is in `templates/panel.js`.
- Waits for nothing.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
