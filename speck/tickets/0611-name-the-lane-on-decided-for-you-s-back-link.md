---
id: "0611"
title: "Name the lane on Decided for you's back link"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-10-name-the-lane-on-decided-for-you-s-back-link.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T09:57:09.392Z"

---
# 0611 · Name the lane on Decided for you's back link

**Status:** 🔨 building

## Problem
Decided for you's back link reads "‹ Close", while the Pipeline log's and a ticket's full view's name the lane they go back to, such as "‹ Build". Since 0600 the three share one style, so "Close" is the odd one out and says less about where it goes.

## Outcome
Decided for you's back link names the lane it goes back to.

## Acceptance criteria
1. Decided for you's back link reads "‹" and the name of the lane that was open when it was opened, such as "‹ Build", as the other full views' do.
2. A screen reader reads it as "Back to" and the lane's name.
3. Pressing it, or Escape, closes Decided for you and shows that lane, as today.
4. Tests that checked the old behaviour are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Decided for you's content.

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- From 0600's build: the button kept "Close" because 0568's tests press a button named Close, which this ticket may change. Today: `renderDecided` in `templates/panel-popups.js`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: the list is drawn again when the open lane changes, so its back link can't keep a stale lane's name.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
