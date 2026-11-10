---
id: "0615"
title: "Show a cut-off details line whole in its tooltip"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-10-show-a-cut-off-details-line-whole-in-its-tooltip.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0614"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T11:35:40.534Z"

---
# 0615 · Show a cut-off details line whole in its tooltip

**Status:** 🔨 building

## Problem
Since 0599 a closed row's details line stays on one line, cut off with an ellipsis when it doesn't fit. A Shipped row's details have a tooltip, but a Build or Plan row's don't, so the end of a long line, such as "Ready · after 0599, 0600, …", can only be read by opening the ticket.

## Outcome
A cut-off details line shows its whole text in its tooltip, in every lane.

## Acceptance criteria
1. In every lane, a closed row's details line has its whole text as its tooltip, as a Shipped row's has.
2. A screen reader reads the whole details line.
3. Rows look as they do today.
4. Tests that checked the old behaviour are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- The title's tooltip, which 0599 added.

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- From 0599's build: a Build row's line has a tooltip only when its sentence differs from what it says. Today: `queuedLine`, `titleLine` in `templates/panel.js`. Waits for 0614.
- Relies on nothing outside this repo.
- Failing before this build: none
- A Build row's tooltip is its whole line, then, on a line of its own, its sentence when that says more than the line (as before 0615, when the sentence was the whole tooltip). A tag in a details line keeps only its own tip, so hovering it doesn't show the line's tooltip as well.
- Self-check: a Build row's tooltip now follows its minutes as the clock moves them (test added); tags in the line no longer show the line's tooltip on top of their own tip.
- Pictures: none, because nothing on the page looks different; the change is only hover tooltips, which a screenshot doesn't show.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
