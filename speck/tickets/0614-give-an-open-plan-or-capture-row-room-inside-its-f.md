---
id: "0614"
title: "Give an open Plan or Capture row room inside its fill"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-10-give-an-open-plan-or-capture-row-room-inside-its-fill.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0608"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T11:07:06.723Z"

---
# 0614 · Give an open Plan or Capture row room inside its fill

**Status:** 🔨 building

## Problem
An open Plan or Capture row has a raised background, and since 0600 its text runs right to that fill's edges, as the row has no side padding of its own. The text pressed against the edge, and the ring a linked id draws, look cramped on a phone.

## Outcome
An open Plan or Capture row has room between its text and the edges of its fill.

## Acceptance criteria
1. An open Plan or Capture row's text sits at least 12 px inside its raised fill on each side, in both looks.
2. The title doesn't move sideways when the row opens or closes.
3. Every row still spans its list, as 0418 checks.
4. Tests that checked the old behaviour are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Closed rows.

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- From 0600's build: letting the fill reach past the 16 px margins broke 0418's check, so the room has to come from inside them, or from padding the text in. Today: `.item.row.open` in `templates/panel-cards.css`. Waits for 0608, which changes the same stylesheet.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
