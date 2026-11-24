---
id: "0701"
title: "Give a hovered closed row room inside its fill"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "quick"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-10-give-a-hovered-closed-row-room-inside-its-fill.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24

---
# 0701 · Give a hovered closed row room inside its fill

**Status:** 📝 draft

## Problem
On a computer with a mouse, a closed Plan or Capture row under the pointer gets the raised fill, but its text runs right to the fill's edges. Since 0614 an open row's fill reaches past its text, so a hovered closed row looks cramped beside it.

## Outcome
A hovered closed row's fill reaches 12 px past its text on each side, as an open row's does.

## Acceptance criteria
1. On a device with hover, a closed Plan or Capture row under the pointer shows its raised fill reaching 12 px beyond the left and right edges of its text, as an open row's does.
2. Hovering a closed row doesn't move its title or any of its text: their positions are the same with and without the pointer over it.
3. On a touch screen (no hover), closed rows look as they do today.
4. No test that passed before this change fails.

## Out of scope
- Open rows, which 0614 already changed.
- How linked tickets are lit: 0728 replaces the ring with this fill.

## Notes
- The fill comes from `.item:hover` in `templates/panel-cards.css`. 0614 gave `.item.row.open` a pair of side shadows, and an `::after` ring because `.item.hl`'s box-shadow replaces any side shadows.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
