---
id: "0273"
title: "Lay out the Settings view like the rest of the panel"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T13:33:13.371Z"

---
# 0273 · Lay out the Settings view like the rest of the panel

**Status:** 🔨 building

## Problem
The Settings view is a long column of rows with little between them: the groups run into each other, individual settings are hard to pick out, and it doesn't look like the rest of the panel, whose sections sit in bordered boxes with a heading bar.

## Outcome
The Settings view is laid out like the rest of the panel: each group is a box of its own, and each setting is a clear row with its name on one side and its value on the other.

## Acceptance criteria
1. Each group ("Shipping", "Building and reviewing", "How much runs at once", "Ticket size limits") is drawn as a bordered box with a heading bar, the way the panel's Plan, Build and Shipped sections are, with space between the boxes. (checked by review)
2. Within a group, each setting is a row with its name and info button on the left and its value or control on the right, and the controls of a group line up in one column. Rows are divided from each other by a line. (checked by review)
3. A setting that applies to this machine only, or that can only be changed in the file, still shows which it is, as today.
4. At the panel's narrowest width, each row's name and control still fit without the view scrolling sideways.
5. In both the light and dark looks, the view uses the panel's own colours, type and borders, and no text is smaller than 12 px or lighter than weight 400 (0161).

## Out of scope
- The Save buttons: 0274.
- What the settings are, their explanations and how they're saved.

## Notes
- The view is in `templates/panel.html` (search for "0257"). The panel's section boxes are the model.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
