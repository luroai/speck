---
id: "0133"
title: "Ship an approved ticket from its review pack in the panel"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0132"]              # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-12T19:26:03.382Z"

---
# 0133 · Ship an approved ticket from its review pack in the panel

**Status:** 🔨 building

## Problem
With `auto_ship` off, an approved ticket waits until the user runs `/speck-ship <id>` in their agent. A user reading the review pack in the panel has to leave it to ship.

## Outcome
The review pack of an approved ticket, opened in the panel, has a Ship button that ships the ticket as `/speck-ship` does.

## Acceptance criteria
1. The review pack of an `approved` ticket, opened in the panel, has a Ship button. A ticket in any other status has no Ship button, and the panel has no Ship button anywhere outside a review pack.
2. Clicking Ship asks the user to confirm. On confirming, it runs `speck ship <id>` for that ticket, and the panel shows that the ticket is shipping until it finishes. Cancelling changes nothing.
3. When the ship succeeds, the ticket shows in the Shipped table as done, as a ticket shipped with `/speck-ship` does.
4. When `speck ship` refuses (for example, failing tests, a merge conflict or uncommitted changes), the panel shows its message, and the ticket stays `approved`.
5. A request to ship without the panel's token, or from another origin, is refused with 403 and changes nothing, as the panel's other writes are.

## Out of scope
- Resolving a merge conflict from the panel. On a conflict, `speck ship` leaves everything as it was and the user follows its message.
- Shipping several tickets at once.
- Undoing a ship.

## Notes
- Decided 2026-10-11 by the user: clicking Ship in the panel is the user shipping (Gate 2), like running `/speck-ship`. Update `docs/brief.md` (principle 4 and the command table), `AGENTS.md`, the README and the speck-ship skill wording so they say shipping happens through `/speck-ship` or the panel's Ship button, and agents still never ship on their own.
- Risk is high: a click in the browser merges into the base branch and pushes. It must use the same token and Origin checks as the panel's other writes.
- `speck ship` already runs the tests, merges, pushes and tidies up, and refuses with a message (exit 13 on a conflict, 14 when the base branch's own tests fail), changing nothing (`scripts/ship.mjs`).
- From the idea `speck/ideas/2026-10-10-more-human-gate-actions-in-the-panel.md` ("Ship from the review pack").

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
