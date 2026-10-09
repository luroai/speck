---
id: "0041"
title: "Mark tickets that start a dependency chain"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0040"]                # ticket ids that must be done first
created: 2026-10-09

---
# 0041 · Mark tickets that start a dependency chain

**Status:** 📋 ready

## Problem
Tickets can wait on each other through `after:`, but the panel doesn't show where a chain begins. So when choosing what to set ready or kick off first, you have to read every ticket's `after:` line to find the ones that unblock others.

## Outcome
In the panel you can see at a glance which tickets start a chain, what each one unlocks and which tickets are still waiting.

## Acceptance criteria
1. A ticket starts a chain when its `waiting_on` is empty and at least one other ticket that isn't `done` or `cancelled` lists its id in `after:`. In Shaping's Tickets list and in the queue's `ready` tickets, such a ticket shows a chain icon in the accent colour next to its id, and "unlocks <ids>" (those tickets' ids, in the JSON's order) in the line under its title.
2. In the same two places, a ticket whose `waiting_on` isn't empty shows a dimmed padlock icon next to its id. In Shaping it also shows "waiting on <ids>" in the line under its title. The queue keeps the "waiting on <ids>" text it already shows.
3. A ticket with neither shows no icon. Each icon has hover text that says what it means, for example "Starts a chain: unlocks 0040" or "Waiting on 0039".
4. When the ticket starting a chain becomes `done`, on the next refresh a ticket that was waiting only on it loses its padlock, and gains the chain icon if other unfinished tickets wait on it in turn.
5. Hovering a ticket in either place highlights it and every ticket linked to it through `after:` in either direction, following links through other tickets too, and dims the rest. Moving the pointer away undoes this.

## Out of scope
- A tree layout or lines drawn between rows.
- Reordering tickets by chain.
- Tickets being built or reviewed, and Shipped.

## Notes
- `after:` and `waiting_on` are already in `speck status --json`, so this is a change to `templates/panel.html` only.
- Builds after 0040, which changes the same item code.
- No external facts: everything is in this repo.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
