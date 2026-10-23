---
id: "0396"
title: "Put Appearance and Auto-build at the top of Settings as toggles"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-rehash-the-settings-screen.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0395"]                # ticket ids that must be done first
created: 2026-10-23

---
# 0396 · Put Appearance and Auto-build at the top of Settings as toggles

**Status:** 📋 ready

## Problem
Appearance sits at the bottom of Settings as a list with a description, and the Auto-build switch is labelled "speck run" with a description under it. Neither name says plainly what it does, and the descriptions add clutter.

## Outcome
Appearance and Auto-build are toggles at the top of Settings.

## Acceptance criteria
1. Settings opens with Appearance first, then Auto-build, above every other group. Each is a single row with its name and a toggle switch, and no description under it.
2. Appearance's toggle switches between light and dark as it's pressed, shows which look is on, and is kept in this browser as today (0372).
3. Auto-build's toggle turns speck run on and off as today's button does, shows whether it's on, and shows a refusal beside it as today (0368). The label is Auto-build, and "speck run" no longer appears as it. What on and off do is in its info button.
4. Both toggles work from the keyboard and with a screen reader, as switches that say whether they're on, and each fits on one row at 320 px wide.
5. No test that passed before this change fails, except checks of the light/dark list, the Auto-build button's wording and place, and their descriptions, which are changed to check these criteria.

## Out of scope
- The other groups, apart from moving below these two.

## Notes
- Checked 2026-10-23: Settings in `templates/panel.html` shows the Foreman group's "speck run" row with an "Auto-build on" button and a description, and a "Look" group at the end with a light/dark list and "For the panel in this browser…" (0150, 0372).
- The user chose the name Auto-build on 2026-10-23.
- Waits for 0395: both change Settings in `templates/panel.html`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
