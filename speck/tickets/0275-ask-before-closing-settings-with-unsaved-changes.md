---
id: "0275"
title: "Ask before closing Settings with unsaved changes"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0274"]               # ticket ids that must be done first
created: 2026-10-17

---
# 0275 · Ask before closing Settings with unsaved changes

**Status:** 📋 ready

## Problem
Closing the Settings view throws away any change you haven't saved, without a word, so a change you meant to keep can be lost with one press of Close or Escape.

## Outcome
Closing the Settings view with unsaved changes asks what to do with them first.

## Acceptance criteria
1. With any setting changed and not saved, pressing Close, pressing Escape, or clicking outside the view opens a dialog saying there are unsaved changes, with three choices: Save, Discard and Keep editing.
2. Save saves the changes as the view's Save button does (0274), then closes the view once they're saved. If the save is refused or needs 0259's confirmation, the view stays open and shows that, as its Save button would.
3. Discard closes the view without saving, and the next time it opens it shows the saved values.
4. Keep editing, or Escape while the dialog is open, closes the dialog and leaves the view open with the changes in place.
5. With nothing changed, Close, Escape and clicking outside close the view at once, as today. When the view closes, focus returns to the Settings button, as today.

## Out of scope
- Keeping unsaved changes after the page is reloaded.

## Notes
- Escape already hides an open setting explanation first (0268). With an explanation open, Escape still does only that.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
