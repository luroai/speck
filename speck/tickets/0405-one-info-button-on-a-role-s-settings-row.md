---
id: "0405"
title: "One info button on a role's Settings row"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-10-23-one-info-button-on-a-role-s-settings-row.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0404"]                # ticket ids that must be done first
created: 2026-10-23

---
# 0405 · One info button on a role's Settings row

**Status:** 📋 ready

## Problem
When a role's effort sits beside its model in Settings, that one row shows two info buttons: one for the role and one for the effort. Two "i" buttons on a single row is confusing.

## Outcome
A role's Settings row has one info button.

## Acceptance criteria
1. When builder, reviewer or Foreman shows an effort control in the same row as its model list, that row has exactly one info button, not one for the role and one for the effort.
2. Pressing that button shows an explanation that covers both the role and the effort (checked by review). Hover, click, keyboard focus and Escape behave as 0371 left them for a setting's explanation.
3. A role whose agent takes no effort still has one info button, as today. Other Settings rows that aren't a role with effort nested in are unchanged.
4. No test that passed before this change fails, except a check that the effort has its own info button in the role's row, which is changed to check criterion 1.

## Out of scope
- Changing what the effort list offers, or where it sits.
- The builder's effort setting itself: 0402.

## Notes
- Asked for 2026-10-23 from the Foreman row's `About foreman_effort` button beside the role's own info button.
- Checked 2026-10-23: `ROLE_PAIRS` in `templates/panel.html` nests `reviewer_effort` and `foreman_effort` into the role's row as a `.setting.model`, and `settingRow` gives that nested row its own info button (0400). 0402 will add `builder_effort` the same way.
- Waits for 0404: both change `templates/panel.html`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
