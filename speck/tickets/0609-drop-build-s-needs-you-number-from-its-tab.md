---
id: "0609"
title: "Drop Build's needs-you number from its tab"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-09-drop-build-s-needs-you-number-from-its-tab.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0607"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T10:01:51.169Z"

---
# 0609 · Drop Build's needs-you number from its tab

**Status:** 🔨 building

## Problem
The Build tab can read "Build 11 3": the lane's count and, beside it, a red needs-you number, two numbers side by side with only one labelled by its colour. The black bar already says how many need you whichever lane is open, so the second number repeats it and costs width at 320 px.

## Outcome
The Build tab shows only the lane's count, like the other tabs.

## Acceptance criteria
1. The Build tab shows its name and the lane's count only, with no separate needs-you number, whatever needs you.
2. The black bar still says how many need you.
3. A screen reader reads the Build tab as it reads the others: its name and its count.
4. Tests that checked the old behaviour are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- The bar's own needs-you line.

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- From 0582's build, which kept the number as its criteria didn't ask to remove it. Today: `drawTabs` in `templates/panel-header.js`, styled in `templates/panel-header.css`. Waits for 0607, which changes the same stylesheet.
- Relies on nothing outside this repo.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
