---
id: "0612"
title: "Give the panel's last small buttons the redesign's size"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-10-give-the-panel-s-last-small-buttons-the-redesign-s-size.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0611"]                # ticket ids that must be done first
created: 2026-11-10

---
# 0612 · Give the panel's last small buttons the redesign's size

**Status:** 📝 draft

## Problem
A few buttons are still small boxes with 8 px corners and 12 px text: a setting's own Save, the Save in Settings' unsaved-changes question, the review pack's file and folder buttons, and the pack's Ask for changes. Since 0603, Discard and Keep editing are 44 px secondary buttons beside a small Save in the same question, which looks unfinished.

## Outcome
Every button in the panel has the redesign's size and style.

## Acceptance criteria
1. The Save in Settings' unsaved-changes question is a primary button (the accent colour) of the redesign's size, beside Discard and Keep editing.
2. A setting's own Save, the review pack's file and folder buttons, and the pack's Ask for changes are secondary buttons of the redesign's size: at least 44 px tall, 10 px corners, the panel's font at the size the other buttons use.
3. No button in the panel is left with 8 px corners or 12 px text.
4. Tests that checked the old behaviour are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- What any button does.

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- Decided: Save in the unsaved-changes question is primary, as the Settings view's own Save is; the rest are secondary.
- Today: `templates/panel-settings.js` (`saveBar`, the unsaved-changes question), `templates/panel-popups.js` (`documentsPart`, `changesPart`) and their stylesheets. Waits for 0611, which changes `panel-popups.js`.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
