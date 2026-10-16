---
id: "0257"
title: "Show speck's settings, explained, in the panel"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-edit-settings-from-the-panel.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-16T20:29:54.810Z"

---
# 0257 · Show speck's settings, explained, in the panel

**Status:** 🔨 building

## Problem
Someone who has just set speck up can't tell which of the 30 or so lines in `speck/config.yml` matter, what each one does or what changing it would mean, so they leave settings as they are or change them blind. Some settings matter a lot: `auto_ship` decides whether approved tickets merge and push without them.

## Outcome
The panel has a Settings view that shows the settings people tune, grouped, each with its current value and a plain-English explanation of what it does.

## Acceptance criteria
1. The panel's header has a Settings button. Pressing it opens the Settings view. The view closes with its close button or Escape, and focus then returns to the Settings button.
2. The view lists these settings, in four groups in this order: "Shipping" (`auto_ship`, `auto_ship_risk`), "Building and reviewing" (`builder`, `reviewer`, `reviewer_model`, `reviewer_effort`, `allow_same_model_review`), "How much runs at once" (`max_parallel_builds`, `max_parallel_tests`) and "Ticket size limits" (`limits.max_acceptance_criteria`, `limits.max_changed_lines`, `limits.max_review_rounds`). Each shows its name as written in `speck/config.yml` and the value speck reads from the panel's checkout. A setting missing from the file shows speck's default value, labelled "default".
3. Each setting has an explanation of one or two sentences saying what it does and what changes if its value changes. The explanations of `auto_ship` and `auto_ship_risk` say that a ticket they cover is merged and pushed to the base branch without waiting for you.
4. After `speck/config.yml` changes, the next time the view is opened it shows the new values, without reloading the page.
5. The view has no control that changes a setting, and opening or using it sends the panel server no request other than a GET.

## Out of scope
- Changing settings from the panel: 0258, 0259 and 0261.
- Settings for this machine only: 0260 and 0261.
- Plumbing settings (`base_branch`, `build_command`, `commands.*`, timeouts and the rest), which stay in the file.

## Notes
- Panel files: `scripts/panel.mjs` (server, a GET for the settings or settings in the board state) and `templates/panel.html` (header and view). Read values with `loadConfig` in `scripts/core.mjs`, which supplies the defaults.
- Explanations live in one place so 0258–0261 can reuse them. Write them in British English, at a product-minded rather than technical level.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
