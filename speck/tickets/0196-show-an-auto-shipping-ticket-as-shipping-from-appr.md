---
id: "0196"
title: "Show an auto-shipping ticket as shipping from approval until it ships"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T12:18:36.741Z"

---
# 0196 · Show an auto-shipping ticket as shipping from approval until it ships

**Status:** 🔨 building

## Problem
Since 0194 a build ends at approved, and `speck run`'s ship queue ships the ticket a few seconds later. In between, the panel says "Approved · waiting for you to ship it" and the builder badge stands still, although nothing is waiting for the user. Then, while the ship tests the ticket merged with the base branch, the panel shows the ticket as Queued until the ship ends. Seen on 0178 on 2026-10-15.

## Outcome
An approved ticket that `auto_ship` covers shows as on its way out from its approval until it has shipped, never as waiting for the user or queued.

## Acceptance criteria
1. An approved ticket that `auto_ship` covers, whose build has ended and whose ship hasn't started yet, shows "Approved · waiting to ship" in the normal text colour, not the purple of a ticket waiting for the user, and its builder badge moves as it does while shipping.
2. While a ship of a ticket is running, including while its tests run on the ticket merged with the base branch, `speck status --json` gives the ticket's status as `approved`, and the panel shows it as shipping. It never shows as Queued or `ready` in that time.
3. `speck run` never launches a build of a ticket while a ship of that ticket is running, including a `speck run` started during the ship.
4. An approved ticket that `auto_ship` doesn't cover, or whose last auto-ship didn't finish, shows as it does today.
5. No test that passed before this change fails.

## Out of scope
- The badge's shipping animation itself (0172).
- How the ship queue chooses or retries tickets (0193, 0194).

## Notes
- Asked for 2026-10-15.
- Cause of AC2: to test the merged result (0192), `speck ship` checks out the merged commit detached in the ticket's own worktree (`scripts/ship.mjs`, around line 108). `ticketsElsewhere()` in `scripts/core.mjs` finds a ticket's worktree by its branch, so it misses it, and the board falls back to the base branch's copy of the ticket, which says `ready`.
- Cause of AC1: `doing()` and `to_ship` in `templates/panel.html` were written when a build shipped its own ticket, so an approved ticket whose build had ended was waiting for the user.
- The ship record (`takeShip` in `scripts/ship.mjs`) says whether a ticket's ship is running.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
