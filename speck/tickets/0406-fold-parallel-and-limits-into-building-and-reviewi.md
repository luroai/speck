---
id: "0406"
title: Put the building Settings groups in one box                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-fold-parallel-and-limits-into-building-and-reviewing.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0405"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T12:20:10.230Z"

---
# 0406 · Put the building Settings groups in one box

**Status:** 🔨 building

## Problem
Settings splits building into three boxes: "Building and reviewing", "How much runs at once" and "Ticket size limits". Those belong together, so the view is longer than it needs to be.

## Outcome
Parallel runs and ticket size limits sit in the Building and reviewing group.

## Acceptance criteria
1. Settings has one "Building and reviewing" group and no separate "How much runs at once" or "Ticket size limits" groups.
2. That group holds, in order: the builder and reviewer settings it already has, then `max_parallel_builds` and `max_parallel_tests`, then `limits.max_acceptance_criteria`, `limits.max_changed_lines` and `limits.max_review_rounds`. Each setting still works as it does today.
3. Shipping and Foreman stay their own groups. No test that passed before this change fails, except a check that those two titles are their own groups, which is changed to check criterion 1.

## Out of scope
- Renaming any setting, or changing what it does.
- Appearance, Auto-build or Your agents.

## Notes
- Asked for 2026-10-23 from the "How much runs at once" heading. The three groups are entries in `SETTING_GROUPS` in `scripts/settings.mjs` (0257, 0273).
- Waits for 0405: both change how Settings is grouped or drawn (`scripts/settings.mjs`, `templates/panel.html`).
- Failing before this build: none
- Self-check: no changes. The panel draws whatever groups the server gives, so only `SETTING_GROUPS` changed; `test/panel-0257.test.mjs`'s list of groups was the check of the old titles (AC3).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
