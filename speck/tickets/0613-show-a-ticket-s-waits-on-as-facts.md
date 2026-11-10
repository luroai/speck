---
id: "0613"
title: "Show a ticket's Waits on as facts"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-10-show-the-full-view-s-waits-on-as-facts-too.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0612"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T11:10:35.473Z"

---
# 0613 · Show a ticket's Waits on as facts

**Status:** 🔨 building

## Problem
A ticket waiting on two or more others still shows, in its full view and open Plan card, the LCD-era Waits on box: a border, a coloured bar and a grid of boxed chips. Since 0603 a chain is shown as plain facts beside it, so the two kinds of dependency look different for no reason.

## Outcome
A ticket's Waits on is shown as plain facts, as its chain is.

## Acceptance criteria
1. In a ticket's full view, the tickets it waits on are shown in the facts' style: each one's id and title with its state, as links to it, without a bordered box, coloured bar or boxed chips.
2. An open Plan card shows them the same way.
3. Pressing one opens that ticket, as today.
4. Tests that checked the old behaviour are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Which tickets a ticket waits on.

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- Decided: the open Plan card changes too, so there's one look for dependencies.
- Today: `depsBox`, `withDeps`, `depChip` in `templates/panel.js` and their styles in `templates/panel-cards.css`. Waits for 0612.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
