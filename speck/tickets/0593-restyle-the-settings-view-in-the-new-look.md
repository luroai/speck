---
id: "0593"
title: "Restyle the Settings view in the new look"                # one outcome, no "and"
status: blocked            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0577","0575"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T18:38:04.469Z"
blocked_at: "2026-11-09T18:38:59.715Z"

---
# 0593 · Restyle the Settings view in the new look

**Status:** ⛔ blocked

## Problem
The Settings view still uses the LCD-era boxes and borders. It should match the rest of the redesign, and its engineering manager group should show who it's about.

## Outcome
The Settings view is in the redesign's look, with speck's face beside its name.

## Acceptance criteria
1. Settings groups are plain sections with a heading and a divider, without card borders, and each setting is a row with its label, its control and its explanation in muted text; info buttons stay.
2. The Save bar at the bottom uses the redesign's look, with Save in the accent colour.
3. The Your engineering manager group (0575) shows speck's face, watching, beside its name setting.
4. The view works at 320 px wide and in both looks.
5. Tests that checked the old look of what this changes are updated to the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Which settings there are, or what they do.

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today: `templates/panel-settings.js` (`renderSettings`, `settingRow`, `saveBar`) and `templates/panel-settings.css`. Waits for 0575, which renames the group.
- Relies on nothing outside this repo.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
Criterion 3 needs speck's face, watching, but the new face comes from 0578, which isn't finished, and this ticket doesn't wait for it (0579 and 0594, which also use the face, do). Should 0593: (1) wait for 0578 and then build as written, which I recommend, because it's the only option that shows the real face with no throwaway work, and it only delays this ticket; (2) build now with a temporary copy of the face drawn just for Settings, to be swapped later; or (3) ship the restyle now without the face, and move criterion 3 to its own ticket after 0578?

Recommended: Wait for 0578, then build as written
Changes what you'd notice: yes
Clear winner: yes

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
