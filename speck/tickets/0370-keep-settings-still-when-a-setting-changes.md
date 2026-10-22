---
id: "0370"
title: "Keep Settings still when a setting changes"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: cursor
reviewer_model: grok-4.7-high-fast       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-calm-the-settings-view-down.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0369"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T21:17:44.497Z"

---
# 0370 · Keep Settings still when a setting changes

**Status:** 🔨 building

## Problem
Changing the builder, the reviewer, the reviewer's model or the Foreman agent replaces the whole Settings view, so it looks as if the page reloaded. That's confusing when you're only picking one value.

## Outcome
Changing a setting updates what that change affects and leaves the rest of the open Settings view where it was.

## Acceptance criteria
1. Changing any setting's list, text box, number box or tick in the open Settings view leaves the view's scroll position where it was, and the control you changed keeps the keyboard focus. A setting the change doesn't affect stays as it was, in the same place.
2. What that change must show still updates: Save, a line under the builder, where a this-machine change goes, and the model list from 0369 when the builder, reviewer or Foreman agent changes.
3. Saving, a refusal, and the question when you close with unsaved changes still work as they do today.
4. No test that passed before this change fails, except a check that the whole Settings view is drawn again when a setting changes, which is changed to check criterion 1.

## Out of scope
- Which models a list offers: 0369.
- Where an explanation sits: 0371.
- Opening Settings as a pop-up: 0368.

## Notes
- Checked 2026-10-22: `typing` in `templates/panel.html` calls `renderSettings`, which replaces the whole pane, for `reviewer`, `builder`, `foreman` and a listed `reviewer_model`. Other controls call `refreshSettings`, which only updates Save and the this-machine question.
- 0371 waits for this: it changes `templates/panel.html` too.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
