---
id: "0395"
title: "Close a setting's explanation on a click outside it"                # one outcome, no "and"
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
after: []                # ticket ids that must be done first
created: 2026-10-23

---
# 0395 · Close a setting's explanation on a click outside it

**Status:** 📋 ready

## Problem
An open explanation in Settings stays until you press its info button again or press Escape. On a phone there's no Escape, so a tap elsewhere leaves it covering the rows under it.

## Outcome
An open explanation closes when you click or tap anywhere outside it.

## Acceptance criteria
1. With a setting's explanation open, a click or tap anywhere outside the explanation and its info button closes it. That includes elsewhere in Settings, another setting's control and the space beside the column.
2. A click or tap on another control also works on that control, as it would with no explanation open. A click beside the column while an explanation is open closes only the explanation, not Settings.
3. A click or tap inside the explanation, such as one that selects its text, leaves it open. Its info button still opens and closes it, and Escape still closes it without closing Settings (0275).
4. An explanation opened by resting the pointer still closes when the pointer leaves, as 0371 made it.
5. No test that passed before this change fails.

## Out of scope
- What the explanations say: 0397.

## Notes
- Checked 2026-10-23: `settingInfo`, `showSettingTip` and `settingTip` in `templates/panel.html` (0268, 0371) open an explanation on a click, on focus or after the pointer rests on the info button for half a second. A second click, Escape or the pointer leaving closes it. `besideColumn` closes Settings on a click beside the column (0368).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
