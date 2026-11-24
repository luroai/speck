---
id: "0703"
title: "Show a Plan card's chain as facts"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
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
source: "speck/ideas/done/2026-11-10-show-a-plan-card-s-chain-as-facts.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24

---
# 0703 · Show a Plan card's chain as facts

**Status:** 📝 draft

## Problem
An open Plan card still shows a ticket's chain in the old Chain box, a bordered box of circles over ids, while the full view shows it as facts since 0603. Since 0613 a Plan card shows Waits on as plain facts, so cards with a chain still look different.

## Outcome
An open Plan card shows its chain as the facts Waits for and Waiting on it, as the full view does.

## Acceptance criteria
1. An open Plan card for a ticket with a chain (tickets it waits for, or tickets waiting on it) shows them as the facts "Waits for" and "Waiting on it", as the ticket's full view does, and no Chain box with circles.
2. Pressing a ticket id in those facts on a Plan card goes to that ticket on the page, as the Chain box's ids do today, rather than opening its full view.
3. After the panel redraws the card (a state refresh), the card has exactly one set of chain facts.
4. An open Plan card for a ticket with no chain shows no chain facts and no Chain box.
5. No test that passed before this change fails.

## Out of scope
- The full view's chain facts, which stay as they are.

## Notes
- `depsBox` in `templates/panel.js` calls `chainFacts` only for the full view (`inPane`); the card gets `div.deps.deps-chain`. `chainFacts` links with `depNode(…, true)`, which opens the full view. `isDeps` matches `deps` and `waits-facts` only, so a card redraw would add a second box unless it learns the new one.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
