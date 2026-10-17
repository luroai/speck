---
id: "0277"
title: "Line up the Settings view's info buttons"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T18:28:45.257Z"

---
# 0277 · Line up the Settings view's info buttons

**Status:** 🔨 building

## Problem
In the Settings view, each setting's info button sits straight after its name, so the buttons start at a different place on every row. When a long name wraps, as `allow_same_model_review` and `max_parallel_builds` do on a phone, its button is pushed up against the setting's value with no gap. The buttons are also taller than the controls beside them, so the rows look uneven.

## Outcome
The Settings view's info buttons line up, sit clear of the values, and match the size of the controls, at every width.

## Acceptance criteria
1. In every group, each setting's info button starts at the same distance from the group's left edge as the other info buttons in that group, whatever the length of the setting's name, and on a wrapped name too.
2. There's at least 8 px between each info button and the setting's value or control, at every width down to the panel's narrowest.
3. Each info button is no taller than the controls in its group, and keeps a target of at least 24 by 24 px.
4. A setting's name wraps only after an underscore or a dot, never in the middle of a word.
5. Every setting's value or control still starts at the same distance from the group's left edge as the others in its group, as 0273 made them.

## Out of scope
- What the info button shows, and how it opens: 0268.

## Notes
- The view is in `templates/panel.html` (search for "0257" and "0273"). Seen at 400 px wide, and on an iPhone on 2026-10-17.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
