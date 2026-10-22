---
id: "0371"
title: "Float a setting's explanation over its row"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: cursor
reviewer_model: grok-4.7-high       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-calm-the-settings-view-down.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0370"]                # ticket ids that must be done first
created: 2026-10-22

---
# 0371 · Float a setting's explanation over its row

**Status:** 📋 ready

## Problem
The "i" beside a setting shows its explanation under the row as soon as the pointer is over it, which pushes every setting below it down.

## Outcome
The explanation floats over the top of its setting, after the pointer has rested on the "i" or the "i" is clicked, and the rows don't move.

## Acceptance criteria
1. Showing a setting's explanation doesn't move any setting. It floats above that setting's row, over whatever is behind it, and stays inside the Settings view.
2. The explanation appears once the pointer has stayed on the info button for half a second, and not before. Moving the pointer off before that shows nothing. Moving it off afterwards hides the explanation, unless a click is keeping it open.
3. Clicking the info button shows the explanation at once and keeps it until that button is clicked again or another setting's explanation is opened. Keyboard focus on the info button still shows it at once, as 0268 does. Escape hides an open explanation and leaves Settings open.
4. A screen reader still reads the explanation with the info button. The explanation stays inside the Settings view at the panel's narrowest width.
5. No test that passed before this change fails, except checks that the explanation sits under the setting or appears the moment the pointer enters, which are changed to check criteria 1 and 2.

## Out of scope
- The wording of the explanations.
- Tag tooltips elsewhere on the panel (0165).
- Opening Settings as a pop-up, the model lists, and keeping the view still: 0368, 0369 and 0370.

## Notes
- Checked 2026-10-22: `#settings .setting p.explain` sits in the flow under the row (`templates/panel.html`), and `settingInfo` shows it on pointer entry with no pause (0268).
- Half a second is the pause asked for as "a while". Keyboard focus still shows the explanation at once, so 0268's keyboard behaviour stays.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
