---
id: "0146"
title: "Move a queued ticket back to Plan"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-13

---
# 0146 · Move a queued ticket back to Plan

**Status:** 📋 ready

## Problem
Once a ticket is set ready it waits in the Build queue, and the panel has no way to take it back. To change their mind, the user has to run `speck set <id> status draft` and commit it by hand, or Auto-build may build a ticket they no longer want next.

## Outcome
A ticket waiting in the Build queue has a Back to Plan button that returns it to draft, so it shows in Plan again and isn't built.

## Acceptance criteria
1. An opened ready ticket in the Build queue has a "Back to Plan" button. Building, reviewing, blocked and approved tickets don't.
2. Clicking it sets the ticket's status to `draft` and commits only that ticket's file to the base branch, as Set ready does in reverse. On the next refresh the ticket shows in Plan's drafts and not in the queue, and `speck run` doesn't start it.
3. If the ticket isn't `ready` when the request arrives (for example `speck run` has just started building it), or the checkout isn't on the base branch, nothing changes and the row shows why, in plain words.
4. A request without the panel's token, or from another origin, is refused with 403 and changes nothing, as the panel's other writes are.
5. No test that passed before this change fails.

## Out of scope
- Moving an in-flight ticket (building, reviewing, blocked or approved) back to Plan.
- Reordering the queue.

## Notes
- Set ready is handled in `scripts/panel.mjs` (`POST /api/tickets/<id>/ready`), which commits the ticket file alone with `commitTicketOnly`. This is the same in reverse.
- A ticket that waits on others (`after:`) is still `ready`, so it gets the button too.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
