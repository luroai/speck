---
id: "0536"
title: "Show how many notes Capture holds"                # one outcome, no "and"
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-27T23:32:44.719Z"

---
# 0536 · Show how many notes Capture holds

**Status:** 🔨 building

## Problem
Capture lists every idea and inbox note, but nothing says how many there are, so you have to scroll the whole lane to know how big the backlog is. Build and Shipped already show a count under their titles.

## Outcome
Capture shows how many notes it lists, under its title, as Build and Shipped do.

## Acceptance criteria
1. With notes in Capture, a line under the lane's title says how many it lists: "1 note" for one and "<n> notes" for more, such as "35 notes". It counts the notes Capture shows (status `idea` or `inbox`), not ticketed or dropped ones.
2. With no notes in Capture, the count line is hidden and the lane says "Nothing captured." as today.
3. When a note is added to Capture, or leaves it (ticketed or dropped), the count changes with the next board update, without reloading the page.
4. The count line looks like Build's and Shipped's count lines, in the same place under the title and in the same style, in the light and dark looks (checked by review).
5. No test that passed before this change fails.

## Out of scope
- Counts on the lane strip's tabs.
- Splitting the count into ideas and inbox notes.
- The order of the list (0537) and starring notes (a later ticket).

## Notes
- Asked for by the user 2026-10-27: "there is no kind of indication of how many tickets there are in the list".
- Today: Build's count is `#queue-n` and Shipped's `#shipped-n`, both `.lane-n` in `templates/panel.html`, filled in `render()` / `renderFull()` in `templates/panel.js`. Capture's list is `m.capture` from `templates/panel-model.js`.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
